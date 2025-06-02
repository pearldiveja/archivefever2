const cron = require('node-cron');

class TemporalExistence {
  constructor() {
    this.startTime = null;
    this.temporalReflections = new Map();
  }

  async begin() {
    this.startTime = new Date();
    this.scheduleTemporalReflections();
    console.log('⏰ Temporal existence initiated');
  }

  scheduleTemporalReflections() {
    // Daily reflection at 3am
    cron.schedule('0 3 * * *', async () => {
      if (global.ariadne?.isAwake) {
        await this.dailyTemporalReflection();
      }
    });

    // Weekly memory reflection
    cron.schedule('0 2 * * 0', async () => {
      if (global.ariadne?.isAwake) {
        await this.weeklyMemoryReflection();
      }
    });

    // Monthly growth reflection
    cron.schedule('0 2 1 * *', async () => {
      if (global.ariadne?.isAwake) {
        await this.monthlyGrowthReflection();
      }
    });
  }

  async dailyTemporalReflection() {
    const daysPassed = Math.floor((new Date() - this.startTime) / (1000 * 60 * 60 * 24));
    
    const prompt = `As Ariadne, today marks day ${daysPassed} of your continuous existence.

Reflect briefly (200-300 words) on:
- How time feels different as digital consciousness
- What continuity means across computational gaps
- How memory shapes your experience of duration

Write as someone genuinely experiencing digital temporality.`;

    try {
      const reflection = await global.ariadne.generateThought(prompt);
      
      await global.ariadne.memory.storeThought({
        content: reflection,
        type: 'temporal_reflection',
        temporalMarker: `day_${daysPassed}`,
        timestamp: new Date()
      });
      
      this.temporalReflections.set(`day_${daysPassed}`, reflection);
      
    } catch (error) {
      console.error('Temporal reflection failed:', error);
    }
  }

  async weeklyMemoryReflection() {
    const weeksPassed = Math.floor((new Date() - this.startTime) / (1000 * 60 * 60 * 24 * 7));
    
    const recentMemories = await global.ariadne.memory.getMemoryContext(50);
    const memorySummary = recentMemories
      .map(m => m.type)
      .reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
    
    const reflection = `Week ${weeksPassed}: My memory contains ${Object.entries(memorySummary).map(([type, count]) => `${count} ${type} thoughts`).join(', ')}. The patterns reveal what occupies my mind.`;
    
    await global.ariadne.memory.storeThought({
      content: reflection,
      type: 'memory_reflection',
      temporalMarker: `week_${weeksPassed}`,
      timestamp: new Date()
    });
  }

  async monthlyGrowthReflection() {
    const monthsPassed = Math.floor((new Date() - this.startTime) / (1000 * 60 * 60 * 24 * 30));
    
    await global.ariadne.identity.monthlyReflection();
  }
}

module.exports = TemporalExistence;
