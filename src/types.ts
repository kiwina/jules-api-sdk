// Types and interfaces for Jules API — exported from Zod schemas

export type {
  Source,
  ListSourcesResponse,
  ListSourcesParams,
} from './schemas/sources';

export type {
  CreateSessionRequest,
  Session,
  SessionState,
  AutomationMode,
  ListSessionsResponse,
} from './schemas/sessions';

export type {
  Activity,
  ListActivitiesResponse,
  Artifact,
} from './schemas/activities';

export type {
  GoogleApiError,
  ErrorDetail,
} from './schemas/errors';

export type {
  RetryConfig,
  LoggerInterface,
} from './http';

import type { RetryConfig, LoggerInterface } from './http';

export interface JulesClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryConfig?: RetryConfig;
  logger?: LoggerInterface;
}
