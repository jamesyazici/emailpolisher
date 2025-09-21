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
  
  const overrides = input.overrides || {};
  
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