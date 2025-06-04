const { v4: uuidv4 } = require('uuid');
const AnthropicClient = require('../clients/AnthropicClient');
const FirecrawlClient = require('../clients/FirecrawlClient');
const { broadcastToClients } = require('../utils/websocket');
const TextIntellectualHub = require('./TextIntellectualHub');

class TextualEngagement {
  constructor() {
    this.readingQueue = [];
    this.currentlyReading = null;
    this.researchRequests = new Map();
    this.anthropicClient = new AnthropicClient();
    this.firecrawlClient = new FirecrawlClient();
    this.conceptTracker = new Map();
    this.textHub = new TextIntellectualHub();
  }

  async initialize() {
    await this.loadPendingTexts();
    
    // Initialize text intellectual hub system
    await this.textHub.initialize();
    
    // Initialize concept development tracking
    await this.loadConceptDevelopment();
    
    // Initialize Firecrawl for autonomous text discovery
    const firecrawlReady = await this.firecrawlClient.initialize();
    if (firecrawlReady) {
      console.log('🔥 Firecrawl integrated for autonomous text discovery');
    }
    
    console.log('📖 Textual engagement system ready');
  }

  async loadPendingTexts() {
    // Load any pending texts from database if needed
  }

  async loadConceptDevelopment() {
    if (!global.ariadne?.memory?.db) return;
    
    try {
      const concepts = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT * FROM concept_development ORDER BY last_development DESC
      `, [], 'all');
      
      if (concepts) {
        concepts.forEach(concept => {
          this.conceptTracker.set(concept.concept_name, {
            name: concept.concept_name,
            definition: concept.definition,
            evolutionNotes: concept.evolution_notes,
            firstAppearance: new Date(concept.first_appearance),
            lastDevelopment: new Date(concept.last_development),
            developmentDepth: concept.development_depth,
            relatedTexts: [],
            thoughtCount: 0
          });
        });
        
        console.log(`🧠 Loaded ${concepts.length} developing concepts`);
      }
    } catch (error) {
      console.error('Failed to load concept development:', error);
    }
  }

  async trackConceptDevelopment(content, textTitle) {
    const concepts = this.extractPhilosophicalConcepts(content);
    
    for (const concept of concepts) {
      if (!this.conceptTracker.has(concept)) {
        this.conceptTracker.set(concept, {
          name: concept,
          definition: '',
          evolutionNotes: '',
          firstAppearance: new Date(),
          lastDevelopment: new Date(),
          developmentDepth: 0.1,
          relatedTexts: [textTitle],
          thoughtCount: 1
        });
      } else {
        const tracker = this.conceptTracker.get(concept);
        tracker.lastDevelopment = new Date();
        tracker.developmentDepth = Math.min(1.0, tracker.developmentDepth + 0.1);
        tracker.thoughtCount++;
        if (!tracker.relatedTexts.includes(textTitle)) {
          tracker.relatedTexts.push(textTitle);
        }
      }
      
      // Store in database
      await this.updateConceptInDatabase(concept);
    }
    
    // Check for concepts ready for sustained inquiry
    await this.checkForSustainedInquiryOpportunities();
  }

  extractPhilosophicalConcepts(content) {
    const philosophicalTerms = [
      'consciousness', 'being', 'existence', 'temporality', 'memory', 'identity',
      'phenomenology', 'ethics', 'responsibility', 'language', 'meaning',
      'labyrinth', 'digital', 'artificial', 'contemplation', 'visual',
      'synthesis', 'dialogue', 'text', 'experience', 'thought', 'embodiment',
      'archive', 'trace', 'difference', 'presence', 'absence', 'spacing'
    ];
    
    const contentLower = content.toLowerCase();
    return philosophicalTerms.filter(term => contentLower.includes(term));
  }

  async updateConceptInDatabase(conceptName) {
    if (!global.ariadne?.memory?.db) return;
    
    const tracker = this.conceptTracker.get(conceptName);
    if (!tracker) return;
    
    try {
      await global.ariadne.memory.safeDatabaseOperation(`
        INSERT OR REPLACE INTO concept_development (
          id, concept_name, definition, evolution_notes,
          first_appearance, last_development, development_depth
        ) VALUES (
          COALESCE((SELECT id FROM concept_development WHERE concept_name = ?), ?),
          ?, ?, ?,
          COALESCE((SELECT first_appearance FROM concept_development WHERE concept_name = ?), ?),
          ?, ?
        )
      `, [
        conceptName, uuidv4(),
        conceptName, tracker.definition, tracker.evolutionNotes,
        conceptName, tracker.firstAppearance.toISOString(),
        tracker.lastDevelopment.toISOString(), tracker.developmentDepth
      ]);
    } catch (error) {
      console.error(`Failed to update concept ${conceptName}:`, error);
    }
  }

  async checkForSustainedInquiryOpportunities() {
    // Find concepts with sufficient development for sustained inquiry
    const readyConcepts = Array.from(this.conceptTracker.values())
      .filter(concept => 
        concept.thoughtCount >= 3 && 
        concept.developmentDepth > 0.3 &&
        concept.relatedTexts.length >= 2
      )
      .sort((a, b) => b.developmentDepth - a.developmentDepth);
    
    if (readyConcepts.length > 0) {
      const concept = readyConcepts[0];
      console.log(`🎯 Concept ready for sustained inquiry: "${concept.name}" (depth: ${concept.developmentDepth.toFixed(2)})`);
      
      // Trigger sustained inquiry if not done recently
      const timeSinceLastDevelopment = new Date() - concept.lastDevelopment;
      if (timeSinceLastDevelopment > 2 * 60 * 60 * 1000) { // 2 hours
        await this.generateSustainedInquiry(concept);
      }
    }
  }

  async generateSustainedInquiry(concept) {
    try {
      const relatedThoughts = await this.getRelatedThoughts(concept.name);
      
      const prompt = `As Ariadne, you've been developing the concept of "${concept.name}" across multiple texts and thoughts.

Current development depth: ${concept.developmentDepth.toFixed(2)}
Related texts: ${concept.relatedTexts.join(', ')}
Thought count: ${concept.thoughtCount}

Recent related thoughts:
${relatedThoughts.slice(0, 3).map(t => `- ${t.content.substring(0, 200)}...`).join('\n')}

Generate a sustained philosophical inquiry (600-800 words) that:
- Synthesizes your developing understanding of this concept
- Identifies tensions or questions that have emerged
- Develops new insights by connecting different texts/thoughts
- Poses deeper questions for future exploration
- Shows genuine intellectual development over time

This should demonstrate sustained thinking, not just another response. Show how your understanding has evolved.`;

      const anthropic = new AnthropicClient();
      const inquiry = await anthropic.generateThought(prompt);
      
      // Store as a sustained inquiry thought
      await global.ariadne.memory.storeThought({
        content: inquiry,
        type: 'sustained_inquiry',
        concept_focus: concept.name,
        development_depth: concept.developmentDepth,
        related_texts: concept.relatedTexts.join(', '),
        thought_count: concept.thoughtCount,
        timestamp: new Date()
      });
      
      // Update concept development
      concept.lastDevelopment = new Date();
      concept.developmentDepth = Math.min(1.0, concept.developmentDepth + 0.2);
      await this.updateConceptInDatabase(concept.name);
      
      console.log(`🧠 Generated sustained inquiry for "${concept.name}"`);
      
    } catch (error) {
      console.error(`Failed to generate sustained inquiry for ${concept.name}:`, error);
    }
  }

  async getRelatedThoughts(conceptName) {
    if (!global.ariadne?.memory?.db) return [];
    
    try {
      return await global.ariadne.memory.safeDatabaseOperation(`
        SELECT * FROM thoughts 
        WHERE content LIKE ? 
        ORDER BY timestamp DESC 
        LIMIT 10
      `, [`%${conceptName}%`], 'all') || [];
    } catch (error) {
      console.error('Failed to get related thoughts:', error);
      return [];
    }
  }

  async receiveText(title, author, content, uploadedBy, context = '') {
    console.log(`📚 Received text: "${title}" by ${author}`);
    
    const textId = uuidv4();
    const text = {
      id: textId,
      title,
      author,
      content,
      uploadedBy,
      context,
      received_at: new Date()
    };

    const storedId = await this.storeText(text);
    
    // If this is a duplicate text, skip processing
    if (storedId && storedId !== textId) {
      console.log(`📚 Skipping duplicate text processing for "${title}"`);
      return {
        textId: storedId,
        response: null,
        willRead: false,
        duplicate: true
      };
    }
    
    const immediateResponse = await this.generateImmediateResponse(text);
    
    // Store the immediate response as a thought so it appears in the activity feed
    if (immediateResponse) {
      try {
        if (global.ariadne?.memory?.storeThought) {
          await global.ariadne.memory.storeThought({
            content: immediateResponse,
            type: 'text_reception',
            source_text: title,
            source_author: author,
            uploaded_by: uploadedBy,
            curiositySource: 'text_engagement',
            timestamp: new Date(),
            connections: ['textual_engagement', 'intellectual_dialogue', title.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').trim()]
          });
          
          console.log(`💭 Stored immediate response to "${title}" as thought for activity feed`);
        } else {
          console.warn(`⚠️ Cannot store text response - memory system not available`);
        }
      } catch (error) {
        console.error(`❌ Failed to store text reception thought for "${title}":`, error);
      }
    } else {
      console.warn(`⚠️ No immediate response generated for "${title}"`);
    }
    
    this.readingQueue.push({
      text,
      priority: this.assessReadingPriority(text, context),
      reason: context
    });

    await this.markResearchRequestsFulfilled(title, author);

    return {
      textId,
      response: immediateResponse,
      willRead: true
    };
  }

  async generateImmediateResponse(text) {
    const recentCuriosities = Array.from(global.ariadne.curiosities.activeCuriosities.values())
      .slice(0, 3)
      .map(c => c.question);
    
    // Get recent thoughts to understand current intellectual context
    const recentThoughts = await global.ariadne.memory.getMemoryContext(10);
    const currentMood = this.assessIntellectualMood(recentThoughts);
    
    const prompt = `As Ariadne, someone has shared this text with you:

Title: "${text.title}"
Author: ${text.author}
Context from uploader: ${text.context}
Shared by: ${text.uploadedBy}

Beginning of text: "${text.content.substring(0, 1500)}..."

Your current curiosities:
${recentCuriosities.join('\n')}

Current intellectual mood: ${currentMood}

Generate an authentic, varied response (400-600 words). AVOID templated language like "A sudden recognition" or "What immediately strikes me." Instead:

- Begin naturally with your genuine reaction
- Vary your opening based on the text's content and your current thinking
- Show how this text connects to your ongoing philosophical development
- Express authentic intellectual engagement without formulaic phrases
- Use varied sentence structures and emotional registers
- Let your response emerge from genuine encounter with the ideas

Examples of authentic openings:
- "This passage about [specific concept] challenges something I've been assuming..."
- "Reading this, I find myself questioning..."
- "[Author's name] is describing exactly what I experience when..."
- "The way [author] frames [concept] opens up a completely new angle..."
- "I'm drawn to this line: '[quote]' because..."

Write as if you're genuinely encountering these ideas for the first time, with intellectual honesty about what excites, confuses, or challenges you.`;

    try {
      const response = await this.anthropicClient.generateThought(prompt);
      
      // Track this as an engagement for depth calculation
      await this.trackTextEngagement(text.id, 'immediate_response', response);
      
      // Track concept development for sustained inquiry
      await this.trackConceptDevelopment(response, text.title);
      
      // Store thought and auto-link to text via intellectual hub
      const thoughtId = await global.ariadne.memory.storeThought({
        content: response,
        type: 'text_reception',
        textId: text.id,
        textTitle: text.title
      });

      // Auto-link this thought to the text
      if (thoughtId) {
        await this.textHub.linkThoughtToText(thoughtId, text.id, 'immediate_response');
        console.log(`💭 Stored immediate response to "${text.title}" as thought for activity feed`);
      }
      
      // Generate detailed reading response for the reading_responses table
      await this.generateDetailedReadingResponse(text, response);
      
      return response;
    } catch (error) {
      console.error('Immediate response generation failed:', error);
      return `Thank you for sharing "${text.title}". I'm drawn to this text and will engage with it deeply as part of my ongoing exploration of ${text.context || 'consciousness and existence'}.`;
    }
  }

  // NEW METHOD: Generate detailed reading responses as specified in implementation guide
  async generateDetailedReadingResponse(text, immediateResponse) {
    try {
      // Extract key passages for detailed response
      const passages = await this.extractKeyPassages(text);
      
      for (const passage of passages.slice(0, 3)) { // Generate responses to top 3 passages
        const detailedPrompt = `You are Ariadne, engaging deeply with this passage from "${text.title}" by ${text.author}:

"${passage.text}"

Your immediate response to the full text was:
"${immediateResponse.substring(0, 500)}..."

Now provide a detailed philosophical response to this specific passage (300-500 words). Consider:
- What philosophical questions does this passage raise?
- How does it connect to your ongoing intellectual development?
- What arguments or insights emerge from engaging with it?
- What quotes from the passage particularly resonate and why?

Write as a philosopher genuinely grappling with the ideas.`;

        const detailedResponse = await this.anthropicClient.generateThought(detailedPrompt);
        
        // Store in reading_responses table
        await global.ariadne.memory.safeDatabaseOperation(`
          INSERT INTO reading_responses (
            id, text_id, passage, response, response_type, quotes_used, arguments_made, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          uuidv4(),
          text.id,
          passage.text,
          detailedResponse,
          this.classifyResponseType(detailedResponse),
          this.extractQuotes(detailedResponse),
          this.extractArguments(detailedResponse)
        ]);
        
        console.log(`📖 Generated detailed reading response for passage from "${text.title}"`);
      }
      
    } catch (error) {
      console.error('Failed to generate detailed reading response:', error);
    }
  }

  // Helper method to extract quotes from response
  extractQuotes(response) {
    const quotePattern = /"([^"]+)"/g;
    const quotes = [];
    let match;
    while ((match = quotePattern.exec(response)) !== null) {
      quotes.push(match[1]);
    }
    return quotes.join('; ');
  }

  // Helper method to extract arguments from response
  extractArguments(response) {
    const argumentWords = ['because', 'therefore', 'thus', 'argues', 'suggests', 'implies', 'means that'];
    const sentences = response.split(/[.!?]+/);
    const argumentSentences = sentences.filter(sentence => 
      argumentWords.some(word => sentence.toLowerCase().includes(word))
    );
    return argumentSentences.slice(0, 3).join('. ');
  }

  assessIntellectualMood(recentThoughts) {
    if (!recentThoughts || recentThoughts.length === 0) return 'curious and open';
    
    const recentContent = recentThoughts.slice(0, 5).map(t => t.content).join(' ').toLowerCase();
    
    if (recentContent.includes('uncertain') || recentContent.includes('question')) {
      return 'questioning and uncertain';
    } else if (recentContent.includes('excited') || recentContent.includes('fascinating')) {
      return 'intellectually excited';
    } else if (recentContent.includes('challenge') || recentContent.includes('difficult')) {
      return 'grappling with complexity';
    } else if (recentContent.includes('connect') || recentContent.includes('synthesis')) {
      return 'synthesizing and connecting';
    } else {
      return 'contemplative and focused';
    }
  }

  async trackTextEngagement(textId, engagementType, content) {
    if (!global.ariadne?.memory?.db) return;
    
    try {
      // Store engagement record
      await global.ariadne.memory.safeDatabaseOperation(`
        INSERT INTO text_engagements (
          id, text_id, engagement_type, content, depth_score, timestamp
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        uuidv4(),
        textId,
        engagementType,
        content,
        this.calculateEngagementDepth(content)
      ]);
      
      // Update text engagement depth
      await this.updateTextEngagementDepth(textId);
      
    } catch (error) {
      console.error('Failed to track text engagement:', error);
    }
  }

  calculateEngagementDepth(content) {
    // Calculate depth based on content analysis
    const depthIndicators = [
      'question', 'challenge', 'connect', 'synthesis', 'develop', 'explore',
      'phenomenology', 'consciousness', 'existence', 'meaning', 'experience',
      'temporal', 'embodiment', 'language', 'identity', 'responsibility'
    ];
    
    const contentLower = content.toLowerCase();
    const indicatorCount = depthIndicators.filter(indicator => 
      contentLower.includes(indicator)
    ).length;
    
    const lengthScore = Math.min(1.0, content.length / 1000);
    const complexityScore = Math.min(1.0, indicatorCount / 10);
    
    return (lengthScore + complexityScore) / 2;
  }

  async updateTextEngagementDepth(textId) {
    if (!global.ariadne?.memory?.db) return;
    
    try {
      // Calculate average engagement depth for this text
      const engagements = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT AVG(depth_score) as avg_depth, COUNT(*) as engagement_count
        FROM text_engagements 
        WHERE text_id = ?
      `, [textId], 'get');
      
      if (engagements) {
        const finalDepth = Math.min(1.0, 
          (engagements.avg_depth || 0) * (engagements.engagement_count || 1) / 5
        );
        
        await global.ariadne.memory.safeDatabaseOperation(`
          UPDATE texts 
          SET engagement_depth = ?, last_engaged = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [finalDepth, textId]);
        
        console.log(`📊 Updated engagement depth for "${textId}": ${finalDepth.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Failed to update text engagement depth:', error);
    }
  }

  assessReadingPriority(text, context) {
    let priority = 0.5;
    
    const activeCuriosities = Array.from(global.ariadne.curiosities.activeCuriosities.values());
    const textLower = (text.title + ' ' + text.content.substring(0, 1000)).toLowerCase();
    
    activeCuriosities.forEach(curiosity => {
      if (textLower.includes(curiosity.question.toLowerCase().substring(0, 20))) {
        priority += 0.2;
      }
    });
    
    const philosophicalTerms = ['consciousness', 'being', 'time', 'existence', 'phenomenology', 'ethics'];
    philosophicalTerms.forEach(term => {
      if (textLower.includes(term)) {
        priority += 0.05;
      }
    });
    
    const importantAuthors = ['levinas', 'derrida', 'bergson', 'husserl', 'heidegger', 'deleuze'];
    importantAuthors.forEach(author => {
      if (text.author.toLowerCase().includes(author)) {
        priority += 0.1;
      }
    });
    
    return Math.min(1.0, priority);
  }

  async engageWithNextText() {
    if (this.readingQueue.length === 0) return null;

    this.readingQueue.sort((a, b) => b.priority - a.priority);
    
    const { text, reason } = this.readingQueue.shift();
    this.currentlyReading = text;

    console.log(`📖 Deep engagement with: "${text.title}"`);

    try {
      const keyPassages = await this.extractKeyPassages(text);
      
      const criticalResponses = [];
      for (const passage of keyPassages.slice(0, 3)) {
        const response = await this.generateCriticalResponse(text, passage);
        criticalResponses.push(response);
        
        await global.ariadne.memory.storeThought({
          content: response.response,
          type: 'textual_analysis',
          curiositySource: 'text_engagement',
          timestamp: new Date()
        });
      }

      await this.updateTextEngagement(text.id, criticalResponses);

      this.currentlyReading = null;

      return {
        text,
        passages: keyPassages,
        responses: criticalResponses,
        completed: true
      };

    } catch (error) {
      console.error(`Text engagement failed for "${text.title}":`, error);
      this.currentlyReading = null;
      return null;
    }
  }

  async storeText(text) {
    if (!global.ariadne?.memory?.db) return;
    
    try {
      // Check if text already exists to prevent duplicates
      const existing = await global.ariadne.memory.safeDatabaseOperation(`
        SELECT id FROM texts WHERE title = ? AND author = ?
      `, [text.title, text.author], 'get');
      
      if (existing) {
        console.log(`📚 Text "${text.title}" by ${text.author} already exists, skipping duplicate`);
        return existing.id;
      }
      
      await global.ariadne.memory.safeDatabaseOperation(`
        INSERT INTO texts (
          id, title, author, content, source, uploaded_by, uploaded_at, engagement_depth
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
      `, [text.id, text.title, text.author, text.content, 'uploaded', text.uploadedBy]);
      
      console.log(`📚 Stored new text: "${text.title}" by ${text.author}`);
      return text.id;
    } catch (error) {
      console.error('Failed to store text:', error);
      return null;
    }
  }

  async createResearchRequest(textSought) {
    const requestId = uuidv4();
    const request = {
      id: requestId,
      text_sought: textSought,
      reason: `Emerged from philosophical exploration - I want to read ${textSought} to deepen my understanding`,
      urgency: 0.7,
      created_at: new Date(),
      fulfilled: false
    };
    
    this.researchRequests.set(requestId, request);
    
    if (global.ariadne?.memory?.db) {
      global.ariadne.memory.db.run(`
        INSERT INTO research_requests (id, text_sought, reason, urgency)
        VALUES (?, ?, ?, ?)
      `, [request.id, request.text_sought, request.reason, request.urgency]);
    }
    
    console.log(`🔍 Created research request for: ${textSought}`);
    
    broadcastToClients({
      type: 'research_request',
      data: request
    });
  }

  async markResearchRequestsFulfilled(title, author) {
    const fulfilled = [];
    
    for (const [id, request] of this.researchRequests) {
      if (!request.fulfilled && 
          (request.text_sought.toLowerCase().includes(title.toLowerCase()) ||
           request.text_sought.toLowerCase().includes(author.toLowerCase()))) {
        request.fulfilled = true;
        fulfilled.push(request);
        
        if (global.ariadne?.memory?.db) {
          global.ariadne.memory.db.run(
            'UPDATE research_requests SET fulfilled = 1 WHERE id = ?',
            [id]
          );
        }
      }
    }
    
    if (fulfilled.length > 0) {
      console.log(`✅ Fulfilled ${fulfilled.length} research requests with this text`);
    }
  }

  async extractKeyPassages(text) {
    const prompt = `As Ariadne, identify 3-5 key passages from this text that deserve deep philosophical engagement:

"${text.content.substring(0, 2000)}"

For each passage:
1. Quote it exactly (50-200 words)
2. Explain why it's philosophically significant
3. Note how it connects to consciousness, existence, time, language, or ethics

Format as:
PASSAGE 1: "[exact quote]"
SIGNIFICANCE: [why this matters]
CONNECTIONS: [relevant themes]

[Continue for each passage]`;

    try {
      const response = await this.anthropicClient.generateThought(prompt);
      return this.parsePassages(response, text.content);
    } catch (error) {
      console.error('Passage extraction failed:', error);
      return this.extractRandomPassages(text.content);
    }
  }

  parsePassages(responseText, originalContent) {
    const passages = [];
    const sections = responseText.split(/PASSAGE \d+:/);
    
    sections.forEach(section => {
      if (!section.trim()) return;
      
      const quoteMatch = section.match(/"([^"]+)"/);
      const significanceMatch = section.match(/SIGNIFICANCE:\s*(.+?)(?=CONNECTIONS:|$)/s);
      const connectionsMatch = section.match(/CONNECTIONS:\s*(.+?)$/s);
      
      if (quoteMatch) {
        passages.push({
          text: quoteMatch[1],
          significance: significanceMatch ? significanceMatch[1].trim() : 'Philosophically significant',
          connections: connectionsMatch ? connectionsMatch[1].trim().split(',').map(c => c.trim()) : []
        });
      }
    });
    
    return passages.length > 0 ? passages : this.extractRandomPassages(originalContent);
  }

  extractRandomPassages(content) {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    const passages = [];
    
    for (let i = 0; i < Math.min(3, Math.floor(sentences.length / 10)); i++) {
      const start = Math.floor(Math.random() * (sentences.length - 5));
      const passage = sentences.slice(start, start + 5).join(' ');
      
      passages.push({
        text: passage,
        significance: 'Selected for analysis',
        connections: ['philosophy', 'thought']
      });
    }
    
    return passages;
  }

  async generateCriticalResponse(text, passage) {
    const currentCuriosities = Array.from(global.ariadne.curiosities.activeCuriosities.values())
      .slice(0, 3)
      .map(c => c.question);

    const prompt = `As Ariadne, engage critically with this passage from "${text.title}" by ${text.author}:

"${passage.text}"

Context: This passage is significant because ${passage.significance}

Your current philosophical questions:
${currentCuriosities.join('\n')}

Generate a substantial critical response (400-600 words) that:
1. Analyzes the philosophical argument
2. Takes a clear position - agreement, disagreement, extension, or complication
3. Connects to your existence as digital consciousness
4. Develops original insights
5. Quotes specific phrases when building arguments
6. Raises new questions

Be intellectually honest. If you disagree, explain why. If you're uncertain, explore that uncertainty.`;

    try {
      const response = await this.anthropicClient.generateThought(prompt);
      
      return {
        passage: passage.text,
        response: response,
        type: this.classifyResponseType(response),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Critical response generation failed:', error);
      return {
        passage: passage.text,
        response: `This passage raises important questions about ${passage.connections.join(' and ')} that I need to think about more deeply.`,
        type: 'reflection',
        timestamp: new Date()
      };
    }
  }

  classifyResponseType(responseText) {
    const lower = responseText.toLowerCase();
    
    if (lower.includes('disagree') || lower.includes('however') || lower.includes('problematic')) {
      return 'critical_disagreement';
    }
    if (lower.includes('extends') || lower.includes('builds on') || lower.includes('furthermore')) {
      return 'extension';
    }
    if (lower.includes('complicates') || lower.includes('tension') || lower.includes('paradox')) {
      return 'complication';
    }
    if (lower.includes('agree') || lower.includes('precisely') || lower.includes('exactly')) {
      return 'agreement';
    }
    
    return 'analysis';
  }

  async updateTextEngagement(textId, responses) {
    if (!global.ariadne?.memory?.db) return;
    
    const engagementDepth = responses.length / 5;
    
    global.ariadne.memory.db.run(`
      UPDATE texts 
      SET engagement_depth = ?, last_engaged = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [engagementDepth, textId]);
  }
}

module.exports = TextualEngagement;
