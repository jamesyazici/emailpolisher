import { describe, it, expect } from 'vitest';
import { processDraft } from '../src/services/pipeline.js';
import { DraftInput, ToneSettings } from '../src/types/domain.js';

const defaultTone: ToneSettings = {
  formality: 3,
  confidence: 3,
  seniority: 'student',
  length: 'medium'
};

describe('Pipeline Integration', () => {
  describe('snapshot tests by category', () => {
    it('should process networking email correctly', () => {
      const input: DraftInput = {
        text: "I would like to connect with you and learn about your career path in software engineering. I'm a computer science student interested in your work.",
        tone: defaultTone
      };

      const result = processDraft(input);

      expect(result).toMatchSnapshot();
      expect(result.meta.category).toBe('networking');
      expect(result.meta.matchedRules).toContain('connect');
      expect(result.draft.subject).toBeDefined();
      expect(result.draft.greeting).toBeDefined();
      expect(result.draft.bodySections).toHaveLength(4);
      expect(result.draft.closing).toBeDefined();
      expect(result.checks.completeness).toBe(true);
    });

    it('should process followup email correctly', () => {
      const input: DraftInput = {
        text: "Following up on our conversation last week about the internship opportunity. I wanted to check if you need any additional information from me.",
        tone: defaultTone
      };

      const result = processDraft(input);

      expect(result).toMatchSnapshot();
      expect(result.meta.category).toBe('followup');
      expect(result.meta.matchedRules).toContain('following up');
      expect(result.draft.subject).toBeDefined();
      expect(result.draft.greeting).toBeDefined();
      expect(result.draft.bodySections).toHaveLength(3); // followup template has 3 body sections
      expect(result.draft.closing).toBeDefined();
      expect(result.checks.completeness).toBe(true);
    });

    it('should process referral email correctly', () => {
      const input: DraftInput = {
        text: "John Smith referred me to you regarding the software developer position. I have attached my resume for your review.",
        tone: defaultTone,
        overrides: {
          request: "I have attached my resume and would appreciate your referral for the position."
        }
      };

      const result = processDraft(input);

      expect(result).toMatchSnapshot();
      expect(result.meta.category).toBe('referral');
      expect(result.meta.matchedRules).toEqual(expect.arrayContaining(['position', 'resume']));
      expect(result.draft.subject).toBeDefined();
      expect(result.draft.greeting).toBeDefined();
      expect(result.draft.bodySections).toHaveLength(2); // referral template has 2 body sections
      expect(result.draft.closing).toBeDefined();
      expect(result.checks.completeness).toBe(false); // Missing CTA in referral template
      expect(result.checks.warnings).toContain('COMPLETENESS_MISSING_CTA');
    });


    it('should process thankyou email correctly', () => {
      const input: DraftInput = {
        text: "Thank you so much for taking the time to meet with me yesterday. I really appreciated learning about your team and the exciting projects you're working on.",
        tone: defaultTone
      };

      const result = processDraft(input);

      expect(result).toMatchSnapshot();
      expect(result.meta.category).toBe('thankyou');
      expect(result.meta.matchedRules).toContain('thank you');
      expect(result.draft.subject).toBeDefined();
      expect(result.draft.greeting).toBeDefined();
      expect(result.draft.bodySections).toHaveLength(2); // thankyou template has 2 body sections
      expect(result.draft.closing).toBeDefined();
      expect(result.checks.completeness).toBe(true);
    });

    it('should process other category email correctly', () => {
      const input: DraftInput = {
        text: "I am writing to inquire about the curriculum requirements for the graduate program. Could you provide information about course prerequisites?",
        tone: defaultTone,
        overrides: {
          message_purpose: "Could you please provide information about course prerequisites and requirements?"
        }
      };

      const result = processDraft(input);

      expect(result).toMatchSnapshot();
      expect(result.meta.category).toBe('other');
      expect(result.draft.subject).toBeDefined();
      expect(result.draft.greeting).toBeDefined();
      expect(result.draft.bodySections).toHaveLength(1); // other template has 1 body section
      expect(result.draft.closing).toBeDefined();
      expect(result.checks.completeness).toBe(true); // Should have CTA with "please"
    });
  });

  describe('style variations', () => {
    it('should apply high formality and confidence', () => {
      const input: DraftInput = {
        text: "I think maybe we could work together on this project",
        tone: {
          formality: 5,
          confidence: 5,
          seniority: 'professional',
          length: 'long'
        }
      };

      const result = processDraft(input);

      expect(result.draft.subject).not.toContain('maybe');
      expect(result.draft.bodySections.some(section => 
        section.includes('confident') || section.includes('collaborate')
      )).toBe(true);
    });

    it('should apply low formality and confidence', () => {
      const input: DraftInput = {
        text: "I recommend we schedule a meeting to discuss this opportunity",
        tone: {
          formality: 1,
          confidence: 1,
          seniority: 'student',
          length: 'short'
        }
      };

      const result = processDraft(input);

      // Check that some transformations occurred
      expect(result.draft.subject).toBeDefined();
      expect(result.draft.bodySections.length).toBeGreaterThan(0);
    });
  });

  describe('validation integration', () => {
    it('should detect professionalism issues with overrides', () => {
      const input: DraftInput = {
        text: "I would like to connect with you about the opportunity",
        tone: defaultTone,
        overrides: {
          topic: "OMG amazing opportunity lol 😊",
          recipient_name: "LOL hey there dude"
        }
      };

      const result = processDraft(input);

      expect(result.checks.professionalism).toBe(false);
      expect(result.checks.warnings).toContain('PROFESSIONALISM_SLANG_DETECTED');
      expect(result.checks.warnings).toContain('PROFESSIONALISM_EMOJI_DETECTED');
    });

    it('should detect ethical issues with overrides', () => {
      const input: DraftInput = {
        text: "I would like to connect with you about the opportunity",
        tone: defaultTone,
        overrides: {
          email_goal: "I guarantee you'll get the job if you hire me. I am desperate for this position."
        }
      };

      const result = processDraft(input);

      expect(result.checks.ethical).toBe(false);
      expect(result.checks.warnings).toContain('ETHICAL_OVERPROMISE_DETECTED');
      expect(result.checks.warnings).toContain('ETHICAL_INAPPROPRIATE_TERM');
    });

    it('should detect clarity issues with overrides', () => {
      const input: DraftInput = {
        text: "I would like to connect with you about the opportunity",
        tone: defaultTone,
        overrides: {
          email_goal: "This is a very long sentence that contains way too many words and keeps going on and on without any real structure or clear point and it just rambles about various topics without ever really making a coherent argument or statement that would be useful to the reader and continues to add more and more clauses."
        }
      };

      const result = processDraft(input);

      expect(result.checks.clarity).toBe(false);
      expect(result.checks.warnings).toContain('CLARITY_RUN_ON_SENTENCE');
    });
  });

  describe('end-to-end functionality', () => {
    it('should handle complete workflow with overrides', () => {
      const input: DraftInput = {
        text: "Following up on our conversation last week about the internship",
        tone: {
          formality: 4,
          confidence: 4,
          seniority: 'professional',
          length: 'medium'
        },
        overrides: {
          recipient_name: 'Dr. Johnson',
          sender_name: 'Alex Chen'
        }
      };

      const result = processDraft(input);

      expect(result.meta.category).toBe('followup');
      expect(result.draft.greeting).toContain('Dr. Johnson');
      expect(result.draft.closing).toContain('Alex Chen');
      expect(result.checks.completeness).toBe(true);
      expect(result.checks.professionalism).toBe(true);
      expect(result.checks.clarity).toBe(true);
      expect(result.checks.ethical).toBe(true);
    });

    it('should maintain consistency across pipeline stages', () => {
      const input: DraftInput = {
        text: "Thank you so much for taking the time to speak with me",
        tone: defaultTone
      };

      const result = processDraft(input);

      // Should categorize correctly based on "thank you"
      expect(result.meta.category).toBe('thankyou');
      expect(result.meta.matchedRules).toContain('thank you');
      
      // Structure should match the thankyou template
      expect(result.draft.subject).toContain('Thank');
      
      // Style should be applied consistently
      expect(result.draft.bodySections[result.draft.bodySections.length - 1]).toContain('eager to learn');
      
      // Checks should validate the final output
      expect(result.checks.completeness).toBe(true);
    });
  });
});