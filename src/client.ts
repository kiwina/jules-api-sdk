import { createHttpClient, requestWithValidation, RetryConfig, LoggerInterface } from './http';
import { CreateSessionRequestSchema, SessionSchema, ListSessionsResponseSchema } from './schemas/sessions';
import { ListActivitiesResponseSchema, ActivitySchema } from './schemas/activities';
import { ListSourcesResponseSchema, SourceSchema } from './schemas/sources';
import type {
  Session,
  CreateSessionRequest,
  Activity,
  ListActivitiesResponse,
  Source,
  ListSourcesResponse,
  ListSessionsResponse,
} from './types';

export interface JulesClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryConfig?: RetryConfig;
  logger?: LoggerInterface;
}

export class JulesClient {
  private httpClient: ReturnType<typeof createHttpClient>;
  private apiKey: string;
  private logger?: LoggerInterface;

  constructor(options: JulesClientOptions) {
    this.apiKey = options.apiKey;
    this.logger = options.logger;
    this.httpClient = createHttpClient(options);
  }

  /**
   * List all available sources
   * @param pageSize - Maximum number of sources to return
   * @param pageToken - Token for pagination
   * @param filter - Optional AIP-160 filter expression (e.g., "name=sources/source1 OR name=sources/source2")
   * @returns Promise<ListSourcesResponse>
   */
  async listSources(pageSize?: number, pageToken?: string, filter?: string): Promise<ListSourcesResponse> {
    const params: any = {};
    if (pageSize) params.pageSize = pageSize;
    if (pageToken) params.pageToken = pageToken;
    if (filter) params.filter = filter;

    return requestWithValidation(
      this.httpClient,
      { method: 'GET', url: '/sources', params },
      ListSourcesResponseSchema,
      this.logger
    );
  }

  /**
   * Get a specific source
   * @param sourceId - The source ID
   * @returns Promise<Source>
   */
  async getSource(sourceId: string): Promise<Source> {
    return requestWithValidation(
      this.httpClient,
      { method: 'GET', url: `/sources/${sourceId}` },
      SourceSchema,
      this.logger
    );
  }

  /**
   * Create a new session
   * @param request - Session creation parameters
   * @returns Promise<Session>
   */
  async createSession(request: CreateSessionRequest): Promise<Session> {
    // Validate request payload before sending
    const validated = CreateSessionRequestSchema.parse(request);
    return requestWithValidation(
      this.httpClient,
      { method: 'POST', url: '/sessions', data: validated },
      SessionSchema,
      this.logger
    );
  }

  /**
   * List sessions
   * @param pageSize - Maximum number of sessions to return
   * @param pageToken - Token for pagination
   * @returns Promise<ListSessionsResponse>
   */
  async listSessions(pageSize?: number, pageToken?: string): Promise<ListSessionsResponse> {
    const params: any = {};
    if (pageSize) params.pageSize = pageSize;
    if (pageToken) params.pageToken = pageToken;

    return requestWithValidation(
      this.httpClient,
      { method: 'GET', url: '/sessions', params },
      ListSessionsResponseSchema,
      this.logger
    );
  }

  /**
   * Get a specific session
   * @param sessionId - The session ID
   * @returns Promise<Session>
   */
  async getSession(sessionId: string): Promise<Session> {
    return requestWithValidation(
      this.httpClient,
      { method: 'GET', url: `/sessions/${sessionId}` },
      SessionSchema,
      this.logger
    );
  }

  /**
   * Approve the latest plan for a session
   * @param sessionId - The session ID
   * @returns Promise<void>
   */
  async approvePlan(sessionId: string): Promise<void> {
    await this.httpClient.post(`/sessions/${sessionId}:approvePlan`);
  }

  /**
   * List activities for a session
   * @param sessionId - The session ID
   * @param pageSize - Maximum number of activities to return
   * @param pageToken - Token for pagination
   * @returns Promise<ListActivitiesResponse>
   */
  async listActivities(
    sessionId: string,
    pageSize?: number,
    pageToken?: string
  ): Promise<ListActivitiesResponse> {
    const params: any = {};
    if (pageSize) params.pageSize = pageSize;
    if (pageToken) params.pageToken = pageToken;

    return requestWithValidation(
      this.httpClient,
      { method: 'GET', url: `/sessions/${sessionId}/activities`, params },
      ListActivitiesResponseSchema,
      this.logger
    );
  }

  /**
   * Get a specific activity for a session
   * @param sessionId - The session ID
   * @param activityId - The activity ID
   * @returns Promise<Activity>
   */
  async getActivity(sessionId: string, activityId: string): Promise<Activity> {
    return requestWithValidation(
      this.httpClient,
      { method: 'GET', url: `/sessions/${sessionId}/activities/${activityId}` },
      ActivitySchema,
      this.logger
    );
  }

  /**
   * Send a message to the agent
   * @param sessionId - The session ID
   * @param prompt - The user prompt to send
   * @returns Promise<void>
   */
  async sendMessage(sessionId: string, prompt: string): Promise<void> {
    // Validate that prompt is a non-empty string
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('prompt must be a non-empty string');
    }
    await this.httpClient.post(`/sessions/${sessionId}:sendMessage`, { prompt });
  }
}

export default JulesClient;
