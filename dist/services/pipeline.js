import { categorize } from './categorize.js';
import { generateCustomEmail } from './generator.js';
import { applyStyle } from './style.js';
import { runChecks } from './checks.js';
export function processDraft(input) {
    // Step 1: Categorize the input text
    const categorization = categorize(input.text);
    // Step 2: Generate custom email based on input (replaces template system)
    const customDraft = generateCustomEmail(input);
    // Step 3: Apply style based on tone settings
    const styledDraft = applyStyle(customDraft, input.tone);
    // Step 4: Run validation checks
    const checkResult = runChecks(styledDraft, input);
    return {
        draft: styledDraft,
        checks: checkResult,
        meta: {
            category: categorization.category,
            matchedRules: categorization.matchedRules
        }
    };
}
//# sourceMappingURL=pipeline.js.map