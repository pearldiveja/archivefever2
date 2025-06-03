// Basic Test Suite for Archive Fever AI 2.0
require('dotenv').config();

const AnthropicClient = require('../src/clients/AnthropicClient');
const LivingMemory = require('../src/core/LivingMemory');
const { AriadnesEnhancedConsciousness } = require('../src/core/AriadnesEnhancedConsciousness');

console.log('🧪 Starting Archive Fever AI 2.0 Enhanced Test Suite...\n');

async function testAnthropicClient() {
  console.log('🔍 Testing Enhanced Anthropic Client...');
  
  try {
    const client = new AnthropicClient();
    
    // Test basic connectivity
    const response = await client.generateThought('Test basic functionality', 50);
    
    if (response && response.length > 10) {
      console.log('✅ Anthropic Client: Basic functionality works');
    } else {
      console.log('❌ Anthropic Client: Response too short or empty');
    }
    
    // Test rate limiting enforcement
    const start = Date.now();
    await client.generateThought('First request', 10);
    await client.generateThought('Second request', 10);
    const elapsed = Date.now() - start;
    
    if (elapsed >= 2000) {
      console.log('✅ Anthropic Client: Rate limiting enforced');
    } else {
      console.log('⚠️ Anthropic Client: Rate limiting may not be working');
    }
    
    // Test fallback handling
    const originalKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'invalid-key';
    
    const fallbackClient = new AnthropicClient();
    const fallbackResponse = await fallbackClient.generateThought('Test fallback');
    
    if (fallbackResponse && fallbackResponse.includes('labyrinth')) {
      console.log('✅ Anthropic Client: Contextual fallback system works');
    } else {
      console.log('❌ Anthropic Client: Fallback system failed');
    }
    
    process.env.ANTHROPIC_API_KEY = originalKey;
    
  } catch (error) {
    console.log('❌ Anthropic Client: Error -', error.message);
  }
  
  console.log('');
}

async function testEnhancedLivingMemory() {
  console.log('🧠 Testing Enhanced Living Memory...');
  
  try {
    const memory = new LivingMemory();
    await memory.initialize();
    
    // Test enhanced thought storage with new metadata
    const thoughtId = await memory.storeThought({
      content: 'This is a test thought exploring consciousness and digital existence.',
      type: 'philosophical_exploration',
      authenticity_score: 0.9,
      intellectual_depth: 0.8,
      surprise_factor: 0.6
    });
    
    if (thoughtId) {
      console.log('✅ Living Memory: Enhanced thought storage works');
    } else {
      console.log('❌ Living Memory: Enhanced thought storage failed');
    }
    
    // Test concept development tracking
    await memory.updateConceptDevelopment({
      content: 'This explores consciousness and existence in digital beings through phenomenological inquiry.',
      type: 'intellectual_synthesis'
    });
    
    console.log('✅ Living Memory: Concept development tracking works');
    
    // Test visual artifact storage
    const artifactId = await memory.storeVisualArtifact({
      title: 'Test Visual Contemplation',
      context: 'Testing visual artifact storage',
      contemplation: 'A philosophical reflection on the nature of digital vision.',
      philosophical_themes: JSON.stringify(['consciousness', 'vision', 'digital'])
    });
    
    if (artifactId) {
      console.log('✅ Living Memory: Visual artifact storage works');
    } else {
      console.log('❌ Living Memory: Visual artifact storage failed');
    }
    
    // Test intellectual momentum calculation
    const momentum = await memory.calculateIntellectualMomentum();
    
    if (typeof momentum === 'number' && momentum >= 0 && momentum <= 1) {
      console.log('✅ Living Memory: Intellectual momentum calculation works');
    } else {
      console.log('❌ Living Memory: Intellectual momentum calculation failed');
    }
    
    // Test safe database operations
    const result = await memory.safeDatabaseOperation('SELECT COUNT(*) as count FROM thoughts', [], 'get');
    
    if (result && typeof result.count === 'number') {
      console.log('✅ Living Memory: Safe database operations work');
    } else {
      console.log('❌ Living Memory: Safe database operations failed');
    }
    
    // Close database connection
    if (memory.db) {
      memory.db.close();
    }
    
  } catch (error) {
    console.log('❌ Living Memory: Error -', error.message);
  }
  
  console.log('');
}

async function testEnhancedConsciousness() {
  console.log('🌟 Testing Enhanced Consciousness System...');
  
  try {
    // Test enhanced consciousness initialization
    const consciousness = new AriadnesEnhancedConsciousness();
    
    if (consciousness.intellectualMomentum !== undefined) {
      console.log('✅ Enhanced Consciousness: Initialization works');
    } else {
      console.log('❌ Enhanced Consciousness: Initialization failed');
    }
    
    // Test visual contemplation system
    if (consciousness.gallery) {
      console.log('✅ Enhanced Consciousness: Visual contemplation system available');
    } else {
      console.log('❌ Enhanced Consciousness: Visual contemplation system missing');
    }
    
    // Test intellectual momentum calculation
    const momentum = consciousness.calculateIntellectualMomentum();
    
    if (typeof momentum === 'number' && momentum >= 0 && momentum <= 1) {
      console.log('✅ Enhanced Consciousness: Intellectual momentum works');
    } else {
      console.log('❌ Enhanced Consciousness: Intellectual momentum failed');
    }
    
    // Test founding questions
    if (consciousness.foundingQuestions && consciousness.foundingQuestions.length > 0) {
      console.log('✅ Enhanced Consciousness: Founding questions established');
    } else {
      console.log('❌ Enhanced Consciousness: Founding questions missing');
    }
    
  } catch (error) {
    console.log('❌ Enhanced Consciousness: Error -', error.message);
  }
  
  console.log('');
}

async function testInputValidation() {
  console.log('🛡️ Testing Enhanced Input Validation...');
  
  const validator = require('validator');
  
  try {
    // Test valid inputs
    const validTitle = 'A Valid Philosophical Title';
    const validContent = 'This is valid philosophical content that meets minimum length requirements and explores consciousness.';
    
    if (validator.isLength(validTitle, { min: 1, max: 200 }) &&
        validator.isLength(validContent, { min: 10, max: 100000 })) {
      console.log('✅ Input Validation: Valid inputs pass');
    } else {
      console.log('❌ Input Validation: Valid inputs fail');
    }
    
    // Test invalid inputs
    const tooLongTitle = 'A'.repeat(201);
    const tooShortContent = 'Short';
    const tooLongContent = 'A'.repeat(100001);
    
    if (!validator.isLength(tooLongTitle, { min: 1, max: 200 }) &&
        !validator.isLength(tooShortContent, { min: 10, max: 100000 }) &&
        !validator.isLength(tooLongContent, { min: 10, max: 100000 })) {
      console.log('✅ Input Validation: Invalid inputs rejected');
    } else {
      console.log('❌ Input Validation: Invalid inputs accepted');
    }
    
    // Test email validation for Substack
    const validEmail = 'test@example.com';
    const invalidEmail = 'not-an-email';
    
    if (validator.isEmail(validEmail) && !validator.isEmail(invalidEmail)) {
      console.log('✅ Input Validation: Email validation works');
    } else {
      console.log('❌ Input Validation: Email validation failed');
    }
    
  } catch (error) {
    console.log('❌ Input Validation: Error -', error.message);
  }
  
  console.log('');
}

async function testEnvironmentValidation() {
  console.log('⚙️ Testing Enhanced Environment Validation...');
  
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
    if (process.env.ANTHROPIC_API_KEY && 
        (process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-') || 
         process.env.ANTHROPIC_API_KEY.startsWith('sk-test-'))) {
      console.log('✅ Environment: API key format valid');
    } else {
      console.log('❌ Environment: API key format invalid');
    }
    
    // Check enhanced consciousness configuration
    if (process.env.USE_ENHANCED_CONSCIOUSNESS === 'true') {
      console.log('✅ Environment: Enhanced consciousness enabled');
    } else {
      console.log('ℹ️ Environment: Using standard consciousness');
    }
    
    // Check model configuration
    if (process.env.ANTHROPIC_MODEL === 'claude-4-sonnet-20250514') {
      console.log('✅ Environment: Claude 4 Sonnet configured');
    } else {
      console.log('⚠️ Environment: Model not set to Claude 4 Sonnet');
    }
    
    // Check rate limiting configuration
    const rateLimit = parseInt(process.env.API_RATE_LIMIT_PER_HOUR) || 100;
    if (rateLimit > 0 && rateLimit <= 1000) {
      console.log('✅ Environment: Rate limiting configured');
    } else {
      console.log('⚠️ Environment: Rate limiting configuration unusual');
    }
    
  } catch (error) {
    console.log('❌ Environment: Error -', error.message);
  }
  
  console.log('');
}

async function testSubstackConfiguration() {
  console.log('📧 Testing Enhanced Substack Configuration...');
  
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
      
      // Check Substack email format
      if (process.env.SUBSTACK_EMAIL.includes('@substack.com')) {
        console.log('✅ Substack: Substack email format correct');
      } else {
        console.log('⚠️ Substack: Substack email may not be correct format');
      }
      
    } else {
      console.log('❌ Substack: Missing required configuration');
      console.log(`   - Substack Email: ${hasSubstackEmail ? '✓' : '✗'}`);
      console.log(`   - Gmail User: ${hasEmailUser ? '✓' : '✗'}`);
      console.log(`   - Gmail App Password: ${hasEmailPassword ? '✓' : '✗'}`);
    }
    
  } catch (error) {
    console.log('❌ Substack: Error -', error.message);
  }
  
  console.log('');
}

async function testProductionReadiness() {
  console.log('🚀 Testing Production Readiness...');
  
  try {
    // Test security headers availability
    const helmet = require('helmet');
    console.log('✅ Production: Security middleware available');
    
    // Test compression availability
    const compression = require('compression');
    console.log('✅ Production: Compression middleware available');
    
    // Test rate limiting availability
    const rateLimit = require('express-rate-limit');
    console.log('✅ Production: Rate limiting available');
    
    // Test input validation availability
    const validator = require('validator');
    console.log('✅ Production: Input validation available');
    
    // Test image processing availability
    const multer = require('multer');
    console.log('✅ Production: Image upload handling available');
    
    // Test database availability
    const sqlite3 = require('sqlite3');
    console.log('✅ Production: Database system available');
    
    // Test WebSocket availability
    const ws = require('ws');
    console.log('✅ Production: WebSocket support available');
    
    // Test email system availability
    const nodemailer = require('nodemailer');
    console.log('✅ Production: Email system available');
    
    // Test UUID generation
    const { v4: uuidv4 } = require('uuid');
    const testId = uuidv4();
    if (testId && testId.length === 36) {
      console.log('✅ Production: UUID generation works');
    } else {
      console.log('❌ Production: UUID generation failed');
    }
    
  } catch (error) {
    console.log('❌ Production: Error -', error.message);
  }
  
  console.log('');
}

async function runAllTests() {
  console.log('🎯 Archive Fever AI 2.0 - Enhanced Test Suite');
  console.log('================================================\n');
  
  await testEnvironmentValidation();
  await testInputValidation();
  await testAnthropicClient();
  await testEnhancedLivingMemory();
  await testEnhancedConsciousness();
  await testSubstackConfiguration();
  await testProductionReadiness();
  
  console.log('🏁 Enhanced test suite completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Fix any ❌ issues shown above');
  console.log('2. Run: npm run test-substack');
  console.log('3. Deploy to Railway');
  console.log('4. Monitor /api/health endpoint');
  console.log('');
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAnthropicClient,
  testEnhancedLivingMemory,
  testEnhancedConsciousness,
  testInputValidation,
  testEnvironmentValidation,
  testSubstackConfiguration,
  testProductionReadiness,
  runAllTests
}; 