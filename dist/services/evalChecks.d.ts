import { DraftOutput, CheckResult } from '../types/domain.js';
export interface EvalMetrics {
    wordCount: number;
    wordCountBand: 'short' | 'medium' | 'long' | 'very-long';
    longSentenceCount: number;
    avgSentenceLength: number;
    slangHits: number;
    emojiHits: number;
    overpromiseHits: number;
    attachmentRefs: number;
    linkRefs: number;
    readabilityScore: number;
    professionalismScore: number;
    overallScore: number;
}
export declare function evalDraft(draft: DraftOutput, checks: CheckResult): EvalMetrics;
//# sourceMappingURL=evalChecks.d.ts.map