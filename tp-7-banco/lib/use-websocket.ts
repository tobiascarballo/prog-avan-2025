// lib/use-websocket.ts - es como un walkie talkie que se conecta al gateway y escucha los mensajes
'use client'; // marca el archivo como un "Client Component"

import { useState, useEffect, useRef } from 'react';

export interface EventEnvelope { // interface para el evento
  id: string; // id del evento
  type: string; // tipo del evento
  version: number; // version del evento
  ts: number; // timestamp del evento
  transactionId: string; // id de la transaccion
  userId: string; // id del usuario
  payload: any; // payload del evento
}

// Opciones para nuestro hook
interface UseWebSocketOptions {
  url: string; // url del websocket
  onEvent?: (event: EventEnvelope) => void; // callback para el evento
  userId?: string; // id del usuario
  transactionId?: string; // id de la transaccion
}

export const useWebSocket = ({ // hook para el websocket
  url,
  onEvent,
  userId,
  transactionId,
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false); // estado para la conexion
  const [events, setEvents] = useState<EventEnvelope[]>([]); // estado para los eventos
  const wsRef = useRef<WebSocket | null>(null); // referencia al websocket

  useEffect(() => {
    // Evitar que se ejecute en el servidor (SSR)
    if (typeof window === 'undefined') {
      return;
    }

    // Función para conectar
    const connect = () => {
      // Usamos la URL que filtramos en el backend
      const ws = new WebSocket(url); // crea el websocket
      wsRef.current = ws; // asigna el websocket a la referencia

      ws.onopen = () => {
        console.log('WebSocket connected to', url);
        setIsConnected(true); // asigna true al estado de la conexion
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false); // asigna false al estado de la conexion
        // Intento de reconexión simple
        setTimeout(connect, 3000); // espera 3 segundos y reconecta
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        ws.close(); // cierra el websocket
      };

      ws.onmessage = (message) => {
        try {
          const event: EventEnvelope = JSON.parse(message.data); // parsea el evento
          
          // Filtramos por userId o transactionId si estan
          if (userId && event.userId !== userId) return; // retorna si el id del usuario no coincide
          if (transactionId && event.transactionId !== transactionId) return; // retorna si el id de la transaccion no coincide

          console.log('Received event:', event); // log de evento recibido
          // Acumulamos los eventos en el estado
          setEvents((prevEvents) => [...prevEvents, event]);
          
          // Llamamos al callback si existe
          if (onEvent) {
            onEvent(event); // llama al callback con el evento
          }
        } catch (err) {
          console.error('Failed to parse event message:', message.data, err); // log de error al parsear el evento
        }
      };
    };

    connect(); // conecta el websocket

    // Función de limpieza al desmontar el componente
    return () => {
      if (wsRef.current) {
        wsRef.current.close(); // cierra el websocket
      }
    };
    // Desactivamos la regla de dependencias para controlar la reconexión manualmente
  }, [url]); // Solo reconectar si la URL cambia

  // Función para limpiar el timeline de eventos
  const clearEvents = () => { // funcion para limpiar los eventos 
    setEvents([]); // limpia los eventos
  };

  return { isConnected, events, clearEvents }; // retorna el estado de la conexion, los eventos y la funcion para limpiar los eventos
};