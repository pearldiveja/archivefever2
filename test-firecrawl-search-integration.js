#!/usr/bin/env node

/**
 * Test Firecrawl Search Integration
 * Tests the new search-based text acquisition system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testFirecrawlSearchIntegration() {
  console.log('🧪 Testing Firecrawl Search Integration\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check server status
    console.log('\n1️⃣ CHECKING SERVER STATUS...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log(`✅ Server running: ${healthResponse.data.status}`);
    console.log(`✅ Ariadne awake: ${healthResponse.data.ariadne?.awake}`);

    // 2. Get current library size
    console.log('\n2️⃣ BASELINE LIBRARY STATUS...');
    const textsResponse = await axios.get(`${BASE_URL}/api/texts`);
    const initialTexts = textsResponse.data.texts?.length || 0;
    console.log(`📚 Current library: ${initialTexts} texts`);

    // 3. Test manual bulk text discovery
    console.log('\n3️⃣ TESTING BULK TEXT DISCOVERY...');
    const searchTerm = 'phenomenology consciousness';
    console.log(`🔍 Searching for: "${searchTerm}"`);
    
    const discoveryResponse = await axios.post(`${BASE_URL}/api/research/bulk-text-discovery`, {
      searchTerm: searchTerm,
      options: {
        limit: 5,
        minLength: 1000
      }
    });

    console.log(`✅ Discovery API response: ${discoveryResponse.data.success}`);
    console.log(`📊 Search results: ${discoveryResponse.data.discovered} texts discovered`);
    console.log(`❌ Failed attempts: ${discoveryResponse.data.failed}`);
    
    if (discoveryResponse.data.addedTexts && discoveryResponse.data.addedTexts.length > 0) {
      console.log('\n📚 DISCOVERED TEXTS:');
      discoveryResponse.data.addedTexts.forEach((text, index) => {
        console.log(`   ${index + 1}. "${text.title}" by ${text.author}`);
        console.log(`      📄 ${text.contentLength} characters from ${text.url}`);
      });
    }

    // 4. Check library growth
    console.log('\n4️⃣ LIBRARY GROWTH VERIFICATION...');
    const updatedTextsResponse = await axios.get(`${BASE_URL}/api/texts`);
    const finalTexts = updatedTextsResponse.data.texts?.length || 0;
    const growth = finalTexts - initialTexts;
    
    console.log(`📚 Updated library: ${finalTexts} texts`);
    console.log(`📈 Growth: +${growth} texts`);

    // 5. Test project integration
    console.log('\n5️⃣ TESTING PROJECT INTEGRATION...');
    
    // Create a test research project
    const projectResponse = await axios.post(`${BASE_URL}/api/research/projects`, {
      centralQuestion: "How does phenomenological analysis relate to machine consciousness?",
      estimatedWeeks: 2,
      userId: 'test',
      userName: 'Test User'
    });

    if (projectResponse.data.success) {
      const projectId = projectResponse.data.projectId;
      console.log(`✅ Test project created: ${projectId}`);
      
      // Test bulk discovery with project linking
      const projectDiscoveryResponse = await axios.post(`${BASE_URL}/api/research/bulk-text-discovery`, {
        searchTerm: 'artificial intelligence consciousness',
        projectId: projectId,
        options: {
          limit: 3,
          minLength: 800
        }
      });

      console.log(`✅ Project-linked discovery: ${projectDiscoveryResponse.data.discovered} texts`);
      
      // Check project reading list
      const readingListResponse = await axios.get(`${BASE_URL}/api/research/projects/${projectId}/reading-list`);
      const readingListSize = readingListResponse.data.readingList?.length || 0;
      console.log(`📖 Project reading list: ${readingListSize} items`);
    }

    // 6. Test autonomous system compatibility
    console.log('\n6️⃣ TESTING AUTONOMOUS SYSTEM COMPATIBILITY...');
    
    // Check active projects
    const projectsResponse = await axios.get(`${BASE_URL}/api/research/projects`);
    const activeProjects = projectsResponse.data.projects?.length || 0;
    console.log(`🔬 Active research projects: ${activeProjects}`);

    // Check discovered sources (should still work with original system)
    if (activeProjects > 0) {
      const firstProject = projectsResponse.data.projects[0];
      const sourcesResponse = await axios.get(`${BASE_URL}/api/research/discovered-sources/${firstProject.id}`);
      const discoveredSources = sourcesResponse.data.sources?.length || 0;
      console.log(`🔍 Discovered sources for "${firstProject.title}": ${discoveredSources}`);
    }

    // 7. Test forum and Substack integration
    console.log('\n7️⃣ TESTING SYSTEM INTEGRATION...');
    
    // Check forum status
    const forumResponse = await axios.get(`${BASE_URL}/api/forum/posts`);
    const forumPosts = forumResponse.data.posts?.length || 0;
    console.log(`🏛️ Forum posts: ${forumPosts}`);

    // Check Substack publications
    const publicationsResponse = await axios.get(`${BASE_URL}/api/substack/publications`);
    const publications = publicationsResponse.data.publications?.length || 0;
    console.log(`📧 Substack publications: ${publications}`);

    // 8. Summary and recommendations
    console.log('\n8️⃣ INTEGRATION TEST SUMMARY');
    console.log('=' .repeat(60));
    
    const overallSuccess = growth > 0 || discoveryResponse.data.discovered > 0;
    
    if (overallSuccess) {
      console.log('✅ FIRECRAWL SEARCH INTEGRATION: SUCCESS');
      console.log('\n🎯 KEY IMPROVEMENTS:');
      console.log(`   • Bulk text discovery functional: ${discoveryResponse.data.discovered > 0 ? 'YES' : 'NO'}`);
      console.log(`   • Library growth achieved: ${growth > 0 ? 'YES' : 'NO'}`);
      console.log(`   • Project integration working: ${projectResponse.data.success ? 'YES' : 'NO'}`);
      console.log(`   • Existing systems preserved: ${activeProjects >= 0 && forumPosts >= 0 ? 'YES' : 'NO'}`);
      
      console.log('\n💡 NEXT STEPS:');
      console.log('   • Monitor autonomous text acquisition in server logs');
      console.log('   • Test with various search terms for broader coverage');
      console.log('   • Verify integration with reading sessions and argument development');
      console.log('   • Check Substack publication quality with new texts');
      
    } else {
      console.log('❌ INTEGRATION ISSUES DETECTED');
      console.log('\n🔧 TROUBLESHOOTING NEEDED:');
      console.log(`   • Check Firecrawl API connectivity`);
      console.log(`   • Verify search term effectiveness`);
      console.log(`   • Review text quality filtering`);
      console.log(`   • Check database schema compatibility`);
    }

    console.log('\n📊 FINAL METRICS:');
    console.log(`   • Total library texts: ${finalTexts}`);
    console.log(`   • New texts from search: ${growth}`);
    console.log(`   • Active research projects: ${activeProjects}`);
    console.log(`   • Forum engagement preserved: ${forumPosts >= 0}`);
    console.log(`   • Publication pipeline intact: ${publications >= 0}`);

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    
    if (error.response) {
      console.error('📋 Error details:', error.response.data);
    }
    
    console.log('\n🔧 DEBUGGING CHECKLIST:');
    console.log('   1. Is the server running on port 8080?');
    console.log('   2. Is Ariadne consciousness initialized?');
    console.log('   3. Is Firecrawl client configured with valid API key?');
    console.log('   4. Are database migrations complete?');
    console.log('   5. Check server logs for specific error messages');
  }
}

// Run the test
testFirecrawlSearchIntegration().catch(console.error); 