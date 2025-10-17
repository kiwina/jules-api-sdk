/**
 * Error Handling and Retry Example
 * 
 * This example demonstrates:
 * 1. Retry logic with exponential backoff
 * 2. Rate limiting handling (429 responses)
 * 3. Timeout configuration
 * 4. Comprehensive logging
 * 5. Error recovery patterns
 */

import { JulesClient, LoggerInterface } from '../src';

// Example logger implementation
class ConsoleLogger implements LoggerInterface {
  debug(message: string, meta?: any): void {
    console.log(`[DEBUG] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  }

  info(message: string, meta?: any): void {
    console.log(`ℹ️  [INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  }

  warn(message: string, meta?: any): void {
    console.warn(`⚠️  [WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  }

  error(message: string, meta?: any): void {
    console.error(`❌ [ERROR] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  }
}

async function main() {
  const apiKey = process.env.JULES_API_KEY;
  if (!apiKey) {
    console.error('Please set JULES_API_KEY environment variable');
    process.exit(1);
  }

  // Example 1: Basic client with default retry (3 attempts)
  console.log('\n=== Example 1: Default Retry Configuration ===\n');
  const basicClient = new JulesClient({
    apiKey,
    // Default retry config:
    // - maxRetries: 3
    // - initialDelayMs: 1000
    // - maxDelayMs: 10000
    // - retryableStatuses: [408, 429, 500, 502, 503, 504]
  });

  try {
    const sources = await basicClient.listSources();
    console.log('✅ Sources retrieved:', sources.sources?.length || 0);
  } catch (error: any) {
    console.error('❌ Failed after retries:', error.message);
  }

  // Example 2: Custom retry configuration
  console.log('\n=== Example 2: Custom Retry Configuration ===\n');
  const customRetryClient = new JulesClient({
    apiKey,
    retryConfig: {
      maxRetries: 5,           // Retry up to 5 times
      initialDelayMs: 500,     // Start with 500ms delay
      maxDelayMs: 30000,       // Max 30 seconds between retries
      retryableStatuses: [408, 429, 500, 502, 503, 504], // Which status codes to retry
    },
  });

  try {
    const session = await customRetryClient.createSession({
      prompt: 'Create a TODO app',
      sourceContext: {
        source: 'sources/github/owner/repo',
        githubRepoContext: {
          startingBranch: 'main',
        },
      },
    });
    console.log('✅ Session created:', session.id);
  } catch (error: any) {
    console.error('❌ Failed after custom retries:', error.message);
  }

  // Example 3: With timeout configuration
  console.log('\n=== Example 3: Timeout Configuration ===\n');
  const timeoutClient = new JulesClient({
    apiKey,
    timeout: 15000, // 15 second timeout (default is 30 seconds)
  });

  try {
    const sessions = await timeoutClient.listSessions();
    console.log('✅ Sessions retrieved:', sessions.sessions?.length || 0);
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request timed out after 15 seconds');
    } else {
      console.error('❌ Request failed:', error.message);
    }
  }

  // Example 4: With comprehensive logging
  console.log('\n=== Example 4: With Logging Enabled ===\n');
  const loggedClient = new JulesClient({
    apiKey,
    logger: new ConsoleLogger(),
    retryConfig: {
      maxRetries: 2, // Lower retries for demo purposes
    },
  });

  try {
    const activities = await loggedClient.listActivities('sess123');
    console.log('✅ Activities retrieved');
  } catch (error: any) {
    console.log('Note: Logs above show the retry attempts and error details');
  }

  // Example 5: Rate limiting handling (429 responses)
  console.log('\n=== Example 5: Rate Limiting Handling ===\n');
  const rateLimitClient = new JulesClient({
    apiKey,
    logger: new ConsoleLogger(),
    // The SDK automatically detects 429 responses and respects Retry-After header
  });

  console.log('💡 If the API returns 429 (Too Many Requests):');
  console.log('   - The SDK will check the Retry-After header');
  console.log('   - It will wait the specified time before retrying');
  console.log('   - Falls back to exponential backoff if no header present');

  // Example 6: Error recovery patterns
  console.log('\n=== Example 6: Error Recovery Patterns ===\n');

  // Pattern 1: Retry with fallback
  async function getSessionWithFallback(sessionId: string) {
    try {
      return await basicClient.getSession(sessionId);
    } catch (error: any) {
      console.log('⚠️  Primary request failed, trying fallback...');
      
      // Fallback: Try listing all sessions and find it
      try {
        const sessions = await basicClient.listSessions();
        const session = sessions.sessions?.find(s => s.id === sessionId);
        if (session) {
          console.log('✅ Retrieved from list fallback');
          return session;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed');
      }
      
      throw error;
    }
  }

  // Pattern 2: Circuit breaker pattern (simplified)
  class CircuitBreaker {
    private failures = 0;
    private readonly threshold = 5;
    private readonly resetTime = 60000; // 1 minute
    private openedAt?: number;

    async execute<T>(fn: () => Promise<T>): Promise<T> {
      // Check if circuit is open
      if (this.openedAt) {
        const elapsed = Date.now() - this.openedAt;
        if (elapsed < this.resetTime) {
          throw new Error('Circuit breaker is open - too many failures');
        }
        // Reset after timeout
        this.failures = 0;
        this.openedAt = undefined;
      }

      try {
        const result = await fn();
        this.failures = 0; // Reset on success
        return result;
      } catch (error) {
        this.failures++;
        if (this.failures >= this.threshold) {
          this.openedAt = Date.now();
          console.error(`🔴 Circuit breaker opened after ${this.failures} failures`);
        }
        throw error;
      }
    }
  }

  const breaker = new CircuitBreaker();
  
  async function robustGetSession(sessionId: string) {
    return breaker.execute(() => basicClient.getSession(sessionId));
  }

  console.log('💡 Circuit breaker prevents cascade failures');
  console.log('   - Opens after 5 consecutive failures');
  console.log('   - Resets after 1 minute cooldown');

  // Pattern 3: Graceful degradation
  async function getSessionInfo(sessionId: string) {
    try {
      const session = await basicClient.getSession(sessionId);
      return {
        available: true,
        session,
        activities: await basicClient.listActivities(sessionId).catch(() => ({ activities: [] })),
      };
    } catch (error) {
      // Return partial data even on failure
      return {
        available: false,
        session: null,
        activities: { activities: [] },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  console.log('💡 Graceful degradation provides partial data on failure');
  console.log('   - Main request fails: returns error state');
  console.log('   - Sub-request fails: returns partial data');

  // Example 7: Monitoring and alerting
  console.log('\n=== Example 7: Monitoring Integration ===\n');

  class MonitoringLogger implements LoggerInterface {
    private errorCount = 0;
    private requestCount = 0;

    debug(message: string, meta?: any): void {
      // Could send to monitoring service
    }

    info(message: string, meta?: any): void {
      if (message.includes('API request')) {
        this.requestCount++;
      }
    }

    warn(message: string, meta?: any): void {
      // Could send warning to monitoring
      console.warn(`⚠️  ${message}`);
    }

    error(message: string, meta?: any): void {
      this.errorCount++;
      console.error(`❌ ${message}`);
      
      // Alert if error rate is high
      const errorRate = this.errorCount / Math.max(this.requestCount, 1);
      if (errorRate > 0.1) {
        console.error('🚨 ALERT: Error rate above 10%!');
      }
    }

    getMetrics() {
      return {
        requests: this.requestCount,
        errors: this.errorCount,
        errorRate: this.errorCount / Math.max(this.requestCount, 1),
      };
    }
  }

  const monitoringLogger = new MonitoringLogger();
  const monitoredClient = new JulesClient({
    apiKey,
    logger: monitoringLogger,
  });

  console.log('💡 Monitoring logger tracks metrics:');
  console.log('   - Total requests');
  console.log('   - Error count and rate');
  console.log('   - Automatic alerting on high error rates');

  console.log('\n=== Summary: Best Practices ===\n');
  console.log('✅ Always configure retries for production');
  console.log('✅ Set appropriate timeouts for your use case');
  console.log('✅ Enable logging for debugging');
  console.log('✅ Implement circuit breakers for external dependencies');
  console.log('✅ Use graceful degradation for better UX');
  console.log('✅ Monitor error rates and set up alerts');
  console.log('✅ The SDK handles rate limiting (429) automatically');
  console.log('✅ Network errors and 5xx responses are auto-retried');
}

main().catch(console.error);
