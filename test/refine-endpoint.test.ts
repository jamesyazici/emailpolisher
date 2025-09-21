import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { ToneSettings } from '../src/types/domain.js';
import { llmClient } from '../src/services/llm.js';

// Mock the LLM client
vi.mock('../src/services/llm.js', () => ({
  llmClient: {
    complete: vi.fn()
  }
}));

const mockLLMClient = llmClient as any;

describe('POST /refine', () => {
  const defaultTone: ToneSettings = {
    formality: 3,
    confidence: 3,
    seniority: 'professional',
    length: 'medium'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('without LLM refinement (useLLM: false)', () => {
    it('should return baseline results only', async () => {
      const payload = {
        text: "I would like to connect with you about opportunities in software engineering",
        tone: defaultTone,
        useLLM: false
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      // Should have baseline results
      expect(response.body).toHaveProperty('baseline');
      expect(response.body).toHaveProperty('checksBefore');
      
      // Should NOT have refined results
      expect(response.body).not.toHaveProperty('refined');
      expect(response.body).not.toHaveProperty('checksAfter');
      expect(response.body).not.toHaveProperty('refineWarnings');

      // Verify baseline structure
      expect(response.body.baseline.subject).toBeDefined();
      expect(response.body.baseline.greeting).toBeDefined();
      expect(response.body.baseline.bodySections).toBeInstanceOf(Array);
      expect(response.body.baseline.closing).toBeDefined();

      // Verify checks structure
      expect(response.body.checksBefore.completeness).toBeDefined();
      expect(response.body.checksBefore.professionalism).toBeDefined();
      expect(response.body.checksBefore.clarity).toBeDefined();
      expect(response.body.checksBefore.ethical).toBeDefined();
      expect(response.body.checksBefore.warnings).toBeInstanceOf(Array);

      // LLM should not have been called
      expect(mockLLMClient.complete).not.toHaveBeenCalled();
    });

    it('should default useLLM to false when not specified', async () => {
      const payload = {
        text: "Thank you for your time yesterday",
        tone: defaultTone
        // useLLM not specified
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      expect(response.body).toHaveProperty('baseline');
      expect(response.body).toHaveProperty('checksBefore');
      expect(response.body).not.toHaveProperty('refined');
      expect(mockLLMClient.complete).not.toHaveBeenCalled();
    });

    it('should process different email categories correctly', async () => {
      const followupPayload = {
        text: "Following up on our conversation about the internship opportunity",
        tone: defaultTone,
        useLLM: false
      };

      const response = await request(app)
        .post('/refine')
        .send(followupPayload)
        .expect(200);

      expect(response.body.baseline).toBeDefined();
      expect(response.body.checksBefore).toBeDefined();
      // Should process as followup category (based on "following up" keyword)
      expect(response.body.baseline.bodySections.length).toBeGreaterThan(0);
    });
  });

  describe('with LLM refinement (useLLM: true)', () => {
    it('should return both baseline and refined results on successful refinement', async () => {
      const mockLLMResponse = `===EMAIL===
Subject: Enhanced Professional Connection

Dear Professional Contact,

I would like to connect with you regarding opportunities in software engineering. Your expertise in the field would be invaluable for my career development.

I believe my background aligns well with the industry standards, and I would welcome the opportunity to learn from your experience.

Best regards,
Professional Developer

===EVAL===
Enhanced professional tone and improved structure while maintaining the original intent.`;

      mockLLMClient.complete.mockResolvedValue({ text: mockLLMResponse });

      const payload = {
        text: "I would like to connect with you about opportunities in software engineering",
        tone: defaultTone,
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      // Should have both baseline and refined results
      expect(response.body).toHaveProperty('baseline');
      expect(response.body).toHaveProperty('checksBefore');
      expect(response.body).toHaveProperty('refined');
      expect(response.body).toHaveProperty('checksAfter');
      expect(response.body).not.toHaveProperty('refineWarnings');

      // Verify refined content
      expect(response.body.refined.subject).toBe('Enhanced Professional Connection');
      expect(response.body.refined.greeting).toBe('Dear Professional Contact,');
      expect(response.body.refined.bodySections).toBeInstanceOf(Array);
      expect(response.body.refined.bodySections.length).toBeGreaterThan(0);
      expect(response.body.refined.closing).toBe('Professional Developer');

      // Verify checksAfter structure
      expect(response.body.checksAfter.completeness).toBeDefined();
      expect(response.body.checksAfter.professionalism).toBeDefined();
      expect(response.body.checksAfter.clarity).toBeDefined();
      expect(response.body.checksAfter.ethical).toBeDefined();

      // LLM should have been called
      expect(mockLLMClient.complete).toHaveBeenCalledTimes(1);
    });

    it('should return baseline with warnings when LLM refinement fails', async () => {
      // Mock LLM response that will cause parsing failure
      const mockLLMResponse = `This is not a properly formatted response`;

      mockLLMClient.complete.mockResolvedValue({ text: mockLLMResponse });

      const payload = {
        text: "Thank you for the meeting yesterday",
        tone: defaultTone,
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      // Should have baseline results and warnings
      expect(response.body).toHaveProperty('baseline');
      expect(response.body).toHaveProperty('checksBefore');
      expect(response.body).toHaveProperty('refineWarnings');
      
      // Should NOT have refined results
      expect(response.body).not.toHaveProperty('refined');
      expect(response.body).not.toHaveProperty('checksAfter');

      // Should have warnings about the failure
      expect(response.body.refineWarnings).toBeInstanceOf(Array);
      expect(response.body.refineWarnings.length).toBeGreaterThan(0);
      expect(response.body.refineWarnings[0]).toContain('Failed to parse LLM response');
    });

    it('should return baseline with warnings when LLM service throws error', async () => {
      mockLLMClient.complete.mockRejectedValue(new Error('LLM service unavailable'));

      const payload = {
        text: "I am interested in the position",
        tone: defaultTone,
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      expect(response.body).toHaveProperty('baseline');
      expect(response.body).toHaveProperty('checksBefore');
      expect(response.body).toHaveProperty('refineWarnings');
      expect(response.body).not.toHaveProperty('refined');

      expect(response.body.refineWarnings).toContain('LLM service unavailable or failed');
    });

    it('should fallback when refined draft has high severity issues', async () => {
      // Mock LLM response with unprofessional content
      const mockLLMResponse = `===EMAIL===
Subject: OMG Amazing Opportunity LOL 😊

Hey dude,

This email contains unprofessional slang and emojis.

Later,
Sender

===EVAL===
Added casual tone but may be too informal.`;

      mockLLMClient.complete.mockResolvedValue({ text: mockLLMResponse });

      const payload = {
        text: "I would like to connect with you about opportunities",
        tone: defaultTone,
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      expect(response.body).toHaveProperty('baseline');
      expect(response.body).toHaveProperty('checksBefore');
      expect(response.body).toHaveProperty('refineWarnings');
      expect(response.body).not.toHaveProperty('refined');

      expect(response.body.refineWarnings).toContain('Refined draft failed quality checks');
    });

    it('should handle different tone settings in LLM refinement', async () => {
      const mockLLMResponse = `===EMAIL===
Subject: Formal Request for Connection

Dear Esteemed Professional,

I would be honored to establish a professional connection with you regarding software engineering opportunities.

Your distinguished expertise in the field would provide invaluable guidance for my career advancement.

I would be most grateful for the opportunity to learn from your extensive experience.

Respectfully yours,
Aspiring Professional

===EVAL===
Applied formal tone with high confidence and professional language appropriate for senior-level communication.`;

      mockLLMClient.complete.mockResolvedValue({ text: mockLLMResponse });

      const formalTone: ToneSettings = {
        formality: 5,
        confidence: 4,
        seniority: 'professional',
        length: 'long'
      };

      const payload = {
        text: "I would like to connect with you about opportunities",
        tone: formalTone,
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      expect(response.body.refined.subject).toBe('Formal Request for Connection');
      expect(response.body.refined.greeting).toBe('Dear Esteemed Professional,');
      expect(response.body.refined.closing).toBe('Aspiring Professional');

      // Verify LLM was called with formal tone settings
      expect(mockLLMClient.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          userPrompt: expect.stringMatching(/very formal.*confident.*professional.*long/)
        })
      );
    });

    it('should handle overrides with LLM refinement', async () => {
      const mockLLMResponse = `===EMAIL===
Subject: Connection Request - Software Engineering

Dear Dr. Johnson,

I would like to connect with you regarding software engineering opportunities, particularly in AI development.

My background in machine learning aligns well with current industry trends.

Best regards,
Alex Chen

===EVAL===
Incorporated the recipient name and topic overrides while maintaining professional structure.`;

      mockLLMClient.complete.mockResolvedValue({ text: mockLLMResponse });

      const payload = {
        text: "I would like to connect with you about opportunities",
        tone: defaultTone,
        useLLM: true,
        overrides: {
          recipient_name: 'Dr. Johnson',
          sender_name: 'Alex Chen',
          topic: 'AI development'
        }
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      expect(response.body.refined.greeting).toContain('Dr. Johnson');
      expect(response.body.refined.closing).toContain('Alex Chen');
      expect(response.body.refined.subject).toContain('Software Engineering');
    });
  });

  describe('edge cases and complex scenarios', () => {
    it('should handle minimal text input with LLM refinement', async () => {
      const mockLLMResponse = `===EMAIL===
Subject: Brief Greeting

Hello,

Thank you for your time.

Best regards,
Sender

===EVAL===
Expanded minimal input into proper email structure.`;

      mockLLMClient.complete.mockResolvedValue({ text: mockLLMResponse });

      const payload = {
        text: "Hi",
        tone: defaultTone,
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      expect(response.body.baseline).toBeDefined();
      expect(response.body.refined).toBeDefined();
      expect(response.body.refined.subject).toBe('Brief Greeting');
    });

    it('should handle long text input with LLM refinement', async () => {
      const longText = "I am writing to express my strong interest in connecting with you regarding opportunities in software engineering. I have been following your work and company for several years and am impressed by the innovative solutions and commitment to excellence. My background includes extensive experience in full-stack development, machine learning, and cloud technologies. I believe my skills and passion align well with your organization's mission.";

      const mockLLMResponse = `===EMAIL===
Subject: Software Engineering Opportunity Inquiry

Dear Professional,

I am writing to express my strong interest in connecting with you regarding software engineering opportunities.

I have been following your work and am impressed by your innovative solutions and commitment to excellence.

My background includes extensive experience in full-stack development, machine learning, and cloud technologies, which I believe aligns well with your organization's mission.

Best regards,
Software Engineer

===EVAL===
Condensed the lengthy input while preserving key information and improving structure.`;

      mockLLMClient.complete.mockResolvedValue({ text: mockLLMResponse });

      const payload = {
        text: longText,
        tone: defaultTone,
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      expect(response.body.baseline).toBeDefined();
      expect(response.body.refined).toBeDefined();
      expect(response.body.refined.bodySections.length).toBeGreaterThan(1);
    });

    it('should compare baseline and refined quality', async () => {
      const mockLLMResponse = `===EMAIL===
Subject: Professional Connection Request

Dear Industry Professional,

I would like to establish a professional connection with you to discuss software engineering opportunities.

Your expertise in the field would provide valuable insights for my career development.

I would appreciate the opportunity to learn from your experience and explore potential collaboration.

Best regards,
Aspiring Software Engineer

===EVAL===
Improved professionalism, clarity, and structure while maintaining the original intent.`;

      mockLLMClient.complete.mockResolvedValue({ text: mockLLMResponse });

      const payload = {
        text: "I want to talk to you about jobs",
        tone: {
          formality: 2,
          confidence: 2,
          seniority: 'student',
          length: 'short'
        },
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      // Both baseline and refined should be present
      expect(response.body.baseline).toBeDefined();
      expect(response.body.refined).toBeDefined();
      expect(response.body.checksBefore).toBeDefined();
      expect(response.body.checksAfter).toBeDefined();

      // Refined version should be more professional
      expect(response.body.refined.subject).toContain('Professional');
      expect(response.body.refined.greeting).toContain('Dear');
      expect(response.body.refined.bodySections.length).toBeGreaterThan(1);
    });
  });

  describe('validation and error handling', () => {
    it('should return 400 for missing required fields', async () => {
      const invalidPayload = {
        // Missing text field
        tone: defaultTone,
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toBeInstanceOf(Array);
    });

    it('should return 400 for invalid tone values', async () => {
      const invalidPayload = {
        text: "Hello world",
        tone: {
          formality: 6, // Invalid: should be 1-5
          confidence: 3,
          seniority: 'professional',
          length: 'medium'
        },
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 400 for invalid useLLM type', async () => {
      const invalidPayload = {
        text: "Hello world",
        tone: defaultTone,
        useLLM: "maybe" // Should be boolean
      };

      const response = await request(app)
        .post('/refine')
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/refine')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toBeDefined();
    });

    it('should return 400 for empty text', async () => {
      const invalidPayload = {
        text: "",
        tone: defaultTone,
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('response format validation', () => {
    it('should have correct response structure for baseline only', async () => {
      const payload = {
        text: "Test message",
        tone: defaultTone,
        useLLM: false
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      // Required fields for baseline response
      expect(response.body).toMatchObject({
        baseline: {
          subject: expect.any(String),
          greeting: expect.any(String),
          bodySections: expect.any(Array),
          closing: expect.any(String)
        },
        checksBefore: {
          completeness: expect.any(Boolean),
          professionalism: expect.any(Boolean),
          clarity: expect.any(Boolean),
          ethical: expect.any(Boolean),
          warnings: expect.any(Array)
        }
      });

      // Should not have these fields
      expect(response.body.refined).toBeUndefined();
      expect(response.body.checksAfter).toBeUndefined();
      expect(response.body.refineWarnings).toBeUndefined();
    });

    it('should have correct response structure for successful refinement', async () => {
      const mockLLMResponse = `===EMAIL===
Subject: Test Subject

Dear Contact,

Test content.

Best regards,
Sender

===EVAL===
Test evaluation.`;

      mockLLMClient.complete.mockResolvedValue({ text: mockLLMResponse });

      const payload = {
        text: "Test message",
        tone: defaultTone,
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      // Required fields for successful refinement
      expect(response.body).toMatchObject({
        baseline: {
          subject: expect.any(String),
          greeting: expect.any(String),
          bodySections: expect.any(Array),
          closing: expect.any(String)
        },
        checksBefore: {
          completeness: expect.any(Boolean),
          professionalism: expect.any(Boolean),
          clarity: expect.any(Boolean),
          ethical: expect.any(Boolean),
          warnings: expect.any(Array)
        },
        refined: {
          subject: expect.any(String),
          greeting: expect.any(String),
          bodySections: expect.any(Array),
          closing: expect.any(String)
        },
        checksAfter: {
          completeness: expect.any(Boolean),
          professionalism: expect.any(Boolean),
          clarity: expect.any(Boolean),
          ethical: expect.any(Boolean),
          warnings: expect.any(Array)
        }
      });

      // Should not have warnings for successful refinement
      expect(response.body.refineWarnings).toBeUndefined();
    });

    it('should have correct response structure for failed refinement', async () => {
      mockLLMClient.complete.mockRejectedValue(new Error('Service error'));

      const payload = {
        text: "Test message",
        tone: defaultTone,
        useLLM: true
      };

      const response = await request(app)
        .post('/refine')
        .send(payload)
        .expect(200);

      // Required fields for failed refinement
      expect(response.body).toMatchObject({
        baseline: {
          subject: expect.any(String),
          greeting: expect.any(String),
          bodySections: expect.any(Array),
          closing: expect.any(String)
        },
        checksBefore: {
          completeness: expect.any(Boolean),
          professionalism: expect.any(Boolean),
          clarity: expect.any(Boolean),
          ethical: expect.any(Boolean),
          warnings: expect.any(Array)
        },
        refineWarnings: expect.any(Array)
      });

      // Should not have refined results
      expect(response.body.refined).toBeUndefined();
      expect(response.body.checksAfter).toBeUndefined();
    });
  });
});