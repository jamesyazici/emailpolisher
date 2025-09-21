import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLLMClient, LLMClient, LLMCompletionParams } from '../src/services/llm.js';

describe('LLM Service', () => {
  describe('createLLMClient', () => {
    beforeEach(() => {
      // Reset environment variables
      delete process.env.NODE_ENV;
      delete process.env.LLM_API_KEY;
      delete process.env.LLM_BASE_URL;
      delete process.env.LLM_MODEL;
    });

    it('should create mock client for test environment', () => {
      process.env.NODE_ENV = 'test';
      const client = createLLMClient();
      expect(client).toBeDefined();
      // Verify it's the mock client by checking if it has the mock-specific methods
      expect((client as any).setMockResponse).toBeDefined();
      expect((client as any).clearMockResponses).toBeDefined();
    });

    it('should create mock client for development environment', () => {
      process.env.NODE_ENV = 'development';
      const client = createLLMClient();
      expect(client).toBeDefined();
      expect((client as any).setMockResponse).toBeDefined();
    });

    it('should default to development when NODE_ENV not set', () => {
      const client = createLLMClient();
      expect(client).toBeDefined();
      expect((client as any).setMockResponse).toBeDefined();
    });

    it('should throw error for production without API key', () => {
      process.env.NODE_ENV = 'production';
      expect(() => createLLMClient()).toThrow('LLM_API_KEY environment variable is required for production');
    });

    it('should create production client with API key', () => {
      process.env.NODE_ENV = 'production';
      process.env.LLM_API_KEY = 'test-key';
      
      const client = createLLMClient();
      expect(client).toBeDefined();
      // The error will be thrown when complete() is called, not during creation
    });

    it('should use custom configuration for production client', () => {
      process.env.NODE_ENV = 'production';
      process.env.LLM_API_KEY = 'test-key';
      process.env.LLM_BASE_URL = 'https://custom-api.com/v1';
      process.env.LLM_MODEL = 'gpt-3.5-turbo';
      
      const client = createLLMClient();
      expect(client).toBeDefined();
      // The error will be thrown when complete() is called, not during creation
    });
  });

  describe('MockLLMClient', () => {
    let client: LLMClient & { setMockResponse: (trigger: string, response: string) => void; clearMockResponses: () => void };

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      client = createLLMClient() as any;
      client.clearMockResponses();
    });

    it('should return default properly formatted response', async () => {
      const params: LLMCompletionParams = {
        systemPrompt: 'You are an email assistant',
        userPrompt: 'Help me write an email',
        temperature: 0.7,
        maxTokens: 1000
      };

      const response = await client.complete(params);
      
      expect(response.text).toContain('===EMAIL===');
      expect(response.text).toContain('===EVAL===');
      expect(response.text).toContain('Subject: Re: Your inquiry');
      expect(response.text).toContain('Dear {{recipient_name}},');
      expect(response.text).toContain('Best regards,');
      expect(response.text).toContain('{{sender_name}}');
    });

    it('should use configured mock responses based on trigger keywords', async () => {
      const mockResponse = `===EMAIL===
Subject: Mock Response

Dear Test User,

This is a mock response for testing purposes.

Best regards,
Test Assistant

===EVAL===
This is a test evaluation.`;

      client.setMockResponse('networking', mockResponse);

      const params: LLMCompletionParams = {
        systemPrompt: 'You are an email assistant',
        userPrompt: 'Help me write a networking email',
        temperature: 0.7
      };

      const response = await client.complete(params);
      expect(response.text).toBe(mockResponse);
    });

    it('should handle multiple mock responses with different triggers', async () => {
      const networkingResponse = `===EMAIL===
Subject: Networking Mock

Hello there,

Networking response content.

Best,
Assistant

===EVAL===
Networking evaluation.`;

      const followupResponse = `===EMAIL===
Subject: Follow-up Mock

Hi again,

Follow-up response content.

Thanks,
Assistant

===EVAL===
Follow-up evaluation.`;

      client.setMockResponse('networking', networkingResponse);
      client.setMockResponse('followup', followupResponse);

      // Test networking trigger
      const networkingParams: LLMCompletionParams = {
        systemPrompt: 'System prompt',
        userPrompt: 'Help with networking email'
      };
      const networkingResult = await client.complete(networkingParams);
      expect(networkingResult.text).toBe(networkingResponse);

      // Test followup trigger
      const followupParams: LLMCompletionParams = {
        systemPrompt: 'System prompt',
        userPrompt: 'Help with followup email'
      };
      const followupResult = await client.complete(followupParams);
      expect(followupResult.text).toBe(followupResponse);
    });

    it('should fall back to default when no trigger matches', async () => {
      client.setMockResponse('specific-keyword', 'Custom response');

      const params: LLMCompletionParams = {
        systemPrompt: 'System prompt',
        userPrompt: 'Random request without specific keyword'
      };

      const response = await client.complete(params);
      expect(response.text).toContain('===EMAIL===');
      expect(response.text).toContain('Subject: Re: Your inquiry');
    });

    it('should clear mock responses correctly', async () => {
      client.setMockResponse('test', 'Test response');
      
      // Verify mock response works
      const beforeClear = await client.complete({
        systemPrompt: 'System',
        userPrompt: 'test message'
      });
      expect(beforeClear.text).toBe('Test response');

      // Clear and verify default response is used
      client.clearMockResponses();
      const afterClear = await client.complete({
        systemPrompt: 'System',
        userPrompt: 'test message'
      });
      expect(afterClear.text).toContain('===EMAIL===');
      expect(afterClear.text).toContain('Subject: Re: Your inquiry');
    });

    it('should handle empty parameters gracefully', async () => {
      const params: LLMCompletionParams = {
        systemPrompt: '',
        userPrompt: ''
      };

      const response = await client.complete(params);
      expect(response.text).toContain('===EMAIL===');
      expect(response.text).toContain('===EVAL===');
    });

    it('should handle parameters with optional fields', async () => {
      const params: LLMCompletionParams = {
        systemPrompt: 'Test system prompt',
        userPrompt: 'Test user prompt'
        // temperature and maxTokens omitted
      };

      const response = await client.complete(params);
      expect(response.text).toContain('===EMAIL===');
      expect(response.text).toContain('===EVAL===');
    });
  });
});