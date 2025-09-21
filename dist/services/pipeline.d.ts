import { DraftInput, DraftOutput, CheckResult, EmailCategory } from '../types/domain.js';
interface ProcessDraftResult {
    draft: DraftOutput;
    checks: CheckResult;
    meta: {
        category: EmailCategory;
        matchedRules: string[];
    };
}
export declare function processDraft(input: DraftInput): ProcessDraftResult;
export {};
//# sourceMappingURL=pipeline.d.ts.map