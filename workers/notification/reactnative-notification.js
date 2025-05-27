import Surreal from 'surrealdb.js';
import notifee from '@notifee/react-native';
import { useEffect } from 'react';

const SURREAL_URL = 'wss://idance.cloud.surrealdb.com';

export function useNotificationService(auth) {
  useEffect(() => {
    let db;
    let isConnected = false;

    async function connectWebSocket() {
      try {
        db = new Surreal(SURREAL_URL);
        await db.signin({ token: auth.surrealToken });
        isConnected = true;
        console.log('WebSocket connected');

        // Subscribe to notifications
        await db.live('notification', async (update) => {
          if (update.action === 'CREATE' && update.data.user === auth.id) {
            const { type } = update.data;
            await displayNotification(type);
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

    async function displayNotification(type) {
      await notifee.requestPermission();
      await notifee.displayNotification({
        title: 'iDance',
        body: `New ${type} notification!`,
        android: { channelId: 'default' },
        ios: { badgeCount: 1 }
      });
    }

    // Initialize Android channel
    notifee.createChannel({
      id: 'default',
      name: 'Default Channel'
    });

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