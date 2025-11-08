// lib/websocket-server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { kafka, KAFKA_TOPIC_EVENTS, ensureTopicsCreated } from './kafka';
import { Consumer } from 'kafkajs';
import { parse } from 'url'; // <-- CAMBIO 1: Importamos 'parse'

// Declaramos las variables globales para el Singleton
declare global {
  var wsServer: WebSocketServer | undefined;
  var kafkaConsumerStarted: boolean | undefined;
}

// (Función createWebSocketServer - queda exactamente igual)
const createWebSocketServer = () => {
  if (global.wsServer) {
    return global.wsServer;
  }
  console.log('Creating new WebSocket server...');
  const wss = new WebSocketServer({ noServer: true });
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
    });
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  console.log('WebSocket server created.');
  global.wsServer = wss;
  return global.wsServer;
};

// --- CAMBIO 2: Hacemos que esta función sea más inteligente ---
export const attachWebSocketServer = (server: any) => {
  if (!global.wsServer) {
    createWebSocketServer();
  }

  server.on('upgrade', (request: any, socket: any, head: any) => {
    // Leemos la URL a la que el cliente intenta conectarse
    const { pathname } = parse(request.url, true);

    // ¡ESTA ES LA LÓGICA CLAVE!
    // Si la ruta es '/ws' (la que usará nuestra app), la manejamos.
    if (pathname === '/ws') {
      console.log('Ruteando al WebSocket del TP...');
      global.wsServer!.handleUpgrade(request, socket, head, (ws) => {
        global.wsServer!.emit('connection', ws, request);
      });
    } else {
      // Si es cualquier otra ruta (como la de Next.js HMR),
      // la destruimos para evitar el 'RangeError'.
      // Esto puede romper el "Fast Refresh", pero hace que nuestra app funcione.
      console.log('Ignorando conexión WebSocket (probablemente HMR de Next.js)...');
      socket.destroy();
    }
  });
};
// --- FIN DEL CAMBIO ---


// --- LÓGICA DE KAFKA (Tu código con 'waitWithRetry' - está perfecto) ---

let kafkaConsumer: Consumer | null = null;

// (Función waitWithRetry - queda exactamente igual)
const waitWithRetry = async (fn: () => Promise<void>, maxRetries: number = 10, delay: number = 2000): Promise<void> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fn();
      return;
    } catch (error: any) {
      if (i === maxRetries - 1) {
        throw error;
      }
      console.log(`Intento ${i + 1}/${maxRetries} falló. Reintentando en ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// (Función startKafkaConsumer - queda exactamente igual)
export const startKafkaConsumer = async () => {
  if (kafkaConsumer) {
    console.log('Kafka consumer is already running.');
    return;
  }
  try {
    await waitWithRetry(async () => {
      await ensureTopicsCreated();
    }, 10, 2000);
  } catch (error) {
    console.error('Failed to ensure Kafka topics are created after retries:', error);
    return;
  }
  kafkaConsumer = kafka.consumer({
    groupId: 'websocket-gateway-group',
    retry: {
      initialRetryTime: 300,
      retries: 8,
    },
  });
  try {
    console.log('Connecting Kafka consumer...');
    await waitWithRetry(async () => {
      await kafkaConsumer!.connect();
    }, 10, 2000);
    console.log('Kafka consumer connected.');
    await kafkaConsumer.subscribe({ topic: KAFKA_TOPIC_EVENTS, fromBeginning: true });
    console.log(`Subscribed to topic: ${KAFKA_TOPIC_EVENTS}`);
    await kafkaConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;
        const event = message.value.toString();
        console.log(`[${topic}] Received event:`, event);
        if (global.wsServer) {
          global.wsServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(event);
            }
          });
        }
      },
    });
  } catch (error) {
    console.error('Error with Kafka consumer after retries:', error);
    if (kafkaConsumer) {
      await kafkaConsumer.disconnect().catch(console.error);
      kafkaConsumer = null;
    }
  }
};

// (Lógica de inicio - queda exactamente igual)
if (process.env.NODE_ENV !== 'production' || !global.kafkaConsumerStarted) {
  if (process.env.NODE_ENV !== 'production') {
    startKafkaConsumer();
  } else {
    if (!global.kafkaConsumerStarted) {
      startKafkaConsumer();
      global.kafkaConsumerStarted = true;
    }
  }
}