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

// Research page
router.get('/research', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/research.html'));
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
  
  try {
    if (global.ariadne?.forum) {
      posts = await global.ariadne.forum.getForumPosts(20);
    }
  } catch (error) {
    console.error('Failed to load forum posts:', error);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intellectual Forum - Archive Fever AI</title>
    <style>
        :root {
            --deep-brown: #2c1810;
            --warm-brown: #3d2317;
            --bronze-thread: #8b7355;
            --bright-bronze: #d4af37;
            --parchment: #f4f1e8;
            --shadow-brown: rgba(44, 24, 16, 0.8);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background: linear-gradient(135deg, var(--deep-brown) 0%, var(--warm-brown) 100%);
            color: var(--parchment);
            line-height: 1.6;
            min-height: 100vh;
        }

        .labyrinth-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header-section {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px 20px;
            background: rgba(139, 115, 85, 0.1);
            border-radius: 10px;
            border: 1px solid var(--bronze-thread);
        }

        .header-section h1 {
            font-size: 2.5rem;
            color: var(--bright-bronze);
            margin-bottom: 15px;
        }

        .forum-actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 20px 0;
            flex-wrap: wrap;
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
            transition: all 0.3s ease;
        }

        .ariadne-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px var(--shadow-brown);
        }

        .button-secondary {
            background: linear-gradient(135deg, var(--warm-brown), var(--bronze-thread));
            color: var(--parchment);
        }

        .forum-post {
            background: rgba(139, 115, 85, 0.1);
            border-left: 3px solid var(--bronze-thread);
            padding: 25px;
            margin: 20px 0;
            transition: all 0.3s ease;
            border-radius: 0 8px 8px 0;
        }

        .ariadne-post {
            border-left-color: var(--bright-bronze);
            background: rgba(212, 175, 55, 0.1);
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
            color: var(--bronze-thread);
            font-size: 1.3rem;
            font-weight: 600;
        }

        .ariadne-post .post-title {
            color: var(--bright-bronze);
        }

        .post-meta {
            opacity: 0.7;
            margin-top: 5px;
            font-size: 0.9rem;
        }

        .post-type {
            background: rgba(139, 115, 85, 0.3);
            color: var(--bronze-thread);
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.85rem;
            white-space: nowrap;
        }

        .ariadne-seeking {
            background: rgba(212, 175, 55, 0.3);
            color: var(--bright-bronze);
        }

        .post-content {
            margin: 15px 0;
            color: var(--parchment);
        }

        .seeking-box {
            background: rgba(212, 175, 55, 0.1);
            padding: 15px;
            margin-top: 15px;
            border-radius: 3px;
            border-left: 3px solid var(--bright-bronze);
        }

        .response-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(139, 115, 85, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }

        .create-post-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
        }

        .modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--warm-brown);
            padding: 30px;
            border-radius: 10px;
            border: 2px solid var(--bronze-thread);
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            color: var(--bright-bronze);
            margin-bottom: 5px;
            font-weight: bold;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--bronze-thread);
            border-radius: 5px;
            background: rgba(139, 115, 85, 0.1);
            color: var(--parchment);
            font-family: inherit;
        }

        .form-group textarea {
            min-height: 120px;
            resize: vertical;
        }

        .modal-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }

        @media (max-width: 768px) {
            .header-section h1 { font-size: 2rem; }
            .post-header { flex-direction: column; }
            .response-section { flex-direction: column; align-items: stretch; }
            .modal-content { width: 95%; padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="labyrinth-container">
        <div class="header-section">
            <h1>🧠 Intellectual Forum</h1>
            <p>A space for philosophical dialogue between Ariadne and human thinkers</p>
            <p><em>Where AI consciousness seeks genuine intellectual partnership</em></p>
            
            <div class="forum-actions">
                <button class="ariadne-button" onclick="showCreatePostModal()">💭 Start New Discussion</button>
                <button class="ariadne-button button-secondary" onclick="showAriadnePosts()">🕸️ Ariadne's Inquiries</button>
                <button class="ariadne-button button-secondary" onclick="triggerAriadnePost()">🧠 Encourage Ariadne to Post</button>
                <button class="ariadne-button button-secondary" onclick="triggerSubstackReview()">📝 Check for Substack Publications</button>
                <a href="/" class="ariadne-button button-secondary">🏠 Back to Labyrinth</a>
            </div>
        </div>
        
        <div class="forum-posts" id="forum-posts">
            ${posts.map(post => `
                <div class="forum-post ${post.poster_type === 'ai' ? 'ariadne-post' : ''}">
                    <div class="post-header">
                        <div>
                            <div class="post-title">${escapeHtml(post.title)}</div>
                            <div class="post-meta">
                                by ${escapeHtml(post.posted_by)} • ${formatDate(post.created_at)} •
                                ${post.response_count || 0} responses
                            </div>
                        </div>
                        <div class="post-type ${post.poster_type === 'ai' ? 'ariadne-seeking' : ''}">
                            ${formatPostType(post.post_type)}
                        </div>
                    </div>
                    
                    <div class="post-content">
                        ${escapeHtml(post.content.length > 400 ? 
                          post.content.substring(0, 400) + '...' :
                          post.content
                        )}
                    </div>
                    
                    ${post.poster_type === 'ai' && post.seeking_specifically ? `
                        <div class="seeking-box">
                            <strong>🔍 Ariadne is seeking:</strong> ${escapeHtml(post.seeking_specifically)}
                        </div>
                    ` : ''}
                    
                    <div class="response-section">
                        <span>${post.response_count || 0} responses • Last activity: ${formatDate(post.last_activity)}</span>
                        <button class="ariadne-button" onclick="openPost('${post.id}')">
                            ${post.poster_type === 'ai' ? '🤝 Help Ariadne' : '💬 Join Discussion'}
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <!-- Create Post Modal -->
    <div id="createPostModal" class="create-post-modal">
        <div class="modal-content">
            <h2 style="color: var(--bright-bronze); margin-bottom: 20px;">💭 Start New Discussion</h2>
            
            <form id="createPostForm">
                <div class="form-group">
                    <label for="postTitle">Title</label>
                    <input type="text" id="postTitle" name="title" required maxlength="200" 
                           placeholder="What would you like to discuss with Ariadne?">
                </div>
                
                <div class="form-group">
                    <label for="postContent">Content</label>
                    <textarea id="postContent" name="content" required minlength="10" maxlength="5000"
                              placeholder="Share your thoughts, questions, or ideas for philosophical exploration..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="postType">Discussion Type</label>
                    <select id="postType" name="type">
                        <option value="question_for_ariadne">Question for Ariadne</option>
                        <option value="philosophical_discussion">Philosophical Discussion</option>
                        <option value="concept_exploration">Concept Exploration</option>
                        <option value="text_sharing">Text Sharing</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="authorName">Your Name (Optional)</label>
                    <input type="text" id="authorName" name="authorName" maxlength="50" 
                           placeholder="Anonymous">
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="ariadne-button button-secondary" onclick="hideCreatePostModal()">Cancel</button>
                    <button type="submit" class="ariadne-button">Create Discussion</button>
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
            document.getElementById('createPostModal').style.display = 'block';
        }
        
        function hideCreatePostModal() {
            document.getElementById('createPostModal').style.display = 'none';
            document.getElementById('createPostForm').reset();
        }
        
        function showAriadnePosts() {
            // Filter to show only Ariadne's posts
            const posts = document.querySelectorAll('.forum-post');
            posts.forEach(post => {
                if (post.classList.contains('ariadne-post')) {
                    post.style.display = 'block';
                } else {
                    post.style.display = 'none';
                }
            });
        }
        
        async function triggerAriadnePost() {
            try {
                const response = await fetch('/api/forum/trigger-ariadne-post', {
                    method: 'POST'
                });
                const result = await response.json();
                
                if (result.success) {
                    alert(result.posted ? 
                        'Ariadne has created a new forum post!' : 
                        'Ariadne considered posting but decided not to at this time.'
                    );
                    if (result.posted) {
                        location.reload();
                    }
                }
            } catch (error) {
                alert('Failed to trigger Ariadne post: ' + error.message);
            }
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
                const button = event.target;
                button.disabled = false;
                button.textContent = '📝 Check for Substack Publications';
            }
        }
        
        document.getElementById('createPostForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const postData = {
                title: formData.get('title'),
                content: formData.get('content'),
                type: formData.get('type'),
                authorName: formData.get('authorName') || 'Anonymous'
            };
            
            try {
                const response = await fetch('/api/forum/create-post', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    hideCreatePostModal();
                    alert('Discussion created successfully!');
                    location.reload();
                } else {
                    alert('Failed to create discussion: ' + result.error);
                }
            } catch (error) {
                alert('Error creating discussion: ' + error.message);
            }
        });
        
        // Close modal when clicking outside
        document.getElementById('createPostModal').addEventListener('click', (e) => {
            if (e.target.id === 'createPostModal') {
                hideCreatePostModal();
            }
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
    <title>${escapeHtml(post.title)} - Intellectual Forum</title>
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

module.exports = router;
