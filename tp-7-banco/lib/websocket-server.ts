// lib/websocket-server.ts - gateway que escucha el events y lo retransmite por websocket a los clientes
import { WebSocketServer, WebSocket } from 'ws';
import { kafka, KAFKA_TOPIC_EVENTS, ensureTopicsCreated } from './kafka';
import { Consumer } from 'kafkajs';
import { parse } from 'url';

// Declaramos las variables globales para el Singleton
declare global {
  var wsServer: WebSocketServer | undefined; // servidor de websocket
  var kafkaConsumerStarted: boolean | undefined; // flag para indicar si el consumidor de kafka esta iniciado
}

// función createWebSocketServer que sirve para crear el servidor de websocket
const createWebSocketServer = () => {
  if (global.wsServer) {
    return global.wsServer; // retorna el servidor de websocket si ya existe
  }
  console.log('Creating new WebSocket server...'); // log de creacion del servidor de websocket
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
  global.wsServer = wss; // asigna el servidor de websocket a la variable global
  return global.wsServer; // retorna el servidor de websocket
};

// función attachWebSocketServer que sirve para enganchar el servidor de websocket al servidor de next
export const attachWebSocketServer = (server: any) => {
  if (!global.wsServer) {
    createWebSocketServer(); // crea el servidor de websocket si no existe
  }

  server.on('upgrade', (request: any, socket: any, head: any) => {
    // Leemos la URL a la que el cliente intenta conectarse
    const { pathname } = parse(request.url, true); // parsea la url

    // Si la ruta es '/ws' (la app), la manejamos.
    if (pathname === '/ws') {
      console.log('Ruteando al WebSocket del TP...'); // log de ruteo del websocket
      global.wsServer!.handleUpgrade(request, socket, head, (ws) => {
        global.wsServer!.emit('connection', ws, request); // emite el evento de conexion
      });
    } else {
      // Si es cualquier otra ruta (como la de Next.js HMR), se destruye para evitar error.
      console.log('Ignorando conexión WebSocket (probablemente HMR de Next.js)...'); // log de ignoracion de conexion
      socket.destroy();
    }
  });
};

// función waitWithRetry que sirve para esperar a que se cree el topic de kafka
let kafkaConsumer: Consumer | null = null; // consumer de kafka

// función waitWithRetry que sirve para esperar a que se cree el topic de kafka
const waitWithRetry = async (fn: () => Promise<void>, maxRetries: number = 10, delay: number = 2000): Promise<void> => { // espera a que se cree el topic de kafka
  for (let i = 0; i < maxRetries; i++) { // for para esperar a que se cree el topic de kafka
    try {
      await fn(); // ejecuta la funcion
      return; // retorna si la funcion se ejecuta correctamente
    } catch (error: any) {
      if (i === maxRetries - 1) {
        throw error; // lanza un error si el intento es el ultimo
      }
      console.log(`Intento ${i + 1}/${maxRetries} falló. Reintentando en ${delay}ms...`); // log de intento fallido
      await new Promise(resolve => setTimeout(resolve, delay)); // espera a que se cree el topic de kafka
    }
  }
};

// función startKafkaConsumer que sirve para iniciar el consumidor de kafka
export const startKafkaConsumer = async () => { // inicia el consumidor de kafka
  if (kafkaConsumer) {
    console.log('Kafka consumer is already running.');
    return; // retorna si el consumidor de kafka ya esta iniciado
  }
  try {
    await waitWithRetry(async () => {
      await ensureTopicsCreated(); // espera a que se cree el topic de kafka
    }, 10, 2000);
  } catch (error) {
    console.error('Failed to ensure Kafka topics are created after retries:', error); // log de error
    return; // retorna si el error es el ultimo
  }
  kafkaConsumer = kafka.consumer({
    groupId: 'websocket-gateway-group', // grupo de consumidores
    retry: {
      initialRetryTime: 300, // tiempo de espera inicial
      retries: 8, // numero de reintentos
    },
  }); // crea el consumer de kafka
  try {
    console.log('Connecting Kafka consumer...'); // log de conexion del consumer
    await waitWithRetry(async () => {
      await kafkaConsumer!.connect(); // conecta el consumer de kafka
    }, 10, 2000);
    console.log('Kafka consumer connected.'); // log de conexion del consumer
    await kafkaConsumer.subscribe({ topic: KAFKA_TOPIC_EVENTS, fromBeginning: true });
    console.log(`Subscribed to topic: ${KAFKA_TOPIC_EVENTS}`); // log de suscripcion al topic
    await kafkaConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return; // retorna si no hay mensaje
        const event = message.value.toString();
        console.log(`[${topic}] Received event:`, event); // log de evento recibido
        if (global.wsServer) {
          global.wsServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(event); // envia el evento al cliente
            }
          });
        }
      },
    });
  } catch (error) {
    console.error('Error with Kafka consumer after retries:', error);
    if (kafkaConsumer) {
      await kafkaConsumer.disconnect().catch(console.error); // desconecta el consumer de kafka
      kafkaConsumer = null; // asigna null al consumer de kafka
    }
  }
};

// Lógica de inicio para el consumidor de kafka)
if (process.env.NODE_ENV !== 'production' || !global.kafkaConsumerStarted) { // si no es produccion o el consumer de kafka no esta iniciado
  if (process.env.NODE_ENV !== 'production') {
    startKafkaConsumer(); // inicia el consumidor de kafka
  } else {
    if (!global.kafkaConsumerStarted) {
      startKafkaConsumer(); // inicia el consumidor de kafka
      global.kafkaConsumerStarted = true; // asigna true al flag de inicio del consumer de kafka
    }
  }
}