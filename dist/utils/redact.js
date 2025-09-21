/**
 * Redaction utility for masking PII and sensitive information in logs
 */
const DEFAULT_OPTIONS = {
    maskEmails: true,
    maskPhones: true,
    maskUrls: true,
    maskLinkedIn: true,
    replacement: '[REDACTED]'
};
// Email pattern: simple but effective for most cases
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
// Phone patterns: US formats and common international patterns
const PHONE_REGEX = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
// URL patterns: http/https URLs
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
// LinkedIn profile URLs
const LINKEDIN_REGEX = /https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?/g;
/**
 * Redacts sensitive information from text
 */
export function redact(text, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let result = text;
    if (opts.maskEmails) {
        result = result.replace(EMAIL_REGEX, opts.replacement);
    }
    if (opts.maskPhones) {
        result = result.replace(PHONE_REGEX, opts.replacement);
    }
    // Handle LinkedIn URLs first to avoid conflict with general URL regex
    if (opts.maskLinkedIn) {
        result = result.replace(LINKEDIN_REGEX, opts.replacement);
    }
    if (opts.maskUrls) {
        // Apply URL masking after LinkedIn
        result = result.replace(URL_REGEX, (match) => {
            // Skip if already redacted or if it's a LinkedIn URL and LinkedIn masking is disabled
            if (match.includes('[REDACTED]')) {
                return match;
            }
            if (!opts.maskLinkedIn && LINKEDIN_REGEX.test(match)) {
                // Reset the regex lastIndex since we used it for testing
                LINKEDIN_REGEX.lastIndex = 0;
                return match;
            }
            return opts.replacement;
        });
    }
    return result;
}
/**
 * Redacts PII from objects recursively
 */
export function redactObject(obj, options = {}) {
    if (typeof obj === 'string') {
        return redact(obj, options);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => redactObject(item, options));
    }
    if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = redactObject(value, options);
        }
        return result;
    }
    return obj;
}
//# sourceMappingURL=redact.js.map