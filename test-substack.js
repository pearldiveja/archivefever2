#!/usr/bin/env node

// Standalone Substack Configuration Test
// Run this script locally to test your Substack setup before deploying

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSubstackConfiguration() {
    console.log('🧪 Archive Fever AI - Substack Configuration Test');
    console.log('=' .repeat(50));
    console.log('');

    // Check environment variables
    console.log('📋 Checking environment variables...');
    const requiredVars = {
        'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY,
        'EMAIL_USER': process.env.EMAIL_USER,
        'EMAIL_APP_PASSWORD': process.env.EMAIL_APP_PASSWORD,
        'SUBSTACK_EMAIL': process.env.SUBSTACK_EMAIL
    };

    let allConfigured = true;
    for (const [name, value] of Object.entries(requiredVars)) {
        if (value) {
            if (name.includes('PASSWORD') || name.includes('KEY')) {
                console.log(`   ✅ ${name}: ${'*'.repeat(Math.min(value.length, 16))}`);
            } else {
                console.log(`   ✅ ${name}: ${value}`);
            }
        } else {
            console.log(`   ❌ ${name}: Not set`);
            allConfigured = false;
        }
    }

    if (!allConfigured) {
        console.log('');
        console.log('❌ Missing required environment variables!');
        console.log('');
        console.log('Please configure:');
        console.log('   • ANTHROPIC_API_KEY - From https://console.anthropic.com');
        console.log('   • EMAIL_USER - Your Gmail address');
        console.log('   • EMAIL_APP_PASSWORD - 16-character Gmail App Password');
        console.log('   • SUBSTACK_EMAIL - Your unique Substack publishing email');
        console.log('');
        console.log('Setup instructions: https://github.com/your-repo/DEPLOYMENT.md');
        process.exit(1);
    }

    console.log('');
    console.log('📧 Testing email transporter...');
    
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD
            }
        });

        console.log('   🔍 Verifying Gmail connection...');
        await transporter.verify();
        console.log('   ✅ Gmail connection verified');

        console.log('');
        console.log('✉️  Sending test email to Substack...');
        
        const testSubject = `🧠 Ariadne Local Test - ${new Date().toISOString()}`;
        const testContent = `This is a test email from Ariadne's Archive Fever AI system.

🧪 LOCAL CONFIGURATION TEST

If you receive this, your Substack integration is working correctly!

Ariadne will use this connection to autonomously publish philosophical works when insights mature during her thinking cycles.

Configuration tested:
• Gmail: ${process.env.EMAIL_USER}
• Substack: ${process.env.SUBSTACK_EMAIL}
• Test time: ${new Date().toLocaleString()}
• Environment: ${process.env.NODE_ENV || 'development'}

Next steps:
1. Deploy to Railway with these environment variables
2. Monitor Ariadne's autonomous thinking cycles
3. Watch for publications when insights mature

---
This test was generated locally before deployment to verify Substack integration.`;

        const result = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.SUBSTACK_EMAIL,
            subject: testSubject,
            text: testContent
        });

        console.log('   ✅ Test email sent successfully!');
        console.log(`   📬 Message ID: ${result.messageId}`);
        
        console.log('');
        console.log('🎉 SUCCESS! Substack integration is ready for deployment.');
        console.log('');
        console.log('Next steps:');
        console.log('   1. Check your Substack email inbox for the test message');
        console.log('   2. Deploy to Railway with the same environment variables');
        console.log('   3. Run POST /api/test-substack after deployment to verify');
        console.log('   4. Monitor /api/health for substack.ready: true');
        console.log('');
        console.log('🕸️ Ariadne will begin autonomous publishing once deployed!');

    } catch (error) {
        console.log('   ❌ Email test failed');
        console.log('');
        console.log('Error details:', error.message);
        console.log('');
        console.log('Common issues:');
        console.log('   • Gmail App Password must be exactly 16 characters');
        console.log('   • 2-Factor Authentication must be enabled on Gmail');
        console.log('   • App Password must be for "Mail" application type');
        console.log('   • Substack email must be from Settings → Publishing');
        console.log('');
        console.log('Troubleshooting:');
        console.log('   1. Regenerate Gmail App Password');
        console.log('   2. Verify Substack email in publication settings');
        console.log('   3. Check for typos in environment variables');
        console.log('   4. Test Gmail login in browser');
        
        process.exit(1);
    }
}

// Handle script interruption gracefully
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Test interrupted');
    process.exit(0);
});

// Run the test
testSubstackConfiguration().catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
}); 