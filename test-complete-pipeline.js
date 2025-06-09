const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8080';

async function testCompletePipeline() {
  console.log('🔬 TESTING COMPLETE AUTONOMOUS DISCOVERY PIPELINE\\n');
  
  try {
    // Get a research project
    const projectsResponse = await fetch(`${API_BASE}/api/research/projects`);
    const projectsData = await projectsResponse.json();
    
    if (!projectsData.projects || projectsData.projects.length === 0) {
      console.log('❌ No research projects found');
      return;
    }
    
    const project = projectsData.projects[0];
    console.log(`📋 Testing with project: "${project.title}"`);
    console.log(`🆔 Project ID: ${project.id}\\n`);
    
    // Step 1: Check current state
    console.log('1️⃣ CHECKING CURRENT STATE');
    const currentSources = await fetch(`${API_BASE}/api/research/discovered-sources/${project.id}`);
    const currentSourcesData = await currentSources.json();
    const sourcesWithLibraryTexts = currentSourcesData.sources?.filter(s => s.text_added_to_library === 1) || [];
    console.log(`   📚 Sources already in library: ${sourcesWithLibraryTexts.length}`);
    console.log(`   🔍 Total discovered sources: ${currentSourcesData.sources?.length || 0}\\n`);
    
    // Step 2: Check current library size
    console.log('2️⃣ CHECKING LIBRARY SIZE');
    const textsResponse = await fetch(`${API_BASE}/api/texts`);
    const textsData = await textsResponse.json();
    console.log(`   📖 Current texts in library: ${textsData.texts?.length || 0}\\n`);
    
    // Step 3: Trigger discovery
    console.log('3️⃣ TRIGGERING NEW DISCOVERY');
    const discoveryResponse = await fetch(`${API_BASE}/api/research/discover-sources/${project.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const discoveryData = await discoveryResponse.json();
    console.log(`   ✅ Discovery completed:`);
    console.log(`   🔍 Sources found: ${discoveryData.discovery?.sourcesFound || 0}`);
    console.log(`   📚 Sources added to reading list: ${discoveryData.discovery?.sourcesAdded || 0}\\n`);
    
    // Step 4: Check post-discovery state  
    console.log('4️⃣ CHECKING POST-DISCOVERY STATE');
    const newSourcesResponse = await fetch(`${API_BASE}/api/research/discovered-sources/${project.id}`);
    const newSourcesData = await newSourcesResponse.json();
    
    console.log(`   📋 Total sources now: ${newSourcesData.sources?.length || 0}`);
    
    // Check the most recent sources
    const recentSources = newSourcesData.sources?.slice(-5) || [];
    console.log('   🔍 Recent sources status:');
    recentSources.forEach((source, i) => {
      console.log(`      ${i+1}. "${source.title}"`);
      console.log(`         URL: ${source.url}`);
      console.log(`         Added to library: ${source.text_added_to_library === 1 ? '✅' : '❌'}`);
      console.log(`         Library text ID: ${source.library_text_id || 'none'}`);
    });
    console.log('');
    
    // Step 5: Check if library size changed
    console.log('5️⃣ CHECKING LIBRARY CHANGES');
    const newTextsResponse = await fetch(`${API_BASE}/api/texts`);
    const newTextsData = await newTextsResponse.json();
    const newLibrarySize = newTextsData.texts?.length || 0;
    
    console.log(`   📖 Library size after discovery: ${newLibrarySize}`);
    console.log(`   📈 Change: +${newLibrarySize - (textsData.texts?.length || 0)} texts\\n`);
    
    // Step 6: Check for recent texts with discovery metadata
    console.log('6️⃣ CHECKING FOR AUTONOMOUSLY DISCOVERED TEXTS');
    const recentTexts = newTextsData.texts?.filter(text => 
      text.discovered_via || text.source_site
    ) || [];
    
    console.log(`   🤖 Texts with discovery metadata: ${recentTexts.length}`);
    recentTexts.slice(-3).forEach((text, i) => {
      console.log(`      ${i+1}. "${text.title}" by ${text.author}`);
      console.log(`         Discovered via: ${text.discovered_via || 'unknown'}`);
      console.log(`         Source site: ${text.source_site || 'unknown'}`);
      console.log(`         Upload date: ${text.upload_date}`);
    });
    
    // Summary
    console.log('\\n📊 PIPELINE SUMMARY:');
    const successfulFetches = newSourcesData.sources?.filter(s => s.text_added_to_library === 1)?.length || 0;
    const totalSources = newSourcesData.sources?.length || 0;
    
    console.log(`   🎯 Success rate: ${successfulFetches}/${totalSources} sources successfully fetched`);
    console.log(`   📚 Library growth: +${newLibrarySize - (textsData.texts?.length || 0)} texts`);
    
    if (successfulFetches === 0) {
      console.log('   ❌ ISSUE: No sources are being successfully fetched and added to library');
      console.log('   🔧 NEXT STEPS: Check Firecrawl integration and fetchAndAddToLibrary function');
    } else {
      console.log('   ✅ SUCCESS: Autonomous text discovery is working!');
    }
    
  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
  }
}

testCompletePipeline(); 