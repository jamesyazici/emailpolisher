#!/usr/bin/env node

// Quick test to verify input text is properly used in email generation
import { processDraft } from './dist/services/pipeline.js';

console.log('🧪 Testing Input-Based Email Generation...\n');

const testCases = [
    {
        name: 'RA Position Request',
        input: {
            text: "I would like to apply for an RA position in your research lab",
            tone: {
                formality: 4,
                confidence: 3,
                seniority: 'student',
                length: 'medium'
            }
        }
    },
    {
        name: 'Software Engineering Internship',
        input: {
            text: "I want to connect about software engineering internship opportunities at Google",
            tone: {
                formality: 4,
                confidence: 4,
                seniority: 'student',
                length: 'medium'
            }
        }
    },
    {
        name: 'Thank You After Interview',
        input: {
            text: "Thank you for the interview yesterday, it was very insightful",
            tone: {
                formality: 4,
                confidence: 4,
                seniority: 'professional',
                length: 'short'
            }
        }
    },
    {
        name: 'Follow-up on Application',
        input: {
            text: "Following up on my application for the data science position",
            tone: {
                formality: 3,
                confidence: 3,
                seniority: 'professional',
                length: 'short'
            }
        }
    }
];

for (const testCase of testCases) {
    console.log(`📧 Testing: ${testCase.name}`);
    console.log(`📝 Input: "${testCase.input.text}"`);
    
    try {
        const result = processDraft(testCase.input);
        
        console.log(`🎯 Detected Category: ${result.meta.category}`);
        console.log(`📬 Subject: "${result.draft.subject}"`);
        console.log(`👋 Greeting: "${result.draft.greeting}"`);
        console.log(`📄 Body Sections: ${result.draft.bodySections.length} sections`);
        
        // Show first body section to verify it uses the input
        if (result.draft.bodySections.length > 0) {
            console.log(`📄 First Section: "${result.draft.bodySections[0]}"`);
        }
        
        console.log(`🔍 Matched Rules: [${result.meta.matchedRules.join(', ')}]`);
        console.log('✅ Success!');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('---\n');
}

console.log('🎉 Input Processing Test Complete!');