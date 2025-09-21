import { loadConfigSync } from '../utils/config.js';
import { z } from 'zod';
const GuardrailsSchema = z.object({
    blacklist_phrases: z.array(z.string()),
    slang_regex: z.string(),
    emoji_regex: z.string(),
    attachment_keywords: z.array(z.string()),
    link_regex: z.string(),
});
let guardrailsCache = null;
function getGuardrails() {
    if (!guardrailsCache) {
        guardrailsCache = loadConfigSync('guardrails.json', GuardrailsSchema);
    }
    return guardrailsCache;
}
function getAllText(draft) {
    return [
        draft.subject,
        draft.greeting,
        ...draft.bodySections,
        draft.closing
    ].join(' ');
}
function checkCompleteness(draft) {
    const warnings = [];
    if (!draft.subject || draft.subject.trim().length === 0) {
        warnings.push('COMPLETENESS_MISSING_SUBJECT');
    }
    if (!draft.greeting || draft.greeting.trim().length === 0) {
        warnings.push('COMPLETENESS_MISSING_GREETING');
    }
    if (!draft.closing || draft.closing.trim().length === 0) {
        warnings.push('COMPLETENESS_MISSING_CLOSING');
    }
    // Check for CTA (Call to Action) in body sections
    const allBodyText = draft.bodySections.join(' ').toLowerCase();
    const ctaPatterns = [
        /\bcall\b/,
        /\bmeet\b/,
        /\bschedule\b/,
        /\bconnect\b/,
        /\blet me know\b/,
        /\bplease\b/,
        /\bwould you\b/,
        /\bcan you\b/,
        /\bcould you\b/,
        /\blook forward\b/,
        /\bhope to hear\b/,
        /\bthank you\b/,
        /\bfeel free\b/
    ];
    const hasCTA = ctaPatterns.some(pattern => pattern.test(allBodyText));
    if (!hasCTA) {
        warnings.push('COMPLETENESS_MISSING_CTA');
    }
    return warnings;
}
function checkProfessionalism(draft) {
    const warnings = [];
    const guardrails = getGuardrails();
    const allText = getAllText(draft);
    // Check for slang
    const slangRegex = new RegExp(guardrails.slang_regex, 'gi');
    if (slangRegex.test(allText)) {
        warnings.push('PROFESSIONALISM_SLANG_DETECTED');
    }
    // Check for emojis
    const emojiRegex = new RegExp(guardrails.emoji_regex, 'gu');
    if (emojiRegex.test(allText)) {
        warnings.push('PROFESSIONALISM_EMOJI_DETECTED');
    }
    return warnings;
}
function checkClarity(draft) {
    const warnings = [];
    const allText = getAllText(draft);
    // Split into sentences (basic implementation)
    const sentences = allText
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    if (sentences.length === 0) {
        return warnings;
    }
    // Calculate average sentence length
    const totalWords = sentences.reduce((count, sentence) => {
        return count + sentence.split(/\s+/).filter(word => word.length > 0).length;
    }, 0);
    const avgSentenceLength = totalWords / sentences.length;
    // Flag if average sentence length is too high (>20 words)
    if (avgSentenceLength > 20) {
        warnings.push('CLARITY_LONG_SENTENCES');
    }
    // Check for run-on sentences (>30 words)
    const hasRunOnSentence = sentences.some(sentence => {
        const wordCount = sentence.split(/\s+/).filter(word => word.length > 0).length;
        return wordCount > 30;
    });
    if (hasRunOnSentence) {
        warnings.push('CLARITY_RUN_ON_SENTENCE');
    }
    return warnings;
}
function checkEthical(draft) {
    const warnings = [];
    const guardrails = getGuardrails();
    const allText = getAllText(draft).toLowerCase();
    // Check for blacklisted phrases (over-promises)
    guardrails.blacklist_phrases.forEach(phrase => {
        if (allText.includes(phrase.toLowerCase())) {
            warnings.push('ETHICAL_OVERPROMISE_DETECTED');
        }
    });
    // Check for inappropriate terms
    const inappropriateTerms = [
        'desperate',
        'begging',
        'please hire me',
        'i need this job',
        'i\'ll do anything'
    ];
    inappropriateTerms.forEach(term => {
        if (allText.includes(term)) {
            warnings.push('ETHICAL_INAPPROPRIATE_TERM');
        }
    });
    return warnings;
}
function checkAttachmentLinkConsistency(draft) {
    const warnings = [];
    const guardrails = getGuardrails();
    const allText = getAllText(draft);
    // Check for attachment references
    const hasAttachmentKeywords = guardrails.attachment_keywords.some(keyword => allText.toLowerCase().includes(keyword.toLowerCase()));
    if (hasAttachmentKeywords) {
        warnings.push('CONSISTENCY_ATTACHMENT_REFERENCED');
    }
    // Check for link references
    const linkRegex = new RegExp(guardrails.link_regex, 'gi');
    if (linkRegex.test(allText)) {
        warnings.push('CONSISTENCY_LINK_DETECTED');
    }
    return warnings;
}
export function runChecks(draft, input) {
    const warnings = [];
    // Run all checks
    warnings.push(...checkCompleteness(draft));
    warnings.push(...checkProfessionalism(draft));
    warnings.push(...checkClarity(draft));
    warnings.push(...checkEthical(draft));
    warnings.push(...checkAttachmentLinkConsistency(draft));
    // Determine overall pass/fail for each category
    const completeness = !warnings.some(w => w.startsWith('COMPLETENESS_'));
    const professionalism = !warnings.some(w => w.startsWith('PROFESSIONALISM_'));
    const clarity = !warnings.some(w => w.startsWith('CLARITY_'));
    const ethical = !warnings.some(w => w.startsWith('ETHICAL_'));
    return {
        completeness,
        professionalism,
        clarity,
        ethical,
        warnings: [...new Set(warnings)] // Remove duplicates
    };
}
//# sourceMappingURL=checks.js.map