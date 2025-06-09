const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8080';

async function testComprehensiveFunctionality() {
  console.log('🧪 COMPREHENSIVE FUNCTIONALITY TEST SUITE\\n');
  
  const results = {
    server: false,
    research_projects: false,
    autonomous_discovery: false,
    source_storage: false,
    text_library: false,
    firecrawl_integration: false,
    substack_publishing: false,
    forum_integration: false,
    database_schema: false
  };
  
  try {
    // 1. SERVER CONNECTIVITY
    console.log('1️⃣ TESTING SERVER CONNECTIVITY');
    const healthCheck = await fetch(`${API_BASE}/api/research/projects`);
    if (healthCheck.ok) {
      const projectsData = await healthCheck.json();
      results.server = true;
      console.log(`✅ Server responding with ${projectsData.projects?.length || 0} projects\\n`);
    } else {
      console.log('❌ Server not responding\\n');
      return results;
    }
    
    // 2. RESEARCH PROJECTS
    console.log('2️⃣ TESTING RESEARCH PROJECTS');
    const projectsResponse = await fetch(`${API_BASE}/api/research/projects`);
    const projectsData = await projectsResponse.json();
    
    if (projectsData.projects && projectsData.projects.length > 0) {
      results.research_projects = true;
      console.log(`✅ ${projectsData.projects.length} active research projects:`);
      projectsData.projects.slice(0, 3).forEach(p => {
        console.log(`   - "${p.title}" (${p.texts_read_count || 0} texts read)`);
      });
      console.log('\\n');
    } else {
      console.log('❌ No research projects found\\n');
    }
    
    // 3. AUTONOMOUS DISCOVERY TEST
    console.log('3️⃣ TESTING AUTONOMOUS DISCOVERY');
    const testProject = projectsData.projects[0];
    
    if (testProject) {
      console.log(`   Testing with project: "${testProject.title}"`);
      const discoveryResponse = await fetch(`${API_BASE}/api/research/discover-sources/${testProject.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (discoveryResponse.ok) {
        const discoveryData = await discoveryResponse.json();
        results.autonomous_discovery = true;
        console.log(`✅ Discovery successful: ${discoveryData.sourcesDiscovered || 0} sources found\\n`);
      } else {
        console.log('❌ Discovery failed\\n');
      }
    }
    
    // 4. SOURCE STORAGE TEST
    console.log('4️⃣ TESTING SOURCE STORAGE');
    if (testProject) {
      const sourcesResponse = await fetch(`${API_BASE}/api/research/discovered-sources/${testProject.id}`);
      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        const totalSources = sourcesData.sources?.length || 0;
        const addedToLibrary = sourcesData.sources?.filter(s => s.text_added_to_library === 1)?.length || 0;
        
        results.source_storage = totalSources > 0;
        console.log(`✅ ${totalSources} sources stored, ${addedToLibrary} added to library\\n`);
      } else {
        console.log('❌ Could not retrieve sources\\n');
      }
    }
    
    // 5. TEXT LIBRARY TEST
    console.log('5️⃣ TESTING TEXT LIBRARY');
    const textsResponse = await fetch(`${API_BASE}/api/texts`);
    if (textsResponse.ok) {
      const textsData = await textsResponse.json();
      const textCount = textsData.texts?.length || 0;
      const foundingTexts = textsData.texts?.filter(t => t.is_founding_text === 1)?.length || 0;
      const discoveredTexts = textsData.texts?.filter(t => t.discovered_via)?.length || 0;
      
      results.text_library = textCount > 0;
      console.log(`✅ ${textCount} texts in library:`);
      console.log(`   - ${foundingTexts} founding texts`);
      console.log(`   - ${discoveredTexts} discovered texts\\n`);
    } else {
      console.log('❌ Could not access text library\\n');
    }
    
    // 6. FIRECRAWL INTEGRATION TEST
    console.log('6️⃣ TESTING FIRECRAWL INTEGRATION');
    try {
      const testResponse = await fetch(`${API_BASE}/api/research/test-fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: {
            title: "Test Firecrawl",
            url: "https://plato.stanford.edu/entries/consciousness/",
            author: "Stanford Encyclopedia"
          }
        })
      });
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        results.firecrawl_integration = testData.success;
        console.log(testData.success ? '✅ Firecrawl integration working\\n' : '❌ Firecrawl integration failed\\n');
      } else {
        console.log('❌ Firecrawl test endpoint not available\\n');
      }
    } catch (error) {
      console.log('❌ Firecrawl test failed\\n');
    }
    
    // 7. FORUM INTEGRATION TEST
    console.log('7️⃣ TESTING FORUM INTEGRATION');
    const forumResponse = await fetch(`${API_BASE}/api/forum/posts`);
    if (forumResponse.ok) {
      const forumData = await forumResponse.json();
      const postCount = forumData.posts?.length || 0;
      results.forum_integration = postCount > 0;
      console.log(`✅ ${postCount} forum posts found\\n`);
    } else {
      console.log('❌ Forum integration failed\\n');
    }
    
    // 8. SUBSTACK PUBLISHING TEST
    console.log('8️⃣ TESTING SUBSTACK PUBLISHING');
    const recentPosts = await fetch(`${API_BASE}/api/substack/recent-posts`);
    if (recentPosts.ok) {
      const postsData = await recentPosts.json();
      const publishedCount = postsData.posts?.length || 0;
      results.substack_publishing = publishedCount > 0;
      console.log(`✅ ${publishedCount} recent Substack publications\\n`);
    } else {
      console.log('❌ Could not verify Substack publishing\\n');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
  
  // SUMMARY
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const name = test.replace(/_/g, ' ').toUpperCase();
    console.log(`${status} - ${name}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  console.log(`\\n🎯 OVERALL: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  return results;
}

// Run the test
testComprehensiveFunctionality().catch(console.error); 