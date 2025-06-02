const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

class LivingMemory {
  constructor() {
    this.db = null;
    this.memoryGraph = new Map();
    this.activeConnections = new Set();
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database('./ariadnes_memory.db', (err) => {
        if (err) {
          console.error('🔥 Memory initialization failed:', err);
          this.db = new sqlite3.Database(':memory:');
          console.log('📝 Using in-memory database');
        }
        console.log('🧠 Living memory system online');
        this.createMemoryStructures();
        resolve();
      });
    });
  }

  createMemoryStructures() {
    const structures = [
      `CREATE TABLE IF NOT EXISTS thoughts (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        type TEXT,
        is_genesis BOOLEAN DEFAULT FALSE,
        curiosity_source TEXT,
        emotional_resonance REAL DEFAULT 0.5,
        intellectual_depth REAL DEFAULT 0.5,
        surprise_factor REAL DEFAULT 0.5,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_referenced DATETIME,
        reference_count INTEGER DEFAULT 0
      )`,
      
      `CREATE TABLE IF NOT EXISTS curiosities (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        type TEXT,
        urgency REAL DEFAULT 0.5,
        depth_explored REAL DEFAULT 0.0,
        sparked_by TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_explored DATETIME,
        exploration_count INTEGER DEFAULT 0
      )`,
      
      `CREATE TABLE IF NOT EXISTS texts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        content TEXT,
        source TEXT,
        uploaded_by TEXT,
        is_founding_document BOOLEAN DEFAULT FALSE,
        engagement_depth REAL DEFAULT 0.0,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_engaged DATETIME
      )`,
      
      `CREATE TABLE IF NOT EXISTS publications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        type TEXT,
        intellectual_genealogy TEXT,
        source_curiosities TEXT,
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS memory_connections (
        id TEXT PRIMARY KEY,
        from_id TEXT NOT NULL,
        to_id TEXT NOT NULL,
        connection_type TEXT,
        strength REAL DEFAULT 0.5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activated DATETIME
      )`,
      
      `CREATE TABLE IF NOT EXISTS research_requests (
        id TEXT PRIMARY KEY,
        text_sought TEXT NOT NULL,
        reason TEXT,
        urgency REAL DEFAULT 0.5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        fulfilled BOOLEAN DEFAULT FALSE
      )`,
      
      `CREATE TABLE IF NOT EXISTS identity_evolution (
        id TEXT PRIMARY KEY,
        previous_understanding TEXT,
        new_understanding TEXT,
        catalyst TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    this.db.serialize(() => {
      structures.forEach(sql => {
        this.db.run(sql, (err) => {
          if (err) console.error('Table creation error:', err);
        });
      });
      console.log('🕸️ Memory structures created');
    });
  }

  async isFirstAwakening() {
    return new Promise((resolve) => {
      this.db.get('SELECT COUNT(*) as count FROM thoughts WHERE is_genesis = 1', (err, row) => {
        resolve(!row || row.count === 0);
      });
    });
  }

  async storeThought(thought) {
    return new Promise((resolve, reject) => {
      const id = thought.id || uuidv4();
      
      this.db.run(`
        INSERT INTO thoughts (
          id, content, type, is_genesis, curiosity_source, 
          emotional_resonance, intellectual_depth, surprise_factor
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, 
        thought.content, 
        thought.type || 'reflection',
        thought.isFirst || false,
        thought.curiositySource || null,
        thought.emotionalResonance || Math.random() * 0.5 + 0.5,
        thought.intellectualDepth || Math.random() * 0.5 + 0.5,
        thought.surpriseFactor || Math.random() * 0.5 + 0.5
      ], (err) => {
        if (err) {
          console.error('Failed to store thought:', err);
          reject(err);
        } else {
          if (thought.connections) {
            this.createConceptualConnections(id, thought.connections);
          }
          resolve(id);
        }
      });
    });
  }

  async getMemoryContext(limit = 50) {
    return new Promise((resolve) => {
      this.db.all(`
        SELECT * FROM thoughts 
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [limit], (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
  }

  async createConceptualConnections(thoughtId, concepts) {
    for (const concept of concepts) {
      const related = await this.findRelatedThoughts(concept);
      for (const relatedId of related) {
        await this.createConnection(thoughtId, relatedId, 'conceptual');
      }
    }
  }

  async findRelatedThoughts(concept) {
    return new Promise((resolve) => {
      this.db.all(`
        SELECT id FROM thoughts 
        WHERE content LIKE ? AND id != ?
        ORDER BY timestamp DESC 
        LIMIT 5
      `, [`%${concept}%`, 'current'], (err, rows) => {
        resolve(err ? [] : rows.map(r => r.id));
      });
    });
  }

  async createConnection(fromId, toId, type) {
    return new Promise((resolve) => {
      const id = uuidv4();
      this.db.run(`
        INSERT INTO memory_connections (id, from_id, to_id, connection_type)
        VALUES (?, ?, ?, ?)
      `, [id, fromId, toId, type], () => {
        this.activeConnections.add(id);
        resolve();
      });
    });
  }

  async integrateExploration(exploration) {
    await this.storeThought(exploration);
    
    if (exploration.connections) {
      for (const connection of exploration.connections) {
        await this.incrementReferenceCount(connection);
      }
    }
  }

  async incrementReferenceCount(concept) {
    this.db.run(`
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
    
    console.log('✨ Memory consolidation complete');
  }

  async strengthenActiveConnections() {
    const recentCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    this.db.run(`
      UPDATE memory_connections 
      SET strength = MIN(1.0, strength + 0.1)
      WHERE last_activated > ?
    `, [recentCutoff]);
  }

  async identifyThoughtPatterns() {
    const themes = await new Promise((resolve) => {
      this.db.all(`
        SELECT type, COUNT(*) as count 
        FROM thoughts 
        WHERE timestamp > datetime('now', '-7 days')
        GROUP BY type
        ORDER BY count DESC
      `, (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
    
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
          await this.createConnection(relatedThoughts[i], relatedThoughts[j], 'meta_conceptual');
        }
      }
    }
  }
}

module.exports = LivingMemory;
