const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription.model');

// Check if VAPID keys exist
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:hr@forgeindiaconnect.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidEmail,
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✅ Web Push service initialized successfully');
} else {
  console.warn('⚠️ Web Push credentials missing in env. Push notifications will be disabled.');
}

/**
 * Send a web push notification to all active devices of a user
 * @param {string} userId - User ID to send notification to
 * @param {object} payload - Notification payload { title, message, url, type }
 */
const sendPushNotification = async (userId, payload) => {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('⚠️ Web Push service not configured. Skipping push notification.');
    return;
  }

  try {
    const subscriptions = await PushSubscription.find({ userId });
    if (!subscriptions || subscriptions.length === 0) {
      console.log(`ℹ️ No push subscriptions found for user ${userId}`);
      return;
    }

    console.log(`📡 Sending Web Push to ${subscriptions.length} subscription(s) for user ${userId}...`);

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.message,
      icon: '/logo.png', // Fallback relative path on client
      badge: '/logo.png',
      url: payload.url || '/onboarding',
      type: payload.type || 'info'
    });

    const sendPromises = subscriptions.map(async (sub) => {
      // Reconstruct sub format web-push expects
      const subscriptionObj = {
        endpoint: sub.subscription.endpoint,
        keys: {
          p256dh: sub.subscription.keys.p256dh,
          auth: sub.subscription.keys.auth
        }
      };

      try {
        await webpush.sendNotification(subscriptionObj, notificationPayload);
        return { success: true };
      } catch (err) {
        console.error(`❌ Web Push failed for sub endpoint: ${sub.subscription.endpoint}. Error:`, err.message);
        // If subscription is expired or no longer active (410 gone, 404 not found)
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`🗑️ Cleaning up expired push subscription for user ${userId}`);
          await PushSubscription.findByIdAndDelete(sub._id);
        }
        return { success: false, error: err.message };
      }
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error(`❌ sendPushNotification error for user ${userId}:`, err.message);
  }
};

module.exports = {
  sendPushNotification
};
