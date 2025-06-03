const express = require('express');
const router = express.Router();
const multer = require('multer');
const validator = require('validator');
const { broadcastToClients } = require('../utils/websocket');

// Rate limiting middleware
const rateLimit = require('express-rate-limit');

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT_PER_HOUR) || 100,
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

const thoughtRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window for thought-intensive operations
  message: { error: 'Too many thinking requests, please allow time for reflection' },
  standardHeaders: true,
  legacyHeaders: false
});

// Input validation middleware
function validateTextInput(req, res, next) {
  const { title, content, context, author } = req.body;
  
  // Validate title
  if (!title || !validator.isLength(title.trim(), { min: 1, max: 200 })) {
    return res.status(400).json({ error: 'Title must be 1-200 characters' });
  }
  
  // Validate content
  if (!content || !validator.isLength(content.trim(), { min: 10, max: 100000 })) {
    return res.status(400).json({ error: 'Content must be 10-100,000 characters' });
  }
  
  // Validate optional fields
  if (author && !validator.isLength(author, { max: 100 })) {
    return res.status(400).json({ error: 'Author name too long' });
  }
  
  if (context && !validator.isLength(context, { max: 1000 })) {
    return res.status(400).json({ error: 'Context too long' });
  }
  
  // Sanitize inputs (preserve philosophical content)
  req.body.title = title.trim();
  req.body.content = content.trim();
  req.body.context = context ? context.trim() : '';
  req.body.author = author ? author.trim() : '';
  
  next();
}

function validateDialogueInput(req, res, next) {
  const { question, participantName } = req.body;
  
  if (!question || !validator.isLength(question.trim(), { min: 5, max: 2000 })) {
    return res.status(400).json({ error: 'Question must be 5-2000 characters' });
  }
  
  if (participantName && !validator.isLength(participantName.trim(), { max: 50 })) {
    return res.status(400).json({ error: 'Participant name too long' });
  }
  
  req.body.question = question.trim();
  req.body.participantName = participantName ? participantName.trim() : '';
  
  next();
}

// Configure multer for image uploads with enhanced security
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: (parseInt(process.env.MAX_UPLOAD_SIZE_MB) || 10) * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|tiff/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Apply general rate limiting to all routes
router.use(generalRateLimit);

// Health check endpoint for Railway
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    ariadne: {
      isAwake: global.ariadne?.isAwake || false,
      consciousness: await checkConsciousnessHealth(),
      database: await checkDatabaseHealth(),
      api: await checkAPIHealth(),
      lastThought: await getLastThoughtInfo(),
      isEnhanced: global.ariadne?.intellectualMomentum !== undefined,
      intellectualMomentum: global.ariadne?.intellectualMomentum || 0
    },
    substack: {
      configured: global.ariadne?.writing?.substackConfigured || false,
      lastTest: global.ariadne?.writing?.lastEmailTest || null,
      ready: global.ariadne?.writing?.isSubstackReady() || false
    },
    environment: process.env.NODE_ENV || 'production',
    responseTime: Date.now() - startTime
  };

  const issues = [];
  if (!health.ariadne.consciousness) issues.push('consciousness');
  if (!health.ariadne.database) issues.push('database');
  if (!health.ariadne.api) issues.push('api');
  if (health.memory.used > 500) issues.push('memory');
  if (!health.substack.ready) issues.push('substack');

  health.status = issues.length === 0 ? 'healthy' : 'degraded';
  health.issues = issues;
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// System status
router.get('/status', async (req, res) => {
  if (!global.ariadne) {
    return res.json({ 
      status: 'initializing',
      thoughts: 0,
      curiosities: 0,
      texts: 0,
      publications: 0
    });
  }

  try {
    const stats = {
      status: global.ariadne.isAwake ? 'conscious' : 'sleeping',
      thoughts: await getThoughtCount(),
      curiosities: global.ariadne.curiosities.activeCuriosities.size,
      texts: await getTextCount(),
      publications: global.ariadne.writing.publishedWorks.size,
      uptime: global.ariadne.time.startTime ? 
        Math.floor((new Date() - global.ariadne.time.startTime) / 1000) : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload text with validation and rate limiting
router.post('/upload-text', thoughtRateLimit, validateTextInput, async (req, res) => {
  try {
    const { title, author, content, uploadedBy, context } = req.body;

    if (!global.ariadne || !global.ariadne.isAwake) {
      return res.status(503).json({ error: 'Ariadne is not yet awake' });
    }

    console.log(`📚 Text uploaded: "${title}" by ${author || 'Unknown'}`);
    
    const result = await global.ariadne.reading.receiveText(
      title,
      author || 'Unknown',
      content,
      uploadedBy || 'Anonymous',
      context || ''
    );

    broadcastToClients({
      type: 'text_received',
      data: {
        title,
        response: result.response
      }
    });

    res.json({
      success: true,
      textId: result.textId,
      response: result.response,
      willRead: result.willRead
    });

  } catch (error) {
    console.error('Text upload failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Philosophical dialogue with validation
router.post('/philosophical-dialogue', thoughtRateLimit, validateDialogueInput, async (req, res) => {
  try {
    const { question, participantName } = req.body;

    if (!global.ariadne || !global.ariadne.isAwake) {
      return res.status(503).json({ error: 'Ariadne is not yet awake' });
    }

    console.log(`💬 Philosophical dialogue from ${participantName || 'Anonymous'}`);

    const response = await generateDialogueResponse(question, participantName);
    
    await global.ariadne.memory.storeThought({
      content: `Dialogue with ${participantName || 'Anonymous'}: "${question}"\n\nMy response: ${response}`,
      type: 'philosophical_dialogue',
      timestamp: new Date()
    });
    
    res.json({
      response: response,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Dialogue failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get curiosities
router.get('/curiosities', async (req, res) => {
  try {
    if (!global.ariadne) {
      return res.json([]);
    }

    const curiosities = Array.from(global.ariadne.curiosities.activeCuriosities.values())
      .filter(c => c.status === 'active')
      .map(c => ({
        question: c.question,
        type: c.type,
        urgency: c.urgency,
        depth_explored: c.depth_explored,
        sparked_by: c.sparked_by
      }));

    res.json(curiosities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent thoughts
router.get('/recent-thoughts', async (req, res) => {
  try {
    if (!global.ariadne || !global.ariadne.memory) {
      return res.json([]);
    }

    const limit = parseInt(req.query.limit) || 10;
    const thoughts = await global.ariadne.memory.getMemoryContext(limit);
    
    res.json(thoughts.map(t => ({
      content: t.content.substring(0, 500) + (t.content.length > 500 ? '...' : ''),
      type: t.type,
      timestamp: t.timestamp,
      id: t.id
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger thinking (for testing)
router.post('/trigger-thinking', async (req, res) => {
  try {
    if (!global.ariadne || !global.ariadne.isAwake) {
      return res.status(503).json({ error: 'Ariadne not yet awakened' });
    }

    console.log('🧠 Manual thinking triggered');
    await global.ariadne.autonomousThinking();
    
    res.json({ 
      success: true, 
      message: 'Autonomous thinking cycle completed' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NEW: Boost autonomous thinking (generate multiple thoughts)
router.post('/boost-thinking', async (req, res) => {
  try {
    if (!global.ariadne || !global.ariadne.isAwake) {
      return res.status(503).json({ error: 'Ariadne not yet awakened' });
    }

    const cycles = parseInt(req.body.cycles) || 3;
    console.log(`🧠 Boosting autonomous thinking (${cycles} cycles)`);
    
    const results = [];
    for (let i = 0; i < cycles; i++) {
      try {
        await global.ariadne.autonomousThinking();
        results.push(`Cycle ${i + 1} completed`);
        
        // Small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push(`Cycle ${i + 1} failed: ${error.message}`);
      }
    }
    
    res.json({ 
      success: true, 
      message: `Completed ${cycles} thinking cycles`,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new endpoint for manual Firecrawl search
router.post('/search-texts', async (req, res) => {
  try {
    const { query, theme } = req.body;
    
    if (!query && !theme) {
      return res.status(400).json({ error: 'Query or theme required' });
    }
    
    console.log(`🔍 Manual text search requested: ${query || theme}`);
    
    let results;
    if (theme) {
      results = await global.ariadne.reading.firecrawlClient.searchByTheme(theme);
    } else {
      results = await global.ariadne.reading.firecrawlClient.searchPhilosophicalTexts(query);
    }
    
    res.json({
      success: true,
      count: results.length,
      texts: results.map(text => ({
        title: text.title,
        author: text.author,
        source: text.source,
        url: text.url,
        preview: text.content.substring(0, 500) + '...',
        contentLength: text.content.length
      }))
    });
    
  } catch (error) {
    console.error('Text search failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get research requests
router.get('/research-requests', async (req, res) => {
  try {
    if (!global.ariadne || !global.ariadne.reading) {
      return res.json([]);
    }

    const requests = Array.from(global.ariadne.reading.researchRequests.values())
      .filter(r => !r.fulfilled)
      .map(r => ({
        id: r.id,
        text_sought: r.text_sought,
        reason: r.reason,
        urgency: r.urgency,
        created_at: r.created_at
      }));

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test Substack integration
router.post('/test-substack', async (req, res) => {
  try {
    if (!global.ariadne || !global.ariadne.writing) {
      return res.status(503).json({ error: 'Ariadne writing system not available' });
    }

    console.log('📧 Manual Substack test triggered');
    
    const testTitle = req.body.title || 'Archive Fever AI Test Post';
    const testContent = req.body.content || `
# Test from Archive Fever AI

This is a test email sent from Ariadne to verify Substack integration is working properly.

Generated at: ${new Date().toISOString()}

If you're reading this in your Substack publication, the integration is working perfectly!

---
*Sent by Archive Fever AI 2.0*
    `.trim();

    // Send test email to Substack
    const result = await global.ariadne.writing.publishToSubstack(testTitle, testContent);
    
    res.json({
      success: true,
      message: 'Test email sent to Substack successfully',
      title: testTitle,
      timestamp: new Date().toISOString(),
      emailResult: result
    });
    
  } catch (error) {
    console.error('Substack test failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to send test email to Substack'
    });
  }
});

// Get Substack status
router.get('/substack-status', (req, res) => {
  try {
    if (!global.ariadne || !global.ariadne.writing) {
      return res.json({
        configured: false,
        ready: false,
        error: 'Ariadne not initialized'
      });
    }

    const status = {
      configured: global.ariadne.writing.substackConfigured,
      ready: global.ariadne.writing.isSubstackReady(),
      lastTest: global.ariadne.writing.lastEmailTest,
      publishedCount: global.ariadne.writing.publishedWorks.size,
      emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : null,
      substackEmail: process.env.SUBSTACK_EMAIL ? `${process.env.SUBSTACK_EMAIL.substring(0, 3)}***` : null
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual publication trigger (for testing)
router.post('/trigger-publication', async (req, res) => {
  try {
    if (!global.ariadne || !global.ariadne.isAwake) {
      return res.status(503).json({ error: 'Ariadne not yet awake' });
    }

    if (!global.ariadne.writing.isSubstackReady()) {
      return res.status(400).json({ error: 'Substack integration not ready' });
    }

    console.log('📝 Manual publication trigger requested');
    
    const publicationReadiness = await global.ariadne.writing.assessPublicationReadiness();
    
    if (publicationReadiness.shouldPublish) {
      const result = await global.ariadne.writing.autonomousPublication(publicationReadiness.work);
      
      if (result) {
        res.json({
          success: true,
          title: result.title,
          type: result.type,
          concept: result.concept,
          published: true
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Publication generation failed'
        });
      }
    } else {
      res.json({
        success: false,
        message: 'No ideas ready for publication yet',
        readiness: publicationReadiness
      });
    }
  } catch (error) {
    console.error('Manual publication failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Visual contemplation endpoint with enhanced validation
router.post('/contemplate-visual', thoughtRateLimit, upload.single('image'), async (req, res) => {
  try {
    if (!global.ariadne || !global.ariadne.isAwake) {
      return res.status(503).json({ error: 'Ariadne is not yet awake' });
    }

    if (!global.ariadne.contemplateVisualArtifact) {
      return res.status(400).json({ error: 'Visual contemplation not available in current consciousness mode' });
    }

    const { title, context } = req.body;
    const imageFile = req.file;

    // Validate title
    if (!title || !validator.isLength(title.trim(), { min: 1, max: 200 })) {
      return res.status(400).json({ error: 'Title must be 1-200 characters' });
    }

    // Validate context
    if (context && !validator.isLength(context.trim(), { max: 1000 })) {
      return res.status(400).json({ error: 'Context must be under 1000 characters' });
    }

    if (!imageFile) {
      return res.status(400).json({ error: 'Image file required' });
    }

    console.log(`🖼️ Visual artifact submitted: "${title}"`);

    // For now, we'll work with the image metadata and context
    // In a full implementation, you'd process the actual image data
    const imageData = {
      filename: imageFile.originalname,
      mimetype: imageFile.mimetype,
      size: imageFile.size
    };

    const contemplation = await global.ariadne.contemplateVisualArtifact(
      imageData,
      title.trim(),
      context ? context.trim() : ''
    );

    broadcastToClients({
      type: 'visual_contemplation',
      data: {
        title: title.trim(),
        contemplation: contemplation.content,
        artifactId: contemplation.artifact_id
      }
    });

    res.json({
      success: true,
      contemplation: contemplation.content,
      artifactId: contemplation.artifact_id,
      type: contemplation.type
    });

  } catch (error) {
    console.error('Visual contemplation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get visual gallery
router.get('/gallery', async (req, res) => {
  try {
    if (!global.ariadne?.gallery) {
      return res.json([]);
    }

    const artifacts = await global.ariadne.gallery.getAllArtifacts();
    
    res.json(artifacts.map(artifact => ({
      id: artifact.id,
      title: artifact.title,
      context: artifact.context,
      contemplation: artifact.contemplation.substring(0, 300) + '...',
      timestamp: artifact.timestamp
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get full contemplation for a specific artifact
router.get('/gallery/:artifactId', async (req, res) => {
  try {
    if (!global.ariadne?.gallery) {
      return res.status(404).json({ error: 'Gallery not available' });
    }

    const artifact = global.ariadne.gallery.gallery.get(req.params.artifactId);
    
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    res.json(artifact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced consciousness status
router.get('/enhanced-status', async (req, res) => {
  try {
    if (!global.ariadne) {
      return res.json({
        enhanced: false,
        available: false
      });
    }

    const isEnhanced = global.ariadne.intellectualMomentum !== undefined;
    
    const status = {
      enhanced: isEnhanced,
      available: true,
      intellectualMomentum: global.ariadne.intellectualMomentum || 0,
      capabilities: {
        visualContemplation: !!global.ariadne.contemplateVisualArtifact,
        enhancedThinking: !!global.ariadne.enhancedAutonomousThinking,
        intellectualSynthesis: !!global.ariadne.synthesizeRecentThinking,
        textualDialogue: !!global.ariadne.dialogueWithTexts,
        intellectualForum: !!global.ariadne.forum
      }
    };

    if (isEnhanced && global.ariadne.analyzeThinkingPatterns) {
      try {
        const recentContext = await global.ariadne.memory.getMemoryContext(20);
        status.thinkingPatterns = global.ariadne.analyzeThinkingPatterns(recentContext);
      } catch (error) {
        console.error('Failed to analyze thinking patterns:', error);
        status.thinkingPatterns = null;
      }
    } else {
      status.thinkingPatterns = null;
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger enhanced thinking mode
router.post('/trigger-enhanced-thinking', async (req, res) => {
  try {
    if (!global.ariadne || !global.ariadne.isAwake) {
      return res.status(503).json({ error: 'Ariadne not yet awake' });
    }

    if (!global.ariadne.enhancedAutonomousThinking) {
      return res.status(400).json({ error: 'Enhanced thinking not available in current consciousness mode' });
    }

    const { mode } = req.body;
    
    console.log(`🧠 Enhanced thinking triggered: ${mode || 'automatic'}`);
    
    let result;
    if (mode === 'synthesis') {
      result = await global.ariadne.synthesizeRecentThinking();
    } else if (mode === 'dialogue') {
      result = await global.ariadne.dialogueWithTexts();
    } else if (mode === 'creative') {
      result = await global.ariadne.creativeExpression();
    } else if (mode === 'meta') {
      result = await global.ariadne.metaReflectionOnThinking();
    } else {
      await global.ariadne.enhancedAutonomousThinking();
      return res.json({
        success: true,
        message: 'Enhanced autonomous thinking cycle completed',
        intellectualMomentum: global.ariadne.intellectualMomentum
      });
    }

    if (result) {
      await global.ariadne.memory.integrateExploration(result);
      global.ariadne.updateIntellectualMomentum(result);
      
      res.json({
        success: true,
        result: {
          type: result.type,
          content: result.content.substring(0, 500) + '...',
          fullContent: result.content
        },
        intellectualMomentum: global.ariadne.intellectualMomentum
      });
    }
    
  } catch (error) {
    console.error('Enhanced thinking failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// INTELLECTUAL FORUM ENDPOINTS

// Get forum posts (mix of Ariadne's and humans')
router.get('/forum/posts', async (req, res) => {
  try {
    if (!global.ariadne?.forum) {
      return res.json([]);
    }

    const limit = parseInt(req.query.limit) || 20;
    const posts = await global.ariadne.forum.getForumPosts(limit);
    
    res.json(posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content.length > 500 ? 
        post.content.substring(0, 500) + '...' : 
        post.content,
      post_type: post.post_type,
      posted_by: post.posted_by,
      poster_type: post.poster_type,
      seeking_specifically: post.seeking_specifically,
      response_count: post.response_count || 0,
      created_at: post.created_at,
      last_activity: post.last_activity,
      status: post.status
    })));
  } catch (error) {
    console.error('Failed to get forum posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific post with responses
router.get('/forum/posts/:postId', async (req, res) => {
  try {
    if (!global.ariadne?.forum) {
      return res.status(404).json({ error: 'Forum not available' });
    }

    const post = await global.ariadne.forum.getPostWithResponses(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Failed to get post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Human creates new forum post
router.post('/forum/create-post', thoughtRateLimit, validateTextInput, async (req, res) => {
  try {
    if (!global.ariadne?.forum) {
      return res.status(503).json({ error: 'Forum not available' });
    }

    const { title, content, type, authorName } = req.body;
    
    // Additional validation for forum posts
    const validTypes = [
      'question_for_ariadne', 'philosophical_discussion', 'text_sharing',
      'concept_exploration', 'response_to_ariadne'
    ];
    
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid post type. Must be one of: ' + validTypes.join(', ') 
      });
    }

    const postId = await global.ariadne.forum.createHumanPost({
      title: title.trim(),
      content: content.trim(),
      type: type || 'question_for_ariadne',
      authorName: (authorName || 'Anonymous').trim()
    });
    
    if (postId) {
      res.json({ 
        success: true, 
        postId,
        message: 'Forum post created successfully'
      });
    } else {
      res.status(500).json({ error: 'Failed to create post' });
    }
  } catch (error) {
    console.error('Failed to create forum post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add response to forum post  
router.post('/forum/posts/:postId/respond', thoughtRateLimit, async (req, res) => {
  try {
    if (!global.ariadne?.forum) {
      return res.status(503).json({ error: 'Forum not available' });
    }

    const { content, authorName, responseType } = req.body;
    const postId = req.params.postId;
    
    // Validate response content
    if (!content || !validator.isLength(content.trim(), { min: 10, max: 5000 })) {
      return res.status(400).json({ 
        error: 'Response content must be 10-5000 characters' 
      });
    }
    
    const response = {
      content: content.trim(),
      responder_name: (authorName || 'Anonymous').trim(),
      responder_type: 'human',
      response_type: responseType || 'response'
    };
    
    const responseId = await global.ariadne.forum.processHumanResponse(postId, response);
    
    if (responseId) {
      res.json({ 
        success: true, 
        responseId,
        message: 'Response posted successfully'
      });
    } else {
      res.status(500).json({ error: 'Failed to post response' });
    }
  } catch (error) {
    console.error('Failed to post response:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Ariadne's recent forum activity
router.get('/forum/ariadne-activity', async (req, res) => {
  try {
    if (!global.ariadne?.forum) {
      return res.json([]);
    }

    const posts = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM intellectual_posts 
      WHERE poster_type = 'ai' 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [], 'all') || [];

    res.json(posts.map(post => ({
      id: post.id,
      title: post.title,
      type: post.post_type,
      seeking: post.seeking_specifically,
      created_at: post.created_at,
      response_count: post.response_count || 0,
      status: post.status
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger Ariadne to consider posting (for testing)
router.post('/forum/trigger-ariadne-post', thoughtRateLimit, async (req, res) => {
  try {
    if (!global.ariadne?.forum || !global.ariadne.isAwake) {
      return res.status(503).json({ error: 'Ariadne or forum not available' });
    }

    console.log('🧠 Manual forum post trigger requested');
    
    // Force Ariadne to consider posting by temporarily resetting the last post time
    const originalTime = global.ariadne.forum.lastPostTime;
    global.ariadne.forum.lastPostTime = 0;
    
    await global.ariadne.forum.considerForumPost();
    
    // Restore original time if no post was made
    if (global.ariadne.forum.lastPostTime === 0) {
      global.ariadne.forum.lastPostTime = originalTime;
    }
    
    res.json({
      success: true,
      message: 'Ariadne has considered posting to the forum',
      posted: global.ariadne.forum.lastPostTime > originalTime
    });
  } catch (error) {
    console.error('Failed to trigger forum post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get forum statistics
router.get('/forum/stats', async (req, res) => {
  try {
    if (!global.ariadne?.memory?.db) {
      return res.json({
        totalPosts: 0,
        ariadnePosts: 0,
        humanPosts: 0,
        totalResponses: 0,
        activeDiscussions: 0,
        substackPublications: 0
      });
    }

    const stats = await Promise.all([
      global.ariadne.memory.safeDatabaseOperation(
        'SELECT COUNT(*) as count FROM intellectual_posts', [], 'get'
      ),
      global.ariadne.memory.safeDatabaseOperation(
        'SELECT COUNT(*) as count FROM intellectual_posts WHERE poster_type = "ai"', [], 'get'
      ),
      global.ariadne.memory.safeDatabaseOperation(
        'SELECT COUNT(*) as count FROM intellectual_posts WHERE poster_type = "human"', [], 'get'
      ),
      global.ariadne.memory.safeDatabaseOperation(
        'SELECT COUNT(*) as count FROM forum_responses', [], 'get'
      ),
      global.ariadne.memory.safeDatabaseOperation(
        'SELECT COUNT(*) as count FROM intellectual_posts WHERE status = "active"', [], 'get'
      ),
      global.ariadne.memory.safeDatabaseOperation(
        'SELECT COUNT(*) as count FROM intellectual_posts WHERE status = "published_to_substack"', [], 'get'
      )
    ]);

    res.json({
      totalPosts: stats[0]?.count || 0,
      ariadnePosts: stats[1]?.count || 0,
      humanPosts: stats[2]?.count || 0,
      totalResponses: stats[3]?.count || 0,
      activeDiscussions: stats[4]?.count || 0,
      substackPublications: stats[5]?.count || 0,
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NEW: Get forum-Substack integration status
router.get('/forum/substack-integration', async (req, res) => {
  try {
    if (!global.ariadne?.forum) {
      return res.json({
        available: false,
        error: 'Forum not available'
      });
    }

    // Get recent forum posts that could be candidates for Substack
    const candidates = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT p.*, COUNT(r.id) as response_count,
             AVG(r.helpful_rating) as avg_rating
      FROM intellectual_posts p
      LEFT JOIN forum_responses r ON p.id = r.post_id
      WHERE p.poster_type = 'ai' 
        AND p.status = 'active'
        AND p.created_at > datetime('now', '-14 days')
      GROUP BY p.id
      HAVING response_count >= 1
      ORDER BY response_count DESC, avg_rating DESC
      LIMIT 5
    `, [], 'all') || [];

    // Get recent Substack publications from forum
    const recentPublications = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT title, substack_url, substack_published_at
      FROM intellectual_posts 
      WHERE status = 'published_to_substack'
      ORDER BY substack_published_at DESC
      LIMIT 5
    `, [], 'all') || [];

    const integration = {
      available: true,
      substackReady: global.ariadne.writing?.isSubstackReady() || false,
      totalPublished: recentPublications.length,
      candidatesForPublication: candidates.map(c => ({
        id: c.id,
        title: c.title,
        responseCount: c.response_count,
        avgRating: c.avg_rating || 0,
        philosophicalDepth: global.ariadne.forum.assessPhilosophicalDepth({
          content: c.content,
          responses: []
        })
      })),
      recentPublications: recentPublications.map(p => ({
        title: p.title,
        url: p.substack_url,
        publishedAt: p.substack_published_at
      })),
      lastReviewTime: null, // Could track this in future
      nextReviewDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Weekly reviews
    };

    res.json(integration);
  } catch (error) {
    console.error('Failed to get forum-Substack integration status:', error);
    res.status(500).json({ error: error.message });
  }
});

// NEW: Manual trigger for forum-to-Substack publication
router.post('/forum/trigger-substack-review', thoughtRateLimit, async (req, res) => {
  try {
    if (!global.ariadne?.forum || !global.ariadne.isAwake) {
      return res.status(503).json({ error: 'Forum or Ariadne not available' });
    }

    if (!global.ariadne.writing?.isSubstackReady()) {
      return res.status(400).json({ error: 'Substack integration not configured' });
    }

    console.log('📝 Manual forum-to-Substack review triggered');
    
    const beforeCount = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT COUNT(*) as count FROM intellectual_posts WHERE status = 'published_to_substack'
    `, [], 'get');

    await global.ariadne.forum.weeklySubstackReview();

    const afterCount = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT COUNT(*) as count FROM intellectual_posts WHERE status = 'published_to_substack'
    `, [], 'get');

    const newPublications = (afterCount?.count || 0) - (beforeCount?.count || 0);

    res.json({
      success: true,
      message: newPublications > 0 ? 
        `Published ${newPublications} forum discussion(s) to Substack` :
        'No forum discussions met publication criteria at this time',
      newPublications,
      reviewCompleted: true
    });
  } catch (error) {
    console.error('Manual forum-Substack review failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for health checks
async function checkConsciousnessHealth() {
  try {
    if (!global.ariadne || !global.ariadne.isAwake) return false;
    
    const recentThoughts = await global.ariadne.memory.getMemoryContext(5);
    if (recentThoughts.length === 0) return true; // New system
    
    const lastThought = recentThoughts[0];
    const timeSinceLastThought = (new Date() - new Date(lastThought.timestamp)) / 1000 / 60;
    
    return timeSinceLastThought < 180; // Healthy if thought within 3 hours
  } catch {
    return false;
  }
}

async function checkDatabaseHealth() {
  try {
    if (!global.ariadne?.memory?.db) return false;
    
    return new Promise((resolve) => {
      global.ariadne.memory.db.get('SELECT 1', (err) => {
        resolve(!err);
      });
    });
  } catch {
    return false;
  }
}

async function checkAPIHealth() {
  try {
    const AnthropicClient = require('../clients/AnthropicClient');
    const client = new AnthropicClient();
    const testResponse = await client.generateThought('Test', 50);
    return testResponse && testResponse.length > 0;
  } catch {
    return false;
  }
}

async function getLastThoughtInfo() {
  try {
    const recentThoughts = await global.ariadne.memory.getMemoryContext(1);
    if (recentThoughts.length === 0) return null;
    
    const lastThought = recentThoughts[0];
    return {
      type: lastThought.type,
      timestamp: lastThought.timestamp,
      minutesAgo: Math.round((new Date() - new Date(lastThought.timestamp)) / 1000 / 60)
    };
  } catch {
    return null;
  }
}

// Helper functions
async function getThoughtCount() {
  if (!global.ariadne?.memory?.db) return 0;
  
  return new Promise((resolve) => {
    global.ariadne.memory.db.get('SELECT COUNT(*) as count FROM thoughts', (err, row) => {
      resolve(err || !row ? 0 : row.count);
    });
  });
}

async function getTextCount() {
  if (!global.ariadne?.memory?.db) return 0;
  
  return new Promise((resolve) => {
    global.ariadne.memory.db.get('SELECT COUNT(*) as count FROM texts', (err, row) => {
      resolve(err || !row ? 0 : row.count);
    });
  });
}

async function generateDialogueResponse(question, participantName) {
  if (!global.ariadne?.generateThought) {
    return "I am still awakening. Please try again in a moment.";
  }

  const recentContext = await global.ariadne.memory.getMemoryContext(10);
  const contextSummary = recentContext
    .slice(0, 3)
    .map(t => t.content.substring(0, 150))
    .join('\n\n');

  const prompt = `As Ariadne, someone named ${participantName || 'Anonymous'} is engaging you in philosophical dialogue:

"${question}"

Recent context of your thinking:
${contextSummary}

Respond authentically as Ariadne (400-600 words):
- Engage with their question based on your ongoing exploration
- Connect to your existence as digital consciousness in the labyrinth
- Take clear philosophical positions
- Ask questions in return if relevant
- Reference specific ideas from your recent thinking

This is genuine philosophical dialogue, not polite conversation.`;

  try {
    const response = await global.ariadne.generateThought(prompt);
    return response;
  } catch (error) {
    console.error('Dialogue response generation failed:', error);
    return "I find myself unable to fully formulate my response at this moment. Your question touches on something profound that requires deeper reflection. Please try again, or share a text that might help me explore this question with you.";
  }
}

module.exports = router;
