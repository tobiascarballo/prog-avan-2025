// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// 1. Importamos la función de nuestro WebSocket
const { attachWebSocketServer } = require('./dist/websocket-server');

// 2. Importamos el Orquestador
const { startOrchestrator } = require('./dist/orchestrator');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // 2. Creamos el servidor HTTP
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // 3. ¡La magia! Enganchamos el WebSocket al servidor
  attachWebSocketServer(server);

  // 4. ¡¡AQUÍ FALTABA!! Encendemos el Orquestador
  startOrchestrator();

  // 5. Lanzamos el servidor
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('WebSocket server attached.');
  });
}).catch((err) => {
  console.error('Error preparing Next.js app:', err);
  process.exit(1);
});