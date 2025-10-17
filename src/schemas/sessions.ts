import { z } from 'zod';

// GitHub repo context for session creation
export const GithubRepoContextSchema = z.object({
  startingBranch: z.string().min(1),
});

// Source context for session creation
export const SourceContextSchema = z.object({
  source: z.string().min(1),
  githubRepoContext: GithubRepoContextSchema.optional(),
});

// Automation mode enum
export const AutomationModeEnum = z.enum(['AUTOMATION_MODE_UNSPECIFIED', 'AUTO_CREATE_PR']);

// Session state enum
export const SessionStateEnum = z.enum([
  'STATE_UNSPECIFIED',
  'QUEUED',
  'PLANNING',
  'AWAITING_PLAN_APPROVAL',
  'AWAITING_USER_FEEDBACK',
  'IN_PROGRESS',
  'PAUSED',
  'FAILED',
  'COMPLETED',
]);

// Request schema for creating a session
export const CreateSessionRequestSchema = z.object({
  prompt: z.string().min(1),
  sourceContext: SourceContextSchema,
  title: z.string().optional(),
  requirePlanApproval: z.boolean().optional(),
  automationMode: AutomationModeEnum.optional(),
});

// Pull request output
export const PullRequestSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
});

// Session output (discriminated union)
export const SessionOutputSchema = z.object({
  pullRequest: PullRequestSchema.optional(),
});

// Complete session schema with proper required fields
export const SessionSchema = z.object({
  // Required output-only fields
  name: z.string(),
  id: z.string(),
  createTime: z.string(),
  updateTime: z.string(),
  state: SessionStateEnum,
  url: z.string(),
  
  // Required input fields
  prompt: z.string(),
  sourceContext: SourceContextSchema,
  
  // Optional fields
  title: z.string().optional(),
  requirePlanApproval: z.boolean().optional(),
  automationMode: AutomationModeEnum.optional(),
  outputs: z.array(SessionOutputSchema).optional(),
}).strict();

// List sessions response schema
export const ListSessionsResponseSchema = z.object({
  sessions: z.array(SessionSchema).optional(),
  nextPageToken: z.string().optional(),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type SessionState = z.infer<typeof SessionStateEnum>;
export type AutomationMode = z.infer<typeof AutomationModeEnum>;
export type ListSessionsResponse = z.infer<typeof ListSessionsResponseSchema>;
