import { describe, it, expect } from 'vitest';
import { categorize } from '../src/services/categorize.js';
import { EmailCategory } from '../src/types/domain.js';

describe('Email Categorization', () => {
  describe('networking category', () => {
    const networkingTests = [
      {
        text: "Hi there, I'd like to introduce myself and connect with you about your work in AI research.",
        expectedMatches: ['introduce myself', 'connect', 'your work']
      },
      {
        text: "I'm reaching out to see if you'd be interested in a coffee chat to discuss your recent article.",
        expectedMatches: ['reaching out', 'coffee chat', 'recent article']
      },
      {
        text: "Hello, I admire your research on distributed systems and would love to have a conversation about it.",
        expectedMatches: ['admire', 'your research', 'conversation']
      },
      {
        text: "I'm interested in networking with professionals in your field and wondered if we could meet.",
        expectedMatches: ['networking', 'meet']
      },
      {
        text: "Would you be open to a brief call next week? I'm eager to learn more about your work.",
        expectedMatches: ['call', 'your work']
      },
      {
        text: "I saw your post on LinkedIn and thought we should connect given our shared interests.",
        expectedMatches: ['your post', 'connect']
      }
    ];

    networkingTests.forEach((test, index) => {
      it(`should categorize networking email ${index + 1}`, () => {
        const result = categorize(test.text);
        expect(result.category).toBe('networking');
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.matchedRules.length).toBeGreaterThan(0);
        test.expectedMatches.forEach(match => {
          expect(result.matchedRules).toContain(match);
        });
      });
    });
  });

  describe('followup category', () => {
    const followupTests = [
      {
        text: "I'm following up on our conversation last week about the internship opportunity.",
        expectedMatches: ['following up', 'our conversation', 'last week']
      },
      {
        text: "Just checking in to see if there are any updates on the application status.",
        expectedMatches: ['checking in', 'any updates', 'status']
      },
      {
        text: "I wanted to follow-up on my previous email regarding the research collaboration.",
        expectedMatches: ['follow-up', 'previous']
      },
      {
        text: "Gentle reminder about the meeting we discussed earlier this month.",
        expectedMatches: ['gentle reminder', 'we discussed', 'earlier']
      },
      {
        text: "Circling back on the project proposal - any thoughts on next steps?",
        expectedMatches: ['circling back', 'next steps']
      },
      {
        text: "Following up on the progress of the manuscript review we talked about.",
        expectedMatches: ['following up', 'progress']
      }
    ];

    followupTests.forEach((test, index) => {
      it(`should categorize followup email ${index + 1}`, () => {
        const result = categorize(test.text);
        expect(result.category).toBe('followup');
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.matchedRules.length).toBeGreaterThan(0);
        test.expectedMatches.forEach(match => {
          expect(result.matchedRules).toContain(match);
        });
      });
    });
  });

  describe('referral category', () => {
    const referralTests = [
      {
        text: "I'm applying for a software engineering position and wondered if you'd be comfortable referring me.",
        expectedMatches: ['applying', 'position', 'referring', 'comfortable referring']
      },
      {
        text: "Would you be willing to refer me for the data analyst role? I've attached my resume.",
        expectedMatches: ['refer me', 'role', 'resume']
      },
      {
        text: "I'm submitting my application for the internship and would appreciate a referral if possible.",
        expectedMatches: ['application', 'internship', 'referral']
      },
      {
        text: "Could you vouch for me for the ML engineer job? My background includes relevant experience.",
        expectedMatches: ['vouch for', 'job', 'background', 'experience']
      },
      {
        text: "I'm interested in the research position at your company. Would you mind referring me?",
        expectedMatches: ['position', 'mind referring']
      },
      {
        text: "I'd be grateful for a reference for the product manager role. Here's my portfolio.",
        expectedMatches: ['reference', 'role', 'portfolio']
      }
    ];

    referralTests.forEach((test, index) => {
      it(`should categorize referral email ${index + 1}`, () => {
        const result = categorize(test.text);
        expect(result.category).toBe('referral');
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.matchedRules.length).toBeGreaterThan(0);
        test.expectedMatches.forEach(match => {
          expect(result.matchedRules).toContain(match);
        });
      });
    });
  });

  describe('thankyou category', () => {
    const thankyouTests = [
      {
        text: "Thank you so much for taking the time to interview me yesterday.",
        expectedMatches: ['thank you', 'taking the time', 'interview']
      },
      {
        text: "I'm grateful for your advice and guidance on my career path.",
        expectedMatches: ['grateful', 'your advice']
      },
      {
        text: "Thanks for the insightful conversation during our call last week.",
        expectedMatches: ['thanks', 'insightful', 'conversation', 'call']
      },
      {
        text: "I appreciate your help with reviewing my portfolio. Your feedback was valuable.",
        expectedMatches: ['appreciate', 'your help', 'valuable']
      },
      {
        text: "Thank you for the informative discussion about the research opportunities.",
        expectedMatches: ['thank you', 'informative', 'discussion']
      },
      {
        text: "I'm grateful for your support during the application process. It was very helpful.",
        expectedMatches: ['grateful', 'your support', 'helpful']
      }
    ];

    thankyouTests.forEach((test, index) => {
      it(`should categorize thankyou email ${index + 1}`, () => {
        const result = categorize(test.text);
        expect(result.category).toBe('thankyou');
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.matchedRules.length).toBeGreaterThan(0);
        test.expectedMatches.forEach(match => {
          expect(result.matchedRules).toContain(match);
        });
      });
    });
  });

  describe('other category', () => {
    const otherTests = [
      {
        text: "I have a question about the submission deadline for the conference.",
        expectedMatches: ['question', 'deadline']
      },
      {
        text: "Could you confirm receipt of my scholarship documents?",
        expectedMatches: ['confirm', 'documents']
      },
      {
        text: "I need to reschedule our appointment from Tuesday to Thursday.",
        expectedMatches: ['reschedule']
      },
      {
        text: "May I have permission to use your dataset for my class project?",
        expectedMatches: ['permission']
      },
      {
        text: "I'm requesting a deadline extension for the final assignment.",
        expectedMatches: ['request', 'deadline', 'extension']
      },
      {
        text: "Could you clarify the requirements for the graduate program?",
        expectedMatches: ['clarify']
      }
    ];

    otherTests.forEach((test, index) => {
      it(`should categorize other email ${index + 1}`, () => {
        const result = categorize(test.text);
        expect(result.category).toBe('other');
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.matchedRules.length).toBeGreaterThan(0);
        test.expectedMatches.forEach(match => {
          expect(result.matchedRules).toContain(match);
        });
      });
    });
  });

  describe('edge cases and tie-breaking', () => {
    it('should default to other for text with no matches', () => {
      const result = categorize('Random text with no specific email patterns xyz abc');
      expect(result.category).toBe('other');
      expect(result.confidence).toBe(0.1);
      expect(result.matchedRules).toHaveLength(0);
    });

    it('should handle mixed signals and pick highest scoring category', () => {
      const result = categorize('Thank you for the referral opportunity. I appreciate your help.');
      // Should lean toward thankyou due to higher weights
      expect(result.category).toBe('thankyou');
      expect(result.matchedRules).toContain('thank you');
      expect(result.matchedRules).toContain('appreciate');
      expect(result.matchedRules).toContain('your help');
    });

    it('should be case insensitive', () => {
      const result = categorize('THANK YOU FOR YOUR TIME DURING THE INTERVIEW');
      expect(result.category).toBe('thankyou');
      expect(result.matchedRules).toContain('thank you');
      expect(result.matchedRules).toContain('your time');
      expect(result.matchedRules).toContain('interview');
    });

    it('should handle partial phrase matches correctly', () => {
      const result = categorize('I am follow up with you');
      // This actually should match "follow up" as a phrase since it contains the exact phrase
      expect(result.category).toBe('followup');
      expect(result.matchedRules).toContain('follow up');
    });

    it('should calculate confidence based on score and matches', () => {
      const highConfidenceResult = categorize('Following up on our previous conversation to check in on the status and any updates');
      const lowConfidenceResult = categorize('Just a question about something');
      
      expect(highConfidenceResult.confidence).toBeGreaterThan(lowConfidenceResult.confidence);
      expect(highConfidenceResult.confidence).toBeLessThanOrEqual(1);
      expect(lowConfidenceResult.confidence).toBeGreaterThan(0);
    });
  });
});