import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { DraftInput, ToneSettings } from '../src/types/domain.js';

const defaultTone: ToneSettings = {
  formality: 3,
  confidence: 3,
  seniority: 'student',
  length: 'medium'
};

describe('POST /draft', () => {
  describe('successful requests', () => {
    it('should process networking email correctly', async () => {
      const payload: DraftInput = {
        text: "I would like to connect with you and learn about your career path in software engineering. I'm a computer science student interested in your work.",
        tone: defaultTone
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200);

      expect(response.body).toHaveProperty('draft');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('meta');

      expect(response.body.meta.category).toBe('networking');
      expect(response.body.meta.matchedRules).toContain('connect');
      
      expect(response.body.draft.subject).toBeDefined();
      expect(response.body.draft.greeting).toBeDefined();
      expect(response.body.draft.bodySections).toBeInstanceOf(Array);
      expect(response.body.draft.bodySections.length).toBeGreaterThan(0);
      expect(response.body.draft.closing).toBeDefined();

      expect(response.body.checks.completeness).toBe(true);
      expect(response.body.checks.professionalism).toBe(true);
      expect(response.body.checks.clarity).toBe(true);
      expect(response.body.checks.ethical).toBe(true);
      expect(response.body.checks.warnings).toBeInstanceOf(Array);
    });

    it('should process followup email correctly', async () => {
      const payload: DraftInput = {
        text: "Following up on our conversation last week about the internship opportunity. I wanted to check if you need any additional information from me.",
        tone: defaultTone
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200);

      expect(response.body.meta.category).toBe('followup');
      expect(response.body.meta.matchedRules).toContain('following up');
      expect(response.body.draft.bodySections).toHaveLength(3); // followup template has 3 body sections
      expect(response.body.checks.completeness).toBe(true);
    });

    it('should process referral email correctly', async () => {
      const payload: DraftInput = {
        text: "John Smith referred me to you regarding the software developer position.",
        tone: defaultTone,
        overrides: {
          target_company: 'TechCorp',
          role_or_position: 'Senior Developer'
        }
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200);

      expect(response.body.meta.category).toBe('referral');
      expect(response.body.meta.matchedRules).toEqual(expect.arrayContaining(['position']));
      expect(response.body.draft.bodySections).toHaveLength(2); // referral template has 2 body sections
      expect(response.body.draft.subject).toContain('Senior Developer'); // Should use role_or_position override
      expect(response.body.draft.bodySections[0]).toContain('TechCorp'); // target_company should be in request body section
      expect(response.body.checks.completeness).toBe(false); // Missing CTA in referral template
    });

    it('should process thankyou email correctly', async () => {
      const payload: DraftInput = {
        text: "Thank you so much for taking the time to meet with me yesterday. I really appreciated learning about your team.",
        tone: defaultTone
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200);

      expect(response.body.meta.category).toBe('thankyou');
      expect(response.body.meta.matchedRules).toContain('thank you');
      expect(response.body.draft.bodySections).toHaveLength(2); // thankyou template has 2 body sections
      expect(response.body.checks.completeness).toBe(true);
    });

    it('should process other category email correctly', async () => {
      const payload: DraftInput = {
        text: "I am writing to inquire about the curriculum requirements for the graduate program. Could you provide information?",
        tone: defaultTone,
        overrides: {
          message_purpose: "Could you please provide information about course prerequisites and requirements?"
        }
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200);

      expect(response.body.meta.category).toBe('other');
      expect(response.body.draft.bodySections).toHaveLength(1); // other template has 1 body section
      expect(response.body.checks.completeness).toBe(true); // Should have CTA with "please"
    });
  });

  describe('tone variations', () => {
    it('should apply high formality and confidence correctly', async () => {
      const payload: DraftInput = {
        text: "I think maybe we could work together on this project",
        tone: {
          formality: 5,
          confidence: 5,
          seniority: 'professional',
          length: 'long'
        }
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200);

      // Check that style transformations were applied
      expect(response.body.draft.subject).not.toContain('maybe');
      expect(response.body.draft.bodySections.some((section: string) => 
        section.includes('confident') || section.includes('collaborate')
      )).toBe(true);
    });

    it('should apply low formality correctly', async () => {
      const payload: DraftInput = {
        text: "I recommend we schedule a meeting to discuss this opportunity",
        tone: {
          formality: 1,
          confidence: 1,
          seniority: 'student',
          length: 'short'
        }
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200);

      // Should preserve casual language and apply student seniority
      expect(response.body.draft.bodySections.some((section: string) => 
        section.includes('eager to learn')
      )).toBe(true);
    });
  });

  describe('validation checks integration', () => {
    it('should detect professionalism issues in processed draft', async () => {
      const payload: DraftInput = {
        text: "I would like to connect with you about the opportunity",
        tone: defaultTone,
        overrides: {
          topic: "OMG amazing opportunity lol 😊",
          recipient_name: "LOL hey there dude"
        }
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200);

      expect(response.body.checks.professionalism).toBe(false);
      expect(response.body.checks.warnings).toContain('PROFESSIONALISM_SLANG_DETECTED');
      expect(response.body.checks.warnings).toContain('PROFESSIONALISM_EMOJI_DETECTED');
    });

    it('should detect ethical issues in processed draft', async () => {
      const payload: DraftInput = {
        text: "I would like to connect with you about the opportunity",
        tone: defaultTone,
        overrides: {
          email_goal: "I guarantee you'll get the job if you hire me. I am desperate for this position."
        }
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200);

      expect(response.body.checks.ethical).toBe(false);
      expect(response.body.checks.warnings).toContain('ETHICAL_OVERPROMISE_DETECTED');
      expect(response.body.checks.warnings).toContain('ETHICAL_INAPPROPRIATE_TERM');
    });
  });

  describe('error handling', () => {
    it('should return 400 for missing required fields', async () => {
      const invalidPayload = {
        // Missing text field
        tone: defaultTone
      };

      const response = await request(app)
        .post('/draft')
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toBeInstanceOf(Array);
      
      const textError = response.body.details.find((err: any) => err.path.includes('text'));
      expect(textError).toBeDefined();
    });

    it('should return 400 for invalid tone values', async () => {
      const invalidPayload: any = {
        text: "Hello world",
        tone: {
          formality: 6, // Invalid: should be 1-5
          confidence: 3,
          seniority: 'student',
          length: 'medium'
        }
      };

      const response = await request(app)
        .post('/draft')
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toBeInstanceOf(Array);
      
      const formalityError = response.body.details.find((err: any) => 
        err.path.includes('formality')
      );
      expect(formalityError).toBeDefined();
    });

    it('should return 400 for invalid seniority value', async () => {
      const invalidPayload: any = {
        text: "Hello world",
        tone: {
          formality: 3,
          confidence: 3,
          seniority: 'invalid', // Invalid enum value
          length: 'medium'
        }
      };

      const response = await request(app)
        .post('/draft')
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toBeInstanceOf(Array);
      
      const seniorityError = response.body.details.find((err: any) => 
        err.path.includes('seniority')
      );
      expect(seniorityError).toBeDefined();
    });

    it('should return 400 for invalid length value', async () => {
      const invalidPayload: any = {
        text: "Hello world",
        tone: {
          formality: 3,
          confidence: 3,
          seniority: 'student',
          length: 'extra-long' // Invalid enum value
        }
      };

      const response = await request(app)
        .post('/draft')
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toBeInstanceOf(Array);
      
      const lengthError = response.body.details.find((err: any) => 
        err.path.includes('length')
      );
      expect(lengthError).toBeDefined();
    });

    it('should return 400 for empty text', async () => {
      const invalidPayload: DraftInput = {
        text: "", // Empty text
        tone: defaultTone
      };

      const response = await request(app)
        .post('/draft')
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toBeInstanceOf(Array);
      
      const textError = response.body.details.find((err: any) => 
        err.path.includes('text') && err.code === 'too_small'
      );
      expect(textError).toBeDefined();
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/draft')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Express will handle malformed JSON before our route handler
      expect(response.body).toBeDefined();
    });

    it('should handle missing Content-Type header', async () => {
      const payload: DraftInput = {
        text: "Hello world",
        tone: defaultTone
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200); // Should still work with express.json() middleware

      expect(response.body).toHaveProperty('draft');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('meta');
    });
  });

  describe('complex scenarios', () => {
    it('should handle complete workflow with all features', async () => {
      const payload: DraftInput = {
        text: "Following up on our conversation last week about the internship",
        tone: {
          formality: 4,
          confidence: 4,
          seniority: 'professional',
          length: 'medium'
        },
        overrides: {
          recipient_name: 'Dr. Johnson',
          sender_name: 'Alex Chen',
          topic: 'Software Engineering Internship'
        }
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200);

      // Verify all pipeline stages worked
      expect(response.body.meta.category).toBe('followup');
      expect(response.body.draft.greeting).toContain('Dr. Johnson');
      expect(response.body.draft.closing).toContain('Alex Chen');
      expect(response.body.draft.subject).toContain('Software Engineering Internship');
      
      // Verify style was applied
      expect(response.body.draft.bodySections.some((section: string) => 
        section.includes('collaborate') || section.includes('working together')
      )).toBe(true);
      
      // Verify checks passed
      expect(response.body.checks.completeness).toBe(true);
      expect(response.body.checks.professionalism).toBe(true);
      expect(response.body.checks.clarity).toBe(true);
      expect(response.body.checks.ethical).toBe(true);
    });

    it('should handle edge case with minimal content', async () => {
      const payload: DraftInput = {
        text: "Hi",
        tone: {
          formality: 1,
          confidence: 1,
          seniority: 'student',
          length: 'short'
        }
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200);

      expect(response.body.meta.category).toBe('other'); // Should default to other
      expect(response.body.draft.subject).toBeDefined();
      expect(response.body.draft.greeting).toBeDefined();
      expect(response.body.draft.bodySections).toBeInstanceOf(Array);
      expect(response.body.draft.closing).toBeDefined();
    });

    it('should handle overrides with special characters', async () => {
      const payload: DraftInput = {
        text: "Thank you for the opportunity",
        tone: defaultTone,
        overrides: {
          recipient_name: 'José María González',
          sender_name: 'Alex O\'Connor',
          topic: 'Position @ Tech-Company #1'
        }
      };

      const response = await request(app)
        .post('/draft')
        .send(payload)
        .expect(200);

      expect(response.body.draft.greeting).toContain('José María González');
      expect(response.body.draft.closing).toContain("Alex O'Connor");
      expect(response.body.draft.subject).toContain('Position @ Tech-Company #1');
    });
  });
});