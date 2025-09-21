import { DraftOutput, ToneSettings, EmailCategory, CheckResult } from '../types/domain.js';
export interface RefineResult {
    draft: DraftOutput;
    checks: CheckResult;
    evalMetrics: any;
    wasRefined: boolean;
    usedFallback: boolean;
    refineWarnings: string[];
}
/**
 * Refine email draft using LLM
 */
export declare function refineWithLLM(draft: DraftOutput, tone: ToneSettings, category: EmailCategory): Promise<RefineResult>;
//# sourceMappingURL=refine.d.ts.map