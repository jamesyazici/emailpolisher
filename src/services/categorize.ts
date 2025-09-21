import { EmailCategory } from '../types/domain.js';

interface CategoryRule {
  phrases: string[];
  weight: number;
}

interface CategoryRules {
  [key: string]: CategoryRule[];
}

const CATEGORY_RULES: CategoryRules = {
  networking: [
    {
      phrases: ['introduction', 'introduce myself', 'connect', 'connecting', 'network', 'networking'],
      weight: 3
    },
    {
      phrases: ['coffee chat', 'coffee', 'meet', 'meeting', 'call', 'conversation'],
      weight: 2
    },
    {
      phrases: ['your work', 'your research', 'your article', 'your post', 'admire', 'recent article'],
      weight: 2
    },
    {
      phrases: ['reach out', 'reaching out', 'get in touch', 'opportunity to'],
      weight: 1
    },
    {
      phrases: ['ra position', 'research assistant', 'internship', 'software engineering', 'opportunities'],
      weight: 3
    }
  ],
  followup: [
    {
      phrases: ['follow up', 'following up', 'follow-up', 'checking in', 'check in'],
      weight: 4
    },
    {
      phrases: ['previous', 'last week', 'earlier', 'our conversation', 'we discussed'],
      weight: 3
    },
    {
      phrases: ['any updates', 'update', 'status', 'progress', 'next steps'],
      weight: 2
    },
    {
      phrases: ['gentle reminder', 'reminder', 'nudge', 'circling back'],
      weight: 2
    },
    {
      phrases: ['my application', 'application status'],
      weight: 3
    }
  ],
  referral: [
    {
      phrases: ['referral', 'refer me', 'reference', 'recommend me', 'vouch for', 'referring', 'comfortable referring', 'willing to refer', 'mind referring'],
      weight: 4
    },
    {
      phrases: ['applying', 'application', 'position', 'role', 'job', 'internship'],
      weight: 3
    },
    {
      phrases: ['resume', 'cv', 'portfolio', 'background', 'experience'],
      weight: 2
    }
  ],
  thankyou: [
    {
      phrases: ['thank you', 'thanks', 'grateful', 'appreciate', 'appreciation'],
      weight: 4
    },
    {
      phrases: ['taking the time', 'your time', 'your help', 'your advice', 'your guidance', 'your support'],
      weight: 3
    },
    {
      phrases: ['interview', 'meeting', 'call', 'conversation', 'discussion'],
      weight: 2
    },
    {
      phrases: ['helpful', 'insightful', 'valuable', 'useful', 'informative'],
      weight: 1
    }
  ],
  other: [
    {
      phrases: ['question', 'clarification', 'clarify', 'request', 'permission', 'confirm'],
      weight: 2
    },
    {
      phrases: ['schedule', 'reschedule', 'deadline', 'extension', 'documents'],
      weight: 1
    }
  ]
};

export function categorize(text: string): { 
  category: EmailCategory; 
  confidence: number; 
  matchedRules: string[] 
} {
  const normalizedText = text.toLowerCase();
  const categoryScores: Record<string, { score: number; matches: string[] }> = {};
  
  // Initialize scores for all categories
  Object.keys(CATEGORY_RULES).forEach(category => {
    categoryScores[category] = { score: 0, matches: [] };
  });
  
  // Calculate scores for each category
  Object.entries(CATEGORY_RULES).forEach(([category, rules]) => {
    rules.forEach(rule => {
      rule.phrases.forEach(phrase => {
        if (normalizedText.includes(phrase)) {
          categoryScores[category].score += rule.weight;
          categoryScores[category].matches.push(phrase);
        }
      });
    });
  });
  
  // Find the category with the highest score
  let bestCategory = 'other';
  let bestScore = categoryScores.other.score;
  let bestMatches = categoryScores.other.matches;
  
  Object.entries(categoryScores).forEach(([category, data]) => {
    if (data.score > bestScore) {
      bestCategory = category;
      bestScore = data.score;
      bestMatches = data.matches;
    }
  });
  
  // Calculate confidence based on score and number of matches
  let confidence = 0;
  if (bestScore > 0) {
    const maxPossibleScore = Math.max(...Object.values(CATEGORY_RULES).flat().map(rule => rule.weight));
    const baseConfidence = Math.min(bestScore / (maxPossibleScore * 2), 1);
    const matchBonus = Math.min(bestMatches.length * 0.1, 0.3);
    confidence = Math.min(baseConfidence + matchBonus, 1);
  } else {
    // Default confidence for 'other' category when no matches
    confidence = 0.1;
  }
  
  return {
    category: bestCategory as EmailCategory,
    confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
    matchedRules: [...new Set(bestMatches)] // Remove duplicates
  };
}