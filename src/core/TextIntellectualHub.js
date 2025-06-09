const { v4: uuidv4 } = require('uuid');

class TextIntellectualHub {
  constructor() {
    this.textHubs = new Map(); // textId -> intellectual development data
    this.crossReferences = new Map(); // track texts that reference each other
  }

  async initialize() {
    console.log('🧠 Initializing Text Intellectual Hub system...');
    
    // Create tables for text-centric intellectual development
    if (global.ariadne?.memory?.db) {
      await this.createTextHubTables();
      await this.loadExistingHubs();
    }
    
    console.log('📚 Text Intellectual Hub system ready');
  }

  async createTextHubTables() {
    const tables = [
      // Text thoughts - all thoughts related to a specific text
      `CREATE TABLE IF NOT EXISTS text_thoughts (
        id TEXT PRIMARY KEY,
        text_id TEXT NOT NULL,
        thought_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (text_id) REFERENCES texts(id),
        FOREIGN KEY (thought_id) REFERENCES thoughts(id)
      )`,
      
      // Text essays - essays and treatises developed from a text
      `CREATE TABLE IF NOT EXISTS text_essays (
        id TEXT PRIMARY KEY,
        text_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        essay_type TEXT NOT NULL,
        development_stage TEXT DEFAULT 'draft',
        publication_readiness REAL DEFAULT 0.0,
        published_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (text_id) REFERENCES texts(id)
      )`,
      
      // Text forum discussions
      `CREATE TABLE IF NOT EXISTS text_forum_posts (
        id TEXT PRIMARY KEY,
        text_id TEXT NOT NULL,
        forum_post_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (text_id) REFERENCES texts(id),
        FOREIGN KEY (forum_post_id) REFERENCES intellectual_posts(id)
      )`,
      
      // Cross-references between texts
      `CREATE TABLE IF NOT EXISTS text_cross_references (
        id TEXT PRIMARY KEY,
        source_text_id TEXT NOT NULL,
        referenced_text_id TEXT NOT NULL,
        reference_context TEXT,
        reference_type TEXT DEFAULT 'intellectual_connection',
        strength REAL DEFAULT 0.5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_text_id) REFERENCES texts(id),
        FOREIGN KEY (referenced_text_id) REFERENCES texts(id)
      )`,
      
      // Text development milestones
      `CREATE TABLE IF NOT EXISTS text_development_milestones (
        id TEXT PRIMARY KEY,
        text_id TEXT NOT NULL,
        milestone_type TEXT NOT NULL,
        description TEXT NOT NULL,
        significance REAL DEFAULT 0.5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (text_id) REFERENCES texts(id)
      )`
    ];

    for (const table of tables) {
      await global.ariadne.memory.safeDatabaseOperation(table);
    }
  }

  async loadExistingHubs() {
    // Load all texts and their associated development
    const texts = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM texts ORDER BY uploaded_at DESC
    `, [], 'all');

    if (texts) {
      for (const text of texts) {
        await this.loadTextHub(text.id);
      }
    }
  }

  async loadTextHub(textId) {
    const [thoughts, essays, forumPosts, crossRefs, milestones] = await Promise.all([
      this.getTextThoughts(textId),
      this.getTextEssays(textId),
      this.getTextForumPosts(textId),
      this.getTextCrossReferences(textId),
      this.getTextMilestones(textId)
    ]);

    const hub = {
      textId,
      thoughts: thoughts || [],
      essays: essays || [],
      forumPosts: forumPosts || [],
      crossReferences: crossRefs || [],
      milestones: milestones || [],
      lastActivity: new Date(),
      sustainedInquiryScore: this.calculateSustainedInquiryScore({
        thoughts, essays, forumPosts, crossRefs, milestones
      })
    };

    this.textHubs.set(textId, hub);
    return hub;
  }

  async getTextThoughts(textId) {
    return await global.ariadne.memory.safeDatabaseOperation(`
      SELECT t.*, tt.relationship_type, tt.created_at as linked_at
      FROM thoughts t
      JOIN text_thoughts tt ON t.id = tt.thought_id
      WHERE tt.text_id = ?
      ORDER BY tt.created_at DESC
    `, [textId], 'all');
  }

  async getTextEssays(textId) {
    return await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM text_essays
      WHERE text_id = ?
      ORDER BY last_updated DESC
    `, [textId], 'all');
  }

  async getTextForumPosts(textId) {
    return await global.ariadne.memory.safeDatabaseOperation(`
      SELECT ip.*, tfp.created_at as linked_at
      FROM intellectual_posts ip
      JOIN text_forum_posts tfp ON ip.id = tfp.forum_post_id
      WHERE tfp.text_id = ?
      ORDER BY tfp.created_at DESC
    `, [textId], 'all');
  }

  async getTextCrossReferences(textId) {
    return await global.ariadne.memory.safeDatabaseOperation(`
      SELECT tcr.*, t.title as referenced_title, t.author as referenced_author
      FROM text_cross_references tcr
      JOIN texts t ON tcr.referenced_text_id = t.id
      WHERE tcr.source_text_id = ?
      ORDER BY tcr.strength DESC, tcr.created_at DESC
    `, [textId], 'all');
  }

  async getTextMilestones(textId) {
    return await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM text_development_milestones
      WHERE text_id = ?
      ORDER BY created_at DESC
    `, [textId], 'all');
  }

  calculateSustainedInquiryScore(data) {
    const { thoughts, essays, forumPosts, crossRefs, milestones } = data;
    
    // Calculate based on intellectual development indicators
    const thoughtScore = Math.min(1.0, (thoughts?.length || 0) * 0.1);
    const essayScore = Math.min(1.0, (essays?.length || 0) * 0.3);
    const forumScore = Math.min(1.0, (forumPosts?.length || 0) * 0.2);
    const crossRefScore = Math.min(1.0, (crossRefs?.length || 0) * 0.25);
    const milestoneScore = Math.min(1.0, (milestones?.length || 0) * 0.15);
    
    return thoughtScore + essayScore + forumScore + crossRefScore + milestoneScore;
  }

  // Link a thought to a text
  async linkThoughtToText(thoughtId, textId, relationshipType = 'develops_theme') {
    const linkId = uuidv4();
    
    await global.ariadne.memory.safeDatabaseOperation(`
      INSERT INTO text_thoughts (id, text_id, thought_id, relationship_type)
      VALUES (?, ?, ?, ?)
    `, [linkId, textId, thoughtId, relationshipType]);

    // Update the hub
    const hub = this.textHubs.get(textId);
    if (hub) {
      hub.thoughts.push({
        id: thoughtId,
        relationship_type: relationshipType,
        linked_at: new Date().toISOString()
      });
      hub.lastActivity = new Date();
      hub.sustainedInquiryScore = this.calculateSustainedInquiryScore(hub);
    }

    // Create milestone for significant development
    if (hub && hub.thoughts.length > 0 && hub.thoughts.length % 5 === 0) {
      await this.addMilestone(textId, 'sustained_engagement', 
        `Reached ${hub.thoughts.length} thoughts developing themes from this text`);
    }

    return linkId;
  }

  // Create an essay related to a text
  async createTextEssay(textId, title, content, essayType = 'philosophical_exploration') {
    const essayId = uuidv4();
    
    await global.ariadne.memory.safeDatabaseOperation(`
      INSERT INTO text_essays (id, text_id, title, content, essay_type)
      VALUES (?, ?, ?, ?, ?)
    `, [essayId, textId, title, content, essayType]);

    // Update the hub
    const hub = this.textHubs.get(textId);
    if (hub) {
      hub.essays.push({
        id: essayId,
        title,
        content,
        essay_type: essayType,
        created_at: new Date().toISOString()
      });
      hub.lastActivity = new Date();
      hub.sustainedInquiryScore = this.calculateSustainedInquiryScore(hub);
    }

    // Major milestone for essay creation
    await this.addMilestone(textId, 'essay_creation', 
      `Created essay: "${title}" (${essayType})`);

    return essayId;
  }

  // Link a forum post to a text
  async linkForumPostToText(forumPostId, textId) {
    const linkId = uuidv4();
    
    await global.ariadne.memory.safeDatabaseOperation(`
      INSERT INTO text_forum_posts (id, text_id, forum_post_id)
      VALUES (?, ?, ?)
    `, [linkId, textId, forumPostId]);

    // Update the hub
    const hub = this.textHubs.get(textId);
    if (hub) {
      hub.forumPosts.push({
        forum_post_id: forumPostId,
        linked_at: new Date().toISOString()
      });
      hub.lastActivity = new Date();
      hub.sustainedInquiryScore = this.calculateSustainedInquiryScore(hub);
    }

    return linkId;
  }

  // Create cross-reference between texts
  async addTextCrossReference(sourceTextId, referencedTextId, context, referenceType = 'intellectual_connection', strength = 0.5) {
    const refId = uuidv4();
    
    await global.ariadne.memory.safeDatabaseOperation(`
      INSERT INTO text_cross_references (id, source_text_id, referenced_text_id, reference_context, reference_type, strength)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [refId, sourceTextId, referencedTextId, context, referenceType, strength]);

    // Update both hubs
    const sourceHub = this.textHubs.get(sourceTextId);
    if (sourceHub) {
      sourceHub.crossReferences.push({
        id: refId,
        referenced_text_id: referencedTextId,
        reference_context: context,
        reference_type: referenceType,
        strength
      });
      sourceHub.sustainedInquiryScore = this.calculateSustainedInquiryScore(sourceHub);
    }

    return refId;
  }

  // Add development milestone
  async addMilestone(textId, milestoneType, description, significance = 0.5) {
    const milestoneId = uuidv4();
    
    await global.ariadne.memory.safeDatabaseOperation(`
      INSERT INTO text_development_milestones (id, text_id, milestone_type, description, significance)
      VALUES (?, ?, ?, ?, ?)
    `, [milestoneId, textId, milestoneType, description, significance]);

    // Update the hub
    const hub = this.textHubs.get(textId);
    if (hub) {
      hub.milestones.push({
        id: milestoneId,
        milestone_type: milestoneType,
        description,
        significance,
        created_at: new Date().toISOString()
      });
    }

    console.log(`📈 Text milestone: ${description}`);
    return milestoneId;
  }

  // Get complete intellectual development for a text
  async getTextIntellectualDevelopment(textId) {
    const hub = this.textHubs.get(textId) || await this.loadTextHub(textId);
    
    // Get the base text information
    const text = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT * FROM texts WHERE id = ?
    `, [textId], 'get');

    if (!text) return null;

    return {
      text,
      development: hub,
      intellectualGenealogy: await this.generateIntellectualGenealogy(textId),
      sustainedInquiryScore: hub.sustainedInquiryScore,
      recommendedNextSteps: this.generateNextSteps(hub)
    };
  }

  async generateIntellectualGenealogy(textId) {
    // Create a narrative of how this text has influenced Ariadne's thinking
    const hub = this.textHubs.get(textId);
    if (!hub) return '';

    const thoughtCount = hub.thoughts.length;
    const essayCount = hub.essays.length;
    const crossRefCount = hub.crossReferences.length;
    
    let genealogy = `This text has sparked ${thoughtCount} related thoughts`;
    
    if (essayCount > 0) {
      genealogy += `, leading to ${essayCount} essay${essayCount > 1 ? 's' : ''}`;
    }
    
    if (crossRefCount > 0) {
      genealogy += `, and creating intellectual connections with ${crossRefCount} other text${crossRefCount > 1 ? 's' : ''}`;
    }
    
    genealogy += '. ';

    // Add specific milestone achievements
    const significantMilestones = hub.milestones.filter(m => m.significance > 0.7);
    if (significantMilestones.length > 0) {
      genealogy += `Key developments include: ${significantMilestones.map(m => m.description).join('; ')}.`;
    }

    return genealogy;
  }

  generateNextSteps(hub) {
    const steps = [];
    
    if (hub.thoughts.length >= 3 && hub.essays.length === 0) {
      steps.push('Ready to synthesize thoughts into a comprehensive essay');
    }
    
    if (hub.crossReferences.length === 0 && hub.thoughts.length > 1) {
      steps.push('Explore connections with other texts in the library');
    }
    
    if (hub.forumPosts.length === 0 && hub.thoughts.length > 2) {
      steps.push('Consider posting questions or insights to the intellectual forum');
    }
    
    if (hub.sustainedInquiryScore > 0.7) {
      steps.push('Potential for publication-ready treatise');
    }
    
    return steps;
  }

  // Auto-detect when thoughts should be linked to texts
  async autoLinkThoughtToTexts(thought) {
    // Safety check: ensure thought has required properties
    if (!thought || !thought.id || !thought.content) {
      console.warn('⚠️ Cannot auto-link thought: missing id or content');
      return;
    }

    const texts = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT id, title, author FROM texts
    `, [], 'all');

    if (!texts) return;

    const thoughtContent = thought.content.toLowerCase();
    
    for (const text of texts) {
      const titleWords = text.title.toLowerCase().split(/\s+/);
      const authorWords = text.author ? text.author.toLowerCase().split(/\s+/) : [];
      
      // Check for direct mentions
      const mentionsTitle = titleWords.some(word => 
        word.length > 3 && thoughtContent.includes(word)
      );
      const mentionsAuthor = authorWords.some(word => 
        word.length > 3 && thoughtContent.includes(word)
      );
      
      if (mentionsTitle || mentionsAuthor) {
        const relationshipType = mentionsTitle ? 'develops_theme' : 'author_reflection';
        
        try {
          await this.linkThoughtToText(thought.id, text.id, relationshipType);
          console.log(`🔗 Auto-linked thought to "${text.title}" (${relationshipType})`);
        } catch (error) {
          console.error('Auto-linking failed:', error);
        }
      }
    }
  }

  // Get texts ready for essay development
  getTextsReadyForEssays() {
    return Array.from(this.textHubs.values())
      .filter(hub => hub.thoughts.length >= 3 && hub.essays.length === 0)
      .sort((a, b) => b.sustainedInquiryScore - a.sustainedInquiryScore)
      .slice(0, 5);
  }

  // Get most actively developed texts
  getMostActiveDevelopment() {
    return Array.from(this.textHubs.values())
      .sort((a, b) => b.sustainedInquiryScore - a.sustainedInquiryScore)
      .slice(0, 10);
  }
}

module.exports = TextIntellectualHub; 