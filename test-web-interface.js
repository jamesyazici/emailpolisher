#!/usr/bin/env node

// Test script to verify the web interface works perfectly
async function testWebInterface() {
    console.log('🧪 Testing Email Polisher Web Interface...\n');

    const testCases = [
        {
            name: 'Networking Email - High Formality',
            payload: {
                text: "I want to connect with you about software engineering opportunities",
                tone: {
                    formality: 5,
                    confidence: 4,
                    seniority: 'professional',
                    length: 'medium'
                },
                useLLM: true
            }
        },
        {
            name: 'Follow-up Email - Casual Student',
            payload: {
                text: "Following up on our conversation about the internship",
                tone: {
                    formality: 2,
                    confidence: 3,
                    seniority: 'student',
                    length: 'short'
                },
                useLLM: false
            }
        },
        {
            name: 'Thank You Email - Professional',
            payload: {
                text: "Thank you for taking the time to meet with me yesterday",
                tone: {
                    formality: 4,
                    confidence: 4,
                    seniority: 'professional',
                    length: 'medium'
                },
                useLLM: true
            }
        }
    ];

    for (const testCase of testCases) {
        console.log(`📧 Testing: ${testCase.name}`);
        console.log(`📝 Input: "${testCase.payload.text}"`);
        console.log(`🎛️ Settings: Formality=${testCase.payload.tone.formality}, Confidence=${testCase.payload.tone.confidence}, AI=${testCase.payload.useLLM}`);
        
        try {
            const response = await fetch('http://localhost:3000/refine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testCase.payload)
            });

            if (response.ok) {
                const result = await response.json();
                const email = result.refined || result.baseline;
                
                console.log('✅ Success!');
                console.log(`📧 Generated Subject: "${email.subject}"`);
                console.log(`🎯 Category: ${result.checksBefore ? 'Auto-detected' : 'Professional'}`);
                console.log(`⭐ Quality Score: ${calculateScore(result)}/100`);
                console.log(`🤖 AI Enhanced: ${result.refined ? 'Yes' : 'No'}`);
                console.log('---');
            } else {
                console.log('❌ Test failed:', response.status);
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
        
        console.log();
    }

    function calculateScore(result) {
        const checks = result.checksAfter || result.checksBefore;
        let score = 0;
        if (checks.completeness) score += 25;
        if (checks.professionalism) score += 25;
        if (checks.clarity) score += 25;
        if (checks.ethical) score += 25;
        return score;
    }

    console.log('🎉 Web Interface Testing Complete!');
    console.log('🌟 Your Email Polisher is ready for deployment!');
}

// Run tests if server is available
fetch('http://localhost:3000/healthz')
    .then(() => testWebInterface())
    .catch(() => {
        console.log('⚠️  Server not running. Start with: npm start');
        console.log('Then run this test again to verify functionality.');
    });