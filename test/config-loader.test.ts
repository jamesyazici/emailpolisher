import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { loadConfig } from '../src/utils/config.js';
import { EmailCategorySchema } from '../src/types/domain.js';

const TemplatesSchema = z.record(
  EmailCategorySchema,
  z.object({
    required: z.array(z.string()),
    subject: z.string(),
    greeting: z.string(),
    closing: z.string(),
  }).catchall(z.string())
);

const StyleLexiconsSchema = z.object({
  formality: z.object({
    casual_to_formal: z.record(z.string(), z.string()),
  }),
  warmth: z.object({
    niceties: z.array(z.string()),
  }),
  confidence: z.object({
    hedges: z.array(z.string()),
    assertive: z.array(z.string()),
  }),
  seniority: z.object({
    student_additions: z.array(z.string()),
    professional_additions: z.array(z.string()),
  }),
});

const GuardrailsSchema = z.object({
  blacklist_phrases: z.array(z.string()),
  slang_regex: z.string(),
  emoji_regex: z.string(),
  attachment_keywords: z.array(z.string()),
  link_regex: z.string(),
});

const FewShotExampleSchema = z.object({
  rough: z.string(),
  polished: z.string(),
});

const FewShotsSchema = z.record(
  EmailCategorySchema,
  z.array(FewShotExampleSchema)
);

describe('Config File Loaders', () => {
  describe('templates.json', () => {
    it('should load and validate templates config', async () => {
      const templates = await loadConfig('templates.json', TemplatesSchema);
      
      expect(templates).toBeDefined();
      expect(typeof templates).toBe('object');
    });

    it('should have all email categories in templates', async () => {
      const templates = await loadConfig('templates.json', TemplatesSchema);
      const expectedCategories: Array<keyof typeof templates> = ['networking', 'followup', 'referral', 'thankyou', 'other'];
      
      for (const category of expectedCategories) {
        expect(templates[category]).toBeDefined();
        expect(templates[category].subject).toBeDefined();
        expect(templates[category].greeting).toBeDefined();
        expect(templates[category].closing).toBeDefined();
        expect(templates[category].required).toBeDefined();
        expect(Array.isArray(templates[category].required)).toBe(true);
        expect(templates[category].required.length).toBeGreaterThan(0);
      }
    });
  });

  describe('style_lexicons.json', () => {
    it('should load and validate style lexicons config', async () => {
      const lexicons = await loadConfig('style_lexicons.json', StyleLexiconsSchema);
      
      expect(lexicons).toBeDefined();
      expect(typeof lexicons).toBe('object');
    });

    it('should have all required style sections', async () => {
      const lexicons = await loadConfig('style_lexicons.json', StyleLexiconsSchema);
      
      expect(lexicons.formality).toBeDefined();
      expect(Object.keys(lexicons.formality.casual_to_formal).length).toBeGreaterThan(0);
      
      expect(lexicons.warmth).toBeDefined();
      expect(lexicons.warmth.niceties.length).toBeGreaterThan(0);
      
      expect(lexicons.confidence).toBeDefined();
      expect(lexicons.confidence.hedges.length).toBeGreaterThan(0);
      expect(lexicons.confidence.assertive.length).toBeGreaterThan(0);
      
      expect(lexicons.seniority).toBeDefined();
      expect(lexicons.seniority.student_additions.length).toBeGreaterThan(0);
      expect(lexicons.seniority.professional_additions.length).toBeGreaterThan(0);
    });
  });

  describe('guardrails.json', () => {
    it('should load and validate guardrails config', async () => {
      const guardrails = await loadConfig('guardrails.json', GuardrailsSchema);
      
      expect(guardrails).toBeDefined();
      expect(typeof guardrails).toBe('object');
    });

    it('should have all required guardrail rules', async () => {
      const guardrails = await loadConfig('guardrails.json', GuardrailsSchema);
      
      expect(Array.isArray(guardrails.blacklist_phrases)).toBe(true);
      expect(guardrails.blacklist_phrases.length).toBeGreaterThan(0);
      
      expect(typeof guardrails.slang_regex).toBe('string');
      expect(guardrails.slang_regex.length).toBeGreaterThan(0);
      
      expect(typeof guardrails.emoji_regex).toBe('string');
      expect(guardrails.emoji_regex.length).toBeGreaterThan(0);
      
      expect(Array.isArray(guardrails.attachment_keywords)).toBe(true);
      expect(guardrails.attachment_keywords.length).toBeGreaterThan(0);
      
      expect(typeof guardrails.link_regex).toBe('string');
      expect(guardrails.link_regex.length).toBeGreaterThan(0);
    });

    it('should have valid regex patterns', async () => {
      const guardrails = await loadConfig('guardrails.json', GuardrailsSchema);
      
      expect(() => new RegExp(guardrails.slang_regex)).not.toThrow();
      expect(() => new RegExp(guardrails.emoji_regex, 'u')).not.toThrow();
      expect(() => new RegExp(guardrails.link_regex)).not.toThrow();
    });
  });

  describe('few_shots.json', () => {
    it('should load and validate few shots config', async () => {
      const fewShots = await loadConfig('few_shots.json', FewShotsSchema);
      
      expect(fewShots).toBeDefined();
      expect(typeof fewShots).toBe('object');
    });

    it('should have examples for all email categories', async () => {
      const fewShots = await loadConfig('few_shots.json', FewShotsSchema);
      const expectedCategories: Array<keyof typeof fewShots> = ['networking', 'followup', 'referral', 'thankyou', 'other'];
      
      for (const category of expectedCategories) {
        expect(fewShots[category]).toBeDefined();
        expect(Array.isArray(fewShots[category])).toBe(true);
        expect(fewShots[category].length).toBeGreaterThan(0);
        
        for (const example of fewShots[category]) {
          expect(example.rough).toBeDefined();
          expect(example.polished).toBeDefined();
          expect(typeof example.rough).toBe('string');
          expect(typeof example.polished).toBe('string');
          expect(example.rough.length).toBeGreaterThan(0);
          expect(example.polished.length).toBeGreaterThan(0);
        }
      }
    });

    it('should have at least 3 examples per category', async () => {
      const fewShots = await loadConfig('few_shots.json', FewShotsSchema);
      const expectedCategories: Array<keyof typeof fewShots> = ['networking', 'followup', 'referral', 'thankyou', 'other'];
      
      for (const category of expectedCategories) {
        expect(fewShots[category].length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('Cross-config validation', () => {
    it('should have consistent email categories across all configs', async () => {
      const templates = await loadConfig('templates.json', TemplatesSchema);
      const fewShots = await loadConfig('few_shots.json', FewShotsSchema);
      
      const templateCategories = Object.keys(templates).sort();
      const fewShotCategories = Object.keys(fewShots).sort();
      
      expect(templateCategories).toEqual(fewShotCategories);
    });
  });
});