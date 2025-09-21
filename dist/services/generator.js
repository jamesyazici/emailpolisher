import { categorize } from './categorize.js';
import { validateAndImproveEmail } from './emailValidator.js';
/**
 * Generate completely custom emails based on user input and context
 */
export function generateCustomEmail(input) {
    const categorization = categorize(input.text);
    const content = generateContentFromInput(input.text, categorization.category, input.tone);
    const initialEmail = {
        subject: content.subject,
        greeting: content.greeting,
        bodySections: content.bodySections,
        closing: content.closing
    };
    // Validate and improve the generated email
    return validateAndImproveEmail(initialEmail);
}
/**
 * Generate email content dynamically based on the specific user input
 */
function generateContentFromInput(text, category, tone) {
    const normalizedText = text.toLowerCase();
    const context = extractContext(text, normalizedText);
    // Generate subject line based on specific context
    const subject = generateSubject(context, category, tone);
    // Generate greeting based on formality
    const greeting = generateGreeting(tone);
    // Generate body content based on the specific input
    const bodySections = generateBody(context, category, tone, text);
    // Generate closing based on formality
    const closing = generateClosing(tone);
    return { subject, greeting, bodySections, closing };
}
/**
 * Extract specific context and intent from user input
 */
function extractContext(originalText, normalizedText) {
    const context = {
        originalText,
        normalizedText,
        specificMentions: [],
        intent: 'general',
        company: null,
        school: null,
        connection: null,
        specific_reason: null,
        timeframe: null,
        research_mention: null,
        business_mention: null,
        specific_interest: null
    };
    // Extract companies
    const companies = ['microsoft', 'google', 'amazon', 'meta', 'apple', 'tesla', 'netflix', 'uber', 'airbnb', 'facebook'];
    context.company = companies.find(company => normalizedText.includes(company));
    // Extract schools
    const schools = ['rutgers', 'mit', 'stanford', 'berkeley', 'carnegie mellon', 'georgia tech'];
    context.school = schools.find(school => normalizedText.includes(school));
    // Extract specific connections
    if (normalizedText.includes('went to') && context.school) {
        context.connection = `shared alma mater (${context.school})`;
    }
    if (normalizedText.includes('work at') && context.company) {
        context.connection = `works at ${context.company}`;
    }
    // Extract intent
    if (normalizedText.includes('ra') || normalizedText.includes('research assistant')) {
        context.intent = 'research_assistant';
    }
    else if (normalizedText.includes('internship')) {
        context.intent = 'internship';
    }
    else if (normalizedText.includes('call') || normalizedText.includes('talk')) {
        context.intent = 'conversation';
    }
    else if (normalizedText.includes('connect')) {
        context.intent = 'networking';
    }
    // Extract timeframe
    if (normalizedText.includes('soon')) {
        context.timeframe = 'soon';
    }
    else if (normalizedText.includes('next week')) {
        context.timeframe = 'next week';
    }
    // Extract specific reasons
    if (normalizedText.includes('what it\'s like') || normalizedText.includes('what its like')) {
        context.specific_reason = 'learn about the experience';
    }
    // Extract research mentions
    if (normalizedText.includes('saw your research') || normalizedText.includes('your research')) {
        context.research_mention = 'saw your research';
        if (normalizedText.includes('interesting') || normalizedText.includes('fascinating')) {
            context.specific_interest = 'found it very interesting';
        }
    }
    // Extract business mentions
    if (normalizedText.includes('energy business') || normalizedText.includes('own a business')) {
        context.business_mention = 'energy business';
    }
    if (normalizedText.includes('work together') || normalizedText.includes('collaborate')) {
        context.intent = 'collaboration';
    }
    return context;
}
/**
 * Generate dynamic subject line based on context
 */
function generateSubject(context, category, tone) {
    if (context.company && context.school && context.connection) {
        return `Fellow ${context.school.charAt(0).toUpperCase() + context.school.slice(1)} Alum — ${context.company.charAt(0).toUpperCase() + context.company.slice(1)} Connection`;
    }
    if (context.intent === 'research_assistant') {
        return 'Research Assistant Opportunity Inquiry';
    }
    if (context.intent === 'internship' && context.company) {
        return `${context.company.charAt(0).toUpperCase() + context.company.slice(1)} Internship Inquiry`;
    }
    if (context.intent === 'conversation' && context.company) {
        return `Coffee Chat About ${context.company.charAt(0).toUpperCase() + context.company.slice(1)}`;
    }
    if (context.company) {
        return `Professional Connection — ${context.company.charAt(0).toUpperCase() + context.company.slice(1)}`;
    }
    // Default based on category
    const subjects = {
        networking: 'Professional Networking Opportunity',
        followup: 'Following Up on Our Previous Conversation',
        referral: 'Referral Request',
        thankyou: 'Thank You',
        other: 'Professional Inquiry'
    };
    return subjects[category] || 'Professional Inquiry';
}
/**
 * Generate greeting based on formality level
 */
function generateGreeting(tone) {
    if (tone.formality >= 4) {
        return 'Dear [Recipient Name],';
    }
    else if (tone.formality >= 3) {
        return 'Hello [Recipient Name],';
    }
    else {
        return 'Hi [Recipient Name],';
    }
}
/**
 * Generate body content based on specific context and input
 */
function generateBody(context, category, tone, originalText) {
    const sections = [];
    // Introduction section
    const intro = generateIntroduction(context, tone);
    if (intro)
        sections.push(intro);
    // Research interest section (if applicable)
    const researchSection = generateResearchSection(context, tone);
    if (researchSection)
        sections.push(researchSection);
    // Connection/context section  
    const connectionSection = generateConnectionSection(context, tone);
    if (connectionSection)
        sections.push(connectionSection);
    // Main purpose section
    const purposeSection = generatePurposeSection(context, tone, originalText);
    sections.push(purposeSection);
    // Call to action
    const ctaSection = generateCallToAction(context, tone);
    sections.push(ctaSection);
    return sections;
}
/**
 * Generate natural introduction based on context
 */
function generateIntroduction(context, tone) {
    // Always start with a natural greeting
    let intro = "I hope this message finds you well.";
    // Add specific context if we have meaningful information
    if (context.school && tone.seniority === 'student') {
        intro += ` My name is [Your Name], and I'm currently a student at ${context.school.charAt(0).toUpperCase() + context.school.slice(1)}.`;
    }
    else if (tone.seniority === 'student') {
        intro += " My name is [Your Name], and I'm a student interested in professional opportunities.";
    }
    else if (tone.formality >= 4) {
        intro += " My name is [Your Name], and I'm a professional in the field.";
    }
    else {
        // For casual/medium formality, just the greeting is enough
        return intro;
    }
    return intro;
}
/**
 * Generate research interest section if user mentioned research
 */
function generateResearchSection(context, tone) {
    if (context.research_mention) {
        if (context.specific_interest) {
            return "I recently came across some of your research work and found it incredibly fascinating.";
        }
        else {
            return "I recently came across some of your research work and was very impressed.";
        }
    }
    return null;
}
/**
 * Generate connection/context section
 */
function generateConnectionSection(context, tone) {
    if (context.company && context.school && context.connection) {
        return `I just discovered that you work at ${context.company.charAt(0).toUpperCase() + context.company.slice(1)} and are also a ${context.school.charAt(0).toUpperCase() + context.school.slice(1)} alumnus, which is an exciting connection since I'm currently studying there.`;
    }
    if (context.company && context.connection) {
        return `I noticed that you work at ${context.company.charAt(0).toUpperCase() + context.company.slice(1)}, which caught my attention.`;
    }
    if (context.business_mention) {
        return `I noticed that you own an energy business, and I believe there may be some interesting opportunities for collaboration.`;
    }
    return null;
}
/**
 * Generate main purpose section based on intent - completely rewritten
 */
function generatePurposeSection(context, tone, originalText) {
    // Handle specific intent patterns intelligently
    if (context.intent === 'research_assistant') {
        return 'I am writing to inquire about research assistant opportunities in your lab. I am very interested in contributing to your research and would appreciate the chance to discuss how my background and interests align with your current projects.';
    }
    if (context.intent === 'collaboration' && context.business_mention) {
        return 'I have a business proposition that I believe could be mutually beneficial. Would you be interested in exploring a potential collaboration between our businesses to create something impactful in the energy sector?';
    }
    // Handle software engineering specifically
    if (originalText.toLowerCase().includes('software engineering') && originalText.toLowerCase().includes('your team')) {
        return 'I am a software engineer interested in learning more about your team and how I might contribute to your projects. I would appreciate the opportunity to discuss potential opportunities with your organization.';
    }
    if (context.intent === 'internship' && context.company) {
        return `I am currently seeking internship opportunities and am particularly drawn to ${context.company.charAt(0).toUpperCase() + context.company.slice(1)}. I would welcome the opportunity to learn more about potential openings and discuss how I might contribute to your team.`;
    }
    if (context.intent === 'conversation' && context.specific_reason) {
        if (context.company) {
            return `I am very interested in learning more about ${context.company.charAt(0).toUpperCase() + context.company.slice(1)} and would greatly appreciate the opportunity to ${context.specific_reason} from someone with your experience.`;
        }
        return `I would greatly appreciate the opportunity to ${context.specific_reason} and learn about your career journey.`;
    }
    // For general networking without specific company
    if (originalText.toLowerCase().includes('connect') && originalText.toLowerCase().includes('opportunities')) {
        return 'I am interested in connecting with professionals in your field to learn more about potential opportunities and how I might contribute to innovative projects.';
    }
    // Handle research assistant requests more naturally
    if (originalText.toLowerCase().includes('work as an ra') || originalText.toLowerCase().includes('be an ra')) {
        return 'I am very interested in research opportunities and would love to explore the possibility of joining your research team as a research assistant.';
    }
    // Fallback: create a completely rewritten version
    const normalizedInput = originalText.toLowerCase();
    if (normalizedInput.includes('question') && normalizedInput.includes('work together')) {
        return 'I have a question about potential collaboration opportunities. Would you be interested in exploring ways our businesses could work together?';
    }
    // Last resort: create a professional version of their intent
    return 'I am reaching out to discuss a potential opportunity that I believe could be of mutual interest.';
}
/**
 * Generate call to action based on context
 */
function generateCallToAction(context, tone) {
    if (context.timeframe === 'soon') {
        return 'Would you be available for a brief call sometime soon to discuss this further?';
    }
    if (context.intent === 'conversation') {
        return 'Would you be open to a brief coffee chat or phone call in the coming weeks?';
    }
    if (context.intent === 'research_assistant') {
        return 'I would be grateful for the opportunity to discuss how I might contribute to your research and learn more about available positions.';
    }
    if (context.intent === 'collaboration') {
        return 'I would welcome the opportunity to discuss this further at your convenience.';
    }
    if (tone.formality >= 4) {
        return 'I would greatly appreciate the opportunity to speak with you at your convenience.';
    }
    else {
        return 'Would you be open to a brief conversation about this?';
    }
}
/**
 * Generate closing based on formality
 */
function generateClosing(tone) {
    if (tone.formality >= 4) {
        return 'Sincerely,\n[Your Name]';
    }
    else if (tone.formality >= 3) {
        return 'Best regards,\n[Your Name]';
    }
    else {
        return 'Thanks,\n[Your Name]';
    }
}
//# sourceMappingURL=generator.js.map