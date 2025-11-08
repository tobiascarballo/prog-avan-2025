// lib/kafka.ts
import { Kafka, KafkaConfig, logLevel } from 'kafkajs';

// 1. Definimos los nombres de los tópicos
export const KAFKA_TOPIC_COMMANDS = 'txn.commands';
export const KAFKA_TOPIC_EVENTS = 'txn.events';
export const KAFKA_TOPIC_DLQ = 'txn.dlq';

// 2. Configuración de la conexión a Kafka (la que está en Docker)
const kafkaConfig: KafkaConfig = {
    clientId: 'bank-app',
    brokers: ['localhost:9092'],
    logLevel: logLevel.ERROR, // Solo mostrar errores críticos
    retry: {
        initialRetryTime: 300,
        retries: 8,
        multiplier: 2,
        maxRetryTime: 30000,
    },
    requestTimeout: 30000,
    connectionTimeout: 3000,
};

// 3. Implementamos el patrón Singleton para evitar mil conexiones en desarrollo
declare global {
var kafkaInstance: Kafka | undefined;
}

export const getKafkaInstance = () => {
    if (process.env.NODE_ENV === 'production') {
        return new Kafka(kafkaConfig);
    } else {
        if (!global.kafkaInstance) {
            global.kafkaInstance = new Kafka(kafkaConfig);
        }
            return global.kafkaInstance;
    }
};

export const kafka = getKafkaInstance();

// 4. Función para crear los tópicos automáticamente
export const ensureTopicsCreated = async () => {
    const admin = kafka.admin();
    console.log('Connecting Kafka admin...');
    await admin.connect();
    console.log('Kafka admin connected.');
  
    const topics = await admin.listTopics();
    const topicsToCreateConfig = [
    KAFKA_TOPIC_COMMANDS,
    KAFKA_TOPIC_EVENTS,
    KAFKA_TOPIC_DLQ,
]
    .filter((topic) => !topics.includes(topic))
    .map((topic) => ({
        topic: topic,
        numPartitions: 1,
        replicationFactor: 1,
    }));

    if (topicsToCreateConfig.length > 0) {
    console.log('Creating Kafka topics:', topicsToCreateConfig.map(t => t.topic).join(', '));
    await admin.createTopics({
        topics: topicsToCreateConfig,
        waitForLeaders: true,
    });
    console.log('Kafka topics created successfully.');
    } else {
    console.log('All Kafka topics already exist.');
    }

    await admin.disconnect();
};