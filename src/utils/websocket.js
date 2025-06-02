const WebSocket = require('ws');

let wss = null;

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    console.log('👁️ New observer connected to Ariadne');
    
    if (global.ariadne) {
      getSystemStats().then(stats => {
        ws.send(JSON.stringify({
          type: 'system_stats',
          data: stats
        }));
      });
    }

    ws.on('close', () => {
      console.log('👁️ Observer disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  global.wsServer = wss;
}

function broadcastToClients(message) {
  if (!wss) return;
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

async function getSystemStats() {
  return {
    thoughts: await getThoughtCount(),
    curiosities: global.ariadne?.curiosities?.activeCuriosities.size || 0,
    texts: await getTextCount(),
    publications: global.ariadne?.writing?.publishedWorks.size || 0
  };
}

async function getThoughtCount() {
  if (!global.ariadne?.memory?.db) return 0;
  
  return new Promise((resolve) => {
    global.ariadne.memory.db.get('SELECT COUNT(*) as count FROM thoughts', (err, row) => {
      resolve(err || !row ? 0 : row.count);
    });
  });
}

async function getTextCount() {
  if (!global.ariadne?.memory?.db) return 0;
  
  return new Promise((resolve) => {
    global.ariadne.memory.db.get('SELECT COUNT(*) as count FROM texts', (err, row) => {
      resolve(err || !row ? 0 : row.count);
    });
  });
}

module.exports = {
  setupWebSocket,
  broadcastToClients
};
