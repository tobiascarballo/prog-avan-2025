// app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { kafka, KAFKA_TOPIC_COMMANDS } from '@/lib/kafka';
import { randomUUID } from 'crypto'; // Importamos de Node.js para generar IDs únicos

export async function POST(request: Request) {
  // Creamos un productor de Kafka.
  // Para simplicidad, lo creamos y conectamos por cada request.
  const producer = kafka.producer();

  try {
    // 1. Leer los datos del formulario que nos envió el fetch
    const body = await request.json();
    const { userId, fromAccount, toAccount, amount, currency } = body;

    // 2. Validación simple de los datos
    if (!userId || !fromAccount || !toAccount || !amount || !currency) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // 3. Crear el "Comando" (El mensaje para Kafka)
    // Usamos la estructura definida en el PDF [cite: 45-58, 61]
    const transactionId = randomUUID(); // Clave de partición 
    const commandId = randomUUID(); // ID único del evento

    const command = {
      id: commandId,
      type: 'txn.TransactionInitiated', // Tipo de comando [cite: 61]
      version: 1,
      ts: Date.now(),
      transactionId: transactionId,
      userId: userId,
      payload: {
        fromAccount,
        toAccount,
        amount,
        currency,
        userId, // El PDF lo incluye en el payload [cite: 61]
      },
    };

    // 4. Conectar el productor y enviar el mensaje a Kafka
    await producer.connect();
    await producer.send({
      topic: KAFKA_TOPIC_COMMANDS, // Enviamos al tópico de "comandos" [cite: 10]
      messages: [
        {
          // ¡CLAVE! Usamos transactionId como 'key' 
          // Esto asegura que todos los mensajes de esta transacción
          // vayan a la misma partición y se procesen en orden.
          key: transactionId,
          value: JSON.stringify(command),
        },
      ],
    });

    console.log(`Comando ${command.type} publicado para ${transactionId}`);

    // 5. Responder al frontend (al TransactionForm)
    // Enviamos un 202 "Accepted" (Aceptado) porque el procesamiento
    // será asincrónico.
    return NextResponse.json(
      { message: 'Transacción iniciada', transactionId: transactionId },
      { status: 202 }
    );
  } catch (error) {
    console.error('Error al publicar el comando en Kafka:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    // 6. Asegurarnos de desconectar el productor pase lo que pase
    await producer.disconnect();
  }
}