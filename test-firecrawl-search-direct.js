const FirecrawlApp = require('@mendable/firecrawl-js').default;

async function testFirecrawlSearchDirect() {
  console.log('🧪 Testing Firecrawl search API directly...');
  
  const apiKey = process.env.FIRECRAWL_API_KEY || 'fc-bb38fffc4bd1423dab101981dd217d45';
  console.log(`🔑 Using API key: ${apiKey.substring(0, 10)}...`);
  
  const firecrawl = new FirecrawlApp({ apiKey: apiKey });
  
  try {
    console.log('\n🔍 Test 1: Simple search (matching Python example exactly)');
    const searchResult1 = await firecrawl.search('consciousness phenomenology', {
      limit: 3,
      scrapeOptions: {
        formats: ['markdown']
      }
    });
    
    console.log('✅ Search successful!');
    console.log('📊 Results:', JSON.stringify(searchResult1, null, 2));
    
  } catch (error) {
    console.log('❌ Search failed with error:');
    console.log('Error message:', error.message);
    console.log('Error details:', error);
    
    if (error.response) {
      console.log('HTTP Status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
  
  try {
    console.log('\n🔍 Test 2: Even simpler search');
    const searchResult2 = await firecrawl.search('philosophy', {
      limit: 1,
      scrapeOptions: {
        formats: ['markdown']
      }
    });
    
    console.log('✅ Simple search successful!');
    console.log('📊 Results count:', searchResult2?.data?.length || 0);
    
  } catch (error) {
    console.log('❌ Simple search failed:');
    console.log('Error:', error.message);
  }
  
  try {
    console.log('\n🔍 Test 3: Check account status');
    // Try a simple scrape to see if API key works
    const scrapeResult = await firecrawl.scrapeUrl('https://example.com', {
      formats: ['markdown']
    });
    
    console.log('✅ API key works for scraping');
    console.log('📊 Scrape success:', scrapeResult.success);
    
  } catch (error) {
    console.log('❌ API key issue:');
    console.log('Error:', error.message);
  }
}

// Run the test
testFirecrawlSearchDirect(); 