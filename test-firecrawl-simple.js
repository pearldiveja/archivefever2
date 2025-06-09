require('dotenv').config();
const FirecrawlApp = require('@mendable/firecrawl-js').default;

async function testFirecrawlSearchAPI() {
  console.log('🧪 Testing Firecrawl Search API with correct format...');
  
  // Check API key
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error('❌ No FIRECRAWL_API_KEY found in environment');
    return false;
  }
  
  console.log(`🔑 API Key loaded: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  
  try {
    // Initialize Firecrawl
    const firecrawl = new FirecrawlApp({ apiKey });
    console.log('✅ Firecrawl initialized');
    
    // Test 1: Basic search following their documentation format
    console.log('\n🔍 Test 1: Basic Firecrawl search');
    try {
      const searchResult = await firecrawl.search("consciousness phenomenology", {
        limit: 3
      });
      
      console.log('✅ Search successful!');
      console.log('📊 Results:', searchResult?.data?.length || 0);
      
      if (searchResult?.data?.length > 0) {
        console.log('📚 First result:');
        console.log('  Title:', searchResult.data[0].title);
        console.log('  URL:', searchResult.data[0].url);
        console.log('  Description:', searchResult.data[0].description?.substring(0, 100) + '...');
      }
      
    } catch (searchError) {
      console.error('❌ Search failed:', searchError.message);
      console.error('🔍 Error details:', {
        status: searchError.response?.status,
        statusText: searchError.response?.statusText,
        data: searchError.response?.data
      });
    }
    
    // Test 2: Search with scraping options (like our current implementation)
    console.log('\n🔍 Test 2: Search with scrape options');
    try {
      const searchWithScrape = await firecrawl.search("artificial intelligence consciousness", {
        limit: 2,
        scrapeOptions: {
          formats: ['markdown']
        }
      });
      
      console.log('✅ Search with scrape options successful!');
      console.log('📊 Results:', searchWithScrape?.data?.length || 0);
      
      if (searchWithScrape?.data?.length > 0) {
        console.log('📚 Sample result with content:');
        const result = searchWithScrape.data[0];
        console.log('  Title:', result.title);
        console.log('  URL:', result.url);
        console.log('  Content length:', result.markdown?.length || 0);
      }
      
    } catch (scrapeError) {
      console.error('❌ Search with scrape failed:', scrapeError.message);
      console.error('🔍 Error details:', {
        status: scrapeError.response?.status,
        statusText: scrapeError.response?.statusText
      });
    }
    
    // Test 3: Simple URL scraping to verify API works
    console.log('\n🔍 Test 3: Simple URL scraping');
    try {
      const scrapeResult = await firecrawl.scrapeUrl("https://example.com", {
        formats: ['markdown']
      });
      
      console.log('✅ URL scraping works!');
      console.log('📄 Content length:', scrapeResult.markdown?.length || 0);
      
    } catch (urlError) {
      console.error('❌ URL scraping failed:', urlError.message);
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

// Run the test
testFirecrawlSearchAPI()
  .then(success => {
    if (success) {
      console.log('\n🎉 Firecrawl API testing completed!');
    } else {
      console.log('\n❌ Tests failed - check your API key and Firecrawl service status');
    }
  })
  .catch(console.error); 