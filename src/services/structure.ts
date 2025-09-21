import { DraftInput, DraftOutput, EmailCategory } from '../types/domain.js';
import { loadConfigSync } from '../utils/config.js';
import { z } from 'zod';

const TemplateSchema = z.object({
  required: z.array(z.string()),
  subject: z.string(),
  greeting: z.string(),
  closing: z.string(),
}).catchall(z.string());

const TemplatesConfigSchema = z.record(z.string(), TemplateSchema);

interface TemplateConfig {
  required: string[];
  [key: string]: any;
}

interface TemplatesConfig {
  [category: string]: TemplateConfig;
}

let templatesCache: TemplatesConfig | null = null;

function getTemplates(): TemplatesConfig {
  if (!templatesCache) {
    templatesCache = loadConfigSync('templates.json', TemplatesConfigSchema);
  }
  return templatesCache;
}

function extractPlaceholders(text: string): string[] {
  const matches = text.match(/{[^}]+}/g);
  return matches ? matches.map(match => match.slice(1, -1)) : [];
}

function extractKeyInformation(text: string, category: EmailCategory): Record<string, string> {
  const normalizedText = text.toLowerCase();
  const extracted: Record<string, string> = {};
  
  // Always use the original text as the core message purpose
  extracted.message_purpose = text;
  extracted.topic = text;
  
  // Category-specific extraction patterns
  switch (category) {
    case 'networking':
      extracted.email_goal = text;
      // Look for specific networking goals
      if (normalizedText.includes('internship')) {
        extracted.topic = 'Professional Networking Opportunity';
        extracted.email_goal = 'exploring internship opportunities';
      } else if (normalizedText.includes('job') || normalizedText.includes('position') || normalizedText.includes('role')) {
        extracted.topic = 'Professional Networking Opportunity';
        extracted.email_goal = 'exploring job opportunities';
      } else if (normalizedText.includes('research') || normalizedText.includes('ra')) {
        extracted.topic = 'Research Collaboration Opportunity';
        extracted.email_goal = 'exploring research opportunities';
      } else if (normalizedText.includes('coffee') || normalizedText.includes('chat') || normalizedText.includes('connect')) {
        extracted.topic = 'Professional Connection';
        extracted.email_goal = 'establishing a professional connection';
      } else {
        extracted.topic = 'Professional Networking';
        extracted.email_goal = 'professional networking and collaboration';
      }
      break;
      
    case 'followup':
      extracted.topic = normalizedText.includes('interview') ? 'Our Interview' : 
                       normalizedText.includes('meeting') ? 'Our Meeting' :
                       normalizedText.includes('conversation') ? 'Our Conversation' : 'Our Discussion';
      extracted.desired_outcome = text;
      extracted.prior_contact_date = 'last week';
      break;
      
    case 'referral':
      // Extract company and role information
      const companies = ['google', 'microsoft', 'amazon', 'meta', 'apple', 'netflix', 'facebook', 'tesla', 'uber', 'airbnb'];
      const foundCompany = companies.find(company => normalizedText.includes(company));
      if (foundCompany) {
        extracted.target_company = foundCompany.charAt(0).toUpperCase() + foundCompany.slice(1);
      }
      
      if (normalizedText.includes('software engineer') || normalizedText.includes('swe')) {
        extracted.role_or_position = 'Software Engineer position';
      } else if (normalizedText.includes('intern') || normalizedText.includes('internship')) {
        extracted.role_or_position = 'Software Engineering Internship';
      } else if (normalizedText.includes('research') || normalizedText.includes('ra ')) {
        extracted.role_or_position = 'Research Assistant position';
      } else if (normalizedText.includes('data scien')) {
        extracted.role_or_position = 'Data Scientist position';
      } else if (normalizedText.includes('position') || normalizedText.includes('role')) {
        // Extract the word before "position" or "role"
        const positionMatch = text.match(/(\w+)\s+(position|role)/i);
        if (positionMatch) {
          extracted.role_or_position = `${positionMatch[1]} ${positionMatch[2]}`;
        } else {
          extracted.role_or_position = 'the position';
        }
      } else {
        extracted.role_or_position = 'the position';
      }
      
      extracted.target_company = extracted.target_company || 'the company';
      extracted.skills_or_projects = 'relevant technical experience and projects';
      break;
      
    case 'thankyou':
      if (normalizedText.includes('interview')) {
        extracted.specific_reason = 'taking the time to interview me';
        extracted.topic = 'Interview Follow-up';
      } else if (normalizedText.includes('meeting')) {
        extracted.specific_reason = 'meeting with me';
        extracted.topic = 'Meeting Follow-up';
      } else if (normalizedText.includes('help') || normalizedText.includes('advice')) {
        extracted.specific_reason = 'your guidance and advice';
        extracted.topic = 'Thank You';
      } else {
        extracted.specific_reason = 'your time and assistance';
        extracted.topic = 'Thank You';
      }
      break;
      
    case 'other':
    default:
      // For other/general emails, use the input more directly
      extracted.topic = text.length > 50 ? 'Professional Inquiry' : text;
      break;
  }
  
  return extracted;
}

function fillPlaceholders(template: string, overrides: Record<string, string> = {}): string {
  let result = template;
  
  // Apply user overrides first
  Object.entries(overrides).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  });
  
  // Extract remaining placeholders and convert to template format
  const placeholders = extractPlaceholders(result);
  placeholders.forEach(placeholder => {
    const templatePlaceholder = `{{${placeholder}}}`;
    result = result.replace(new RegExp(`{${placeholder.replace(/[{}]/g, '\\$&')}}`, 'g'), templatePlaceholder);
  });
  
  return result;
}

export function enforceStructure(input: DraftInput, category: EmailCategory): DraftOutput {
  const templates = getTemplates();
  const categoryTemplate = templates[category];
  
  if (!categoryTemplate) {
    throw new Error(`Template not found for category: ${category}`);
  }
  
  // Extract key information from the user's input text
  const extractedInfo = extractKeyInformation(input.text, category);
  
  // Merge user overrides with extracted information (user overrides take precedence)
  const overrides = { ...extractedInfo, ...(input.overrides || {}) };
  
  // Extract subject
  const subject = fillPlaceholders(categoryTemplate.subject, overrides);
  
  // Extract greeting
  const greeting = fillPlaceholders(categoryTemplate.greeting, overrides);
  
  // Extract closing
  const closing = fillPlaceholders(categoryTemplate.closing, overrides);
  
  // Build body sections based on required fields (excluding subject, greeting, closing)
  const bodySections: string[] = [];
  const requiredFields = categoryTemplate.required.filter(
    field => field !== 'subject' && field !== 'greeting' && field !== 'closing'
  );
  
  requiredFields.forEach(field => {
    if (categoryTemplate[field]) {
      const section = fillPlaceholders(categoryTemplate[field], overrides);
      bodySections.push(section);
    }
  });
  
  // If no body sections were created, add a default purpose section
  if (bodySections.length === 0) {
    bodySections.push(fillPlaceholders('{message_purpose}', overrides));
  }
  
  return {
    subject,
    greeting,
    bodySections,
    closing
  };
}