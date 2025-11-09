// lib/orchestrator.ts - servicio mas importante (escucha al command, procesa la saga y publica el progreso en events)
import { kafka, KAFKA_TOPIC_COMMANDS, KAFKA_TOPIC_EVENTS, KAFKA_TOPIC_DLQ } from './kafka';
import { Consumer, Producer } from 'kafkajs';
import { randomUUID } from 'crypto';

let consumer: Consumer | null = null; // consumer de kafka
let producer: Producer | null = null; // producer de kafka

// Función para simular un delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Función para publicar un evento
const publishEvent = async (
  topic: string,
  transactionId: string,
  userId: string,
  type: string,
  payload: any
) => {
  // Asumimos que el 'producer' ya está conectado por 'startOrchestrator'
  if (!producer) {
    console.error('[Orchestrator] El productor no está inicializado. No se puede publicar el evento.');
    throw new Error('El productor no está inicializado'); // lanza un error si el producer no esta inicializado
  }

  const event = { // crea el evento
    id: randomUUID(),
    type, // tipo de evento
    version: 1, // version del evento
    ts: Date.now(), // timestamp del evento
    transactionId, // id de la transaccion
    userId, // id del usuario
    payload, // payload del evento
  };

  await producer.send({ // publica el evento en kafka
    topic: topic, // topic del evento
    messages: [
      {
        key: transactionId, // id de la transaccion
        value: JSON.stringify(event), // convierte el evento a JSON
      },
    ],
  });
  console.log(`[Orchestrator] Evento ${type} publicado para ${transactionId}`); // log para debug
};

// Función principal para iniciar el Orquestador
export const startOrchestrator = async () => {
  if (consumer) {
    console.log('Orchestrator consumer is already running.'); // log para debug
    return;
  }

  consumer = kafka.consumer({ groupId: 'orchestrator-group' }); // crea el consumer
  producer = kafka.producer(); // Se inicia aca

  try {
    console.log('[Orchestrator] Connecting consumer...'); // log para debug
    await consumer.connect();
    console.log('[Orchestrator] Consumer connected.'); // log para debug
    
    // Conectamos el productor aca, una sola vez.
    console.log('[Orchestrator] Connecting producer...'); // log para debug
    await producer.connect();
    console.log('[Orchestrator] Producer connected.'); // log para debug

    await consumer.subscribe({ topic: KAFKA_TOPIC_COMMANDS, fromBeginning: true }); // se suscribe al topic de commands
    console.log(`[Orchestrator] Subscribed to topic: ${KAFKA_TOPIC_COMMANDS}`); // log para debug

    // Empezamos a escuchar comandos
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return; // si no hay mensaje, retorna

        const command = JSON.parse(message.value.toString());
        const { transactionId, userId, payload } = command; // desestructura el comando

        console.log(`[Orchestrator] Procesando ${command.type} para ${transactionId}`);

        try {
          // inicio de la saga (proceso de la transaccion)
          // 1. Reservar Fondos
          await sleep(1000); // Simular trabajo
          await publishEvent(
            KAFKA_TOPIC_EVENTS, // topic del evento
            transactionId, // id de la transaccion
            userId, // id del usuario
            'txn.FundsReserved', // tipo de evento
            { ok: true, holdId: randomUUID(), amount: payload.amount } // crea el evento
          );

          // 2. Chequeo de Fraude (Simulado)
          await sleep(1500);
          const risk = Math.random() < 0.1 ? 'HIGH' : 'LOW'; // 10% de riesgo alto

          if (risk === 'HIGH') {
            // 3.a. Riesgo ALTO: Revertir
            await publishEvent(
              KAFKA_TOPIC_EVENTS,
              transactionId,
              userId,
              'txn.FraudChecked', // tipo de evento
              { risk: 'HIGH' }
            );
            await sleep(500);
            await publishEvent(
              KAFKA_TOPIC_EVENTS,
              transactionId,
              userId,
              'txn.Reversed', // tipo de evento
              { reason: 'High fraud risk' }
            );
            console.log(`[Orchestrator] Transacción ${transactionId} REVERTIDA`);
          } else {
            // 3.b. Riesgo BAJO: Confirmar
            await publishEvent(
              KAFKA_TOPIC_EVENTS,
              transactionId,
              userId,
              'txn.FraudChecked', // tipo de evento
              { risk: 'LOW' }
            );
            await sleep(1000);
            // 4. Confirmar (Committed)
            await publishEvent(
              KAFKA_TOPIC_EVENTS,
              transactionId,
              userId,
              'txn.Committed', // tipo de evento
              { ledgerTxId: randomUUID() }
            );
            await sleep(500);
            // 5. Notificar
            await publishEvent(
              KAFKA_TOPIC_EVENTS,
              transactionId,
              userId,
              'txn.Notified', // tipo de evento
              { channels: ['email', 'push'] }
            );
            console.log(`[Orchestrator] Transacción ${transactionId} COMPLETADA`);
          }
          // fin de la saga
        
        } catch (err: any) {
          // Error inesperado (ej: la base de datos se cayó)
          console.error(`[Orchestrator] Error inesperado procesando ${transactionId}:`, err);
          // Enviar a la Dead Letter Queue (DLQ)
          await publishEvent(
            KAFKA_TOPIC_DLQ,
            transactionId,
            userId,
            'txn.ProcessingFailed', // tipo de evento
            { error: err.message, originalCommand: command }
          );
        }
      },
    });
  } catch (error) {
    console.error('[Orchestrator] Error fatal al iniciar:', error);
    if (consumer) {
      await consumer.disconnect().catch(console.error); // desconecta el consumer
      consumer = null;
    }
    // También desconectar el producer si falla el inicio
    if (producer) {
      await producer.disconnect().catch(console.error); // desconecta el producer
      producer = null;
    }
  }
};