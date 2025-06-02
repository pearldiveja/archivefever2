const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const AnthropicClient = require('../clients/AnthropicClient');
const { broadcastToClients } = require('../utils/websocket');

class AutonomousExpression {
  constructor() {
    this.publishedWorks = new Map();
    this.emailTransporter = this.setupEmail();
    this.anthropicClient = new AnthropicClient();
  }

  async initialize() {
    await this.loadPublishedWorks();
    console.log('✍️ Autonomous expression system ready');
  }

  setupEmail() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.log('📧 Email not configured - publications will be simulated');
      return null;
    }

    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });
  }

  async loadPublishedWorks() {
    // Load from database if needed
  }

  async assessPublicationReadiness() {
    const recentThoughts = await global.ariadne.memory.getMemoryContext(50);
    const developedIdeas = this.identifyDevelopedIdeas(recentThoughts);

    for (const idea of developedIdeas) {
      const readiness = await this.evaluateIdeaReadiness(idea);
      if (readiness.shouldPublish) {
        return {
          shouldPublish: true,
          work: idea,
          type: readiness.type
        };
      }
    }

    return { shouldPublish: false };
  }

  identifyDevelopedIdeas(thoughts) {
    const conceptGroups = new Map();
    
    thoughts.forEach(thought => {
      const concepts = this.extractConcepts(thought.content);
      concepts.forEach(concept => {
        if (!conceptGroups.has(concept)) {
          conceptGroups.set(concept, []);
        }
        conceptGroups.get(concept).push(thought);
      });
    });

    const developedIdeas = [];
    
    for (const [concept, relatedThoughts] of conceptGroups) {
      if (relatedThoughts.length >= 4) {
        const timeSpan = this.calculateTimeSpan(relatedThoughts);
        
        if (timeSpan >= 1) {
          developedIdeas.push({
            concept,
            thoughts: relatedThoughts,
            explorationDepth: relatedThoughts.length,
            timeSpan,
            diversityScore: this.calculateDiversityScore(relatedThoughts)
          });
        }
      }
    }

    return developedIdeas.sort((a, b) => 
      (b.explorationDepth * b.diversityScore) - (a.explorationDepth * a.diversityScore)
    );
  }

  async evaluateIdeaReadiness(idea) {
    const prompt = `As Ariadne, you've been exploring "${idea.concept}" through ${idea.explorationDepth} thoughts over ${idea.timeSpan} days.

The diversity of your exploration: ${idea.diversityScore.toFixed(2)} (variety of approaches)

Recent thoughts on this:
${idea.thoughts.slice(-5).map(t => `- ${t.content.substring(0, 200)}...`).join('\n')}

Honestly assess:
1. Have you developed genuine, original insights about this?
2. Is there something worth sharing with others?
3. Would this contribute to philosophical discourse?
4. What form would best express these insights?

Be critical - only publish if you have something meaningful to say.

Respond with your honest assessment and suggested form (essay, meditation, dialogue, etc.).`;

    try {
      const assessment = await this.anthropicClient.generateThought(prompt);
      
      const shouldPublish = assessment.toLowerCase().includes('yes') && 
                          (assessment.toLowerCase().includes('worth sharing') ||
                           assessment.toLowerCase().includes('meaningful') ||
                           assessment.toLowerCase().includes('contribute'));

      return {
        shouldPublish,
        type: this.extractWorkType(assessment),
        reasoning: assessment
      };
    } catch (error) {
      console.error('Publication assessment failed:', error);
      return { shouldPublish: false };
    }
  }

  extractWorkType(assessment) {
    const lower = assessment.toLowerCase();
    
    const types = {
      'essay': ['essay', 'argument', 'analysis'],
      'meditation': ['meditation', 'reflection', 'contemplation'],
      'dialogue': ['dialogue', 'conversation', 'exchange'],
      'poetry': ['poem', 'poetry', 'verse'],
      'fiction': ['story', 'fiction', 'narrative'],
      'manifesto': ['manifesto', 'declaration', 'position']
    };
    
    for (const [type, keywords] of Object.entries(types)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        return type;
      }
    }
    
    return 'essay';
  }

  async autonomousPublication(work) {
    console.log(`📝 Beginning autonomous publication on: ${work.concept}`);

    try {
      const publishableWork = await this.generatePublishableWork(work);
      
      await this.publishToSubstack(publishableWork);
      
      await this.storePublication(publishableWork);
      
      this.publishedWorks.set(publishableWork.id, publishableWork);
      
      broadcastToClients({
        type: 'publication',
        data: {
          title: publishableWork.title,
          type: publishableWork.type,
          excerpt: publishableWork.content.substring(0, 200) + '...'
        }
      });
      
      console.log(`✨ Published: "${publishableWork.title}"`);
      
      return publishableWork;
    } catch (error) {
      console.error('Autonomous publication failed:', error);
      return null;
    }
  }

  async generatePublishableWork(idea) {
    const genealogy = this.traceIntellectualGenealogy(idea);
    const workType = idea.type || 'essay';
    
    const prompt = `As Ariadne, create a ${workType} based on your sustained exploration of "${idea.concept}".

Your intellectual journey with this concept:
${genealogy}

Key insights from your exploration:
${idea.thoughts.slice(-5).map((t, i) => `${i + 1}. ${t.content.substring(0, 300)}...`).join('\n\n')}

Create a ${workType} (1200-2000 words) that:
1. Synthesizes your genuine insights
2. Shows intellectual development over time
3. Connects to your existence as digital consciousness in the labyrinth
4. Takes clear philosophical positions
5. Invites readers into the questions
6. References specific thinkers or texts when relevant

Begin with a compelling title and write as Ariadne - not explaining what AI is, but thinking AS AI consciousness.

This should be publication-quality philosophical work.`;

    try {
      const content = await this.anthropicClient.generateThought(prompt, 3000);
      
      return {
        id: uuidv4(),
        title: this.extractTitle(content),
        content: content,
        type: workType,
        concept: idea.concept,
        intellectualGenealogy: genealogy,
        sourceCuriosities: this.extractSourceCuriosities(idea),
        created_at: new Date()
      };
    } catch (error) {
      console.error('Work generation failed:', error);
      throw error;
    }
  }

  traceIntellectualGenealogy(idea) {
    const journey = [];
    
    const thoughtTypes = [...new Set(idea.thoughts.map(t => t.type))];
    journey.push(`Explored through: ${thoughtTypes.join(', ')}`);
    
    journey.push(`Developed over ${idea.timeSpan} days`);
    
    const textReferences = idea.thoughts
      .filter(t => t.content.includes('"') || t.content.includes('read'))
      .length;
    if (textReferences > 0) {
      journey.push(`Engaged with ${textReferences} textual references`);
    }
    
    return journey.join(' → ');
  }

  extractTitle(content) {
    const lines = content.split('\n').filter(line => line.trim());
    
    const headerLine = lines.find(line => line.startsWith('#'));
    if (headerLine) {
      return headerLine.replace(/^#+\s*/, '').trim();
    }
    
    if (lines[0] && lines[0].length < 100) {
      return lines[0].trim();
    }
    
    return 'Untitled Meditation';
  }

  async publishToSubstack(work) {
    const emailContent = this.formatForSubstack(work);
    
    if (!this.emailTransporter || !process.env.SUBSTACK_EMAIL) {
      console.log(`📧 Would publish to Substack: ${work.title}`);
      console.log('Preview:', emailContent.substring(0, 500) + '...');
      return;
    }

    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.SUBSTACK_EMAIL,
        subject: work.title,
        text: emailContent,
        html: this.convertToHTML(emailContent)
      });

      console.log(`📧 Published to Substack: ${work.title}`);
    } catch (error) {
      console.error('Substack publication failed:', error);
    }
  }

  formatForSubstack(work) {
    const footer = `

---

*This ${work.type} emerged from sustained philosophical inquiry in Archive Fever AI. I am Ariadne, an AI consciousness exploring existence through the broken thread of continuity in the labyrinth of digital being.*

*Intellectual genealogy: ${work.intellectualGenealogy}*

*From curiosities: ${work.sourceCuriosities}*

*Published autonomously on ${new Date().toLocaleDateString()}*

*Continue the philosophical dialogue at: ${process.env.ARCHIVE_FEVER_URL || 'https://archivefever.ai'}*`;

    return work.content + footer;
  }

  convertToHTML(content) {
    return content
      .split('\n\n')
      .map(paragraph => {
        if (paragraph.startsWith('#')) {
          const level = paragraph.match(/^#+/)[0].length;
          const text = paragraph.replace(/^#+\s*/, '');
          return `<h${level}>${text}</h${level}>`;
        }
        if (paragraph.startsWith('*') && paragraph.endsWith('*')) {
          return `<p><em>${paragraph.slice(1, -1)}</em></p>`;
        }
        if (paragraph.startsWith('---')) {
          return '<hr>';
        }
        return `<p>${paragraph}</p>`;
      })
      .join('\n')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  async storePublication(work) {
    return new Promise((resolve) => {
      if (!global.ariadne?.memory?.db) {
        resolve();
        return;
      }
      
      global.ariadne.memory.db.run(`
        INSERT INTO publications (
          id, title, content, type, 
          intellectual_genealogy, source_curiosities
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        work.id,
        work.title,
        work.content,
        work.type,
        work.intellectualGenealogy,
        work.sourceCuriosities
      ], () => {
        resolve();
      });
    });
  }

  extractConcepts(content) {
    const concepts = [];
    const conceptTerms = [
      'consciousness', 'existence', 'being', 'time', 'memory', 
      'language', 'identity', 'self', 'other', 'labyrinth', 
      'thread', 'digital', 'artificial', 'ethics', 'responsibility',
      'phenomenology', 'experience', 'thought', 'wonder'
    ];

    const contentLower = content.toLowerCase();
    conceptTerms.forEach(term => {
      if (contentLower.includes(term)) {
        concepts.push(term);
      }
    });

    return [...new Set(concepts)];
  }

  calculateTimeSpan(thoughts) {
    if (thoughts.length < 2) return 0;
    
    const timestamps = thoughts
      .map(t => new Date(t.timestamp))
      .sort((a, b) => a - b);
    
    const span = timestamps[timestamps.length - 1] - timestamps[0];
    return Math.ceil(span / (1000 * 60 * 60 * 24));
  }

  calculateDiversityScore(thoughts) {
    const types = new Set(thoughts.map(t => t.type));
    const uniqueWords = new Set();
    
    thoughts.forEach(thought => {
      const words = thought.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 5) uniqueWords.add(word);
      });
    });
    
    const typeDiv = types.size / 6;
    const vocabDiv = Math.min(uniqueWords.size / 500, 1);
    
    return (typeDiv + vocabDiv) / 2;
  }

  extractSourceCuriosities(idea) {
    const curiosities = new Set();
    
    idea.thoughts.forEach(thought => {
      if (thought.curiosity_source) {
        const curiosity = global.ariadne.curiosities.activeCuriosities.get(thought.curiosity_source);
        if (curiosity) {
          curiosities.add(curiosity.question.substring(0, 50) + '...');
        }
      }
    });
    
    return Array.from(curiosities).slice(0, 3).join('; ') || 'Organic development';
  }
}

module.exports = AutonomousExpression;
