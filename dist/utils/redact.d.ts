/**
 * Redaction utility for masking PII and sensitive information in logs
 */
export interface RedactionOptions {
    maskEmails?: boolean;
    maskPhones?: boolean;
    maskUrls?: boolean;
    maskLinkedIn?: boolean;
    replacement?: string;
}
/**
 * Redacts sensitive information from text
 */
export declare function redact(text: string, options?: RedactionOptions): string;
/**
 * Redacts PII from objects recursively
 */
export declare function redactObject(obj: any, options?: RedactionOptions): any;
//# sourceMappingURL=redact.d.ts.map