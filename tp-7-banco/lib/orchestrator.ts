// lib/orchestrator.ts
import { kafka, KAFKA_TOPIC_COMMANDS, KAFKA_TOPIC_EVENTS, KAFKA_TOPIC_DLQ } from './kafka';
import { Consumer, Producer } from 'kafkajs';
import { randomUUID } from 'crypto';

let consumer: Consumer | null = null;
let producer: Producer | null = null;

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
    throw new Error('El productor no está inicializado');
  }

  const event = {
    id: randomUUID(),
    type,
    version: 1,
    ts: Date.now(),
    transactionId,
    userId,
    payload,
  };

  await producer.send({
    topic: topic,
    messages: [
      {
        key: transactionId,
        value: JSON.stringify(event),
      },
    ],
  });
  console.log(`[Orchestrator] Evento ${type} publicado para ${transactionId}`);
};

// Función principal para iniciar el Orquestador
export const startOrchestrator = async () => {
  if (consumer) {
    console.log('Orchestrator consumer is already running.');
    return;
  }

  consumer = kafka.consumer({ groupId: 'orchestrator-group' });
  producer = kafka.producer(); // Se inicializa aquí

  try {
    console.log('[Orchestrator] Connecting consumer...');
    await consumer.connect();
    console.log('[Orchestrator] Consumer connected.');
    
    // --- ¡ESTA ES LA CORRECCIÓN! ---
    // Conectamos el productor aquí, una sola vez.
    console.log('[Orchestrator] Connecting producer...');
    await producer.connect();
    console.log('[Orchestrator] Producer connected.');
    // --- FIN DE LA CORRECCIÓN ---

    await consumer.subscribe({ topic: KAFKA_TOPIC_COMMANDS, fromBeginning: true });
    console.log(`[Orchestrator] Subscribed to topic: ${KAFKA_TOPIC_COMMANDS}`);

    // Empezamos a escuchar comandos
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;

        const command = JSON.parse(message.value.toString());
        const { transactionId, userId, payload } = command;

        console.log(`[Orchestrator] Procesando ${command.type} para ${transactionId}`);

        try {
          // --- INICIO DE LA SAGA ---
          // 1. Reservar Fondos
          await sleep(1000); // Simular trabajo
          await publishEvent(
            KAFKA_TOPIC_EVENTS,
            transactionId,
            userId,
            'txn.FundsReserved',
            { ok: true, holdId: randomUUID(), amount: payload.amount }
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
              'txn.FraudChecked',
              { risk: 'HIGH' }
            );
            await sleep(500);
            await publishEvent(
              KAFKA_TOPIC_EVENTS,
              transactionId,
              userId,
              'txn.Reversed',
              { reason: 'High fraud risk' }
            );
            console.log(`[Orchestrator] Transacción ${transactionId} REVERTIDA`);
          } else {
            // 3.b. Riesgo BAJO: Confirmar
            await publishEvent(
              KAFKA_TOPIC_EVENTS,
              transactionId,
              userId,
              'txn.FraudChecked',
              { risk: 'LOW' }
            );
            await sleep(1000);
            // 4. Confirmar (Committed)
            await publishEvent(
              KAFKA_TOPIC_EVENTS,
              transactionId,
              userId,
              'txn.Committed',
              { ledgerTxId: randomUUID() }
            );
            await sleep(500);
            // 5. Notificar
            await publishEvent(
              KAFKA_TOPIC_EVENTS,
              transactionId,
              userId,
              'txn.Notified',
              { channels: ['email', 'push'] }
            );
            console.log(`[Orchestrator] Transacción ${transactionId} COMPLETADA`);
          }
          // --- FIN DE LA SAGA ---
        
        } catch (err: any) {
          // Error inesperado (ej: la base de datos se cayó)
          console.error(`[Orchestrator] Error inesperado procesando ${transactionId}:`, err);
          // Enviar a la Dead Letter Queue (DLQ)
          await publishEvent(
            KAFKA_TOPIC_DLQ,
            transactionId,
            userId,
            'txn.ProcessingFailed',
            { error: err.message, originalCommand: command }
          );
        }
      },
    });
  } catch (error) {
    console.error('[Orchestrator] Error fatal al iniciar:', error);
    if (consumer) {
      await consumer.disconnect().catch(console.error);
      consumer = null;
    }
    // También desconectar el producer si falla el inicio
    if (producer) {
      await producer.disconnect().catch(console.error);
      producer = null;
    }
  }
};