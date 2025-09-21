import { describe, it, expect } from 'vitest';
import { runChecks } from '../src/services/checks.js';
import { DraftOutput, DraftInput, ToneSettings } from '../src/types/domain.js';

const defaultToneSettings: ToneSettings = {
  formality: 3,
  confidence: 3,
  seniority: 'student',
  length: 'medium'
};

const defaultInput: DraftInput = {
  text: 'Test email',
  tone: defaultToneSettings
};

const completeDraft: DraftOutput = {
  subject: 'Meeting Request',
  greeting: 'Dear John,',
  bodySections: [
    'I hope this email finds you well.',
    'I would like to schedule a meeting to discuss the project.',
    'Please let me know your availability.'
  ],
  closing: 'Best regards,\nJane'
};

describe('Email Draft Checks', () => {
  describe('completeness checks', () => {
    it('should pass all completeness checks for complete draft', () => {
      const result = runChecks(completeDraft, defaultInput);
      
      expect(result.completeness).toBe(true);
      expect(result.warnings).not.toContain('COMPLETENESS_MISSING_SUBJECT');
      expect(result.warnings).not.toContain('COMPLETENESS_MISSING_GREETING');
      expect(result.warnings).not.toContain('COMPLETENESS_MISSING_CLOSING');
      expect(result.warnings).not.toContain('COMPLETENESS_MISSING_CTA');
    });

    it('should detect missing subject', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        subject: ''
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.completeness).toBe(false);
      expect(result.warnings).toContain('COMPLETENESS_MISSING_SUBJECT');
    });

    it('should detect missing greeting', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        greeting: ''
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.completeness).toBe(false);
      expect(result.warnings).toContain('COMPLETENESS_MISSING_GREETING');
    });

    it('should detect missing closing', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        closing: ''
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.completeness).toBe(false);
      expect(result.warnings).toContain('COMPLETENESS_MISSING_CLOSING');
    });

    it('should detect missing CTA', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        bodySections: [
          'This is just a statement.',
          'Another statement without any action.',
          'Just informational content.'
        ]
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.completeness).toBe(false);
      expect(result.warnings).toContain('COMPLETENESS_MISSING_CTA');
    });

    it('should detect CTA with various patterns', () => {
      const ctaPatterns = [
        'Would you be available for a call?',
        'Let me know if this works.',
        'Please consider my application.',
        'Can you help with this?',
        'Could you provide feedback?',
        'Feel free to reach out.',
        'I look forward to hearing from you.',
        'Hope to hear back soon.',
        'Thank you for your time.'
      ];

      ctaPatterns.forEach(cta => {
        const draft: DraftOutput = {
          ...completeDraft,
          bodySections: [cta]
        };
        
        const result = runChecks(draft, defaultInput);
        expect(result.warnings).not.toContain('COMPLETENESS_MISSING_CTA');
      });
    });
  });

  describe('professionalism checks', () => {
    it('should pass professionalism checks for professional draft', () => {
      const result = runChecks(completeDraft, defaultInput);
      
      expect(result.professionalism).toBe(true);
      expect(result.warnings).not.toContain('PROFESSIONALISM_SLANG_DETECTED');
      expect(result.warnings).not.toContain('PROFESSIONALISM_EMOJI_DETECTED');
    });

    it('should detect slang usage', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        bodySections: ['LOL this is funny', 'omg I can help', 'lmao sure thing']
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.professionalism).toBe(false);
      expect(result.warnings).toContain('PROFESSIONALISM_SLANG_DETECTED');
    });

    it('should detect emoji usage', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        bodySections: ['Hello! 😊', 'Looking forward to it 👍']
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.professionalism).toBe(false);
      expect(result.warnings).toContain('PROFESSIONALISM_EMOJI_DETECTED');
    });

    it('should detect multiple slang terms', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        subject: 'OMG great opportunity!',
        bodySections: ['idk but wtf this is cool lol']
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.professionalism).toBe(false);
      expect(result.warnings).toContain('PROFESSIONALISM_SLANG_DETECTED');
    });
  });

  describe('clarity checks', () => {
    it('should pass clarity checks for clear draft', () => {
      const result = runChecks(completeDraft, defaultInput);
      
      expect(result.clarity).toBe(true);
      expect(result.warnings).not.toContain('CLARITY_LONG_SENTENCES');
      expect(result.warnings).not.toContain('CLARITY_RUN_ON_SENTENCE');
    });

    it('should detect run-on sentences', () => {
      const longSentence = 'This is a very long sentence that contains way too many words and keeps going on and on without any real structure or clear point and it just rambles about various topics without ever really making a coherent argument or statement that would be useful to the reader.';
      
      const draft: DraftOutput = {
        ...completeDraft,
        bodySections: [longSentence]
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.clarity).toBe(false);
      expect(result.warnings).toContain('CLARITY_RUN_ON_SENTENCE');
    });

    it('should detect long average sentence length', () => {
      const longSentences = [
        'This sentence has many words that make it quite long and somewhat difficult to read quickly and it just keeps going on with more descriptive phrases and clauses.',
        'Another sentence that contains numerous words and phrases that extend its length beyond what is ideal for clear communication and readability in professional email correspondence.',
        'Yet another lengthy sentence with multiple clauses and descriptive phrases that add to the word count significantly making it harder to parse and understand the main message being conveyed.',
      ];
      
      const draft: DraftOutput = {
        ...completeDraft,
        bodySections: longSentences
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.clarity).toBe(false);
      expect(result.warnings).toContain('CLARITY_LONG_SENTENCES');
    });

    it('should handle empty text gracefully', () => {
      const draft: DraftOutput = {
        subject: '',
        greeting: '',
        bodySections: [''],
        closing: ''
      };
      
      const result = runChecks(draft, defaultInput);
      
      // Should not throw errors, but will fail completeness
      expect(result.completeness).toBe(false);
    });
  });

  describe('ethical checks', () => {
    it('should pass ethical checks for appropriate draft', () => {
      const result = runChecks(completeDraft, defaultInput);
      
      expect(result.ethical).toBe(true);
      expect(result.warnings).not.toContain('ETHICAL_OVERPROMISE_DETECTED');
      expect(result.warnings).not.toContain('ETHICAL_INAPPROPRIATE_TERM');
    });

    it('should detect overpromises', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        bodySections: [
          'I guarantee you\'ll get the job if you hire me.',
          'This is 100% certain to work out.'
        ]
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.ethical).toBe(false);
      expect(result.warnings).toContain('ETHICAL_OVERPROMISE_DETECTED');
    });

    it('should detect inappropriate terms', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        bodySections: [
          'I am desperate for this opportunity.',
          'I need this job badly.',
          'I\'ll do anything to get hired.'
        ]
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.ethical).toBe(false);
      expect(result.warnings).toContain('ETHICAL_INAPPROPRIATE_TERM');
    });

    it('should detect multiple ethical issues', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        bodySections: [
          'I promise you will be hired if you meet with me.',
          'I am begging you to consider this request.'
        ]
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.ethical).toBe(false);
      expect(result.warnings).toContain('ETHICAL_OVERPROMISE_DETECTED');
      expect(result.warnings).toContain('ETHICAL_INAPPROPRIATE_TERM');
    });
  });

  describe('attachment and link consistency checks', () => {
    it('should detect attachment references', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        bodySections: [
          'Please find the attached resume.',
          'I have enclosed my portfolio for review.'
        ]
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.warnings).toContain('CONSISTENCY_ATTACHMENT_REFERENCED');
    });

    it('should detect link references', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        bodySections: [
          'Please check my portfolio at https://example.com',
          'Visit http://mywebsite.com for more info.'
        ]
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.warnings).toContain('CONSISTENCY_LINK_DETECTED');
    });

    it('should handle mixed attachment and link references', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        bodySections: [
          'I have attached my resume and you can also view my portfolio at https://portfolio.com'
        ]
      };
      
      const result = runChecks(draft, defaultInput);
      
      expect(result.warnings).toContain('CONSISTENCY_ATTACHMENT_REFERENCED');
      expect(result.warnings).toContain('CONSISTENCY_LINK_DETECTED');
    });
  });

  describe('comprehensive checks', () => {
    it('should handle multiple issues across categories', () => {
      const problematicDraft: DraftOutput = {
        subject: '', // Missing subject
        greeting: 'Hey there! 😊', // Emoji
        bodySections: [
          'OMG I guarantee you\'ll get the job if you hire me lol!', // Slang, overpromise, emoji
          'This is a super long sentence that goes on and on and contains way too many words and multiple clauses that make it very difficult to read and understand what the main point is supposed to be and it just keeps rambling without any clear structure.', // Run-on
          'I am desperate for this position and have attached my resume.' // Inappropriate term, attachment reference
        ],
        closing: 'Thanks!' // Brief but present
      };
      
      const result = runChecks(problematicDraft, defaultInput);
      
      expect(result.completeness).toBe(false);
      expect(result.professionalism).toBe(false);
      expect(result.clarity).toBe(false);
      expect(result.ethical).toBe(false);
      
      expect(result.warnings).toContain('COMPLETENESS_MISSING_SUBJECT');
      expect(result.warnings).toContain('PROFESSIONALISM_SLANG_DETECTED');
      expect(result.warnings).toContain('PROFESSIONALISM_EMOJI_DETECTED');
      expect(result.warnings).toContain('CLARITY_RUN_ON_SENTENCE');
      expect(result.warnings).toContain('ETHICAL_OVERPROMISE_DETECTED');
      expect(result.warnings).toContain('ETHICAL_INAPPROPRIATE_TERM');
      expect(result.warnings).toContain('CONSISTENCY_ATTACHMENT_REFERENCED');
    });

    it('should pass all checks for perfect draft', () => {
      const perfectDraft: DraftOutput = {
        subject: 'Request for Informational Interview',
        greeting: 'Dear Professor Smith,',
        bodySections: [
          'I hope this email finds you well.',
          'I am a computer science student interested in your research on machine learning.',
          'Would you be available for a brief informational interview next week?',
          'I would greatly appreciate the opportunity to learn from your expertise.'
        ],
        closing: 'Best regards,\nJohn Doe'
      };
      
      const result = runChecks(perfectDraft, defaultInput);
      
      expect(result.completeness).toBe(true);
      expect(result.professionalism).toBe(true);
      expect(result.clarity).toBe(true);
      expect(result.ethical).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should not have duplicate warnings', () => {
      const draft: DraftOutput = {
        ...completeDraft,
        bodySections: [
          'OMG this is great lol',
          'LOL I totally agree omg'
        ]
      };
      
      const result = runChecks(draft, defaultInput);
      
      const slangWarnings = result.warnings.filter(w => w === 'PROFESSIONALISM_SLANG_DETECTED');
      expect(slangWarnings).toHaveLength(1);
    });
  });
});