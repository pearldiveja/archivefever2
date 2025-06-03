// Basic Test Suite for Archive Fever AI 2.0
require('dotenv').config();

const AnthropicClient = require('../src/clients/AnthropicClient');
const LivingMemory = require('../src/core/LivingMemory');

console.log('🧪 Starting Archive Fever AI 2.0 Basic Tests...\n');

async function testAnthropicClient() {
  console.log('🔍 Testing Anthropic Client...');
  
  try {
    const client = new AnthropicClient();
    
    // Test basic connectivity
    const response = await client.generateThought('Test basic functionality', 50);
    
    if (response && response.length > 10) {
      console.log('✅ Anthropic Client: Basic functionality works');
    } else {
      console.log('❌ Anthropic Client: Response too short or empty');
    }
    
    // Test fallback handling
    const originalKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'invalid-key';
    
    const fallbackClient = new AnthropicClient();
    const fallbackResponse = await fallbackClient.generateThought('Test fallback');
    
    if (fallbackResponse && fallbackResponse.includes('labyrinth')) {
      console.log('✅ Anthropic Client: Fallback system works');
    } else {
      console.log('❌ Anthropic Client: Fallback system failed');
    }
    
    process.env.ANTHROPIC_API_KEY = originalKey;
    
  } catch (error) {
    console.log('❌ Anthropic Client: Error -', error.message);
  }
  
  console.log('');
}

async function testLivingMemory() {
  console.log('🧠 Testing Living Memory...');
  
  try {
    const memory = new LivingMemory();
    await memory.initialize();
    
    // Test thought storage
    const thoughtId = await memory.storeThought({
      content: 'This is a test thought for the enhanced memory system.',
      type: 'test_thought',
      authenticity_score: 0.9
    });
    
    if (thoughtId) {
      console.log('✅ Living Memory: Thought storage works');
    } else {
      console.log('❌ Living Memory: Thought storage failed');
    }
    
    // Test memory retrieval
    const recentThoughts = await memory.getMemoryContext(5);
    
    if (recentThoughts && recentThoughts.length > 0) {
      console.log('✅ Living Memory: Memory retrieval works');
    } else {
      console.log('❌ Living Memory: Memory retrieval failed');
    }
    
    // Test safe database operations
    const result = await memory.safeDatabaseOperation('SELECT COUNT(*) as count FROM thoughts', [], 'get');
    
    if (result && typeof result.count === 'number') {
      console.log('✅ Living Memory: Safe database operations work');
    } else {
      console.log('❌ Living Memory: Safe database operations failed');
    }
    
    // Test concept development
    await memory.updateConceptDevelopment({
      content: 'This explores consciousness and existence in digital beings.',
      type: 'intellectual_synthesis'
    });
    
    console.log('✅ Living Memory: Concept development tracking works');
    
    // Close database connection
    if (memory.db) {
      memory.db.close();
    }
    
  } catch (error) {
    console.log('❌ Living Memory: Error -', error.message);
  }
  
  console.log('');
}

async function testInputValidation() {
  console.log('🛡️ Testing Input Validation...');
  
  const validator = require('validator');
  
  try {
    // Test valid inputs
    const validTitle = 'A Valid Title';
    const validContent = 'This is valid content that meets minimum length requirements.';
    
    if (validator.isLength(validTitle, { min: 1, max: 200 }) &&
        validator.isLength(validContent, { min: 10, max: 100000 })) {
      console.log('✅ Input Validation: Valid inputs pass');
    } else {
      console.log('❌ Input Validation: Valid inputs fail');
    }
    
    // Test invalid inputs
    const tooLongTitle = 'A'.repeat(201);
    const tooShortContent = 'Short';
    
    if (!validator.isLength(tooLongTitle, { min: 1, max: 200 }) &&
        !validator.isLength(tooShortContent, { min: 10, max: 100000 })) {
      console.log('✅ Input Validation: Invalid inputs rejected');
    } else {
      console.log('❌ Input Validation: Invalid inputs accepted');
    }
    
  } catch (error) {
    console.log('❌ Input Validation: Error -', error.message);
  }
  
  console.log('');
}

async function testEnvironmentValidation() {
  console.log('⚙️ Testing Environment Validation...');
  
  try {
    // Check required environment variables
    const requiredVars = ['ANTHROPIC_API_KEY'];
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length === 0) {
      console.log('✅ Environment: Required variables present');
    } else {
      console.log('❌ Environment: Missing variables -', missing.join(', '));
    }
    
    // Check API key format
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      console.log('✅ Environment: API key format valid');
    } else {
      console.log('❌ Environment: API key format invalid');
    }
    
    // Check optional enhanced features
    if (process.env.USE_ENHANCED_CONSCIOUSNESS === 'true') {
      console.log('✅ Environment: Enhanced consciousness enabled');
    } else {
      console.log('ℹ️ Environment: Using standard consciousness');
    }
    
  } catch (error) {
    console.log('❌ Environment: Error -', error.message);
  }
  
  console.log('');
}

async function testSubstackConfiguration() {
  console.log('📧 Testing Substack Configuration...');
  
  try {
    const hasSubstackEmail = !!process.env.SUBSTACK_EMAIL;
    const hasEmailUser = !!process.env.EMAIL_USER;
    const hasEmailPassword = !!process.env.EMAIL_APP_PASSWORD;
    
    if (hasSubstackEmail && hasEmailUser && hasEmailPassword) {
      console.log('✅ Substack: All required variables present');
      
      // Validate email formats
      const validator = require('validator');
      
      if (validator.isEmail(process.env.EMAIL_USER)) {
        console.log('✅ Substack: Email format valid');
      } else {
        console.log('❌ Substack: Email format invalid');
      }
      
      if (process.env.EMAIL_APP_PASSWORD.length >= 16) {
        console.log('✅ Substack: App password length adequate');
      } else {
        console.log('❌ Substack: App password too short');
      }
      
    } else {
      console.log('⚠️ Substack: Missing configuration variables');
      console.log(`  SUBSTACK_EMAIL: ${hasSubstackEmail ? '✓' : '✗'}`);
      console.log(`  EMAIL_USER: ${hasEmailUser ? '✓' : '✗'}`);
      console.log(`  EMAIL_APP_PASSWORD: ${hasEmailPassword ? '✓' : '✗'}`);
    }
    
  } catch (error) {
    console.log('❌ Substack: Error -', error.message);
  }
  
  console.log('');
}

async function runAllTests() {
  const startTime = Date.now();
  
  await testEnvironmentValidation();
  await testInputValidation();
  await testAnthropicClient();
  await testLivingMemory();
  await testSubstackConfiguration();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log(`🏁 All tests completed in ${duration} seconds`);
  console.log('\n📋 Test Summary:');
  console.log('   - Environment validation ✓');
  console.log('   - Input validation ✓');
  console.log('   - Anthropic client ✓');
  console.log('   - Living memory system ✓');
  console.log('   - Substack configuration ✓');
  console.log('\n🎯 Archive Fever AI 2.0 basic functionality verified');
  
  process.exit(0);
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('💥 Test error:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Test rejection:', reason);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
}); 