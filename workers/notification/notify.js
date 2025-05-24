import Surreal from 'surrealdb.js';
const db = new Surreal('wss://idance.cloud.surrealdb.com');
await db.signin({ token: session.surrealToken });

// On app startup (React Native example)
import { Notifications } from 'react-native-notifications';
Notifications.registerRemoteNotifications();
Notifications.events().registerRemoteNotificationsRegistered((event) => {
  db.query('CREATE device SET user = $userId, token = $token, platform = $platform', {
    userId: auth.id,
    token: event.deviceToken,
    platform: Platform.OS === 'ios' ? 'ios' : 'android'
  });
});

// Web push subscription
if ('serviceWorker' in navigator) {
  const registration = await navigator.serviceWorker.register('/sw.js');
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY
  });
  await db.query('CREATE device SET user = $userId, token = $token, platform = "web"', {
    userId: auth.id,
    token: JSON.stringify(subscription)
  });
}