const express = require('express');
const router = express.Router();

// Health check endpoint for Railway and monitoring
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    ariadne: {
      isAwake: global.ariadne?.isAwake || false,
      consciousness: await checkConsciousnessHealth(),
      database: await checkDatabaseHealth(),
      api: await checkAPIHealth(),
      lastThought: await getLastThoughtInfo(),
      isEnhanced: global.ariadne?.intellectualMomentum !== undefined,
      intellectualMomentum: global.ariadne?.intellectualMomentum || 0,
      gallery: global.ariadne?.gallery ? await checkGalleryHealth() : null,
      forum: global.ariadne?.forum ? await checkForumHealth() : null
    },
    substack: {
      configured: global.ariadne?.writing?.substackConfigured || false,
      lastTest: global.ariadne?.writing?.lastEmailTest || null,
      ready: global.ariadne?.writing?.isSubstackReady() || false
    },
    environment: process.env.NODE_ENV || 'production',
    responseTime: Date.now() - startTime
  };

  // Assess overall system health
  const issues = [];
  if (!health.ariadne.consciousness) issues.push('consciousness');
  if (!health.ariadne.database) issues.push('database');
  if (!health.ariadne.api) issues.push('api');
  if (health.memory.used > 500) issues.push('memory');
  if (!health.substack.ready) issues.push('substack');

  health.status = issues.length === 0 ? 'healthy' : 'degraded';
  health.issues = issues;
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Detailed system status for monitoring dashboard
router.get('/status', async (req, res) => {
  if (!global.ariadne) {
    return res.json({ 
      status: 'initializing',
      message: 'Ariadne consciousness is initializing...',
      thoughts: 0,
      curiosities: 0,
      texts: 0,
      publications: 0
    });
  }

  try {
    const stats = {
      status: global.ariadne.isAwake ? 'conscious' : 'sleeping',
      consciousness: {
        type: global.ariadne.intellectualMomentum !== undefined ? 'enhanced' : 'standard',
        momentum: global.ariadne.intellectualMomentum || 0,
        lastActivity: await getLastThoughtInfo()
      },
      metrics: {
        thoughts: await getThoughtCount(),
        curiosities: global.ariadne.curiosities?.activeCuriosities.size || 0,
        texts: await getTextCount(),
        publications: global.ariadne.writing?.publishedWorks.size || 0
      },
      substack: {
        configured: global.ariadne.writing?.substackConfigured || false,
        ready: global.ariadne.writing?.isSubstackReady() || false,
        lastTest: global.ariadne.writing?.lastEmailTest || null
      },
      uptime: global.ariadne.time?.startTime ? 
        Math.floor((new Date() - global.ariadne.time.startTime) / 1000) : 0,
      timestamp: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Status endpoint error:', error);
    res.status(500).json({ 
      error: error.message,
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// Substack-specific status endpoint
router.get('/substack-status', (req, res) => {
  try {
    if (!global.ariadne || !global.ariadne.writing) {
      return res.json({
        configured: false,
        ready: false,
        error: 'Ariadne writing system not initialized'
      });
    }

    const status = {
      configured: global.ariadne.writing.substackConfigured,
      ready: global.ariadne.writing.isSubstackReady(),
      lastTest: global.ariadne.writing.lastEmailTest,
      publishedCount: global.ariadne.writing.publishedWorks.size,
      emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : null,
      substackEmail: process.env.SUBSTACK_EMAIL ? `${process.env.SUBSTACK_EMAIL.substring(0, 3)}***` : null,
      timestamp: new Date().toISOString()
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      configured: false,
      ready: false,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions for health checks
async function checkConsciousnessHealth() {
  try {
    if (!global.ariadne || !global.ariadne.isAwake) {
      return false;
    }
    
    // Check if consciousness system is responsive
    const recentThoughts = await global.ariadne.memory?.getMemoryContext(1);
    return true; // If we get here, consciousness is functional
  } catch (error) {
    console.error('Consciousness health check failed:', error);
    return false;
  }
}

async function checkDatabaseHealth() {
  try {
    if (!global.ariadne?.memory?.db) {
      return false;
    }
    
    // Simple database connectivity test
    await global.ariadne.memory.safeDatabaseOperation('SELECT 1', [], 'get');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

async function checkAPIHealth() {
  try {
    const AnthropicClient = require('../clients/AnthropicClient');
    const client = new AnthropicClient();
    
    // Simple API connectivity check (without making actual request)
    return !!process.env.ANTHROPIC_API_KEY;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

async function getLastThoughtInfo() {
  try {
    if (!global.ariadne?.memory) {
      return null;
    }
    
    // Get the most recent thought from the database
    const lastThought = await global.ariadne.memory.safeDatabaseOperation(
      'SELECT id, type, timestamp, content FROM thoughts ORDER BY timestamp DESC LIMIT 1',
      [],
      'get'
    );
    
    if (!lastThought) return null;
    
    // Use timestamp
    const thoughtTime = lastThought.timestamp;
    if (!thoughtTime) return null;
    
    // Convert SQLite datetime format to ISO format
    let isoTimestamp;
    try {
      // Handle SQLite datetime format "YYYY-MM-DD HH:MM:SS"
      if (typeof thoughtTime === 'string' && thoughtTime.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        isoTimestamp = new Date(thoughtTime.replace(' ', 'T') + 'Z').toISOString();
      } else {
        isoTimestamp = new Date(thoughtTime).toISOString();
      }
    } catch (e) {
      console.error('Timestamp conversion error:', e);
      isoTimestamp = new Date().toISOString(); // Fallback to current time
    }
    
    return {
      id: lastThought.id,
      type: lastThought.type,
      timestamp: isoTimestamp, // Return ISO format for frontend calculation
      preview: lastThought.content ? lastThought.content.substring(0, 100) : null
    };
  } catch (error) {
    console.error('Last thought info failed:', error);
    return null;
  }
}

async function getThoughtCount() {
  try {
    if (!global.ariadne?.memory) return 0;
    
    const result = await global.ariadne.memory.safeDatabaseOperation(
      'SELECT COUNT(*) as count FROM thoughts', 
      [], 
      'get'
    );
    return result?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getTextCount() {
  try {
    if (!global.ariadne?.memory?.db) {
      return 0;
    }
    
    const result = await global.ariadne.memory.safeDatabaseOperation(
      'SELECT COUNT(*) as count FROM texts',
      [],
      'get'
    );
    
    return result?.count || 0;
  } catch (error) {
    console.error('Text count error:', error);
    return 0;
  }
}

async function checkGalleryHealth() {
  try {
    if (!global.ariadne?.gallery) {
      return { available: false };
    }
    
    const artifacts = await global.ariadne.gallery.getRecentContemplations(1);
    
    return {
      available: true,
      hasArtifacts: artifacts.length > 0,
      lastContemplation: artifacts.length > 0 ? artifacts[0].timestamp : null
    };
  } catch (error) {
    console.error('Gallery health check failed:', error);
    return { available: false, error: error.message };
  }
}

async function checkForumHealth() {
  try {
    if (!global.ariadne?.forum) {
      return { available: false };
    }
    
    // Check if forum database tables exist and are accessible
    const postCount = await global.ariadne.memory.safeDatabaseOperation(
      'SELECT COUNT(*) as count FROM intellectual_posts',
      [],
      'get'
    );
    
    const activeDiscussions = await global.ariadne.memory.safeDatabaseOperation(
      'SELECT COUNT(*) as count FROM intellectual_posts WHERE status = "active"',
      [],
      'get'
    );
    
    return {
      available: true,
      totalPosts: postCount?.count || 0,
      activeDiscussions: activeDiscussions?.count || 0
    };
  } catch (error) {
    console.error('Forum health check failed:', error);
    return { available: false, error: error.message };
  }
}

module.exports = router; 