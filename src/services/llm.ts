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

    // Smart mock behavior - analyze the baseline email and enhance it contextually
    const contextualResponse = this.generateContextualMockResponse(params.userPrompt);
    
    logger.debug('Using contextual mock LLM response');
    return { text: contextualResponse };
  }

  private generateContextualMockResponse(userPrompt: string): string {
    // Extract the baseline email from the user prompt
    const emailMatch = userPrompt.match(/Current email:\s*Subject: (.+?)\n\n(.+?)\n\n([\s\S]+?)\n\n(.+?)(?:\n\nFocus on:|$)/);
    
    if (emailMatch) {
      const [, subject, greeting, bodyContent, closing] = emailMatch;
      
      // Split body content into sections
      const bodySections = bodyContent.split('\n\n').filter(section => section.trim().length > 0);
      
      // Enhance the extracted email contextually
      let enhancedSubject = subject;
      let enhancedBodySections = [...bodySections];
      
      // Enhance subject based on content
      if (subject.includes('Research Collaboration')) {
        enhancedSubject = 'Research Collaboration Inquiry — Exploring RA Opportunities';
      } else if (subject.includes('Professional Networking') && bodyContent.includes('research')) {
        enhancedSubject = 'Research Assistant Opportunity — Exploring Your Lab';
      } else if (subject.includes('Professional Networking') && bodyContent.includes('internship')) {
        enhancedSubject = 'Internship Opportunity — Professional Connection';
      } else if (subject.includes('Thank You')) {
        enhancedSubject = subject; // Keep thank you subjects as is
      }
      
      // Enhance body content based on context
      enhancedBodySections = enhancedBodySections.map(section => {
        let enhanced = section;
        
        // Make language more specific and professional
        enhanced = enhanced.replace(
          'exploring research opportunities', 
          'exploring research assistant opportunities in your lab'
        );
        enhanced = enhanced.replace(
          'professional networking and collaboration',
          'potential collaboration opportunities'
        );
        enhanced = enhanced.replace(
          'Would you be open to a brief call next week?',
          'Would you be available for a brief conversation to discuss how I might contribute to your research?'
        );
        enhanced = enhanced.replace(
          'I\'m eager to learn more about',
          'I would appreciate the opportunity to learn more about'
        );
        
        return enhanced;
      });
      
      return `===EMAIL===
Subject: ${enhancedSubject}

${greeting}

${enhancedBodySections.join('\n\n')}

${closing}

===EVAL===
This email has been enhanced for better clarity and professionalism. The subject line is more specific, the language is more polished, and the content is tailored to academic/research communication while maintaining appropriate tone.`;
    }
    
    // Fallback to improved default if parsing fails
    return `===EMAIL===
Subject: Professional Inquiry — Exploring Opportunities

Dear {{recipient_name}},

I hope this message finds you well. I am writing to express my interest in connecting and exploring potential opportunities for collaboration.

Your work has caught my attention, and I believe there may be valuable opportunities for us to discuss how we might work together.

I would greatly appreciate the opportunity to learn more about your current projects and share how my background might align with your needs.

Best regards,
{{sender_name}}

===EVAL===
This email maintains a professional and respectful tone while being clear about the sender's intentions. It shows genuine interest and opens the door for meaningful conversation.`;
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