import { logger } from '../utils/logger.js';

export interface LLMCompletionParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMCompletionResponse {
  text: string;
}

export interface LLMClient {
  complete(params: LLMCompletionParams): Promise<LLMCompletionResponse>;
}

/**
 * Mock LLM client for testing and development
 */
class MockLLMClient implements LLMClient {
  private mockResponses: Map<string, string> = new Map();

  async complete(params: LLMCompletionParams): Promise<LLMCompletionResponse> {
    logger.debug('Mock LLM completion requested', { 
      systemLength: params.systemPrompt.length,
      userLength: params.userPrompt.length,
      temperature: params.temperature 
    });

    // Check for pre-configured mock responses based on user prompt keywords
    for (const [key, response] of this.mockResponses) {
      if (params.userPrompt.includes(key)) {
        logger.debug('Using configured mock response', { trigger: key });
        return { text: response };
      }
    }

    // Default mock behavior - return a properly formatted email
    const defaultResponse = `===EMAIL===
Subject: Re: Your inquiry

Dear {{recipient_name}},

Thank you for reaching out. I appreciate your interest in connecting and would be happy to help.

I believe my background in the field aligns well with what you're looking for, and I'd welcome the opportunity to discuss this further.

Would you be available for a brief call next week to explore how we might work together?

Best regards,
{{sender_name}}

===EVAL===
This email maintains a professional tone while being concise and clear. The structure follows best practices with a clear subject, greeting, purpose, and call to action. The language is appropriate for business communication.`;

    logger.debug('Using default mock LLM response');
    return { text: defaultResponse };
  }

  /**
   * Configure mock responses for testing
   */
  setMockResponse(trigger: string, response: string): void {
    this.mockResponses.set(trigger, response);
    logger.debug('Mock response configured', { trigger });
  }

  /**
   * Clear all mock responses
   */
  clearMockResponses(): void {
    this.mockResponses.clear();
    logger.debug('Mock responses cleared');
  }
}

/**
 * Production LLM client (placeholder for future implementation)
 */
class ProductionLLMClient implements LLMClient {
  constructor(
    private apiKey: string,
    private baseUrl: string,
    private model: string
  ) {}

  async complete(params: LLMCompletionParams): Promise<LLMCompletionResponse> {
    logger.info('Production LLM completion requested', {
      model: this.model,
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });

    // TODO: Implement actual LLM API call
    // This would typically use fetch() or an SDK to call the LLM API
    throw new Error('Production LLM client not yet implemented. Please set NODE_ENV=test or development to use mock client.');
  }
}

/**
 * Environment-driven factory for LLM clients
 */
export function createLLMClient(): LLMClient {
  const env = process.env.NODE_ENV || 'development';
  
  // Always use mock client for Railway deployment unless API key is explicitly provided
  if (env === 'test' || env === 'development' || !process.env.LLM_API_KEY) {
    logger.debug('Creating mock LLM client', { env, hasApiKey: !!process.env.LLM_API_KEY });
    return new MockLLMClient();
  }

  // Production configuration with API key
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.LLM_MODEL || 'gpt-4';

  logger.info('Creating production LLM client', { model, baseUrl });
  return new ProductionLLMClient(apiKey, baseUrl, model);
}

// Default client instance
export const llmClient = createLLMClient();