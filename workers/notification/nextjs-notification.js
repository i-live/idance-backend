import { useEffect } from 'react';
import Surreal from 'surrealdb.js';

const SURREAL_URL = 'wss://idance.cloud.surrealdb.com';

export function useNotifications(auth) {
  useEffect(() => {
    let db;
    let isConnected = false;

    async function connectWebSocket() {
      try {
        db = new Surreal(SURREAL_URL);
        await db.signin({ token: auth.surrealToken });
        isConnected = true;
        console.log('WebSocket connected');

        // Request notification permission
        if (Notification.permission !== 'granted') {
          await Notification.requestPermission();
        }

        // Subscribe to notifications
        await db.live('notification', async (update) => {
          if (update.action === 'CREATE' && update.data.user === auth.id) {
            const { type } = update.data;
            new Notification('iDance', { body: `New ${type} notification!` });
            // Mark as read
            await db.query('UPDATE notification SET read = true WHERE id = $id', {
              id: update.data.id
            });
          }
        });
      } catch (error) {
        console.error('WebSocket error:', error);
        isConnected = false;
        setTimeout(connectWebSocket, 5000); // Reconnect after 5s
      }
    }

    if (auth.surrealToken) {
      connectWebSocket();
    }

    // Cleanup
    return () => {
      if (isConnected) {
        db.close();
      }
    };
  }, [auth.surrealToken]);
}