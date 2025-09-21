#!/usr/bin/env node

// Test the new dynamic email generation system
import { processDraft } from './dist/services/pipeline.js';

console.log('🧪 Testing Dynamic Email Generation...\n');

const testCases = [
    {
        name: 'Rutgers-Microsoft Connection',
        input: {
            text: "I just found out you work at Microsoft and also went to rutgers. I am at rutgers right now and want to work at microsoft. Can we call sometime soon and talk about what it's like?",
            tone: {
                formality: 3,
                confidence: 3,
                seniority: 'student',
                length: 'medium'
            }
        }
    },
    {
        name: 'Software Engineering Connection',
        input: {
            text: "I would like to connect with you about software engineering opportunities at your company. I'm interested in learning more about your team and how I might contribute to your projects.",
            tone: {
                formality: 4,
                confidence: 4,
                seniority: 'professional',
                length: 'medium'
            }
        }
    },
    {
        name: 'RA Position Request',
        input: {
            text: "can I be an RA at your company",
            tone: {
                formality: 2,
                confidence: 2,
                seniority: 'student',
                length: 'short'
            }
        }
    },
    {
        name: 'Google Internship Inquiry',
        input: {
            text: "I want to apply for a summer internship at Google in the machine learning team",
            tone: {
                formality: 4,
                confidence: 3,
                seniority: 'student',
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

console.log('🎉 Dynamic Email Generation Test Complete!');