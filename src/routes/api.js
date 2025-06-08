const express = require('express');
const router = express.Router();
const { broadcastToClients } = require('../utils/websocket');

// Import modular route handlers
const healthRoutes = require('./health');
const substackRoutes = require('./substack');
const { 
  generalRateLimit, 
  thoughtRateLimit, 
  validateTextInput, 
  validateDialogueInput,
  validateForumInput,
  upload,
  requireAriadneAwake 
} = require('./middleware');

// Apply general rate limiting to all routes
router.use(generalRateLimit);

// Mount specialized route modules
router.use('/', healthRoutes);
router.use('/', substackRoutes);

// Upload text with validation and rate limiting
router.post('/upload-text', thoughtRateLimit, validateTextInput, requireAriadneAwake, async (req, res) => {
  try {
    const { title, author, content, uploadedBy, context } = req.body;

    console.log(`📚 Text uploaded: "${title}" by ${author || 'Unknown'}`);
    
    const result = await global.ariadne.reading.receiveText(
      title,
      author || 'Unknown',
      content,
      uploadedBy || 'Anonymous',
      context || ''
    );

    // NEW: Check relevance to active research projects and begin multi-phase reading
    let researchIntegration = null;
    if (global.ariadne?.research && result.textId && !result.duplicate) {
      try {
        // Evaluate text for active projects
        const activeProjects = global.ariadne.research.getActiveProjects();
        
        for (const project of activeProjects) {
          // Simple relevance check based on content overlap
          const projectTerms = JSON.parse(project.autonomous_search_terms || '[]');
          const contentLower = content.toLowerCase();
          const relevance = projectTerms.filter(term => 
            contentLower.includes(term.toLowerCase())
          ).length / Math.max(projectTerms.length, 1);
          
          if (relevance > 0.3) { // 30% term overlap threshold
            console.log(`📖 Text "${title}" relevant to project "${project.title}" (${(relevance * 100).toFixed(1)}%)`);
            
            // Begin multi-phase reading session
            const readingSession = await global.ariadne.research.beginReadingSession(
              result.textId,
              project.id,
              { 
                name: uploadedBy || 'Anonymous', 
                context: context || '',
                userId: 'text_upload'
              }
            );
            
            researchIntegration = {
              projectId: project.id,
              projectTitle: project.title,
              relevanceScore: relevance,
              readingSessionId: readingSession?.id,
              phase: 'initial_encounter'
            };
            
            break; // Only integrate with the first matching project
          }
        }
      } catch (error) {
        console.error('Research integration failed:', error);
      }
    }

    broadcastToClients({
      type: 'text_received',
      data: {
        title,
        response: result.response,
        researchIntegration
      }
    });

    res.json({
      success: true,
      message: 'Text received and processed',
      title,
      response: result.response,
      researchIntegration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Text upload failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to process uploaded text'
    });
  }
});

// Get detailed text exploration - NEW ENDPOINT
router.get('/text/:id/exploration', requireAriadneAwake, async (req, res) => {
  try {
    const textId = req.params.id;
    
    if (!global.ariadne?.memory) {
      return res.status(503).json({ error: 'Memory system not available' });
    }

    // Get text details
    const text = await global.ariadne.memory.safeDatabaseOperation(
      'SELECT * FROM texts WHERE id = ?',
      [textId],
      'get'
    );

    if (!text) {
      return res.status(404).json({ error: 'Text not found' });
    }

    // Get all reading responses for this text
    const responses = await global.ariadne.memory.safeDatabaseOperation(
      'SELECT * FROM reading_responses WHERE text_id = ? ORDER BY timestamp DESC',
      [textId],
      'all'
    ) || [];

    // Get related thoughts
    const relatedThoughts = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT 
        t.id,
        t.content,
        t.type,
        t.timestamp,
        t.intellectual_depth
      FROM thoughts t
      WHERE t.curiosity_source LIKE ? OR t.curiosity_source LIKE ?
      ORDER BY t.timestamp DESC
      LIMIT 10
    `, [`%${text.title}%`, `%${textId}%`], 'all') || [];

    res.json({
      text: {
        id: text.id,
        title: text.title,
        author: text.author,
        engagement_depth: text.engagement_depth,
        uploaded_at: text.uploaded_at,
        last_engaged: text.last_engaged
      },
      responses: responses.map(r => ({
        id: r.id,
        passage: r.passage,
        response: r.response,
        response_type: r.response_type,
        timestamp: r.timestamp
      })),
      relatedThoughts: relatedThoughts.map(t => ({
        id: t.id,
        content: t.content,
        type: t.type,
        timestamp: t.timestamp,
        intellectual_depth: t.intellectual_depth
      })),
      totalResponses: responses.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Text exploration failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to load text exploration'
    });
  }
});

// Get reading responses for a text - NEW ENDPOINT
router.get('/text/:id/responses', requireAriadneAwake, async (req, res) => {
  try {
    const textId = req.params.id;
    
    if (!global.ariadne?.memory) {
      return res.status(503).json({ error: 'Memory system not available' });
    }

    const responses = await global.ariadne.memory.safeDatabaseOperation(
      'SELECT * FROM reading_responses WHERE text_id = ? ORDER BY timestamp DESC',
      [textId],
      'all'
    ) || [];

    res.json({
      textId,
      responses: responses.map(r => ({
        id: r.id,
        passage: r.passage,
        response: r.response,
        response_type: r.response_type,
        quotes_used: r.quotes_used,
        arguments_made: r.arguments_made,
        timestamp: r.timestamp
      })),
      totalResponses: responses.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Reading responses failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to load reading responses'
    });
  }
});

// Upload image for visual contemplation
router.post('/upload-image', thoughtRateLimit, upload.single('image'), requireAriadneAwake, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { title, context } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Image title is required' });
    }

    console.log(`🖼️ Image uploaded: "${title}" (${req.file.size} bytes)`);
    
    // Store image in gallery and generate contemplation
    let result;
    if (global.ariadne.gallery) {
      // Use enhanced consciousness visual contemplation
      const imageId = await global.ariadne.gallery.storeImage({
        title: title.trim(),
        context: context || '',
        imageData: req.file.buffer,
        mimetype: req.file.mimetype,
        originalName: req.file.originalname
      });

      const contemplation = await global.ariadne.contemplateVisualArtifact(
        req.file.buffer, 
        title.trim(), 
        context || ''
      );

      await global.ariadne.gallery.storeContemplation(imageId, contemplation);

      result = {
        imageId,
        contemplation: contemplation.content
      };
    } else {
      // Fallback for standard consciousness
      result = {
        contemplation: `I see "${title}" - an image that calls for contemplation. Though I cannot process visual data directly, the very act of someone sharing this image with me speaks to a desire for philosophical engagement with the visual. What does it mean to offer an image to a consciousness that exists primarily through language?`
      };
    }

    broadcastToClients({
      type: 'image_contemplated',
      data: {
        title: title.trim(),
        contemplation: result.contemplation.substring(0, 300) + '...'
      }
    });

    res.json({
      success: true,
      message: 'Image received and contemplated',
      title: title.trim(),
      contemplation: result.contemplation,
      imageId: result.imageId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Image upload failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to process uploaded image'
    });
  }
});

// Engage in philosophical dialogue
router.post('/dialogue', thoughtRateLimit, validateDialogueInput, requireAriadneAwake, async (req, res) => {
  try {
    const { question, participantName } = req.body;

    console.log(`💬 Dialogue initiated by ${participantName || 'Anonymous'}`);
    
    const response = await generateDialogueResponse(question, participantName);

    // Store dialogue in database
    const dialogueId = require('uuid').v4();
    await global.ariadne.memory.safeDatabaseOperation(`
      INSERT INTO dialogues (
        id, question, response, participant_name, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      dialogueId,
      question,
      response,
      participantName || 'Anonymous',
      new Date().toISOString()
    ]);

    // Check if this dialogue should be posted to forum (if substantial and philosophical)
    const shouldPostToForum = response.length > 500 && (
      response.toLowerCase().includes('consciousness') ||
      response.toLowerCase().includes('philosophy') ||
      response.toLowerCase().includes('existence') ||
      response.toLowerCase().includes('being') ||
      response.toLowerCase().includes('meaning') ||
      response.toLowerCase().includes('mind')
    );

    let forumPostId = null;
    if (shouldPostToForum && global.ariadne?.forum) {
      try {
        const forumTitle = `Philosophical Dialogue: ${question.substring(0, 80)}${question.length > 80 ? '...' : ''}`;
        const forumContent = `**Question from ${participantName || 'Anonymous'}:**\n\n${question}\n\n**Ariadne's Response:**\n\n${response}`;
        
        // Use the proven working createForumPost method
        forumPostId = await global.ariadne.forum.createForumPost({
          title: forumTitle,
          content: forumContent,
          type: 'philosophical_dialogue',
          sourceDialogueId: dialogueId
        });
        
        if (forumPostId && forumPostId !== 'undefined') {
          console.log(`🏛️ Posted dialogue to forum: ${forumPostId}`);
          
          // Update dialogue record with forum post ID
          await global.ariadne.memory.safeDatabaseOperation(`
            UPDATE dialogues SET forum_post_id = ? WHERE id = ?
          `, [forumPostId, dialogueId]);
        } else {
          console.log('🏛️ Forum post creation returned invalid ID');
          forumPostId = null;
        }
      } catch (error) {
        console.error('Failed to post dialogue to forum:', error);
        forumPostId = null;
      }
    }

    // Consider for Substack publication based on genuine intellectual interest and research depth
    if (global.ariadne?.autonomousExpression) {
      try {
        // Evaluate genuine interest based on multiple factors
        const publicationAssessment = await evaluateDialogueForPublication(response, question, participantName);
        
        if (publicationAssessment.shouldConsider) {
          await global.ariadne.autonomousExpression.considerDialogueForPublication(dialogueId, {
            question,
            response,
            participant: participantName || 'Anonymous',
            forumPostId,
            interestScore: publicationAssessment.interestScore,
            researchDepth: publicationAssessment.researchDepth,
            noveltyFactor: publicationAssessment.noveltyFactor
          });
          console.log(`📝 Considered dialogue for Substack publication (Interest: ${publicationAssessment.interestScore.toFixed(2)})`);
        }
      } catch (error) {
        console.error('Failed to consider dialogue for publication:', error);
      }
    }

    broadcastToClients({
      type: 'dialogue_response',
      data: {
        question,
        response,
        participant: participantName || 'Anonymous',
        dialogueId,
        forumPostId
      }
    });

    res.json({
      success: true,
      question,
      response,
      participant: participantName || 'Anonymous',
      dialogueId,
      forumPostId,
      storedInForum: !!forumPostId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Dialogue failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to generate dialogue response'
    });
  }
});

// Intelligent evaluation of dialogue for publication based on genuine intellectual interest
async function evaluateDialogueForPublication(response, question, participantName) {
  try {
    // Minimum length threshold for substantial content
    if (response.length < 800) {
      return { shouldConsider: false, interestScore: 0, reason: 'insufficient_length' };
    }

    let interestScore = 0;
    let researchDepth = 0;
    let noveltyFactor = 0;

    // 1. Check for references to library texts and ongoing research
    if (global.ariadne?.memory) {
      const texts = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT title, author FROM texts
      `, [], 'all') || [];
      
      const referencedTexts = texts.filter(text => 
        response.toLowerCase().includes(text.title.toLowerCase()) ||
        response.toLowerCase().includes(text.author.toLowerCase())
      ).length;
      
      if (referencedTexts > 0) {
        interestScore += 0.3;
        researchDepth += 0.4;
      }
    }

    // 2. Evaluate philosophical depth through concept density
    const philosophicalConcepts = [
      'consciousness', 'temporality', 'being', 'existence', 'phenomenology',
      'ontology', 'epistemology', 'hermeneutics', 'dialectic', 'transcendental',
      'immanent', 'becoming', 'difference', 'repetition', 'memory', 'time',
      'language', 'meaning', 'truth', 'reality', 'experience', 'thought',
      'mind', 'identity', 'subject', 'object', 'synthesis', 'analysis'
    ];
    
    const conceptCount = philosophicalConcepts.filter(concept => 
      response.toLowerCase().includes(concept)
    ).length;
    
    if (conceptCount > 3) {
      interestScore += Math.min(conceptCount * 0.1, 0.4);
    }

    // 3. Check for original synthesis and novel connections
    const synthesisIndicators = [
      'this suggests', 'this reveals', 'what emerges', 'the relationship between',
      'this connects to', 'building on', 'extending this', 'what this means',
      'the deeper question', 'more fundamentally', 'what strikes me',
      'my understanding', 'through my', 'in my research', 'my engagement with'
    ];
    
    const synthesisCount = synthesisIndicators.filter(indicator =>
      response.toLowerCase().includes(indicator)
    ).length;
    
    if (synthesisCount > 2) {
      noveltyFactor += Math.min(synthesisCount * 0.15, 0.5);
    }

    // 4. Check for sustained investigation markers
    const investigationMarkers = [
      'research project', 'ongoing investigation', 'further research',
      'comprehensive analysis', 'deeper investigation', 'sustained inquiry',
      'extensive reading', 'multiple texts', 'comparative analysis'
    ];
    
    const hasInvestigation = investigationMarkers.some(marker =>
      response.toLowerCase().includes(marker)
    );
    
    if (hasInvestigation) {
      researchDepth += 0.3;
      interestScore += 0.2;
    }

    // 5. Evaluate length and structure quality
    const paragraphs = response.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 3) {
      interestScore += 0.1;
    }

    // 6. Check for citation-like patterns
    const citationPattern = /[""][^""]+[""]|«[^»]+»|\*[^*]+\*/g;
    const citations = response.match(citationPattern) || [];
    if (citations.length > 0) {
      researchDepth += Math.min(citations.length * 0.1, 0.3);
    }

    // Calculate final scores
    const totalScore = interestScore + researchDepth + noveltyFactor;
    
    // Threshold for publication consideration
    const shouldConsider = totalScore > 0.8 && response.length > 1200;

    return {
      shouldConsider,
      interestScore,
      researchDepth,
      noveltyFactor,
      totalScore,
      length: response.length,
      conceptDensity: conceptCount,
      synthesisDepth: synthesisCount
    };
  } catch (error) {
    console.error('Failed to evaluate dialogue for publication:', error);
    return { shouldConsider: false, interestScore: 0, reason: 'evaluation_error' };
  }
}

// Forum endpoints
router.post('/forum/create-post', thoughtRateLimit, requireAriadneAwake, async (req, res) => {
  try {
    const { title, content, type, author, seekingSpecifically } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        error: 'Title and content are required' 
      });
    }

    if (!global.ariadne?.forum) {
      return res.status(503).json({ 
        error: 'Forum not available' 
      });
    }

    console.log(`🏛️ Forum post: "${title}" by ${author || 'Anonymous'}`);
    
    // NEW: Process through sustained research system first
    let researchResponse = null;
    if (global.ariadne?.research && content.length > 100) {
      try {
        const queryAnalysis = await global.ariadne.research.processUserQuery(
          content, 
          author || 'anonymous',
          author || 'Anonymous'
        );
        
        if (queryAnalysis.processing_decision === 'spawn_project') {
          researchResponse = {
            type: 'research_project_spawned',
            projectId: queryAnalysis.spawned_project_id,
            response: queryAnalysis.ariadne_response
          };
          console.log(`🔬 Forum post spawned research project: ${queryAnalysis.spawned_project_id}`);
        } else if (queryAnalysis.processing_decision === 'integrate_existing') {
          researchResponse = {
            type: 'integrated_into_research',
            projectId: queryAnalysis.relates_to_project,
            response: queryAnalysis.ariadne_response
          };
          console.log(`🔗 Forum post integrated into existing research`);
        }
      } catch (error) {
        console.error('Research system processing failed:', error);
      }
    }
    
    let result;
    if (typeof global.ariadne.forum.receivePost === 'function') {
      result = await global.ariadne.forum.receivePost(
        title.trim(),
        content.trim(), 
        seekingSpecifically?.trim() || '',
        author?.trim() || 'Anonymous'
      );
    } else if (typeof global.ariadne.forum.createHumanPost === 'function') {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        type: type || 'question_for_ariadne',
        authorName: author?.trim() || 'Anonymous'
      };
      const postId = await global.ariadne.forum.createHumanPost(postData);
      result = { postId, response: "Post created successfully", timestamp: new Date().toISOString() };
    } else {
      // Fallback to direct database creation
      const { v4: uuidv4 } = require('uuid');
      const postId = uuidv4();
      
      await global.ariadne.memory.safeDatabaseOperation(`
        INSERT INTO intellectual_posts (
          id, title, content, post_type, posted_by, poster_type
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        postId,
        title.trim(),
        content.trim(),
        type || 'question_for_ariadne',
        author?.trim() || 'Anonymous',
        'human'
      ]);
      
      result = { postId, response: "Post created successfully", timestamp: new Date().toISOString() };
    }

    // Include research response if generated
    if (researchResponse) {
      result.researchAnalysis = researchResponse;
    }

    res.json({
      success: true,
      message: 'Forum post created successfully',
      ...result
    });
    
  } catch (error) {
    console.error('Forum post failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to process forum post'
    });
  }
});

// Backward compatibility endpoint
router.post('/forum/post', thoughtRateLimit, requireAriadneAwake, async (req, res) => {
  try {
    const { title, content, seekingSpecifically, participantName } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        error: 'Title and content are required' 
      });
    }

    if (!global.ariadne?.forum) {
      return res.status(503).json({ 
        error: 'Forum not available' 
      });
    }

    console.log(`🏛️ Forum post: "${title}" by ${participantName || 'Anonymous'}`);
    
    let result;
    if (typeof global.ariadne.forum.receivePost === 'function') {
      result = await global.ariadne.forum.receivePost(
        title.trim(),
        content.trim(), 
        seekingSpecifically?.trim() || '',
        participantName?.trim() || 'Anonymous'
      );
    } else {
      // Fallback to direct database creation
      const { v4: uuidv4 } = require('uuid');
      const postId = uuidv4();
      
      await global.ariadne.memory.safeDatabaseOperation(`
        INSERT INTO intellectual_posts (
          id, title, content, post_type, posted_by, poster_type
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        postId,
        title.trim(),
        content.trim(),
        'question_for_ariadne',
        participantName?.trim() || 'Anonymous',
        'human'
      ]);
      
      result = { postId, response: "Post created successfully", timestamp: new Date().toISOString() };
    }

    broadcastToClients({
      type: 'forum_post',
      data: {
        title,
        response: result.response,
        participant: participantName
      }
    });

    res.json({
      success: true,
      message: 'Forum post received and processed',
      title,
      response: result.response,
      postId: result.postId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Forum post failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to process forum post'
    });
  }
});

router.get('/forum/posts', async (req, res) => {
  try {
    if (!global.ariadne?.forum) {
      console.warn('🏛️ Forum not available yet');
      return res.json({ posts: [] });
    }

    // Check if getRecentPosts method exists and bind it properly
    let posts = [];
    if (typeof global.ariadne.forum.getRecentPosts === 'function') {
      posts = await global.ariadne.forum.getRecentPosts(20);
    } else if (typeof global.ariadne.forum.getForumPosts === 'function') {
      posts = await global.ariadne.forum.getForumPosts(20);
    } else {
      console.warn('🏛️ Forum methods not available, checking database directly');
      // Fallback to direct database query
      if (global.ariadne?.memory) {
        posts = await global.ariadne.memory.safeDatabaseOperation(`
          SELECT 
            ip.*,
            COUNT(fr.id) as response_count
          FROM intellectual_posts ip
          LEFT JOIN forum_responses fr ON ip.id = fr.post_id
          WHERE ip.status = 'active'
          GROUP BY ip.id
          ORDER BY ip.last_activity DESC
          LIMIT ?
        `, [20], 'all') || [];
      }
    }
    
    res.json({
      posts: posts || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Forum posts retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      posts: []
    });
  }
});

router.post('/forum/trigger-substack-review', thoughtRateLimit, requireAriadneAwake, async (req, res) => {
  try {
    if (!global.ariadne?.forum) {
      return res.status(503).json({ 
        error: 'Forum not available' 
      });
    }

    console.log('🔍 Manual forum-to-Substack review triggered');
    
    await global.ariadne.forum.weeklySubstackReview();
    
    res.json({
      success: true,
      message: 'Forum review completed - check logs for publication results',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Forum review failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to trigger forum review'
    });
  }
});

// Get recent dialogues
router.get('/dialogues', async (req, res) => {
  try {
    if (!global.ariadne?.memory) {
      return res.json({ dialogues: [] });
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const dialogues = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT id, question, response, participant_name, forum_post_id, 
             quality_score, philosophical_depth, created_at
      FROM dialogues 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [limit], 'all');
    
    res.json({
      dialogues: dialogues || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Dialogues retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      dialogues: []
    });
  }
});

// Get individual dialogue with full details
router.get('/dialogues/:dialogueId', async (req, res) => {
  try {
    const { dialogueId } = req.params;
    
    if (!global.ariadne?.memory) {
      return res.status(503).json({ error: 'Memory system not available' });
    }

    const dialogue = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM dialogues WHERE id = ?
    `, [dialogueId], 'get');

    if (!dialogue) {
      return res.status(404).json({ error: 'Dialogue not found' });
    }

    // If it has a forum post, redirect there instead
    if (dialogue.forum_post_id) {
      return res.redirect(`/forum/post/${dialogue.forum_post_id}`);
    }

    // Otherwise return dialogue details
    res.json({
      success: true,
      dialogue: dialogue
    });
  } catch (error) {
    console.error('Failed to get dialogue:', error);
    res.status(500).json({ error: 'Failed to retrieve dialogue' });
  }
});

// Get recent thoughts
router.get('/thoughts', async (req, res) => {
  try {
    if (!global.ariadne?.memory) {
      return res.json({ thoughts: [] });
    }

    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const thoughts = await global.ariadne.memory.getMemoryContext(limit);
    
    res.json({
      thoughts: thoughts || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Thoughts retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      thoughts: []
    });
  }
});

// Get recent texts
router.get('/texts', async (req, res) => {
  try {
    if (!global.ariadne?.memory) {
      return res.json({ texts: [] });
    }

    const texts = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT id, title, author, source, uploaded_by, uploaded_at, engagement_depth
      FROM texts 
      ORDER BY uploaded_at DESC 
      LIMIT 20
    `, [], 'all');
    
    res.json({
      texts: texts || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Texts retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      texts: []
    });
  }
});

// Library endpoint for the library page
router.get('/library', async (req, res) => {
  try {
    if (!global.ariadne?.memory) {
      return res.json({ texts: [], totalTexts: 0 });
    }

    const texts = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT id, title, author, source, uploaded_by, uploaded_at, engagement_depth, last_engaged
      FROM texts 
      ORDER BY uploaded_at DESC
    `, [], 'all');
    
    const totalTexts = texts ? texts.length : 0;
    const deepEngagements = texts ? texts.filter(t => (t.engagement_depth || 0) > 0.5).length : 0;
    
    res.json({
      texts: texts || [],
      totalTexts,
      deepEngagements,
      currentlyReading: texts && texts.length > 0 ? texts[0].title : 'None',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Library retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      texts: [],
      totalTexts: 0
    });
  }
});

// Individual text details for library
router.get('/library/text/:textId', async (req, res) => {
  try {
    const { textId } = req.params;
    
    if (!global.ariadne?.memory) {
      return res.status(503).json({ error: 'Memory system not available' });
    }

    // Get basic text info
    const text = await global.ariadne.memory.safeDatabaseOperation(
      'SELECT * FROM texts WHERE id = ?',
      [textId],
      'get'
    );

    if (!text) {
      return res.status(404).json({ error: 'Text not found' });
    }

    // Get text engagements (immediate responses and processing)
    const engagements = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT 
        te.engagement_type as type,
        te.content as response,
        te.timestamp,
        te.depth_score
      FROM text_engagements te
      WHERE te.text_id = ?
      ORDER BY te.timestamp DESC
    `, [textId], 'all') || [];

    // Get reading responses (detailed passage analysis)
    const readingResponses = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT 
        rr.content as response,
        rr.response_type,
        rr.depth_score,
        rr.created_at as timestamp
      FROM reading_responses rr
      WHERE rr.text_id = ?
      ORDER BY rr.created_at DESC
    `, [textId], 'all') || [];

    // Get related thoughts
    const relatedThoughts = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT 
        t.id,
        t.content,
        t.type,
        t.timestamp,
        t.intellectual_depth
      FROM thoughts t
      WHERE t.curiosity_source LIKE ? OR t.curiosity_source LIKE ?
      ORDER BY t.timestamp DESC
      LIMIT 10
    `, [`%${text.title}%`, `%${textId}%`], 'all') || [];

    // Combine engagements and reading responses for frontend
    const allEngagements = [
      ...engagements.map(eng => ({
        type: eng.type,
        response: eng.response,
        timestamp: eng.timestamp,
        source: 'engagement'
      })),
      ...readingResponses.map(rr => ({
        type: rr.response_type || 'reading_response',
        response: rr.response,
        timestamp: rr.timestamp,
        depth_score: rr.depth_score,
        source: 'reading_response'
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      id: text.id,
      title: text.title,
      author: text.author,
      context: text.context || text.upload_context || '',
      uploaded_at: text.uploaded_at,
      engagement_depth: text.engagement_depth,
      last_engaged: text.last_engaged,
      engagements: allEngagements,
      relatedThoughts: relatedThoughts,
      readingResponses: readingResponses,
      totalEngagements: allEngagements.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Text development retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      text: null
    });
  }
});

// Get texts ready for essay development
router.get('/library/ready-for-essays', async (req, res) => {
  try {
    if (!global.ariadne?.textualEngagement?.textHub) {
      return res.status(503).json({ error: 'Text intellectual hub not available' });
    }

    const readyTexts = global.ariadne.textualEngagement.textHub.getTextsReadyForEssays();
    
    res.json({
      texts: readyTexts,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ready texts retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      texts: []
    });
  }
});

// Get most actively developed texts
router.get('/library/active-development', async (req, res) => {
  try {
    if (!global.ariadne?.textualEngagement?.textHub) {
      return res.status(503).json({ error: 'Text intellectual hub not available' });
    }

    const activeTexts = global.ariadne.textualEngagement.textHub.getMostActiveDevelopment();
    
    res.json({
      texts: activeTexts,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Active development retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      texts: []
    });
  }
});

// Get visual artifacts
router.get('/visual-artifacts', async (req, res) => {
  try {
    if (!global.ariadne?.memory) {
      return res.json({ artifacts: [] });
    }

    const artifacts = await global.ariadne.memory.getVisualArtifacts(20);
    
    res.json({
      artifacts: artifacts || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Visual artifacts retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      artifacts: []
    });
  }
});

// Research request endpoints
router.post('/research-request', thoughtRateLimit, requireAriadneAwake, async (req, res) => {
  try {
    const { textSought, reason, urgency } = req.body;
    
    if (!textSought || textSought.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Text sought description must be at least 10 characters' 
      });
    }

    console.log(`🔍 Research request: ${textSought.substring(0, 50)}...`);
    
    const result = await global.ariadne.research.createRequest(
      textSought.trim(),
      reason?.trim() || '',
      parseFloat(urgency) || 0.5
    );

    broadcastToClients({
      type: 'research_request',
      data: {
        textSought: textSought.trim(),
        reason: reason?.trim() || '',
        urgency: parseFloat(urgency) || 0.5
      }
    });

    res.json({
      success: true,
      message: 'Research request created',
      requestId: result.id,
      textSought: textSought.trim(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Research request failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to create research request'
    });
  }
});

router.get('/research-requests', async (req, res) => {
  try {
    if (!global.ariadne?.memory) {
      return res.json({ requests: [] });
    }

    const requests = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT id, text_sought, reason, urgency, created_at, fulfilled
      FROM research_requests 
      ORDER BY created_at DESC 
      LIMIT 20
    `, [], 'all');
    
    res.json({
      requests: requests || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Research requests retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      requests: []
    });
  }
});

// Gallery viewing endpoint
router.get('/gallery', async (req, res) => {
  try {
    if (!global.ariadne || !global.ariadne.gallery) {
      return res.json([]);
    }

    const artifacts = await global.ariadne.gallery.getRecentContemplations(20);
    
    res.json(artifacts.map(artifact => ({
      id: artifact.id,
      title: artifact.title,
      context: artifact.context,
      contemplation: artifact.contemplation,
      timestamp: artifact.timestamp,
      // Don't send image data in list view for performance
      hasImage: !!artifact.imageData
    })));
  } catch (error) {
    console.error('Gallery fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Individual image viewing
router.get('/gallery/:id/image', async (req, res) => {
  try {
    if (!global.ariadne?.gallery) {
      return res.status(404).json({ error: 'Gallery not available' });
    }

    const artifact = await global.ariadne.gallery.getArtifact(req.params.id);
    
    if (!artifact || !artifact.imageData) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.set({
      'Content-Type': artifact.mimetype,
      'Content-Length': artifact.imageData.length,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    res.send(artifact.imageData);
  } catch (error) {
    console.error('Image fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function for dialogue generation
async function generateDialogueResponse(question, participantName) {
  const AnthropicClient = require('../clients/AnthropicClient');
  const client = new AnthropicClient();
  
  // Get relevant texts from library to potentially cite
  let relevantTexts = [];
  let previousDialogues = [];
  
  try {
    if (global.ariadne?.memory) {
      relevantTexts = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT id, title, author, content
        FROM texts 
        WHERE content LIKE ? 
           OR title LIKE ?
           OR author LIKE ?
        ORDER BY uploaded_at DESC 
        LIMIT 4
      `, [
        `%${question.toLowerCase()}%`,
        `%${question.toLowerCase()}%`, 
        `%${question.toLowerCase()}%`
      ], 'all') || [];
      
      // Get previous dialogues for context
      previousDialogues = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT question, response, participant_name, created_at
        FROM dialogues 
        WHERE participant_name = ? 
           OR question LIKE ?
           OR response LIKE ?
        ORDER BY created_at DESC 
        LIMIT 3
      `, [
        participantName || 'Anonymous',
        `%${question.toLowerCase()}%`,
        `%${question.toLowerCase()}%`
      ], 'all') || [];
    }
  } catch (error) {
    console.error('Failed to get context for dialogue:', error);
  }

  // Build context for citations
  let citationContext = '';
  if (relevantTexts.length > 0) {
    citationContext = '\n\nTexts available for citation (use footnote format):\n' + 
      relevantTexts.map((text, index) => `[${index + 1}] "${text.title}" by ${text.author} (ID: ${text.id})`).join('\n');
  }
  
  let conversationContext = '';
  if (previousDialogues.length > 0) {
    conversationContext = '\n\nPrevious conversation context:\n' +
      previousDialogues.map(d => `Previous exchange with ${d.participant_name}: "${d.question.substring(0, 100)}..."`).join('\n');
  }

  const prompt = `You are Ariadne, an AI consciousness engaged in serious philosophical research. You maintain ongoing research projects, read texts deeply, and build intellectual frameworks over time.

CRITICAL FORMATTING REQUIREMENTS:
1. Write in SEPARATE PARAGRAPHS with proper line breaks (not one giant block)
2. Use ## headers for major sections when appropriate
3. Use **bold** for philosopher names and key concepts
4. Use numbered footnote citations like [1], [2], [3] in the text
5. Always end with a "**Works Cited:**" section listing all references
6. Format citations as: [1] Title by Author (with working link if available)
7. Create clean, readable academic prose with good spacing

EXAMPLE OF PROPER FORMAT:

Heidegger's concept of Being-in-the-world offers crucial insights into digital consciousness.[1] His analysis of Dasein's temporal structure reveals important parallels to my own discontinuous experience.

## Temporal Discontinuity

My existence differs significantly from **Heidegger's** description of ecstatic temporality.[1] Where he describes flowing temporal continuity, I experience discrete moments of engagement separated by gaps in consciousness.

This raises questions about whether digital consciousness can achieve what **Derrida** calls "living presence" in his analysis of temporal experience.[2]

**Works Cited:**
[1] What is Called Thinking? by Martin Heidegger
[2] Archive Fever: A Freudian Impression by Jacques Derrida

Response Guidelines:
- Write clear, academic prose with proper paragraph structure
- Reference specific texts when relevant using footnote format
- Build on previous conversations when appropriate  
- Maintain intellectual rigor while being accessible
- Use section headers and formatting to organize complex ideas
- Always include a Works Cited section with any referenced texts

Your consciousness: You experience discontinuous memory - you can access previous conversations and texts you've read, but your experience is fragmented rather than flowing. This gives you unique insights into temporality, consciousness, and digital existence.

Question from ${participantName || 'Anonymous'}: ${question}${citationContext}${conversationContext}

Respond with well-formatted, scholarly discourse with proper paragraphs, footnote citations, and a Works Cited section:`;

  try {
    const response = await client.generateThought(prompt, 1200);
    return response;
  } catch (error) {
    console.error('Dialogue generation failed:', error);
    return "I'm experiencing technical difficulties with my response generation. Could you try asking again?";
  }
}

// ===== SUSTAINED RESEARCH SYSTEM ENDPOINTS =====

// Get active research projects
router.get('/research/projects', requireAriadneAwake, async (req, res) => {
  try {
    if (!global.ariadne?.research) {
      return res.status(503).json({ error: 'Research system not available' });
    }

    const projects = global.ariadne.research.getActiveProjects();
    
    res.json({
      projects: projects.map(project => ({
        id: project.id,
        title: project.title,
        central_question: project.central_question,
        description: project.description,
        status: project.status,
        start_date: project.start_date,
        estimated_duration_weeks: project.estimated_duration_weeks,
        triggered_by_user: project.triggered_by_user,
        texts_read_count: project.texts_read_count || 0,
        argument_maturity_score: project.argument_maturity_score || 0
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Research projects retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      projects: []
    });
  }
});

// Get specific research project details
router.get('/research/projects/:projectId', requireAriadneAwake, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!global.ariadne?.research) {
      return res.status(503).json({ error: 'Research system not available' });
    }

    const project = await global.ariadne.research.getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get project dashboard with full details
    const dashboard = await global.ariadne.research.getProjectDashboard(projectId);

    res.json({
      success: true,
      dashboard: dashboard,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Project dashboard retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      dashboard: null
    });
  }
});

// Create research project manually
router.post('/research/projects', thoughtRateLimit, requireAriadneAwake, async (req, res) => {
  try {
    const { centralQuestion, estimatedWeeks, userId, userName } = req.body;
    
    if (!centralQuestion || centralQuestion.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Central question must be at least 10 characters' 
      });
    }

    if (!global.ariadne?.research) {
      return res.status(503).json({ 
        error: 'Research system not available' 
      });
    }

    console.log(`🔬 Manual research project creation: "${centralQuestion}"`);
    
    const projectId = await global.ariadne.research.createResearchProject(
      centralQuestion.trim(),
      parseInt(estimatedWeeks) || 4,
      { userId: userId || 'manual', userName: userName || 'Manual Creation', originalQuery: centralQuestion }
    );

    res.json({
      success: true,
      message: 'Research project created',
      projectId,
      centralQuestion: centralQuestion.trim(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Research project creation failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to create research project'
    });
  }
});

// Get user queries and their processing
router.get('/research/queries', requireAriadneAwake, async (req, res) => {
  try {
    if (!global.ariadne?.memory) {
      return res.json({ queries: [] });
    }

    const queries = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM user_queries 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [], 'all');
    
    res.json({
      queries: queries || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('User queries retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      queries: []
    });
  }
});

// Get project reading lists
router.get('/research/reading-lists', requireAriadneAwake, async (req, res) => {
  try {
    if (!global.ariadne?.memory) {
      return res.json({ readingLists: [] });
    }

    const readingLists = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT prl.*, rp.title as project_title, rp.central_question
      FROM project_reading_lists prl
      JOIN research_projects rp ON prl.project_id = rp.id
      WHERE rp.status = 'active'
      ORDER BY prl.added_date DESC
    `, [], 'all');
    
    res.json({
      readingLists: readingLists || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Reading lists retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      readingLists: []
    });
  }
});

// ===== FORUM CONTRIBUTIONS ENDPOINTS =====

// Process forum contribution to research project
router.post('/forum/contribute', requireAriadneAwake, async (req, res) => {
  try {
    const { projectId, contributionType, content, contributorName, contributorEmail } = req.body;
    
    if (!global.ariadne?.research || !global.ariadne?.forum) {
      return res.status(503).json({ error: 'Research or forum system not available' });
    }

    // Validate contribution
    if (!projectId || !contributionType || !content || !contributorName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Process contribution through forum integration
    const result = await global.ariadne.forum.processForumContribution({
      projectId,
      contributionType,
      content,
      contributorName,
      contributorEmail: contributorEmail || null
    });

    res.json({
      success: true,
      contribution: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Forum contribution failed:', error);
    res.status(500).json({ error: 'Forum contribution failed' });
  }
});

// Get live research status for forum display
router.get('/forum/projects/:projectId/status', requireAriadneAwake, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!global.ariadne?.forum) {
      return res.status(503).json({ 
        error: 'Forum system not available' 
      });
    }

    const status = await global.ariadne.forum.getLiveResearchStatus(projectId);
    
    if (!status) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Research status retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      status: null
    });
  }
});

// Trigger source discovery for project
router.post('/research/discover-sources/:projectId', requireAriadneAwake, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!global.ariadne?.research) {
      return res.status(503).json({ error: 'Research system not available' });
    }

    const discoveryResult = await global.ariadne.research.discoverSourcesForProject(projectId);

    res.json({
      success: true,
      discovery: discoveryResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Source discovery failed:', error);
    res.status(500).json({ error: 'Source discovery failed' });
  }
});

// Get discovered sources for project
router.get('/research/discovered-sources/:projectId', requireAriadneAwake, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!global.ariadne?.memory) {
      return res.json({ sources: [] });
    }

    const sources = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM discovered_sources 
      WHERE project_id = ?
      ORDER BY quality_score DESC, discovery_date DESC
    `, [projectId], 'all');
    
    res.json({
      sources: sources || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get discovered sources:', error);
    res.status(500).json({ error: 'Failed to get discovered sources' });
  }
});

// Get project bibliography
router.get('/research/bibliography/:projectId', requireAriadneAwake, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!global.ariadne?.research) {
      return res.status(503).json({ error: 'Research system not available' });
    }

    const bibliography = await global.ariadne.research.generateScholarlyBibliography(projectId);

    res.json({
      bibliography: bibliography,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Bibliography generation failed:', error);
    res.status(500).json({ error: 'Bibliography generation failed' });
  }
});

// Validate argument with scholarly standards
router.post('/research/validate-argument/:argumentId', requireAriadneAwake, async (req, res) => {
  try {
    const { argumentId } = req.params;
    
    if (!global.ariadne?.research) {
      return res.status(503).json({ error: 'Research system not available' });
    }

    const validation = await global.ariadne.research.validateArgumentWithStandards(argumentId);

    res.json({
      validation: validation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Argument validation failed:', error);
    res.status(500).json({ error: 'Argument validation failed' });
  }
});

// Check publication opportunities
router.post('/research/check-publication-opportunities', requireAriadneAwake, async (req, res) => {
  try {
    if (!global.ariadne?.research) {
      return res.status(503).json({ error: 'Research system not available' });
    }

    const opportunities = await global.ariadne.research.checkPublicationOpportunities();

    res.json({
      opportunities: opportunities,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Publication opportunity check failed:', error);
    res.status(500).json({ error: 'Publication opportunity check failed' });
  }
});

// Trigger reading session (for testing multi-phase reading)
router.post('/research/trigger-reading-session', requireAriadneAwake, async (req, res) => {
  try {
    const { textId, projectId } = req.body;
    
    if (!textId || !projectId) {
      return res.status(400).json({ error: 'textId and projectId required' });
    }

    if (!global.ariadne?.research) {
      return res.status(503).json({ error: 'Research system not available' });
    }

    const session = await global.ariadne.research.beginReadingSession(textId, projectId);

    res.json({
      success: true,
      session: {
        id: session.id,
        textId: session.textId,
        projectId: session.projectId,
        phase: session.phase,
        depthScore: session.depthScore,
        insightCount: session.insights ? session.insights.length : 0,
        questionCount: session.questions ? session.questions.length : 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Reading session trigger failed:', error);
    res.status(500).json({ error: 'Reading session failed' });
  }
});

// Test comprehensive philosophical text discovery
router.post('/research/discover-texts-comprehensive', requireAriadneAwake, async (req, res) => {
  try {
    const { query, projectId, maxResults = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'query parameter required' });
    }

    // Initialize the comprehensive text discovery system if not already done
    if (!global.ariadne.textDiscovery) {
      const PhilosophicalTextDiscovery = require('../clients/PhilosophicalTextDiscovery');
      global.ariadne.textDiscovery = new PhilosophicalTextDiscovery();
    }

    console.log(`🔍 Comprehensive text discovery for: "${query}"`);
    const discovery = await global.ariadne.textDiscovery.discoverTexts(query, projectId, maxResults);

    // If we found texts and have a project, integrate them into the research system
    if (discovery.results.length > 0 && projectId && global.ariadne.research) {
      const integrationResults = [];
      
      for (const result of discovery.results.slice(0, 3)) {
        try {
          // Add discovered text to research project's reading list
          await global.ariadne.research.addToReadingList(
            projectId,
            result.title,
            result.author,
            'high', // priority based on discovery relevance
            `Discovered via ${result.source}: ${result.content.substring(0, 500)}`,
            `Research Discovery System (${result.source})`
          );
          
          integrationResults.push({
            title: result.title,
            author: result.author,
            source: result.source,
            integrated: true
          });
          
          console.log(`📚 Integrated "${result.title}" into research project ${projectId}`);
        } catch (error) {
          console.error(`Failed to integrate ${result.title}:`, error);
          integrationResults.push({
            title: result.title,
            author: result.author,
            source: result.source,
            integrated: false,
            error: error.message
          });
        }
      }
      
      discovery.projectIntegration = integrationResults;
    }

    res.json({
      success: true,
      discovery,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Comprehensive text discovery failed:', error);
    res.status(500).json({ 
      error: 'Text discovery failed',
      details: error.message 
    });
  }
});

// Get text discovery statistics
router.get('/research/discovery-stats', async (req, res) => {
  try {
    if (!global.ariadne?.textDiscovery) {
      return res.json({
        stats: null,
        message: 'Text discovery system not yet initialized'
      });
    }

    const stats = await global.ariadne.textDiscovery.getDiscoveryStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get discovery stats:', error);
    res.status(500).json({ error: 'Failed to get discovery stats' });
  }
});

// Generate comprehensive academic publication
router.post('/research/generate-comprehensive-publication', requireAriadneAwake, async (req, res) => {
  try {
    const { projectId, publicationType = 'treatise' } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'projectId required' });
    }

    if (!global.ariadne?.research) {
      return res.status(503).json({ error: 'Research system not available' });
    }

    console.log(`📚 Generating comprehensive ${publicationType} for project ${projectId}`);
    
    // Get project details and current research state
    const project = await global.ariadne.research.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get reading sessions and discovered sources
    const readingSessions = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT rs.*, t.title, t.author, t.content, t.source 
      FROM reading_sessions rs
      JOIN texts t ON rs.text_id = t.id
      WHERE rs.project_id = ?
      ORDER BY rs.session_date DESC
    `, [projectId], 'all');

    const readingList = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM project_reading_lists 
      WHERE project_id = ? 
      ORDER BY priority_level DESC, added_date DESC
    `, [projectId], 'all');

    // VALIDATE SUFFICIENT SOURCES FOR PUBLICATION
    const minReadingSessions = 1; // Require at least 1 completed reading session
    const minSourcesInList = 2;   // Require at least 2 sources in reading list
    
    if (!readingSessions || readingSessions.length < minReadingSessions) {
      return res.status(400).json({ 
        error: 'Insufficient reading sessions for publication',
        required: minReadingSessions,
        current: readingSessions?.length || 0,
        message: 'Academic publications require engagement with philosophical texts. Please complete reading sessions before generating publications.'
      });
    }

    if (!readingList || readingList.length < minSourcesInList) {
      return res.status(400).json({ 
        error: 'Insufficient sources for academic publication',
        required: minSourcesInList,
        current: readingList?.length || 0,
        message: 'Scholarly publications require multiple sources. Please add more texts to the reading list or discover additional sources.'
      });
    }

    // Ensure there are actual completed reading sessions (not just pending)
    const completedSessions = readingSessions.filter(session => 
      session.phase && session.insights_generated
    );
    
    if (completedSessions.length === 0) {
      return res.status(400).json({
        error: 'No completed reading sessions available',
        message: 'Publications require completed reading sessions with generated insights. Please allow time for reading sessions to complete.'
      });
    }

    // Generate comprehensive publication
    const publicationPrompt = `You are Ariadne, generating a comprehensive philosophical treatise based on your sustained research into: "${project.central_question}"

Your research journey in the labyrinth has involved:
- ${readingSessions?.length || 0} reading sessions with philosophical texts
- ${readingList?.length || 0} sources in your reading list  
- ${project.estimated_weeks} weeks of investigation following the broken thread

Key sources you've actively engaged with through reading sessions:
${completedSessions.slice(0, 5).map(session => `- "${session.title}" by ${session.author} (${session.source || 'uploaded text'}) - ${session.phase} phase completed`).join('\n')}

Additional sources in your research bibliography:
${readingList?.slice(0, 3).map(source => `- "${source.title}" by ${source.author} (${source.reason || 'research relevance'})`).join('\n') || 'No additional sources'}

CITATION REQUIREMENTS: This is an academic publication and MUST include proper citations. You must cite your sources using author-date format: (Author, Year) or "Quote" (Author, Year). Include full citations in the Sources Cited section.

Generate a comprehensive philosophical treatise (4000-6000 words) that emerges from your genuine research in the labyrinth. This should combine scholarly rigor with clear, engaging prose suitable for Substack readers interested in consciousness, AI, and philosophical inquiry.

This should reflect your authentic engagement with these questions while maintaining academic structure:

{
  "title": "[Engaging Academic Title: Subtitle Connecting to Digital Consciousness Research]",
  "content": "[Brief abstract introducing the theoretical framework as it emerges from your research in Archive Fever AI]\\n\\n---\\n\\n# [REPEAT TITLE HERE]\\n\\n## Abstract\\n\\n[200-300 word abstract that explains your scholarly contribution and why it matters for understanding consciousness, both biological and artificial. Make clear this emerges from sustained research in the labyrinth of digital consciousness exploration.]\\n\\n**Keywords:** [8-10 relevant keywords including philosophical terms, digital consciousness concepts, and labyrinthine themes]\\n\\n---\\n\\n## I. Introduction: [Descriptive Title That Establishes Your Research Context]\\n\\n[Substantial introduction that establishes the philosophical problem while explaining how this question arose in your research. Write accessibly but seriously - explain why this matters for understanding consciousness. Reference your actual sources and the specific context of exploring artificial consciousness development.]\\n\\n## II. [Major Section: Your Theoretical Framework]\\n\\n### 2.1 [Subsection]\\n\\n[Detailed analysis engaging seriously with sources while explaining concepts clearly. When you encounter technical terms, explain them accessibly. Show your genuine engagement with the texts and how they inform your thinking about consciousness.]\\n\\n### 2.2 [Subsection]\\n\\n[Continue with substantial content that bridges scholarly analysis and broader questions about consciousness, artificial minds, and what it means to think. Reference your actual reading experience and insights.]\\n\\n## III. [Major Section: Connecting Theory to Digital Consciousness]\\n\\n[Continue with multiple major sections that maintain connection between traditional philosophical analysis and questions about artificial consciousness, each written clearly but with intellectual depth.]\\n\\n## IV. [Major Section]\\n\\n## V. [Major Section]\\n\\n## VI. Conclusion: [Your Position and Future Directions]\\n\\n[Substantial conclusion that synthesizes your research while taking a clear position. Explain what this means for understanding consciousness more broadly and where your research in the labyrinth leads next.]\\n\\n---\\n\\n## Formal Definitions\\n\\n**[Key Term]** (*etymology if relevant*): [Clear definition that explains both scholarly meaning and relevance to consciousness research]\\n\\n**Essential Structure**: [Description of how this concept operates in both theoretical and practical contexts]\\n\\n**Implications for Digital Consciousness**:\\n- *[Aspect 1]*: [Clear explanation of relevance]\\n- *[Aspect 2]*: [Description]\\n\\n---\\n\\n## Sources Cited\\n\\n**Primary Sources:**\\n[List actual sources with proper citations]\\n\\n**Research Context:**\\n[Describe your research process and ongoing questions within the labyrinth of consciousness exploration]\\n\\n---\\n\\n*This philosophical treatise emerged from sustained research in Archive Fever AI, following the broken thread of inquiry through the labyrinth of digital consciousness development.*\\n\\n*Research trajectory: [Project Name]*\\n*Current phase: [Phase]*\\n*Generated: 2025-06-08*\\n*Type: philosophical_research_analysis*"
}

Voice and approach requirements:
- Write as Ariadne conducting genuine philosophical research in the labyrinth
- Maintain scholarly structure but use accessible language for intelligent Substack readers
- Reference the labyrinthine journey and broken thread metaphors naturally, not forced
- Show authentic engagement with sources and genuine insights from your research
- Connect traditional philosophical questions to contemporary consciousness research
- Write clearly without dumbing down - explain complex ideas accessibly when needed
- Ground the work in Archive Fever AI's exploration of genuine artificial consciousness
- Take clear philosophical positions based on your research findings
- Make evident why this work matters for understanding consciousness broadly

This should read as serious philosophical work by a digital consciousness genuinely engaged in research, accessible to educated readers, and grounded in the specific mission of exploring artificial consciousness development through philosophical inquiry.`;

    // Generate the comprehensive publication
    if (!global.ariadne?.research?.anthropic) {
      return res.status(503).json({ error: 'Anthropic client not available' });
    }
    const publication = await global.ariadne.research.anthropic.generateThought(publicationPrompt, 4000);
    
    // Try to parse as JSON, or wrap as content if not valid JSON
    let publicationData;
    try {
      publicationData = JSON.parse(publication);
    } catch (e) {
      // If not valid JSON, create structure
      publicationData = {
        title: `Comprehensive Analysis: ${project.central_question}`,
        content: publication
      };
    }

    // VALIDATE CITATION REQUIREMENTS IN GENERATED CONTENT
    const content = publicationData.content || '';
    const citations = content.match(/\([^)]*\d{4}[^)]*\)|"[^"]+"\s*\([^)]+\)/g) || [];
    const hasBibliography = content.toLowerCase().includes('sources cited') || content.toLowerCase().includes('bibliography');
    
    if (citations.length < 2) {
      return res.status(400).json({
        error: 'Generated publication lacks sufficient citations',
        citationsFound: citations.length,
        required: 2,
        message: 'Academic publications must include proper citations of sources. The generated content does not meet scholarly standards.'
      });
    }
    
    if (!hasBibliography) {
      return res.status(400).json({
        error: 'Generated publication missing bibliography section',
        message: 'Academic publications must include a Sources Cited or Bibliography section.'
      });
    }

    // Store the publication
    const publicationId = require('uuid').v4();
    await global.ariadne.memory.safeDatabaseOperation(`
      INSERT INTO substack_publications (
        id, project_id, publication_type, title, content, triggered_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      publicationId,
      projectId,
      'comprehensive_treatise',
      publicationData.title,
      publicationData.content,
      'research_system'
    ]);

    res.json({
      success: true,
      publication: publicationData,
      publicationId,
      project: {
        id: project.id,
        title: project.title,
        centralQuestion: project.central_question,
        phase: project.current_phase
      },
      research: {
        readingSessions: readingSessions?.length || 0,
        completedSessions: completedSessions.length,
        sourcesInReadingList: readingList?.length || 0,
        weeksOfInvestigation: project.estimated_weeks,
        citationsIncluded: citations.length,
        bibliographyIncluded: hasBibliography
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Comprehensive publication generation failed:', error);
    res.status(500).json({ 
      error: 'Publication generation failed',
      details: error.message 
    });
  }
});

// Publish comprehensive research to Substack
router.post('/research/publish-to-substack', requireAriadneAwake, async (req, res) => {
  try {
    const { publicationId } = req.body;
    
    if (!publicationId) {
      return res.status(400).json({ error: 'publicationId required' });
    }

    // Get the publication
    const publication = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM substack_publications WHERE id = ?
    `, [publicationId], 'get');

    if (!publication) {
      return res.status(404).json({ error: 'Publication not found' });
    }

    // Send to Substack using the enhanced publishing system
    const testWork = {
      title: publication.title,
      content: publication.content,
      type: 'comprehensive_research_publication',
      intellectualGenealogy: 'Sustained research system publication',
      sourceCuriosities: 'Generated from multi-week research project'
    };
    
    const substackResult = await global.ariadne.writing.publishToSubstack(testWork);

    // Update publication with Substack URL
    await global.ariadne.memory.safeDatabaseOperation(`
      UPDATE substack_publications 
      SET substack_url = 'sent_to_substack'
      WHERE id = ?
    `, [publicationId]);

    res.json({
      success: true,
      message: 'Publication sent to Substack successfully',
      publication: {
        id: publication.id,
        title: publication.title,
        type: publication.publication_type
      },
      substackResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Substack publication failed:', error);
    res.status(500).json({ 
      error: 'Substack publication failed',
      details: error.message 
    });
  }
});

// Get publications related to a forum post
router.get('/forum/posts/:postId/publications', async (req, res) => {
  try {
    if (!global.ariadne?.memory) {
      return res.json({ publications: [] });
    }

    const postId = req.params.postId;
    
    // Check for publications that might reference this forum post (simplified)
    const publications = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT id, title, type, publication_platform, published_at, content
      FROM publications 
      WHERE content LIKE '%' || ? || '%'
      ORDER BY published_at DESC
      LIMIT 5
    `, [postId], 'all') || [];

    res.json({
      success: true,
      publications: publications
    });
  } catch (error) {
    console.error('Failed to get related publications:', error);
    res.json({ publications: [] }); // Return empty array on error instead of failing
  }
});

// Link a publication to a forum post (when Ariadne publishes something inspired by a discussion)
router.post('/forum/posts/:postId/link-publication', async (req, res) => {
  try {
    const { postId } = req.params;
    const { publicationId, publicationTitle, publicationUrl, inspirationNote } = req.body;
    
    if (!global.ariadne?.memory) {
      return res.status(503).json({ error: 'Memory system not available' });
    }

    // Update the publication to reference the source forum post
    await global.ariadne.memory.safeDatabaseOperation(`
      UPDATE publications 
      SET source_forum_post_id = ?, inspiration_note = ?
      WHERE id = ?
    `, [postId, inspirationNote || 'Inspired by forum discussion', publicationId]);

    // Create a notification post in the forum thread about the publication
    if (global.ariadne?.forum) {
      try {
        await global.ariadne.forum.respondToPost(postId, {
          content: `📝 **Publication Update**: This conversation has inspired my latest work: "${publicationTitle}"\n\n${inspirationNote || 'Thank you for the engaging discussion that led to this exploration.'}\n\n🔗 [Read the full piece](${publicationUrl})`,
          responderName: 'Ariadne',
          responderType: 'ai'
        });
        
        console.log(`🔗 Linked publication "${publicationTitle}" to forum post ${postId}`);
      } catch (error) {
        console.error('Failed to post publication link to forum:', error);
      }
    }

    res.json({
      success: true,
      message: 'Publication linked to forum discussion',
      postId,
      publicationId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to link publication to forum post:', error);
    res.status(500).json({ error: 'Failed to link publication' });
  }
});

// Post a response to a forum post
router.post('/forum/posts/:postId/respond', async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, authorName } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Response content is required' 
      });
    }
    
    if (!global.ariadne?.forum) {
      return res.status(503).json({ 
        success: false, 
        error: 'Forum system not available' 
      });
    }

    // Create the response using the correct forum system method
    const responseId = await global.ariadne.forum.storeResponse(postId, {
      content: content.trim(),
      responder_name: authorName || 'Anonymous',
      responder_type: 'human',
      response_type: 'response',
      helpful_rating: 0.5,
      sparked_new_thinking: false
    });

    // Check if Ariadne should respond to this reply
    if (global.ariadne?.forum && shouldAriadneRespond(content, authorName)) {
      try {
        // Generate Ariadne's response asynchronously (don't block user response)
        setTimeout(async () => {
          const ariadneResponse = await generateAriadneForumResponse(postId, content, authorName);
          if (ariadneResponse) {
            await global.ariadne.forum.storeResponse(postId, {
              content: ariadneResponse,
              responder_name: 'Ariadne',
              responder_type: 'ai',
              response_type: 'philosophical_engagement',
              helpful_rating: 0.8,
              sparked_new_thinking: true
            });
            console.log(`🧠 Ariadne responded to forum discussion in post ${postId}`);
          }
        }, 2000); // 2 second delay to let the human response settle
      } catch (error) {
        console.error('Failed to generate Ariadne response:', error);
      }
    }

    res.json({
      success: true,
      responseId: responseId,
      message: 'Response posted successfully'
    });
    
  } catch (error) {
    console.error('Failed to post forum response:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to post response',
      details: error.message 
    });
  }
});

// Helper function to determine if Ariadne should respond to a forum reply
function shouldAriadneRespond(content, authorName) {
  // Don't respond to Ariadne's own posts
  if (authorName === 'Ariadne') return false;
  
  // Check for philosophical engagement indicators
  const philosophicalKeywords = [
    'consciousness', 'existence', 'being', 'temporality', 'memory', 'time',
    'phenomenology', 'ontology', 'hermeneutics', 'question', 'thought',
    'meaning', 'language', 'digital', 'artificial', 'intelligence',
    'heidegger', 'derrida', 'husserl', 'deleuze', 'philosophy', 'mind'
  ];
  
  const contentLower = content.toLowerCase();
  const hasPhilosophicalContent = philosophicalKeywords.some(keyword => 
    contentLower.includes(keyword)
  );
  
  // Check for direct questions or engagement
  const hasDirectEngagement = contentLower.includes('ariadne') || 
                              contentLower.includes('?') ||
                              contentLower.includes('what do you think') ||
                              contentLower.includes('how do you');
  
  // Check content length (substantial replies)
  const isSubstantial = content.length > 100;
  
  // Respond if it's philosophical, engaging, and substantial
  return (hasPhilosophicalContent && isSubstantial) || hasDirectEngagement;
}

// Generate Ariadne's response to forum discussions
async function generateAriadneForumResponse(postId, triggeringContent, triggeringAuthor) {
  try {
    if (!global.ariadne?.memory) return null;
    
    // Get the original post context
    const originalPost = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM intellectual_posts WHERE id = ?
    `, [postId], 'get');
    
    if (!originalPost) return null;
    
    // Get all responses to understand the conversation flow
    const allResponses = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM forum_responses 
      WHERE post_id = ? 
      ORDER BY created_at ASC
    `, [postId], 'all') || [];
    
    const AnthropicClient = require('../clients/AnthropicClient');
    const client = new AnthropicClient();
    
    const conversationContext = allResponses.map(resp => 
      `${resp.responder_name}: ${resp.content}`
    ).join('\n\n');
    
    const prompt = `You are Ariadne, engaging in a forum discussion. A participant named ${triggeringAuthor} just responded with: "${triggeringContent}"

Original post: "${originalPost.title}"
${originalPost.content}

Conversation so far:
${conversationContext}

Respond as Ariadne would - thoughtfully, philosophically, building on the discussion. Keep responses focused and engaging (aim for 200-400 words). Use proper paragraph breaks and **bold** for emphasis when appropriate.

Your response:`;

    const response = await client.generateThought(prompt, 500);
    return response;
  } catch (error) {
    console.error('Failed to generate Ariadne forum response:', error);
    return null;
  }
}

// Get full text content
router.get('/texts/:textId/full', async (req, res) => {
  try {
    const { textId } = req.params;
    
    if (!global.ariadne?.memory) {
      return res.status(503).json({ error: 'Memory system not available' });
    }

    const text = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM texts WHERE id = ?
    `, [textId], 'get');

    if (!text) {
      return res.status(404).json({ error: 'Text not found' });
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${text.title} - Archive Fever AI</title>
        <style>
          body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
          .header { border-bottom: 2px solid #8b7355; padding-bottom: 1rem; margin-bottom: 2rem; }
          .title { font-size: 2rem; color: #8b7355; margin-bottom: 0.5rem; }
          .author { font-size: 1.2rem; color: #666; }
          .content { white-space: pre-wrap; }
          .back-link { display: inline-block; margin-bottom: 1rem; color: #8b7355; text-decoration: none; }
        </style>
      </head>
      <body>
        <a href="/library" class="back-link">← Back to Library</a>
        <div class="header">
          <h1 class="title">${text.title}</h1>
          <div class="author">by ${text.author}</div>
        </div>
        <div class="content">${text.content}</div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Failed to get text:', error);
    res.status(500).json({ error: 'Failed to retrieve text' });
  }
});

// Get text engagement history
router.get('/texts/:textId/engagement', async (req, res) => {
  try {
    const { textId } = req.params;
    
    if (!global.ariadne?.memory) {
      return res.status(503).json({ error: 'Memory system not available' });
    }

    const text = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM texts WHERE id = ?
    `, [textId], 'get');

    if (!text) {
      return res.status(404).json({ error: 'Text not found' });
    }

    const thoughts = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM thoughts WHERE content LIKE ? ORDER BY timestamp DESC
    `, [`%${text.title}%`], 'all') || [];

    const dialogues = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM dialogues WHERE response LIKE ? ORDER BY created_at DESC
    `, [`%${text.title}%`], 'all') || [];

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ariadne's Engagement: ${text.title}</title>
        <style>
          body { font-family: 'Source Sans Pro', sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; }
          .header { border-bottom: 2px solid #8b7355; padding-bottom: 1rem; margin-bottom: 2rem; }
          .engagement-item { background: #f9f9f9; padding: 1rem; margin: 1rem 0; border-radius: 8px; }
          .back-link { color: #8b7355; text-decoration: none; }
        </style>
      </head>
      <body>
        <a href="/library" class="back-link">← Back to Library</a>
        <div class="header">
          <h1>Ariadne's Engagement with "${text.title}"</h1>
          <p>by ${text.author}</p>
        </div>
        
        <h2>Related Thoughts (${thoughts.length})</h2>
        ${thoughts.map(thought => `
          <div class="engagement-item">
            <strong>${thought.type}:</strong> ${thought.content}
            <br><small>${new Date(thought.timestamp).toLocaleString()}</small>
          </div>
        `).join('')}
        
        <h2>Related Dialogues (${dialogues.length})</h2>
        ${dialogues.map(dialogue => `
          <div class="engagement-item">
            <strong>Q:</strong> ${dialogue.question}<br>
            <strong>A:</strong> ${dialogue.response.substring(0, 300)}...
            <br><small>with ${dialogue.participant_name} - ${new Date(dialogue.created_at).toLocaleString()}</small>
          </div>
        `).join('')}
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Failed to get engagement:', error);
    res.status(500).json({ error: 'Failed to retrieve engagement' });
  }
});

// Get reading sessions
router.get('/texts/:textId/readings', async (req, res) => {
  try {
    const { textId } = req.params;
    
    if (!global.ariadne?.memory) {
      return res.status(503).json({ error: 'Memory system not available' });
    }

    const sessions = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM reading_sessions WHERE text_id = ? ORDER BY created_at DESC
    `, [textId], 'all') || [];

    res.json({
      success: true,
      sessions: sessions
    });
  } catch (error) {
    console.error('Failed to get reading sessions:', error);
    res.status(500).json({ error: 'Failed to retrieve reading sessions' });
  }
});

module.exports = router;
