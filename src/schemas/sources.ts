import { z } from 'zod';

export const GitHubBranchSchema = z.object({
  displayName: z.string().min(1),
});

export const GitHubRepoSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  isPrivate: z.boolean().optional(),
  defaultBranch: GitHubBranchSchema.optional(),
  branches: z.array(GitHubBranchSchema).optional(),
});

export const SourceSchema = z.object({
  name: z.string().min(1),
  id: z.string().min(1),
  githubRepo: GitHubRepoSchema.optional(),
});

export const ListSourcesResponseSchema = z.object({
  sources: z.array(SourceSchema).optional(),
  nextPageToken: z.string().optional(),
});

export const ListSourcesParamsSchema = z.object({
  pageSize: z.number().optional(),
  pageToken: z.string().optional(),
});

export type Source = z.infer<typeof SourceSchema>;
export type ListSourcesResponse = z.infer<typeof ListSourcesResponseSchema>;
export type ListSourcesParams = z.infer<typeof ListSourcesParamsSchema>;
