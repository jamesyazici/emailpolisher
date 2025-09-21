import { DraftOutput } from '../types/domain.js';

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  improvements: string[];
}

/**
 * Validate and improve generated emails for grammar, logic, and naturalness
 */
export function validateAndImproveEmail(email: DraftOutput): DraftOutput {
  // Check for common issues and fix them
  const improvedEmail = { ...email };
  
  // Fix introduction issues
  improvedEmail.bodySections = improveIntroductions(improvedEmail.bodySections);
  
  // Fix grammar and flow
  improvedEmail.bodySections = improveGrammarAndFlow(improvedEmail.bodySections);
  
  // Fix redundancy and awkward phrasing
  improvedEmail.bodySections = removeRedundancy(improvedEmail.bodySections);
  
  // Ensure logical flow between sections
  improvedEmail.bodySections = ensureLogicalFlow(improvedEmail.bodySections);
  
  return improvedEmail;
}

/**
 * Fix awkward introductions like "I'm a professional reaching out"
 */
function improveIntroductions(sections: string[]): string[] {
  return sections.map(section => {
    // Fix "I'm a professional reaching out to connect with you"
    if (section.includes("I'm a professional reaching out to connect with you")) {
      return section.replace(
        "I'm a professional reaching out to connect with you.",
        "I hope this message finds you well."
      );
    }
    
    // Fix "I'm a student reaching out to connect with you"
    if (section.includes("I'm a student reaching out to connect with you")) {
      return section.replace(
        "I'm a student reaching out to connect with you.",
        "I hope this message finds you well."
      );
    }
    
    // Fix awkward professional introductions
    if (section.match(/^I am a (professional|student) reaching out/)) {
      return section.replace(
        /^I am a (professional|student) reaching out to connect with you\./,
        "I hope this message finds you well."
      );
    }
    
    return section;
  });
}

/**
 * Improve grammar and natural flow
 */
function improveGrammarAndFlow(sections: string[]): string[] {
  return sections.map(section => {
    let improved = section;
    
    // Fix common grammar issues
    improved = improved.replace(/\bi am\b/g, 'I am');
    improved = improved.replace(/\bi'm\b/g, 'I\'m');
    improved = improved.replace(/\bi'd\b/g, 'I\'d');
    improved = improved.replace(/\bi'll\b/g, 'I\'ll');
    
    // Fix double spaces
    improved = improved.replace(/  +/g, ' ');
    
    // Fix sentence structure issues
    improved = improved.replace(/\. i /g, '. I ');
    improved = improved.replace(/\? i /g, '? I ');
    improved = improved.replace(/\! i /g, '! I ');
    improved = improved.replace(/, i /g, ', I ');
    improved = improved.replace(/\bi am\b/g, 'I am');
    improved = improved.replace(/\bi would\b/g, 'I would');
    improved = improved.replace(/\bmicrosoft\b/g, 'Microsoft');
    improved = improved.replace(/\bgoogle\b/g, 'Google');
    improved = improved.replace(/\brutgers\b/g, 'Rutgers');
    improved = improved.replace(/\bamazon\b/g, 'Amazon');
    improved = improved.replace(/\bmeta\b/g, 'Meta');
    
    // Fix "and would love to" repetition
    if (improved.includes("I'm very interested in") && improved.includes("and would love to")) {
      improved = improved.replace("and would love to", "I would appreciate the opportunity to");
    }
    
    // Remove awkward phrases
    improved = improved.replace(/\. Happy to collaborate on next steps\./g, '.');
    improved = improved.replace(/Happy to collaborate on next steps\./g, '');
    
    // Fix double periods
    improved = improved.replace(/\.\./g, '.');
    
    return improved.trim();
  });
}

/**
 * Remove redundant phrases and improve conciseness
 */
function removeRedundancy(sections: string[]): string[] {
  const improved: string[] = [];
  const usedConcepts = new Set<string>();
  
  for (const section of sections) {
    let processedSection = section;
    
    // Track concepts to avoid repetition
    if (section.includes("reaching out") && usedConcepts.has("reaching_out")) {
      processedSection = section.replace("reaching out", "writing");
    }
    if (section.includes("reaching out")) {
      usedConcepts.add("reaching_out");
    }
    
    if (section.includes("connect") && usedConcepts.has("connect")) {
      processedSection = processedSection.replace("connect", "speak with you");
    }
    if (section.includes("connect")) {
      usedConcepts.add("connect");
    }
    
    if (section.includes("opportunities") && usedConcepts.has("opportunities")) {
      processedSection = processedSection.replace("opportunities", "openings");
    }
    if (section.includes("opportunities")) {
      usedConcepts.add("opportunities");
    }
    
    improved.push(processedSection);
  }
  
  return improved;
}

/**
 * Ensure logical flow between email sections
 */
function ensureLogicalFlow(sections: string[]): string[] {
  if (sections.length < 2) return sections;
  
  const improved = [...sections];
  
  // If first section is just a greeting, make it more natural
  if (improved[0] && improved[0].includes("I hope this message finds you well") && improved.length > 2) {
    // Combine with next section if it's an introduction
    if (improved[1] && (improved[1].includes("I'm a") || improved[1].includes("I am a"))) {
      improved[0] = `${improved[0]} ${improved[1]}`;
      improved.splice(1, 1);
    }
  }
  
  // Fix transitions between sections
  for (let i = 0; i < improved.length - 1; i++) {
    const current = improved[i];
    const next = improved[i + 1];
    
    // Add transition words where needed
    if (current.includes("discovered") && next.includes("interested")) {
      improved[i + 1] = `Given this connection, ${next.toLowerCase()}`;
    }
    
    if (current.includes("currently at") && next.includes("interested")) {
      improved[i + 1] = `As someone looking to advance my career, ${next.toLowerCase()}`;
    }
  }
  
  return improved;
}

/**
 * Validate email quality and provide feedback
 */
export function validateEmailQuality(email: DraftOutput): ValidationResult {
  const issues: string[] = [];
  const improvements: string[] = [];
  
  // Check for awkward phrases
  const allText = [email.subject, email.greeting, ...email.bodySections, email.closing].join(' ');
  
  if (allText.includes("reaching out to connect with you")) {
    issues.push("Awkward introduction phrase");
    improvements.push("Use more natural opening like 'I hope this message finds you well'");
  }
  
  if (allText.includes("I am a professional") || allText.includes("I'm a professional")) {
    issues.push("Vague professional reference");
    improvements.push("Be more specific about role/background");
  }
  
  // Check for repetitive language
  const words = allText.toLowerCase().split(/\s+/);
  const wordCount = new Map<string, number>();
  for (const word of words) {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }
  
  const overusedWords = Array.from(wordCount.entries())
    .filter(([word, count]) => count > 3 && word.length > 4)
    .map(([word]) => word);
  
  if (overusedWords.length > 0) {
    issues.push(`Overused words: ${overusedWords.join(', ')}`);
    improvements.push("Vary vocabulary to avoid repetition");
  }
  
  // Check email structure
  if (email.bodySections.length === 0) {
    issues.push("No body content");
  }
  
  if (email.bodySections.length === 1) {
    improvements.push("Consider adding more context or details");
  }
  
  const isValid = issues.length === 0;
  
  return {
    isValid,
    issues,
    improvements
  };
}