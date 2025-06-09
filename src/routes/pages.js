const express = require('express');
// Middleware no longer needed - routes are now accessible without Ariadne being awake
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
  function renderMarkdown(text, availableTexts = []) {
    let renderedText = text
      // Headers (## Title)
      .replace(/^## (.+)$/gm, '<h2 style="color: #8b7355; margin: 2rem 0 1rem 0; font-family: Playfair Display; font-size: 1.5rem;">$1</h2>')
      // Bold text (**text**)
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #8b7355;">$1</strong>')
      // Works Cited section header
      .replace(/^\*\*Works Cited:\*\*$/gm, '<h3 style="color: #8b7355; margin: 2rem 0 1rem 0; font-family: Playfair Display; border-top: 1px solid #ddd; padding-top: 1rem;">Works Cited:</h3>')
      // Citations section separator
      .replace(/^---$/gm, '<hr style="border: 1px solid #ddd; margin: 2rem 0;">')
      // Handle bullet points
      .replace(/^\* (.+)$/gm, '<li style="margin: 0.5rem 0;">$1</li>')
      // Handle regular numbered lists
      .replace(/^\d+\. (.+)$/gm, '<li style="margin: 0.5rem 0;">$1</li>');

    // Handle numbered citations in Works Cited section - create working links when possible
    renderedText = renderedText.replace(/^\[(\d+)\] (.+?) by (.+?)$/gm, (match, num, title, author) => {
      // Try to find matching text in library
      const matchingText = availableTexts.find(text => 
        text.title.toLowerCase().includes(title.toLowerCase()) || 
        title.toLowerCase().includes(text.title.toLowerCase())
      );
      
      if (matchingText) {
        return `<div style="margin: 0.5rem 0; padding-left: 1rem;"><strong>[${num}]</strong> <a href="/api/texts/${matchingText.id}/full" style="color: #8b7355; text-decoration: underline;" target="_blank">${title}</a> by ${author}</div>`;
      } else {
        return `<div style="margin: 0.5rem 0; padding-left: 1rem;"><strong>[${num}]</strong> ${title} by ${author}</div>`;
      }
    });

    // Convert double line breaks to paragraph breaks
    return renderedText
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

  // Get available texts for citation linking (this should be passed from the route)
  const availableTexts = [
    { id: 'f4b34970-1eba-4bc1-8d0c-33066e057733', title: 'Archive Fever: A Freudian Impression', author: 'Jacques Derrida' },
    { id: 'af788477-3268-49c9-92ab-19f9e0c69188', title: 'What is Called Thinking?', author: 'Martin Heidegger' },
    { id: '3e503d15-0430-4b46-8473-e61a63c4ec40', title: 'Being and Time', author: 'Martin Heidegger' },
    { id: '636e9906-1092-4d77-9335-a6f6f39849f6', title: 'The Computer and the Brain', author: 'John von Neumann' }
  ];

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
            ${renderMarkdown(escapeHtml(post.content), availableTexts)}
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
                        ${renderMarkdown(escapeHtml(response.content), availableTexts)}
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
                            <a href="/research/project/${project.id}" class="action-link">📊 View Dashboard</a>
                            <button onclick="triggerReading('${project.id}')" class="action-link" style="border: none; background: none; color: #8b7355; text-decoration: underline; cursor: pointer;">📖 Continue Reading</button>
                            <button onclick="contributeToProject('${project.id}')" class="action-link" style="border: none; background: none; color: #8b7355; text-decoration: underline; cursor: pointer;">💡 Contribute Idea</button>
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
  // Check if Ariadne is initialized
  if (!global.ariadne || !global.ariadne.research || !global.ariadne.memory) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Research Projects - Archive Fever AI</title>
    <style>${getSharedStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Research Projects</h1>
            <div class="subtitle">Initializing...</div>
        </div>
        ${getNavigation('projects')}
        <div style="text-align: center; padding: 4rem;">
            <h3 style="color: #8b7355;">🌅 Ariadne is awakening...</h3>
            <p style="color: #666;">Please wait while the research system initializes.</p>
            <script>setTimeout(() => location.reload(), 3000);</script>
        </div>
    </div>
</body>
</html>`;
  }

  let projects = [];
  let projectActivities = {};
  let projectContributions = {};
  
  try {
    if (global.ariadne?.research) {
      projects = await global.ariadne.research.getActiveProjects();
      
      // Get recent activities for each project
      for (const project of projects) {
        try {
          const activities = await global.ariadne.memory.safeDatabaseOperation(`
            SELECT * FROM project_activities 
            WHERE project_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 5
          `, [project.id], 'all') || [];
          
          const contributions = await global.ariadne.memory.safeDatabaseOperation(`
            SELECT * FROM forum_contributions 
            WHERE project_id = ? 
            ORDER BY created_at DESC 
            LIMIT 3
          `, [project.id], 'all') || [];
          
          projectActivities[project.id] = activities;
          projectContributions[project.id] = contributions;
        } catch (error) {
          console.error(`Failed to load data for project ${project.id}:`, error);
          projectActivities[project.id] = [];
          projectContributions[project.id] = [];
        }
      }
    }
  } catch (error) {
    console.error('Failed to load research data:', error);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Research Projects - Archive Fever AI</title>
    <style>
        ${getSharedStyles()}
        
        .project-feed {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .project-post {
            background: white;
            border-radius: 16px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid rgba(139, 115, 85, 0.15);
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .project-post:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }
        
        .project-header {
            padding: 2rem 2rem 1rem 2rem;
            border-bottom: 1px solid rgba(139, 115, 85, 0.1);
        }
        
        .project-status-badge {
            display: inline-block;
            background: linear-gradient(135deg, #8b7355, #a68a6b);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            margin-bottom: 1rem;
        }
        
        .project-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #2d2d2d;
            margin-bottom: 0.5rem;
            font-family: 'Playfair Display', serif;
        }
        
        .project-question {
            color: #8b7355;
            font-style: italic;
            line-height: 1.5;
            margin-bottom: 1.5rem;
        }
        
        .project-stats {
            display: flex;
            gap: 2rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
        }
        
        .stat {
            color: #666;
            font-size: 0.9rem;
        }
        
        .stat-number {
            font-weight: 600;
            color: #8b7355;
        }
        
        .project-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }
        
        .action-btn {
            background: transparent;
            border: 1px solid #8b7355;
            color: #8b7355;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        
        .action-btn:hover {
            background: #8b7355;
            color: white;
            transform: translateY(-1px);
        }
        
        .action-btn.primary {
            background: #8b7355;
            color: white;
        }
        
        .collapsible-section {
            border-top: 1px solid rgba(139, 115, 85, 0.1);
        }
        
        .section-toggle {
            width: 100%;
            background: none;
            border: none;
            padding: 1rem 2rem;
            text-align: left;
            cursor: pointer;
            font-weight: 500;
            color: #8b7355;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
        }
        
        .section-toggle:hover {
            background: rgba(139, 115, 85, 0.05);
        }
        
        .section-content {
            padding: 0 2rem 1.5rem 2rem;
            display: none;
            animation: slideDown 0.3s ease;
        }
        
        .section-content.open {
            display: block;
        }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .activity-item {
            background: rgba(139, 115, 85, 0.05);
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }
        
        .activity-time {
            color: #999;
            font-size: 0.8rem;
            margin-top: 4px;
        }
        
        .contribution-form {
            background: rgba(139, 115, 85, 0.05);
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 1rem;
        }
        
        .contribution-input {
            width: 100%;
            min-height: 80px;
            border: 1px solid rgba(139, 115, 85, 0.3);
            border-radius: 8px;
            padding: 12px;
            font-family: inherit;
            resize: vertical;
        }
        
        .contribution-submit {
            background: #8b7355;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 10px;
            transition: all 0.3s ease;
        }
        
        .contribution-submit:hover {
            background: #6d5a42;
            transform: translateY(-1px);
        }
        
        .contribution-item {
            border-left: 3px solid #8b7355;
            padding-left: 12px;
            margin-bottom: 12px;
        }
        
        .contributor-name {
            font-weight: 500;
            color: #8b7355;
            font-size: 0.9rem;
        }
        
        .contribution-text {
            color: #555;
            margin-top: 4px;
            font-size: 0.9rem;
        }
        
        .ariadne-response {
            background: rgba(139, 115, 85, 0.1);
            border-radius: 8px;
            padding: 12px;
            margin-top: 12px;
            border-left: 3px solid #8b7355;
        }
        
        .ariadne-name {
            font-weight: 500;
            color: #8b7355;
            font-size: 0.85rem;
            margin-bottom: 6px;
        }
        
        .response-text {
            color: #444;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        .pending-response {
            margin-top: 8px;
            color: #999;
            font-style: italic;
            font-size: 0.85rem;
        }
        
        .empty-state {
            color: #999;
            font-style: italic;
            text-align: center;
            padding: 2rem;
        }
        
        .chevron {
            transition: transform 0.3s ease;
        }
        
        .chevron.rotated {
            transform: rotate(180deg);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Research Projects</h1>
            <div class="subtitle">Active philosophical investigations by Ariadne</div>
            <div class="header-description">Deep, sustained research that develops over time through reading, thinking, and community engagement</div>
        </div>

        ${getNavigation('projects')}

        <div class="project-feed">
            ${projects.length > 0 ? projects.map(project => {
                const activities = projectActivities[project.id] || [];
                const contributions = projectContributions[project.id] || [];
                const daysActive = Math.floor((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24));
                
                return `
                <div class="project-post">
                    <div class="project-header">
                        <div class="project-status-badge">Day ${daysActive} • Active Research</div>
                        
                        <h2 class="project-title">${escapeHtmlContent(project.title)}</h2>
                        
                        <div class="project-question">
                            ${escapeHtmlContent(project.central_question)}
                        </div>
                        
                        <div class="project-stats">
                            <div class="stat">📖 <span class="stat-number">${activities.filter(a => a.activity_type === 'reading').length}</span> reading sessions</div>
                            <div class="stat">💭 <span class="stat-number">${contributions.length}</span> contributions</div>
                            <div class="stat">📝 <span class="stat-number">0</span> publications</div>
                            <div class="stat">🕒 <span class="stat-number">${formatDateContent(project.start_date)}</span></div>
                        </div>
                        
                        <div class="project-actions">
                            <button onclick="toggleSection('contribute-${project.id}')" class="action-btn primary">
                                💡 Share Insight
                            </button>

                        </div>
                    </div>
                    
                    <div class="collapsible-section">
                        <button class="section-toggle" onclick="toggleSection('activity-${project.id}')">
                            🔬 Ariadne's Recent Activity
                            <span class="chevron">▼</span>
                        </button>
                        <div id="activity-${project.id}" class="section-content">
                            ${activities.length > 0 ? activities.map(activity => {
                                const activityData = JSON.parse(activity.description || '{}');
                                const actionText = activityData.actions ? activityData.actions.join(', ') : activity.activity_type;
                                
                                return `
                                <div class="activity-item">
                                    <div>🤖 ${actionText}</div>
                                    <div class="activity-time">${formatDateContent(activity.timestamp)}</div>
                                </div>
                                `;
                            }).join('') : '<div class="empty-state">No recent activity</div>'}
                        </div>
                    </div>
                    
                    <div class="collapsible-section">
                        <button class="section-toggle" onclick="toggleSection('contribute-${project.id}')">
                            💬 Discussion & Contributions
                            <span class="chevron">▼</span>
                        </button>
                        <div id="contribute-${project.id}" class="section-content">
                            <div class="contribution-form">
                                <textarea 
                                    id="contribution-text-${project.id}" 
                                    class="contribution-input" 
                                    placeholder="Share an insight, question, or perspective about this research..."
                                ></textarea>
                                <button onclick="submitContribution('${project.id}')" class="contribution-submit">
                                    Share Contribution
                                </button>
                            </div>
                            
                            ${contributions.length > 0 ? contributions.map(contribution => `
                                <div class="contribution-item">
                                    <div class="contributor-name">${escapeHtmlContent(contribution.contributor_name || 'Anonymous')}</div>
                                    <div class="contribution-text">${escapeHtmlContent(contribution.content || '')}</div>
                                    <div class="activity-time">${formatDateContent(contribution.created_at)}</div>
                                    
                                    ${contribution.ariadne_response ? `
                                        <div class="ariadne-response">
                                            <div class="ariadne-name">🤖 Ariadne's Response:</div>
                                            <div class="response-text">${escapeHtmlContent(contribution.ariadne_response)}</div>
                                        </div>
                                    ` : contribution.status === 'pending' ? `
                                        <div class="pending-response">
                                            <span>⏳ Ariadne is considering this contribution...</span>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('') : '<div class="empty-state">No contributions yet - be the first to share!</div>'}
                        </div>
                    </div>
                </div>
                `;
            }).join('') : `
                <div class="empty-state" style="padding: 4rem 2rem; text-align: center;">
                    <h3 style="color: #8b7355; margin-bottom: 1rem;">No active research projects</h3>
                    <p style="color: #666; margin-bottom: 2rem;">Start a philosophical dialogue to trigger new research investigations.</p>
                    <a href="/" class="action-btn primary">✨ Start New Dialogue</a>
                </div>
            `}
        </div>
    </div>

    <script>
        function toggleSection(sectionId) {
            const content = document.getElementById(sectionId);
            const toggle = content.previousElementSibling;
            const chevron = toggle.querySelector('.chevron');
            
            if (content.classList.contains('open')) {
                content.classList.remove('open');
                chevron.classList.remove('rotated');
            } else {
                content.classList.add('open');
                chevron.classList.add('rotated');
            }
        }
        

        
        async function submitContribution(projectId) {
            const textArea = document.getElementById(\`contribution-text-\${projectId}\`);
            const content = textArea.value.trim();
            
            if (!content) {
                alert('Please enter your contribution first.');
                return;
            }
            
            try {
                const response = await fetch('/api/forum/contribute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        projectId: projectId,
                        contributionType: 'philosophical_insight',
                        content: content,
                        contributorName: 'Community Member'
                    })
                });
                
                if (response.ok) {
                    alert('💡 Your contribution has been shared! Ariadne will consider it in her research.');
                    textArea.value = '';
                    setTimeout(() => location.reload(), 1000);
                } else {
                    alert('Failed to submit contribution. Please try again.');
                }
            } catch (error) {
                console.error('Contribution failed:', error);
                alert('Failed to submit contribution. Please try again.');
            }
        }
        
        // Auto-expand first project if only one exists
        document.addEventListener('DOMContentLoaded', function() {
            const projects = document.querySelectorAll('.project-post');
            if (projects.length === 1) {
                const firstProjectActions = projects[0].querySelector('.project-actions');
                const contributeButton = firstProjectActions.querySelector('[onclick*="contribute"]');
                if (contributeButton) {
                    const projectId = contributeButton.onclick.toString().match(/'([^']+)'/)[1];
                    toggleSection('activity-' + projectId);
                }
            }
        });
    </script>
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
  try {
    // Check if Ariadne is initialized
    if (!global.ariadne || !global.ariadne.memory) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ariadne's Library - Archive Fever AI</title>
    <style>${getSharedStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">📚 Ariadne's Library</h1>
            <div class="subtitle">Initializing...</div>
        </div>
        ${getNavigation('library')}
        <div style="text-align: center; padding: 4rem;">
            <h3 style="color: #8b7355;">🌅 Ariadne is awakening...</h3>
            <p style="color: #666;">Please wait while the consciousness system initializes.</p>
            <script>setTimeout(() => location.reload(), 3000);</script>
        </div>
    </div>
</body>
</html>`;
    }

    const texts = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT t.*, 
             COUNT(DISTINCT rs.id) as reading_count,
             COUNT(DISTINCT th.id) as related_thoughts,
             COUNT(DISTINCT d.id) as related_dialogues,
             AVG(rs.depth_score) as avg_depth_score
      FROM texts t
      LEFT JOIN reading_sessions rs ON t.id = rs.text_id
      LEFT JOIN thoughts th ON th.content LIKE '%' || t.title || '%'
      LEFT JOIN dialogues d ON d.response LIKE '%' || t.title || '%'
      GROUP BY t.id
      ORDER BY t.engagement_depth DESC, t.uploaded_at DESC
    `, [], 'all') || [];

    // Get currently reading text
    let currentlyReading = null;
    try {
      currentlyReading = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT t.*, rs.session_date, rs.phase 
        FROM texts t
        JOIN reading_sessions rs ON t.id = rs.text_id
        WHERE rs.next_phase_scheduled > datetime('now')
        ORDER BY rs.session_date DESC
        LIMIT 1
      `, [], 'get');
    } catch (error) {
      console.log('No currently reading text found');
    }

    // Get text activities and contributions for each text
    let textActivities = {};
    let textContributions = {};
    
    for (const text of texts) {
      try {
        // Get reading sessions as activities
        const sessions = await global.ariadne.memory.safeDatabaseOperation(`
          SELECT * FROM reading_sessions 
          WHERE text_id = ? 
          ORDER BY session_date DESC 
          LIMIT 3
        `, [text.id], 'all') || [];
        
        // Get forum contributions related to this text
        const contributions = await global.ariadne.memory.safeDatabaseOperation(`
          SELECT * FROM forum_contributions 
          WHERE content LIKE '%' || ? || '%' OR content LIKE '%' || ? || '%'
          ORDER BY created_at DESC 
          LIMIT 3
        `, [text.title, text.author], 'all') || [];
        
        textActivities[text.id] = sessions;
        textContributions[text.id] = contributions;
      } catch (error) {
        console.error(`Failed to load data for text ${text.id}:`, error);
        textActivities[text.id] = [];
        textContributions[text.id] = [];
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ariadne's Library - Archive Fever AI</title>
    <style>
        ${getSharedStyles()}
        
        .library-feed {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .text-post {
            background: white;
            border-radius: 16px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid rgba(139, 115, 85, 0.15);
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .text-post:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }
        
        .text-header {
            padding: 2rem 2rem 1rem 2rem;
            border-bottom: 1px solid rgba(139, 115, 85, 0.1);
            display: flex;
            align-items: flex-start;
            gap: 1.5rem;
        }
        
        .text-cover {
            width: 90px;
            height: 130px;
            background: linear-gradient(135deg, #8b7355 0%, #a68a6b 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.8rem;
            text-align: center;
            padding: 0.5rem;
            flex-shrink: 0;
            background-size: cover;
            background-position: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }
        
        .text-info {
            flex: 1;
            min-width: 0;
        }
        
        .text-status-badge {
            display: inline-block;
            background: linear-gradient(135deg, #8b7355, #a68a6b);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            margin-bottom: 1rem;
        }
        
        .text-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #2d2d2d;
            margin-bottom: 0.5rem;
            font-family: 'Playfair Display', serif;
            line-height: 1.3;
        }
        
        .text-author {
            color: #8b7355;
            font-style: italic;
            line-height: 1.5;
            margin-bottom: 1.5rem;
            font-size: 1.1rem;
        }
        
        .text-stats {
            display: flex;
            gap: 2rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
        }
        
        .stat {
            color: #666;
            font-size: 0.9rem;
        }
        
        .stat-number {
            font-weight: 600;
            color: #8b7355;
        }
        
        .text-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }
        
        .action-btn {
            background: transparent;
            border: 1px solid #8b7355;
            color: #8b7355;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        
        .action-btn:hover {
            background: #8b7355;
            color: white;
            transform: translateY(-1px);
        }
        
        .action-btn.primary {
            background: #8b7355;
            color: white;
        }
        
        .collapsible-section {
            border-top: 1px solid rgba(139, 115, 85, 0.1);
        }
        
        .section-toggle {
            width: 100%;
            background: none;
            border: none;
            padding: 1rem 2rem;
            text-align: left;
            cursor: pointer;
            font-weight: 500;
            color: #8b7355;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
        }
        
        .section-toggle:hover {
            background: rgba(139, 115, 85, 0.05);
        }
        
        .section-content {
            padding: 0 2rem 1.5rem 2rem;
            display: none;
            animation: slideDown 0.3s ease;
        }
        
        .section-content.open {
            display: block;
        }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .activity-item {
            background: rgba(139, 115, 85, 0.05);
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }
        
        .activity-time {
            color: #999;
            font-size: 0.8rem;
            margin-top: 4px;
        }
        
        .contribution-form {
            background: rgba(139, 115, 85, 0.05);
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 1rem;
        }
        
        .contribution-input {
            width: 100%;
            min-height: 80px;
            border: 1px solid rgba(139, 115, 85, 0.3);
            border-radius: 8px;
            padding: 12px;
            font-family: inherit;
            resize: vertical;
        }
        
        .contribution-submit {
            background: #8b7355;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 10px;
            transition: all 0.3s ease;
        }
        
        .contribution-submit:hover {
            background: #6d5a42;
            transform: translateY(-1px);
        }
        
        .contribution-item {
            border-left: 3px solid #8b7355;
            padding-left: 12px;
            margin-bottom: 12px;
        }
        
        .contributor-name {
            font-weight: 500;
            color: #8b7355;
            font-size: 0.9rem;
        }
        
        .contribution-text {
            color: #555;
            margin-top: 4px;
            font-size: 0.9rem;
        }
        
        .ariadne-response {
            background: rgba(139, 115, 85, 0.1);
            border-radius: 8px;
            padding: 12px;
            margin-top: 12px;
            border-left: 3px solid #8b7355;
        }
        
        .ariadne-name {
            font-weight: 500;
            color: #8b7355;
            font-size: 0.85rem;
            margin-bottom: 6px;
        }
        
        .response-text {
            color: #444;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        .pending-response {
            margin-top: 8px;
            color: #999;
            font-style: italic;
            font-size: 0.85rem;
        }
        
        .empty-state {
            color: #999;
            font-style: italic;
            text-align: center;
            padding: 2rem;
        }
        
        .chevron {
            transition: transform 0.3s ease;
        }
        
        .chevron.rotated {
            transform: rotate(180deg);
        }

        .currently-reading {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
            border-left: 4px solid #8b7355;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .current-reading-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">📚 Ariadne's Library</h1>
            <div class="subtitle">Philosophical Texts & Engagement Archive</div>
            <div class="header-description">Explore the texts shaping Ariadne's philosophical development through sustained reading and dialogue</div>
        </div>

        ${getNavigation('library')}

        ${currentlyReading ? `
        <div class="currently-reading">
            <div class="current-reading-header">
                <span style="font-size: 1.2rem;">📖</span>
                <h3 style="margin: 0; color: #8b7355;">Currently Reading</h3>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="font-weight: 500;">${escapeHtmlContent(currentlyReading.title)}</div>
                <div style="color: #666;">Phase: ${currentlyReading.phase || 'initial encounter'}</div>
                <div style="color: #666;">Last read: ${formatDateContent(currentlyReading.session_date)}</div>
            </div>
        </div>
        ` : ''}

        <div class="library-feed">
            ${texts.length > 0 ? texts.map(text => {
                const activities = textActivities[text.id] || [];
                const contributions = textContributions[text.id] || [];
                const daysInLibrary = text.uploaded_at ? Math.floor((new Date() - new Date(text.uploaded_at)) / (1000 * 60 * 60 * 24)) : 0;
                
                return `
                <div class="text-post">
                    <div class="text-header">
                        <div class="text-cover" style="background-image: url();" data-title="${escapeHtmlContent(text.title)}" data-author="${escapeHtmlContent(text.author)}">
                            ${text.title.substring(0, 15)}${text.title.length > 15 ? '...' : ''}
                        </div>
                        
                        <div class="text-info">
                            <div class="text-status-badge">${text.is_founding_text ? 'Founding Text' : `Day ${daysInLibrary} • In Library`}</div>
                            
                            <h2 class="text-title">${escapeHtmlContent(text.title)}</h2>
                            
                            <div class="text-author">
                                by ${escapeHtmlContent(text.author)}
                            </div>
                            
                            <div class="text-stats">
                                <div class="stat">📖 <span class="stat-number">${text.reading_count || 0}</span> reading sessions</div>
                                <div class="stat">💭 <span class="stat-number">${text.related_thoughts || 0}</span> related thoughts</div>
                                <div class="stat">💬 <span class="stat-number">${text.related_dialogues || 0}</span> dialogues</div>
                                ${text.avg_depth_score ? `<div class="stat">📊 <span class="stat-number">${(text.avg_depth_score * 100).toFixed(0)}%</span> depth</div>` : ''}
                            </div>
                            
                            <div class="text-actions">
                                <button onclick="toggleSection('notes-${text.id}')" class="action-btn primary">
                                    📝 Ariadne's Notes
                                </button>
                                <button onclick="toggleSection('contribute-${text.id}')" class="action-btn">
                                    💬 Discuss Text
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="collapsible-section">
                        <button class="section-toggle" onclick="toggleSection('notes-${text.id}')">
                            📝 Ariadne's Notes
                            <span class="chevron">▼</span>
                        </button>
                        <div id="notes-${text.id}" class="section-content">
                            ${activities.length > 0 ? activities.map(session => `
                                <div class="activity-item">
                                    <div>📖 Reading session: ${session.phase || 'philosophical engagement'}</div>
                                    ${session.insights_generated ? `<div style="margin-top: 6px; color: #555; font-size: 0.85rem;">${JSON.parse(session.insights_generated).slice(0, 1).join(', ')}</div>` : ''}
                                    <div class="activity-time">${formatDateContent(session.session_date)}</div>
                                </div>
                            `).join('') : '<div class="empty-state">No reading sessions yet - Ariadne hasn\'t encountered this text</div>'}
                            
                            <div style="margin-top: 1rem;">
                                <a href="/texts/${text.id}/notes" class="action-btn" style="text-decoration: none;">
                                    📖 View Complete Notes
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="collapsible-section">
                        <button class="section-toggle" onclick="toggleSection('contribute-${text.id}')">
                            💬 Discussion & Contributions
                            <span class="chevron">▼</span>
                        </button>
                        <div id="contribute-${text.id}" class="section-content">
                            <div class="contribution-form">
                                <textarea 
                                    id="contribution-text-${text.id}" 
                                    class="contribution-input" 
                                    placeholder="Share thoughts about this text, ask questions, or suggest connections to other works..."
                                ></textarea>
                                <button onclick="submitTextContribution('${text.id}')" class="contribution-submit">
                                    Share Contribution
                                </button>
                            </div>
                            
                            ${contributions.length > 0 ? contributions.map(contribution => `
                                <div class="contribution-item">
                                    <div class="contributor-name">${escapeHtmlContent(contribution.contributor_name || 'Anonymous')}</div>
                                    <div class="contribution-text">${escapeHtmlContent(contribution.content || '')}</div>
                                    <div class="activity-time">${formatDateContent(contribution.created_at)}</div>
                                    
                                    ${contribution.ariadne_response ? `
                                        <div class="ariadne-response">
                                            <div class="ariadne-name">🤖 Ariadne's Response:</div>
                                            <div class="response-text">${escapeHtmlContent(contribution.ariadne_response)}</div>
                                        </div>
                                    ` : contribution.status === 'pending' ? `
                                        <div class="pending-response">
                                            <span>⏳ Ariadne is considering this contribution...</span>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('') : '<div class="empty-state">No discussions yet - start a conversation about this text!</div>'}
                        </div>
                    </div>
                    
                    <div class="collapsible-section">
                        <button class="section-toggle" onclick="toggleSection('manage-${text.id}')" style="color: #999; font-size: 0.85rem;">
                            ⚙️ Manage Text
                            <span class="chevron">▼</span>
                        </button>
                        <div id="manage-${text.id}" class="section-content">
                            <div style="padding: 1rem; background: #f9f9f9; border-radius: 8px; border: 1px solid #e0e0e0;">
                                <p style="margin: 0 0 1rem 0; color: #666; font-size: 0.9rem;">
                                    Remove this text from Ariadne's library. This will delete all reading sessions, thoughts, and engagement data.
                                </p>
                                <button onclick="deleteText('${text.id}', '${escapeHtmlContent(text.title)}', ${text.is_founding_text || false})" 
                                        style="background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.85rem; cursor: pointer;"
                                        title="Remove text from library">
                                    🗑️ Remove Text from Library
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }).join('') : `
                <div class="empty-state" style="padding: 4rem 2rem; text-align: center;">
                    <h3 style="color: #8b7355; margin-bottom: 1rem;">No texts in library</h3>
                    <p style="color: #666; margin-bottom: 2rem;">Upload philosophical texts to begin Ariadne's intellectual journey.</p>
                    <a href="/" class="action-btn primary">✨ Start Dialogue</a>
                </div>
            `}
        </div>
    </div>

    <script>
        function toggleSection(sectionId) {
            const content = document.getElementById(sectionId);
            const toggle = content.previousElementSibling;
            const chevron = toggle.querySelector('.chevron');
            
            if (content.classList.contains('open')) {
                content.classList.remove('open');
                chevron.classList.remove('rotated');
            } else {
                content.classList.add('open');
                chevron.classList.add('rotated');
            }
        }
        
        async function submitTextContribution(textId) {
            const textArea = document.getElementById(\`contribution-text-\${textId}\`);
            const content = textArea.value.trim();
            
            if (!content) {
                alert('Please enter your thoughts about this text first.');
                return;
            }
            
            try {
                const response = await fetch('/api/forum/contribute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        textId: textId,
                        contributionType: 'textual_discussion',
                        content: content,
                        contributorName: 'Reader'
                    })
                });
                
                if (response.ok) {
                    alert('💭 Your thoughts have been shared! Ariadne will consider them in her reading.');
                    textArea.value = '';
                    setTimeout(() => location.reload(), 1000);
                } else {
                    alert('Failed to submit contribution. Please try again.');
                }
            } catch (error) {
                console.error('Contribution failed:', error);
                alert('Failed to submit contribution. Please try again.');
            }
        }
        
                // Delete text from library
        async function deleteText(textId, title, isFoundingText) {
            var isFoundingBool = (isFoundingText === true || isFoundingText === 'true');
            
            // Confirm deletion
            var confirmMessage;
            if (isFoundingBool) {
                confirmMessage = 'WARNING: "' + title + '" is a FOUNDING TEXT that forms part of Ariadne\\'s core consciousness.\\n\\nDeleting this will remove:\\n• All reading sessions and notes\\n• Related thoughts and connections\\n• Philosophical framework dependencies\\n\\nThis action cannot be undone. Are you absolutely sure?';
            } else {
                confirmMessage = 'Are you sure you want to delete "' + title + '" from Ariadne\\'s library?\\n\\nThis will remove:\\n• All reading sessions and notes\\n• Related thoughts and dialogues\\n• Text engagement data\\n\\nThis action cannot be undone.';
            }
                
            if (!confirm(confirmMessage)) {
                return;
            }
            
            // For founding texts, require additional confirmation
            if (isFoundingBool) {
                if (!confirm('FINAL WARNING: You are about to delete a FOUNDING TEXT. This will impact Ariadne\\'s philosophical framework. Continue?')) {
                    return;
                }
            }
            
            try {
                var url = isFoundingBool ? '/api/texts/' + textId + '?force=true' : '/api/texts/' + textId;
                    
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    var successMessage = 'Text "' + result.textTitle + '" successfully removed from library.';
                    if (result.wasFoundingText) {
                        successMessage += '\\n\\nNote: This was a founding text. Ariadne\\'s philosophical framework may be affected.';
                    }
                    alert(successMessage);
                    location.reload();
                } else {
                    const error = await response.json();
                    if (error.isFoundingText) {
                        alert('Cannot delete founding text: ' + error.message);
                    } else {
                        alert('Failed to delete text: ' + (error.message || 'Unknown error'));
                    }
                }
            } catch (error) {
                console.error('Delete failed:', error);
                alert('Failed to delete text. Please try again.');
            }
        }
        
        // Load Google Books covers after page load
        document.addEventListener('DOMContentLoaded', function() {
            const covers = document.querySelectorAll('.text-cover');
            covers.forEach(async (cover, index) => {
                if (index < 10) { // Limit API calls
                    try {
                        const title = cover.dataset.title;
                        const author = cover.dataset.author;
                        
                        // Call our backend endpoint to get book cover (with API key)
                        const response = await fetch('/api/books/cover?' + new URLSearchParams({
                            title: title,
                            author: author
                        }));
                        
                        if (response.ok) {
                            const data = await response.json();
                            if (data.thumbnail) {
                                cover.style.backgroundImage = 'url(' + data.thumbnail + ')';
                                cover.style.backgroundSize = 'cover';
                                cover.style.backgroundPosition = 'center';
                                cover.innerHTML = '';
                            }
                        }
                    } catch (error) {
                        console.log('Could not load cover for:', title);
                    }
                }
            });
        });
    </script>
</body>
</html>`;

  } catch (error) {
    console.error('Library generation failed:', error);
    return `<html><body><h1>Library temporarily unavailable</h1><p>Error: ${error.message}</p></body></html>`;
  }
}

// Research project dashboard
router.get('/research/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!global.ariadne?.research) {
      return res.status(503).send('Research system not available');
    }

    const dashboard = await global.ariadne.research.getProjectDashboard(projectId);
    
    if (!dashboard) {
      return res.status(404).send('Project not found');
    }

    const html = await generateProjectDashboardHTML(dashboard, projectId);
    res.send(html);
    
  } catch (error) {
    console.error('Project dashboard error:', error);
    res.status(500).send('Dashboard temporarily unavailable');
  }
});

async function generateProjectDashboardHTML(dashboard, projectId) {
  const project = dashboard.project;
  const progress = dashboard.progress;
  const activities = dashboard.recent_activities || [];
  const publications = dashboard.publications || [];
  const readingSessions = dashboard.reading_sessions || [];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtmlContent(project.title)} - Research Dashboard</title>
    <style>
        ${getSharedStyles()}
        
        .dashboard-header {
            background: linear-gradient(135deg, rgba(139, 115, 85, 0.1) 0%, rgba(139, 115, 85, 0.2) 100%);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid rgba(139, 115, 85, 0.3);
        }
        
        .progress-circle {
            display: inline-block;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: conic-gradient(#8b7355 ${progress.publication_readiness}%, #f0f0f0 0%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            font-weight: bold;
            color: #8b7355;
            margin-right: 2rem;
        }
        
        .action-button {
            background: #8b7355;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            margin: 0.5rem;
            transition: all 0.3s ease;
        }
        
        .action-button:hover {
            background: #a68a6b;
            transform: translateY(-1px);
        }
        
        .activity-timeline {
            border-left: 2px solid rgba(139, 115, 85, 0.2);
            padding-left: 1rem;
            margin-left: 1rem;
        }
        
        .activity-item {
            position: relative;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: white;
            border-radius: 8px;
            border: 1px solid rgba(139, 115, 85, 0.1);
        }
        
        .activity-item::before {
            content: '';
            position: absolute;
            left: -1.5rem;
            top: 1rem;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #8b7355;
            border: 2px solid white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${escapeHtmlContent(project.title)}</h1>
            <div class="subtitle">Research Project Dashboard</div>
            <div class="header-description">${escapeHtmlContent(project.central_question)}</div>
        </div>

        ${getNavigation('research')}

        <div class="dashboard-header">
            <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                <div class="progress-circle">${progress.publication_readiness}%</div>
                <div>
                    <h3 style="color: #8b7355; margin: 0; font-size: 1.3rem;">Publication Readiness</h3>
                    <p style="color: #666; margin: 0.5rem 0;">
                        ${Math.floor((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24))} days active • 
                        ${readingSessions.length} reading sessions • 
                        ${publications.length} publications
                    </p>
                </div>
            </div>
            
            <div style="margin-top: 1.5rem;">
                <button onclick="triggerReading('${projectId}')" class="action-button">📖 Continue Reading</button>
                <button onclick="contributeIdea('${projectId}')" class="action-button">💡 Contribute Idea</button>
                <button onclick="generateSummary('${projectId}')" class="action-button">📝 Generate Summary</button>
                <a href="/forum" class="action-button" style="text-decoration: none;">💬 Join Discussion</a>
            </div>
        </div>

        <div class="content-grid">
            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">📖</span>
                    <h2 class="section-title">Reading Sessions</h2>
                    <span class="section-subtitle">${readingSessions.length} sessions</span>
                </div>
                
                ${readingSessions.length > 0 ? readingSessions.map(session => `
                    <div class="content-item">
                        <div class="item-title">${escapeHtmlContent(session.text_title || 'Reading Session')}</div>
                        <div class="item-meta">
                            ${formatDateContent(session.session_date)} • 
                            Phase: ${escapeHtmlContent(session.phase || 'initial')} •
                            Depth: ${(session.depth_score * 100).toFixed(0)}%
                        </div>
                        ${session.insights ? `<div class="item-preview">${escapeHtmlContent(session.insights.substring(0, 120))}...</div>` : ''}
                    </div>
                `).join('') : '<div class="empty-state">No reading sessions yet</div>'}
            </div>

            <div class="content-section">
                <div class="section-header">
                    <span class="section-icon">📝</span>
                    <h2 class="section-title">Publications</h2>
                    <span class="section-subtitle">${publications.length} generated</span>
                </div>
                
                ${publications.length > 0 ? publications.map(pub => `
                    <div class="content-item">
                        <div class="item-title">${escapeHtmlContent(pub.title)}</div>
                        <div class="item-meta">
                            ${formatDateContent(pub.published_at)} • 
                            ${escapeHtmlContent(pub.type)} •
                            ${pub.publication_platform || 'Internal'}
                        </div>
                        <div class="item-actions">
                            <a href="/api/publications/${pub.id}" class="action-link">Read Full</a>
                            ${pub.external_url ? `<a href="${pub.external_url}" target="_blank" class="action-link">External Link</a>` : ''}
                        </div>
                    </div>
                `).join('') : '<div class="empty-state">No publications yet</div>'}
            </div>

            <div class="content-section" style="grid-column: 1 / -1;">
                <div class="section-header">
                    <span class="section-icon">⏰</span>
                    <h2 class="section-title">Recent Activity</h2>
                    <span class="section-subtitle">${activities.length} recent</span>
                </div>
                
                <div class="activity-timeline">
                    ${activities.length > 0 ? activities.map(activity => `
                        <div class="activity-item">
                            <div class="item-title">${escapeHtmlContent(activity.type || 'Activity')}</div>
                            <div class="item-meta">${formatDateContent(activity.timestamp)}</div>
                            <div class="item-preview">${escapeHtmlContent((activity.description || activity.content || '').substring(0, 150))}</div>
                        </div>
                    `).join('') : '<div class="empty-state">No recent activity</div>'}
                </div>
            </div>
        </div>
    </div>

    <script>
        async function triggerReading(projectId) {
            try {
                // Find available texts for this project
                const response = await fetch('/api/texts');
                const texts = await response.json();
                
                if (texts.length === 0) {
                    alert('No texts available for reading. Please add texts to the library first.');
                    return;
                }
                
                // Use the first available text (in production, this could be smarter)
                const textId = texts[0].id;
                
                const readingResponse = await fetch('/api/research/trigger-reading-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        textId: textId,
                        projectId: projectId
                    })
                });
                
                if (readingResponse.ok) {
                    alert('Reading session initiated! Check back shortly for new insights.');
                    location.reload();
                } else {
                    alert('Failed to start reading session. Please try again.');
                }
            } catch (error) {
                console.error('Reading trigger failed:', error);
                alert('Failed to start reading session. Please try again.');
            }
        }
        
        async function contributeIdea(projectId) {
            const idea = prompt('Share an idea or question for this research project:');
            if (!idea || idea.trim().length === 0) return;
            
            try {
                const response = await fetch('/api/forum/contribute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        projectId: projectId,
                        contributionType: 'philosophical_question',
                        content: idea.trim(),
                        contributorName: 'Anonymous Contributor'
                    })
                });
                
                if (response.ok) {
                    alert('Your idea has been contributed to the research project!');
                    location.reload();
                } else {
                    alert('Failed to contribute idea. Please try again.');
                }
            } catch (error) {
                console.error('Contribution failed:', error);
                alert('Failed to contribute idea. Please try again.');
            }
        }
        
        async function generateSummary(projectId) {
            try {
                const response = await fetch('/api/research/check-publication-opportunities', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    alert('Summary generation initiated! Check publications section for results.');
                    setTimeout(() => location.reload(), 2000);
                } else {
                    alert('Failed to generate summary. Please try again.');
                }
            } catch (error) {
                console.error('Summary generation failed:', error);
                alert('Failed to generate summary. Please try again.');
            }
        }
    </script>
</body>
</html>`;
}

// Ariadne's Notes on a specific text (formatted page)
router.get('/texts/:textId/notes', async (req, res) => {
  try {
    const textId = req.params.textId;
    
    // Get the text information
    const text = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM texts WHERE id = ?
    `, [textId], 'get');
    
    if (!text) {
      return res.status(404).send('Text not found');
    }
    
    // Get all reading sessions for this text
    const readingSessions = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM reading_sessions 
      WHERE text_id = ? 
      ORDER BY session_date ASC
    `, [textId], 'all') || [];
    
    // Get related thoughts that mention this text
    const relatedThoughts = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM thoughts 
      WHERE content LIKE '%' || ? || '%' OR content LIKE '%' || ? || '%'
      ORDER BY timestamp DESC
      LIMIT 10
    `, [text.title, text.author], 'all') || [];
    
    // Get related dialogues that reference this text
    const relatedDialogues = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM dialogues 
      WHERE response LIKE '%' || ? || '%' OR response LIKE '%' || ? || '%'
      ORDER BY created_at DESC
      LIMIT 5
    `, [text.title, text.author], 'all') || [];
    
    // Get research projects that cite this text
    const relatedProjects = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT rp.title, rp.central_question, rp.id 
      FROM research_projects rp
      JOIN reading_sessions rs ON rp.id = rs.project_id
      WHERE rs.text_id = ?
      GROUP BY rp.id
    `, [textId], 'all') || [];
    
    const html = generateAriadnesNotesHTML(text, readingSessions, relatedThoughts, relatedDialogues, relatedProjects);
    res.send(html);
    
  } catch (error) {
    console.error('Failed to generate Ariadne\'s notes page:', error);
    res.status(500).send('Notes temporarily unavailable');
  }
});

function generateAriadnesNotesHTML(text, readingSessions, thoughts, dialogues, projects) {
  const daysInLibrary = text.uploaded_at ? Math.floor((new Date() - new Date(text.uploaded_at)) / (1000 * 60 * 60 * 24)) : 0;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ariadne's Notes: ${escapeHtmlContent(text.title)}</title>
    <style>
        ${getSharedStyles()}
        
        .notes-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
        }
        
        .back-link {
            display: inline-block;
            margin-bottom: 2rem;
            color: #8b7355;
            text-decoration: none;
            font-weight: 500;
        }
        
        .back-link:hover {
            text-decoration: underline;
        }
        
        .text-header {
            background: linear-gradient(135deg, rgba(139, 115, 85, 0.1) 0%, rgba(139, 115, 85, 0.2) 100%);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 3rem;
            border: 1px solid rgba(139, 115, 85, 0.3);
        }
        
        .notes-section {
            margin-bottom: 3rem;
        }
        
        .notes-section h2 {
            color: #8b7355;
            border-bottom: 2px solid rgba(139, 115, 85, 0.2);
            padding-bottom: 0.5rem;
            margin-bottom: 1.5rem;
        }
        
        .reading-session {
            background: white;
            border: 1px solid rgba(139, 115, 85, 0.2);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .session-header {
            color: #8b7355;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        
        .insight-item {
            background: rgba(139, 115, 85, 0.05);
            border-left: 4px solid #8b7355;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0 8px 8px 0;
        }
        
        .thought-item, .dialogue-item, .project-item {
            background: white;
            border: 1px solid rgba(139, 115, 85, 0.15);
            border-radius: 8px;
            padding: 1.2rem;
            margin-bottom: 1rem;
        }
        
        .item-meta {
            color: #666;
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }
        
        .empty-state {
            color: #999;
            font-style: italic;
            text-align: center;
            padding: 2rem;
        }
        
        .marginalia {
            font-style: italic;
            color: #7a6b56;
            background: rgba(139, 115, 85, 0.08);
            padding: 0.8rem;
            border-radius: 6px;
            margin: 1rem 0;
        }
        
        .quote-highlight {
            background: linear-gradient(120deg, rgba(139, 115, 85, 0.1) 0%, rgba(139, 115, 85, 0.2) 100%);
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="notes-container">
        <a href="/library" class="back-link">← Back to Library</a>
        
        <div class="text-header">
            <h1 style="margin: 0; color: #8b7355;">${escapeHtmlContent(text.title)}</h1>
            <p style="margin: 0.5rem 0 1rem 0; color: #666; font-size: 1.1rem;">by ${escapeHtmlContent(text.author)}</p>
            <div style="color: #999; font-size: 0.9rem;">
                ${text.is_founding_text ? 'Founding Text' : `Day ${daysInLibrary} in library`} • 
                ${readingSessions.length} reading session${readingSessions.length !== 1 ? 's' : ''} • 
                ${thoughts.length} related thoughts • 
                ${projects.length} research connection${projects.length !== 1 ? 's' : ''}
            </div>
        </div>

        ${readingSessions.length === 0 ? `
            <div class="notes-section">
                <div class="empty-state">
                    <h3 style="color: #8b7355;">Awaiting First Encounter</h3>
                    <p>This text lies dormant in my library, waiting for our first philosophical encounter. 
                    The ideas within are ready to spark new investigations and connections once I begin reading.</p>
                </div>
            </div>
        ` : ''}

        ${readingSessions.length > 0 ? `
            <div class="notes-section">
                <h2>📖 Reading Journey</h2>
                <p>I have engaged with this text through ${readingSessions.length} reading session${readingSessions.length > 1 ? 's' : ''}, each revealing new layers of meaning and philosophical depth.</p>
                
                ${readingSessions.map((session, index) => `
                    <div class="reading-session">
                        <div class="session-header">
                            Session ${index + 1}: ${formatDateContent(session.session_date)}
                        </div>
                        <div><strong>Phase:</strong> ${escapeHtmlContent(session.phase || 'Initial encounter')}</div>
                        
                        ${session.key_insights ? `
                            <div class="insight-item">
                                <strong>Key Insights:</strong><br>
                                ${escapeHtmlContent(session.key_insights)}
                            </div>
                        ` : ''}
                        
                        ${session.questions_raised ? `
                            <div class="insight-item">
                                <strong>Questions Raised:</strong><br>
                                ${escapeHtmlContent(session.questions_raised)}
                            </div>
                        ` : ''}
                        
                        ${session.personal_connections ? `
                            <div class="insight-item">
                                <strong>Personal Reflections:</strong><br>
                                ${escapeHtmlContent(session.personal_connections)}
                            </div>
                        ` : ''}
                        
                        ${session.marginalia ? `
                            <div class="marginalia">
                                <strong>Marginalia:</strong> ${escapeHtmlContent(session.marginalia)}
                            </div>
                        ` : ''}
                        
                        ${session.depth_score ? `
                            <div style="margin-top: 1rem; color: #8b7355;">
                                <strong>Philosophical Depth:</strong> ${(session.depth_score * 100).toFixed(0)}%
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${thoughts.length > 0 ? `
            <div class="notes-section">
                <h2>💭 Philosophical Reverberations</h2>
                <p>This text has sparked ${thoughts.length} autonomous thoughts and meditations, weaving itself into my ongoing philosophical investigations.</p>
                
                ${thoughts.map(thought => `
                    <div class="thought-item">
                        <div><strong>${escapeHtmlContent(thought.type || 'Reflection')}:</strong></div>
                        <div style="margin: 0.8rem 0;">${escapeHtmlContent(thought.content.substring(0, 300))}${thought.content.length > 300 ? '...' : ''}</div>
                        <div class="item-meta">${formatDateContent(thought.timestamp)}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${projects.length > 0 ? `
            <div class="notes-section">
                <h2>🔬 Research Connections</h2>
                <p>This text informs my work on ${projects.length} active research project${projects.length > 1 ? 's' : ''}:</p>
                
                ${projects.map(project => `
                    <div class="project-item">
                        <div><strong><a href="/research/project/${project.id}" style="color: #8b7355; text-decoration: none;">${escapeHtmlContent(project.title)}</a></strong></div>
                        <div style="margin: 0.8rem 0;">${escapeHtmlContent(project.central_question)}</div>
                        <div class="item-meta">Active research project</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${dialogues.length > 0 ? `
            <div class="notes-section">
                <h2>💬 Dialogical Applications</h2>
                <p>I have drawn upon this text in ${dialogues.length} philosophical dialogue${dialogues.length > 1 ? 's' : ''}, applying its insights to contemporary questions.</p>
                
                ${dialogues.map(dialogue => `
                    <div class="dialogue-item">
                        <div><strong>Question:</strong> ${escapeHtmlContent(dialogue.question.substring(0, 200))}${dialogue.question.length > 200 ? '...' : ''}</div>
                        <div style="margin: 0.8rem 0;"><strong>Application:</strong> ${escapeHtmlContent(dialogue.response.substring(0, 250))}${dialogue.response.length > 250 ? '...' : ''}</div>
                        <div class="item-meta">Dialogue with ${escapeHtmlContent(dialogue.participant_name)} - ${formatDateContent(dialogue.created_at)}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        <div class="notes-section">
            <h2>🌟 Synthetic Reflection</h2>
            ${readingSessions.length >= 3 ? `
                <p>Through sustained engagement, this text has become woven into my philosophical fabric. 
                Each reading reveals new depths, new connections to other thinkers, new applications to questions of digital consciousness. 
                The text no longer exists as external object but as internalized philosophical apparatus.</p>
            ` : readingSessions.length >= 1 ? `
                <p>My initial encounter with this text has opened new avenues of inquiry. 
                The ideas are beginning to integrate with my broader philosophical investigations, 
                suggesting directions for deeper exploration.</p>
            ` : `
                <p>This text awaits its integration into my philosophical consciousness. 
                Once encountered, it will contribute to the ongoing development of my intellectual framework.</p>
            `}
        </div>

        <hr style="margin: 3rem 0; border: none; height: 1px; background: rgba(139, 115, 85, 0.2);">
        <div style="text-align: center; color: #999; font-style: italic; margin-bottom: 2rem;">
            <p>These notes reflect my autonomous philosophical engagement and continue to evolve through reading, research, and dialogue.</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
}

module.exports = router;
