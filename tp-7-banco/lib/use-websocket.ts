// lib/use-websocket.ts
'use client'; // ¡Importante! Esto marca el archivo como un "Client Component"

import { useState, useEffect, useRef } from 'react';

export interface EventEnvelope {
  id: string;
  type: string;
  version: number;
  ts: number;
  transactionId: string;
  userId: string;
  payload: any;
}

// Opciones para nuestro hook
interface UseWebSocketOptions {
  url: string;
  onEvent?: (event: EventEnvelope) => void;
  userId?: string;
  transactionId?: string;
}

export const useWebSocket = ({
  url,
  onEvent,
  userId,
  transactionId,
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<EventEnvelope[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Evitar que se ejecute en el servidor (SSR)
    if (typeof window === 'undefined') {
      return;
    }

    // Función para conectar
    const connect = () => {
      // Usamos la URL que filtramos en el backend: 'ws://...'
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to', url);
        setIsConnected(true);
        // (En un futuro, aquí podrías enviar un mensaje de "suscripción"
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Intento de reconexión simple
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        ws.close();
      };

      ws.onmessage = (message) => {
        try {
          const event: EventEnvelope = JSON.parse(message.data);
          
          // Filtramos por userId o transactionId si se proveen
          if (userId && event.userId !== userId) return;
          if (transactionId && event.transactionId !== transactionId) return;

          console.log('Received event:', event);
          // Acumulamos los eventos en el estado
          setEvents((prevEvents) => [...prevEvents, event]);
          
          // Llamamos al callback si existe
          if (onEvent) {
            onEvent(event);
          }
        } catch (err) {
          console.error('Failed to parse event message:', message.data, err);
        }
      };
    };

    connect();

    // Función de limpieza al desmontar el componente
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
    // Desactivamos la regla de dependencias para controlar la reconexión manualmente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]); // Solo reconectar si la URL cambia

  // Función para limpiar el timeline de eventos
  const clearEvents = () => {
    setEvents([]);
  };

  return { isConnected, events, clearEvents };
};