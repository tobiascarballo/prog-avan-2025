// lib/kafka.ts - es el conector que maneja kafka y los 3 topics (commands, events, dlq)
import { Kafka, KafkaConfig, logLevel } from 'kafkajs';

// 1. Definimos los nombres de los tópicos
export const KAFKA_TOPIC_COMMANDS = 'txn.commands';
export const KAFKA_TOPIC_EVENTS = 'txn.events';
export const KAFKA_TOPIC_DLQ = 'txn.dlq';

// 2. Configuración de la conexión a Kafka (la que está en Docker)
const kafkaConfig: KafkaConfig = {
    clientId: 'bank-app', // id del cliente
    brokers: ['localhost:9092'], // brokers de kafka
    logLevel: logLevel.ERROR, // Solo mostrar errores críticos
    retry: {
        initialRetryTime: 300, // tiempo de espera inicial
        retries: 8, // numero de reintentos
        multiplier: 2,
        maxRetryTime: 30000, // tiempo maximo de reintento
    },
    requestTimeout: 30000, // tiempo maximo de espera para la solicitud
    connectionTimeout: 3000, // tiempo maximo de espera para la conexion
};

// 3. Usamos el patrón Singleton para evitar muchas conexiones en desarrollo
declare global {
var kafkaInstance: Kafka | undefined; // instancia de kafka
}
// función getKafkaInstance que sirve para obtener la instancia de kafka
export const getKafkaInstance = () => {
    if (process.env.NODE_ENV === 'production') {
        return new Kafka(kafkaConfig); // si es produccion, crea una nueva instancia de kafka
    } else {
        if (!global.kafkaInstance) { // si no es produccion, crea una nueva instancia de kafka
            global.kafkaInstance = new Kafka(kafkaConfig);
        }
            return global.kafkaInstance; // retorna la instancia de kafka
    }
};

export const kafka = getKafkaInstance(); // instancia de kafka

// 4. Funcion para crear los topics automaticamente
export const ensureTopicsCreated = async () => {
    const admin = kafka.admin(); // admin de kafka
    console.log('Connecting Kafka admin...'); // log de conexion
    await admin.connect(); // conecta al admin de kafka
    console.log('Kafka admin connected.'); // log de conexion

    const topics = await admin.listTopics(); // lista los topics de kafka
    const topicsToCreateConfig = [
    KAFKA_TOPIC_COMMANDS,
    KAFKA_TOPIC_EVENTS,
    KAFKA_TOPIC_DLQ,
]
    .filter((topic) => !topics.includes(topic)) // filtra los topics que ya existen
    .map((topic) => ({
        topic: topic, // topic a crear
        numPartitions: 1, // numero de particiones
        replicationFactor: 1, // factor de replicacion
    })); // crea los topics

    if (topicsToCreateConfig.length > 0) {
    console.log('Creating Kafka topics:', topicsToCreateConfig.map(t => t.topic).join(', ')); // log de creacion de topics
    await admin.createTopics({ // crea los topics
        topics: topicsToCreateConfig, // topics a crear
        waitForLeaders: true, // espera a que los leaders esten disponibles
    }); // crea los topics
    console.log('Kafka topics created successfully.'); // log de creacion de topics
    } else {
    console.log('All Kafka topics already exist.'); // log de topics ya existentes
    }

    await admin.disconnect(); // desconecta al admin de kafka
};