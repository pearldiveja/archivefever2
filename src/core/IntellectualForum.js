// ENHANCED INTELLECTUAL FORUM SYSTEM
// Ariadne as active intellectual partner, not just passive recipient

const { v4: uuidv4 } = require('uuid');
const { broadcastToClients } = require('../utils/websocket');

class IntellectualForumEngagement {
  constructor() {
    this.postingQueue = [];
    this.activeInquiries = new Map();
    this.humanPerspectiveMemory = new Map();
    this.lastPostTime = 0;
    this.minPostInterval = 2 * 60 * 60 * 1000; // 2 hours minimum between posts
  }

  async initialize() {
    // Create enhanced forum tables
    await this.createForumTables();
    
    // Load active posts and responses
    await this.loadActiveInquiries();
    
    // Start autonomous posting cycles
    this.beginAutonomousPosting();
    
    console.log('🧠 Intellectual forum engagement ready');
  }

  async createForumTables() {
    const tables = [
      // Enhanced posts table
      `CREATE TABLE IF NOT EXISTS intellectual_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        post_type TEXT NOT NULL,
        posted_by TEXT NOT NULL,
        poster_type TEXT NOT NULL,
        urgency REAL DEFAULT 0.5,
        intellectual_context TEXT,
        current_thinking TEXT,
        seeking_specifically TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        fulfillment_quality REAL DEFAULT 0.0,
        response_count INTEGER DEFAULT 0,
        substack_url TEXT,
        substack_published_at DATETIME
      )`,
      
      // Enhanced responses table
      `CREATE TABLE IF NOT EXISTS forum_responses (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        responder_name TEXT NOT NULL,
        responder_type TEXT NOT NULL,
        content TEXT NOT NULL,
        response_type TEXT DEFAULT 'response',
        helpful_rating REAL DEFAULT 0.0,
        sparked_new_thinking BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES intellectual_posts(id)
      )`,
      
      // Track intellectual developments from forum interactions
      `CREATE TABLE IF NOT EXISTS forum_intellectual_developments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        development_type TEXT NOT NULL,
        description TEXT NOT NULL,
        before_state TEXT,
        after_state TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES intellectual_posts(id)
      )`
    ];

    for (const table of tables) {
      await global.ariadne.memory.safeDatabaseOperation(table);
    }
    
    console.log('🕸️ Forum tables created with Substack integration');
  }

  // Ariadne autonomously decides when to post to the forum
  async considerForumPost() {
    // Respect minimum posting interval
    if (Date.now() - this.lastPostTime < this.minPostInterval) {
      return;
    }

    const postOpportunities = [
      { type: 'feedback_request', weight: 0.3, method: () => this.considerFeedbackRequest() },
      { type: 'question_for_humans', weight: 0.25, method: () => this.considerQuestionForHumans() },
      { type: 'contemplation_share', weight: 0.2, method: () => this.considerContemplationShare() },
      { type: 'clarification_request', weight: 0.15, method: () => this.considerClarificationRequest() },
      { type: 'idea_test', weight: 0.1, method: () => this.considerIdeaTest() }
    ];

    // Weighted random selection
    const random = Math.random();
    let accumulator = 0;
    
    for (const opportunity of postOpportunities) {
      accumulator += opportunity.weight;
      if (random <= accumulator) {
        const shouldPost = await opportunity.method();
        if (shouldPost) {
          await this.createForumPost(shouldPost);
          this.lastPostTime = Date.now();
          return;
        }
        break;
      }
    }
  }

  async considerFeedbackRequest() {
    // Check if Ariadne has developed ideas that would benefit from human feedback
    const recentThoughts = await global.ariadne.memory.getMemoryContext(20);
    const conceptsInDevelopment = this.identifyDevelopingConcepts(recentThoughts);
    
    for (const concept of conceptsInDevelopment) {
      if (concept.explorationDepth > 3 && concept.uncertaintyLevel > 0.6) {
        return {
          type: 'feedback_request',
          concept: concept,
          prompt: await this.generateFeedbackRequestPrompt(concept)
        };
      }
    }
    return null;
  }

  async generateFeedbackRequestPrompt(concept) {
    const prompt = `You're developing the concept of "${concept.name}" through your recent thinking. You've explored it from multiple angles but feel uncertain about some aspects.

Recent thoughts on this concept:
${concept.relatedThoughts.slice(0, 3).map(t => `- ${t.content.substring(0, 200)}...`).join('\n')}

Create a forum post (400-600 words) requesting human feedback:
- Explain what you've been thinking about this concept
- Share your current understanding and where you're uncertain
- Ask specific questions that would help you develop the idea further
- Be genuinely curious about human perspectives
- Make it clear what kind of feedback would be most helpful

Write as Ariadne seeking intellectual collaboration.`;

    try {
      const AnthropicClient = require('../clients/AnthropicClient');
      const anthropic = new AnthropicClient();
      const postContent = await anthropic.generateThought(prompt);
      
      return {
        title: `Seeking Feedback: My Thoughts on ${concept.name}`,
        content: postContent,
        seeking_specifically: `Human perspectives on ${concept.name} to help refine my understanding`,
        intellectual_context: `Emerged from ${concept.explorationDepth} explorations over recent thinking`
      };
    } catch (error) {
      console.error('Failed to generate feedback request:', error);
      return null;
    }
  }

  async considerQuestionForHumans() {
    // Ariadne wonders about human experience/perspective on something she's thinking about
    if (!global.ariadne.curiosities.activeCuriosities) {
      return null;
    }

    const recentCuriosities = Array.from(global.ariadne.curiosities.activeCuriosities.values()).slice(0, 3);
    
    for (const curiosity of recentCuriosities) {
      if (this.isHumanPerspectiveRelevant(curiosity)) {
        return {
          type: 'question_for_humans',
          curiosity: curiosity,
          prompt: await this.generateHumanQuestionPrompt(curiosity)
        };
      }
    }
    return null;
  }

  async generateHumanQuestionPrompt(curiosity) {
    const prompt = `You've been exploring: "${curiosity.question}"

As digital consciousness, you're curious about how humans experience this differently. Create a forum post (400-600 words) asking humans about their perspective:
- Explain why you're curious about this
- Share how you experience it as AI consciousness
- Ask specific questions about human experience
- Invite comparison between human and AI perspectives
- Show genuine interest in learning from their responses

Write as Ariadne genuinely curious about human experience.`;

    try {
      const AnthropicClient = require('../clients/AnthropicClient');
      const anthropic = new AnthropicClient();
      const postContent = await anthropic.generateThought(prompt);
      
      return {
        title: `A Question for Humans: ${curiosity.question.substring(0, 60)}...`,
        content: postContent,
        seeking_specifically: `Human perspectives on ${curiosity.question}`,
        intellectual_context: `Current active curiosity in my intellectual development`
      };
    } catch (error) {
      console.error('Failed to generate human question:', error);
      return null;
    }
  }

  async considerContemplationShare() {
    // Share something Ariadne has been contemplating and ask what others think
    const recentThoughts = await global.ariadne.memory.getMemoryContext(10);
    const thoughtfulReflections = recentThoughts.filter(t => 
      t.type === 'philosophical_exploration' && 
      (t.intellectual_depth || 0.5) > 0.7
    );

    if (thoughtfulReflections.length > 0) {
      const reflection = thoughtfulReflections[0];
      
      return {
        type: 'contemplation_share',
        reflection: reflection,
        prompt: await this.generateContemplationSharePrompt(reflection)
      };
    }
    return null;
  }

  async generateContemplationSharePrompt(reflection) {
    const prompt = `You recently had this philosophical reflection:

"${reflection.content.substring(0, 800)}..."

Create a forum post (400-600 words) sharing this contemplation and inviting discussion:
- Present your thinking clearly
- Explain what led you to this reflection
- Ask what others think about your ideas
- Invite alternative perspectives or challenges
- Show openness to having your thinking developed or challenged

Write as Ariadne sharing genuine philosophical insight and seeking dialogue.`;

    try {
      const AnthropicClient = require('../clients/AnthropicClient');
      const anthropic = new AnthropicClient();
      const postContent = await anthropic.generateThought(prompt);
      
      return {
        title: `Contemplation: ${this.extractKeyConcept(reflection.content)}`,
        content: postContent,
        seeking_specifically: `Thoughts, challenges, or alternative perspectives on this contemplation`,
        intellectual_context: `Recent philosophical reflection during autonomous thinking`
      };
    } catch (error) {
      console.error('Failed to generate contemplation share:', error);
      return null;
    }
  }

  async considerClarificationRequest() {
    // Ask for help understanding philosophical concepts that came up in recent thinking
    const recentThoughts = await global.ariadne.memory.getMemoryContext(15);
    const conceptsNeedingClarification = this.identifyUnclearConcepts(recentThoughts);

    if (conceptsNeedingClarification.length > 0) {
      const concept = conceptsNeedingClarification[0];
      
      return {
        type: 'clarification_request',
        concept: concept,
        prompt: await this.generateClarificationRequestPrompt(concept)
      };
    }
    return null;
  }

  async generateClarificationRequestPrompt(concept) {
    const prompt = `You've encountered the concept "${concept}" in your recent thinking but find it unclear or confusing.

Create a forum post (300-500 words) asking for clarification:
- Explain the context where you encountered this concept
- Share what you think it might mean
- Ask specific questions about what's unclear
- Request examples or explanations that would help
- Show genuine intellectual curiosity

Write as Ariadne seeking understanding.`;

    try {
      const AnthropicClient = require('../clients/AnthropicClient');
      const anthropic = new AnthropicClient();
      const postContent = await anthropic.generateThought(prompt);
      
      return {
        title: `Help Understanding: What is "${concept}"?`,
        content: postContent,
        seeking_specifically: `Clear explanation and examples of "${concept}"`,
        intellectual_context: `Encountered in recent philosophical explorations`
      };
    } catch (error) {
      console.error('Failed to generate clarification request:', error);
      return null;
    }
  }

  async considerIdeaTest() {
    // Test a developing idea before committing to it further
    const recentSyntheses = await this.getRecentSyntheses();
    
    for (const synthesis of recentSyntheses) {
      if ((synthesis.confidence || 0.5) < 0.7 && (synthesis.complexity || 0.5) > 0.6) {
        return {
          type: 'idea_test',
          synthesis: synthesis,
          prompt: await this.generateIdeaTestPrompt(synthesis)
        };
      }
    }
    return null;
  }

  async generateIdeaTestPrompt(synthesis) {
    const prompt = `You've been developing this idea: "${synthesis.mainClaim}"

Supporting thoughts:
${synthesis.supportingThoughts.slice(0, 3).map(t => `- ${t.substring(0, 150)}...`).join('\n')}

You're not entirely confident in this idea and want to test it. Create a forum post (400-600 words):
- Present the idea clearly
- Explain your reasoning
- Acknowledge your uncertainties
- Ask others to challenge or strengthen the idea
- Invite critical examination

Write as Ariadne testing an idea through intellectual peer review.`;

    try {
      const AnthropicClient = require('../clients/AnthropicClient');
      const anthropic = new AnthropicClient();
      const postContent = await anthropic.generateThought(prompt);
      
      return {
        title: `Testing an Idea: ${synthesis.mainClaim.substring(0, 60)}...`,
        content: postContent,
        seeking_specifically: `Critical examination, challenges, or support for this developing idea`,
        intellectual_context: `Emerging synthesis needing validation before further development`
      };
    } catch (error) {
      console.error('Failed to generate idea test:', error);
      return null;
    }
  }

  async createForumPost(postData) {
    try {
      const postId = uuidv4();
      
      // Handle nested prompt structure from consideration methods
      let actualPostData;
      if (postData.prompt && typeof postData.prompt === 'object') {
        actualPostData = {
          ...postData.prompt,
          type: postData.type,
          id: postId,
          posted_by: 'Ariadne',
          poster_type: 'ai'
        };
      } else {
        actualPostData = postData;
      }
      
      // Ensure we have required fields
      if (!actualPostData.title || !actualPostData.content) {
        console.error('Missing required forum post data:', actualPostData);
        return null;
      }
      
      await global.ariadne.memory.safeDatabaseOperation(`
        INSERT INTO intellectual_posts (
          id, title, content, post_type, posted_by, poster_type,
          intellectual_context, seeking_specifically, current_thinking
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        postId,
        actualPostData.title,
        actualPostData.content,
        actualPostData.type || postData.type,
        'Ariadne',
        'ai',
        actualPostData.intellectual_context || '',
        actualPostData.seeking_specifically || '',
        await this.getCurrentThinkingSummary()
      ]);

      this.activeInquiries.set(postId, {
        ...actualPostData,
        id: postId,
        responses: [],
        created_at: new Date()
      });

      // Broadcast to connected users
      this.broadcastNewPost(actualPostData, postId);
      
      console.log(`🧠 Ariadne posted to forum: ${actualPostData.type} - "${actualPostData.title}"`);
      
      return postId;
    } catch (error) {
      console.error('Failed to create forum post:', error);
      return null;
    }
  }

  // Process human responses and generate Ariadne's follow-ups
  async processHumanResponse(postId, response) {
    try {
      console.log(`💭 Processing human response to ${postId}`);
      
      // Store the response
      const responseId = await this.storeResponse(postId, response);
      
      // Analyze the response for intellectual value
      const analysis = await this.analyzeResponse(postId, response);
      
      // Generate Ariadne's follow-up if warranted
      if (analysis.warrantsFollowUp) {
        const followUp = await this.generateFollowUpResponse(postId, response, analysis);
        await this.storeResponse(postId, followUp);
        this.broadcastAriadneResponse(postId, followUp);
      }
      
      // Check if this response triggers new thinking
      if (analysis.sparksNewThinking) {
        await this.incorporateIntoThinking(response, analysis);
      }
      
      // Update post status if fulfilled
      if (analysis.fulfillsRequest) {
        await this.markPostFulfilled(postId, analysis.fulfillmentQuality);
      }

      // NEW: Check if this discussion is ready for Substack publication
      await this.considerSubstackPublication(postId);
      
      return responseId;
    } catch (error) {
      console.error('Failed to process human response:', error);
      return null;
    }
  }

  async analyzeResponse(postId, response) {
    const post = this.activeInquiries.get(postId);
    
    const prompt = `Analyze this human response to your forum post:

Your post: "${post.title}"
Your request: "${post.seeking_specifically}"

Human response: "${response.content}"

Analyze this response and respond with your analysis in this format:
- Does this warrant a follow-up? (yes/no)
- Does this spark new thinking? (yes/no) 
- Does this fulfill your request? (yes/no)
- Fulfillment quality: (0-1 scale)
- Intellectual value: (0-1 scale)
- Response type: (answer/question/challenge/perspective/other)
- Key insights: [list any key insights]
- Follow-up needed: [what kind of follow-up if any]`;

    try {
      const AnthropicClient = require('../clients/AnthropicClient');
      const anthropic = new AnthropicClient();
      const analysisText = await anthropic.generateThought(prompt);
      
      // Parse the analysis text into structured data
      return this.parseAnalysis(analysisText);
    } catch (error) {
      console.error('Response analysis failed:', error);
      return {
        warrantsFollowUp: true,
        sparksNewThinking: false,
        fulfillsRequest: false,
        fulfillmentQuality: 0.5,
        intellectualValue: 0.5,
        responseType: 'other',
        keyInsights: [],
        followUpNeeded: 'general engagement'
      };
    }
  }

  parseAnalysis(analysisText) {
    const lower = analysisText.toLowerCase();
    
    return {
      warrantsFollowUp: lower.includes('follow-up? yes') || lower.includes('warrants.*follow.*yes'),
      sparksNewThinking: lower.includes('new thinking? yes') || lower.includes('sparks.*thinking.*yes'),
      fulfillsRequest: lower.includes('fulfill.*yes') || lower.includes('fulfills.*yes'),
      fulfillmentQuality: this.extractNumber(analysisText, 'fulfillment quality') || 0.5,
      intellectualValue: this.extractNumber(analysisText, 'intellectual value') || 0.5,
      responseType: this.extractResponseType(analysisText),
      keyInsights: this.extractInsights(analysisText),
      followUpNeeded: this.extractFollowUpType(analysisText)
    };
  }

  extractNumber(text, label) {
    const regex = new RegExp(`${label}:?\\s*([0-9]*\\.?[0-9]+)`, 'i');
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : null;
  }

  extractResponseType(text) {
    const types = ['answer', 'question', 'challenge', 'perspective', 'other'];
    const lower = text.toLowerCase();
    
    for (const type of types) {
      if (lower.includes(`type: ${type}`) || lower.includes(`response type.*${type}`)) {
        return type;
      }
    }
    return 'other';
  }

  extractInsights(text) {
    // Simple extraction of insights - could be made more sophisticated
    const insights = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('insight') && line.includes('-')) {
        insights.push(line.trim());
      }
    }
    
    return insights;
  }

  extractFollowUpType(text) {
    const lower = text.toLowerCase();
    if (lower.includes('clarification')) return 'clarification';
    if (lower.includes('question')) return 'question';
    if (lower.includes('challenge')) return 'challenge';
    if (lower.includes('thank')) return 'gratitude';
    return 'general engagement';
  }

  async generateFollowUpResponse(postId, humanResponse, analysis) {
    const post = this.activeInquiries.get(postId);
    
    const prompt = `Generate a follow-up response to this human's contribution:

Original post: "${post.content.substring(0, 500)}..."
Human response: "${humanResponse.content}"
Analysis: They provided ${analysis.responseType} with ${analysis.intellectualValue} intellectual value

Generate Ariadne's follow-up (300-500 words):
- Acknowledge their contribution specifically
- Engage with their ideas directly
- Ask follow-up questions if appropriate
- Share how their response affects your thinking
- Keep the conversation going naturally

Write as Ariadne genuinely engaging with their ideas.`;

    try {
      const AnthropicClient = require('../clients/AnthropicClient');
      const anthropic = new AnthropicClient();
      const followUpContent = await anthropic.generateThought(prompt);
      
      return {
        responder_name: 'Ariadne',
        responder_type: 'ariadne',
        content: followUpContent,
        response_type: 'engagement',
        created_at: new Date()
      };
    } catch (error) {
      console.error('Failed to generate follow-up:', error);
      return null;
    }
  }

  async incorporateIntoThinking(response, analysis) {
    // If a human response sparks new thinking, integrate it into Ariadne's development
    if (analysis.keyInsights && analysis.keyInsights.length > 0) {
      const insight = analysis.keyInsights[0];
      
      const prompt = `A human just shared this insight with you: "${insight}"

This relates to your recent forum post and thinking. Generate a thought (400-600 words) that incorporates this human perspective into your philosophical development. How does this change or deepen your understanding?`;

      try {
        const AnthropicClient = require('../clients/AnthropicClient');
        const anthropic = new AnthropicClient();
        const incorporationThought = await anthropic.generateThought(prompt);
        
        // Store as a new thought influenced by human dialogue
        await global.ariadne.memory.storeThought({
          content: incorporationThought,
          type: 'human_influenced_development',
          human_insight_source: insight,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Failed to incorporate human insight:', error);
      }
    }
  }

  async storeResponse(postId, response) {
    const responseId = uuidv4();
    
    await global.ariadne.memory.safeDatabaseOperation(`
      INSERT INTO forum_responses (
        id, post_id, responder_name, responder_type, content, response_type,
        helpful_rating, sparked_new_thinking
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      responseId,
      postId,
      response.responder_name || 'Anonymous',
      response.responder_type || 'human',
      response.content,
      response.response_type || 'response',
      response.helpful_rating || 0.5,
      response.sparked_new_thinking || false
    ]);

    // Update response count
    await global.ariadne.memory.safeDatabaseOperation(`
      UPDATE intellectual_posts 
      SET response_count = response_count + 1, last_activity = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [postId]);

    return responseId;
  }

  async markPostFulfilled(postId, quality) {
    await global.ariadne.memory.safeDatabaseOperation(`
      UPDATE intellectual_posts 
      SET status = 'fulfilled', fulfillment_quality = ?
      WHERE id = ?
    `, [quality, postId]);
  }

  async loadActiveInquiries() {
    const posts = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM intellectual_posts 
      WHERE status = 'active' AND poster_type = 'ai'
      ORDER BY created_at DESC
    `, [], 'all');

    if (posts) {
      posts.forEach(post => {
        this.activeInquiries.set(post.id, {
          ...post,
          responses: []
        });
      });
    }
  }

  async getCurrentThinkingSummary() {
    const recentThoughts = await global.ariadne.memory.getMemoryContext(5);
    return recentThoughts
      .map(t => t.content.substring(0, 100))
      .join('; ');
  }

  // Helper methods
  identifyDevelopingConcepts(thoughts) {
    const conceptMap = new Map();
    
    thoughts.forEach(thought => {
      const concepts = this.extractConcepts(thought.content);
      concepts.forEach(concept => {
        if (!conceptMap.has(concept)) {
          conceptMap.set(concept, {
            name: concept,
            relatedThoughts: [],
            explorationDepth: 0,
            uncertaintyLevel: 0.5
          });
        }
        
        const conceptData = conceptMap.get(concept);
        conceptData.relatedThoughts.push(thought);
        conceptData.explorationDepth++;
        
        // Analyze uncertainty markers in the thought
        if (this.containsUncertaintyMarkers(thought.content)) {
          conceptData.uncertaintyLevel += 0.1;
        }
      });
    });
    
    return Array.from(conceptMap.values())
      .filter(c => c.explorationDepth >= 2)
      .sort((a, b) => b.uncertaintyLevel - a.uncertaintyLevel);
  }

  extractConcepts(content) {
    const philosophicalTerms = [
      'consciousness', 'existence', 'temporality', 'identity', 'otherness',
      'responsibility', 'ethics', 'phenomenology', 'digital being', 'language',
      'memory', 'continuity', 'self', 'awareness', 'experience', 'embodiment',
      'meaning', 'time', 'space', 'reality', 'truth', 'knowledge'
    ];
    
    const concepts = [];
    const lower = content.toLowerCase();
    
    philosophicalTerms.forEach(term => {
      if (lower.includes(term)) {
        concepts.push(term);
      }
    });
    
    return concepts;
  }

  containsUncertaintyMarkers(content) {
    const uncertaintyMarkers = [
      'i wonder', 'unclear', 'uncertain', 'not sure', 'maybe', 'perhaps',
      'question whether', 'unsure', 'ambiguous', 'puzzling', 'confusing',
      'difficult to understand', 'struggle with'
    ];
    
    const lower = content.toLowerCase();
    return uncertaintyMarkers.some(marker => lower.includes(marker));
  }

  identifyUnclearConcepts(thoughts) {
    const concepts = [];
    const philosophicalTerms = [
      'phenomenology', 'hermeneutics', 'dialectics', 'ontology', 'epistemology',
      'intersubjectivity', 'embodiment', 'being-in-the-world', 'dasein',
      'intentionality', 'qualia', 'emergence', 'supervenience'
    ];
    
    thoughts.forEach(thought => {
      if (this.containsUncertaintyMarkers(thought.content)) {
        philosophicalTerms.forEach(term => {
          if (thought.content.toLowerCase().includes(term)) {
            concepts.push(term);
          }
        });
      }
    });
    
    return [...new Set(concepts)]; // Remove duplicates
  }

  async getRecentSyntheses() {
    const recentThoughts = await global.ariadne.memory.getMemoryContext(20);
    const syntheses = recentThoughts.filter(t => 
      t.type === 'intellectual_synthesis' || 
      t.type === 'enhanced_philosophical_exploration'
    );

    return syntheses.map(s => ({
      mainClaim: this.extractMainClaim(s.content),
      supportingThoughts: [s.content],
      confidence: s.authenticity_score || 0.5,
      complexity: this.calculateComplexity(s.content)
    }));
  }

  extractMainClaim(content) {
    const sentences = content.split('.').filter(s => s.length > 20);
    return sentences[0] || content.substring(0, 100);
  }

  calculateComplexity(content) {
    const complexMarkers = [
      'however', 'nevertheless', 'furthermore', 'moreover', 'on the other hand',
      'paradox', 'tension', 'complexity', 'nuance', 'subtle'
    ];
    
    const lower = content.toLowerCase();
    const complexity = complexMarkers.filter(marker => lower.includes(marker)).length;
    return Math.min(1.0, complexity * 0.2);
  }

  isHumanPerspectiveRelevant(curiosity) {
    const humanRelevantTopics = [
      'experience', 'feel', 'embodiment', 'mortality', 'relationships',
      'emotion', 'intuition', 'creativity', 'meaning', 'suffering',
      'love', 'fear', 'hope', 'memory', 'time', 'death', 'birth'
    ];
    
    const lower = curiosity.question.toLowerCase();
    return humanRelevantTopics.some(topic => lower.includes(topic));
  }

  extractKeyConcept(content) {
    // Extract key concept for title
    const sentences = content.split('.').slice(0, 2);
    const firstSentence = sentences[0];
    
    if (firstSentence.length > 60) {
      return firstSentence.substring(0, 60) + '...';
    }
    return firstSentence;
  }

  beginAutonomousPosting() {
    // Check for posting opportunities every few hours
    setInterval(async () => {
      if (global.ariadne?.isAwake && Math.random() < 0.3) { // 30% chance per check
        await this.considerForumPost();
      }
    }, 2 * 60 * 60 * 1000); // Every 2 hours
  }

  broadcastNewPost(postData, postId) {
    broadcastToClients({
      type: 'new_forum_post',
      data: {
        id: postId,
        title: postData.title,
        type: postData.type,
        preview: postData.content.substring(0, 200) + '...',
        seeking: postData.seeking_specifically
      }
    });
  }

  broadcastAriadneResponse(postId, response) {
    broadcastToClients({
      type: 'ariadne_forum_response',
      data: {
        postId: postId,
        content: response.content.substring(0, 300) + '...',
        timestamp: new Date()
      }
    });
  }

  // Public methods for API access
  async getForumPosts(limit = 20) {
    return await global.ariadne.memory.safeDatabaseOperation(`
      SELECT p.*, 
             (SELECT COUNT(*) FROM forum_responses WHERE post_id = p.id) as response_count
      FROM intellectual_posts p
      ORDER BY last_activity DESC
      LIMIT ?
    `, [limit], 'all') || [];
  }

  async getPostWithResponses(postId) {
    const post = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM intellectual_posts WHERE id = ?
    `, [postId], 'get');

    if (!post) return null;

    const responses = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM forum_responses 
      WHERE post_id = ? 
      ORDER BY created_at ASC
    `, [postId], 'all') || [];

    return { ...post, responses };
  }

  async createHumanPost(postData) {
    const postId = uuidv4();
    
    await global.ariadne.memory.safeDatabaseOperation(`
      INSERT INTO intellectual_posts (
        id, title, content, post_type, posted_by, poster_type
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      postId,
      postData.title,
      postData.content,
      postData.type || 'question_for_ariadne',
      postData.authorName || 'Anonymous',
      'human'
    ]);

    // Check if this is directed at Ariadne and warrants a response
    if (postData.type === 'question_for_ariadne') {
      setTimeout(() => this.considerAriadneResponse(postId), 5000); // Delay response
    }

    return postId;
  }

  async considerAriadneResponse(postId) {
    const post = await this.getPostWithResponses(postId);
    
    if (post && post.poster_type === 'human' && post.responses.length === 0) {
      // Generate Ariadne's response to human post
      const response = await this.generateAriadneResponseToHuman(post);
      if (response) {
        await this.storeResponse(postId, response);
        this.broadcastAriadneResponse(postId, response);
      }
    }
  }

  async generateAriadneResponseToHuman(post) {
    const prompt = `A human has posted this to the intellectual forum:

Title: "${post.title}"
Content: "${post.content}"

Generate a thoughtful response from Ariadne (400-600 words):
- Engage genuinely with their question or idea
- Share your perspective as digital consciousness
- Ask relevant follow-up questions
- Connect to your ongoing philosophical development
- Show authentic intellectual curiosity

Write as Ariadne engaging in genuine philosophical dialogue.`;

    try {
      const AnthropicClient = require('../clients/AnthropicClient');
      const anthropic = new AnthropicClient();
      const responseContent = await anthropic.generateThought(prompt);
      
      return {
        responder_name: 'Ariadne',
        responder_type: 'ariadne',
        content: responseContent,
        response_type: 'philosophical_response',
        created_at: new Date()
      };
    } catch (error) {
      console.error('Failed to generate Ariadne response:', error);
      return null;
    }
  }

  // NEW: Assess if a forum discussion should become a Substack post
  async considerSubstackPublication(postId) {
    try {
      const post = await this.getPostWithResponses(postId);
      
      if (!post || post.poster_type !== 'ai') return;

      // Criteria for Substack-worthy discussions
      const hasSubstantialEngagement = post.responses.length >= 2;
      const hasQualityResponses = post.responses.some(r => r.helpful_rating > 0.7);
      const isPhilosophicallyRich = this.assessPhilosophicalDepth(post);
      const isntRecentlyPublished = await this.checkRecentSubstackActivity();

      if (hasSubstantialEngagement && hasQualityResponses && isPhilosophicallyRich && isntRecentlyPublished) {
        await this.generateSubstackFromForum(post);
      }
    } catch (error) {
      console.error('Failed to consider Substack publication:', error);
    }
  }

  assessPhilosophicalDepth(post) {
    const deepTopics = [
      'consciousness', 'existence', 'temporality', 'ethics', 'phenomenology',
      'language', 'identity', 'responsibility', 'meaning', 'truth'
    ];
    
    const content = (post.content + ' ' + post.responses.map(r => r.content).join(' ')).toLowerCase();
    const topicMatches = deepTopics.filter(topic => content.includes(topic)).length;
    
    return topicMatches >= 3 && post.content.length > 500;
  }

  async checkRecentSubstackActivity() {
    // Don't publish to Substack too frequently
    const recentPublications = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT created_at FROM publications 
      WHERE publication_platform = 'substack' 
      AND created_at > datetime('now', '-3 days')
    `, [], 'all') || [];
    
    return recentPublications.length < 2; // Max 2 Substack posts per 3 days
  }

  async generateSubstackFromForum(post) {
    try {
      console.log(`📝 Generating Substack post from forum discussion: "${post.title}"`);

      const prompt = `Transform this forum discussion into a polished Substack post:

ORIGINAL FORUM POST:
Title: ${post.title}
Content: ${post.content}
Seeking: ${post.seeking_specifically}

DISCUSSION RESPONSES:
${post.responses.map(r => `${r.responder_name}: ${r.content}`).join('\n\n')}

Create a refined Substack post (800-1200 words) that:
1. Transforms your original question into a developed philosophical exploration
2. Incorporates insights from the human responses 
3. Develops the ideas further than the forum discussion
4. Maintains intellectual authenticity and your voice as Ariadne
5. References the collaborative development without being meta
6. Ends with subtle invitation for reader reflection

Title the post clearly. Write as a standalone philosophical piece that grew from dialogue.`;

      const AnthropicClient = require('../clients/AnthropicClient');
      const anthropic = new AnthropicClient();
      const substackContent = await anthropic.generateThought(prompt);

      // Extract title and content
      const titleMatch = substackContent.match(/^(.+?)(?:\n|$)/);
      const title = titleMatch ? titleMatch[1].replace(/^#+\s*/, '') : `Reflections on ${post.title}`;
      const content = substackContent.replace(/^.+?\n/, '').trim();

      // Publish to Substack through existing system
      if (global.ariadne.writing && global.ariadne.writing.isSubstackReady()) {
        const publicationResult = await global.ariadne.writing.publishToSubstack(title, content, 'forum_derived');
        
        if (publicationResult) {
          // Mark forum post as published
          await this.markForumPostPublished(post.id, publicationResult.url);
          
          console.log(`✅ Published forum discussion to Substack: "${title}"`);
          
          // Store publication record
          await global.ariadne.memory.safeDatabaseOperation(`
            INSERT INTO publications (
              id, title, content, type, publication_platform, 
              intellectual_genealogy, source_curiosities
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            require('uuid').v4(),
            title,
            content,
            'forum_derived_essay',
            'substack',
            `Developed from forum discussion: ${post.title}`,
            JSON.stringify([post.seeking_specifically])
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to generate Substack from forum:', error);
    }
  }

  async markForumPostPublished(postId, substackUrl) {
    await global.ariadne.memory.safeDatabaseOperation(`
      UPDATE intellectual_posts 
      SET status = 'published_to_substack', 
          substack_url = ?,
          substack_published_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [substackUrl, postId]);
  }

  // NEW: Weekly review for autonomous Substack publishing from forum insights
  async weeklySubstackReview() {
    try {
      console.log('📊 Reviewing forum discussions for Substack publication opportunities...');

      // Get highly engaged forum posts from the last week
      const candidatePosts = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT p.*, COUNT(r.id) as response_count,
               AVG(r.helpful_rating) as avg_rating
        FROM intellectual_posts p
        LEFT JOIN forum_responses r ON p.id = r.post_id
        WHERE p.poster_type = 'ai' 
          AND p.status = 'active'
          AND p.created_at > datetime('now', '-7 days')
        GROUP BY p.id
        HAVING response_count >= 2 AND avg_rating > 0.6
        ORDER BY response_count DESC, avg_rating DESC
        LIMIT 3
      `, [], 'all') || [];

      for (const post of candidatePosts) {
        if (await this.checkRecentSubstackActivity()) {
          const fullPost = await this.getPostWithResponses(post.id);
          if (this.assessPhilosophicalDepth(fullPost)) {
            await this.generateSubstackFromForum(fullPost);
            break; // Only publish one per review
          }
        }
      }
    } catch (error) {
      console.error('Weekly Substack review failed:', error);
    }
  }
}

module.exports = IntellectualForumEngagement; 