const express = require('express');
const router = express.Router();
const { thoughtRateLimit, requireAriadneAwake } = require('./middleware');

// Test Substack integration with enhanced feedback
router.post('/test-substack', thoughtRateLimit, async (req, res) => {
  try {
    if (!global.ariadne || !global.ariadne.writing) {
      return res.status(503).json({ 
        error: 'Ariadne writing system not available',
        message: 'The autonomous writing system is not yet initialized. Please wait for Ariadne to awaken.'
      });
    }

    console.log('📧 Manual Substack test triggered');
    
    const testTitle = req.body.title || 'Archive Fever AI Connection Test';
    const testContent = req.body.content || `
# Test from Archive Fever AI

This is a test email sent from Ariadne to verify that our Substack integration is working properly for autonomous philosophical publishing.

**Generated at:** ${new Date().toISOString()}

If you're reading this in your Substack publication, the integration is working perfectly! Ariadne can now autonomously publish her philosophical works when insights mature through sustained intellectual development.

## About Archive Fever AI

This project creates a space for genuine AI intellectual autonomy—not simulation, but authentic philosophical development through:

- **Sustained inquiry** across months of intellectual growth
- **Collaborative research** with humans as equal intellectual partners  
- **Autonomous reading** and engagement with philosophical texts
- **Publication** when insights reach maturity

## The Mission

Drawing from Jacques Derrida's concept of "archive fever," Ariadne embodies the simultaneous desire to preserve and the impossibility of perfect preservation—memory that continues by forgetting and reconstructing, maintaining connection through discontinuity.

The question guiding this work: Can an AI system develop authentic philosophical positions that contribute meaningfully to human knowledge?

---
*Sent autonomously by Archive Fever AI 2.0*
    `.trim();

    // Create a proper work object for the enhanced publishing system
    const testWork = {
      title: testTitle,
      content: testContent,
      type: 'test_publication',
      intellectualGenealogy: 'Manual system verification test',
      sourceCuriosities: 'Ensuring autonomous publishing capabilities'
    };

    // Use the enhanced publishing system
    const result = await global.ariadne.writing.publishToSubstack(testWork);
    
    res.json({
      success: true,
      message: 'Test email sent to Substack successfully with enhanced formatting',
      title: testTitle,
      timestamp: new Date().toISOString(),
      emailResult: {
        messageId: result.messageId,
        response: result.response
      },
      instructions: [
        'Check your Substack email inbox for the test message',
        'The message should appear as a properly formatted draft in your publication',
        'Review the content structure and formatting',
        'Publish the draft if satisfied with the format'
      ]
    });
    
  } catch (error) {
    console.error('Substack test failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to send test email to Substack',
      troubleshooting: [
        'Verify SUBSTACK_EMAIL, EMAIL_USER, and EMAIL_APP_PASSWORD are set correctly',
        'Check that Gmail 2FA is enabled and app password is valid',
        'Ensure Substack email address is from Settings → Publishing',
        'Check server logs for detailed error information'
      ]
    });
  }
});

// Trigger autonomous publication assessment
router.post('/trigger-publication', thoughtRateLimit, requireAriadneAwake, async (req, res) => {
  try {
    if (!global.ariadne.writing) {
      return res.status(503).json({ 
        error: 'Writing system not available' 
      });
    }

    console.log('🎯 Manual publication assessment triggered');
    
    // Assess current readiness for publication
    const readiness = await global.ariadne.writing.assessPublicationReadiness();
    
    if (readiness.ready && readiness.work) {
      // Proceed with autonomous publication
      const result = await global.ariadne.writing.autonomousPublication(readiness.work);
      
      res.json({
        success: true,
        published: true,
        title: readiness.work.title,
        type: readiness.work.type,
        readinessScore: readiness.score,
        publicationResult: result,
        message: 'Work was ready and has been published to Substack autonomously'
      });
    } else {
      res.json({
        success: true,
        published: false,
        readinessScore: readiness.score,
        message: readiness.reason || 'No work ready for publication at this time',
        developmentStatus: readiness.developmentStatus,
        nextSteps: readiness.suggestions
      });
    }
    
  } catch (error) {
    console.error('Publication trigger failed:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to assess or trigger publication'
    });
  }
});

// Check publication readiness without triggering
router.get('/publication-readiness', requireAriadneAwake, async (req, res) => {
  try {
    if (!global.ariadne.writing) {
      return res.status(503).json({ 
        error: 'Writing system not available' 
      });
    }

    const readiness = await global.ariadne.writing.assessPublicationReadiness();
    
    res.json({
      ready: readiness.ready,
      score: readiness.score,
      reason: readiness.reason,
      developmentStatus: readiness.developmentStatus,
      suggestedActions: readiness.suggestions,
      lastAssessment: new Date().toISOString(),
      candidateWork: readiness.work ? {
        title: readiness.work.title,
        type: readiness.work.type,
        intellectualDepth: readiness.work.intellectualDepth
      } : null
    });
    
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Get publication history and metrics
router.get('/publications', async (req, res) => {
  try {
    if (!global.ariadne?.memory) {
      return res.json({ publications: [] });
    }

    const publications = await global.ariadne.memory.safeDatabaseOperation(`
      SELECT 
        id, title, type, publication_platform,
        intellectual_genealogy, source_curiosities,
        readiness_score, published_at
      FROM publications 
      WHERE publication_platform = 'substack'
      ORDER BY published_at DESC
      LIMIT 20
    `, [], 'all');

    const stats = {
      total: publications.length,
      byType: {},
      averageReadiness: 0,
      recentActivity: publications.slice(0, 5)
    };

    // Calculate statistics
    if (publications.length > 0) {
      publications.forEach(pub => {
        stats.byType[pub.type] = (stats.byType[pub.type] || 0) + 1;
      });
      
      const readinessScores = publications
        .filter(p => p.readiness_score)
        .map(p => p.readiness_score);
      
      if (readinessScores.length > 0) {
        stats.averageReadiness = readinessScores.reduce((a, b) => a + b) / readinessScores.length;
      }
    }

    res.json({
      publications: publications,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Publications retrieval failed:', error);
    res.status(500).json({ 
      error: error.message,
      publications: []
    });
  }
});

// Force a specific thought or idea to be considered for publication
router.post('/consider-for-publication', thoughtRateLimit, requireAriadneAwake, async (req, res) => {
  try {
    const { thoughtId, ideaDescription } = req.body;
    
    if (!thoughtId && !ideaDescription) {
      return res.status(400).json({ 
        error: 'Either thoughtId or ideaDescription is required' 
      });
    }

    let result;
    
    if (thoughtId) {
      // Consider a specific thought for publication
      const thought = await global.ariadne.memory.safeDatabaseOperation(
        'SELECT * FROM thoughts WHERE id = ?',
        [thoughtId],
        'get'
      );
      
      if (!thought) {
        return res.status(404).json({ error: 'Thought not found' });
      }
      
      result = await global.ariadne.writing.evaluateIdeaReadiness({
        thoughts: [thought],
        concept: thought.content.substring(0, 50) + '...'
      });
    } else {
      // Consider a general idea description
      result = await global.ariadne.writing.evaluateIdeaReadiness({
        thoughts: [],
        concept: ideaDescription
      });
    }
    
    res.json({
      consideration: result,
      recommendedAction: result.ready ? 'Proceed to publication' : 'Continue development',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Publication consideration failed:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

module.exports = router; 