import { DraftOutput } from '../types/domain.js';
interface ValidationResult {
    isValid: boolean;
    issues: string[];
    improvements: string[];
}
/**
 * Validate and improve generated emails for grammar, logic, and naturalness
 */
export declare function validateAndImproveEmail(email: DraftOutput): DraftOutput;
/**
 * Validate email quality and provide feedback
 */
export declare function validateEmailQuality(email: DraftOutput): ValidationResult;
export {};
//# sourceMappingURL=emailValidator.d.ts.map