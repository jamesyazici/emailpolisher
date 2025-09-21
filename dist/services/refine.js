import { llmClient } from './llm.js';
import { evalDraft } from './evalChecks.js';
import { runChecks } from './checks.js';
import { logger } from '../utils/logger.js';
/**
 * Generate system prompt for LLM refinement
 */
function generateSystemPrompt() {
    return `You are an expert email writing assistant. Your task is to refine and improve email drafts while maintaining their core structure and intent.

CRITICAL REQUIREMENTS:
1. Always preserve the email structure: subject, greeting, body content, and closing
2. Maintain the original tone and category intent
3. Improve clarity, professionalism, and impact
4. Keep the email concise but comprehensive
5. Ensure proper business email etiquette

RESPONSE FORMAT:
Your response must contain exactly two sections separated by these markers:

===EMAIL===
[Put the refined email here with this exact structure:]
Subject: [subject line]

[greeting]

[body paragraph 1]

[body paragraph 2]

[additional body paragraphs as needed]

[closing]

===EVAL===
[Provide a brief evaluation of the changes made, explaining how the email was improved]

IMPORTANT: 
- Never omit the subject, greeting, or closing
- Maintain the professional tone appropriate for business communication
- Ensure all sections are present and properly formatted`;
}
/**
 * Generate user prompt for specific email refinement
 */
function generateUserPrompt(draft, tone, category) {
    const formalityLevel = ['very casual', 'casual', 'neutral', 'formal', 'very formal'][tone.formality - 1];
    const confidenceLevel = ['hesitant', 'uncertain', 'moderate', 'confident', 'very confident'][tone.confidence - 1];
    const emailText = `Subject: ${draft.subject}

${draft.greeting}

${draft.bodySections.join('\n\n')}

${draft.closing}`;
    return `Please refine this ${category} email to be ${formalityLevel} in tone, ${confidenceLevel} in confidence, appropriate for a ${tone.seniority} level professional, and ${tone.length} in length.

Current email:
${emailText}

Focus on:
- Improving clarity and impact
- Ensuring appropriate ${formalityLevel} tone
- Maintaining ${confidenceLevel} confidence level
- Keeping it ${tone.length} in length
- Preserving all essential email components (subject, greeting, body, closing)`;
}
/**
 * Parse LLM response to extract email and evaluation
 */
function parseLLMResponse(response) {
    const emailMatch = response.match(/===EMAIL===\s*([\s\S]*?)\s*===EVAL===/);
    const evalMatch = response.match(/===EVAL===\s*([\s\S]*?)$/);
    if (!emailMatch || !evalMatch) {
        logger.warn('Failed to parse LLM response - missing required sections');
        return null;
    }
    return {
        email: emailMatch[1].trim(),
        evaluation: evalMatch[1].trim()
    };
}
/**
 * Parse refined email text into DraftOutput structure
 */
function parseEmailText(emailText) {
    const lines = emailText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 3) {
        logger.warn('Parsed email has insufficient lines', { lineCount: lines.length });
        return null;
    }
    // Extract subject
    const subjectLine = lines.find(line => line.startsWith('Subject:'));
    if (!subjectLine) {
        logger.warn('Missing subject line in parsed email');
        return null;
    }
    const subject = subjectLine.replace('Subject:', '').trim();
    // Remove subject line from processing
    const contentLines = lines.filter(line => !line.startsWith('Subject:'));
    if (contentLines.length < 2) {
        logger.warn('Insufficient content after subject extraction');
        return null;
    }
    // First line should be greeting
    const greeting = contentLines[0];
    // Last line should be closing
    const closing = contentLines[contentLines.length - 1];
    // Everything in between is body content
    const bodySections = contentLines.slice(1, -1).filter(line => line.length > 0);
    if (bodySections.length === 0) {
        logger.warn('No body content found in parsed email');
        return null;
    }
    return {
        subject,
        greeting,
        bodySections,
        closing
    };
}
/**
 * Check if refined draft has high severity issues that require fallback
 */
function hasHighSeverityIssues(checks, evalMetrics) {
    // High severity issues that trigger fallback:
    // 1. Multiple completeness failures
    const completenessIssues = checks.warnings.filter(w => w.startsWith('COMPLETENESS_')).length;
    // 2. Major professionalism issues
    const professionalismIssues = checks.warnings.filter(w => w.startsWith('PROFESSIONALISM_')).length;
    // 3. Ethical violations
    const ethicalIssues = checks.warnings.filter(w => w.startsWith('ETHICAL_')).length;
    // 4. Very low overall score
    const lowOverallScore = evalMetrics.overallScore < 30;
    const hasIssues = completenessIssues > 1 || professionalismIssues > 0 || ethicalIssues > 0 || lowOverallScore;
    if (hasIssues) {
        logger.warn('High severity issues detected in refined draft', {
            completenessIssues,
            professionalismIssues,
            ethicalIssues,
            overallScore: evalMetrics.overallScore
        });
    }
    return hasIssues;
}
/**
 * Refine email draft using LLM
 */
export async function refineWithLLM(draft, tone, category) {
    const startTime = Date.now();
    logger.info('Starting LLM refinement', {
        category,
        tone: tone,
        originalLength: JSON.stringify(draft).length
    });
    // Baseline evaluation for fallback comparison
    const baselineChecks = runChecks(draft, { text: '', tone });
    const baselineEval = evalDraft(draft, baselineChecks);
    try {
        // Generate prompts
        const systemPrompt = generateSystemPrompt();
        const userPrompt = generateUserPrompt(draft, tone, category);
        // Call LLM
        const llmParams = {
            systemPrompt,
            userPrompt,
            temperature: 0.7,
            maxTokens: 1000
        };
        const llmResponse = await llmClient.complete(llmParams);
        logger.debug('LLM response received', {
            responseLength: llmResponse.text.length,
            elapsedMs: Date.now() - startTime
        });
        // Parse LLM response
        const parsed = parseLLMResponse(llmResponse.text);
        if (!parsed) {
            logger.warn('Failed to parse LLM response, using fallback');
            return {
                draft,
                checks: baselineChecks,
                evalMetrics: baselineEval,
                wasRefined: false,
                usedFallback: true,
                refineWarnings: ['Failed to parse LLM response format']
            };
        }
        // Parse refined email
        const refinedDraft = parseEmailText(parsed.email);
        if (!refinedDraft) {
            logger.warn('Failed to parse refined email structure, using fallback');
            return {
                draft,
                checks: baselineChecks,
                evalMetrics: baselineEval,
                wasRefined: false,
                usedFallback: true,
                refineWarnings: ['Failed to parse refined email structure']
            };
        }
        // Evaluate refined draft
        const refinedChecks = runChecks(refinedDraft, { text: '', tone });
        const refinedEval = evalDraft(refinedDraft, refinedChecks);
        // Check for high severity issues
        if (hasHighSeverityIssues(refinedChecks, refinedEval)) {
            logger.warn('Refined draft has high severity issues, using fallback');
            return {
                draft,
                checks: baselineChecks,
                evalMetrics: baselineEval,
                wasRefined: false,
                usedFallback: true,
                refineWarnings: [
                    'Refined draft failed quality checks',
                    ...refinedChecks.warnings.slice(0, 3) // Include first few warnings
                ]
            };
        }
        // Success - return refined draft
        logger.info('LLM refinement completed successfully', {
            category,
            improvedScore: refinedEval.overallScore > baselineEval.overallScore,
            scoreChange: refinedEval.overallScore - baselineEval.overallScore,
            elapsedMs: Date.now() - startTime
        });
        return {
            draft: refinedDraft,
            checks: refinedChecks,
            evalMetrics: refinedEval,
            wasRefined: true,
            usedFallback: false,
            refineWarnings: []
        };
    }
    catch (error) {
        logger.error('LLM refinement failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            elapsedMs: Date.now() - startTime
        });
        return {
            draft,
            checks: baselineChecks,
            evalMetrics: baselineEval,
            wasRefined: false,
            usedFallback: true,
            refineWarnings: ['LLM service unavailable or failed']
        };
    }
}
//# sourceMappingURL=refine.js.map