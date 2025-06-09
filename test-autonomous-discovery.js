const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8080';

async function testAutonomousDiscoveryPipeline() {
  console.log('🔬 TESTING AUTONOMOUS DISCOVERY PIPELINE\n');
  
  try {
    // 1. Check if server is running
    console.log('1️⃣ Testing server connectivity...');
    const healthCheck = await fetch(`${API_BASE}/api/research/projects`);
    if (!healthCheck.ok) {
      throw new Error('Server not responding');
    }
    console.log('✅ Server is running\n');
    
    // 2. Get a research project to test with
    console.log('2️⃣ Getting research projects...');
    const projectsResponse = await fetch(`${API_BASE}/api/research/projects`);
    const projectsData = await projectsResponse.json();
    
    if (!projectsData.projects || projectsData.projects.length === 0) {
      throw new Error('No research projects found');
    }
    
    const testProject = projectsData.projects[0];
    console.log(`✅ Found test project: "${testProject.title}"`);
    console.log(`   Project ID: ${testProject.id}\n`);
    
    // 3. Check current discovered sources
    console.log('3️⃣ Checking existing discovered sources...');
    const sourcesResponse = await fetch(`${API_BASE}/api/research/discovered-sources/${testProject.id}`);
    const sourcesData = await sourcesResponse.json();
    
    console.log(`📊 Current discovered sources: ${sourcesData.sources?.length || 0}`);
    if (sourcesData.sources && sourcesData.sources.length > 0) {
      const addedToLibrary = sourcesData.sources.filter(s => s.text_added_to_library === 1).length;
      console.log(`📚 Sources added to library: ${addedToLibrary}/${sourcesData.sources.length}`);
      
      // Show first source details
      const firstSource = sourcesData.sources[0];
      console.log(`\n🔍 First source details:`);
      console.log(`   Title: ${firstSource.title}`);
      console.log(`   URL: ${firstSource.url}`);
      console.log(`   Added to library: ${firstSource.text_added_to_library ? 'YES' : 'NO'}`);
      console.log(`   Library text ID: ${firstSource.library_text_id || 'None'}`);
    }
    console.log('');
    
    // 4. Check current texts in library
    console.log('4️⃣ Checking current library texts...');
    const textsResponse = await fetch(`${API_BASE}/api/texts`);
    const textsData = await textsResponse.json();
    
    console.log(`📚 Total texts in library: ${textsData.texts?.length || 0}`);
    if (textsData.texts && textsData.texts.length > 0) {
      const autonomousTexts = textsData.texts.filter(t => t.discovered_via).length;
      console.log(`🤖 Autonomously discovered texts: ${autonomousTexts}/${textsData.texts.length}`);
      
      if (autonomousTexts > 0) {
        const autonomousText = textsData.texts.find(t => t.discovered_via);
        console.log(`\n🔍 Sample autonomous text:`);
        console.log(`   Title: ${autonomousText.title}`);
        console.log(`   Author: ${autonomousText.author}`);
        console.log(`   Discovered via: ${autonomousText.discovered_via}`);
        console.log(`   Source site: ${autonomousText.source_site || 'None'}`);
      }
    }
    console.log('');
    
    // 5. Test manual source discovery trigger
    console.log('5️⃣ Testing manual source discovery...');
    console.log('🔄 Triggering autonomous source discovery...');
    
    // Note: We don't have a direct trigger endpoint, so we'll wait for autonomous discovery
    console.log('⏳ Autonomous discovery runs every ~20-60 minutes');
    console.log('💡 Check server logs for discovery activity');
    
    console.log('\n📋 PIPELINE STATUS SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Server running: YES`);
    console.log(`✅ Research projects: ${projectsData.projects.length}`);
    console.log(`📊 Discovered sources: ${sourcesData.sources?.length || 0}`);
    console.log(`📚 Library texts: ${textsData.texts?.length || 0}`);
    console.log(`🤖 Autonomous texts: ${textsData.texts?.filter(t => t.discovered_via).length || 0}`);
    console.log(`⚡ Sources in library: ${sourcesData.sources?.filter(s => s.text_added_to_library === 1).length || 0}/${sourcesData.sources?.length || 0}`);
    
    // 6. Detailed diagnosis
    console.log('\n🔬 DETAILED DIAGNOSIS:');
    console.log('='.repeat(50));
    
    if (sourcesData.sources && sourcesData.sources.length > 0) {
      const failedSources = sourcesData.sources.filter(s => s.text_added_to_library === 0);
      if (failedSources.length > 0) {
        console.log(`❌ ${failedSources.length} sources discovered but NOT added to library`);
        console.log(`🔍 This indicates the fetchAndAddToLibrary function is failing`);
        console.log(`💡 Check server logs for Firecrawl errors or content fetch failures`);
      } else {
        console.log(`✅ All discovered sources successfully added to library`);
      }
    } else {
      console.log(`❌ No sources discovered yet`);
      console.log(`🔍 This indicates the source discovery process hasn't run or is failing`);
      console.log(`💡 Check server logs for discovery process execution`);
    }
    
    if (textsData.texts && textsData.texts.filter(t => t.discovered_via).length === 0) {
      console.log(`❌ No autonomously discovered texts in library`);
      console.log(`🔍 Either discovery isn't working or texts aren't being properly marked`);
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('='.repeat(50));
    console.log('1. Monitor server logs for discovery process execution');
    console.log('2. Look for Firecrawl fetch operations and their results');
    console.log('3. Check database schema for missing columns');
    console.log('4. Wait for next autonomous discovery cycle (next ~20-60 minutes)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Make sure the server is running on port 8080');
  }
}

// Run the test
testAutonomousDiscoveryPipeline(); 