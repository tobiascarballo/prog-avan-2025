// app/api/transactions/route.ts - es la API que recibe el fetch del formulario, valida los datos y los pone en txn.commands
import { NextResponse } from 'next/server';
import { kafka, KAFKA_TOPIC_COMMANDS } from '@/lib/kafka';
import { randomUUID } from 'crypto'; // Importamos de Node.js para generar IDs únicos

export async function POST(request: Request) {
  // Creamos un productor de Kafka - para mas simple, lo creamos y conectamos por cada request.
  const producer = kafka.producer();

  try {
    // 1. Leer los datos del formulario que nos envió el fetch
    const body = await request.json();
    const { userId, fromAccount, toAccount, amount, currency } = body; // desestructura los datos del body

    // 2. Validación simple de los datos
    if (!userId || !fromAccount || !toAccount || !amount || !currency) { // si falta algun dato, devuelve un error
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' }, // mensaje de error
        { status: 400 } // codigo de error
      ); // devuelve un error
    }

    // 3. Crear el "Comando" (El mensaje para Kafka)
    const transactionId = randomUUID(); // Clave de partición 
    const commandId = randomUUID(); // ID único del evento

    const command = { // crea el comando
      id: commandId,
      type: 'txn.TransactionInitiated', // Tipo de comando
      version: 1,
      ts: Date.now(),
      transactionId: transactionId,
      userId: userId,
      payload: {
        fromAccount,
        toAccount,
        amount,
        currency,
        userId,
      },
    };

    // 4. Conectar el productor y enviar el mensaje a Kafka
    await producer.connect();
    await producer.send({
      topic: KAFKA_TOPIC_COMMANDS,
      messages: [
        {
          // Usamos transactionId como 'key' 
          // Asegura que todos los mensajes de esta transaccion vayan a la misma partición y se procesen en orden.
          key: transactionId,
          value: JSON.stringify(command), // convierte el comando a JSON
        },
      ],
    });

    console.log(`Comando ${command.type} publicado para ${transactionId}`);

    // 5. Responder al frontend (transaction-form)
    // Enviamos un 202 "Accepted"
    return NextResponse.json(
      { message: 'Transacción iniciada', transactionId: transactionId }, // mensaje de exito
      { status: 202 }
    );
  } catch (error) {
    console.error('Error al publicar el comando en Kafka:', error); // log de error
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    // 6. Asegurarnos de desconectar el productor pase lo que pase
    await producer.disconnect();
  }
}