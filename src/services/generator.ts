import { DraftInput, DraftOutput, EmailCategory, ToneSettings } from '../types/domain.js';
import { categorize } from './categorize.js';
import { validateAndImproveEmail } from './emailValidator.js';

interface EmailContent {
  subject: string;
  greeting: string;
  bodySections: string[];
  closing: string;
}

/**
 * Generate completely custom emails based on user input and context
 */
export function generateCustomEmail(input: DraftInput): DraftOutput {
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
function generateContentFromInput(text: string, category: EmailCategory, tone: ToneSettings): EmailContent {
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
function extractContext(originalText: string, normalizedText: string) {
  const context: any = {
    originalText,
    normalizedText,
    specificMentions: [],
    intent: 'general',
    company: null,
    school: null,
    connection: null,
    specific_reason: null,
    timeframe: null
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
  } else if (normalizedText.includes('internship')) {
    context.intent = 'internship';
  } else if (normalizedText.includes('call') || normalizedText.includes('talk')) {
    context.intent = 'conversation';
  } else if (normalizedText.includes('connect')) {
    context.intent = 'networking';
  }
  
  // Extract timeframe
  if (normalizedText.includes('soon')) {
    context.timeframe = 'soon';
  } else if (normalizedText.includes('next week')) {
    context.timeframe = 'next week';
  }
  
  // Extract specific reasons
  if (normalizedText.includes('what it\'s like') || normalizedText.includes('what its like')) {
    context.specific_reason = 'learn about the experience';
  }
  
  return context;
}

/**
 * Generate dynamic subject line based on context
 */
function generateSubject(context: any, category: EmailCategory, tone: ToneSettings): string {
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
function generateGreeting(tone: ToneSettings): string {
  if (tone.formality >= 4) {
    return 'Dear [Recipient Name],';
  } else if (tone.formality >= 3) {
    return 'Hello [Recipient Name],';
  } else {
    return 'Hi [Recipient Name],';
  }
}

/**
 * Generate body content based on specific context and input
 */
function generateBody(context: any, category: EmailCategory, tone: ToneSettings, originalText: string): string[] {
  const sections: string[] = [];
  
  // Introduction section
  const intro = generateIntroduction(context, tone);
  if (intro) sections.push(intro);
  
  // Connection/context section  
  const connectionSection = generateConnectionSection(context, tone);
  if (connectionSection) sections.push(connectionSection);
  
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
function generateIntroduction(context: any, tone: ToneSettings): string | null {
  // Always start with a natural greeting
  let intro = "I hope this message finds you well.";
  
  // Add specific context if we have meaningful information
  if (context.school && tone.seniority === 'student') {
    intro += ` My name is [Your Name], and I'm currently a student at ${context.school.charAt(0).toUpperCase() + context.school.slice(1)}.`;
  } else if (tone.seniority === 'student') {
    intro += " My name is [Your Name], and I'm a student interested in professional opportunities.";
  } else if (tone.formality >= 4) {
    intro += " My name is [Your Name], and I'm a professional in the field.";
  } else {
    // For casual/medium formality, just the greeting is enough
    return intro;
  }
  
  return intro;
}

/**
 * Generate connection/context section
 */
function generateConnectionSection(context: any, tone: ToneSettings): string | null {
  if (context.company && context.school && context.connection) {
    return `I just discovered that you work at ${context.company.charAt(0).toUpperCase() + context.company.slice(1)} and are also a ${context.school.charAt(0).toUpperCase() + context.school.slice(1)} alumnus, which is an exciting connection since I'm currently studying there.`;
  }
  
  if (context.company && context.connection) {
    return `I noticed that you work at ${context.company.charAt(0).toUpperCase() + context.company.slice(1)}, which caught my attention.`;
  }
  
  return null;
}

/**
 * Generate main purpose section based on intent
 */
function generatePurposeSection(context: any, tone: ToneSettings, originalText: string): string {
  if (context.intent === 'research_assistant') {
    return 'I am writing to inquire about research assistant opportunities in your lab. I am very interested in contributing to your research and would appreciate the chance to discuss how my background and interests align with your current projects.';
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
  
  if (context.intent === 'networking' && context.company) {
    return `I am interested in learning more about ${context.company.charAt(0).toUpperCase() + context.company.slice(1)} and would value the chance to connect with professionals in the organization to better understand the company culture and potential opportunities.`;
  }
  
  // Fallback: create a more natural version
  let purpose = originalText.toLowerCase();
  
  // Clean up the purpose statement
  purpose = purpose.replace(/^(can i|could i|may i)/, 'I would like to');
  purpose = purpose.replace(/^i want to/, 'I am interested in');
  purpose = purpose.replace(/^i need to/, 'I would like to');
  
  // Fix common phrase issues
  purpose = purpose.replace('how i contribute', 'how I might contribute');
  purpose = purpose.replace('how i might', 'how I might');
  
  // Ensure it starts with "I am" for consistency
  if (!purpose.startsWith('i am') && !purpose.startsWith('i would')) {
    purpose = `I am writing to inquire about ${purpose}`;
  }
  
  // Capitalize first letter
  return purpose.charAt(0).toUpperCase() + purpose.slice(1) + '.';
}

/**
 * Generate call to action based on context
 */
function generateCallToAction(context: any, tone: ToneSettings): string {
  if (context.timeframe === 'soon') {
    return 'Would you be available for a brief call sometime soon to discuss this further?';
  }
  
  if (context.intent === 'conversation') {
    return 'Would you be open to a brief coffee chat or phone call in the coming weeks?';
  }
  
  if (context.intent === 'research_assistant') {
    return 'I would be grateful for the opportunity to discuss how I might contribute to your research and learn more about available positions.';
  }
  
  if (tone.formality >= 4) {
    return 'I would greatly appreciate the opportunity to speak with you at your convenience.';
  } else {
    return 'Would you be open to a brief conversation about this?';
  }
}

/**
 * Generate closing based on formality
 */
function generateClosing(tone: ToneSettings): string {
  if (tone.formality >= 4) {
    return 'Sincerely,\n[Your Name]';
  } else if (tone.formality >= 3) {
    return 'Best regards,\n[Your Name]';
  } else {
    return 'Thanks,\n[Your Name]';
  }
}