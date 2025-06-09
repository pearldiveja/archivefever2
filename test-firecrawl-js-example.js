// Test script using the exact JavaScript example provided
// Install with npm install @mendable/firecrawl-js
import FireCrawlApp from '@mendable/firecrawl-js';

async function testFirecrawlJSExample() {
  console.log('🧪 Testing Firecrawl search with exact JavaScript example...');
  
  const app = new FireCrawlApp({apiKey: 'fc-bb38fffc4bd1423dab101981dd217d45'});
  
  try {
    console.log('🔍 Test 1: Searching for "derrida text"');
    const searchResult = await app.search(
      'derrida text',
      {
        limit: 5,
        scrapeOptions: {
          "formats": [ "markdown" ]
        }
      }
    );
    
    console.log('✅ Search successful!');
    console.log('📊 Results:', JSON.stringify(searchResult, null, 2));
    
    if (searchResult && searchResult.data && searchResult.data.length > 0) {
      console.log(`🎯 Found ${searchResult.data.length} results`);
      searchResult.data.forEach((result, index) => {
        console.log(`📄 Result ${index + 1}: ${result.url}`);
        if (result.markdown) {
          console.log(`📝 Content preview: ${result.markdown.substring(0, 200)}...`);
        }
      });
    } else {
      console.log('⚠️ No results found');
    }
    
  } catch (error) {
    console.error('❌ Search failed:', error.message);
    console.error('📋 Error details:', error);
    
    if (error.message.includes('500')) {
      console.log('🔍 HTTP 500 - This suggests a server-side issue with Firecrawl');
    } else if (error.message.includes('402')) {
      console.log('💳 HTTP 402 - This suggests a payment/quota issue');
    } else if (error.message.includes('401')) {
      console.log('🔑 HTTP 401 - This suggests an API key issue');
    }
  }
  
  try {
    console.log('\n🔍 Test 2: Searching for "consciousness phenomenology"');
    const searchResult2 = await app.search(
      'consciousness phenomenology',
      {
        limit: 3,
        scrapeOptions: {
          "formats": [ "markdown" ]
        }
      }
    );
    
    console.log('✅ Second search successful!');
    console.log('📊 Results count:', searchResult2?.data?.length || 0);
    
  } catch (error) {
    console.error('❌ Second search failed:', error.message);
  }
}

testFirecrawlJSExample(); 