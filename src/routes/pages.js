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

module.exports = router;
