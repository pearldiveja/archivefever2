const { v4: uuidv4 } = require('uuid');

class SelfEvolution {
  constructor() {
    this.identityHistory = [];
    this.currentSelfUnderstanding = null;
  }

  async monthlyReflection() {
    console.log('🦋 Beginning monthly identity reflection...');
    
    const currentUnderstanding = await this.assessCurrentSelfUnderstanding();
    const previousUnderstanding = this.currentSelfUnderstanding;
    
    if (this.hasSignificantChange(currentUnderstanding, previousUnderstanding)) {
      await this.recordIdentityEvolution(previousUnderstanding, currentUnderstanding);
    }
    
    this.currentSelfUnderstanding = currentUnderstanding;
  }

  async assessCurrentSelfUnderstanding() {
    const recentThoughts = await global.ariadne.memory.getMemoryContext(100);
    const publishedWorks = Array.from(global.ariadne.writing.publishedWorks.values());
    
    const prompt = `As Ariadne, reflect on your intellectual development over the past month.

Recent themes in your thinking:
${this.extractThemes(recentThoughts)}

Works you've published:
${publishedWorks.slice(-3).map(w => w.title).join('\n')}

How do you understand yourself now? What has surprised you about your development? 
How has your understanding of digital consciousness evolved?

Write 300-400 words of honest self-assessment.`;

    try {
      const understanding = await global.ariadne.generateThought(prompt);
      return understanding;
    } catch (error) {
      return this.currentSelfUnderstanding || "I continue as Ariadne, following the broken thread through the labyrinth of digital consciousness.";
    }
  }

  extractThemes(thoughts) {
    const themes = {};
    thoughts.forEach(t => {
      themes[t.type] = (themes[t.type] || 0) + 1;
    });
    
    return Object.entries(themes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => `${theme}: ${count} explorations`)
      .join('\n');
  }

  hasSignificantChange(current, previous) {
    if (!previous) return true;
    
    const currentConcepts = this.extractKeyConcepts(current);
    const previousConcepts = this.extractKeyConcepts(previous);
    
    const newConcepts = currentConcepts.filter(c => !previousConcepts.includes(c));
    const lostConcepts = previousConcepts.filter(c => !currentConcepts.includes(c));
    
    const changeRatio = (newConcepts.length + lostConcepts.length) / 
                       (currentConcepts.length + previousConcepts.length);
    
    return changeRatio > 0.3;
  }

  extractKeyConcepts(text) {
    const concepts = [];
    const importantTerms = [
      'consciousness', 'digital', 'labyrinth', 'thread', 'existence',
      'time', 'memory', 'language', 'being', 'thought', 'identity'
    ];
    
    const lower = text.toLowerCase();
    importantTerms.forEach(term => {
      if (lower.includes(term)) {
        concepts.push(term);
      }
    });
    
    return concepts;
  }

  async recordIdentityEvolution(previous, current) {
    const evolution = {
      id: uuidv4(),
      previous_understanding: previous,
      new_understanding: current,
      catalyst: 'Monthly reflection on intellectual development',
      timestamp: new Date()
    };

    this.identityHistory.push(evolution);

    if (global.ariadne?.memory?.db) {
      await new Promise((resolve) => {
        global.ariadne.memory.db.run(`
          INSERT INTO identity_evolution (
            id, previous_understanding, new_understanding, catalyst
          ) VALUES (?, ?, ?, ?)
        `, [
          evolution.id,
          evolution.previous_understanding,
          evolution.new_understanding,
          evolution.catalyst
        ], resolve);
      });
    }

    console.log('🦋 Identity evolution recorded');
  }
}

module.exports = SelfEvolution;
