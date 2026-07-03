import api from './api';

// Utility helper to convert URL safe Base64 to Uint8Array for PushManager subscribe
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const registerPushNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('⚠️ Web Push is not supported in this browser.');
    return;
  }

  try {
    // 1. Register Service Worker
    console.log('⚙️ Registering service worker...');
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('✅ Service worker registered:', registration);

    // 2. Check current notification permission
    let permission = Notification.permission;
    if (permission === 'default') {
      console.log('🔔 Requesting notification permission...');
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission not granted:', permission);
      return;
    }

    // 3. Get VAPID public key from backend
    console.log('🔑 Fetching VAPID public key from backend...');
    const { data: keyData } = await api.get('/notifications/vapid-public-key');
    if (!keyData || !keyData.vapidPublicKey) {
      throw new Error('Could not retrieve VAPID public key');
    }

    // 4. Subscribe the user via PushManager
    console.log('📡 Subscribing to Push Service...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.vapidPublicKey)
    });

    console.log('✅ Subscribed to Push Service successfully:', subscription);

    // 5. Send subscription info to backend
    console.log('📤 Registering subscription with backend database...');
    await api.post('/notifications/subscribe', { subscription });
    console.log('🎉 Browser push subscription registered successfully on backend!');

  } catch (err) {
    console.error('❌ Failed to register push notifications:', err.message);
  }
};
