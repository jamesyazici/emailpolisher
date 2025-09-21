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
function countWords(text) {
    // Remove pure punctuation and count only actual words
    const words = text.trim().split(/\s+/).filter(word => {
        // Only count if it contains at least one letter or number
        return word.length > 0 && /[a-zA-Z0-9]/.test(word);
    });
    return words.length;
}
function getWordCountBand(wordCount) {
    if (wordCount <= 50)
        return 'short';
    if (wordCount <= 150)
        return 'medium';
    if (wordCount <= 300)
        return 'long';
    return 'very-long';
}
function analyzeSentences(text) {
    const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    if (sentences.length === 0) {
        return { count: 0, avgLength: 0, longCount: 0 };
    }
    const wordCounts = sentences.map(sentence => {
        // Count words the same way as countWords function
        const words = sentence.split(/\s+/).filter(word => {
            return word.length > 0 && /[a-zA-Z0-9]/.test(word);
        });
        return words.length;
    });
    const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
    const avgLength = totalWords / sentences.length;
    const longCount = wordCounts.filter(count => count > 20).length;
    return {
        count: sentences.length,
        avgLength,
        longCount
    };
}
function countSlangHits(text) {
    const guardrails = getGuardrails();
    const slangRegex = new RegExp(guardrails.slang_regex, 'gi');
    const matches = text.match(slangRegex);
    return matches ? matches.length : 0;
}
function countEmojiHits(text) {
    const guardrails = getGuardrails();
    const emojiRegex = new RegExp(guardrails.emoji_regex, 'gu');
    const matches = text.match(emojiRegex);
    return matches ? matches.length : 0;
}
function countOverpromiseHits(text) {
    const guardrails = getGuardrails();
    const lowerText = text.toLowerCase();
    return guardrails.blacklist_phrases.reduce((count, phrase) => {
        const occurrences = (lowerText.match(new RegExp(phrase.toLowerCase(), 'g')) || []).length;
        return count + occurrences;
    }, 0);
}
function countAttachmentRefs(text) {
    const guardrails = getGuardrails();
    const lowerText = text.toLowerCase();
    return guardrails.attachment_keywords.reduce((count, keyword) => {
        const occurrences = (lowerText.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
        return count + occurrences;
    }, 0);
}
function countLinkRefs(text) {
    const guardrails = getGuardrails();
    const linkRegex = new RegExp(guardrails.link_regex, 'gi');
    const matches = text.match(linkRegex);
    return matches ? matches.length : 0;
}
function calculateReadabilityScore(metrics) {
    let score = 100;
    // Penalize very long sentences more heavily
    if (metrics.longSentenceCount > 0) {
        score -= metrics.longSentenceCount * 25;
    }
    // Penalize high average sentence length more aggressively
    if (metrics.avgSentenceLength > 20) {
        score -= (metrics.avgSentenceLength - 20) * 3;
    }
    // Penalize extremely long average sentences even more
    if (metrics.avgSentenceLength > 30) {
        score -= (metrics.avgSentenceLength - 30) * 5;
    }
    // Bonus for good word count
    if (metrics.wordCountBand === 'medium' || metrics.wordCountBand === 'long') {
        score += 10;
    }
    else if (metrics.wordCountBand === 'short') {
        score -= 5;
    }
    else if (metrics.wordCountBand === 'very-long') {
        score -= 20;
    }
    return Math.max(0, Math.min(100, score));
}
function calculateProfessionalismScore(metrics) {
    let score = 100;
    // Heavy penalties for unprofessional content
    score -= metrics.slangHits * 20;
    score -= metrics.emojiHits * 15;
    score -= metrics.overpromiseHits * 25;
    return Math.max(0, Math.min(100, score));
}
function calculateOverallScore(readabilityScore, professionalismScore) {
    // Weighted average: 60% professionalism, 40% readability
    return Math.round(professionalismScore * 0.6 + readabilityScore * 0.4);
}
export function evalDraft(draft, checks) {
    const allText = getAllText(draft);
    // Basic metrics
    const wordCount = countWords(allText);
    const wordCountBand = getWordCountBand(wordCount);
    const sentenceAnalysis = analyzeSentences(allText);
    // Content analysis
    const slangHits = countSlangHits(allText);
    const emojiHits = countEmojiHits(allText);
    const overpromiseHits = countOverpromiseHits(allText);
    const attachmentRefs = countAttachmentRefs(allText);
    const linkRefs = countLinkRefs(allText);
    // Intermediate metrics for scoring
    const metrics = {
        wordCount,
        wordCountBand,
        longSentenceCount: sentenceAnalysis.longCount,
        avgSentenceLength: sentenceAnalysis.avgLength,
        slangHits,
        emojiHits,
        overpromiseHits
    };
    // Calculate scores
    const readabilityScore = calculateReadabilityScore(metrics);
    const professionalismScore = calculateProfessionalismScore(metrics);
    const overallScore = calculateOverallScore(readabilityScore, professionalismScore);
    return {
        wordCount,
        wordCountBand,
        longSentenceCount: sentenceAnalysis.longCount,
        avgSentenceLength: Math.round(sentenceAnalysis.avgLength * 10) / 10, // Round to 1 decimal
        slangHits,
        emojiHits,
        overpromiseHits,
        attachmentRefs,
        linkRefs,
        readabilityScore,
        professionalismScore,
        overallScore
    };
}
//# sourceMappingURL=evalChecks.js.map