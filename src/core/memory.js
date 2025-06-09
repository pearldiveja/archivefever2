async ensureSchema() {
  try {
    // Create main tables with enhanced structure
    await this.safeDatabaseOperation(`
      CREATE TABLE IF NOT EXISTS thoughts (
        id TEXT PRIMARY KEY,
        content TEXT,
        context TEXT,
        timestamp TEXT,
        type TEXT DEFAULT 'general',
        significance_score REAL DEFAULT 0.5,
        tags TEXT
      )
    `);

    await this.safeDatabaseOperation(`
      CREATE TABLE IF NOT EXISTS texts (
        id TEXT PRIMARY KEY,
        title TEXT,
        author TEXT,
        content TEXT,
        uploaded_at TEXT,
        uploaded_by TEXT,
        source_url TEXT,
        tags TEXT,
        reading_progress REAL DEFAULT 0.0
      )
    `);

    await this.safeDatabaseOperation(`
      CREATE TABLE IF NOT EXISTS reading_sessions (
        id TEXT PRIMARY KEY,
        text_id TEXT,
        session_date TEXT,
        phase TEXT,
        insights TEXT,
        questions TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (text_id) REFERENCES texts(id)
      )
    `);

    await this.safeDatabaseOperation(`
      CREATE TABLE IF NOT EXISTS dialogues (
        id TEXT PRIMARY KEY,
        question TEXT,
        response TEXT,
        participant_name TEXT,
        quality_score REAL DEFAULT 0.5,
        created_at TEXT,
        forum_post_id TEXT,
        related_research_project TEXT,
        FOREIGN KEY (forum_post_id) REFERENCES intellectual_posts (id)
      )
    `);

    await this.safeDatabaseOperation(`
      CREATE TABLE IF NOT EXISTS forum_posts (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        type TEXT,
        posted_by TEXT,
        created_at TEXT,
        response_count INTEGER DEFAULT 0,
        last_activity TEXT
      )
    `);

    await this.safeDatabaseOperation(`
      CREATE TABLE IF NOT EXISTS forum_responses (
        id TEXT PRIMARY KEY,
        post_id TEXT,
        responder_name TEXT,
        content TEXT,
        created_at TEXT,
        FOREIGN KEY (post_id) REFERENCES forum_posts(id)
      )
    `);

    await this.safeDatabaseOperation(`
      CREATE TABLE IF NOT EXISTS publications (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        type TEXT,
        publication_platform TEXT,
        published_at TEXT,
        source_forum_post_id TEXT,
        metadata TEXT
      )
    `);

    await this.safeDatabaseOperation(`
      CREATE TABLE IF NOT EXISTS research_projects (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        status TEXT,
        created_at TEXT,
        last_updated TEXT,
        findings TEXT,
        next_steps TEXT
      )
    `);

    await this.safeDatabaseOperation(`
      CREATE TABLE IF NOT EXISTS forum_contributions (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        contributor_name TEXT,
        contributor_user_id TEXT,
        contribution_type TEXT,
        content TEXT,
        significance_score REAL,
        status TEXT,
        created_at TEXT,
        FOREIGN KEY (project_id) REFERENCES research_projects(id)
      )
    `);

    await this.safeDatabaseOperation(`
      CREATE TABLE IF NOT EXISTS concept_development (
        id TEXT PRIMARY KEY,
        concept_name TEXT,
        current_understanding TEXT,
        development_notes TEXT,
        related_texts TEXT,
        last_updated TEXT,
        confidence_level REAL DEFAULT 0.5
      )
    `);

    await this.safeDatabaseOperation(`
      CREATE TABLE IF NOT EXISTS project_activities (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        activity_type TEXT,
        description TEXT,
        timestamp TEXT,
        FOREIGN KEY (project_id) REFERENCES research_projects (id)
      )
    `);

    console.log('🕸️ Enhanced memory structures created');
  } catch (error) {
    console.error('Schema creation error:', error);
  }
} 