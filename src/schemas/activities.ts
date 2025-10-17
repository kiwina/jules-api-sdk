import { z } from 'zod';

// Bash output artifact
export const BashOutputSchema = z.object({
  command: z.string().optional(),
  output: z.string().optional(),
  exitCode: z.number().optional(),
});

// Git patch artifact
export const GitPatchSchema = z.object({
  unidiffPatch: z.string().optional(),
  baseCommitId: z.string().optional(),
  suggestedCommitMessage: z.string().optional(),
});

// Change set artifact
export const ChangeSetSchema = z.object({
  source: z.string().optional(),
  gitPatch: GitPatchSchema.optional(),
});

// Media artifact
export const MediaSchema = z.object({
  data: z.string().optional(),
  mimeType: z.string().optional(),
});

// A single artifact can contain one of several types of content.
// In the API, these are represented by optional fields.
export const ArtifactSchema = z.object({
  changeSet: ChangeSetSchema.optional(),
  media: MediaSchema.optional(),
  bashOutput: BashOutputSchema.optional(),
});

// Plan step schema
export const PlanStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  index: z.number(),
});

// Plan schema
export const PlanSchema = z.object({
  id: z.string(),
  steps: z.array(PlanStepSchema).optional(),
  createTime: z.string().optional(),
});

// Individual activity type schemas
export const AgentMessagedSchema = z.object({
  agentMessage: z.string(),
});

export const UserMessagedSchema = z.object({
  userMessage: z.string(),
});

export const PlanGeneratedSchema = z.object({
  plan: PlanSchema,
});

export const PlanApprovedSchema = z.object({
  planId: z.string(),
});

export const ProgressUpdatedSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

export const SessionCompletedSchema = z.object({});

export const SessionFailedSchema = z.object({
  reason: z.string().optional(),
});

// An activity's content is determined by its type. In the API, this is
// represented by a set of optional fields, where only one is expected to be
// present.
const ActivityContentSchema = z.object({
  agentMessaged: AgentMessagedSchema.optional(),
  userMessaged: UserMessagedSchema.optional(),
  planGenerated: PlanGeneratedSchema.optional(),
  planApproved: PlanApprovedSchema.optional(),
  progressUpdated: ProgressUpdatedSchema.optional(),
  sessionCompleted: SessionCompletedSchema.optional(),
  sessionFailed: SessionFailedSchema.optional(),
});

// Complete Activity schema with required base fields and activity content
export const ActivitySchema = z.object({
  name: z.string(),
  id: z.string(),
  description: z.string().optional(),
  createTime: z.string(),
  originator: z.string(),
  artifacts: z.array(ArtifactSchema).optional(),
}).and(ActivityContentSchema);

export const ListActivitiesResponseSchema = z.object({
  activities: z.array(ActivitySchema).optional(),
  nextPageToken: z.string().optional(),
});

export type Activity = z.infer<typeof ActivitySchema>;
export type ListActivitiesResponse = z.infer<typeof ListActivitiesResponseSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
