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

// Discriminated union for Artifact content
export const ArtifactSchema = z.discriminatedUnion('_artifactType', [
  z.object({
    _artifactType: z.literal('changeSet'),
    changeSet: ChangeSetSchema,
  }),
  z.object({
    _artifactType: z.literal('media'),
    media: MediaSchema,
  }),
  z.object({
    _artifactType: z.literal('bashOutput'),
    bashOutput: BashOutputSchema,
  }),
]);

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

// Discriminated union for Activity types
const ActivityUnionSchema = z.discriminatedUnion('_activityType', [
  z.object({
    _activityType: z.literal('agentMessaged'),
    agentMessaged: AgentMessagedSchema,
  }),
  z.object({
    _activityType: z.literal('userMessaged'),
    userMessaged: UserMessagedSchema,
  }),
  z.object({
    _activityType: z.literal('planGenerated'),
    planGenerated: PlanGeneratedSchema,
  }),
  z.object({
    _activityType: z.literal('planApproved'),
    planApproved: PlanApprovedSchema,
  }),
  z.object({
    _activityType: z.literal('progressUpdated'),
    progressUpdated: ProgressUpdatedSchema,
  }),
  z.object({
    _activityType: z.literal('sessionCompleted'),
    sessionCompleted: SessionCompletedSchema,
  }),
  z.object({
    _activityType: z.literal('sessionFailed'),
    sessionFailed: SessionFailedSchema,
  }),
]);

// Complete Activity schema with required base fields and discriminated union
export const ActivitySchema = z.object({
  name: z.string(),
  id: z.string(),
  description: z.string(),
  createTime: z.string(),
  originator: z.string(),
  artifacts: z.array(ArtifactSchema).optional(),
}).and(ActivityUnionSchema);

export const ListActivitiesResponseSchema = z.object({
  activities: z.array(ActivitySchema).optional(),
  nextPageToken: z.string().optional(),
});

export type Activity = z.infer<typeof ActivitySchema>;
export type ListActivitiesResponse = z.infer<typeof ListActivitiesResponseSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
