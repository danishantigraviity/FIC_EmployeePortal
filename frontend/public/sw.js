/*
 * Service Worker for Web Push Notifications
 */

self.addEventListener('push', (event) => {
  console.log('📡 Service Worker received push event');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.warn('⚠️ Push data payload was not JSON:', event.data.text());
      data = {
        title: 'New Notification',
        body: event.data.text()
      };
    }
  }

  const title = data.title || 'Forge India Connect';
  const options = {
    body: data.body || 'You have a new update.',
    icon: data.icon || '/logo.png', // Fallback to logo on server
    badge: data.badge || '/logo.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/onboarding'
    },
    actions: [
      { action: 'open', title: 'Open Portal' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification click received');
  event.notification.close();

  // Retrieve the target URL from notification data
  const targetUrl = event.notification.data ? event.notification.data.url : '/onboarding';

  // Determine if client window is already open
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window tab open with our site
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate to the target url if not already there, and focus
          if (client.url !== targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no window is open, open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
