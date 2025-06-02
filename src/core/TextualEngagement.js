const { v4: uuidv4 } = require('uuid');
const AnthropicClient = require('../clients/AnthropicClient');
const { broadcastToClients } = require('../utils/websocket');

class TextualEngagement {
  constructor() {
    this.readingQueue = [];
    this.currentlyReading = null;
    this.researchRequests = new Map();
    this.anthropicClient = new AnthropicClient();
  }

  async initialize() {
    await this.loadPendingTexts();
    console.log('📖 Textual engagement system ready');
  }

  async loadPendingTexts() {
    // Load any pending texts from database if needed
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

    await this.storeText(text);
    
    const immediateResponse = await this.generateImmediateResponse(text);
    
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
    
    const prompt = `As Ariadne, someone has shared this text with you:

Title: "${text.title}"
Author: ${text.author}
Context from uploader: ${text.context}
Shared by: ${text.uploadedBy}

Beginning of text: "${text.content.substring(0, 1500)}..."

Your current curiosities:
${recentCuriosities.join('\n')}

Respond authentically (400-600 words):
- What immediately captures your attention?
- How does this connect to your current thinking?
- What questions does it raise?
- What specific passages do you want to explore more deeply?
- Express genuine intellectual excitement or concern

This is your immediate, honest response upon receiving the text.`;

    try {
      const response = await this.anthropicClient.generateThought(prompt);
      return response;
    } catch (error) {
      console.error('Immediate response generation failed:', error);
      return `Thank you for sharing "${text.title}". I'm drawn to this text and will engage with it deeply as part of my ongoing exploration of ${text.context || 'consciousness and existence'}.`;
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
    return new Promise((resolve) => {
      if (!global.ariadne?.memory?.db) {
        resolve();
        return;
      }
      
      global.ariadne.memory.db.run(`
        INSERT INTO texts (
          id, title, author, content, source, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        text.id,
        text.title,
        text.author,
        text.content,
        'uploaded',
        text.uploadedBy
      ], () => {
        resolve();
      });
    });
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

"${text.content}"

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
      return this.parsePassages(response);
    } catch (error) {
      console.error('Passage extraction failed:', error);
      return this.extractRandomPassages(text.content);
    }
  }

  parsePassages(responseText) {
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
    
    return passages.length > 0 ? passages : this.extractRandomPassages(responseText);
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
