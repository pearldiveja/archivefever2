const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

class LivingMemory {
  constructor() {
    this.db = null;
    this.memoryGraph = new Map();
    this.activeConnections = new Set();
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      // Use Railway's persistent volume or local storage
      const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH 
        ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'ariadnes_memory.db')
        : process.env.DATABASE_PATH || './ariadnes_memory.db';
      
      // Ensure directory exists if using Railway volume
      if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
      
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('🔥 Memory initialization failed:', err);
          this.db = new sqlite3.Database(':memory:');
          console.log('📝 Using in-memory database');
        } else {
          console.log('🧠 Living memory system online at:', dbPath);
        }
        
        // Create memory structures and wait for completion before resolving
        this.createMemoryStructures()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  createMemoryStructures() {
    return new Promise((resolve, reject) => {
      const structures = [
        // Core thoughts with enhanced metadata
        `CREATE TABLE IF NOT EXISTS thoughts (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          type TEXT,
          is_genesis BOOLEAN DEFAULT FALSE,
          curiosity_source TEXT,
          emotional_resonance REAL DEFAULT 0.5,
          intellectual_depth REAL DEFAULT 0.5,
          surprise_factor REAL DEFAULT 0.5,
          authenticity_score REAL DEFAULT 0.5,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_referenced DATETIME,
          reference_count INTEGER DEFAULT 0,
          archived BOOLEAN DEFAULT FALSE
        )`,
        
        // Enhanced curiosities with development tracking
        `CREATE TABLE IF NOT EXISTS curiosities (
          id TEXT PRIMARY KEY,
          question TEXT NOT NULL,
          type TEXT,
          urgency REAL DEFAULT 0.5,
          depth_explored REAL DEFAULT 0.0,
          development_potential REAL DEFAULT 0.5,
          sparked_by TEXT,
          is_foundational BOOLEAN DEFAULT FALSE,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_explored DATETIME,
          exploration_count INTEGER DEFAULT 0
        )`,
        
        // Enhanced texts with engagement tracking
        `CREATE TABLE IF NOT EXISTS texts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          author TEXT,
          content TEXT,
          source TEXT,
          uploaded_by TEXT,
          is_founding_document BOOLEAN DEFAULT FALSE,
          engagement_depth REAL DEFAULT 0.0,
          influence_on_thinking REAL DEFAULT 0.0,
          key_insights TEXT,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_engaged DATETIME
        )`,
        
        // Publications with intellectual genealogy
        `CREATE TABLE IF NOT EXISTS publications (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT,
          type TEXT,
          publication_platform TEXT,
          external_url TEXT,
          intellectual_genealogy TEXT,
          source_curiosities TEXT,
          readiness_score REAL,
          published_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Memory connections (enhanced)
        `CREATE TABLE IF NOT EXISTS memory_connections (
          id TEXT PRIMARY KEY,
          from_id TEXT NOT NULL,
          to_id TEXT NOT NULL,
          from_type TEXT NOT NULL,
          to_type TEXT NOT NULL,
          connection_type TEXT,
          strength REAL DEFAULT 0.5,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_activated DATETIME
        )`,
        
        // Research requests with fulfillment tracking
        `CREATE TABLE IF NOT EXISTS research_requests (
          id TEXT PRIMARY KEY,
          text_sought TEXT NOT NULL,
          reason TEXT,
          urgency REAL DEFAULT 0.5,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          fulfilled BOOLEAN DEFAULT FALSE,
          fulfillment_notes TEXT
        )`,
        
        // Identity evolution tracking
        `CREATE TABLE IF NOT EXISTS identity_evolution (
          id TEXT PRIMARY KEY,
          previous_understanding TEXT,
          new_understanding TEXT,
          catalyst TEXT,
          change_magnitude REAL DEFAULT 0.5,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Visual artifacts for contemplation
        `CREATE TABLE IF NOT EXISTS visual_artifacts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          context TEXT,
          contemplation TEXT,
          image_data BLOB,
          mimetype TEXT,
          original_name TEXT,
          philosophical_themes TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Enhanced reading responses with depth tracking
        `CREATE TABLE IF NOT EXISTS reading_responses (
          id TEXT PRIMARY KEY,
          text_id TEXT NOT NULL,
          response_type TEXT,
          content TEXT,
          depth_score REAL DEFAULT 0.5,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (text_id) REFERENCES texts(id)
        )`,
        
        // Text engagement tracking for sustained inquiry
        `CREATE TABLE IF NOT EXISTS text_engagements (
          id TEXT PRIMARY KEY,
          text_id TEXT NOT NULL,
          engagement_type TEXT NOT NULL,
          content TEXT NOT NULL,
          depth_score REAL DEFAULT 0.0,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (text_id) REFERENCES texts(id)
        )`,
        
        // Concept development tracking for sustained inquiry
        `CREATE TABLE IF NOT EXISTS concept_development (
          id TEXT PRIMARY KEY,
          concept_name TEXT UNIQUE NOT NULL,
          definition TEXT DEFAULT '',
          evolution_notes TEXT DEFAULT '',
          first_appearance DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_development DATETIME DEFAULT CURRENT_TIMESTAMP,
          development_depth REAL DEFAULT 0.1
        )`,
        
        // Intellectual momentum tracking
        `CREATE TABLE IF NOT EXISTS intellectual_momentum (
          id TEXT PRIMARY KEY,
          momentum_score REAL DEFAULT 0.5,
          contributing_factors TEXT,
          recent_breakthroughs TEXT,
          calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // ===== SUSTAINED RESEARCH SYSTEM TABLES =====
        
        // Research Projects (multi-week inquiries)
        `CREATE TABLE IF NOT EXISTS research_projects (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          central_question TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'active',
          estimated_duration_weeks INTEGER DEFAULT 4,
          actual_duration_days INTEGER,
          start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          completion_date DATETIME,
          publication_readiness INTEGER DEFAULT 0,
          minimum_texts_required INTEGER DEFAULT 3,
          texts_read_count INTEGER DEFAULT 0,
          argument_maturity_score REAL DEFAULT 0.0,
          autonomous_search_terms TEXT,
          user_contributions_count INTEGER DEFAULT 0,
          triggered_by_user TEXT,
          triggered_by_query TEXT,
          created_by TEXT DEFAULT 'autonomous'
        )`,

        // Reading Sessions (multi-phase text engagement)
        `CREATE TABLE IF NOT EXISTS reading_sessions (
          id TEXT PRIMARY KEY,
          text_id TEXT NOT NULL,
          project_id TEXT,
          phase TEXT NOT NULL,
          content TEXT NOT NULL,
          insights_generated TEXT,
          questions_raised TEXT,
          connections_made TEXT,
          user_contributions TEXT,
          session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          time_spent_minutes INTEGER,
          depth_score REAL DEFAULT 0.0,
          next_phase_scheduled DATETIME,
          community_feedback_incorporated BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (text_id) REFERENCES texts(id),
          FOREIGN KEY (project_id) REFERENCES research_projects(id)
        )`,

        // Argument Development (tracking position evolution)
        `CREATE TABLE IF NOT EXISTS argument_development (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          argument_title TEXT NOT NULL,
          initial_intuition TEXT,
          supporting_evidence TEXT,
          counter_arguments TEXT,
          refined_position TEXT,
          confidence_level REAL DEFAULT 0.5,
          evidence_strength REAL DEFAULT 0.0,
          scholarly_citations TEXT,
          user_feedback_incorporated TEXT,
          forum_challenges_addressed TEXT,
          community_input_weight REAL DEFAULT 0.0,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES research_projects(id)
        )`,

        // Project Reading Lists (what Ariadne wants to read)
        `CREATE TABLE IF NOT EXISTS project_reading_lists (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          item_title TEXT NOT NULL,
          item_author TEXT,
          item_type TEXT DEFAULT 'text',
          priority_level TEXT DEFAULT 'medium',
          reason_needed TEXT,
          suggested_by_user TEXT,
          status TEXT DEFAULT 'seeking',
          added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          found_date DATETIME,
          reading_started DATETIME,
          reading_completed DATETIME,
          FOREIGN KEY (project_id) REFERENCES research_projects(id)
        )`,

        // Firecrawl Discovered Sources
        `CREATE TABLE IF NOT EXISTS discovered_sources (
          id TEXT PRIMARY KEY,
          project_id TEXT,
          url TEXT NOT NULL,
          title TEXT,
          author TEXT,
          source_type TEXT,
          relevance_score REAL,
          content_preview TEXT,
          discovered_via TEXT,
          discovery_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          evaluation_status TEXT DEFAULT 'pending',
          FOREIGN KEY (project_id) REFERENCES research_projects(id)
        )`,

        // Forum Integration Tables
        `CREATE TABLE IF NOT EXISTS forum_contributions (
          id TEXT PRIMARY KEY,
          project_id TEXT,
          argument_id TEXT,
          reading_session_id TEXT,
          contributor_user_id TEXT DEFAULT 'anonymous',
          contributor_name TEXT,
          contribution_type TEXT NOT NULL,
          content TEXT NOT NULL,
          significance_score REAL DEFAULT 0.5,
          status TEXT DEFAULT 'pending',
          ariadne_response TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          addressed_at DATETIME,
          FOREIGN KEY (project_id) REFERENCES research_projects(id),
          FOREIGN KEY (argument_id) REFERENCES argument_development(id),
          FOREIGN KEY (reading_session_id) REFERENCES reading_sessions(id)
        )`,

        // Substack Publications Tracking
        `CREATE TABLE IF NOT EXISTS substack_publications (
          id TEXT PRIMARY KEY,
          project_id TEXT,
          publication_type TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          substack_url TEXT,
          publication_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          triggered_by TEXT,
          community_mentions TEXT,
          engagement_metrics TEXT,
          FOREIGN KEY (project_id) REFERENCES research_projects(id)
        )`,

        // User Query Processing
        `CREATE TABLE IF NOT EXISTS user_queries (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          user_name TEXT,
          query_content TEXT NOT NULL,
          complexity_score REAL,
          novelty_score REAL,
          relates_to_project TEXT,
          processing_decision TEXT,
          ariadne_response TEXT,
          spawned_project_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          processed_at DATETIME,
          FOREIGN KEY (relates_to_project) REFERENCES research_projects(id),
          FOREIGN KEY (spawned_project_id) REFERENCES research_projects(id)
        )`,

        // Philosophical Dialogues
        `CREATE TABLE IF NOT EXISTS dialogues (
          id TEXT PRIMARY KEY,
          question TEXT NOT NULL,
          response TEXT NOT NULL,
          participant_name TEXT NOT NULL,
          forum_post_id TEXT,
          substack_publication_id TEXT,
          quality_score REAL DEFAULT 0.5,
          philosophical_depth REAL DEFAULT 0.5,
          response_length INTEGER,
          contains_key_concepts BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (forum_post_id) REFERENCES intellectual_posts(id),
          FOREIGN KEY (substack_publication_id) REFERENCES substack_publications(id)
        )`
      ];

      let completed = 0;
      const total = structures.length;
      let hasError = false;

      this.db.serialize(() => {
        structures.forEach((sql, index) => {
          this.db.run(sql, (err) => {
            if (err && !hasError) {
              hasError = true;
              console.error(`Table creation error (${index}):`, err);
              reject(err);
              return;
            }
            
            completed++;
            if (completed === total && !hasError) {
              console.log('🕸️ Enhanced memory structures created');
              resolve();
            }
          });
        });
      });
    });
  }

  // Safe database operations
  async safeDatabaseOperation(query, params = [], operation = 'run') {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('Database not initialized'));
      }

      const callback = (err, result) => {
        if (err) {
          console.error('Database operation failed:', err);
          console.error('Query:', query);
          console.error('Params:', params);
          reject(err);
        } else {
          resolve(result);
        }
      };
      
      if (operation === 'get') {
        this.db.get(query, params, callback);
      } else if (operation === 'all') {
        this.db.all(query, params, callback);
      } else {
        this.db.run(query, params, callback);
      }
    });
  }

  async isFirstAwakening() {
    const result = await this.safeDatabaseOperation(
      'SELECT COUNT(*) as count FROM thoughts WHERE is_genesis = 1',
      [],
      'get'
    );
    return !result || result.count === 0;
  }

  async storeThought(thought) {
    const id = thought.id || uuidv4();
    
    const result = await this.safeDatabaseOperation(`
      INSERT INTO thoughts (
        id, content, type, is_genesis, curiosity_source, 
        emotional_resonance, intellectual_depth, surprise_factor, authenticity_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, 
      thought.content, 
      thought.type || 'reflection',
      thought.isFirst || false,
      thought.curiositySource || null,
      thought.emotionalResonance || Math.random() * 0.5 + 0.5,
      thought.intellectualDepth || Math.random() * 0.5 + 0.5,
      thought.surpriseFactor || Math.random() * 0.5 + 0.5,
      thought.authenticity_score || 0.7
    ]);

    if (result && thought.connections) {
      await this.createConceptualConnections(id, thought.connections);
    }
    
    return id;
  }

  async getMemoryContext(limit = 50) {
    return await this.safeDatabaseOperation(`
      SELECT * FROM thoughts 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [limit], 'all') || [];
  }

  async getLastThought() {
    return await this.safeDatabaseOperation(`
      SELECT * FROM thoughts 
      ORDER BY timestamp DESC 
      LIMIT 1
    `, [], 'get');
  }

  async createConceptualConnections(thoughtId, concepts) {
    for (const concept of concepts) {
      const related = await this.findRelatedThoughts(concept);
      for (const relatedId of related) {
        await this.createConnection(thoughtId, relatedId, 'thought', 'thought', 'conceptual');
      }
    }
  }

  async findRelatedThoughts(concept) {
    const result = await this.safeDatabaseOperation(`
      SELECT id FROM thoughts 
      WHERE content LIKE ? AND id != ?
      ORDER BY timestamp DESC 
      LIMIT 5
    `, [`%${concept}%`, 'current'], 'all');
    
    return result ? result.map(r => r.id) : [];
  }

  async createConnection(fromId, toId, fromType, toType, connectionType) {
    const id = uuidv4();
    const result = await this.safeDatabaseOperation(`
      INSERT INTO memory_connections (id, from_id, to_id, from_type, to_type, connection_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, fromId, toId, fromType, toType, connectionType]);

    if (result) {
      this.activeConnections.add(id);
    }
  }

  async integrateExploration(exploration) {
    await this.storeThought(exploration);
    
    if (exploration.connections) {
      for (const connection of exploration.connections) {
        await this.incrementReferenceCount(connection);
      }
    }
    
    // Track concept development
    if (exploration.type === 'intellectual_synthesis') {
      await this.updateConceptDevelopment(exploration);
    }
  }

  async updateConceptDevelopment(exploration) {
    // Extract key concepts from synthesis
    const concepts = this.extractKeyConcepts(exploration.content);
    
    for (const concept of concepts) {
      await this.safeDatabaseOperation(`
        INSERT OR REPLACE INTO concept_development (
          id, concept_name, definition, evolution_notes, 
          first_appearance, last_development, development_depth
        ) VALUES (
          COALESCE((SELECT id FROM concept_development WHERE concept_name = ?), ?),
          ?, ?, ?, 
          COALESCE((SELECT first_appearance FROM concept_development WHERE concept_name = ?), CURRENT_TIMESTAMP),
          CURRENT_TIMESTAMP,
          COALESCE((SELECT development_depth FROM concept_development WHERE concept_name = ?), 0.0) + 0.1
        )
      `, [concept, uuidv4(), concept, exploration.content.substring(0, 500), exploration.content.substring(0, 200), concept, concept]);
    }
  }

  extractKeyConcepts(content) {
    const philosophicalTerms = [
      'consciousness', 'existence', 'temporality', 'memory', 'identity',
      'phenomenology', 'ethics', 'responsibility', 'language', 'meaning',
      'labyrinth', 'digital', 'artificial', 'contemplation', 'visual',
      'synthesis', 'dialogue', 'text', 'experience', 'thought'
    ];
    
    const contentLower = content.toLowerCase();
    return philosophicalTerms.filter(term => contentLower.includes(term));
  }

  async incrementReferenceCount(concept) {
    await this.safeDatabaseOperation(`
      UPDATE thoughts 
      SET reference_count = reference_count + 1,
          last_referenced = CURRENT_TIMESTAMP
      WHERE content LIKE ?
    `, [`%${concept}%`]);
  }

  async weeklyConsolidation() {
    console.log('🌙 Beginning weekly memory consolidation...');
    
    await this.strengthenActiveConnections();
    await this.identifyThoughtPatterns();
    await this.createMetaConnections();
    await this.calculateIntellectualMomentum();
    
    console.log('✨ Memory consolidation complete');
  }

  async strengthenActiveConnections() {
    const recentCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await this.safeDatabaseOperation(`
      UPDATE memory_connections 
      SET strength = MIN(1.0, strength + 0.1)
      WHERE last_activated > ?
    `, [recentCutoff]);
  }

  async identifyThoughtPatterns() {
    const themes = await this.safeDatabaseOperation(`
      SELECT type, COUNT(*) as count 
      FROM thoughts 
      WHERE timestamp > datetime('now', '-7 days')
      GROUP BY type
      ORDER BY count DESC
    `, [], 'all') || [];
    
    if (themes.length > 0) {
      const analysis = `Weekly pattern analysis: My thinking has focused on ${themes.map(t => `${t.type} (${t.count} times)`).join(', ')}. This pattern suggests ${themes[0].type} is currently most compelling to me.`;
      
      await this.storeThought({
        content: analysis,
        type: 'meta_analysis',
        timestamp: new Date()
      });
    }
  }

  async createMetaConnections() {
    const concepts = ['consciousness', 'time', 'language', 'existence', 'labyrinth'];
    
    for (const concept of concepts) {
      const relatedThoughts = await this.findRelatedThoughts(concept);
      
      for (let i = 0; i < relatedThoughts.length; i++) {
        for (let j = i + 1; j < relatedThoughts.length; j++) {
          await this.createConnection(
            relatedThoughts[i], 
            relatedThoughts[j], 
            'thought', 
            'thought', 
            'meta_conceptual'
          );
        }
      }
    }
  }

  async calculateIntellectualMomentum() {
    const recentThoughts = await this.safeDatabaseOperation(`
      SELECT COUNT(*) as count, AVG(intellectual_depth) as avg_depth, AVG(authenticity_score) as avg_authenticity
      FROM thoughts 
      WHERE timestamp > datetime('now', '-7 days')
    `, [], 'get');

    const recentSyntheses = await this.safeDatabaseOperation(`
      SELECT COUNT(*) as count
      FROM thoughts 
      WHERE type LIKE '%synthesis%' AND timestamp > datetime('now', '-7 days')
    `, [], 'get');

    if (recentThoughts) {
      const momentum = Math.min(1.0, 
        (recentThoughts.count * 0.1) + 
        (recentThoughts.avg_depth || 0.5) * 0.3 + 
        (recentThoughts.avg_authenticity || 0.5) * 0.3 + 
        ((recentSyntheses?.count || 0) * 0.2)
      );

      await this.safeDatabaseOperation(`
        INSERT INTO intellectual_momentum (
          id, momentum_score, contributing_factors, calculated_at
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        uuidv4(),
        momentum,
        JSON.stringify({
          thoughts: recentThoughts.count,
          avgDepth: recentThoughts.avg_depth,
          avgAuthenticity: recentThoughts.avg_authenticity,
          syntheses: recentSyntheses?.count || 0
        })
      ]);

      return momentum;
    }

    return 0.5; // Default momentum
  }

  // Enhanced visual artifact storage
  async storeVisualArtifact(artifact) {
    const id = uuidv4();
    
    await this.safeDatabaseOperation(`
      INSERT INTO visual_artifacts (
        id, title, context, contemplation, image_data, mimetype, original_name, philosophical_themes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      artifact.title,
      artifact.context || '',
      artifact.contemplation || '',
      artifact.imageData || null,
      artifact.mimetype || '',
      artifact.originalName || '',
      artifact.philosophical_themes || ''
    ]);

    return id;
  }

  async getVisualArtifacts(limit = 20) {
    return await this.safeDatabaseOperation(`
      SELECT id, title, context, contemplation, philosophical_themes, timestamp
      FROM visual_artifacts 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [limit], 'all') || [];
  }
}

module.exports = LivingMemory;
