require('dotenv').config();
const SustainedResearchSystem = require('./src/core/SustainedResearchSystem');
const LivingMemory = require('./src/core/LivingMemory');
const AnthropicClient = require('./src/clients/AnthropicClient');
const FirecrawlApp = require('@mendable/firecrawl-js').default;

async function testAlternativeDiscovery() {
  console.log('🧪 Testing Alternative Text Discovery...');
  
  try {
    // Initialize components
    const memory = new LivingMemory('./ariadnes_memory.db');
    await memory.initialize();
    
    const anthropic = new AnthropicClient();
    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    
    // Create mock global.firecrawl
    global.firecrawl = firecrawl;
    
    const research = new SustainedResearchSystem(memory, anthropic, null);
    
    // Test the alternative discovery method directly
    console.log('\n🔍 Testing alternative bulk text discovery...');
    
    const result = await research.alternativeBulkTextDiscovery('consciousness phenomenology', null, {
      limit: 2,
      minLength: 500
    });
    
    console.log(`\n📊 Alternative Discovery Results:`);
    console.log(`   Success: ${result.success}`);
    console.log(`   Message: ${result.message}`);
    console.log(`   Discovered: ${result.discovered}`);
    console.log(`   Failed: ${result.failed}`);
    
    if (result.addedTexts && result.addedTexts.length > 0) {
      console.log(`\n📚 Added Texts:`);
      for (const text of result.addedTexts) {
        console.log(`   - "${text.title}" by ${text.author} (${text.contentLength} chars)`);
      }
    }
    
    if (result.success) {
      console.log('\n✅ ALTERNATIVE DISCOVERY WORKS!');
      console.log('   The system can acquire texts even when Firecrawl search fails.');
    } else {
      console.log('\n❌ Alternative discovery failed');
    }
    
    await memory.close();
    return result.success;
    
  } catch (error) {
    console.error('\n💥 Test failed:', error);
    return false;
  }
}

// Test the accessible sources method independently
async function testAccessibleSources() {
  console.log('\n🧪 Testing Accessible Sources Generation...');
  
  try {
    const memory = new LivingMemory('./ariadnes_memory.db');
    await memory.initialize();
    
    const anthropic = new AnthropicClient();
    const research = new SustainedResearchSystem(memory, anthropic, null);
    
    const testTerms = [
      'consciousness phenomenology',
      'artificial intelligence',
      'bartleby melville',
      'buddhist epistemology',
      'derrida hospitality'
    ];
    
    for (const term of testTerms) {
      console.log(`\n🔍 Sources for "${term}":`);
      const sources = await research.getAccessiblePhilosophicalSources(term);
      
      for (const source of sources.slice(0, 3)) {
        console.log(`   - ${source.title} by ${source.author} (${source.source})`);
        console.log(`     URL: ${source.url}`);
      }
    }
    
    await memory.close();
    console.log('\n✅ ACCESSIBLE SOURCES GENERATION WORKS!');
    return true;
    
  } catch (error) {
    console.error('\n💥 Accessible sources test failed:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🎯 Archive Fever AI - Alternative Text Discovery Test\n');
  
  const sourcesWork = await testAccessibleSources();
  const discoveryWorks = await testAlternativeDiscovery();
  
  if (sourcesWork && discoveryWorks) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('   The alternative discovery system is working correctly.');
    console.log('   Ariadne can acquire texts even with Firecrawl search API issues.');
  } else {
    console.log('\n💔 Some tests failed. Check the logs above.');
  }
}

runTests(); 