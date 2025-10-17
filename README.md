# @kiwina/jules-api-sdk

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Note:** This is an **unofficial** community SDK for the Jules AI API. It is not affiliated with, officially maintained by, or endorsed by Google.

A fully-typed, validated TypeScript SDK for the [Jules AI API](https://developers.google.com/jules/api). [Jules](https://jules.google.com) is a Google product that provides AI-powered coding assistance.

This SDK provides runtime validation using Zod and full type safety for all Jules API endpoints.

**SDK Version:** 1.0.0 (implementing Jules API v1alpha, last updated 2025-10-02 UTC)

## Installation

```bash
npm install @kiwina/jules-api-sdk
# or
bun add @kiwina/jules-api-sdk
```

## Quick Start

```typescript
import { JulesClient } from '@kiwina/jules-api-sdk';

const client = new JulesClient({
  apiKey: process.env.JULES_API_KEY || 'your-api-key'
});

// Create a session
const session = await client.createSession({
  prompt: 'Create a boba app!',
  sourceContext: {
    source: 'sources/github/owner/repo',
    githubRepoContext: { startingBranch: 'main' }
  },
  title: 'Boba App'
});

// List activities
const activities = await client.listActivities(session.id);

// Send a message
await client.sendMessage(session.id, 'Make it corgi themed!');
```

## API Methods

All methods include runtime validation and full TypeScript types:

- **Sources**: `listSources()`, `getSource(id)`
- **Sessions**: `createSession(request)`, `listSessions()`, `getSession(id)`, `approvePlan(id)`
- **Activities**: `listActivities(sessionId)`, `getActivity(sessionId, activityId)`
- **Messages**: `sendMessage(sessionId, prompt)`

## API Reference

### JulesClient

#### Constructor

```typescript
const client = new JulesClient(options: JulesClientOptions)
```

**Options:**
- `apiKey`: Your Jules API key (required)
- `baseUrl`: API base URL (optional, defaults to 'https://jules.googleapis.com/v1alpha')
- `timeout`: Request timeout in milliseconds (optional, default: 30000)
- `retryConfig`: Retry configuration (optional, **disabled by default** - enable for production)
  - `maxRetries`: Maximum retry attempts (default: 0, set to 3+ for production)
  - `initialDelayMs`: Initial retry delay (default: 1000)
  - `maxDelayMs`: Maximum retry delay (default: 10000)
  - `retryableStatuses`: HTTP status codes to retry (default: [408, 429, 500, 502, 503, 504])
- `logger`: Optional logger for debugging and monitoring

**Example with all options:**

```typescript
const client = new JulesClient({
  apiKey: process.env.JULES_API_KEY!,
  timeout: 60000, // 60 second timeout
  retryConfig: {
    maxRetries: 5,
    initialDelayMs: 500,
    maxDelayMs: 30000,
  },
  logger: {
    debug: (msg, meta) => console.log('[DEBUG]', msg, meta),
    info: (msg, meta) => console.log('[INFO]', msg, meta),
    warn: (msg, meta) => console.warn('[WARN]', msg, meta),
    error: (msg, meta) => console.error('[ERROR]', msg, meta),
  },
});
```

#### Methods

##### `listSources(nextPageToken?: string): Promise<ListSourcesResponse>`

List all available sources connected to your Jules account.

**Parameters:**
- `nextPageToken`: Token for pagination (optional)

**Returns:** Object containing array of sources and optional nextPageToken

##### `createSession(request: CreateSessionRequest): Promise<Session>`

Create a new session.

**Parameters:**
- `request`: Session creation parameters

**CreateSessionRequest:**
- `prompt`: Initial prompt for the session (required)
- `sourceContext`: Source context with<source name and github repo details (required)
- `title`: Session title (required)
- `requirePlanApproval`: Whether to require explicit plan approval (optional, defaults to false)

**Returns:** Created session object

##### `listSessions(pageSize?: number, nextPageToken?: string): Promise<ListSessionsResponse>`

List your sessions.

**Parameters:**
- `pageSize`: Maximum number of sessions to return (optional)
- `nextPageToken`: Token for pagination (optional)

**Returns:** Object containing array of sessions and optional nextPageToken

##### `approvePlan(sessionId: string): Promise<void>`

Approve the latest plan for a session (use when requirePlanApproval is true).

**Parameters:**
- `sessionId`: The session ID (required)

##### `listActivities(sessionId: string, pageSize?: number, nextPageToken?: string): Promise<ListActivitiesResponse>`

List activities for a session.

**Parameters:**
- `sessionId`: The session ID (required)
- `pageSize`: Maximum number of activities to return (optional)
- `nextPageToken`: Token for pagination (optional)

**Returns:** Object containing array of activities and optional nextPageToken

##### `sendMessage(sessionId: string, request: SendMessageRequest): Promise<void>`

Send a message to the agent in a session.

**Parameters:**
- `sessionId`: The session ID (required)
- `request`: Message parameters

**SendMessageRequest:**
- `prompt`: The message to send (required)

##### `getSession(sessionId: string): Promise<Session>`

Get details of a specific session.

**Parameters:**
- `sessionId`: The session ID (required)

**Returns:** Session object

##### `getSource(sourceId: string): Promise<Source>`

Get details of a specific source.

**Parameters:**
- `sourceId`: The source ID (required)

**Returns:** Source object

## Authentication

All API requests require authentication using your Jules API key. Get your API key from the Settings page in the [Jules web app](https://jules.google.com). The client automatically includes the key in the `X-Goog-Api-Key` header for all requests.

For more details, see the [official Jules API documentation](https://developers.google.com/jules/api).

**Important:** Keep your API keys secure. Never commit them to version control or expose them in client-side code.

## Error Handling & Resilience

The SDK provides production-grade error handling and resilience features:

### Automatic Retries

**Retries are disabled by default.** Enable them for production use with exponential backoff:

```typescript
const client = new JulesClient({
  apiKey: process.env.JULES_API_KEY!,
  retryConfig: {
    maxRetries: 5,           // Enable retries (default: 0 = disabled)
    initialDelayMs: 500,     // Start with 500ms delay (default: 1000)
    maxDelayMs: 30000,       // Max 30s between retries (default: 10000)
  },
});
```

**Retryable errors:**
- Network failures (connection errors, timeouts)
- HTTP 408 (Request Timeout)
- HTTP 429 (Too Many Requests) - respects `Retry-After` header
- HTTP 500 (Internal Server Error)
- HTTP 502 (Bad Gateway)
- HTTP 503 (Service Unavailable)
- HTTP 504 (Gateway Timeout)

### Rate Limiting

The SDK automatically handles rate limiting (HTTP 429):
- Detects `Retry-After` header and waits the specified time
- Falls back to exponential backoff if no header present
- Logs rate limit events when logger is enabled

### Request Timeouts

Configure timeouts to prevent hanging requests:

```typescript
const client = new JulesClient({
  apiKey: process.env.JULES_API_KEY!,
  timeout: 60000, // 60 second timeout (default: 30000)
});
```

### Comprehensive Logging

Enable logging for debugging and monitoring:

```typescript
const client = new JulesClient({
  apiKey: process.env.JULES_API_KEY!,
  logger: {
    debug: (msg, meta) => console.log('[DEBUG]', msg, meta),
    info: (msg, meta) => console.log('[INFO]', msg, meta),
    warn: (msg, meta) => console.warn('[WARN]', msg, meta),
    error: (msg, meta) => console.error('[ERROR]', msg, meta),
  },
});
```

### Error Recovery Patterns

Always wrap API calls in try-catch blocks:

```typescript
try {
  const session = await client.createSession(request);
  console.log('Success:', session);
} catch (error) {
  console.error('Error:', error.message);
}
```

## TypeScript Support

This library is written in TypeScript and includes full type definitions. You get excellent IntelliSense support and compile-time type checking.

## Resources

- [Official Jules API Documentation](https://developers.google.com/jules/api)
- [Jules Web App](https://jules.google.com)
- [GitHub Repository](https://github.com/kiwina/jules-api-sdk)
- [Basic Example](./examples/example.ts) - Common usage patterns
- [Comprehensive Example](./examples/comprehensive-example.ts) - All 9 API methods demonstrated

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](../CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
