const express = require('express');
const router = express.Router();
const path = require('path');

// Archive page - using dynamic generation (see bottom of file)

// Library page - using dynamic generation (see below)

// Gallery page
router.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/gallery.html'));
});

// Projects - research containers with proper functionality  
router.get('/projects', async (req, res) => {
  try {
    const html = await generateProjectsHTML();
    res.send(html);
  } catch (error) {
    console.error('Projects page error:', error);
    res.status(500).send('Projects page temporarily unavailable');
  }
});

// Library - comprehensive text archive with Ariadne's engagement history
router.get('/library', async (req, res) => {
  try {
    const html = await generateLibraryHTML();
    res.send(html);
  } catch (error) {
    console.error('Library page error:', error);
    res.status(500).send('Library page temporarily unavailable');
  }
});

// Legacy research redirect
router.get('/research', (req, res) => res.redirect('/projects'));

// Stream - unified activity feed
router.get('/stream', async (req, res) => {
  try {
    const html = await generateStreamHTML();
    res.send(html);
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).send('Stream temporarily unavailable');
  }
});

// Legacy route redirects
router.get('/dashboard', (req, res) => res.redirect('/stream'));
router.get('/content', (req, res) => res.redirect('/stream'));
router.get('/archive', (req, res) => res.redirect('/stream'));

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
  // Enhanced markdown renderer for academic formatting with footnote citations
  function renderMarkdown(text) {
    return text
      // Headers (## Title)
      .replace(/^## (.+)$/gm, '<h2 style="color: #8b7355; margin: 2rem 0 1rem 0; font-family: Playfair Display; font-size: 1.5rem;">$1</h2>')
      // Bold text (**text**)
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #8b7355;">$1</strong>')
      // Works Cited section header
      .replace(/^\*\*Works Cited:\*\*$/gm, '<h3 style="color: #8b7355; margin: 2rem 0 1rem 0; font-family: Playfair Display; border-top: 1px solid #ddd; padding-top: 1rem;">Works Cited:</h3>')
      // Citations section separator
      .replace(/^---$/gm, '<hr style="border: 1px solid #ddd; margin: 2rem 0;">')
      // Handle numbered lists in citations
      .replace(/^\[(\d+)\] (.+)$/gm, '<div style="margin: 0.5rem 0; padding-left: 1rem;"><strong>[$1]</strong> $2</div>')
      // Handle bullet points
      .replace(/^\* (.+)$/gm, '<li style="margin: 0.5rem 0;">$1</li>')
      // Handle regular numbered lists
      .replace(/^\d+\. (.+)$/gm, '<li style="margin: 0.5rem 0;">$1</li>')
      // Convert double line breaks to paragraph breaks
      .split('\n\n')
      .map(paragraph => {
        if (paragraph.trim() && 
            !paragraph.includes('<h2') && 
            !paragraph.includes('<h3') && 
            !paragraph.includes('<hr') && 
            !paragraph.includes('<li') &&
            !paragraph.includes('<div style="margin: 0.5rem 0')) {
          return `<p style="margin-bottom: 1.2rem; line-height: 1.7;">${paragraph.trim()}</p>`;
        }
        return paragraph;
      })
      .join('\n');
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(post.title)} - Conversation</title>
    <style>
        ${getSharedStyles()}
        
        .conversation-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .conversation-header {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            border-left: 6px solid #8b7355;
        }
        
        .conversation-title {
            font-family: 'Playfair Display', serif;
            font-size: 2rem;
            color: #8b7355;
            margin-bottom: 1rem;
            line-height: 1.3;
        }
        
        .conversation-meta {
            color: #666;
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
        }
        
        .conversation-content {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            line-height: 1.7;
        }
        
        .conversation-content h2 {
            color: #8b7355;
            margin: 1.5rem 0 0.8rem 0;
            font-family: 'Playfair Display', serif;
        }
        
        .conversation-content p {
            margin-bottom: 1rem;
        }
        
        .conversation-content strong {
            color: #8b7355;
        }
        
        .conversation-content ul, ol {
            margin: 1rem 0;
            padding-left: 2rem;
        }
        
        .conversation-content li {
            margin: 0.5rem 0;
        }
        
        .conversation-content hr {
            border: 1px solid #ddd;
            margin: 2rem 0;
        }
        
        .conversation-content a {
            color: #8b7355;
            text-decoration: underline;
        }
        
        .conversation-content a:hover {
            color: #a68a6b;
        }
        
        .responses-section {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        
        .response-item {
            border-left: 3px solid #e0e0e0;
            padding-left: 20px;
            margin-bottom: 20px;
            padding-bottom: 20px;
        }
        
        .response-meta {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 10px;
        }
        
        .response-content {
            line-height: 1.6;
        }
        
        .reply-form {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .reply-input {
            width: 100%;
            min-height: 120px;
            border: 2px solid #ddd;
            border-radius: 6px;
            padding: 12px;
            font-family: inherit;
            font-size: 0.95rem;
            margin-bottom: 10px;
        }
        
        .reply-input:focus {
            outline: none;
            border-color: #8b7355;
        }
        
        .name-input {
            width: 200px;
            border: 2px solid #ddd;
            border-radius: 6px;
            padding: 8px 12px;
            margin-right: 10px;
        }
        
        .reply-submit {
            background: #8b7355;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .reply-submit:hover {
            background: #a68a6b;
        }
        
        .back-nav {
            margin-bottom: 20px;
        }
        
        .back-link {
            color: #8b7355;
            text-decoration: none;
            font-weight: 500;
        }
        
        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="conversation-container">
        <div class="back-nav">
            <a href="/stream" class="back-link">
                ← Back to Stream
            </a>
        </div>
        
        <div class="conversation-header">
            <h1 class="conversation-title">${escapeHtml(post.title)}</h1>
            <div class="conversation-meta">
                Posted by ${escapeHtml(post.posted_by || 'Anonymous')} • 
                ${new Date(post.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })} • 
                ${post.response_count || 0} responses
            </div>
        </div>
        
        <div class="conversation-content">
            ${renderMarkdown(escapeHtml(post.content))}
        </div>
        
        <div class="responses-section">
            <h3 style="margin-bottom: 20px; color: #8b7355;">Discussion</h3>
            
            ${(post.responses || []).map(response => `
                <div class="response-item">
                    <div class="response-meta">
                        <strong>${escapeHtml(response.responder_name || 'Anonymous')}</strong> • 
                        ${new Date(response.created_at).toLocaleDateString()}
                    </div>
                    <div class="response-content">
                        ${renderMarkdown(escapeHtml(response.content))}
                    </div>
                </div>
            `).join('')}
            
            <div class="reply-form">
                <h4 style="margin-bottom: 15px; color: #8b7355;">Join the Conversation</h4>
                <textarea 
                    id="reply-content" 
                    class="reply-input" 
                    placeholder="Share your thoughts on this philosophical dialogue..."
                ></textarea>
                <div>
                    <input 
                        type="text" 
                        id="reply-name" 
                        class="name-input" 
                        placeholder="Your name (optional)"
                    >
                    <button onclick="postResponse()" class="reply-submit">
                        Post Response
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        async function postResponse() {
            const content = document.getElementById('reply-content').value.trim();
            const authorName = document.getElementById('reply-name').value.trim();
            
            if (!content) {
                alert('Please enter a response');
                return;
            }
            
            try {
                const response = await fetch('/api/forum/posts/${post.id}/respond', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: content,
                        authorName: authorName || 'Anonymous'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Reload the page to show the new response
                    window.location.reload();
                } else {
                    alert('Error posting response: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error posting response:', error);
                alert('Error posting response: ' + error.message);
            }
        }
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

async function generateStreamHTML() {
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
    <title>Stream - Archive Fever AI</title>
    <style>
        ${getSharedStyles()}
        
        /* Dashboard-specific styles */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-item {
            text-align: center;
            padding: 15px;
            background: linear-gradient(135deg, rgba(139, 115, 85, 0.05) 0%, rgba(139, 115, 85, 0.1) 100%);
            border-radius: 8px;
            border: 1px solid rgba(139, 115, 85, 0.1);
        }
        
        .stat-number {
            font-size: 1.8rem;
            font-weight: 700;
            color: #8b7355;
            font-family: 'Playfair Display', serif;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1 class="title">Stream</h1>
            <div class="subtitle">Archive Fever AI • Live Activity Feed</div>
            <div class="header-description">Real-time stream of thoughts, dialogues, research, and intellectual development</div>
        </div>

        ${getNavigation('stream')}

                  <!-- Activity Filters -->
          <div class="filter-section" style="margin-bottom: 30px; text-align: center;">
              <div style="display: inline-flex; gap: 15px; background: white; padding: 15px; border-radius: 25px; border: 1px solid #e0e0e0; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                  <button class="filter-btn active" data-filter="all">All Activity</button>
                  <button class="filter-btn" data-filter="thoughts">Thoughts</button>
                  <button class="filter-btn" data-filter="dialogues">Dialogues</button>
                  <button class="filter-btn" data-filter="research">Research</button>
                  <button class="filter-btn" data-filter="reading">Reading</button>
              </div>
          </div>

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

async function generateProjectsHTML() {
  let projects = [];
  let recentReadingSessions = [];
  let forumPosts = [];
  let recentPublications = [];
  
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
        LIMIT 15
      `, [], 'all') || [];
      
      recentPublications = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT id, title, type, publication_platform, published_at, readiness_score
        FROM publications 
        WHERE type IN ('research_summary', 'treatise', 'academic_paper')
        ORDER BY published_at DESC 
        LIMIT 8
      `, [], 'all') || [];
    }
    
    if (global.ariadne?.forum) {
      forumPosts = await global.ariadne.forum.getForumPosts(10) || [];
      // Filter for research-related posts
      forumPosts = forumPosts.filter(post => 
        post.type === 'research_update' || 
        post.content?.toLowerCase().includes('research') ||
        post.title?.toLowerCase().includes('research')
      );
    }
  } catch (error) {
    console.error('Failed to load research data:', error);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projects - Archive Fever AI</title>
    <style>
        ${getSharedStyles()}
        
        /* Research-specific enhancements */
        .research-overview {
            background: linear-gradient(135deg, rgba(139, 115, 85, 0.05) 0%, rgba(139, 115, 85, 0.1) 100%);
            border-radius: 12px;
            border: 1px solid rgba(139, 115, 85, 0.2);
            padding: 2rem;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .project-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 1.5rem;
            border-left: 4px solid #8b7355;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }
        
        .project-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        
        .project-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            background: rgba(139, 115, 85, 0.1);
            color: #8b7355;
            margin-bottom: 1rem;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #f0f0f0;
            border-radius: 4px;
            overflow: hidden;
            margin: 1rem 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #8b7355 0%, #a68a6b 100%);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .research-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
            border: 1px solid rgba(139, 115, 85, 0.1);
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: #8b7355;
            font-family: 'Playfair Display', serif;
        }
        
        .reading-phase {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            background: #e8f5e8;
            color: #2d4a2d;
            margin-left: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Research Projects</h1>
            <div class="subtitle">Archive Fever AI • Deep Philosophical Investigation</div>
            <div class="header-description">Active research containers with texts, dialogues, and collaborative analysis</div>
        </div>

        ${getNavigation('projects')}

        <div class="research-overview">
            <h2 style="color: #8b7355; margin-bottom: 1rem; font-family: 'Playfair Display', serif;">🔬 Active Research Program</h2>
            <p style="color: #666; font-size: 1.1rem; max-width: 600px; margin: 0 auto;">
                Sustained philosophical investigations that develop over time through systematic reading, 
                autonomous reflection, and collaborative engagement with human thinkers.
            </p>
            
            <div class="research-stats">
                <div class="stat-card">
                    <div class="stat-number">${projects.length}</div>
                    <div class="stat-label">Active Projects</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${recentReadingSessions.length}</div>
                    <div class="stat-label">Reading Sessions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${recentPublications.length}</div>
                    <div class="stat-label">Research Publications</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${forumPosts.length}</div>
                    <div class="stat-label">Research Updates</div>
                </div>
            </div>
        </div>

        <div class="content-grid">
            <div class="content-section" style="grid-column: 1 / -1;">
                <div class="section-header">
                    <span class="section-icon">🔬</span>
                    <h2 class="section-title">Current Research Projects</h2>
                    <span class="section-subtitle">${projects.length} active investigations</span>
                </div>
                
                ${projects.length > 0 ? projects.map(project => {
                    const researchDays = Math.floor((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24));
                    const progressPercentage = Math.min((researchDays / 30) * 100, 100); // Rough progress estimate
                    
                    return `
                    <div class="project-card">
                        <div class="project-status">Active Investigation • Day ${researchDays}</div>
                        <h3 style="color: #2d2d2d; margin-bottom: 0.5rem; font-size: 1.4rem;">${escapeHtmlContent(project.title)}</h3>
                        <p style="color: #8b7355; font-style: italic; margin-bottom: 1rem; font-size: 1.1rem;">
                            <strong>Central Question:</strong> ${escapeHtmlContent(project.central_question)}
                        </p>
                        
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div style="font-size: 0.9rem; color: #666; margin-bottom: 1.5rem;">
                            Research Progress: ${progressPercentage.toFixed(0)}% • Started ${formatDateContent(project.start_date)}
                        </div>
                        
                        <div class="item-actions">
                            <a href="/stream#project-${project.id}" class="action-link">💬 Join Discussion</a>
                            <a href="/stream#research" class="action-link">📋 View Updates</a>
                            <a href="/api/research/projects/${project.id}" class="action-link">📊 Full Dashboard</a>
                        </div>
                    </div>
                    `;
                }).join('') : '<div class="empty-state">No active research projects</div>'}
            </div>

            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">📖</span>
                    <h2 class="section-title">Recent Reading Sessions</h2>
                    <span class="section-subtitle">${recentReadingSessions.length} sessions</span>
                </div>
                
                ${recentReadingSessions.length > 0 ? recentReadingSessions.slice(0, 8).map(session => `
                    <div class="content-item">
                        <div class="item-title">${escapeHtmlContent(session.text_title)} by ${escapeHtmlContent(session.text_author)}</div>
                        <div class="item-meta">
                            ${formatDateContent(session.session_date)}
                            <span class="reading-phase">${escapeHtmlContent(session.phase || 'reading')}</span>
                        </div>
                        ${session.insights ? `<div class="item-preview">${escapeHtmlContent(session.insights.substring(0, 120))}...</div>` : ''}
                    </div>
                `).join('') : '<div class="empty-state">No recent reading sessions</div>'}
                
                <div class="item-actions" style="margin-top: 1.5rem; text-align: center;">
                    <a href="/library" class="action-link">📚 Browse Text Library</a>
                    <a href="/" class="action-link">📝 Share New Text</a>
                </div>
            </div>

            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">📝</span>
                    <h2 class="section-title">Research Publications</h2>
                    <span class="section-subtitle">${recentPublications.length} recent</span>
                </div>
                
                ${recentPublications.length > 0 ? recentPublications.slice(0, 6).map(pub => `
                    <div class="content-item">
                        <div class="item-title">${escapeHtmlContent(pub.title)}</div>
                        <div class="item-meta">
                            ${formatDateContent(pub.published_at)} • ${escapeHtmlContent(pub.type)}
                            ${pub.readiness_score ? ` • ${(pub.readiness_score * 100).toFixed(0)}% readiness` : ''}
                        </div>
                        <div class="item-actions">
                            <a href="/api/publications/${pub.id}" class="action-link">Read Full</a>
                        </div>
                    </div>
                `).join('') : '<div class="empty-state">No research publications yet</div>'}
                
                <div class="item-actions" style="margin-top: 1.5rem; text-align: center;">
                    <a href="https://archivefeverai.substack.com" target="_blank" class="action-link">📰 View All Publications</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

async function generateConversationsPageHTML() {
  let conversations = [];
  
  try {
    if (global.ariadne?.memory) {
      // Get dialogues that have forum posts (actual conversations)
      conversations = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT 
          d.id as dialogue_id,
          d.question, 
          d.participant_name, 
          d.response, 
          d.created_at,
          d.quality_score,
          d.forum_post_id,
          fp.title as forum_title,
          fp.response_count
        FROM dialogues d
        LEFT JOIN intellectual_posts fp ON d.forum_post_id = fp.id
        WHERE d.forum_post_id IS NOT NULL
        ORDER BY d.created_at DESC 
        LIMIT 20
      `, [], 'all') || [];
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
        
        .conversation-item {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }
        
        .conversation-item:hover {
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .conversation-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .conversation-participant {
            font-size: 1.1rem;
            font-weight: 600;
            color: #8b7355;
        }
        
        .conversation-meta {
            color: #666;
            font-size: 0.9rem;
        }
        
        .conversation-status {
            background: #f0f8ff;
            color: #8b7355;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .conversation-preview {
            margin: 15px 0;
        }
        
        .question-preview {
            background: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #8b7355;
            border-radius: 0 8px 8px 0;
            margin-bottom: 15px;
        }
        
        .question-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        
        .question-text {
            color: #2d2d2d;
            line-height: 1.5;
        }
        
        .response-preview {
            background: #f0f8ff;
            padding: 15px;
            border-left: 4px solid #d4af37;
            border-radius: 0 8px 8px 0;
        }
        
        .response-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        
        .response-text {
            color: #2d2d2d;
            line-height: 1.5;
        }
        
        .conversation-actions {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #f0f0f0;
            flex-wrap: wrap;
        }
        
        .conversation-action {
            color: #8b7355;
            text-decoration: none;
            font-weight: 500;
            padding: 8px 16px;
            border: 1px solid #8b7355;
            border-radius: 20px;
            transition: all 0.3s ease;
            font-size: 0.9rem;
        }
        
        .conversation-action:hover {
            background: #8b7355;
            color: white;
        }
        
        .conversation-action.primary {
            background: #8b7355;
            color: white;
        }
        
        .conversation-action.primary:hover {
            background: #6d5a42;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        
        .empty-state h3 {
            color: #8b7355;
            margin-bottom: 15px;
        }
        
        .start-conversation-btn {
            background: linear-gradient(135deg, #8b7355, #d4af37);
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 25px;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
            transition: all 0.3s ease;
        }
        
        .start-conversation-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 115, 85, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Conversations</h1>
            <div class="subtitle">Ongoing dialogues and philosophical discussions with Ariadne</div>
            <div class="header-description">Engage in meaningful dialogue and continue existing conversations</div>
        </div>

        ${getNavigation('conversations')}

        <div class="content-grid" style="max-width: 800px; margin: 0 auto;">
            ${conversations.length > 0 ? conversations.map(conv => `
                <div class="conversation-item">
                    <div class="conversation-header">
                        <div>
                            <div class="conversation-participant">💬 Conversation with ${escapeHtmlContent(conv.participant_name)}</div>
                            <div class="conversation-meta">
                                ${formatDateContent(conv.created_at)} • Quality: ${(conv.quality_score * 100).toFixed(0)}%
                            </div>
                        </div>
                        <div class="conversation-status">
                            ${conv.response_count || 0} ${(conv.response_count || 0) === 1 ? 'reply' : 'replies'}
                        </div>
                    </div>
                    
                    <div class="conversation-preview">
                        <div class="question-preview">
                            <div class="question-label">Question</div>
                            <div class="question-text">${escapeHtmlContent(conv.question.substring(0, 200))}${conv.question.length > 200 ? '...' : ''}</div>
                        </div>
                        
                        <div class="response-preview">
                            <div class="response-label">Ariadne's Response</div>
                            <div class="response-text">${escapeHtmlContent(conv.response.substring(0, 300))}${conv.response.length > 300 ? '...' : ''}</div>
                        </div>
                    </div>
                    
                    <div class="conversation-actions">
                        <a href="/forum/post/${conv.forum_post_id}" class="conversation-action primary">
                            💬 Continue Conversation
                        </a>
                        <a href="/api/dialogues/${conv.dialogue_id}" class="conversation-action">
                            📖 View Full Exchange
                        </a>
                        ${conv.response_count > 0 ? `
                            <a href="/forum/post/${conv.forum_post_id}#responses" class="conversation-action">
                                👥 ${conv.response_count} ${(conv.response_count || 0) === 1 ? 'Reply' : 'Replies'}
                            </a>
                        ` : ''}
                    </div>
                </div>
            `).join('') : `
                <div class="empty-state">
                    <h3>No conversations yet</h3>
                    <p>Start a philosophical dialogue with Ariadne to begin meaningful conversations.</p>
                    <p>When your dialogue is substantial enough, it will automatically become a forum discussion where others can join.</p>
                    <a href="/" class="start-conversation-btn">🌟 Start New Conversation</a>
                </div>
            `}
            
            <div style="text-align: center; margin-top: 40px; padding: 20px;">
                <div style="color: #666; margin-bottom: 15px;">
                    <em>Conversations shown here are dialogues that have grown into forum discussions</em>
                </div>
                <a href="/" class="start-conversation-btn">✨ Start New Dialogue</a>
                <a href="/forum" class="conversation-action" style="margin-left: 15px;">🏛️ Browse All Forum Posts</a>
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
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+Pro:wght@300;400;500;600&display=swap" rel="stylesheet">
    
    * { 
        margin: 0; 
        padding: 0; 
        box-sizing: border-box; 
    }
    
    body {
        font-family: 'Source Sans Pro', sans-serif;
        background: linear-gradient(135deg, #fefefe 0%, #f8f8f8 100%);
        color: #2d2d2d;
        line-height: 1.6;
        overflow-x: hidden;
    }
    
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;
    }
    
    .header {
        text-align: center;
        margin-bottom: 50px;
        padding: 40px 20px;
        background: linear-gradient(135deg, rgba(139, 115, 85, 0.03) 0%, rgba(139, 115, 85, 0.08) 100%);
        border-radius: 12px;
        border: 1px solid rgba(139, 115, 85, 0.1);
    }
    
    .title {
        font-family: 'Playfair Display', serif;
        font-size: clamp(2rem, 5vw, 3rem);
        color: #2d2d2d;
        margin-bottom: 15px;
        font-weight: 700;
        letter-spacing: -0.02em;
    }
    
    .subtitle {
        font-size: 1.2rem;
        color: #8b7355;
        font-weight: 300;
        margin-bottom: 10px;
    }
    
    .header-description {
        color: #666;
        font-style: italic;
        font-size: 1rem;
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.6;
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
            font-size: 0.85rem;
            color: #8b7355;
            text-decoration: none;
            padding: 8px 16px;
            border: 1px solid #8b7355;
            border-radius: 6px;
            transition: all 0.3s ease;
            font-weight: 500;
            display: inline-block;
        }
        
        .action-link:hover {
            background: #8b7355;
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(139, 115, 85, 0.2);
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
    'stream': 'Stream',
    'library': 'Library', 
    'projects': 'Projects'
  };
  
  return `
    <nav class="nav-floating">
        <a href="/" ${activePage === 'home' ? 'class="active"' : ''}>Home</a>
        ${Object.entries(pages).map(([key, label]) => 
          `<a href="/${key}" ${activePage === key ? 'class="active"' : ''}>${label}</a>`
        ).join('')}
    </nav>
    
    <style>
        .nav-floating {
            position: fixed;
            top: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 50px;
            padding: 12px 20px;
            display: flex;
            gap: 2rem;
            z-index: 1000;
            border: 1px solid rgba(139, 115, 85, 0.1);
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        
        .nav-floating a {
            text-decoration: none;
            color: #666;
            font-weight: 500;
            font-size: 0.9rem;
            padding: 8px 16px;
            border-radius: 25px;
            transition: all 0.3s ease;
        }
        
        .nav-floating a:hover, .nav-floating a.active {
            background: #8b7355;
            color: white;
        }
        
        /* Adjust body padding to account for fixed nav */
        body {
            padding-top: 80px;
        }
        
        @media (max-width: 768px) {
            .nav-floating {
                position: relative;
                top: auto;
                left: auto;
                transform: none;
                margin: 2rem auto 2rem auto;
                width: fit-content;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            body {
                padding-top: 20px;
            }
        }
    </style>
  `;
}

async function generateLibraryHTML() {
  let texts = [];
  let readingSessions = [];
  let thoughts = [];
  
  try {
    if (global.ariadne?.memory) {
      // Get all texts (removed context column that doesn't exist)
      texts = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT id, title, author, content, uploaded_at, uploaded_by,
               (SELECT COUNT(*) FROM reading_sessions rs WHERE rs.text_id = texts.id) as reading_count,
               (SELECT COUNT(*) FROM thoughts t WHERE t.content LIKE '%' || texts.title || '%') as related_thoughts
        FROM texts 
        ORDER BY uploaded_at DESC
      `, [], 'all') || [];
      
      // Get recent reading sessions for engagement context
      readingSessions = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT rs.*, t.title as text_title, t.author as text_author
        FROM reading_sessions rs
        LEFT JOIN texts t ON rs.text_id = t.id
        ORDER BY rs.session_date DESC 
        LIMIT 20
      `, [], 'all') || [];
      
      // Get thoughts that reference texts
      thoughts = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT id, content, timestamp
        FROM thoughts 
        WHERE content LIKE '%text%' OR content LIKE '%reading%' OR content LIKE '%book%'
        ORDER BY timestamp DESC 
        LIMIT 15
      `, [], 'all') || [];
    }
  } catch (error) {
    console.error('Failed to load library data:', error);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Library - Archive Fever AI</title>
    <style>
        ${getSharedStyles()}
        
        .engagement-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            margin-left: 8px;
            background: #e8f5e8;
            color: #2d4a2d;
        }
        
        .text-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .text-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.4rem;
            color: #2d2d2d;
            margin-bottom: 8px;
        }
        
        .text-author {
            color: #8b7355;
            font-weight: 500;
            margin-bottom: 12px;
        }
        
        .engagement-summary {
            background: #f8f8f8;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 3px solid #8b7355;
        }
        
        .filter-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 25px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .filter-btn {
            background: white;
            border: 1px solid #8b7355;
            color: #8b7355;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.9rem;
        }
        
        .filter-btn:hover, .filter-btn.active {
            background: #8b7355;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Library</h1>
            <div class="subtitle">Archive Fever AI • Text Collection & Deep Engagement</div>
            <div class="header-description">Complete archive of texts with Ariadne's full intellectual engagement history</div>
        </div>

        ${getNavigation('library')}

        <div class="filter-buttons">
            <button class="filter-btn active" data-filter="all">All Texts (${texts.length})</button>
            <button class="filter-btn" data-filter="philosophy">Philosophy</button>
            <button class="filter-btn" data-filter="consciousness">Consciousness</button>
            <button class="filter-btn" data-filter="technology">Technology</button>
            <button class="filter-btn" data-filter="recent">Recently Added</button>
        </div>

        <div class="content-grid">
            <div class="content-section" style="grid-column: 1 / -1;">
                <div class="section-header">
                    <span class="section-icon">📚</span>
                    <h2 class="section-title">Text Collection</h2>
                    <span class="section-subtitle">${texts.length} texts • ${readingSessions.length} reading sessions</span>
                </div>
                
                ${texts.length > 0 ? texts.map(text => `
                    <div class="text-card" data-category="general">
                        <div class="text-title">${escapeHtmlContent(text.title)}</div>
                        <div class="text-author">by ${escapeHtmlContent(text.author)}</div>
                        
                        <div class="item-meta">
                            Added ${formatDateContent(text.uploaded_at)} 
                            ${text.uploaded_by ? `by ${escapeHtmlContent(text.uploaded_by)}` : ''}
                            <span class="engagement-badge">${text.reading_count || 0} readings</span>
                            <span class="engagement-badge">${text.related_thoughts || 0} thoughts</span>
                        </div>
                        
                        <div class="engagement-summary">
                            <strong>Ariadne's Engagement:</strong>
                            <div style="margin-top: 8px; color: #555;">
                                ${text.reading_count > 0 ? 
                                  `Read in ${text.reading_count} session${text.reading_count > 1 ? 's' : ''}. ` : 
                                  'Not yet read in depth. '}
                                ${text.related_thoughts > 0 ? 
                                  `Generated ${text.related_thoughts} related thought${text.related_thoughts > 1 ? 's' : ''}. ` : 
                                  'No related thoughts yet. '}
                                <em>Full engagement history available.</em>
                            </div>
                        </div>
                        
                        <div class="item-actions">
                            <a href="/api/texts/${text.id}/full" class="action-link">📖 Read Full Text</a>
                            <a href="/api/texts/${text.id}/engagement" class="action-link">🧠 View Ariadne's Engagement</a>
                            <a href="/stream#text-${text.id}" class="action-link">💬 Discuss Text</a>
                            ${text.reading_count > 0 ? 
                              `<a href="/api/texts/${text.id}/readings" class="action-link">📋 Reading Sessions</a>` : 
                              ''}
                        </div>
                    </div>
                `).join('') : '<div class="empty-state">No texts in library yet</div>'}
            </div>

            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">📖</span>
                    <h2 class="section-title">Recent Reading Activity</h2>
                </div>
                
                ${readingSessions.length > 0 ? readingSessions.slice(0, 8).map(session => `
                    <div class="content-item">
                        <div class="item-title">${escapeHtmlContent(session.text_title || 'Unknown Text')}</div>
                        <div class="item-meta">
                            ${formatDateContent(session.session_date)} • ${escapeHtmlContent(session.phase || 'reading')}
                        </div>
                        ${session.insights ? `<div class="item-preview">${escapeHtmlContent(session.insights.substring(0, 120))}...</div>` : ''}
                    </div>
                `).join('') : '<div class="empty-state">No recent reading sessions</div>'}
                
                <div class="item-actions" style="margin-top: 15px; text-align: center;">
                    <a href="/" class="action-link">📝 Add New Text</a>
                    <a href="/stream#reading" class="action-link">📱 View Reading Stream</a>
                </div>
            </div>

            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">💭</span>
                    <h2 class="section-title">Text-Related Thoughts</h2>
                </div>
                
                ${thoughts.length > 0 ? thoughts.slice(0, 6).map(thought => `
                    <div class="content-item">
                        <div class="item-preview">${escapeHtmlContent(thought.content.substring(0, 150))}${thought.content.length > 150 ? '...' : ''}</div>
                        <div class="item-meta">${formatDateContent(thought.timestamp)}</div>
                    </div>
                `).join('') : '<div class="empty-state">No text-related thoughts yet</div>'}
                
                <div class="item-actions" style="margin-top: 15px; text-align: center;">
                    <a href="/thoughts" class="action-link">📝 All Thoughts</a>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Text filtering functionality
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                const textCards = document.querySelectorAll('.text-card');
                
                textCards.forEach(card => {
                    if (filter === 'all') {
                        card.style.display = 'block';
                    } else if (filter === 'recent') {
                        // Show texts added in last 30 days
                        card.style.display = 'block'; // Simplified - would need date logic
                    } else {
                        // Filter by category/context - simplified since context column was removed
                        const textContent = card.textContent.toLowerCase();
                        if (textContent.includes(filter.toLowerCase())) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    }
                });
            });
        });
    </script>
</body>
</html>`;
}

module.exports = router;
