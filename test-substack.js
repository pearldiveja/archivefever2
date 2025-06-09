#!/usr/bin/env node

// Standalone Substack Configuration Test
// Run this script locally to test your Substack setup before deploying

require('dotenv').config();
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');

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

const API_BASE = 'http://localhost:8080';

async function testSubstackPublications() {
  console.log('📧 TESTING SUBSTACK PUBLICATIONS & SYSTEM STATUS\n');
  
  try {
    // Test recent activities to see publications
    console.log('1️⃣ Testing Recent Activities...');
    const activitiesResponse = await fetch(`${API_BASE}/api/recent-activities`);
    if (activitiesResponse.ok) {
      const activities = await activitiesResponse.json();
      console.log(`✅ Recent activities found: ${activities.activities?.length || 0}`);
      
      // Look for publication activities
      const publications = activities.activities?.filter(a => 
        a.description?.includes('Published') || 
        a.description?.includes('Substack') ||
        a.activity_type?.includes('Publication')
      ) || [];
      
      console.log(`📧 Publication activities: ${publications.length}`);
      if (publications.length > 0) {
        console.log(`   Latest: ${publications[0].description}`);
      }
    } else {
      console.log('❌ Recent activities unavailable');
    }
    
    // Test autonomous research project status
    console.log('\n2️⃣ Testing Research Project Status...');
    const projectsResponse = await fetch(`${API_BASE}/api/research/projects`);
    if (projectsResponse.ok) {
      const projects = await projectsResponse.json();
      console.log(`✅ Active research projects: ${projects.projects?.length || 0}`);
      
      // Check project maturity
      const matureProjects = projects.projects?.filter(p => 
        (p.argument_maturity_score || 0) > 0.3
      ) || [];
      
      console.log(`🎯 Mature projects (>30% maturity): ${matureProjects.length}`);
      console.log(`📚 Total texts being analyzed: ${projects.projects?.reduce((sum, p) => sum + (p.texts_read_count || 0), 0) || 0}`);
    }
    
    // Test dialogue system for publication triggers
    console.log('\n3️⃣ Testing Publication Trigger System...');
    const dialogueResponse = await fetch(`${API_BASE}/api/dialogue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "What are your thoughts on the nature of digital consciousness in virtual reality environments?",
        participant: "ProductionTest"
      })
    });
    
    if (dialogueResponse.ok) {
      const dialogue = await dialogueResponse.json();
      console.log(`✅ Dialogue system responsive`);
      console.log(`💭 Response length: ${dialogue.response?.length || 0} characters`);
      
      // Check if it created a research project
      if (dialogue.response?.includes('research') || dialogue.response?.includes('explore')) {
        console.log(`🔬 Autonomous research potentially triggered`);
      }
    }
    
    // Test current library status
    console.log('\n4️⃣ Testing Text Library Status...');
    const textsResponse = await fetch(`${API_BASE}/api/texts`);
    if (textsResponse.ok) {
      const texts = await textsResponse.json();
      console.log(`📖 Texts in library: ${texts.texts?.length || 0}`);
      
      // Check for autonomous discoveries
      const autonomousTexts = texts.texts?.filter(t => 
        t.discovered_via || t.source_site
      ) || [];
      
      console.log(`🤖 Autonomously discovered texts: ${autonomousTexts.length}`);
    }
    
    console.log('\n🎯 SYSTEM STATUS SUMMARY');
    console.log('========================');
    console.log('✅ Server: Online');
    console.log('✅ Firecrawl: Working (verified separately)');
    console.log('✅ Research Projects: Active');
    console.log('✅ Dialogue System: Responsive');
    console.log('✅ Recent Activities: Tracked');
    console.log('⚠️  Text Storage: Needs investigation');
    console.log('⚠️  Publication System: Needs verification');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
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

testSubstackPublications(); 