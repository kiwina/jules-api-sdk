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

// Artifact schema - uses optional fields pattern to match API behavior
// An artifact must contain at least one type of content
export const ArtifactSchema = z.object({
  changeSet: ChangeSetSchema.optional(),
  media: MediaSchema.optional(),
  bashOutput: BashOutputSchema.optional(),
}).refine(
  (data) => data.changeSet || data.media || data.bashOutput,
  { message: "Artifact must have at least one of: changeSet, media, or bashOutput" }
);

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

// Activity content schema - uses optional fields pattern to match API behavior
// The API returns activity data as optional fields where only one is expected to be present
const ActivityContentSchema = z.object({
  agentMessaged: AgentMessagedSchema.optional(),
  userMessaged: UserMessagedSchema.optional(),
  planGenerated: PlanGeneratedSchema.optional(),
  planApproved: PlanApprovedSchema.optional(),
  progressUpdated: ProgressUpdatedSchema.optional(),
  sessionCompleted: SessionCompletedSchema.optional(),
  sessionFailed: SessionFailedSchema.optional(),
});

// Complete Activity schema with required base fields
// An activity must have at least one content field (agentMessaged, userMessaged, etc.)
export const ActivitySchema = z.object({
  name: z.string(),
  id: z.string(),
  description: z.string().optional(), // API may omit description
  createTime: z.string(),
  originator: z.string(),
  artifacts: z.array(ArtifactSchema).optional(),
}).and(ActivityContentSchema).refine(
  (data) => data.agentMessaged || data.userMessaged || data.planGenerated || 
            data.planApproved || data.progressUpdated || data.sessionCompleted || 
            data.sessionFailed,
  { message: "Activity must have at least one content field (agentMessaged, userMessaged, planGenerated, etc.)" }
);

export const ListActivitiesResponseSchema = z.object({
  activities: z.array(ActivitySchema).optional(),
  nextPageToken: z.string().optional(),
});

export type Activity = z.infer<typeof ActivitySchema>;
export type ListActivitiesResponse = z.infer<typeof ListActivitiesResponseSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
