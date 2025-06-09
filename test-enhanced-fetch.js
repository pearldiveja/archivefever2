const fetch = require('node-fetch');

async function testEnhancedFetch() {
  console.log('🔬 TESTING ENHANCED fetchAndAddToLibrary FUNCTION\\n');
  
  // Test with a real Stanford Encyclopedia source
  const testSource = {
    title: "Consciousness",
    author: "Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/consciousness/",
    source_site: "Stanford Encyclopedia",
    search_term: "consciousness philosophy",
    quality_score: 0.9,
    relevance_score: 0.8,
    credibility_score: 0.95,
    recommendation: "high_priority",
    content_preview: "Comprehensive overview of consciousness studies",
    discovery_date: new Date().toISOString()
  };
  
  console.log('📝 Test Source Details:');
  console.log(`   Title: ${testSource.title}`);
  console.log(`   URL: ${testSource.url}`);
  console.log(`   Source Site: ${testSource.source_site}\\n`);
  
  try {
    // Test direct API call to the enhanced function
    console.log('🔧 Calling enhanced fetch API endpoint...');
    
    const response = await fetch('http://localhost:8080/api/research/test-fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ source: testSource })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Enhanced fetch test response:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ Enhanced fetch test failed: ${response.status} ${response.statusText}`);
      const error = await response.text();
      console.log(`❌ Error details: ${error}`);
    }
    
  } catch (error) {
    console.log(`❌ Enhanced fetch test error: ${error.message}`);
  }
  
  // Also test checking library size
  try {
    console.log('\\n📚 Checking library size...');
    const libResponse = await fetch('http://localhost:8080/api/texts');
    const libData = await libResponse.json();
    console.log(`📖 Current library size: ${libData.texts.length} texts`);
    
    // Check for any recently added texts
    const recentTexts = libData.texts.filter(text => 
      text.title.includes('[REFERENCE]') || 
      text.discovered_via === 'autonomous_research'
    );
    
    console.log(`🤖 Autonomous research texts: ${recentTexts.length}`);
    
    if (recentTexts.length > 0) {
      console.log('\\n📋 Recent autonomous discoveries:');
      recentTexts.forEach((text, i) => {
        console.log(`   ${i+1}. "${text.title}" by ${text.author}`);
        console.log(`      Source: ${text.source_site || 'Unknown'}`);
        console.log(`      URL: ${text.source_url || 'None'}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Library check failed: ${error.message}`);
  }
}

testEnhancedFetch().catch(console.error); 