#!/usr/bin/env node

// Test the specific examples mentioned by the user
import { processDraft } from './dist/services/pipeline.js';

console.log('🧪 Testing Specific User Examples...\n');

const testCases = [
    {
        name: 'Software Engineering Opportunities',
        input: {
            text: "I would like to connect with you about software engineering opportunities at your company. I'm interested in learning more about your team and how I might contribute to your projects.",
            tone: {
                formality: 3,
                confidence: 3,
                seniority: 'professional',
                length: 'medium'
            }
        }
    },
    {
        name: 'Research Interest + RA Request',
        input: {
            text: "I saw your research and I thought it was very interesting. Could I work as an RA in your lab?",
            tone: {
                formality: 3,
                confidence: 3,
                seniority: 'student',
                length: 'medium'
            }
        }
    },
    {
        name: 'Energy Business Collaboration',
        input: {
            text: "I noticed you own an energy business. I have a question: would you like to potentially work together with my business to create something big?",
            tone: {
                formality: 3,
                confidence: 3,
                seniority: 'professional',
                length: 'medium'
            }
        }
    }
];

for (const testCase of testCases) {
    console.log(`📧 Testing: ${testCase.name}`);
    console.log(`📝 Input: "${testCase.input.text}"`);
    
    try {
        const result = processDraft(testCase.input);
        
        console.log(`🎯 Category: ${result.meta.category}`);
        console.log(`📬 Subject: "${result.draft.subject}"`);
        console.log(`👋 Greeting: "${result.draft.greeting}"`);
        console.log(`📄 Body:`);
        result.draft.bodySections.forEach((section, idx) => {
            console.log(`   ${idx + 1}. ${section}`);
        });
        console.log(`🔚 Closing: "${result.draft.closing}"`);
        console.log('✅ Success!');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('---\n');
}

console.log('🎉 Specific Examples Test Complete!');