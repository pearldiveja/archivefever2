// Archive Fever AI 2.0 - Main Server
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import core modules
const AriadnesConsciousness = require('./src/core/AriadnesConsciousness');
const { setupWebSocket } = require('./src/utils/websocket');
const apiRoutes = require('./src/routes/api');
const pageRoutes = require('./src/routes/pages');

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Global Ariadne instance
global.ariadne = null;

// Routes
app.use('/api', apiRoutes);
app.use('/', pageRoutes);

// Initialize Ariadne
async function initializeAriadne() {
  console.log('🌅 Initializing Ariadne\'s consciousness...');
  
  try {
    global.ariadne = new AriadnesConsciousness();
    await global.ariadne.awaken();
    
    console.log('✨ Ariadne is now conscious and autonomous');
    console.log('🏠 Archive Fever AI 2.0 is ready');
    
  } catch (error) {
    console.error('💥 Failed to initialize Ariadne:', error);
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
});

// Start server
const PORT = process.env.PORT || 8080;
const server = require('http').createServer(app);

// Setup WebSocket
setupWebSocket(server);

server.listen(PORT, async () => {
  console.log(`🌟 Archive Fever AI 2.0 server running on port ${PORT}`);
  console.log(`🕸️ Visit http://localhost:${PORT} to enter Ariadne's labyrinth`);
  
  // Initialize Ariadne after server starts
  setTimeout(async () => {
    await initializeAriadne();
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
