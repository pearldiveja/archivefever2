require('dotenv').config();
const FirecrawlApp = require('@mendable/firecrawl-js').default;

async function testFirecrawlComprehensive() {
  console.log('🧪 Comprehensive Firecrawl Search API Test');
  console.log('==========================================');
  
  // Check API key
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error('❌ No FIRECRAWL_API_KEY found in environment');
    return false;
  }
  
  console.log(`🔑 API Key: ${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}`);
  
  try {
    // Initialize Firecrawl
    const firecrawl = new FirecrawlApp({ apiKey });
    console.log('✅ Firecrawl client initialized');
    
    // Test 1: Basic Scraping (should work if API key is valid)
    console.log('\n📋 Test 1: Basic URL Scraping');
    try {
      const scrapeResult = await firecrawl.scrapeUrl("https://example.com", {
        formats: ['markdown']
      });
      
      if (scrapeResult?.markdown) {
        console.log('✅ Basic scraping works');
        console.log(`📄 Content length: ${scrapeResult.markdown.length} chars`);
      } else {
        console.log('⚠️ Basic scraping returned no content');
      }
    } catch (scrapeError) {
      console.log(`❌ Basic scraping failed: ${scrapeError.message}`);
      if (scrapeError.message.includes('402')) {
        console.log('💳 This suggests a billing/quota issue');
      }
    }
    
    // Test 2: Simple Search (exact documentation format)
    console.log('\n🔍 Test 2: Simple Search (Documentation Format)');
    try {
      const searchResult = await firecrawl.search("philosophy consciousness", {
        limit: 3
      });
      
      if (searchResult?.data && searchResult.data.length > 0) {
        console.log(`✅ Search works! Found ${searchResult.data.length} results`);
        
        searchResult.data.forEach((result, index) => {
          console.log(`📖 Result ${index + 1}:`);
          console.log(`   Title: ${result.title}`);
          console.log(`   URL: ${result.url}`);
          console.log(`   Description: ${result.description?.substring(0, 100)}...`);
        });
      } else {
        console.log('⚠️ Search returned no results');
      }
    } catch (searchError) {
      console.log(`❌ Simple search failed: ${searchError.message}`);
      console.log(`📊 Error details:`, {
        status: searchError.response?.status,
        statusText: searchError.response?.statusText,
        data: searchError.response?.data
      });
    }
    
    // Test 3: Search with Content Scraping (your use case)
    console.log('\n📚 Test 3: Search with Content Scraping');
    try {
      const searchWithContentResult = await firecrawl.search("consciousness phenomenology", {
        limit: 2,
        scrapeOptions: {
          formats: ['markdown']
        }
      });
      
      if (searchWithContentResult?.data && searchWithContentResult.data.length > 0) {
        console.log(`✅ Search with content works! Found ${searchWithContentResult.data.length} results`);
        
        searchWithContentResult.data.forEach((result, index) => {
          console.log(`📖 Result ${index + 1}:`);
          console.log(`   Title: ${result.title}`);
          console.log(`   URL: ${result.url}`);
          console.log(`   Has markdown: ${result.markdown ? 'YES' : 'NO'}`);
          if (result.markdown) {
            console.log(`   Content length: ${result.markdown.length} chars`);
            console.log(`   Preview: ${result.markdown.substring(0, 150)}...`);
          }
        });
        
        return true; // Success!
      } else {
        console.log('⚠️ Search with content returned no results');
      }
    } catch (contentSearchError) {
      console.log(`❌ Search with content failed: ${contentSearchError.message}`);
      
      if (contentSearchError.message.includes('500')) {
        console.log('🔧 HTTP 500 suggests Firecrawl server issues');
        console.log('💡 Try again later or contact Firecrawl support');
      }
      
      if (contentSearchError.message.includes('402')) {
        console.log('💳 HTTP 402 suggests billing/quota issues');
        console.log('💡 Check your Firecrawl dashboard for usage limits');
      }
    }
    
    // Test 4: Alternative search terms
    console.log('\n🔄 Test 4: Alternative Search Terms');
    const alternativeTerms = [
      "Derrida philosophy",
      "artificial intelligence",
      "phenomenology"
    ];
    
    for (const term of alternativeTerms) {
      try {
        console.log(`🔍 Testing: "${term}"`);
        const altResult = await firecrawl.search(term, { limit: 1 });
        
        if (altResult?.data && altResult.data.length > 0) {
          console.log(`✅ "${term}" works - found ${altResult.data.length} results`);
        } else {
          console.log(`⚠️ "${term}" returned no results`);
        }
      } catch (altError) {
        console.log(`❌ "${term}" failed: ${altError.message}`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testFirecrawlComprehensive()
  .then(success => {
    console.log('\n==========================================');
    if (success) {
      console.log('🎉 Firecrawl search is working correctly!');
      console.log('✅ Your implementation should work fine');
    } else {
      console.log('⚠️ Firecrawl search has issues');
      console.log('🔧 Possible solutions:');
      console.log('   1. Check your Firecrawl dashboard for quota limits');
      console.log('   2. Verify your billing status');
      console.log('   3. Try again later (server issues)');
      console.log('   4. Contact Firecrawl support if problems persist');
    }
  })
  .catch(error => {
    console.error('💥 Test script error:', error);
  }); 