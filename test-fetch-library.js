const fetch = require('node-fetch');

async function testFetchAndAddToLibrary() {
  console.log('🔬 TESTING fetchAndAddToLibrary FUNCTION DIRECTLY\n');
  
  // Test source from actual discovered sources
  const testSource = {
    title: "Phenomenology",
    author: "Stanford Encyclopedia of Philosophy", 
    url: "https://plato.stanford.edu/entries/phenomenology/",
    source_site: "Stanford Encyclopedia",
    search_term: "digital consciousness phenomenology",
    quality_score: 0.9,
    relevance_score: 0.8,
    credibility_score: 0.95,
    recommendation: "high_priority",
    content_preview: "The philosophical study of experience and meaning",
    discovery_date: new Date().toISOString()
  };
  
  console.log('📝 Test Source Details:');
  console.log(`   Title: ${testSource.title}`);
  console.log(`   Author: ${testSource.author}`);
  console.log(`   URL: ${testSource.url}`);
  console.log(`   Source Site: ${testSource.source_site}`);
  console.log('');
  
  try {
    // Step 1: Test Firecrawl directly
    console.log('1️⃣ Testing Firecrawl directly...');
    
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: testSource.url,
        formats: ['markdown', 'text'],
        onlyMainContent: true,
        timeout: 15000
      })
    });
    
    if (!firecrawlResponse.ok) {
      console.log(`❌ Firecrawl API error: ${firecrawlResponse.status} ${firecrawlResponse.statusText}`);
      const errorText = await firecrawlResponse.text();
      console.log(`❌ Error details: ${errorText}`);
      return;
    }
    
    const firecrawlData = await firecrawlResponse.json();
    console.log(`✅ Firecrawl response received`);
    console.log(`   Success: ${firecrawlData.success}`);
    console.log(`   Markdown length: ${firecrawlData.data?.markdown?.length || 0} characters`);
    console.log(`   Text length: ${firecrawlData.data?.text?.length || 0} characters`);
    
    if (firecrawlData.data?.markdown && firecrawlData.data.markdown.length > 500) {
      console.log(`✅ Content successfully fetched: ${firecrawlData.data.markdown.length} characters`);
      console.log(`📝 Content preview: ${firecrawlData.data.markdown.substring(0, 200)}...\n`);
      
      // Step 2: Test adding to library via API
      console.log('2️⃣ Testing library addition via API...');
      
      const libraryResponse = await fetch('http://localhost:8080/api/texts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: testSource.title,
          author: testSource.author,
          content: firecrawlData.data.markdown,
          source_url: testSource.url,
          discovered_via: 'autonomous_research',
          source_site: testSource.source_site
        })
      });
      
      if (libraryResponse.ok) {
        const libraryData = await libraryResponse.json();
        console.log(`✅ Successfully added to library!`);
        console.log(`   Text ID: ${libraryData.textId}`);
        console.log(`   Title: ${libraryData.title}`);
        
        // Step 3: Verify in library
        console.log('\n3️⃣ Verifying text appears in library...');
        const textsResponse = await fetch('http://localhost:8080/api/texts');
        const textsData = await textsResponse.json();
        
        const autonomousTexts = textsData.texts.filter(t => t.discovered_via);
        console.log(`🤖 Autonomous texts in library: ${autonomousTexts.length}`);
        
        if (autonomousTexts.length > 0) {
          console.log(`✅ SUCCESS! Autonomous text discovery is working!`);
          console.log(`   Latest autonomous text: "${autonomousTexts[autonomousTexts.length - 1].title}"`);
        }
        
      } else {
        console.log(`❌ Failed to add to library: ${libraryResponse.status} ${libraryResponse.statusText}`);
        const errorText = await libraryResponse.text();
        console.log(`❌ Error details: ${errorText}`);
      }
      
    } else {
      console.log(`❌ Content too short or not available`);
      console.log(`   Markdown: ${firecrawlData.data?.markdown?.length || 0} chars (minimum: 500)`);
    }
    
    console.log('\n🔬 DIAGNOSIS:');
    console.log('='.repeat(50));
    
    if (firecrawlData.success && firecrawlData.data?.markdown?.length > 500) {
      console.log('✅ Firecrawl is working correctly');
      console.log('✅ Content fetching is successful');
      console.log('🔍 The issue may be in the server-side fetchAndAddToLibrary function');
      console.log('💡 Check server logs when discovery runs to see detailed error messages');
    } else {
      console.log('❌ Firecrawl is not working properly');
      console.log('🔍 This explains why no texts are being added to library');
      console.log('💡 Check FIRECRAWL_API_KEY environment variable');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('🔍 Network connectivity issue');
    } else if (error.message.includes('auth')) {
      console.log('🔍 Authentication issue - check FIRECRAWL_API_KEY');
    } else {
      console.log('🔍 Unexpected error:', error.stack);
    }
  }
}

// Run the test
testFetchAndAddToLibrary(); 