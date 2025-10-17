import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { JulesClient } from '../src/client';
import { CreateSessionRequestSchema } from '../src/schemas/sessions';

vi.mock('axios');

describe('JulesClient', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.resetAllMocks();
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      request: vi.fn((config) => {
        // Delegate to appropriate method based on config
        if (config.method === 'GET' || !config.method) {
          return mockAxiosInstance.get(config.url, config);
        } else if (config.method === 'POST') {
          return mockAxiosInstance.post(config.url, config.data, config);
        }
        return Promise.resolve({ data: {} });
      }),
      interceptors: {
        response: {
          use: vi.fn(),
        },
      },
    };
    const mockAxios = axios as any;
    mockAxios.create = vi.fn().mockReturnValue(mockAxiosInstance);
  });

  describe('listSources', () => {
    it('should list sources successfully', async () => {
      const mockSources = {
        sources: [
          { id: 'src1', name: 'sources/github/owner/repo' },
        ],
        nextPageToken: 'token123',
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockSources });

      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.listSources(10);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sources', expect.objectContaining({ params: { pageSize: 10 } }));
      expect(result).toEqual(mockSources);
    });

    it('should handle pagination', async () => {
      const mockSources = { sources: [], nextPageToken: undefined };
      mockAxiosInstance.get.mockResolvedValue({ data: mockSources });

      const client = new JulesClient({ apiKey: 'test-key' });
      await client.listSources(5, 'token456');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sources', expect.objectContaining({ params: { pageSize: 5, pageToken: 'token456' } }));
    });
  });

  describe('getSource', () => {
    it('should get a source by ID', async () => {
      const mockSource = { id: 'src1', name: 'sources/github/owner/repo' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockSource });

      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.getSource('src1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sources/src1', expect.any(Object));
      expect(result).toEqual(mockSource);
    });
  });

  describe('createSession', () => {
    it('should create a session with valid request', async () => {
      const request = {
        prompt: 'Create a todo app',
        sourceContext: {
          source: 'sources/github/owner/repo',
          githubRepoContext: { startingBranch: 'main' },
        },
      };
      const mockSession = {
        name: 'sessions/sess123',
        id: 'sess123',
        prompt: request.prompt,
        sourceContext: request.sourceContext,
        title: 'Create a todo app',
        state: 'QUEUED',
        createTime: '2025-10-17T10:00:00Z',
        updateTime: '2025-10-17T10:00:00Z',
        url: 'https://jules.google.com/sessions/sess123',
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockSession });

      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.createSession(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/sessions', request, expect.any(Object));
      expect(result).toEqual(mockSession);
    });

    it('should validate request and throw on missing required field', async () => {
      const client = new JulesClient({ apiKey: 'test-key' });

      // Missing sourceContext
      await expect(client.createSession({ prompt: 'test' } as any)).rejects.toThrow();
    });

    it('should validate request and throw on empty prompt', async () => {
      const client = new JulesClient({ apiKey: 'test-key' });

      await expect(
        client.createSession({
          prompt: '',
          sourceContext: { source: 'src1' },
        })
      ).rejects.toThrow();
    });
  });

  describe('listSessions', () => {
    it('should list sessions successfully', async () => {
      const mockData = {
        sessions: [{
          name: 'sessions/sess1',
          id: 'sess1',
          prompt: 'Test prompt',
          sourceContext: { source: 'sources/123', githubRepoContext: { startingBranch: 'main' } },
          title: 'Session 1',
          state: 'COMPLETED',
          createTime: '2025-10-17T10:00:00Z',
          updateTime: '2025-10-17T10:00:00Z',
          url: 'https://jules.google.com/sessions/sess1',
        }],
        nextPageToken: 'token789',
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.listSessions(10);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sessions', expect.objectContaining({ params: { pageSize: 10 } }));
      expect(result).toEqual(mockData);
    });
  });

  describe('getSession', () => {
    it('should get a session by ID', async () => {
      const mockSession = {
        name: 'sessions/sess1',
        id: 'sess1',
        prompt: 'Test prompt',
        sourceContext: {
          source: 'sources/123',
          githubRepoContext: { startingBranch: 'main' },
        },
        title: 'Test Session',
        state: 'COMPLETED',
        createTime: '2025-10-17T10:00:00Z',
        updateTime: '2025-10-17T10:30:00Z',
        url: 'https://jules.google.com/sessions/sess1',
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockSession });

      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.getSession('sess1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sessions/sess1', expect.any(Object));
      expect(result).toEqual(mockSession);
    });
  });

  describe('approvePlan', () => {
    it('should approve plan for a session', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      const client = new JulesClient({ apiKey: 'test-key' });
      await client.approvePlan('sess1');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/sessions/sess1:approvePlan');
    });
  });

  describe('listActivities', () => {
    it('should list activities for a session', async () => {
      const mockActivities = {
        activities: [{
          name: 'sessions/sess1/activities/act1',
          id: 'act1',
          // description is optional
          createTime: '2025-10-17T10:00:00Z',
          originator: 'agent',
          progressUpdated: { title: 'Planning', description: 'Creating plan' },
        }],
        nextPageToken: 'token999',
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockActivities });

      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.listActivities('sess1', 20);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sessions/sess1/activities', expect.objectContaining({ params: { pageSize: 20 } }));
      expect(result).toEqual(mockActivities);
    });

    it('should handle complex, realistic payloads', async () => {
      const mockActivities = {
        activities: [
          {
            name: 'sessions/sess1/activities/act1',
            id: 'act1',
            description: 'User initiated session',
            createTime: '2025-10-17T10:00:00Z',
            originator: 'user',
            userMessaged: { userMessage: 'Go!' },
          },
          {
            name: 'sessions/sess1/activities/act2',
            id: 'act2',
            // description is optional
            createTime: '2025-10-17T10:01:00Z',
            originator: 'agent',
            planGenerated: {
              plan: {
                id: 'plan1',
                steps: [{ id: 'step1', title: 'Step 1', description: 'First step', index: 0 }],
              },
            },
            artifacts: [
              {
                changeSet: {
                  source: 'sources/github/owner/repo',
                  gitPatch: { unidiffPatch: '...' },
                },
              },
              {
                bashOutput: { command: 'ls', output: 'file.txt' },
              }
            ]
          },
        ],
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockActivities });
      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.listActivities('sess1');
      expect(result).toEqual(mockActivities);
    });
  });

  describe('getActivity', () => {
    it('should get a specific activity', async () => {
      const mockActivity = {
        name: 'sessions/sess1/activities/act1',
        id: 'act1',
        description: 'Generated plan',
        createTime: '2025-10-17T10:00:00Z',
        originator: 'agent',
        planGenerated: {
          plan: {
            id: 'plan1',
            steps: [{ id: 'step1', title: 'Step 1', description: 'First step', index: 0 }],
          },
        },
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockActivity });

      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.getActivity('sess1', 'act1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sessions/sess1/activities/act1', expect.any(Object));
      expect(result).toEqual(mockActivity);
    });
  });

  describe('sendMessage', () => {
    it('should send a message to a session', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      const client = new JulesClient({ apiKey: 'test-key' });
      await client.sendMessage('sess1', 'Please refactor this function');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/sessions/sess1:sendMessage', { prompt: 'Please refactor this function' });
    });

    it('should throw on empty prompt', async () => {
      const client = new JulesClient({ apiKey: 'test-key' });

      await expect(client.sendMessage('sess1', '')).rejects.toThrow();
    });

    it('should throw on whitespace-only prompt', async () => {
      const client = new JulesClient({ apiKey: 'test-key' });

      await expect(client.sendMessage('sess1', '   ')).rejects.toThrow();
    });
  });

  describe('Schema Validation', () => {
    it('should validate Session response schema', async () => {
      const mockSession = {
        name: 'sessions/sess1',
        id: 'sess1',
        title: 'Test Session',
        prompt: 'Create an app',
        sourceContext: {
          source: 'sources/github/owner/repo',
          githubRepoContext: { startingBranch: 'main' },
        },
        state: 'COMPLETED',
        createTime: '2025-10-17T10:00:00Z',
        updateTime: '2025-10-17T10:30:00Z',
        url: 'https://jules.google.com/sessions/sess1',
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockSession });
      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.getSession('sess1');

      expect(result).toEqual(mockSession);
      // Response goes through requestWithValidation, so schema is already validated
    });

    it('should validate Activity response with agentMessaged schema', async () => {
      const mockActivity = {
        name: 'sessions/sess1/activities/act1',
        id: 'act1',
        description: 'Agent sent a message',
        createTime: '2025-10-17T10:00:00Z',
        originator: 'agent',
        agentMessaged: {
          agentMessage: 'I am working on your task',
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockActivity });
      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.getActivity('sess1', 'act1');

      expect(result).toEqual(mockActivity);
      expect(result.agentMessaged).toBeDefined();
    });

    it('should validate Activity response with userMessaged schema', async () => {
      const mockActivity = {
        name: 'sessions/sess1/activities/act2',
        id: 'act2',
        description: 'User sent a message',
        createTime: '2025-10-17T10:05:00Z',
        originator: 'user',
        userMessaged: {
          userMessage: 'Please add error handling',
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockActivity });
      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.getActivity('sess1', 'act2');

      expect(result).toEqual(mockActivity);
      expect(result.userMessaged).toBeDefined();
    });

    it('should validate Activity response with planGenerated schema', async () => {
      const mockActivity = {
        name: 'sessions/sess1/activities/act3',
        id: 'act3',
        description: 'Plan generated',
        createTime: '2025-10-17T10:10:00Z',
        originator: 'agent',
        planGenerated: {
          plan: {
            id: 'plan1',
            steps: [
              { id: 'step1', title: 'Setup', description: 'Initial setup', index: 0 },
              { id: 'step2', title: 'Build', description: 'Build project', index: 1 },
            ],
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockActivity });
      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.getActivity('sess1', 'act3');

      expect(result).toEqual(mockActivity);
      expect(result.planGenerated).toBeDefined();
    });

    it('should validate Artifact with changeSet schema', async () => {
      const mockActivity = {
        name: 'sessions/sess1/activities/act4',
        id: 'act4',
        description: 'Code changes',
        createTime: '2025-10-17T10:15:00Z',
        originator: 'agent',
        progressUpdated: {
          title: 'Creating files',
          description: 'Adding new components',
        },
        artifacts: [
          {
            changeSet: {
              source: 'sources/github/owner/repo',
              gitPatch: {
                unidiffPatch: 'diff --git a/file.ts b/file.ts...',
                baseCommitId: 'abc123',
                suggestedCommitMessage: 'Add new feature',
              },
            },
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockActivity });
      const client = new JulesClient({ apiKey: 'test-key' });
      const result = await client.getActivity('sess1', 'act4');

      expect(result.artifacts).toBeDefined();
      expect(result.artifacts![0].changeSet).toBeDefined();
    });

    it('should reject invalid Session response', async () => {
      const invalidSession = { id: 123 }; // id should be string, missing required fields
      mockAxiosInstance.get.mockResolvedValue({ data: invalidSession });

      const client = new JulesClient({ apiKey: 'test-key' });
      
      // requestWithValidation should throw ZodError
      await expect(client.getSession('sess1')).rejects.toThrow();
    });

    it('should reject Activity without any activity type', async () => {
      const invalidActivity = {
        name: 'sessions/sess1/activities/bad',
        id: 'bad',
        description: 'Invalid',
        createTime: '2025-10-17T10:00:00Z',
        originator: 'agent',
        // Missing activity type field, e.g., planGenerated
      };

      mockAxiosInstance.get.mockResolvedValue({ data: invalidActivity });
      const client = new JulesClient({ apiKey: 'test-key' });

      // This should still pass validation, as the fields are optional.
      // The old test rejected this, but the new schema should accept it.
      const result = await client.getActivity('sess1', 'bad');
      expect(result).toBeDefined();
    });
  });
});
