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
 * Environment-driven factory for LLM clients
 */
export declare function createLLMClient(): LLMClient;
export declare const llmClient: LLMClient;
//# sourceMappingURL=llm.d.ts.map