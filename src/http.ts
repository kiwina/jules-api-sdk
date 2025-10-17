import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { ZodSchema } from 'zod';

export interface RetryConfig {
  maxRetries?: number; // Default: 3
  initialDelayMs?: number; // Default: 1000
  maxDelayMs?: number; // Default: 10000
  retryableStatuses?: number[]; // Default: [408, 429, 500, 502, 503, 504]
}

export interface LoggerInterface {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

export interface HttpOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number; // Default: 30000 (30 seconds)
  retryConfig?: RetryConfig;
  logger?: LoggerInterface;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 0, // Disabled by default - opt-in for production use
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: any, retryableStatuses: number[]): boolean {
  if (!error.response) {
    // Network errors (no response received)
    return true;
  }
  const status = error.response.status;
  return retryableStatuses.includes(status);
}

function getRetryAfterMs(error: AxiosError): number | null {
  const retryAfter = error.response?.headers['retry-after'];
  if (!retryAfter) return null;
  
  // Retry-After can be seconds (number) or HTTP date
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }
  
  // Try parsing as HTTP date
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }
  
  return null;
}

export function createHttpClient(options: HttpOptions): AxiosInstance {
  const { 
    apiKey, 
    baseUrl = 'https://jules.googleapis.com/v1alpha',
    timeout = 30000,
    retryConfig,
    logger
  } = options;
  
  const retrySettings = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  
  const instance = axios.create({
    baseURL: baseUrl,
    timeout,
    headers: {
      'X-Goog-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  // Add retry interceptor
  instance.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const config = error.config as any;
      
      // Initialize retry count
      if (!config._retryCount) {
        config._retryCount = 0;
      }

      const shouldRetry = 
        config._retryCount < retrySettings.maxRetries &&
        isRetryableError(error, retrySettings.retryableStatuses);

      if (!shouldRetry) {
        logger?.error('Request failed after retries', {
          url: config.url,
          method: config.method,
          retries: config._retryCount,
          error: error.message,
        });
        return Promise.reject(error);
      }

      config._retryCount += 1;

      // Check for Retry-After header (rate limiting)
      const retryAfterMs = getRetryAfterMs(error);
      let delayMs: number;

      if (retryAfterMs !== null) {
        delayMs = retryAfterMs;
        logger?.warn('Rate limited, respecting Retry-After header', {
          url: config.url,
          delayMs,
          attempt: config._retryCount,
        });
      } else {
        // Exponential backoff: initialDelay * 2^(attempt - 1)
        delayMs = Math.min(
          retrySettings.initialDelayMs * Math.pow(2, config._retryCount - 1),
          retrySettings.maxDelayMs
        );
        logger?.info('Retrying request', {
          url: config.url,
          method: config.method,
          attempt: config._retryCount,
          maxRetries: retrySettings.maxRetries,
          delayMs,
          error: error.message,
        });
      }

      await sleep(delayMs);

      return instance.request(config);
    }
  );

  return instance;
}

export async function requestWithValidation<T>(
  http: AxiosInstance,
  config: AxiosRequestConfig,
  schema?: ZodSchema<T>,
  logger?: LoggerInterface
): Promise<T> {
  logger?.debug('Making API request', {
    method: config.method,
    url: config.url,
    params: config.params,
  });

  const startTime = Date.now();
  const res = await http.request(config);
  const duration = Date.now() - startTime;

  logger?.debug('API response received', {
    method: config.method,
    url: config.url,
    status: res.status,
    durationMs: duration,
  });

  const data = res.data as unknown;
  if (schema) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const err = new Error('Response validation failed: ' + parsed.error.message);
      // Attach raw data for debugging
      (err as any).responseData = data;
      (err as any).zodError = parsed.error;
      logger?.error('Response validation failed', {
        url: config.url,
        error: parsed.error.message,
      });
      throw err;
    }
    return parsed.data as T;
  }
  return data as T;
}
