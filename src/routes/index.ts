import { Router } from 'express';
import { z } from 'zod';
import { DraftInputSchema } from '../types/domain.js';
import { processDraft } from '../services/pipeline.js';
import { refineWithLLM } from '../services/refine.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Schema for refine endpoint input
const RefineInputSchema = DraftInputSchema.extend({
  useLLM: z.boolean().optional().default(false)
});

router.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

router.post('/draft', async (req, res) => {
  try {
    // Validate request body
    const input = DraftInputSchema.parse(req.body);
    
    logger.info('Processing draft request', { 
      textLength: input.text.length,
      tone: input.tone,
      hasOverrides: !!input.overrides 
    });

    // Process the draft through the pipeline
    const result = processDraft(input);

    logger.info('Draft processed successfully', {
      category: result.meta.category,
      completeness: result.checks.completeness,
      professionalism: result.checks.professionalism,
      warningCount: result.checks.warnings.length
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Draft validation failed', { errors: error.errors });
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    } else {
      logger.error('Draft processing failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
});

router.post('/refine', async (req, res) => {
  try {
    // Validate request body
    const input = RefineInputSchema.parse(req.body);
    
    logger.info('Processing refine request', { 
      textLength: input.text.length,
      tone: input.tone,
      hasOverrides: !!input.overrides,
      useLLM: input.useLLM
    });

    // Run baseline pipeline to get initial draft and checks
    const baselineResult = processDraft({
      text: input.text,
      tone: input.tone,
      overrides: input.overrides
    });

    const baseline = baselineResult.draft;
    const checksBefore = baselineResult.checks;

    logger.debug('Baseline processing complete', {
      category: baselineResult.meta.category,
      completeness: checksBefore.completeness,
      warningCount: checksBefore.warnings.length
    });

    // If LLM refinement is not requested, return baseline only
    if (!input.useLLM) {
      logger.info('Refine request completed without LLM', {
        category: baselineResult.meta.category,
        completeness: checksBefore.completeness
      });

      return res.json({
        baseline,
        checksBefore
      });
    }

    // Run LLM refinement
    logger.debug('Starting LLM refinement');
    const refineResult = await refineWithLLM(
      baseline,
      input.tone,
      baselineResult.meta.category
    );

    const response: any = {
      baseline,
      checksBefore
    };

    // Add refined results if refinement was successful
    if (refineResult.wasRefined && !refineResult.usedFallback) {
      response.refined = refineResult.draft;
      response.checksAfter = refineResult.checks;
      
      logger.info('Refine request completed with LLM refinement', {
        category: baselineResult.meta.category,
        wasRefined: true,
        improvedScore: refineResult.evalMetrics.overallScore > baselineResult.checks.warnings.length
      });
    } else {
      // Include warnings if refinement failed or fell back
      response.refineWarnings = refineResult.refineWarnings;
      
      logger.info('Refine request completed with LLM fallback', {
        category: baselineResult.meta.category,
        wasRefined: false,
        warningCount: refineResult.refineWarnings.length
      });
    }

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Refine validation failed', { errors: error.errors });
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    } else {
      logger.error('Refine processing failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
});

export default router;