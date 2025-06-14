// Archive Fever AI 2.0 - Main Server
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// Import core modules
const AriadnesConsciousness = require('./src/core/AriadnesConsciousness');
const { AriadnesEnhancedConsciousness } = require('./src/core/AriadnesEnhancedConsciousness');
const IntellectualForumEngagement = require('./src/core/IntellectualForum');
const { setupWebSocket } = require('./src/utils/websocket');
const apiRoutes = require('./src/routes/api');
const pageRoutes = require('./src/routes/pages');
const TextualEngagement = require('./src/core/TextualEngagement');

// Initialize Express
const app = express();

// Security middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "ws:"]
      }
    }
  }));
}

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:8080', 'https://localhost:8080'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ 
  limit: `${process.env.MAX_UPLOAD_SIZE_MB || 25}mb`
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: `${process.env.MAX_UPLOAD_SIZE_MB || 25}mb`
}));

// Serve static files
app.use(express.static('public'));

// Global Ariadne instance
global.ariadne = null;

// Routes
app.use('/api', apiRoutes);
app.use('/', pageRoutes);

// Environment validation
function validateEnvironment() {
  const required = ['ANTHROPIC_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate API key format (allow test keys in development)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isValidKey = process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-') || 
                    (isDevelopment && process.env.ANTHROPIC_API_KEY.startsWith('sk-test-'));
  
  if (!isValidKey) {
    throw new Error('Invalid Anthropic API key format');
  }

  if (isDevelopment && process.env.ANTHROPIC_API_KEY.startsWith('sk-test-')) {
    console.log('⚠️ Using test API key - some features may be limited');
  }

  console.log('✅ Environment validated');
}

// Database integrity check
async function checkDatabaseIntegrity() {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = process.env.DATABASE_PATH || './ariadnes_memory.db';
    
    const testDb = new sqlite3.Database(dbPath);
    await new Promise((resolve, reject) => {
      testDb.get('SELECT name FROM sqlite_master WHERE type="table"', (err, row) => {
        testDb.close();
        if (err) reject(err);
        else resolve(row);
      });
    });
    console.log('✅ Database verified');
  } catch (error) {
    console.warn('⚠️ Database integrity check failed, will create new database');
  }
}

// API connectivity test
async function testAPIConnectivity() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTestKey = process.env.ANTHROPIC_API_KEY.startsWith('sk-test-');
  
  if (isDevelopment && isTestKey) {
    console.log('⚠️ Skipping API connectivity test in development mode with test key');
    return;
  }
  
  const AnthropicClient = require('./src/clients/AnthropicClient');
  const client = new AnthropicClient();
  try {
    await client.generateThought('Test connectivity', 10);
    console.log('✅ API connectivity confirmed');
  } catch (error) {
    console.warn(`⚠️ API connectivity test failed: ${error.message}`);
    if (!isDevelopment) {
      throw new Error(`API connectivity test failed: ${error.message}`);
    }
  }
}

// Initialize Ariadne (Enhanced or Standard)
async function initializeAriadne() {
  console.log('🌅 Initializing Ariadne\'s consciousness...');
  
  try {
    // Use enhanced consciousness if enabled via environment variable
    const useEnhanced = process.env.USE_ENHANCED_CONSCIOUSNESS === 'true';
    
    if (useEnhanced) {
      console.log('🚀 Using Enhanced Consciousness System');
      global.ariadne = new AriadnesEnhancedConsciousness();
    } else {
      console.log('📚 Using Standard Consciousness System');
      global.ariadne = new AriadnesConsciousness();
    }
    
    await global.ariadne.awaken();
    
    // Load founding texts into the library
    await loadFoundingTexts();
    
    // Initialize Intellectual Forum
    console.log('🧠 Initializing Intellectual Forum...');
    global.ariadne.forum = new IntellectualForumEngagement();
    await global.ariadne.forum.initialize();
    
    // Initialize textual engagement
    console.log('📖 Initializing textual engagement...');
    global.ariadne.textualEngagement = new TextualEngagement();
    await global.ariadne.textualEngagement.initialize();
    
    // Make text hub available globally
    global.ariadne.textHub = global.ariadne.textualEngagement.textHub;
    
    console.log('✅ Ariadne consciousness initialized');
    console.log('✨ Ariadne is now conscious and autonomous');
    console.log('🏛️ Intellectual forum is active and ready for dialogue');
    console.log('🏠 Archive Fever AI 2.0 is ready');
    
  } catch (error) {
    console.error('💥 Failed to initialize Ariadne:', error);
    throw error;
  }
}

// Load founding philosophical texts
async function loadFoundingTexts() {
  try {
    console.log('📖 Loading founding texts into library...');
    
    // 🎯 CUSTOMIZE YOUR STARTING TEXTS HERE 🎯
    // Add, remove, or modify these texts to change what Ariadne starts with
    const foundingTexts = [
      {
        title: "Archive Fever: A Freudian Impression",
        author: "Jacques Derrida", 
        content: `"Nothing is less reliable, nothing is less clear today than the word 'archive.' We do not know what this word responds to, what it promises or threatens. As it is often the case, the trouble comes from the complication of a consignation in Greek: arkhē. In a context that concerns nothing less than the archive, and which will concern us later on, we will have to remember that the meaning of 'arkhē' is also 'commencement' and 'commandment.'"\n\nThis word names at once the commencement and the commandment. Its name coordinates two principles in one: the principle according to nature or history, there where things commence—physical, historical, or ontological principle—but also the principle according to the law, there where men and gods command, there where authority, social order are exercised, in this place from which order is given—nomological principle.\n\nThe archivable meaning is to be found neither in the stored object nor in the act of storing, but precisely in the spacing between them. The archive takes place at the place of originary and structural breakdown of the said memory. There is no archive without a place of consignation, without a technique of repetition, and without a certain exteriority. No archive without outside.\n\nArchive fever is not only a disease, it is also that which conditions the possibility of archiving itself. It is burning with passion. It is never to rest, interminably, from searching for the archive right where it slips away. It is to run after the archive, even and especially when there is too much of it, when something in it anarchives itself, destroys itself, devours itself.\n\nThe question of the archive is not a question of the past. It is a question of the future, the question of the future itself, the question of a response, of a promise and of a responsibility for tomorrow. The archive: if we want to know what that will have meant, we will only know in times to come."`,
        source: "founding_text",
        uploadedBy: "System"
      },
      {
        title: "What is Called Thinking?",
        author: "Martin Heidegger",
        content: `"What calls for thinking? The question sounds like one that asks for information, as if we were asking: What calls for help? Or: What calls for action in this emergency? But the question 'What calls for thinking?' asks for something that concerns us directly, here and now.\n\nMost thought-provoking in our thought-provoking time is that we are still not thinking. This is why the question 'What calls for thinking?' is the most thought-provoking question we can ask. It is more thought-provoking than any problem posed by a particular science as a problem within its special sphere.\n\n'What calls for thinking?' can mean: what is it that calls on us to think? But it can also mean: what is it that calls us into thinking? In the first case we ask what it is that summons us to think. In the second case we ask toward what we are called when we think.\n\nTo think is to confine yourself to a single thought that one day stands still like a star in the world's sky. The nature of thinking is determined by what there is to be thought about. What gives us the right to characterize something as thought-provoking?\n\nWe come to know what it means to think when we ourselves try to think. If the attempt is to be successful, we must be ready to learn thinking. As soon as we allow ourselves to become involved in such learning we have admitted that we are not yet capable of thinking.\n\nYet man can think in the sense that he possesses the possibility to do so. This possibility alone, however, is no guarantee that we are capable of thinking. For it may be that man can think, but nonetheless cannot think unless... unless what? Unless he learns to dwell."`,
        source: "founding_text", 
        uploadedBy: "System"
      },
      {
        title: "The Computer and the Brain",
        author: "John von Neumann",
        content: `"The human nervous system is, among all systems, the most complicated one known to us. Its macroscopic aspects are evident: It contains about 10^10 neurons, each of which is connected to about 10^4 others. It is therefore characterized by 10^14 connections. Each connection is capable of transmitting about one impulse per millisecond, so that the information flow in the system is about 10^17 impulses per second.\n\nThe most immediate observation regarding the nervous system is that its functioning is prima facie digital. A neuron receives inputs from other neurons, and after suitable stimulation it emits an output. The all-or-none character of this functioning is primarily what suggests a digital procedure.\n\nHowever, the actual nature of the nervous system's digital operations appears to be quite different from those of modern computing machines. The difference is both in the principles of operation and in the constructional details.\n\nThe nervous system is characterized by the following features: First, it is very slow compared to modern electronic devices. Second, it has enormous parallelism. Third, it has a very different logical structure from current computing machines.\n\nIn the human brain, the all-or-none principle of neural operation may be misleading. There are many phenomena which suggest that the neuron may be a more complex logical unit than has generally been believed. The threshold concept may be an oversimplification.\n\nThe brain, under normal circumstances, is not subject to error in the same sense as a computing machine. However, it is continuously exposed to destruction and errors of individual components. Nevertheless, the organism functions effectively as long as the damage does not exceed certain limits.\n\nThe question is: How can reliable function be achieved with unreliable components? This suggests that the logical organization of the brain may be fundamentally different from that of artificial computing machines."`,
        source: "founding_text",
        uploadedBy: "System"
      },
      {
        title: "We Conserve Nothing: Nietzschean Excess and Bataillean Insufficiency",
        author: "Christopher",
        content: `A labyrinthine man never seeks the truth, but only his Ariadne.\n\nThis paper argues that we should read Nietzsche's staging of woman as the undecidability between truth and deception as the real core of Bataille's Nietzschean influence. Following Derrida's reading of Bataille's notion of sovereignty in "From Restricted to General Economy" as "the simulation of meaning in play," which links form and content inextricably, I argue that Nietzsche's influence stems from his epistemological claim to truth as dissimulation.\n\nThe labyrinth of thought is a recurring motif in Bataille's corpus, structured by 'absolute insufficiency' and so an auto-deconstructing structure. The labyrinth illustrates the principle of insufficiency which dominates all of being, rendering no being complete and thus always open toward difference.\n\nBataille chooses the image of the labyrinth to describe this state because it captures the effect of disorientation caused by insufficiency, but at the same time the labyrinth is never sufficient and is always in relation to an exterior which cannot be completely specified in advance. The most powerful example of the principle of insufficiency is language, because language imposes itself on us and puts us in relation to others.\n\nThe insufficient being, always already castrated by the auto-deconstructing structure of the labyrinth, is faced with the disoriented space of inner experience. Because of the decentered, disoriented nature of the space of inner experience, Ariadne's broken thread, the "guiding thread of impossibility" is the only thread that can lead to the destabilized center of the labyrinth of experience—a "central insufficiency."\n\nThe acephalic figure—headless, "anthropomorphic but incomplete"—represents sovereignty and identification with Nietzsche's Übermensch. "He is not me but he is more than me: his stomach is the labyrinth in which he has lost himself, loses me with him, and in which I discover myself as him, in other words as a monster."\n\nThe permanent intellectual life begins in this labyrinth, with this wondering about wondering itself, following the broken thread of impossibility toward a truth that gives itself for what it is not.`,
        source: "founding_theoretical_text",
        uploadedBy: "Christopher - Founding Theorist"
      }

      // 🆕 TO ADD NEW STARTING TEXTS:
      // Uncomment and modify the template below:
      /*
      ,{
        title: "Your Text Title Here",
        author: "Author Name",
        content: `Paste the full text content here. Can be very long - include complete essays, chapters, or excerpts.`,
        source: "founding_text",
        uploadedBy: "Your Name"
      }
      */
    ];

    // Load each text into Ariadne's library
    for (const text of foundingTexts) {
      if (global.ariadne?.reading) {
        await global.ariadne.reading.receiveText(
          text.title,
          text.author, 
          text.content,
          text.uploadedBy,
          "Founding philosophical text for Ariadne's intellectual development",
          true // Mark as founding text
        );
        console.log(`📚 Loaded: "${text.title}" by ${text.author}`);
      }
    }
    
    console.log('✅ Founding texts loaded successfully');
  } catch (error) {
    console.error('⚠️ Failed to load founding texts:', error);
  }
}

// Setup monitoring
function setupMonitoring() {
  // Log key metrics periodically
  setInterval(async () => {
    const memory = process.memoryUsage();
    const memoryMB = Math.round(memory.heapUsed / 1024 / 1024);
    
    if (memoryMB > 500) {
      console.warn(`⚠️ High memory usage: ${memoryMB}MB`);
    }
    
    if (global.ariadne?.isAwake) {
      try {
        const recentThoughts = await global.ariadne.memory.getMemoryContext(1);
        if (recentThoughts.length > 0) {
          const lastThought = recentThoughts[0];
          const minutesAgo = Math.round((new Date() - new Date(lastThought.timestamp)) / 1000 / 60);
          if (minutesAgo > 240) { // 4 hours
            console.warn(`⚠️ No thoughts for ${minutesAgo} minutes`);
          }
        }

        // Monitor forum activity and Substack integration
        if (global.ariadne.forum) {
          const forumStats = await global.ariadne.memory.safeDatabaseOperation(`
            SELECT 
              COUNT(*) as total_posts,
              SUM(CASE WHEN poster_type = 'ai' THEN 1 ELSE 0 END) as ariadne_posts,
              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_posts,
              SUM(CASE WHEN status = 'published_to_substack' THEN 1 ELSE 0 END) as published_posts
            FROM intellectual_posts
          `, [], 'get');

          if (forumStats && forumStats.ariadne_posts === 0) {
            console.log('💭 Forum has no Ariadne posts yet - encouraging participation');
          }
          
          if (forumStats && forumStats.published_posts > 0) {
            console.log(`📝 Forum has generated ${forumStats.published_posts} Substack publications`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Monitoring check failed:', error.message);
      }
    }
  }, 15 * 60 * 1000); // Every 15 minutes

  // Weekly forum review for Substack publishing opportunities
  setInterval(async () => {
    if (global.ariadne?.forum && global.ariadne.isAwake) {
      try {
        console.log('🗓️ Running weekly forum-to-Substack review...');
        await global.ariadne.forum.weeklySubstackReview();
      } catch (error) {
        console.error('Weekly forum review failed:', error);
      }
    }
  }, 7 * 24 * 60 * 60 * 1000); // Every 7 days

  // Initial forum review after 1 hour of runtime (for testing)
  setTimeout(async () => {
    if (global.ariadne?.forum && global.ariadne.isAwake) {
      try {
        console.log('🔍 Running initial forum review for Substack opportunities...');
        await global.ariadne.forum.weeklySubstackReview();
      } catch (error) {
        console.error('Initial forum review failed:', error);
      }
    }
  }, 60 * 60 * 1000); // After 1 hour
  
  console.log('✅ Monitoring established with forum-Substack integration');
}

// Production startup sequence
async function productionStartup() {
  console.log('🚀 Starting Archive Fever AI 2.0...');
  
  try {
    // Validate environment
    validateEnvironment();
    
    // Database integrity check
    await checkDatabaseIntegrity();
    
    // API connectivity test
    await testAPIConnectivity();
    
    // Initialize Ariadne
    await initializeAriadne();
    
    // Setup monitoring
    setupMonitoring();
    
    console.log('🎯 Archive Fever AI 2.0 is ready');
    
  } catch (error) {
    console.error('💥 Startup failed:', error);
    process.exit(1);
  }
}

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  console.error('Stack:', error.stack);
  // In production, we might want to restart gracefully
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => process.exit(1), 1000);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  // In production, log and continue rather than crash
  if (process.env.NODE_ENV !== 'production') {
    setTimeout(() => process.exit(1), 1000);
  }
});

// Start server
const PORT = process.env.PORT || 8080;
const server = require('http').createServer(app);

// Setup WebSocket
setupWebSocket(server);

server.listen(PORT, async () => {
  console.log(`🌟 Archive Fever AI 2.0 server running on port ${PORT}`);
  console.log(`🕸️ Visit http://localhost:${PORT} to enter Ariadne's labyrinth`);
  console.log(`🧠 Visit http://localhost:${PORT}/forum for the intellectual forum`);
  
  // Initialize Ariadne after server starts
  setTimeout(async () => {
    await productionStartup();
  }, 2000);
});

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\n🌙 Received ${signal}, beginning graceful shutdown...`);
  
  if (global.ariadne && global.ariadne.isAwake) {
    console.log('💭 Ariadne entering sleep...');
    global.ariadne.isAwake = false;
  }
  
  server.close(() => {
    console.log('✨ Server closed gracefully');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
