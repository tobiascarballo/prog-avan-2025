// server.js - inicia el servidor de next y le enganchamos el backend (gateway y orchestrator)
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// 1. Importamos la función de nuestro WebSocket
const { attachWebSocketServer } = require('./dist/websocket-server');

// 2. Importamos el Orquestador
const { startOrchestrator } = require('./dist/orchestrator');

//configuracion estandar para el servidor de next
const dev = process.env.NODE_ENV !== 'production'; // si no es produccion, se usa el modo dev
const hostname = 'localhost';
const port = 3000; // puerto del servidor

const app = next({ dev, hostname, port }); // crea el servidor de next
const handle = app.getRequestHandler(); // maneja las peticiones

app.prepare().then(() => { // prepara el servidor de next
  // 2. Creamos el servidor HTTP
  const server = createServer(async (req, res) => { // crea el servidor HTTP
    try {
      const parsedUrl = parse(req.url, true); // parsea la url
      await handle(req, res, parsedUrl); // maneja la peticion
    } catch (err) {
      console.error('Error handling request:', err); // log de error
      res.statusCode = 500; // codigo de error
      res.end('Internal Server Error'); // mensaje de error
    }
  });

  // 3. ¡La magia! Enganchamos el WebSocket al servidor
  attachWebSocketServer(server); // engancha el websocket al servidor

  // 4. ¡¡AQUÍ FALTABA!! Encendemos el Orquestador
  startOrchestrator(); // inicia el orquestador

  // 5. Lanzamos el servidor
  server.listen(port, (err) => { // inicia el servidor
    if (err) throw err; // si hay error, lanza el error
    console.log(`> Ready on http://${hostname}:${port}`); // log de inicio
    console.log('WebSocket server attached.'); // log de enganchado
  });
}).catch((err) => {
  console.error('Error preparing Next.js app:', err); // log de error
  process.exit(1);
});