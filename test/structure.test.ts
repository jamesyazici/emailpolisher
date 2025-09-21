import { describe, it, expect } from 'vitest';
import { enforceStructure } from '../src/services/structure.js';
import { DraftInput, EmailCategory, ToneSettings } from '../src/types/domain.js';

const defaultToneSettings: ToneSettings = {
  formality: 3,
  confidence: 3,
  seniority: 'student',
  length: 'medium'
};

describe('Email Structure Enforcement', () => {
  describe('networking category', () => {
    it('should create all required sections for networking email', () => {
      const input: DraftInput = {
        text: 'I want to connect with someone about AI research',
        tone: defaultToneSettings
      };
      
      const result = enforceStructure(input, 'networking');
      
      expect(result.subject).toBeDefined();
      expect(result.greeting).toBeDefined();
      expect(result.bodySections).toBeDefined();
      expect(result.closing).toBeDefined();
      
      // Should have intro, personalization, purpose, cta sections
      expect(result.bodySections).toHaveLength(4);
      
      // Check for placeholders
      expect(result.subject).toContain('{{topic}}');
      expect(result.greeting).toContain('{{recipient_name}}');
      expect(result.closing).toContain('{{sender_name}}');
      expect(result.closing).toContain('{{contact_block}}');
    });

    it('should use overrides when provided for networking', () => {
      const input: DraftInput = {
        text: 'Connect about ML',
        tone: defaultToneSettings,
        overrides: {
          recipient_name: 'Dr. Smith',
          sender_name: 'John Doe',
          topic: 'Machine Learning Research'
        }
      };
      
      const result = enforceStructure(input, 'networking');
      
      expect(result.subject).toBe('Introduction — Machine Learning Research');
      expect(result.greeting).toBe('Dear Dr. Smith,');
      expect(result.closing).toContain('John Doe');
      expect(result.closing).not.toContain('{{sender_name}}');
    });

    it('should maintain required networking sections', () => {
      const input: DraftInput = {
        text: 'networking email',
        tone: defaultToneSettings
      };
      
      const result = enforceStructure(input, 'networking');
      
      // Verify each section contains expected content
      const [intro, personalization, purpose, cta] = result.bodySections;
      
      expect(intro).toContain('{{sender_name}}');
      expect(intro).toContain('{{org}}');
      expect(personalization).toContain('{{recipient_work_ref}}');
      expect(purpose).toContain('{{email_goal}}');
      expect(cta).toContain('call');
    });
  });

  describe('followup category', () => {
    it('should create all required sections for followup email', () => {
      const input: DraftInput = {
        text: 'Following up on our conversation',
        tone: defaultToneSettings
      };
      
      const result = enforceStructure(input, 'followup');
      
      expect(result.subject).toBeDefined();
      expect(result.greeting).toBeDefined();
      expect(result.bodySections).toBeDefined();
      expect(result.closing).toBeDefined();
      
      // Should have context, purpose, cta sections
      expect(result.bodySections).toHaveLength(3);
      
      expect(result.subject).toContain('{{topic}}');
      expect(result.greeting).toContain('{{recipient_name}}');
    });

    it('should use overrides for followup emails', () => {
      const input: DraftInput = {
        text: 'follow up',
        tone: defaultToneSettings,
        overrides: {
          topic: 'Summer Internship',
          prior_contact_date: 'last Tuesday',
          recipient_name: 'Jane Smith'
        }
      };
      
      const result = enforceStructure(input, 'followup');
      
      expect(result.subject).toBe('Following up on Summer Internship');
      expect(result.greeting).toBe('Hello Jane Smith,');
      expect(result.bodySections[0]).toContain('last Tuesday');
      expect(result.bodySections[0]).toContain('Summer Internship');
    });

    it('should maintain required followup sections', () => {
      const input: DraftInput = {
        text: 'followup email',
        tone: defaultToneSettings
      };
      
      const result = enforceStructure(input, 'followup');
      
      const [context, purpose, cta] = result.bodySections;
      
      expect(context).toContain('{{prior_contact_date}}');
      expect(context).toContain('{{topic}}');
      expect(purpose).toContain('{{desired_outcome}}');
      expect(cta).toContain('details');
    });
  });

  describe('referral category', () => {
    it('should create all required sections for referral email', () => {
      const input: DraftInput = {
        text: 'Please refer me for this position',
        tone: defaultToneSettings
      };
      
      const result = enforceStructure(input, 'referral');
      
      expect(result.subject).toBeDefined();
      expect(result.greeting).toBeDefined();
      expect(result.bodySections).toBeDefined();
      expect(result.closing).toBeDefined();
      
      // Should have request and alignment sections
      expect(result.bodySections).toHaveLength(2);
      
      expect(result.subject).toContain('{{role_or_position}}');
      expect(result.greeting).toContain('{{recipient_name}}');
    });

    it('should use overrides for referral emails', () => {
      const input: DraftInput = {
        text: 'referral request',
        tone: defaultToneSettings,
        overrides: {
          role_or_position: 'Software Engineer',
          target_company: 'Google',
          recipient_name: 'Alex Johnson'
        }
      };
      
      const result = enforceStructure(input, 'referral');
      
      expect(result.subject).toBe('Referral Request — Software Engineer');
      expect(result.greeting).toBe('Hi Alex Johnson,');
      expect(result.bodySections[0]).toContain('Google');
      expect(result.bodySections[0]).toContain('Software Engineer');
    });

    it('should maintain required referral sections', () => {
      const input: DraftInput = {
        text: 'referral email',
        tone: defaultToneSettings
      };
      
      const result = enforceStructure(input, 'referral');
      
      const [request, alignment] = result.bodySections;
      
      expect(request).toContain('{{target_company}}');
      expect(request).toContain('{{role_or_position}}');
      expect(alignment).toContain('{{skills_or_projects}}');
    });
  });

  describe('thankyou category', () => {
    it('should create all required sections for thankyou email', () => {
      const input: DraftInput = {
        text: 'Thank you for your time',
        tone: defaultToneSettings
      };
      
      const result = enforceStructure(input, 'thankyou');
      
      expect(result.subject).toBeDefined();
      expect(result.greeting).toBeDefined();
      expect(result.bodySections).toBeDefined();
      expect(result.closing).toBeDefined();
      
      // Should have thanks and optional_future sections
      expect(result.bodySections).toHaveLength(2);
      
      expect(result.subject).toContain('{{topic}}');
      expect(result.greeting).toContain('{{recipient_name}}');
    });

    it('should use overrides for thankyou emails', () => {
      const input: DraftInput = {
        text: 'thank you',
        tone: defaultToneSettings,
        overrides: {
          topic: 'Interview',
          specific_reason: 'taking the time to interview me',
          recipient_name: 'Dr. Williams'
        }
      };
      
      const result = enforceStructure(input, 'thankyou');
      
      expect(result.subject).toBe('Thank You — Interview');
      expect(result.greeting).toBe('Dear Dr. Williams,');
      expect(result.bodySections[0]).toContain('taking the time to interview me');
    });

    it('should maintain required thankyou sections', () => {
      const input: DraftInput = {
        text: 'thankyou email',
        tone: defaultToneSettings
      };
      
      const result = enforceStructure(input, 'thankyou');
      
      const [thanks, optionalFuture] = result.bodySections;
      
      expect(thanks).toContain('{{specific_reason}}');
      expect(optionalFuture).toContain('staying in touch');
    });
  });

  describe('other category', () => {
    it('should create all required sections for other email', () => {
      const input: DraftInput = {
        text: 'I have a question about something',
        tone: defaultToneSettings
      };
      
      const result = enforceStructure(input, 'other');
      
      expect(result.subject).toBeDefined();
      expect(result.greeting).toBeDefined();
      expect(result.bodySections).toBeDefined();
      expect(result.closing).toBeDefined();
      
      // Should have purpose section
      expect(result.bodySections).toHaveLength(1);
      
      expect(result.subject).toContain('{{topic}}');
      expect(result.greeting).toContain('{{recipient_name}}');
    });

    it('should use overrides for other emails', () => {
      const input: DraftInput = {
        text: 'general question',
        tone: defaultToneSettings,
        overrides: {
          topic: 'Course Registration',
          message_purpose: 'I need clarification on the registration deadline',
          recipient_name: 'Professor Brown'
        }
      };
      
      const result = enforceStructure(input, 'other');
      
      expect(result.subject).toBe('Course Registration');
      expect(result.greeting).toBe('Hello Professor Brown,');
      expect(result.bodySections[0]).toBe('I need clarification on the registration deadline');
    });

    it('should maintain required other sections', () => {
      const input: DraftInput = {
        text: 'other email',
        tone: defaultToneSettings
      };
      
      const result = enforceStructure(input, 'other');
      
      const [purpose] = result.bodySections;
      
      expect(purpose).toContain('{{message_purpose}}');
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid category', () => {
      const input: DraftInput = {
        text: 'test email',
        tone: defaultToneSettings
      };
      
      expect(() => {
        enforceStructure(input, 'invalid' as EmailCategory);
      }).toThrow('Template not found for category: invalid');
    });
  });

  describe('placeholder handling', () => {
    it('should convert single braces to double braces for missing placeholders', () => {
      const input: DraftInput = {
        text: 'test',
        tone: defaultToneSettings,
        overrides: {
          recipient_name: 'John'
        }
      };
      
      const result = enforceStructure(input, 'networking');
      
      // recipient_name should be filled, others should be template placeholders
      expect(result.greeting).toBe('Dear John,');
      expect(result.subject).toBe('Introduction — {{topic}}');
      expect(result.bodySections[0]).toContain('{{sender_name}}');
      expect(result.bodySections[0]).toContain('{{org}}');
    });

    it('should handle multiple occurrences of the same placeholder', () => {
      const input: DraftInput = {
        text: 'test',
        tone: defaultToneSettings,
        overrides: {
          topic: 'AI Research'
        }
      };
      
      const result = enforceStructure(input, 'followup');
      
      expect(result.subject).toBe('Following up on AI Research');
      expect(result.bodySections[0]).toContain('AI Research');
    });
  });
});