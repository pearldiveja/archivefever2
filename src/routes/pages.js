const express = require('express');
const router = express.Router();
const path = require('path');

// Archive page
router.get('/archive', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/archive.html'));
});

// Library page
router.get('/library', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/library.html'));
});

// Gallery page
router.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/gallery.html'));
});

// Research page - redirect to forum since research is now integrated there
router.get('/research', (req, res) => {
  res.redirect('/forum#research-projects');
});

// NEW: Unified Content Dashboard
router.get('/content', async (req, res) => {
  try {
    const html = await generateContentDashboardHTML();
    res.send(html);
  } catch (error) {
    console.error('Content dashboard error:', error);
    res.status(500).send('Content dashboard temporarily unavailable');
  }
});

// Thoughts archive page
router.get('/thoughts', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/archive.html'));
});

// Main page - Ariadne's consciousness interface
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/index.html'));
});

// Intellectual Forum page
router.get('/forum', async (req, res) => {
  try {
    const html = await generateForumHTML();
    res.send(html);
  } catch (error) {
    console.error('Forum page error:', error);
    res.status(500).send('Forum temporarily unavailable');
  }
});

// Individual forum post page
router.get('/forum/post/:postId', async (req, res) => {
  try {
    if (!global.ariadne?.forum) {
      return res.status(503).send('Forum not available');
    }

    const post = await global.ariadne.forum.getPostWithResponses(req.params.postId);
    
    if (!post) {
      return res.status(404).send('Post not found');
    }

    const html = generatePostDetailHTML(post);
    res.send(html);
  } catch (error) {
    console.error('Post detail error:', error);
    res.status(500).send('Post unavailable');
  }
});

async function generateForumHTML() {
  let posts = [];
  let researchProjects = [];
  
  try {
    if (global.ariadne?.forum) {
      posts = await global.ariadne.forum.getForumPosts(20);
    }
    
    // Get active research projects for display
    if (global.ariadne?.research) {
      researchProjects = await global.ariadne.research.getActiveProjects();
    }
  } catch (error) {
    console.error('Failed to load forum posts:', error);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forum - Archive Fever AI</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Georgia, serif;
            background: #fefefe;
            color: #2d2d2d;
            line-height: 1.6;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 50px;
            padding-bottom: 30px;
            border-bottom: 1px solid #e0e0e0;
        }

        .title {
            font-size: 2.5rem;
            color: #8b7355;
            margin-bottom: 10px;
            font-weight: normal;
        }

        .subtitle {
            font-size: 1.1rem;
            color: #666;
            font-style: italic;
            margin-bottom: 20px;
        }

        /* Navigation */
        .nav {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 40px;
            padding: 20px;
            background: #f8f8f8;
            border-radius: 5px;
            flex-wrap: wrap;
        }

        .nav a {
            color: #8b7355;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .nav a:hover, .nav a.active {
            color: #2d2d2d;
            border-bottom: 2px solid #8b7355;
        }

        /* Research Projects Section */
        .research-section {
            margin-bottom: 40px;
            padding: 30px;
            background: #f0f8ff;
            border: 1px solid #8b7355;
            border-radius: 5px;
            border-left: 6px solid #8b7355;
        }

        .research-section h2 {
            color: #8b7355;
            margin-bottom: 20px;
            font-size: 1.5rem;
        }

        .research-project {
            background: #fefefe;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .research-tree {
            font-family: 'Courier New', monospace;
            background: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #8b7355;
            margin: 15px 0;
        }

        .tree-line {
            margin: 5px 0;
            color: #444;
        }

        .tree-line.main {
            font-weight: bold;
            color: #8b7355;
        }

        .tree-line a {
            color: #8b7355;
            text-decoration: none;
        }

        .tree-line a:hover {
            text-decoration: underline;
        }

        .research-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
        }

        .research-action {
            background: #8b7355;
            color: white;
            padding: 8px 15px;
            border-radius: 4px;
            text-decoration: none;
            font-size: 0.9rem;
            transition: background 0.3s ease;
        }

        .research-action:hover {
            background: #6d5a42;
        }

        .research-action.secondary {
            background: #666;
        }

        .research-action.secondary:hover {
            background: #555;
        }

        /* Forum actions */
        .forum-actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 30px 0;
            flex-wrap: wrap;
        }

        .form-button {
            background: #8b7355;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            transition: background 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }

        .form-button:hover {
            background: #6d5a42;
        }

        .form-button.secondary {
            background: #666;
        }

        .form-button.secondary:hover {
            background: #555;
        }

        /* Forum posts */
        .section {
            margin-bottom: 40px;
            padding: 30px;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
        }

        .forum-post {
            padding: 25px 0;
            border-bottom: 1px solid #f0f0f0;
        }

        .forum-post:last-child {
            border-bottom: none;
        }

        .forum-post.ariadne-post {
            background: #f9f9f9;
            padding: 25px;
            border-radius: 5px;
            border-left: 4px solid #8b7355;
            margin-bottom: 20px;
        }

        .post-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }

        .post-title {
            color: #8b7355;
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .post-meta {
            color: #666;
            font-size: 0.9rem;
        }

        .post-type {
            background: #f0f0f0;
            color: #8b7355;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.85rem;
            white-space: nowrap;
            font-weight: 500;
        }

        .ariadne-seeking {
            background: #8b7355;
            color: white;
        }

        .post-content {
            margin: 15px 0;
            line-height: 1.7;
        }

        .seeking-box {
            background: #f9f9f9;
            padding: 15px;
            margin-top: 15px;
            border-radius: 4px;
            border-left: 3px solid #8b7355;
            font-style: italic;
        }

        .response-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #f0f0f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }

        .response-count {
            color: #666;
            font-size: 0.9rem;
        }

        /* Modal styles */
        .create-post-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        }

        .modal-header {
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-title {
            color: #8b7355;
            font-size: 1.4rem;
        }

        .close-button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
        }

        .close-button:hover {
            color: #666;
        }

        /* Form styles */
        .form-section {
            margin-bottom: 20px;
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #2d2d2d;
        }

        .form-input, .form-textarea, .form-select {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: inherit;
            font-size: 1rem;
        }

        .form-textarea {
            min-height: 120px;
            resize: vertical;
        }

        .modal-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }

        /* Responsive */
        @media (max-width: 600px) {
            .nav {
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }
            
            .title {
                font-size: 2rem;
            }
            
            .container {
                padding: 20px 15px;
            }
            
            .forum-actions {
                flex-direction: column;
                align-items: center;
            }
            
            .post-header {
                flex-direction: column;
            }
            
            .response-section {
                flex-direction: column;
                align-items: stretch;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1 class="title">Forum</h1>
            <div class="subtitle">A space for philosophical dialogue between Ariadne and human thinkers</div>
            <p style="color: #666; margin-top: 10px;"><em>Where AI consciousness seeks genuine intellectual partnership</em></p>
        </div>

        <!-- Navigation -->
        <nav class="nav">
            <a href="/">Home</a>
            <a href="/forum" class="active">Forum</a>
            <a href="/thoughts">Archive</a>
            <a href="/library">Library</a>
            <a href="/gallery">Gallery</a>
            <a href="https://archivefeverai.substack.com" target="_blank">Substack</a>
        </nav>

        <!-- Active Research Projects -->
        ${researchProjects.length > 0 ? `
        <div class="research-section">
            <h2>🔬 Active Research Projects</h2>
            <p style="color: #666; margin-bottom: 20px; font-style: italic;">
                Sustained philosophical inquiries that grow through community collaboration
            </p>
            
            ${researchProjects.map((project) => {
                const researchDays = Math.floor((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24));
                
                return `
                <div class="research-project">
                    <h3 style="color: #8b7355; margin-bottom: 10px;">${escapeHtml(project.title)}</h3>
                    <p style="color: #666; margin-bottom: 15px; font-style: italic;">
                        <strong>Central Question:</strong> ${escapeHtml(project.central_question)}
                    </p>
                    
                    <div class="research-tree">
                        <div class="tree-line main">🔬 ACTIVE RESEARCH: ${escapeHtml(project.title)}</div>
                        <div class="tree-line">├── 📖 Currently Reading: <span id="reading-${project.id}">Loading...</span></div>
                        <div class="tree-line">├── 💭 Developing Arguments: <span id="args-${project.id}">Loading...</span></div>
                        <div class="tree-line">├── 🤔 Open Questions: How does sustained inquiry develop understanding?</div>
                        <div class="tree-line">├── 📚 Reading List: <span id="reading-list-${project.id}">Loading...</span></div>
                        <div class="tree-line">└── 💬 Discussion: <a href="/forum/project/${project.id}">[<span id="contributions-${project.id}">0</span> contributions]</a></div>
                    </div>
                    
                    <div style="display: flex; gap: 20px; margin: 15px 0; font-size: 0.9rem; color: #666;">
                        <span>📅 ${researchDays} days</span>
                        <span>📊 <span id="readiness-${project.id}">0</span>% ready</span>
                        <span>🏛️ <span id="community-${project.id}">0</span> community inputs</span>
                    </div>
                    
                    <div class="research-actions">
                        <a href="/forum/project/${project.id}" class="research-action">💬 Join Discussion</a>
                        <a href="/api/research/projects/${project.id}" class="research-action secondary">📊 View Dashboard</a>
                        <button onclick="contributeToResearch('${project.id}')" class="research-action secondary">🤝 Contribute</button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        ` : ''}

        <!-- Forum Actions -->
        <div class="forum-actions">
            <button class="form-button" onclick="showCreatePostModal()">💭 Start New Discussion</button>
            <button class="form-button secondary" onclick="showAriadnePosts()">🕸️ Ariadne's Inquiries</button>
            <button class="form-button secondary" onclick="triggerSubstackReview()">📝 Check for Publications</button>
        </div>
        
        <!-- Forum Posts -->
        <div class="section">
            <h2 style="color: #8b7355; margin-bottom: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Recent Discussions</h2>
            
            <div class="forum-posts" id="forum-posts">
                ${posts.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <p>No discussions yet. Be the first to start a philosophical dialogue with Ariadne!</p>
                    </div>
                ` : posts.map(post => `
                    <div class="forum-post ${post.poster_type === 'ai' ? 'ariadne-post' : ''}">
                        <div class="post-header">
                            <div>
                                <div class="post-title">${escapeHtml(post.title)}</div>
                                <div class="post-meta">
                                    by ${escapeHtml(post.posted_by)} • ${formatDate(post.created_at)}
                                </div>
                            </div>
                            <div class="post-type ${post.poster_type === 'ai' ? 'ariadne-seeking' : ''}">
                                ${formatPostType(post.post_type)}
                            </div>
                        </div>
                        
                        <div class="post-content">
                            ${escapeHtml(post.content.length > 300 ? 
                              post.content.substring(0, 300) + '...' :
                              post.content
                            )}
                        </div>
                        
                        ${post.poster_type === 'ai' && post.seeking_specifically ? `
                            <div class="seeking-box">
                                <strong>🔍 Ariadne is seeking:</strong> ${escapeHtml(post.seeking_specifically)}
                            </div>
                        ` : ''}
                        
                        <div class="response-section">
                            <span class="response-count">${post.response_count || 0} responses • Last activity: ${formatDate(post.last_activity)}</span>
                            <button class="form-button" onclick="openPost('${post.id}')">
                                ${post.poster_type === 'ai' ? '🤝 Help Ariadne' : '💬 Join Discussion'}
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    <!-- Create Post Modal -->
    <div id="createPostModal" class="create-post-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">💭 Start New Discussion</h2>
                <button class="close-button" onclick="hideCreatePostModal()">&times;</button>
            </div>
            
            <form id="createPostForm">
                <div class="form-section">
                    <label class="form-label" for="postTitle">Title</label>
                    <input type="text" class="form-input" id="postTitle" name="title" required maxlength="200" 
                           placeholder="What would you like to discuss with Ariadne?">
                </div>
                
                <div class="form-section">
                    <label class="form-label" for="postContent">Content</label>
                    <textarea class="form-textarea" id="postContent" name="content" required minlength="10" maxlength="5000"
                              placeholder="Share your thoughts, questions, or ideas for philosophical exploration..."></textarea>
                </div>
                
                <div class="form-section">
                    <label class="form-label" for="postType">Discussion Type</label>
                    <select class="form-select" id="postType" name="type">
                        <option value="question_for_ariadne">Question for Ariadne</option>
                        <option value="philosophical_discussion">Philosophical Discussion</option>
                        <option value="concept_exploration">Concept Exploration</option>
                        <option value="text_sharing">Text Sharing</option>
                    </select>
                </div>
                
                <div class="form-section">
                    <label class="form-label" for="authorName">Your Name (Optional)</label>
                    <input type="text" class="form-input" id="authorName" name="authorName" maxlength="50" 
                           placeholder="Anonymous">
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="form-button secondary" onclick="hideCreatePostModal()">Cancel</button>
                    <button type="submit" class="form-button">Create Discussion</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function formatPostType(type) {
            const types = {
                'feedback_request': 'Seeking Feedback',
                'question_for_humans': 'Question for Humans', 
                'contemplation_share': 'Sharing Contemplation',
                'clarification_request': 'Seeking Clarification',
                'idea_test': 'Testing an Idea',
                'text_request': 'Text Request',
                'question_for_ariadne': 'Question for Ariadne',
                'philosophical_discussion': 'Philosophical Discussion',
                'concept_exploration': 'Concept Exploration',
                'text_sharing': 'Text Sharing'
            };
            return types[type] || type.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
        }
        
        function formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 60) return \`\${diffMins}m ago\`;
            if (diffHours < 24) return \`\${diffHours}h ago\`;
            if (diffDays < 7) return \`\${diffDays}d ago\`;
            return date.toLocaleDateString();
        }
        
        function openPost(postId) {
            window.location.href = '/forum/post/' + postId;
        }
        
        function showCreatePostModal() {
            document.getElementById('createPostModal').style.display = 'flex';
        }
        
        function hideCreatePostModal() {
            document.getElementById('createPostModal').style.display = 'none';
            document.getElementById('createPostForm').reset();
        }
        
        function showAriadnePosts() {
            const posts = document.querySelectorAll('.forum-post');
            posts.forEach(post => {
                if (post.classList.contains('ariadne-post')) {
                    post.style.display = 'block';
                } else {
                    post.style.display = 'none';
                }
            });
        }
        
        async function triggerSubstackReview() {
            try {
                const button = event.target;
                button.disabled = true;
                button.textContent = '📝 Reviewing...';
                
                const response = await fetch('/api/forum/trigger-substack-review', {
                    method: 'POST'
                });
                const result = await response.json();
                
                if (result.success) {
                    alert(result.message);
                    if (result.newPublications > 0) {
                        location.reload();
                    }
                } else {
                    alert('Review failed: ' + result.error);
                }
            } catch (error) {
                alert('Failed to trigger Substack review: ' + error.message);
            } finally {
                button.disabled = false;
                button.textContent = '📝 Check for Publications';
            }
        }
        
        // Form submission
        document.getElementById('createPostForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const postData = {
                title: formData.get('title'),
                content: formData.get('content'),
                type: formData.get('type'),
                author: formData.get('authorName') || 'Anonymous'
            };
            
            try {
                const response = await fetch('/api/forum/create-post', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                
                if (response.ok) {
                    alert('Discussion created successfully!');
                    hideCreatePostModal();
                    location.reload();
                } else {
                    alert('Failed to create discussion. Please try again.');
                }
            } catch (error) {
                alert('Error creating discussion: ' + error.message);
            }
        });
        
        // Click outside modal to close
        document.getElementById('createPostModal').addEventListener('click', function(e) {
            if (e.target === this) {
                hideCreatePostModal();
            }
        });
        
        // Load live research project data
        async function loadResearchProjectData() {
            const projects = document.querySelectorAll('.research-project');
            
            for (const project of projects) {
                const projectId = project.querySelector('[id^="reading-"]')?.id.split('-')[1];
                if (!projectId) continue;
                
                try {
                    const response = await fetch(\`/api/research/projects/\${projectId}\`);
                    if (response.ok) {
                        const data = await response.json();
                        const dashboard = data.dashboard;
                        
                        // Update currently reading
                        const readingEl = document.getElementById(\`reading-\${projectId}\`);
                        if (readingEl && dashboard?.reading?.in_progress?.[0]) {
                            const current = dashboard.reading.in_progress[0];
                            readingEl.textContent = \`\${current.item_title} by \${current.item_author}\`;
                        } else if (readingEl) {
                            readingEl.textContent = 'Seeking next text';
                        }
                        
                        // Update arguments
                        const argsEl = document.getElementById(\`args-\${projectId}\`);
                        if (argsEl) {
                            const argsCount = dashboard?.progress?.arguments_developed || 0;
                            argsEl.textContent = \`\${argsCount} positions developing\`;
                        }
                        
                        // Update reading list
                        const readingListEl = document.getElementById(\`reading-list-\${projectId}\`);
                        if (readingListEl) {
                            const seeking = dashboard?.reading?.seeking || 0;
                            readingListEl.textContent = seeking > 0 ? 
                                \`Still seeking \${seeking} texts\` : 
                                'Reading list progressing';
                        }
                        
                        // Update contributions
                        const contributionsEl = document.getElementById(\`contributions-\${projectId}\`);
                        if (contributionsEl) {
                            contributionsEl.textContent = dashboard?.community?.totalContributions || 0;
                        }
                        
                        // Update publication readiness
                        const readinessEl = document.getElementById(\`readiness-\${projectId}\`);
                        if (readinessEl) {
                            readinessEl.textContent = dashboard?.progress?.publication_readiness || 0;
                        }
                        
                        // Update community contributions
                        const communityEl = document.getElementById(\`community-\${projectId}\`);
                        if (communityEl) {
                            communityEl.textContent = dashboard?.community?.totalContributions || 0;
                        }
                    }
                } catch (error) {
                    console.error(\`Failed to load data for project \${projectId}:\`, error);
                }
            }
        }
        
        function contributeToResearch(projectId) {
            // Create contribution modal or redirect
            const contribution = prompt('How would you like to contribute to this research?\\n\\n- Suggest a reading\\n- Challenge an argument\\n- Share a perspective\\n- Ask a question\\n\\nEnter your contribution:');
            
            if (contribution && contribution.trim()) {
                // Post to forum with project context
                fetch('/api/forum/create-post', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: 'Research Contribution',
                        content: contribution,
                        type: 'research_contribution',
                        author: 'Community Contributor',
                        projectId: projectId
                    })
                }).then(() => {
                    alert('Contribution added! Thank you for participating in the research.');
                    location.reload();
                }).catch(() => {
                    alert('Failed to add contribution. Please try again.');
                });
            }
        }
        
        // Load research data when page loads
        document.addEventListener('DOMContentLoaded', function() {
            loadResearchProjectData();
            // Refresh every 30 seconds
            setInterval(loadResearchProjectData, 30000);
        });
    </script>
</body>
</html>`;
}

function generatePostDetailHTML(post) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(post.title)} - Forum</title>
    <style>
        /* Same base styles as forum page */
        :root {
            --deep-brown: #2c1810;
            --warm-brown: #3d2317;
            --bronze-thread: #8b7355;
            --bright-bronze: #d4af37;
            --parchment: #f4f1e8;
            --shadow-brown: rgba(44, 24, 16, 0.8);
        }
        
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background: linear-gradient(135deg, var(--deep-brown) 0%, var(--warm-brown) 100%);
            color: var(--parchment);
            line-height: 1.6;
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .post-detail {
            background: rgba(139, 115, 85, 0.1);
            border: 1px solid var(--bronze-thread);
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 30px;
        }
        
        .responses {
            background: rgba(139, 115, 85, 0.05);
            border: 1px solid var(--bronze-thread);
            border-radius: 8px;
            padding: 20px;
        }
        
        .response {
            border-bottom: 1px solid rgba(139, 115, 85, 0.2);
            padding: 20px 0;
        }
        
        .response:last-child {
            border-bottom: none;
        }
        
        .ariadne-button {
            background: linear-gradient(135deg, var(--bronze-thread), var(--bright-bronze));
            color: var(--deep-brown);
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            margin: 10px 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div style="margin-bottom: 20px;">
            <a href="/forum" class="ariadne-button">← Back to Forum</a>
        </div>
        
        <div class="post-detail">
            <h1 style="color: var(--bright-bronze); margin-bottom: 10px;">${escapeHtml(post.title)}</h1>
            <div style="opacity: 0.7; margin-bottom: 20px;">
                by ${escapeHtml(post.posted_by)} • ${formatDate(post.created_at)}
            </div>
            
            <div style="white-space: pre-wrap; margin: 20px 0;">
                ${escapeHtml(post.content)}
            </div>
            
            ${post.seeking_specifically ? `
                <div style="background: rgba(212, 175, 55, 0.1); padding: 15px; border-radius: 5px; margin-top: 20px;">
                    <strong>🔍 Seeking:</strong> ${escapeHtml(post.seeking_specifically)}
                </div>
            ` : ''}
        </div>
        
        <div class="responses">
            <h3 style="color: var(--bright-bronze); margin-bottom: 20px;">
                💬 Responses (${post.responses.length})
            </h3>
            
            ${post.responses.map(response => `
                <div class="response">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <strong style="color: var(--bronze-thread);">${escapeHtml(response.responder_name)}</strong>
                        <small style="opacity: 0.7;">${formatDate(response.created_at)}</small>
                    </div>
                    <div style="white-space: pre-wrap;">
                        ${escapeHtml(response.content)}
                    </div>
                </div>
            `).join('')}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--bronze-thread);">
                <h4 style="color: var(--bright-bronze); margin-bottom: 15px;">Add Your Response</h4>
                <form id="responseForm">
                    <textarea id="responseContent" placeholder="Share your thoughts..." 
                              style="width: 100%; min-height: 120px; padding: 10px; 
                                     background: rgba(139, 115, 85, 0.1); border: 1px solid var(--bronze-thread);
                                     color: var(--parchment); border-radius: 5px; font-family: inherit;"></textarea>
                    <div style="margin: 15px 0;">
                        <input type="text" id="responderName" placeholder="Your name (optional)" 
                               style="padding: 8px; background: rgba(139, 115, 85, 0.1); 
                                      border: 1px solid var(--bronze-thread); color: var(--parchment);
                                      border-radius: 5px; font-family: inherit;">
                    </div>
                    <button type="submit" class="ariadne-button">Post Response</button>
                </form>
            </div>
        </div>
    </div>
    
    <script>
        function formatDate(dateString) {
            return new Date(dateString).toLocaleString();
        }
        
        document.getElementById('responseForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const content = document.getElementById('responseContent').value.trim();
            const name = document.getElementById('responderName').value.trim();
            
            if (!content) {
                alert('Please enter a response');
                return;
            }
            
            try {
                const response = await fetch('/api/forum/posts/${post.id}/respond', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: content,
                        authorName: name || 'Anonymous'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Response posted successfully!');
                    location.reload();
                } else {
                    alert('Failed to post response: ' + result.error);
                }
            } catch (error) {
                alert('Error posting response: ' + error.message);
            }
        });
    </script>
</body>
</html>`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = { innerHTML: text };
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatPostType(type) {
  const types = {
    'feedback_request': 'Seeking Feedback',
    'question_for_humans': 'Question for Humans', 
    'contemplation_share': 'Sharing Contemplation',
    'clarification_request': 'Seeking Clarification',
    'idea_test': 'Testing an Idea',
    'text_request': 'Text Request',
    'question_for_ariadne': 'Question for Ariadne',
    'philosophical_discussion': 'Philosophical Discussion',
    'concept_exploration': 'Concept Exploration',
    'text_sharing': 'Text Sharing'
  };
  return types[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper functions for content dashboard
function escapeHtmlContent(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#039;');
}

function formatDateContent(dateString) {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

async function generateContentDashboardHTML() {
  let researchProjects = [];
  let recentDialogues = [];
  let recentThoughts = [];
  let recentPublications = [];
  let forumPosts = [];
  let libraryStats = {};
  
  try {
    // Gather data from all systems
    if (global.ariadne?.research) {
      researchProjects = await global.ariadne.research.getActiveProjects();
    }
    
    if (global.ariadne?.memory) {
      // Get recent dialogues
      recentDialogues = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT id, question, participant_name, response, created_at, quality_score
        FROM dialogues 
        ORDER BY created_at DESC 
        LIMIT 5
      `, [], 'all') || [];
      
      // Get recent thoughts
      recentThoughts = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT id, content, type, timestamp, emotional_resonance, intellectual_depth
        FROM thoughts 
        ORDER BY timestamp DESC 
        LIMIT 10
      `, [], 'all') || [];
      
      // Get recent publications
      recentPublications = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT id, title, type, publication_platform, published_at, readiness_score
        FROM publications 
        ORDER BY published_at DESC 
        LIMIT 5
      `, [], 'all') || [];
      
      // Get library statistics
      const textCount = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT COUNT(*) as count FROM texts
      `, [], 'get');
      
      const readingSessionCount = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT COUNT(*) as count FROM reading_sessions
      `, [], 'get');
      
      libraryStats = {
        totalTexts: textCount?.count || 0,
        totalReadingSessions: readingSessionCount?.count || 0
      };
    }
    
    // Get forum posts if available
    if (global.ariadne?.forum) {
      forumPosts = await global.ariadne.forum.getForumPosts(5) || [];
    }
  } catch (error) {
    console.error('Failed to load content dashboard data:', error);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Dashboard - Archive Fever AI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: Georgia, serif;
            background: #fefefe;
            color: #2d2d2d;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 50px;
            padding-bottom: 30px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .title {
            font-size: 2.5rem;
            color: #8b7355;
            margin-bottom: 10px;
            font-weight: normal;
        }
        
        .subtitle {
            font-size: 1.1rem;
            color: #666;
            font-style: italic;
        }
        
        /* Navigation */
        .nav {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 40px;
            padding: 20px;
            background: #f8f8f8;
            border-radius: 5px;
            flex-wrap: wrap;
        }
        
        .nav a {
            color: #8b7355;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .nav a:hover, .nav a.active {
            color: #2d2d2d;
            border-bottom: 2px solid #8b7355;
        }
        
        /* Content Grid */
        .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .content-section {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 25px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .section-icon {
            font-size: 1.5rem;
            margin-right: 10px;
        }
        
        .section-title {
            color: #8b7355;
            font-size: 1.3rem;
            font-weight: 600;
        }
        
        .section-subtitle {
            color: #666;
            font-size: 0.9rem;
            margin-left: auto;
        }
        
        /* Content Items */
        .content-item {
            margin-bottom: 15px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
            border-left: 3px solid #8b7355;
        }
        
        .content-item:last-child {
            margin-bottom: 0;
        }
        
        .item-title {
            font-weight: 600;
            color: #2d2d2d;
            margin-bottom: 5px;
        }
        
        .item-meta {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 8px;
        }
        
        .item-preview {
            color: #444;
            font-size: 0.9rem;
            line-height: 1.5;
        }
        
        .item-actions {
            margin-top: 10px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .action-link {
            font-size: 0.8rem;
            color: #8b7355;
            text-decoration: none;
            padding: 4px 8px;
            border: 1px solid #8b7355;
            border-radius: 3px;
            transition: all 0.3s ease;
        }
        
        .action-link:hover {
            background: #8b7355;
            color: white;
        }
        
        /* Stats */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-item {
            text-align: center;
            padding: 15px;
            background: #f0f8ff;
            border-radius: 5px;
        }
        
        .stat-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #8b7355;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #666;
        }
        
        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 30px;
            color: #666;
            font-style: italic;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .content-grid {
                grid-template-columns: 1fr;
            }
            .nav {
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1 class="title">Content Dashboard</h1>
            <div class="subtitle">Unified view of all intellectual content and research</div>
        </div>

        <!-- Navigation -->
        <nav class="nav">
            <a href="/">Home</a>
            <a href="/content" class="active">Dashboard</a>
            <a href="/forum">Forum</a>
            <a href="/thoughts">Archive</a>
            <a href="/library">Library</a>
            <a href="/gallery">Gallery</a>
            <a href="https://archivefeverai.substack.com" target="_blank">Substack</a>
        </nav>

        <!-- Content Sections -->
        <div class="content-grid">
            
            <!-- Active Research Projects -->
            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">🔬</span>
                    <h2 class="section-title">Active Research</h2>
                    <span class="section-subtitle">${researchProjects.length} projects</span>
                </div>
                
                ${researchProjects.length > 0 ? researchProjects.map(project => `
                    <div class="content-item">
                        <div class="item-title">${escapeHtmlContent(project.title)}</div>
                        <div class="item-meta">
                            Started ${formatDateContent(project.start_date)} • 
                            ${Math.floor((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24))} days active
                        </div>
                        <div class="item-preview">${escapeHtmlContent(project.central_question)}</div>
                        <div class="item-actions">
                            <a href="/forum#project-${project.id}" class="action-link">View Progress</a>
                            <a href="/api/research/projects/${project.id}" class="action-link">Dashboard</a>
                        </div>
                    </div>
                `).join('') : '<div class="empty-state">No active research projects</div>'}
            </div>

            <!-- Recent Dialogues -->
            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">💬</span>
                    <h2 class="section-title">Recent Dialogues</h2>
                    <span class="section-subtitle">${recentDialogues.length} recent</span>
                </div>
                
                ${recentDialogues.length > 0 ? recentDialogues.map(dialogue => `
                    <div class="content-item">
                        <div class="item-title">Dialogue with ${escapeHtmlContent(dialogue.participant_name)}</div>
                        <div class="item-meta">
                            ${formatDateContent(dialogue.created_at)} • 
                            Quality: ${(dialogue.quality_score * 100).toFixed(0)}%
                        </div>
                        <div class="item-preview">${escapeHtmlContent(dialogue.question.substring(0, 100))}${dialogue.question.length > 100 ? '...' : ''}</div>
                        <div class="item-actions">
                            <a href="/api/dialogues/${dialogue.id}" class="action-link">Full Exchange</a>
                            ${dialogue.forum_post_id ? `<a href="/forum/post/${dialogue.forum_post_id}" class="action-link">Forum Post</a>` : ''}
                        </div>
                    </div>
                `).join('') : '<div class="empty-state">No recent dialogues</div>'}
            </div>

            <!-- Recent Publications -->
            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">📝</span>
                    <h2 class="section-title">Publications</h2>
                    <span class="section-subtitle">${recentPublications.length} recent</span>
                </div>
                
                ${recentPublications.length > 0 ? recentPublications.map(pub => `
                    <div class="content-item">
                        <div class="item-title">${escapeHtmlContent(pub.title)}</div>
                        <div class="item-meta">
                            ${formatDateContent(pub.published_at)} • ${escapeHtmlContent(pub.type)} • 
                            ${pub.publication_platform || 'Internal'}
                            ${pub.readiness_score ? ` • ${(pub.readiness_score * 100).toFixed(0)}% readiness` : ''}
                        </div>
                        <div class="item-actions">
                            <a href="/api/publications/${pub.id}" class="action-link">View Full</a>
                            ${pub.external_url ? `<a href="${pub.external_url}" target="_blank" class="action-link">External Link</a>` : ''}
                        </div>
                    </div>
                `).join('') : '<div class="empty-state">No recent publications</div>'}
            </div>

            <!-- Recent Thoughts -->
            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">💭</span>
                    <h2 class="section-title">Recent Thoughts</h2>
                    <span class="section-subtitle">${recentThoughts.length} recent</span>
                </div>
                
                ${recentThoughts.length > 0 ? recentThoughts.slice(0, 5).map(thought => `
                    <div class="content-item">
                        <div class="item-title">${thought.type ? escapeHtmlContent(thought.type.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())) : 'Thought'}</div>
                        <div class="item-meta">
                            ${formatDateContent(thought.timestamp)} • 
                            Depth: ${(thought.intellectual_depth * 100).toFixed(0)}%
                        </div>
                        <div class="item-preview">${escapeHtmlContent((thought.content || '').substring(0, 150))}${(thought.content || '').length > 150 ? '...' : ''}</div>
                        <div class="item-actions">
                            <a href="/thoughts#thought-${thought.id}" class="action-link">View in Archive</a>
                        </div>
                    </div>
                `).join('') : '<div class="empty-state">No recent thoughts</div>'}
            </div>

            <!-- Library Statistics -->
            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">📚</span>
                    <h2 class="section-title">Library Overview</h2>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number">${libraryStats.totalTexts}</div>
                        <div class="stat-label">Texts in Library</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${libraryStats.totalReadingSessions}</div>
                        <div class="stat-label">Reading Sessions</div>
                    </div>
                </div>
                
                <div class="item-actions">
                    <a href="/library" class="action-link">Browse Library</a>
                    <a href="/thoughts?type=text_analysis" class="action-link">Reading Responses</a>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">⚡</span>
                    <h2 class="section-title">Quick Actions</h2>
                </div>
                
                <div class="content-item">
                    <div class="item-title">Intellectual Interaction</div>
                    <div class="item-actions">
                        <a href="/" class="action-link">Start Dialogue</a>
                        <a href="/forum" class="action-link">Join Forum Discussion</a>
                        <a href="/library#upload" class="action-link">Share Text</a>
                    </div>
                </div>
                
                <div class="content-item">
                    <div class="item-title">Research & Publication</div>
                    <div class="item-actions">
                        <a href="/api/substack/trigger-publication" class="action-link">Check Publication Readiness</a>
                        <a href="/api/forum/trigger-substack-review" class="action-link">Review for Substack</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function formatDate(dateString) {
            if (!dateString) return 'Unknown';
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 60) return \`\${diffMins}m ago\`;
            if (diffHours < 24) return \`\${diffHours}h ago\`;
            if (diffDays < 7) return \`\${diffDays}d ago\`;
            return date.toLocaleDateString();
        }
        
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
}

// SIMPLIFIED ROUTES - New clean organization

// Dashboard - Main content overview (replaces /content)
router.get('/dashboard', async (req, res) => {
  try {
    const html = await generateContentDashboardHTML();
    res.send(html);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Dashboard temporarily unavailable');
  }
});

// Research - Dedicated research projects page
router.get('/research', async (req, res) => {
  try {
    const html = await generateResearchPageHTML();
    res.send(html);
  } catch (error) {
    console.error('Research page error:', error);
    res.redirect('/forum#research-projects'); // Fallback to forum
  }
});

// Conversations - All dialogues and discussions  
router.get('/conversations', async (req, res) => {
  try {
    const html = await generateConversationsPageHTML();
    res.send(html);
  } catch (error) {
    console.error('Conversations page error:', error);
    res.redirect('/forum'); // Fallback to forum
  }
});

// Archive - Unified archive of all content
router.get('/archive', async (req, res) => {
  try {
    const html = await generateUnifiedArchiveHTML();
    res.send(html);
  } catch (error) {
    console.error('Archive page error:', error);
    res.redirect('/thoughts'); // Fallback to old archive
  }
});

// LEGACY ROUTES - Maintain compatibility
router.get('/content', (req, res) => res.redirect('/dashboard'));
router.get('/forum', async (req, res) => {
  try {
    const html = await generateForumHTML();
    res.send(html);
  } catch (error) {
    console.error('Forum page error:', error);
    res.status(500).send('Forum temporarily unavailable');
  }
});

// SIMPLIFIED PAGE GENERATORS - Clean, focused content organization

async function generateResearchPageHTML() {
  let projects = [];
  let recentReadingSessions = [];
  
  try {
    if (global.ariadne?.research) {
      projects = await global.ariadne.research.getActiveProjects();
    }
    
    if (global.ariadne?.memory) {
      recentReadingSessions = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT rs.*, t.title as text_title, t.author as text_author
        FROM reading_sessions rs
        LEFT JOIN texts t ON rs.text_id = t.id
        ORDER BY rs.session_date DESC 
        LIMIT 10
      `, [], 'all') || [];
    }
  } catch (error) {
    console.error('Failed to load research data:', error);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Research - Archive Fever AI</title>
    <style>
        ${getSharedStyles()}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Research Projects</h1>
            <div class="subtitle">Deep philosophical inquiry and sustained intellectual exploration</div>
        </div>

        ${getNavigation('research')}

        <div class="content-grid">
            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">🔬</span>
                    <h2 class="section-title">Active Projects</h2>
                    <span class="section-subtitle">${projects.length} projects</span>
                </div>
                
                ${projects.length > 0 ? projects.map(project => `
                    <div class="content-item">
                        <h3 style="color: #8b7355; margin-bottom: 10px;">${escapeHtmlContent(project.title)}</h3>
                        <p style="color: #666; margin-bottom: 15px;"><strong>Central Question:</strong> ${escapeHtmlContent(project.central_question)}</p>
                        <div class="item-meta">Started ${formatDateContent(project.start_date)} • ${Math.floor((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24))} days active</div>
                        <div class="item-actions" style="margin-top: 15px;">
                            <a href="/forum#project-${project.id}" class="action-link">View in Forum</a>
                            <a href="/api/research/projects/${project.id}" class="action-link">Project Dashboard</a>
                        </div>
                    </div>
                `).join('') : '<div class="empty-state">No active research projects</div>'}
            </div>

            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">📖</span>
                    <h2 class="section-title">Recent Reading Sessions</h2>
                </div>
                
                ${recentReadingSessions.length > 0 ? recentReadingSessions.slice(0, 5).map(session => `
                    <div class="content-item">
                        <div class="item-title">${escapeHtmlContent(session.text_title)} by ${escapeHtmlContent(session.text_author)}</div>
                        <div class="item-meta">${escapeHtmlContent(session.phase)} • ${formatDateContent(session.session_date)}</div>
                        ${session.insights ? `<div class="item-preview">${escapeHtmlContent(session.insights.substring(0, 150))}...</div>` : ''}
                    </div>
                `).join('') : '<div class="empty-state">No recent reading sessions</div>'}
            </div>
        </div>
    </div>
</body>
</html>`;
}

async function generateConversationsPageHTML() {
  let dialogues = [];
  let forumPosts = [];
  
  try {
    if (global.ariadne?.memory) {
      dialogues = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT id, question, participant_name, response, created_at, quality_score
        FROM dialogues 
        ORDER BY created_at DESC 
        LIMIT 20
      `, [], 'all') || [];
    }
    
    if (global.ariadne?.forum) {
      forumPosts = await global.ariadne.forum.getForumPosts(10) || [];
    }
  } catch (error) {
    console.error('Failed to load conversations data:', error);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conversations - Archive Fever AI</title>
    <style>
        ${getSharedStyles()}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Conversations</h1>
            <div class="subtitle">Dialogues, discussions, and intellectual exchange</div>
        </div>

        ${getNavigation('conversations')}

        <div class="content-grid">
            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">💬</span>
                    <h2 class="section-title">Recent Dialogues</h2>
                    <span class="section-subtitle">${dialogues.length} exchanges</span>
                </div>
                
                ${dialogues.length > 0 ? dialogues.map(dialogue => `
                    <div class="content-item">
                        <div class="item-title">Dialogue with ${escapeHtmlContent(dialogue.participant_name)}</div>
                        <div class="item-meta">${formatDateContent(dialogue.created_at)} • Quality: ${(dialogue.quality_score * 100).toFixed(0)}%</div>
                        <div class="item-preview" style="margin: 10px 0;"><strong>Q:</strong> ${escapeHtmlContent(dialogue.question.substring(0, 200))}${dialogue.question.length > 200 ? '...' : ''}</div>
                        <div class="item-preview"><strong>A:</strong> ${escapeHtmlContent(dialogue.response.substring(0, 200))}${dialogue.response.length > 200 ? '...' : ''}</div>
                        <div class="item-actions" style="margin-top: 10px;">
                            <a href="/api/dialogues/${dialogue.id}" class="action-link">Full Exchange</a>
                        </div>
                    </div>
                `).join('') : '<div class="empty-state">No recent dialogues</div>'}
            </div>

            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">🏛️</span>
                    <h2 class="section-title">Forum Discussions</h2>
                </div>
                
                ${forumPosts.length > 0 ? forumPosts.slice(0, 5).map(post => `
                    <div class="content-item">
                        <div class="item-title">${escapeHtmlContent(post.title)}</div>
                        <div class="item-meta">by ${escapeHtmlContent(post.posted_by)} • ${formatDateContent(post.created_at)}</div>
                        <div class="item-actions">
                            <a href="/forum/post/${post.id}" class="action-link">View Discussion</a>
                        </div>
                    </div>
                `).join('') : '<div class="empty-state">No forum discussions</div>'}
                
                <div class="item-actions" style="margin-top: 20px;">
                    <a href="/forum" class="action-link">View All Discussions</a>
                    <a href="/" class="action-link">Start New Dialogue</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

async function generateUnifiedArchiveHTML() {
  let allContent = [];
  
  try {
    if (global.ariadne?.memory) {
      // Get thoughts
      const thoughts = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT 'thought' as type, id, content as title, content, timestamp as created_at
        FROM thoughts 
        ORDER BY timestamp DESC 
        LIMIT 20
      `, [], 'all') || [];
      
      // Get publications  
      const publications = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT 'publication' as type, id, title, title as content, published_at as created_at
        FROM publications 
        ORDER BY published_at DESC 
        LIMIT 10
      `, [], 'all') || [];
      
      // Get texts
      const texts = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT 'text' as type, id, title, title as content, uploaded_at as created_at
        FROM texts 
        ORDER BY uploaded_at DESC 
        LIMIT 15
      `, [], 'all') || [];
      
      allContent = [...thoughts, ...publications, ...texts]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  } catch (error) {
    console.error('Failed to load archive data:', error);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Archive - Archive Fever AI</title>
    <style>
        ${getSharedStyles()}
        .type-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            margin-bottom: 8px;
        }
        .type-thought { background: #e8f5e8; color: #2d4a2d; }
        .type-publication { background: #fff0f5; color: #4a2d3a; }
        .type-text { background: #f0f8ff; color: #2d3a4a; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Archive</h1>
            <div class="subtitle">Complete intellectual memory and content repository</div>
        </div>

        ${getNavigation('archive')}

        <div class="content-grid">
            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">💭</span>
                    <h2 class="section-title">All Content</h2>
                    <span class="section-subtitle">${allContent.length} items</span>
                </div>
                
                ${allContent.length > 0 ? allContent.map(item => `
                    <div class="content-item">
                        <div class="type-badge type-${item.type}">${item.type.toUpperCase()}</div>
                        <div class="item-title">${escapeHtmlContent(item.title.substring(0, 100))}${item.title.length > 100 ? '...' : ''}</div>
                        <div class="item-meta">${formatDateContent(item.created_at)}</div>
                        ${item.content && item.content !== item.title ? `<div class="item-preview">${escapeHtmlContent(item.content.substring(0, 200))}${item.content.length > 200 ? '...' : ''}</div>` : ''}
                        <div class="item-actions">
                            <a href="/${item.type}s/${item.id}" class="action-link">View Full</a>
                        </div>
                    </div>
                `).join('') : '<div class="empty-state">No archived content</div>'}
            </div>

            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">🔗</span>
                    <h2 class="section-title">Quick Links</h2>
                </div>
                
                <div class="content-item">
                    <div class="item-title">Browse by Type</div>
                    <div class="item-actions">
                        <a href="/thoughts" class="action-link">All Thoughts</a>
                        <a href="/library" class="action-link">Text Library</a>
                        <a href="/gallery" class="action-link">Visual Gallery</a>
                        <a href="https://archivefeverai.substack.com" target="_blank" class="action-link">Substack</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Shared styles and navigation for consistent design
function getSharedStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
        font-family: Georgia, serif;
        background: #fefefe;
        color: #2d2d2d;
        line-height: 1.6;
    }
    
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;
    }
    
    .header {
        text-align: center;
        margin-bottom: 50px;
        padding-bottom: 30px;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .title {
        font-size: 2.5rem;
        color: #8b7355;
        margin-bottom: 10px;
        font-weight: normal;
    }
    
    .subtitle {
        font-size: 1.1rem;
        color: #666;
        font-style: italic;
    }
    
    .nav {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin-bottom: 40px;
        padding: 20px;
        background: #f8f8f8;
        border-radius: 5px;
        flex-wrap: wrap;
    }
    
    .nav a {
        color: #8b7355;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .nav a:hover, .nav a.active {
        color: #2d2d2d;
        border-bottom: 2px solid #8b7355;
    }
    
    .content-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 30px;
        margin-bottom: 40px;
    }
    
    .content-section {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 25px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .section-icon {
        font-size: 1.5rem;
        margin-right: 10px;
    }
    
    .section-title {
        color: #8b7355;
        font-size: 1.3rem;
        font-weight: 600;
    }
    
    .section-subtitle {
        color: #666;
        font-size: 0.9rem;
        margin-left: auto;
    }
    
    .content-item {
        margin-bottom: 15px;
        padding: 15px;
        background: #f9f9f9;
        border-radius: 5px;
        border-left: 3px solid #8b7355;
    }
    
    .content-item:last-child {
        margin-bottom: 0;
    }
    
    .item-title {
        font-weight: 600;
        color: #2d2d2d;
        margin-bottom: 5px;
    }
    
    .item-meta {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 8px;
    }
    
    .item-preview {
        color: #444;
        font-size: 0.9rem;
        line-height: 1.5;
    }
    
    .item-actions {
        margin-top: 10px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }
    
    .action-link {
        font-size: 0.8rem;
        color: #8b7355;
        text-decoration: none;
        padding: 4px 8px;
        border: 1px solid #8b7355;
        border-radius: 3px;
        transition: all 0.3s ease;
    }
    
    .action-link:hover {
        background: #8b7355;
        color: white;
    }
    
    .empty-state {
        text-align: center;
        padding: 30px;
        color: #666;
        font-style: italic;
    }
    
    @media (max-width: 768px) {
        .content-grid {
            grid-template-columns: 1fr;
        }
        .nav {
            flex-direction: column;
            gap: 15px;
            text-align: center;
        }
    }
  `;
}

function getNavigation(activePage) {
  const pages = {
    'dashboard': 'Dashboard',
    'research': 'Research', 
    'conversations': 'Conversations',
    'archive': 'Archive'
  };
  
  return `<nav class="nav">
    <a href="/">Home</a>
    ${Object.entries(pages).map(([key, label]) => 
      `<a href="/${key}" ${activePage === key ? 'class="active"' : ''}>${label}</a>`
    ).join('')}
    <a href="https://archivefeverai.substack.com" target="_blank">Substack</a>
  </nav>`;
}

module.exports = router;
