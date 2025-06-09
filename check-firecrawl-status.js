require('dotenv').config();
const FirecrawlApp = require('@mendable/firecrawl-js').default;

async function checkFirecrawlStatus() {
  console.log('🔍 Checking Firecrawl search API status...');
  
  try {
    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    
    // Simple test search
    const result = await firecrawl.search("test", { limit: 1 });
    
    if (result && result.data) {
      console.log('✅ Firecrawl search API is working!');
      console.log(`📊 Found ${result.data.length} results`);
      return true;
    } else {
      console.log('⚠️ Firecrawl search returned no data');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Firecrawl search failed: ${error.message}`);
    return false;
  }
}

// Run check
checkFirecrawlStatus()
  .then(working => {
    if (working) {
      console.log('🎉 Ready to test bulk text discovery!');
    } else {
      console.log('⏳ Firecrawl search API still having issues');
    }
  }); 