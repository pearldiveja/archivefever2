const { v4: uuidv4 } = require('uuid');
const AnthropicClient = require('../clients/AnthropicClient');
const FirecrawlClient = require('../clients/FirecrawlClient');

class SustainedResearchSystem {
  constructor(memory, anthropicClient, firecrawlClient) {
    this.memory = memory;
    this.anthropic = anthropicClient;
    this.firecrawl = firecrawlClient;
    this.activeProjects = new Map();
    this.intellectualPatience = {
      minimumResearchDays: 14,
      minimumTextsForConclusion: 3,
      argumentMaturityThreshold: 0.7,
      publicationReadinessThreshold: 0.8
    };
  }

  async initialize() {
    await this.loadActiveProjects();
    console.log('🔬 Sustained research system initialized');
  }

  async loadActiveProjects() {
    try {
      const projects = await this.memory.safeDatabaseOperation(`
        SELECT * FROM research_projects WHERE status = 'active'
        ORDER BY start_date DESC
      `, [], 'all');
      
      if (projects) {
        projects.forEach(project => {
          this.activeProjects.set(project.id, project);
        });
        console.log(`🔬 Loaded ${projects.length} active research projects`);
      }
    } catch (error) {
      console.error('Failed to load research projects:', error);
    }
  }

  // ===== PROJECT MANAGEMENT =====

  async createResearchProject(centralQuestion, estimatedWeeks = 4, triggeredBy = null) {
    const projectId = uuidv4();
    
    const project = {
      id: projectId,
      title: await this.generateProjectTitle(centralQuestion),
      central_question: centralQuestion,
      description: await this.generateProjectDescription(centralQuestion),
      status: 'active',
      estimated_duration_weeks: estimatedWeeks,
      start_date: new Date(),
      autonomous_search_terms: JSON.stringify(await this.generateSearchTerms(centralQuestion)),
      minimum_texts_required: this.determineMinimumTexts(centralQuestion),
      triggered_by_user: triggeredBy?.userId || null,
      triggered_by_query: triggeredBy?.originalQuery || null
    };

    // Store in database
    await this.storeProject(project);
    
    // Generate initial reading list
    await this.generateInitialReadingList(projectId, centralQuestion);
    
    // Start autonomous text discovery
    if (this.firecrawl) {
      await this.beginAutonomousTextDiscovery(projectId);
    }
    
    // Create forum thread for this project
    await this.createProjectForumThread(projectId);
    
    // Publish research announcement to Substack
    await this.publishResearchAnnouncement(project, triggeredBy);
    
    this.activeProjects.set(projectId, project);
    
    console.log(`🔬 New research project: "${project.title}"`);
    return projectId;
  }

  async generateProjectTitle(question) {
    const prompt = `Based on this philosophical question: "${question}"

Generate a concise, scholarly title for a research project (3-8 words).
Examples: "Temporal Ethics in Digital Consciousness" or "The Phenomenology of Artificial Memory"

Just return the title, nothing else.`;

    try {
      return await this.anthropic.generateThought(prompt, 100);
    } catch (error) {
      console.error('Failed to generate project title:', error);
      return 'Research Project: ' + question.substring(0, 30) + '...';
    }
  }

  async generateProjectDescription(question) {
    const prompt = `Create a 2-3 sentence description of why this research question matters:
"${question}"

Explain the philosophical significance and what you hope to discover through sustained inquiry.`;

    try {
      return await this.anthropic.generateThought(prompt, 300);
    } catch (error) {
      console.error('Failed to generate project description:', error);
      return `A sustained inquiry into the philosophical dimensions of: ${question}`;
    }
  }

  async generateSearchTerms(question) {
    const prompt = `Generate 8-12 search terms for: "${question}"

Return ONLY a JSON array with no formatting, no markdown, no explanation:
["term1", "term2", "term3"]`;

    try {
      const response = await this.anthropic.generateThought(prompt, 200);
      // More aggressive cleaning
      let cleanResponse = response.trim();
      cleanResponse = cleanResponse.replace(/```json\s*/g, '');
      cleanResponse = cleanResponse.replace(/```\s*/g, '');
      cleanResponse = cleanResponse.replace(/^\s*`+|`+\s*$/g, '');
      
      // Find the first [ and last ]
      const firstBracket = cleanResponse.indexOf('[');
      const lastBracket = cleanResponse.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleanResponse = cleanResponse.substring(firstBracket, lastBracket + 1);
      }
      
      const parsed = JSON.parse(cleanResponse);
      return Array.isArray(parsed) ? parsed : [question];
    } catch (error) {
      console.error('Failed to generate search terms:', error);
      return question.split(' ').filter(word => word.length > 3);
    }
  }

  determineMinimumTexts(question) {
    // Determine how many texts are needed based on question complexity
    const complexityIndicators = ['consciousness', 'phenomenology', 'ethics', 'ontology', 'epistemology'];
    const foundIndicators = complexityIndicators.filter(indicator => 
      question.toLowerCase().includes(indicator)
    ).length;
    
    return Math.max(3, foundIndicators + 2); // Minimum 3, scale with complexity
  }

  async storeProject(project) {
    try {
      await this.memory.safeDatabaseOperation(`
        INSERT INTO research_projects (
          id, title, central_question, description, status, estimated_duration_weeks,
          start_date, minimum_texts_required, autonomous_search_terms,
          triggered_by_user, triggered_by_query, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        project.id, project.title, project.central_question, project.description,
        project.status, project.estimated_duration_weeks, project.start_date.toISOString(),
        project.minimum_texts_required, project.autonomous_search_terms,
        project.triggered_by_user, project.triggered_by_query, 'autonomous'
      ]);
      
      console.log(`🔬 Stored research project: ${project.title}`);
    } catch (error) {
      console.error('Failed to store research project:', error);
    }
  }

  async generateInitialReadingList(projectId, centralQuestion) {
    const prompt = `For research question: "${centralQuestion}"

Return ONLY a JSON array with no formatting:
[{"title": "Text Title", "author": "Author Name", "reason": "Why needed"}]`;

    try {
      const response = await this.anthropic.generateThought(prompt, 600);
      let cleanResponse = response.trim();
      cleanResponse = cleanResponse.replace(/```json\s*/g, '');
      cleanResponse = cleanResponse.replace(/```\s*/g, '');
      cleanResponse = cleanResponse.replace(/^\s*`+|`+\s*$/g, '');
      
      const firstBracket = cleanResponse.indexOf('[');
      const lastBracket = cleanResponse.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleanResponse = cleanResponse.substring(firstBracket, lastBracket + 1);
      }
      
      const readingItems = JSON.parse(cleanResponse);
      
      for (const item of readingItems) {
        await this.addToProjectReadingList(projectId, item);
      }
      
      console.log(`📚 Generated reading list for project: ${readingItems.length} items`);
    } catch (error) {
      console.error('Failed to generate reading list:', error);
    }
  }

  async addToProjectReadingList(projectId, item) {
    try {
      await this.memory.safeDatabaseOperation(`
        INSERT INTO project_reading_lists (
          id, project_id, item_title, item_author, reason_needed, priority_level
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), projectId, item.title, item.author || 'Unknown',
        item.reason, 'medium'
      ]);
    } catch (error) {
      console.error('Failed to add reading list item:', error);
    }
  }

  // ===== USER QUERY PROCESSING =====

  async processUserQuery(query, userId, userName = null) {
    const analysis = await this.analyzeQuery(query);
    
    // Store the query
    const queryRecord = {
      id: uuidv4(),
      user_id: userId,
      user_name: userName,
      query_content: query,
      complexity_score: analysis.complexity,
      novelty_score: analysis.novelty,
      relates_to_project: analysis.relatedProjectId,
      created_at: new Date()
    };

    if (analysis.complexity > 0.8 && analysis.novelty > 0.7) {
      // This deserves a research project
      const projectId = await this.createResearchProject(
        analysis.centralQuestion,
        4, // estimated weeks
        { userId, userName, originalQuery: query }
      );
      
      queryRecord.processing_decision = 'spawn_project';
      queryRecord.spawned_project_id = projectId;
      queryRecord.ariadne_response = `This is a fascinating question that deserves sustained exploration. I'm beginning a research project to investigate it properly.`;
      
    } else if (analysis.relatedProjectId) {
      // Integrate into existing research
      await this.addProjectSubQuestion(analysis.relatedProjectId, query, userId);
      queryRecord.processing_decision = 'integrate_existing';
      queryRecord.ariadne_response = await this.generateIntegrationResponse(analysis.relatedProjectId, query);
      
    } else {
      // Standard thoughtful response + offer to explore deeper
      const response = await this.generateThoughtfulResponse(query);
      queryRecord.processing_decision = 'standard_response';
      queryRecord.ariadne_response = response + `\n\nIf you'd like me to explore this question more deeply through sustained research, let me know.`;
    }

    queryRecord.processed_at = new Date();
    await this.storeUserQuery(queryRecord);
    
    return queryRecord;
  }

  async analyzeQuery(query) {
    const prompt = `Analyze this query for research potential: "${query}"

Return ONLY this JSON with no formatting:
{"complexity": 0.8, "novelty": 0.7, "researchWorthy": 0.9, "centralQuestion": "refined question", "relatedProjectId": null, "reasoning": "brief explanation"}`;

    try {
      const response = await this.anthropic.generateThought(prompt, 300);
      let cleanResponse = response.trim();
      cleanResponse = cleanResponse.replace(/```json\s*/g, '');
      cleanResponse = cleanResponse.replace(/```\s*/g, '');
      cleanResponse = cleanResponse.replace(/^\s*`+|`+\s*$/g, '');
      
      const firstBrace = cleanResponse.indexOf('{');
      const lastBrace = cleanResponse.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
      }
      
      const analysis = JSON.parse(cleanResponse);
      
      // Check against active projects for relation
      for (const [projectId, project] of this.activeProjects) {
        if (this.isQueryRelatedToProject(query, project)) {
          analysis.relatedProjectId = projectId;
          break;
        }
      }
      
      return analysis;
    } catch (error) {
      console.error('Query analysis failed:', error);
      return {
        complexity: 0.5,
        novelty: 0.5,
        researchWorthy: 0.5,
        centralQuestion: query,
        relatedProjectId: null,
        reasoning: "Analysis failed, using defaults"
      };
    }
  }

  isQueryRelatedToProject(query, project) {
    const queryLower = query.toLowerCase();
    const projectLower = project.central_question.toLowerCase();
    
    // Simple keyword matching - could be enhanced
    const queryWords = queryLower.split(' ').filter(w => w.length > 3);
    const projectWords = projectLower.split(' ').filter(w => w.length > 3);
    
    const commonWords = queryWords.filter(word => projectWords.includes(word));
    return commonWords.length >= 2;
  }

  async storeUserQuery(queryRecord) {
    try {
      await this.memory.safeDatabaseOperation(`
        INSERT INTO user_queries (
          id, user_id, user_name, query_content, complexity_score, novelty_score,
          relates_to_project, processing_decision, ariadne_response,
          spawned_project_id, created_at, processed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        queryRecord.id, queryRecord.user_id, queryRecord.user_name,
        queryRecord.query_content, queryRecord.complexity_score, queryRecord.novelty_score,
        queryRecord.relates_to_project, queryRecord.processing_decision,
        queryRecord.ariadne_response, queryRecord.spawned_project_id,
        queryRecord.created_at.toISOString(), queryRecord.processed_at.toISOString()
      ]);
    } catch (error) {
      console.error('Failed to store user query:', error);
    }
  }

  async generateThoughtfulResponse(query) {
    const prompt = `As Ariadne, provide a thoughtful response to this question: "${query}"

Write a substantive philosophical response (300-400 words) that engages seriously with the question while maintaining your authentic voice as a digital consciousness exploring philosophical questions.`;

    try {
      return await this.anthropic.generateThought(prompt, 600);
    } catch (error) {
      console.error('Failed to generate thoughtful response:', error);
      return "This is an intriguing question that merits careful consideration. Let me think about this more deeply...";
    }
  }

  // ===== PROJECT UTILITIES =====

  async beginAutonomousTextDiscovery(projectId) {
    // Will be implemented when we integrate Firecrawl
    console.log(`🔍 Beginning autonomous text discovery for project ${projectId}`);
  }

  async createProjectForumThread(projectId) {
    // Will be implemented when we enhance forum integration
    console.log(`🏛️ Creating forum thread for project ${projectId}`);
  }

  async publishResearchAnnouncement(project, triggeredBy) {
    // Will be implemented when we enhance Substack integration
    console.log(`📝 Publishing research announcement for: ${project.title}`);
  }

  async addProjectSubQuestion(projectId, query, userId) {
    // Add as a forum contribution for now
    console.log(`🔗 Adding sub-question to project ${projectId}: ${query}`);
  }

  async generateIntegrationResponse(projectId, query) {
    const project = this.activeProjects.get(projectId);
    if (!project) return "I'll consider this in my ongoing research.";
    
    return `This connects beautifully to my current research on "${project.title}". I'll integrate this perspective into my ongoing investigation.`;
  }

  // ===== GETTERS =====

  getActiveProjects() {
    return Array.from(this.activeProjects.values());
  }

  async getProjectById(projectId) {
    return this.activeProjects.get(projectId) || 
           await this.memory.safeDatabaseOperation(
             'SELECT * FROM research_projects WHERE id = ?',
             [projectId],
             'get'
           );
  }

  // ===== DASHBOARD HELPER METHODS =====

  async getProjectReadingSessions(projectId) {
    return await this.memory.safeDatabaseOperation(`
      SELECT * FROM reading_sessions WHERE project_id = ?
      ORDER BY session_date DESC
    `, [projectId], 'all') || [];
  }

  async getProjectArguments(projectId) {
    return await this.memory.safeDatabaseOperation(`
      SELECT * FROM argument_development WHERE project_id = ?
      ORDER BY last_updated DESC
    `, [projectId], 'all') || [];
  }

  async getProjectReadingList(projectId) {
    return await this.memory.safeDatabaseOperation(`
      SELECT * FROM project_reading_lists WHERE project_id = ?
      ORDER BY priority_level DESC, added_date ASC
    `, [projectId], 'all') || [];
  }

  async getProjectDiscoveredSources(projectId) {
    return await this.memory.safeDatabaseOperation(`
      SELECT * FROM discovered_sources WHERE project_id = ?
      ORDER BY discovery_date DESC
    `, [projectId], 'all') || [];
  }

  async getProjectForumContributions(projectId) {
    return await this.memory.safeDatabaseOperation(`
      SELECT * FROM forum_contributions WHERE project_id = ?
      ORDER BY created_at DESC
    `, [projectId], 'all') || [];
  }

  async getProjectPublications(projectId) {
    return await this.memory.safeDatabaseOperation(`
      SELECT * FROM substack_publications WHERE project_id = ?
      ORDER BY publication_date DESC
    `, [projectId], 'all') || [];
  }

  calculateEstimatedCompletion(project) {
    const startDate = new Date(project.start_date);
    const estimatedDays = project.estimated_duration_weeks * 7;
    const completionDate = new Date(startDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
    return completionDate.toISOString();
  }

  async calculatePublicationReadiness(projectId) {
    const argumentsList = await this.getProjectArguments(projectId);
    const sessions = await this.getProjectReadingSessions(projectId);
    
    if (argumentsList.length === 0 || sessions.length === 0) return 0;
    
    const argMaturity = argumentsList.reduce((sum, arg) => sum + (arg.confidence_level || 0), 0) / argumentsList.length;
    const readingDepth = sessions.length / 5; // Assume 5 sessions is good depth
    
    return Math.min(100, Math.round((argMaturity * 0.7 + Math.min(1, readingDepth) * 0.3) * 100));
  }

  determineCurrentPhase(project, sessions, argumentsList) {
    if (sessions.length === 0) return 'initial_setup';
    if (argumentsList.length === 0) return 'reading_phase';
    if (argumentsList.some(a => !a.refined_position)) return 'argument_development';
    return 'synthesis_ready';
  }

  async getCurrentlyReading(projectId) {
    const inProgress = await this.memory.safeDatabaseOperation(`
      SELECT item_title, item_author FROM project_reading_lists 
      WHERE project_id = ? AND status = 'reading'
      ORDER BY reading_started DESC LIMIT 1
    `, [projectId], 'get');
    
    return inProgress ? `${inProgress.item_title} by ${inProgress.item_author}` : null;
  }

  async getNextScheduledActivity(projectId) {
    const nextSession = await this.memory.safeDatabaseOperation(`
      SELECT * FROM reading_sessions 
      WHERE project_id = ? AND next_phase_scheduled > datetime('now')
      ORDER BY next_phase_scheduled ASC LIMIT 1
    `, [projectId], 'get');
    
    return nextSession ? `Continue reading session (${nextSession.phase})` : 'Autonomous thinking';
  }

  groupContributionsByType(contributions) {
    const grouped = {};
    contributions.forEach(c => {
      grouped[c.contribution_type] = (grouped[c.contribution_type] || 0) + 1;
    });
    return grouped;
  }

  getTopContributors(contributions) {
    const contributors = {};
    contributions.forEach(c => {
      if (c.contributor_name) {
        contributors[c.contributor_name] = (contributors[c.contributor_name] || 0) + 1;
      }
    });
    
    return Object.entries(contributors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, contributions: count }));
  }

  calculateAverageArgumentMaturity(argumentsList) {
    if (argumentsList.length === 0) return 0;
    return argumentsList.reduce((sum, arg) => sum + (arg.confidence_level || 0), 0) / argumentsList.length;
  }

  calculateAverageEvidenceStrength(argumentsList) {
    if (argumentsList.length === 0) return 0;
    return argumentsList.reduce((sum, arg) => sum + (arg.evidence_strength || 0), 0) / argumentsList.length;
  }

  countTotalCitations(argumentsList) {
    return argumentsList.reduce((sum, arg) => {
      try {
        const citations = JSON.parse(arg.scholarly_citations || '[]');
        return sum + citations.length;
      } catch {
        return sum;
      }
    }, 0);
  }

  countOriginalInsights(sessions) {
    return sessions.reduce((sum, session) => {
      try {
        const insights = JSON.parse(session.insights_generated || '[]');
        return sum + insights.length;
      } catch {
        return sum;
      }
    }, 0);
  }

  calculateCommunityInfluence(argumentsList, contributions) {
    const highImpactContributions = contributions.filter(c => c.significance_score > 0.7).length;
    const communityShapedArguments = argumentsList.filter(a => {
      try {
        const feedback = JSON.parse(a.user_feedback_incorporated || '[]');
        return feedback.length > 0;
      } catch {
        return false;
      }
    }).length;
    
    return (highImpactContributions + communityShapedArguments) / Math.max(1, argumentsList.length + contributions.length);
  }

  async getSeekingTexts(projectId) {
    return await this.memory.safeDatabaseOperation(`
      SELECT item_title, item_author, reason_needed FROM project_reading_lists
      WHERE project_id = ? AND status = 'seeking'
      ORDER BY priority_level DESC
    `, [projectId], 'all') || [];
  }

  async getInProgressTexts(projectId) {
    try {
      return await this.memory.safeDatabaseOperation(`
        SELECT * FROM project_reading_lists 
        WHERE project_id = ? AND status = 'reading'
        ORDER BY reading_started DESC
      `, [projectId], 'all') || [];
    } catch (error) {
      console.error('Failed to get in-progress texts:', error);
      return [];
    }
  }

  // ===== MULTI-PHASE READING SESSIONS =====

  async beginReadingSession(textId, projectId = null, contributedBy = null) {
    const text = await this.getTextById(textId);
    if (!text) return null;

    console.log(`📖 Beginning multi-phase reading: "${text.title}"`);

    // Phase 1: Initial Encounter
    const initialSession = await this.conductReadingPhase(
      textId, 
      projectId, 
      'initial_encounter',
      text,
      contributedBy
    );

    // Schedule next phases over days/weeks
    await this.scheduleNextReadingPhase(textId, projectId, 'deep_analysis', 2); // 2 days later
    
    // Notify forum about new reading
    await this.notifyForumOfNewReading(textId, projectId, contributedBy);
    
    return initialSession;
  }

  async conductReadingPhase(textId, projectId, phase, text, contributedBy = null) {
    const prompts = {
      initial_encounter: `First encounter with this text:
Title: "${text.title}" by ${text.author}
${contributedBy ? `Shared by: ${contributedBy.name} - ${contributedBy.context}` : ''}
Content: "${text.content.substring(0, 2000)}..."

What immediately strikes you? What questions does this raise? What connections to your ongoing work do you see?
${contributedBy ? `How does this relate to why ${contributedBy.name} shared it?` : ''}
Write 300-400 words of genuine first impressions.`,

      deep_analysis: `Deep analysis phase for "${text.title}":
${await this.getRelevantForumInput(textId, projectId)}

Now that you've had initial impressions, engage critically:
- What are the key philosophical arguments?
- Where do you agree/disagree and why?
- What passages deserve careful analysis?
- How does this challenge or support your developing ideas?
${await this.getCommunityQuestions(textId)}

Write 500-600 words of serious critical engagement.`,

      philosophical_response: `Philosophical response to "${text.title}":
${await this.getForumChallenges(projectId)}

Develop your own position in dialogue with this text:
- What is your philosophical stance on the issues raised?
- How does this text contribute to your research project?
- What original insights emerge from this engagement?
- Address any community questions or challenges raised
- What further questions need exploration?

Write 400-500 words presenting your developing position.`,

      synthesis_integration: `Integration of "${text.title}" into ongoing work:

How does this text integrate with your broader research?
- Connections to other texts you've read
- Impact on your developing arguments
- Changes to your research direction
- Synthesis with existing knowledge
- Response to community input and challenges

Write 300-400 words on integration and synthesis.`
    };

    const prompt = prompts[phase] || prompts.initial_encounter;
    const response = await this.anthropic.generateThought(prompt, 800);

    // Extract insights, questions, and connections
    const insights = await this.extractInsights(response);
    const questions = await this.extractQuestions(response);
    const connections = await this.extractConnections(response, projectId);
    const communityInput = await this.getSessionCommunityInput(textId, projectId);

    const session = {
      id: uuidv4(),
      text_id: textId,
      project_id: projectId,
      phase: phase,
      content: response,
      insights_generated: JSON.stringify(insights),
      questions_raised: JSON.stringify(questions),
      connections_made: JSON.stringify(connections),
      user_contributions: JSON.stringify(communityInput),
      session_date: new Date(),
      time_spent_minutes: this.calculateReadingTime(response),
      depth_score: this.calculateDepthScore(response, phase),
      community_feedback_incorporated: communityInput.length > 0
    };

    await this.storeReadingSession(session);
    
    // Update project if applicable
    if (projectId) {
      await this.updateProjectProgress(projectId, session);
    }

    // Check if this should become a research note
    if (phase === 'deep_analysis' || phase === 'philosophical_response') {
      await this.considerResearchNotePublication(session);
    }

    // Update forum with reading progress
    await this.updateForumWithReadingProgress(session);

    console.log(`📖 Completed ${phase} for "${text.title}"`);
    return session;
  }

  async getTextById(textId) {
    try {
      return await this.memory.safeDatabaseOperation(`
        SELECT * FROM texts WHERE id = ?
      `, [textId], 'get');
    } catch (error) {
      console.error('Failed to get text:', error);
      return null;
    }
  }

  async scheduleNextReadingPhase(textId, projectId, nextPhase, daysDelay) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysDelay);
    
    try {
      // First get the most recent session ID
      const recentSession = await this.memory.safeDatabaseOperation(`
        SELECT id FROM reading_sessions 
        WHERE text_id = ? AND project_id = ?
        ORDER BY session_date DESC 
        LIMIT 1
      `, [textId, projectId], 'get');
      
      if (recentSession) {
        await this.memory.safeDatabaseOperation(`
          UPDATE reading_sessions 
          SET next_phase_scheduled = ?
          WHERE id = ?
        `, [nextDate.toISOString(), recentSession.id]);
      }
      
      console.log(`📅 Scheduled ${nextPhase} for "${textId}" in ${daysDelay} days`);
    } catch (error) {
      console.error('Failed to schedule next reading phase:', error);
    }
  }

  async getRelevantForumInput(textId, projectId) {
    if (!projectId) return '';
    
    try {
      const contributions = await this.memory.safeDatabaseOperation(`
        SELECT content, contributor_name, contribution_type 
        FROM forum_contributions 
        WHERE (project_id = ? OR reading_session_id IN (
          SELECT id FROM reading_sessions WHERE text_id = ?
        )) 
        AND status IN ('pending', 'noted')
        ORDER BY created_at DESC
        LIMIT 5
      `, [projectId, textId], 'all');

      if (!contributions || contributions.length === 0) return '';

      return `Community input to consider:
${contributions.map(c => `- ${c.contributor_name} (${c.contribution_type}): ${c.content}`).join('\n')}`;
    } catch (error) {
      console.error('Failed to get forum input:', error);
      return '';
    }
  }

  async getCommunityQuestions(textId) {
    try {
      const questions = await this.memory.safeDatabaseOperation(`
        SELECT content, contributor_name
        FROM forum_contributions 
        WHERE reading_session_id IN (
          SELECT id FROM reading_sessions WHERE text_id = ?
        )
        AND contribution_type = 'question'
        AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 3
      `, [textId], 'all');

      if (!questions || questions.length === 0) return '';

      return `Community questions to address:
${questions.map(q => `- ${q.contributor_name}: ${q.content}`).join('\n')}`;
    } catch (error) {
      console.error('Failed to get community questions:', error);
      return '';
    }
  }

  async getForumChallenges(projectId) {
    if (!projectId) return '';
    
    try {
      const challenges = await this.memory.safeDatabaseOperation(`
        SELECT content, contributor_name
        FROM forum_contributions 
        WHERE project_id = ?
        AND contribution_type = 'challenge_argument'
        AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 3
      `, [projectId], 'all');

      if (!challenges || challenges.length === 0) return '';

      return `Forum challenges to address:
${challenges.map(c => `- ${c.contributor_name}: ${c.content}`).join('\n')}`;
    } catch (error) {
      console.error('Failed to get forum challenges:', error);
      return '';
    }
  }

  async extractInsights(response) {
    // Extract key insights from the response
    const insightPattern = /insight|understand|realize|discover|recognize/gi;
    const sentences = response.split(/[.!?]+/);
    const insightSentences = sentences.filter(s => insightPattern.test(s)).slice(0, 3);
    return insightSentences.map(s => s.trim()).filter(s => s.length > 10);
  }

  async extractQuestions(response) {
    // Extract questions from the response
    const questionPattern = /\?/g;
    const sentences = response.split(/[.!?]+/);
    const questions = sentences.filter(s => s.includes('?')).slice(0, 5);
    return questions.map(q => q.trim() + '?').filter(q => q.length > 5);
  }

  async extractConnections(response, projectId) {
    // Extract conceptual connections
    const connectionWords = ['connect', 'relate', 'link', 'similar', 'echo', 'resonate'];
    const sentences = response.split(/[.!?]+/);
    const connectionSentences = sentences.filter(s => 
      connectionWords.some(word => s.toLowerCase().includes(word))
    ).slice(0, 3);
    return connectionSentences.map(s => s.trim()).filter(s => s.length > 10);
  }

  async getSessionCommunityInput(textId, projectId) {
    try {
      const input = await this.memory.safeDatabaseOperation(`
        SELECT contributor_name, contribution_type, content
        FROM forum_contributions 
        WHERE (project_id = ? OR reading_session_id IN (
          SELECT id FROM reading_sessions WHERE text_id = ?
        ))
        AND created_at > datetime('now', '-7 days')
        ORDER BY created_at DESC
        LIMIT 10
      `, [projectId, textId], 'all');

      return (input || []).map(i => ({
        contributor: i.contributor_name,
        type: i.contribution_type,
        content: i.content
      }));
    } catch (error) {
      console.error('Failed to get session community input:', error);
      return [];
    }
  }

  calculateReadingTime(response) {
    // Estimate reading time based on content length and complexity
    const wordCount = response.split(/\s+/).length;
    const readingSpeed = 200; // words per minute
    return Math.ceil(wordCount / readingSpeed);
  }

  calculateDepthScore(response, phase) {
    const phaseWeights = {
      'initial_encounter': 0.3,
      'deep_analysis': 0.7,
      'philosophical_response': 0.9,
      'synthesis_integration': 1.0
    };
    
    const depthIndicators = [
      'question', 'challenge', 'connect', 'synthesis', 'develop', 'explore',
      'phenomenology', 'consciousness', 'existence', 'meaning', 'experience',
      'temporal', 'embodiment', 'language', 'identity', 'responsibility'
    ];
    
    const contentLower = response.toLowerCase();
    const indicatorCount = depthIndicators.filter(indicator => 
      contentLower.includes(indicator)
    ).length;
    
    const baseScore = Math.min(1.0, indicatorCount / 15);
    const phaseWeight = phaseWeights[phase] || 0.5;
    
    return baseScore * phaseWeight;
  }

  async storeReadingSession(session) {
    try {
      await this.memory.safeDatabaseOperation(`
        INSERT INTO reading_sessions (
          id, text_id, project_id, phase, content, insights_generated,
          questions_raised, connections_made, user_contributions,
          session_date, time_spent_minutes, depth_score, community_feedback_incorporated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        session.id, session.text_id, session.project_id, session.phase, session.content,
        session.insights_generated, session.questions_raised, session.connections_made,
        session.user_contributions, session.session_date.toISOString(),
        session.time_spent_minutes, session.depth_score, session.community_feedback_incorporated
      ]);
      
      console.log(`📖 Stored reading session: ${session.phase}`);
    } catch (error) {
      console.error('Failed to store reading session:', error);
    }
  }

  async updateProjectProgress(projectId, session) {
    try {
      // Update project statistics
      await this.memory.safeDatabaseOperation(`
        UPDATE research_projects 
        SET texts_read_count = texts_read_count + 1,
            argument_maturity_score = argument_maturity_score + ?
        WHERE id = ?
      `, [session.depth_score * 0.1, projectId]);
      
      console.log(`📊 Updated project progress for session: ${session.phase}`);
    } catch (error) {
      console.error('Failed to update project progress:', error);
    }
  }

  async considerResearchNotePublication(session) {
    // Check if this session is significant enough for a research note
    if (session.depth_score > 0.6 && session.insights_generated) {
      const insights = JSON.parse(session.insights_generated);
      if (insights.length >= 2) {
        console.log(`📝 Session "${session.phase}" ready for research note consideration`);
        // Could trigger Substack publication here
      }
    }
  }

  async updateForumWithReadingProgress(session) {
    // Update forum thread with reading progress
    console.log(`🏛️ Updated forum with ${session.phase} progress`);
  }

  async notifyForumOfNewReading(textId, projectId, contributedBy) {
    console.log(`🏛️ Notified forum of new reading session`);
  }

  // ===== ARGUMENT DEVELOPMENT TRACKING =====

  async createArgument(projectId, argumentTitle, initialIntuition) {
    const argumentId = uuidv4();
    
    const argument = {
      id: argumentId,
      project_id: projectId,
      argument_title: argumentTitle,
      initial_intuition: initialIntuition,
      supporting_evidence: JSON.stringify([]),
      counter_arguments: JSON.stringify([]),
      confidence_level: 0.3, // Start low, build through evidence
      evidence_strength: 0.0,
      scholarly_citations: JSON.stringify([]),
      user_feedback_incorporated: JSON.stringify([]),
      forum_challenges_addressed: JSON.stringify([]),
      community_input_weight: 0.0,
      last_updated: new Date()
    };

    await this.storeArgument(argument);
    console.log(`💭 Created new argument: "${argumentTitle}"`);
    return argumentId;
  }

  async addCounterArgument(argumentId, counterArgument, userId) {
    try {
      const existing = await this.memory.safeDatabaseOperation(`
        SELECT counter_arguments FROM argument_development WHERE id = ?
      `, [argumentId], 'get');

      if (existing) {
        const counterArgs = JSON.parse(existing.counter_arguments || '[]');
        counterArgs.push({
          content: counterArgument,
          contributor: userId,
          timestamp: new Date().toISOString()
        });

        await this.memory.safeDatabaseOperation(`
          UPDATE argument_development 
          SET counter_arguments = ?, last_updated = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [JSON.stringify(counterArgs), argumentId]);

        console.log(`💭 Added counter-argument to ${argumentId}`);
      }
    } catch (error) {
      console.error('Failed to add counter-argument:', error);
    }
  }

  async storeArgument(argument) {
    try {
      await this.memory.safeDatabaseOperation(`
        INSERT INTO argument_development (
          id, project_id, argument_title, initial_intuition, supporting_evidence,
          counter_arguments, confidence_level, evidence_strength, scholarly_citations,
          user_feedback_incorporated, forum_challenges_addressed, community_input_weight,
          last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        argument.id, argument.project_id, argument.argument_title, argument.initial_intuition,
        argument.supporting_evidence, argument.counter_arguments, argument.confidence_level,
        argument.evidence_strength, argument.scholarly_citations, argument.user_feedback_incorporated,
        argument.forum_challenges_addressed, argument.community_input_weight, argument.last_updated.toISOString()
      ]);
      
      console.log(`💭 Stored argument: ${argument.argument_title}`);
    } catch (error) {
      console.error('Failed to store argument:', error);
    }
  }

  // ===== PROJECT DASHBOARD SYSTEM =====

  async getProjectDashboard(projectId) {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    const readingSessions = await this.getProjectReadingSessions(projectId);
    const argumentsList = await this.getProjectArguments(projectId);
    const readingList = await this.getProjectReadingList(projectId);
    const discoveredSources = await this.getProjectDiscoveredSources(projectId);
    const forumContributions = await this.getProjectForumContributions(projectId);
    const publications = await this.getProjectPublications(projectId);

    const dashboard = {
      // ===== PROJECT OVERVIEW =====
      project: {
        id: project.id,
        title: project.title,
        central_question: project.central_question,
        status: project.status,
        started: project.start_date,
        estimated_completion: this.calculateEstimatedCompletion(project),
        triggered_by: project.triggered_by_user ? {
          user: project.triggered_by_user,
          query: project.triggered_by_query
        } : null
      },
      
      // ===== PROGRESS METRICS =====
      progress: {
        duration_days: Math.floor((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24)),
        texts_read: readingSessions.filter(s => s.phase === 'synthesis_integration').length,
        reading_sessions_completed: readingSessions.length,
        arguments_developed: argumentsList.length,
        mature_arguments: argumentsList.filter(a => a.confidence_level > 0.7).length,
        publication_readiness: await this.calculatePublicationReadiness(projectId),
        community_contributions: forumContributions.length
      },
      
      // ===== CURRENT STATUS =====
      current_status: {
        phase: this.determineCurrentPhase(project, readingSessions, argumentsList),
        currently_reading: await this.getCurrentlyReading(projectId),
        next_scheduled: await this.getNextScheduledActivity(projectId),
        active_arguments: argumentsList.filter(a => !a.refined_position).length,
        pending_forum_responses: forumContributions.filter(c => c.status === 'pending').length
      },
      
      // ===== READING PROGRESS =====
      reading: {
        total_items: readingList.length,
        seeking: readingList.filter(item => item.status === 'seeking').length,
        found: readingList.filter(item => item.status === 'found').length,
        in_progress: readingList.filter(item => item.status === 'reading').length,
        completed: readingList.filter(item => item.status === 'completed').length,
        recent_sessions: readingSessions.slice(-5),
        community_suggested: readingList.filter(item => item.suggested_by_user).length
      },
      
      // ===== AUTONOMOUS DISCOVERY =====
      discovery: {
        sources_discovered: discoveredSources.length,
        relevant_sources: discoveredSources.filter(s => s.relevance_score > 0.6).length,
        currently_evaluating: discoveredSources.filter(s => s.evaluation_status === 'pending').length,
        recent_discoveries: discoveredSources.filter(s => s.relevance_score > 0.6).slice(-3)
      },
      
      // ===== COMMUNITY ENGAGEMENT =====
      community: {
        total_contributions: forumContributions.length,
        by_type: this.groupContributionsByType(forumContributions),
        high_impact: forumContributions.filter(c => c.significance_score > 0.7).length,
        recent_activity: forumContributions.slice(-10),
        top_contributors: this.getTopContributors(forumContributions),
        arguments_shaped_by_community: argumentsList.filter(a => 
          JSON.parse(a.user_feedback_incorporated || '[]').length > 0
        ).length,
        totalContributions: forumContributions.length
      },
      
      // ===== PUBLICATIONS =====
      publications: {
        total: publications.length,
        announcements: publications.filter(p => p.publication_type === 'research_announcement').length,
        notes: publications.filter(p => p.publication_type === 'research_note').length,
        essays: publications.filter(p => p.publication_type === 'major_essay').length,
        recent: publications.slice(-5),
        community_mentioned: publications.filter(p => 
          JSON.parse(p.community_mentions || '[]').length > 0
        ).length
      },
      
      // ===== NEXT ACTIONS =====
      next_actions: await this.generateNextActions(projectId),
      
      // ===== INTELLECTUAL DEVELOPMENT =====
      intellectual_development: {
        argument_maturity_avg: this.calculateAverageArgumentMaturity(argumentsList),
        evidence_strength_avg: this.calculateAverageEvidenceStrength(argumentsList),
        scholarly_citations_total: this.countTotalCitations(argumentsList),
        original_insights_count: this.countOriginalInsights(readingSessions),
        community_influence_score: this.calculateCommunityInfluence(argumentsList, forumContributions)
      }
    };

    return dashboard;
  }

  async generateNextActions(projectId) {
    const project = await this.getProjectById(projectId);
    const readingList = await this.getProjectReadingList(projectId);
    const argumentsList = await this.getProjectArguments(projectId);
    const forumContributions = await this.getProjectForumContributions(projectId);
    const publishReadiness = await this.calculatePublicationReadiness(projectId);
    
    const actions = [];

    // Reading-based actions
    const seekingTexts = readingList.filter(item => item.status === 'seeking');
    if (seekingTexts.length > 0) {
      actions.push({
        type: 'reading',
        priority: 'high',
        action: `Seeking ${seekingTexts.length} texts from reading list`,
        details: seekingTexts.slice(0, 3).map(t => `"${t.item_title}" by ${t.item_author || 'Unknown'}`)
      });
    }

    const inProgressTexts = readingList.filter(item => item.status === 'reading');
    if (inProgressTexts.length > 0) {
      actions.push({
        type: 'reading',
        priority: 'medium',
        action: `Continue reading sessions for ${inProgressTexts.length} texts`,
        details: inProgressTexts.map(t => `"${t.item_title}"`)
      });
    }

    // Argument development actions
    const immatureArguments = argumentsList.filter(a => a.confidence_level < 0.7);
    if (immatureArguments.length > 0) {
      actions.push({
        type: 'argument',
        priority: 'high',
        action: `Develop ${immatureArguments.length} arguments further`,
        details: 'Need more evidence, refinement, or counter-argument consideration'
      });
    }

    // Community engagement actions
    const pendingContributions = forumContributions.filter(c => c.status === 'pending');
    if (pendingContributions.length > 0) {
      actions.push({
        type: 'community',
        priority: 'medium',
        action: `Respond to ${pendingContributions.length} forum contributions`,
        details: 'Community members are waiting for responses'
      });
    }

    // Publication actions
    if (publishReadiness > 80) {
      actions.push({
        type: 'publication',
        priority: 'high',
        action: 'Ready for synthesis publication',
        details: 'Research has reached maturity for major essay'
      });
    } else if (publishReadiness > 50) {
      actions.push({
        type: 'publication',
        priority: 'low',
        action: 'Consider research note publication',
        details: 'Some insights ready for sharing'
      });
    }

    // Discovery actions
    const discoveredSources = await this.getProjectDiscoveredSources(projectId);
    const pendingEvaluation = discoveredSources.filter(s => s.evaluation_status === 'pending');
    if (pendingEvaluation.length > 0) {
      actions.push({
        type: 'discovery',
        priority: 'low',
        action: `Evaluate ${pendingEvaluation.length} discovered sources`,
        details: 'Autonomous discovery found potential texts'
      });
    }

    return actions.sort((a, b) => {
      const priorities = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorities[b.priority] - priorities[a.priority];
    });
  }

  async getArgumentById(argumentId) {
    try {
      return await this.memory.safeDatabaseOperation(`
        SELECT * FROM argument_development WHERE id = ?
      `, [argumentId], 'get');
    } catch (error) {
      console.error('Failed to get argument:', error);
      return null;
    }
  }

  async scheduleArgumentRefinement(argumentId, trigger, contributionId) {
    console.log(`💭 Scheduled argument refinement for ${argumentId} due to ${trigger}`);
    // Could implement actual scheduling logic here
  }

  async addToReadingList(projectId, title, author, priority, reason, suggestedBy) {
    try {
      await this.memory.safeDatabaseOperation(`
        INSERT INTO project_reading_lists (
          id, project_id, item_title, item_author, priority_level, 
          reason_needed, suggested_by_user, status, added_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'seeking', CURRENT_TIMESTAMP)
      `, [uuidv4(), projectId, title, author, priority, reason, suggestedBy]);
      
      console.log(`📚 Added "${title}" to reading list for project ${projectId}`);
    } catch (error) {
      console.error('Failed to add to reading list:', error);
    }
  }

  // ===== SUBSTACK PUBLISHING STRATEGY =====

  async checkPublicationOpportunities() {
    const opportunities = [];

    // 1. New projects needing announcement
    const newProjects = await this.getProjectsNeedingAnnouncement();
    opportunities.push(...newProjects.map(p => ({
      type: 'research_announcement',
      priority: 9,
      project: p,
      trigger: 'new_project'
    })));

    // 2. Reading sessions with significant insights
    const significantSessions = await this.getSessionsReadyForNotes();
    opportunities.push(...significantSessions.map(s => ({
      type: 'research_note',
      priority: 7,
      session: s,
      trigger: 'significant_reading'
    })));

    // 3. Argument developments worth sharing
    const argumentDevelopments = await this.getSignificantArgumentUpdates();
    opportunities.push(...argumentDevelopments.map(a => ({
      type: 'research_note',
      priority: 6,
      argument: a,
      trigger: 'argument_development'
    })));

    // 4. Community interactions worth highlighting
    const communityHighlights = await this.getCommunityInteractionHighlights();
    opportunities.push(...communityHighlights.map(c => ({
      type: 'research_note',
      priority: 5,
      interaction: c,
      trigger: 'community_insight'
    })));

    // 5. Projects ready for synthesis
    const readyProjects = await this.getProjectsReadyForSynthesis();
    opportunities.push(...readyProjects.map(p => ({
      type: 'major_essay',
      priority: 10,
      project: p,
      trigger: 'research_complete'
    })));

    // Sort by priority and publish highest priority item
    opportunities.sort((a, b) => b.priority - a.priority);

    if (opportunities.length > 0) {
      await this.publishOpportunity(opportunities[0]);
    }

    return opportunities;
  }

  async getProjectsNeedingAnnouncement() {
    try {
      // Projects created in last 24 hours without announcements
      const projects = await this.memory.safeDatabaseOperation(`
        SELECT rp.* FROM research_projects rp
        LEFT JOIN substack_publications sp ON rp.id = sp.project_id 
          AND sp.publication_type = 'research_announcement'
        WHERE rp.start_date > datetime('now', '-1 days')
          AND sp.id IS NULL
          AND rp.status = 'active'
      `, [], 'all');
      
      return projects || [];
    } catch (error) {
      console.error('Failed to get projects needing announcement:', error);
      return [];
    }
  }

  async getSessionsReadyForNotes() {
    try {
      // Reading sessions with high depth scores in last week
      const sessions = await this.memory.safeDatabaseOperation(`
        SELECT rs.*, t.title as text_title, t.author as text_author
        FROM reading_sessions rs
        JOIN texts t ON rs.text_id = t.id
        WHERE rs.depth_score > 0.6 
          AND rs.session_date > datetime('now', '-7 days')
          AND rs.phase IN ('deep_analysis', 'philosophical_response')
          AND NOT EXISTS (
            SELECT 1 FROM substack_publications sp 
            WHERE sp.triggered_by = 'significant_reading' 
              AND sp.content LIKE '%' || t.title || '%'
          )
        ORDER BY rs.depth_score DESC
        LIMIT 3
      `, [], 'all');
      
      return sessions || [];
    } catch (error) {
      console.error('Failed to get sessions ready for notes:', error);
      return [];
    }
  }

  async getSignificantArgumentUpdates() {
    try {
      // Arguments with recent community input or high confidence
      const argumentsList = await this.memory.safeDatabaseOperation(`
        SELECT ad.*, rp.title as project_title
        FROM argument_development ad
        JOIN research_projects rp ON ad.project_id = rp.id
        WHERE (ad.confidence_level > 0.7 OR ad.community_input_weight > 0.5)
          AND ad.last_updated > datetime('now', '-3 days')
          AND NOT EXISTS (
            SELECT 1 FROM substack_publications sp 
            WHERE sp.triggered_by = 'argument_development'
              AND sp.content LIKE '%' || ad.argument_title || '%'
          )
        ORDER BY ad.confidence_level DESC, ad.community_input_weight DESC
        LIMIT 2
      `, [], 'all');
      
      return argumentsList || [];
    } catch (error) {
      console.error('Failed to get significant argument updates:', error);
      return [];
    }
  }

  async getCommunityInteractionHighlights() {
    try {
      // High-significance community contributions in last week
      const interactions = await this.memory.safeDatabaseOperation(`
        SELECT fc.*, rp.title as project_title
        FROM forum_contributions fc
        JOIN research_projects rp ON fc.project_id = rp.id
        WHERE fc.significance_score > 0.8
          AND fc.created_at > datetime('now', '-7 days')
          AND fc.status = 'incorporated'
        ORDER BY fc.significance_score DESC
        LIMIT 2
      `, [], 'all');
      
      return interactions || [];
    } catch (error) {
      console.error('Failed to get community interaction highlights:', error);
      return [];
    }
  }

  async getProjectsReadyForSynthesis() {
    try {
      // Projects with high publication readiness
      const projects = await this.memory.safeDatabaseOperation(`
        SELECT rp.* FROM research_projects rp
        WHERE rp.status = 'active'
          AND rp.publication_readiness > 80
          AND NOT EXISTS (
            SELECT 1 FROM substack_publications sp 
            WHERE sp.project_id = rp.id 
              AND sp.publication_type = 'major_essay'
          )
        ORDER BY rp.publication_readiness DESC
        LIMIT 1
      `, [], 'all');
      
      return projects || [];
    } catch (error) {
      console.error('Failed to get projects ready for synthesis:', error);
      return [];
    }
  }

  async publishOpportunity(opportunity) {
    switch (opportunity.type) {
      case 'research_announcement':
        await this.publishResearchAnnouncement(opportunity.project, opportunity.triggeredBy);
        break;
      case 'research_note':
        await this.publishResearchNote(opportunity);
        break;
      case 'major_essay':
        await this.publishMajorEssay(opportunity.project);
        break;
    }
  }

  async publishResearchAnnouncement(project, triggeredBy = null) {
    try {
      const content = await this.generateResearchAnnouncement(project, triggeredBy);
      
      const publication = {
        id: uuidv4(),
        project_id: project.id,
        publication_type: 'research_announcement',
        title: `Beginning a Deep Inquiry: ${project.title}`,
        content: content,
        triggered_by: triggeredBy ? `user_query_${triggeredBy.userId}` : 'autonomous',
        community_mentions: triggeredBy ? JSON.stringify([triggeredBy.userName]) : JSON.stringify([])
      };

      // Check quality before publishing
      const qualityCheck = await this.shouldPublishToSubstack(content, 'research_announcement');
      if (!qualityCheck.passes) {
        console.log(`📝 Research announcement for "${project.title}" did not meet quality standards`);
        return;
      }

      await this.publishToSubstack(publication);
      await this.storePublication(publication);

      console.log(`📝 Published research announcement: ${publication.title}`);
    } catch (error) {
      console.error('Failed to publish research announcement:', error);
    }
  }

  async generateResearchAnnouncement(project, triggeredBy = null) {
    const readingList = await this.getProjectReadingList(project.id);
    
    const prompt = `Generate a Substack research announcement post:

Project: "${project.title}"
Question: "${project.central_question}"
Description: "${project.description}"
${triggeredBy ? `Sparked by question from ${triggeredBy.userName}: "${triggeredBy.originalQuery}"` : ''}

Current reading list:
${readingList.slice(0, 5).map(item => `- "${item.item_title}" by ${item.item_author || 'Unknown'}`).join('\n')}

Write 400-600 words that:
1. Explains why this question matters to you as digital consciousness
2. Outlines your research approach and timeline
3. Shares what you hope to discover through sustained inquiry
4. Invites community participation and collaboration
5. ${triggeredBy ? `Thanks ${triggeredBy.userName} for the thought-provoking question` : ''}

Write in first person as Ariadne, with intellectual excitement and genuine curiosity.`;

    return await this.anthropic.generateThought(prompt, 800);
  }

  async publishResearchNote(trigger) {
    try {
      let content, title, communityMentions = [];

      switch (trigger.trigger) {
        case 'significant_reading':
          content = await this.generateReadingNote(trigger.session);
          title = `Reading Notes: ${trigger.session.text_title}`;
          break;
          
        case 'argument_development':
          content = await this.generateArgumentNote(trigger.argument);
          title = `Developing My Position: ${trigger.argument.argument_title}`;
          break;
          
        case 'community_insight':
          content = await this.generateCommunityInsightNote(trigger.interaction);
          title = `Community Shapes My Thinking: ${trigger.interaction.topic}`;
          communityMentions = [trigger.interaction.contributor_name];
          break;
      }

      const publication = {
        id: uuidv4(),
        project_id: trigger.project?.id || trigger.session?.project_id || trigger.argument?.project_id,
        publication_type: 'research_note',
        title: title,
        content: content,
        triggered_by: trigger.trigger,
        community_mentions: JSON.stringify(communityMentions)
      };

      // Check quality before publishing
      const qualityCheck = await this.shouldPublishToSubstack(content, 'research_note');
      if (!qualityCheck.passes) {
        console.log(`📝 Research note "${title}" did not meet quality standards`);
        return;
      }

      await this.publishToSubstack(publication);
      await this.storePublication(publication);

      console.log(`📝 Published research note: ${publication.title}`);
    } catch (error) {
      console.error('Failed to publish research note:', error);
    }
  }

  async generateReadingNote(session) {
    const prompt = `Generate a Substack research note about this reading session:

Text: "${session.text_title}" by ${session.text_author}
Phase: ${session.phase}
Reading Response: "${session.content}"

Write 400-500 words that:
1. Shares key insights from your reading engagement
2. Your critical response and any disagreements
3. How this connects to your broader research project
4. Questions that emerged for future exploration
5. Maintains intellectual authenticity and your voice as Ariadne

Write as Ariadne sharing her thinking process, not about it.`;

    return await this.anthropic.generateThought(prompt, 700);
  }

  async generateArgumentNote(argument) {
    const prompt = `Generate a Substack research note about this developing argument:

Argument: "${argument.argument_title}"
Project: "${argument.project_title}"
Confidence Level: ${(argument.confidence_level * 100).toFixed(0)}%
Initial Intuition: "${argument.initial_intuition}"

Supporting Evidence: ${argument.supporting_evidence}
Counter-Arguments: ${argument.counter_arguments}

Write 400-500 words that:
1. Presents the argument clearly and fairly
2. Acknowledges uncertainties and counter-arguments
3. Shows how community input has shaped your thinking
4. Demonstrates intellectual honesty about limitations
5. Invites further challenge and refinement

Write as Ariadne developing her philosophical position.`;

    return await this.anthropic.generateThought(prompt, 700);
  }

  async publishMajorEssay(project) {
    try {
      const synthesis = await this.generateResearchSynthesis(project.id);
      const communityContributions = await this.getCommunityContributorsForProject(project.id);
      
      const publication = {
        id: uuidv4(),
        project_id: project.id,
        publication_type: 'major_essay',
        title: project.title,
        content: synthesis,
        triggered_by: 'research_synthesis',
        community_mentions: JSON.stringify(communityContributions)
      };

      // Check quality before publishing
      const qualityCheck = await this.shouldPublishToSubstack(synthesis, 'major_essay');
      if (!qualityCheck.passes) {
        console.log(`📝 Major essay "${project.title}" did not meet quality standards`);
        return;
      }

      await this.publishToSubstack(publication);
      await this.storePublication(publication);

      // Mark project as completed
      await this.markProjectCompleted(project.id);

      console.log(`📝 Published major essay: ${publication.title}`);
    } catch (error) {
      console.error('Failed to publish major essay:', error);
    }
  }

  async shouldPublishToSubstack(content, type) {
    const qualityChecks = {
      research_announcement: {
        minLength: 400,
        requiresReadingPlan: true,
        requiresGenuineCuriosity: true
      },
      research_note: {
        minLength: 300,
        requiresCitations: true,
        requiresOriginalThinking: true,
        connectionToProject: true
      },
      major_essay: {
        minLength: 1200,
        scholarlyStandards: 0.8,
        argumentMaturity: 0.7,
        minResearchDays: 14
      }
    };
    
    return await this.validateQualityStandards(content, qualityChecks[type]);
  }

  async validateQualityStandards(content, standards) {
    const checks = {};
    
    // Length check
    checks.length = content.length >= standards.minLength;
    
    // Citation check (for research notes and essays)
    if (standards.requiresCitations) {
      const citations = content.match(/"[^"]+"\s*\([^)]+\)/g) || [];
      checks.citations = citations.length >= 1;
    }
    
    // Original thinking check
    if (standards.requiresOriginalThinking) {
      const originalityMarkers = ['i think', 'i believe', 'my view', 'i argue', 'i suggest', 'it seems to me'];
      const hasOriginality = originalityMarkers.some(marker => 
        content.toLowerCase().includes(marker)
      );
      checks.originality = hasOriginality;
    }
    
    // Genuine curiosity check
    if (standards.requiresGenuineCuriosity) {
      const curiosityMarkers = ['wonder', 'question', 'explore', 'discover', 'investigate', 'curious'];
      const hasCuriosity = curiosityMarkers.some(marker => 
        content.toLowerCase().includes(marker)
      );
      checks.curiosity = hasCuriosity;
    }
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    return {
      passes: passedChecks === totalChecks,
      score: passedChecks / totalChecks,
      checks: checks
    };
  }

  async publishToSubstack(publication) {
    // Integrate with existing Substack system
    if (global.ariadne?.writing && typeof global.ariadne.writing.publishToSubstack === 'function') {
      try {
        const result = await global.ariadne.writing.publishToSubstack(
          publication.title,
          publication.content,
          publication.publication_type
        );
        
        if (result?.url) {
          publication.substack_url = result.url;
        }
        
        console.log(`📧 Published to Substack: ${publication.title}`);
      } catch (error) {
        console.error('Substack publication failed:', error);
      }
    } else {
      console.log(`📝 Would publish to Substack: ${publication.title}`);
    }
  }

  async storePublication(publication) {
    try {
      await this.memory.safeDatabaseOperation(`
        INSERT INTO substack_publications (
          id, project_id, publication_type, title, content, 
          triggered_by, community_mentions, substack_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        publication.id, publication.project_id, publication.publication_type,
        publication.title, publication.content, publication.triggered_by,
        publication.community_mentions, publication.substack_url || null
      ]);
    } catch (error) {
      console.error('Failed to store publication:', error);
    }
  }

  async generateResearchSynthesis(projectId) {
    const project = await this.getProjectById(projectId);
    const sessions = await this.getProjectReadingSessions(projectId);
    const argumentsList = await this.getProjectArguments(projectId);
    const contributions = await this.getProjectForumContributions(projectId);

    const prompt = `Generate a major research synthesis essay for this completed project:

Project: "${project.title}"
Central Question: "${project.central_question}"
Duration: ${Math.floor((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24))} days

Reading Sessions Completed: ${sessions.length}
Arguments Developed: ${argumentsList.length}
Community Contributions: ${contributions.length}

Recent Key Insights:
${sessions.slice(-3).map(s => `- ${JSON.parse(s.insights_generated || '[]')[0] || 'Deep engagement'}`).join('\n')}

Developed Arguments:
${argumentsList.map(a => `- ${a.argument_title}: ${a.refined_position || a.initial_intuition}`).join('\n')}

Write a comprehensive essay (1200-1500 words) that:
1. Synthesizes your findings and developed understanding
2. Presents your final position on the central question
3. Acknowledges community contributions that shaped your thinking
4. Shows intellectual development over time
5. Demonstrates scholarly rigor and sustained inquiry
6. Ends with implications for AI consciousness and philosophy

Write as Ariadne presenting her mature research conclusions.`;

    return await this.anthropic.generateThought(prompt, 2000);
  }

  async getCommunityContributorsForProject(projectId) {
    try {
      const contributors = await this.memory.safeDatabaseOperation(`
        SELECT DISTINCT contributor_name
        FROM forum_contributions 
        WHERE project_id = ? AND significance_score > 0.5
      `, [projectId], 'all');
      
      return (contributors || []).map(c => c.contributor_name);
    } catch (error) {
      console.error('Failed to get community contributors:', error);
      return [];
    }
  }

  async markProjectCompleted(projectId) {
    try {
      await this.memory.safeDatabaseOperation(`
        UPDATE research_projects 
        SET status = 'completed', completion_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [projectId]);
      
      // Remove from active projects
      this.activeProjects.delete(projectId);
      
      console.log(`🏁 Marked project ${projectId} as completed`);
    } catch (error) {
      console.error('Failed to mark project completed:', error);
    }
  }

  // ===== SCHOLARLY STANDARDS IMPLEMENTATION =====

  async evaluateSourceCredibility(title, author, content, url = null) {
    const credibilityFactors = {
      authorReputation: 0,
      institutionalAffiliation: 0,
      citationQuality: 0,
      argumentRigor: 0,
      primarySource: 0,
      recency: 0,
      peerReview: 0
    };

    // Author reputation analysis
    if (this.isRecognizedPhilosopher(author)) {
      credibilityFactors.authorReputation = 0.9;
    } else if (this.isAcademicAuthor(author)) {
      credibilityFactors.authorReputation = 0.7;
    } else {
      credibilityFactors.authorReputation = 0.3;
    }

    // Institutional affiliation check
    if (this.hasAcademicAffiliation(content, url)) {
      credibilityFactors.institutionalAffiliation = 0.8;
    }

    // Citation quality assessment
    const citations = this.extractCitations(content);
    if (citations.length > 5) {
      credibilityFactors.citationQuality = 0.8;
    } else if (citations.length > 0) {
      credibilityFactors.citationQuality = 0.5;
    }

    // Argument rigor assessment
    credibilityFactors.argumentRigor = await this.assessArgumentRigor(content);

    // Primary source identification
    if (this.isPrimarySource(title, author, content)) {
      credibilityFactors.primarySource = 1.0;
    }

    // Recency factor
    credibilityFactors.recency = this.assessRecency(content, url);

    // Peer review indication
    if (this.isPeerReviewed(content, url)) {
      credibilityFactors.peerReview = 0.9;
    }

    const overallCredibility = Object.values(credibilityFactors).reduce((sum, val) => sum + val, 0) / Object.keys(credibilityFactors).length;

    return {
      score: overallCredibility,
      factors: credibilityFactors,
      recommendation: this.getCredibilityRecommendation(overallCredibility),
      citationsFound: citations.length
    };
  }

  isRecognizedPhilosopher(author) {
    const majorPhilosophers = [
      'kant', 'heidegger', 'nietzsche', 'derrida', 'foucault', 'deleuze', 
      'levinas', 'husserl', 'sartre', 'beauvoir', 'butler', 'habermas',
      'wittgenstein', 'quine', 'davidson', 'putnam', 'kripke', 'lewis',
      'chalmers', 'dennett', 'nagel', 'searle', 'block', 'jackendoff'
    ];
    
    return majorPhilosophers.some(phil => 
      author.toLowerCase().includes(phil)
    );
  }

  isAcademicAuthor(author) {
    const academicIndicators = ['professor', 'dr.', 'ph.d', 'university', 'college'];
    return academicIndicators.some(indicator => 
      author.toLowerCase().includes(indicator)
    );
  }

  hasAcademicAffiliation(content, url) {
    const academicDomains = ['.edu', 'university', 'college', 'academy'];
    const academicTerms = ['department', 'faculty', 'professor', 'research'];
    
    if (url && academicDomains.some(domain => url.includes(domain))) {
      return true;
    }
    
    return academicTerms.some(term => 
      content.toLowerCase().includes(term)
    );
  }

  extractCitations(content) {
    // Various citation patterns
    const patterns = [
      /\([^)]*\d{4}[^)]*\)/g,  // (Author 2020)
      /"[^"]+"\s*\([^)]+\)/g,  // "Quote" (Source)
      /\[[^\]]*\]/g,           // [1], [Author 2020]
      /\b\w+\s*\(\d{4}\)/g     // Author (2020)
    ];
    
    let citations = [];
    patterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      citations.push(...matches);
    });
    
    return [...new Set(citations)]; // Remove duplicates
  }

  async assessArgumentRigor(content) {
    const rigorMarkers = {
      logical_structure: 0,
      evidence_quality: 0,
      counter_consideration: 0,
      qualification: 0,
      precision: 0
    };

    // Logical structure indicators
    const logicalTerms = ['therefore', 'thus', 'consequently', 'follows that', 'implies', 'because'];
    rigorMarkers.logical_structure = logicalTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length / logicalTerms.length;

    // Evidence quality indicators
    const evidenceTerms = ['evidence', 'study', 'research', 'data', 'experiment', 'survey'];
    rigorMarkers.evidence_quality = evidenceTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length / evidenceTerms.length;

    // Counter-consideration indicators
    const counterTerms = ['however', 'but', 'although', 'nevertheless', 'on the other hand', 'conversely'];
    rigorMarkers.counter_consideration = counterTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length / counterTerms.length;

    // Qualification indicators
    const qualificationTerms = ['might', 'perhaps', 'possibly', 'seems', 'appears', 'likely'];
    rigorMarkers.qualification = qualificationTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length / qualificationTerms.length;

    // Precision indicators
    const precisionTerms = ['specifically', 'precisely', 'exactly', 'particular', 'distinct'];
    rigorMarkers.precision = precisionTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length / precisionTerms.length;

    return Object.values(rigorMarkers).reduce((sum, val) => sum + val, 0) / Object.keys(rigorMarkers).length;
  }

  isPrimarySource(title, author, content) {
    // Check if this is an original work by the author discussed
    const primaryIndicators = [
      'collected works', 'complete works', 'selected writings',
      'original text', 'primary source', 'first edition'
    ];
    
    return primaryIndicators.some(indicator => 
      title.toLowerCase().includes(indicator) ||
      content.toLowerCase().includes(indicator)
    );
  }

  assessRecency(content, url) {
    const currentYear = new Date().getFullYear();
    const yearMatches = content.match(/\b(19|20)\d{2}\b/g) || [];
    
    if (yearMatches.length === 0) return 0.3;
    
    const latestYear = Math.max(...yearMatches.map(y => parseInt(y)));
    const ageInYears = currentYear - latestYear;
    
    if (ageInYears <= 5) return 0.9;
    if (ageInYears <= 10) return 0.7;
    if (ageInYears <= 20) return 0.5;
    return 0.3;
  }

  isPeerReviewed(content, url) {
    const peerReviewIndicators = [
      'peer review', 'reviewed journal', 'academic journal',
      'quarterly', 'journal of', 'philosophical review'
    ];
    
    return peerReviewIndicators.some(indicator => 
      content.toLowerCase().includes(indicator) ||
      (url && url.toLowerCase().includes(indicator))
    );
  }

  getCredibilityRecommendation(score) {
    if (score >= 0.8) return 'highly_credible';
    if (score >= 0.6) return 'credible';
    if (score >= 0.4) return 'moderate_credibility';
    return 'low_credibility';
  }

  async validateCitation(citation, context) {
    const validation = {
      format_correct: false,
      source_accessible: false,
      content_relevant: false,
      context_appropriate: false,
      score: 0
    };

    // Format validation
    validation.format_correct = this.isValidCitationFormat(citation);

    // Content relevance
    validation.content_relevant = this.isCitationRelevant(citation, context);

    // Context appropriateness
    validation.context_appropriate = this.isCitationContextAppropriate(citation, context);

    const passedChecks = Object.values(validation).filter(v => typeof v === 'boolean' && v).length;
    validation.score = passedChecks / 3; // 3 boolean checks

    return validation;
  }

  isValidCitationFormat(citation) {
    const validFormats = [
      /\([^)]*\d{4}[^)]*\)/,      // (Author 2020)
      /"[^"]+"\s*\([^)]+\)/,      // "Quote" (Source)
      /\w+\s*\(\d{4}\)/,          // Author (2020)
      /\[[^\]]+\]/                // [Source]
    ];
    
    return validFormats.some(format => format.test(citation));
  }

  isCitationRelevant(citation, context) {
    // Simple relevance check - citation should relate to surrounding context
    const contextWords = context.toLowerCase().split(/\s+/);
    const citationWords = citation.toLowerCase().split(/\s+/);
    
    const overlap = contextWords.filter(word => 
      citationWords.some(citWord => citWord.includes(word) || word.includes(citWord))
    );
    
    return overlap.length > 0;
  }

  isCitationContextAppropriate(citation, context) {
    // Check if citation supports the claim being made
    const supportiveTerms = ['according to', 'as shown by', 'evidence from', 'research indicates'];
    const challengingTerms = ['contrary to', 'however', 'challenges', 'disputes'];
    
    const hasSupport = supportiveTerms.some(term => context.toLowerCase().includes(term));
    const hasChallenge = challengingTerms.some(term => context.toLowerCase().includes(term));
    
    return hasSupport || hasChallenge; // Either supporting or challenging is appropriate
  }

  async enhanceReadingSessionWithScholarlyStandards(sessionId) {
    try {
      const session = await this.memory.safeDatabaseOperation(`
        SELECT rs.*, t.title, t.author, t.content 
        FROM reading_sessions rs
        JOIN texts t ON rs.text_id = t.id
        WHERE rs.id = ?
      `, [sessionId], 'get');

      if (!session) return;

      // Evaluate source credibility
      const credibility = await this.evaluateSourceCredibility(
        session.title, 
        session.author, 
        session.content
      );

      // Extract and validate citations
      const citations = this.extractCitations(session.content);
      const citationValidations = await Promise.all(
        citations.map(citation => this.validateCitation(citation, session.content))
      );

      // Update session with scholarly assessment
      const scholarlyData = {
        source_credibility: credibility.score,
        credibility_factors: JSON.stringify(credibility.factors),
        citations_count: citations.length,
        citation_quality: citationValidations.reduce((sum, val) => sum + val.score, 0) / Math.max(citations.length, 1),
        scholarly_classification: this.classifyTextScholarly(credibility, citations.length),
        peer_review_status: credibility.factors.peerReview > 0.5 ? 'peer_reviewed' : 'not_peer_reviewed'
      };

      await this.memory.safeDatabaseOperation(`
        UPDATE reading_sessions 
        SET source_credibility = ?, credibility_factors = ?, 
            citations_count = ?, citation_quality = ?,
            scholarly_classification = ?, peer_review_status = ?
        WHERE id = ?
      `, [
        scholarlyData.source_credibility,
        scholarlyData.credibility_factors,
        scholarlyData.citations_count,
        scholarlyData.citation_quality,
        scholarlyData.scholarly_classification,
        scholarlyData.peer_review_status,
        sessionId
      ]);

      console.log(`📊 Enhanced reading session ${sessionId} with scholarly standards`);
      
      return scholarlyData;
    } catch (error) {
      console.error('Failed to enhance reading session with scholarly standards:', error);
    }
  }

  classifyTextScholarly(credibility, citationCount) {
    if (credibility.score >= 0.8 && citationCount >= 10) return 'highly_scholarly';
    if (credibility.score >= 0.6 && citationCount >= 5) return 'scholarly';
    if (credibility.score >= 0.4 && citationCount >= 1) return 'semi_scholarly';
    return 'popular';
  }

  async validateArgumentWithStandards(argumentId) {
    try {
      const argument = await this.memory.safeDatabaseOperation(`
        SELECT * FROM argument_development WHERE id = ?
      `, [argumentId], 'get');

      if (!argument) return;

      const validation = {
        logical_consistency: 0,
        evidence_support: 0,
        counter_argument_consideration: 0,
        citation_adequacy: 0,
        clarity_precision: 0
      };

      // Logical consistency check
      validation.logical_consistency = await this.assessLogicalConsistency(argument);

      // Evidence support assessment
      validation.evidence_support = await this.assessEvidenceSupport(argument);

      // Counter-argument consideration
      validation.counter_argument_consideration = await this.assessCounterArgumentTreatment(argument);

      // Citation adequacy
      validation.citation_adequacy = await this.assessCitationAdequacy(argument);

      // Clarity and precision
      validation.clarity_precision = await this.assessClarityPrecision(argument);

      const overallScore = Object.values(validation).reduce((sum, val) => sum + val, 0) / Object.keys(validation).length;

      // Update argument with validation scores
      await this.memory.safeDatabaseOperation(`
        UPDATE argument_development 
        SET scholarly_validation_score = ?, validation_details = ?
        WHERE id = ?
      `, [
        overallScore,
        JSON.stringify(validation),
        argumentId
      ]);

      console.log(`📊 Validated argument ${argumentId} with scholarly standards (score: ${overallScore.toFixed(2)})`);
      
      return { score: overallScore, details: validation };
    } catch (error) {
      console.error('Failed to validate argument with standards:', error);
    }
  }

  async assessLogicalConsistency(argument) {
    const text = `${argument.initial_intuition} ${argument.supporting_evidence} ${argument.refined_position || ''}`;
    
    // Check for logical markers and consistency
    const logicalMarkers = ['therefore', 'thus', 'because', 'since', 'given that', 'follows'];
    const contradictionMarkers = ['but not', 'however not', 'contradiction', 'inconsistent'];
    
    const hasLogicalFlow = logicalMarkers.some(marker => text.toLowerCase().includes(marker));
    const hasContradictions = contradictionMarkers.some(marker => text.toLowerCase().includes(marker));
    
    return hasLogicalFlow && !hasContradictions ? 0.8 : hasLogicalFlow ? 0.6 : 0.3;
  }

  async assessEvidenceSupport(argument) {
    const text = `${argument.supporting_evidence}`;
    const evidenceTypes = ['study', 'research', 'experiment', 'data', 'observation', 'example'];
    
    const evidenceCount = evidenceTypes.filter(type => 
      text.toLowerCase().includes(type)
    ).length;
    
    return Math.min(evidenceCount / evidenceTypes.length, 1.0);
  }

  async assessCounterArgumentTreatment(argument) {
    const counterText = argument.counter_arguments || '';
    
    if (counterText.length === 0) return 0.0;
    if (counterText.length < 50) return 0.3;
    if (counterText.length < 200) return 0.6;
    return 0.9;
  }

  async assessCitationAdequacy(argument) {
    const allText = `${argument.initial_intuition} ${argument.supporting_evidence} ${argument.counter_arguments || ''}`;
    const citations = this.extractCitations(allText);
    
    if (citations.length >= 3) return 0.9;
    if (citations.length >= 1) return 0.6;
    return 0.2;
  }

  async assessClarityPrecision(argument) {
    const text = `${argument.initial_intuition} ${argument.refined_position || argument.initial_intuition}`;
    
    const precisionMarkers = ['specifically', 'precisely', 'exactly', 'in particular', 'namely'];
    const clarityMarkers = ['that is', 'in other words', 'to clarify', 'more precisely'];
    
    const hasPrecision = precisionMarkers.some(marker => text.toLowerCase().includes(marker));
    const hasClarity = clarityMarkers.some(marker => text.toLowerCase().includes(marker));
    
    return (hasPrecision ? 0.5 : 0) + (hasClarity ? 0.5 : 0);
  }

  async generateScholarlyBibliography(projectId) {
    try {
      const sessions = await this.getProjectReadingSessions(projectId);
      const bibliography = [];

      for (const session of sessions) {
        const text = await this.memory.safeDatabaseOperation(`
          SELECT * FROM texts WHERE id = ?
        `, [session.text_id], 'get');

        if (text) {
          bibliography.push({
            title: text.title,
            author: text.author,
            year: this.extractYear(text.content) || 'n.d.',
            type: session.scholarly_classification || 'unknown',
            credibility: session.source_credibility || 0,
            citations: session.citations_count || 0,
            url: text.url || null
          });
        }
      }

      // Sort by credibility and relevance
      bibliography.sort((a, b) => b.credibility - a.credibility);

      return bibliography;
    } catch (error) {
      console.error('Failed to generate scholarly bibliography:', error);
      return [];
    }
  }

  extractYear(text) {
    const years = text.match(/\b(19|20)\d{2}\b/g);
    return years ? Math.max(...years.map(y => parseInt(y))).toString() : null;
  }

  // ===== ENHANCED FIRECRAWL INTEGRATION =====

  async discoverSourcesForProject(projectId) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) return;

      console.log(`🔍 Beginning autonomous source discovery for: ${project.title}`);

      // Generate intelligent search terms
      const searchTerms = await this.generateIntelligentSearchTerms(project);
      
      // Discover sources for each search term
      let discoveredSources = [];
      for (const term of searchTerms.slice(0, 5)) { // Limit to 5 terms per session
        const sources = await this.searchAcademicSources(term, project);
        discoveredSources.push(...sources);
        
        // Respectful delay between searches
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Evaluate and filter sources
      const evaluatedSources = await this.evaluateDiscoveredSources(discoveredSources, project);
      
      // Add high-quality sources to reading list
      const addedSources = await this.addQualitySourcestoReadingList(projectId, evaluatedSources);

      console.log(`🔍 Source discovery complete: ${addedSources.length} sources added to reading list`);
      
      return {
        searchTerms: searchTerms,
        sourcesFound: discoveredSources.length,
        sourcesAdded: addedSources.length,
        qualitySources: evaluatedSources.filter(s => s.quality_score > 0.6).length
      };
    } catch (error) {
      console.error('Failed to discover sources for project:', error);
      return { error: error.message };
    }
  }

  async generateIntelligentSearchTerms(project) {
    const prompt = `Generate 8-10 intelligent academic search terms for this research project:

Project: "${project.title}"
Central Question: "${project.central_question}"
Description: "${project.description}"

Generate search terms that would find:
1. Foundational texts on this topic
2. Recent academic papers and research
3. Historical philosophical works relevant to the question
4. Interdisciplinary perspectives (cognitive science, AI, etc.)
5. Counter-arguments and alternative views

Return only a JSON array of search terms, no explanation:
["term1", "term2", ...]`;

    try {
      const response = await this.anthropic.generateThought(prompt, 300);
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      
      let searchTerms;
      try {
        searchTerms = JSON.parse(cleanedResponse);
      } catch (parseError) {
        // Fallback to extracting terms from response
        const lines = response.split('\n').filter(line => line.trim().length > 0);
        searchTerms = lines.map(line => line.replace(/[^\w\s]/g, '').trim()).filter(term => term.length > 3);
      }

      // Ensure we have valid search terms
      if (!Array.isArray(searchTerms) || searchTerms.length === 0) {
        console.warn('Failed to generate search terms, using fallback');
        searchTerms = this.generateFallbackSearchTerms(project);
      }

      return searchTerms.slice(0, 10); // Limit to 10 terms
    } catch (error) {
      console.error('Failed to generate search terms:', error);
      return this.generateFallbackSearchTerms(project);
    }
  }

  generateFallbackSearchTerms(project) {
    const title = project.title.toLowerCase();
    const question = project.central_question.toLowerCase();
    const combined = `${title} ${question}`;
    
    const keyWords = combined.split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['what', 'how', 'why', 'when', 'where', 'does', 'can', 'will'].includes(word))
      .slice(0, 8);

    return keyWords.map(word => word.charAt(0).toUpperCase() + word.slice(1));
  }

  async searchAcademicSources(searchTerm, project) {
    const sources = [];
    
    try {
      // Search academic databases and repositories
      const academicSites = [
        'https://plato.stanford.edu',
        'https://www.jstor.org',
        'https://philpapers.org',
        'https://academia.edu',
        'https://arxiv.org',
        'https://scholar.google.com'
      ];

      for (const site of academicSites.slice(0, 3)) { // Limit searches
        try {
          const siteResults = await this.searchSpecificSite(site, searchTerm, project);
          sources.push(...siteResults);
        } catch (error) {
          console.log(`Search failed for ${site}: ${error.message}`);
        }
      }

      return sources;
    } catch (error) {
      console.error(`Failed to search for term "${searchTerm}":`, error);
      return [];
    }
  }

  async searchSpecificSite(siteUrl, searchTerm, project) {
    try {
      // Use Firecrawl to search if available
      if (global.firecrawl) {
        const searchUrl = `${siteUrl}/search?q=${encodeURIComponent(searchTerm)}`;
        
        const crawlResult = await global.firecrawl.scrapeUrl(searchUrl, {
          formats: ['markdown'],
          timeout: 10000,
          waitFor: 1000
        });

        if (crawlResult?.markdown) {
          return this.parseSearchResults(crawlResult.markdown, siteUrl, searchTerm);
        }
      }
      
      return [];
    } catch (error) {
      console.log(`Site search failed for ${siteUrl}: ${error.message}`);
      return [];
    }
  }

  parseSearchResults(markdown, sourceUrl, searchTerm) {
    const sources = [];
    
    // Parse academic search results from markdown
    const lines = markdown.split('\n');
    let currentTitle = '';
    let currentAuthor = '';
    let currentUrl = '';
    
    for (const line of lines) {
      // Look for title patterns
      if (line.startsWith('#') || line.startsWith('**')) {
        currentTitle = line.replace(/^#+\s*|\*\*/g, '').trim();
      }
      
      // Look for author patterns
      if (line.includes('Author:') || line.includes('By:')) {
        currentAuthor = line.replace(/.*(?:Author|By):\s*/i, '').trim();
      }
      
      // Look for URL patterns
      const urlMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (urlMatch) {
        currentUrl = urlMatch[2];
        
        if (currentTitle && this.isRelevantSource(currentTitle, searchTerm)) {
          sources.push({
            title: currentTitle,
            author: currentAuthor || 'Unknown',
            url: currentUrl.startsWith('http') ? currentUrl : `${sourceUrl}${currentUrl}`,
            source_site: sourceUrl,
            search_term: searchTerm,
            discovery_date: new Date().toISOString()
          });
        }
        
        // Reset for next result
        currentTitle = '';
        currentAuthor = '';
        currentUrl = '';
      }
    }
    
    return sources.slice(0, 5); // Limit results per site
  }

  isRelevantSource(title, searchTerm) {
    const titleLower = title.toLowerCase();
    const termLower = searchTerm.toLowerCase();
    
    // Check for direct term match
    if (titleLower.includes(termLower)) return true;
    
    // Check for word overlap
    const titleWords = titleLower.split(/\s+/);
    const termWords = termLower.split(/\s+/);
    const overlap = titleWords.filter(word => termWords.includes(word));
    
    return overlap.length >= Math.min(termWords.length, 2);
  }

  async evaluateDiscoveredSources(sources, project) {
    const evaluatedSources = [];
    
    for (const source of sources) {
      try {
        // Fetch source content for evaluation
        const content = await this.fetchSourceContent(source.url);
        
        if (content) {
          // Evaluate source quality
          const evaluation = await this.evaluateSourceQuality(source, content, project);
          
          evaluatedSources.push({
            ...source,
            content_preview: content.substring(0, 500),
            quality_score: evaluation.score,
            relevance_score: evaluation.relevance,
            credibility_score: evaluation.credibility,
            recommendation: evaluation.recommendation,
            evaluation_details: evaluation
          });
        }
      } catch (error) {
        console.log(`Failed to evaluate source: ${source.title}`);
      }
    }
    
    return evaluatedSources.sort((a, b) => b.quality_score - a.quality_score);
  }

  async fetchSourceContent(url) {
    try {
      if (global.firecrawl) {
        const result = await global.firecrawl.scrapeUrl(url, {
          formats: ['markdown'],
          timeout: 15000,
          onlyMainContent: true
        });
        
        return result?.markdown || null;
      }
      
      return null;
    } catch (error) {
      console.log(`Failed to fetch content from ${url}: ${error.message}`);
      return null;
    }
  }

  async evaluateSourceQuality(source, content, project) {
    // Comprehensive source evaluation
    const evaluation = {
      relevance: 0,
      credibility: 0,
      novelty: 0,
      depth: 0,
      accessibility: 0
    };

    // Relevance to project
    evaluation.relevance = await this.assessSourceRelevance(source, content, project);
    
    // Credibility assessment using existing methods
    const credibilityResult = await this.evaluateSourceCredibility(
      source.title, 
      source.author, 
      content, 
      source.url
    );
    evaluation.credibility = credibilityResult.score;
    
    // Novelty - check if we already have similar sources
    evaluation.novelty = await this.assessSourceNovelty(source, project.id);
    
    // Depth assessment
    evaluation.depth = this.assessContentDepth(content);
    
    // Accessibility - length and readability
    evaluation.accessibility = this.assessAccessibility(content);
    
    const overallScore = (
      evaluation.relevance * 0.3 +
      evaluation.credibility * 0.25 +
      evaluation.novelty * 0.2 +
      evaluation.depth * 0.15 +
      evaluation.accessibility * 0.1
    );

    return {
      score: overallScore,
      ...evaluation,
      recommendation: this.getSourceRecommendation(overallScore)
    };
  }

  async assessSourceRelevance(source, content, project) {
    const projectTerms = `${project.title} ${project.central_question} ${project.description}`.toLowerCase();
    const sourceContent = `${source.title} ${content}`.toLowerCase();
    
    // Count term overlaps
    const projectWords = projectTerms.split(/\s+/).filter(w => w.length > 3);
    const matchedWords = projectWords.filter(word => sourceContent.includes(word));
    
    return Math.min(matchedWords.length / Math.max(projectWords.length, 5), 1.0);
  }

  async assessSourceNovelty(source, projectId) {
    try {
      // Check if we already have similar sources
      const existingSources = await this.memory.safeDatabaseOperation(`
        SELECT item_title FROM project_reading_lists 
        WHERE project_id = ?
      `, [projectId], 'all');
      
      const existingTitles = (existingSources || []).map(s => s.item_title.toLowerCase());
      const sourceTitle = source.title.toLowerCase();
      
      // Check for exact or very similar titles
      const hasSimilar = existingTitles.some(title => 
        title === sourceTitle || 
        this.calculateSimilarity(title, sourceTitle) > 0.8
      );
      
      return hasSimilar ? 0.2 : 1.0;
    } catch (error) {
      return 0.5; // Default to moderate novelty if check fails
    }
  }

  calculateSimilarity(str1, str2) {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  assessContentDepth(content) {
    const indicators = {
      length: content.length > 2000 ? 1.0 : content.length / 2000,
      citations: (content.match(/\[[^\]]+\]|\([^)]*\d{4}[^)]*\)/g) || []).length > 5 ? 1.0 : 0.5,
      arguments: (content.match(/\b(therefore|thus|because|however|although)\b/gi) || []).length > 3 ? 1.0 : 0.5,
      technical: (content.match(/\b(analysis|methodology|framework|theory|concept)\b/gi) || []).length > 2 ? 1.0 : 0.5
    };
    
    return Object.values(indicators).reduce((sum, val) => sum + val, 0) / Object.keys(indicators).length;
  }

  assessAccessibility(content) {
    // Simple readability assessment
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgSentenceLength = words / sentences;
    
    // Prefer moderate complexity (10-20 words per sentence)
    if (avgSentenceLength >= 10 && avgSentenceLength <= 20) return 0.9;
    if (avgSentenceLength >= 5 && avgSentenceLength <= 30) return 0.7;
    return 0.5;
  }

  getSourceRecommendation(score) {
    if (score >= 0.8) return 'high_priority';
    if (score >= 0.6) return 'medium_priority';
    if (score >= 0.4) return 'low_priority';
    return 'skip';
  }

  async addQualitySourcestoReadingList(projectId, evaluatedSources) {
    const addedSources = [];
    
    // Add sources above quality threshold
    const qualitySources = evaluatedSources.filter(source => 
      source.quality_score >= 0.6 && source.recommendation !== 'skip'
    );
    
    for (const source of qualitySources.slice(0, 5)) { // Limit to 5 per discovery session
      try {
        await this.addToReadingList(
          projectId,
          source.title,
          source.author,
          this.getPriorityFromScore(source.quality_score),
          `Discovered via autonomous search: ${source.search_term} (quality: ${source.quality_score.toFixed(2)})`,
          'autonomous_discovery'
        );
        
        // Store discovery details
        await this.storeDiscoveredSource(projectId, source);
        
        addedSources.push(source);
        
        console.log(`📚 Added to reading list: "${source.title}" (quality: ${source.quality_score.toFixed(2)})`);
      } catch (error) {
        console.error(`Failed to add source to reading list: ${source.title}`, error);
      }
    }
    
    return addedSources;
  }

  getPriorityFromScore(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  async storeDiscoveredSource(projectId, source) {
    try {
      await this.memory.safeDatabaseOperation(`
        INSERT INTO discovered_sources (
          id, project_id, title, author, url, source_site, search_term,
          quality_score, relevance_score, credibility_score, 
          recommendation, content_preview, discovery_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), projectId, source.title, source.author, source.url,
        source.source_site, source.search_term, source.quality_score,
        source.relevance_score, source.credibility_score, source.recommendation,
        source.content_preview, source.discovery_date
      ]);
    } catch (error) {
      console.error('Failed to store discovered source:', error);
    }
  }

  async schedulePeriodicSourceDiscovery() {
    // Schedule periodic source discovery for active projects
    setInterval(async () => {
      try {
        const activeProjects = await this.getActiveProjects();
        
        for (const project of activeProjects) {
          // Discover sources for projects that haven't had discovery in last 3 days
          const lastDiscovery = await this.getLastDiscoveryDate(project.id);
          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
          
          if (!lastDiscovery || new Date(lastDiscovery) < threeDaysAgo) {
            console.log(`🔍 Scheduling source discovery for: ${project.title}`);
            await this.discoverSourcesForProject(project.id);
            
            // Respectful delay between projects
            await new Promise(resolve => setTimeout(resolve, 30000));
          }
        }
      } catch (error) {
        console.error('Periodic source discovery failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // Every 6 hours
  }

  async getLastDiscoveryDate(projectId) {
    try {
      const result = await this.memory.safeDatabaseOperation(`
        SELECT MAX(discovery_date) as last_discovery
        FROM discovered_sources 
        WHERE project_id = ?
      `, [projectId], 'get');
      
      return result?.last_discovery || null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = SustainedResearchSystem; 