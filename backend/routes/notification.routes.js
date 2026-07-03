const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Notification = require('../models/Notification.model');

// Protect all notification routes
router.use(protect);

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role ? req.user.role.toLowerCase() : '';

    // Fetch notifications matching either:
    // 1. targeted to this specific user (userId matches)
    // 2. targeted to their role (role matches)
    // 3. targeted to everyone (role is 'all' or no role/userId specified)
    const notifications = await Notification.find({
      $or: [
        { userId },
        { role },
        { role: 'all' },
        { userId: { $exists: false }, role: { $exists: false } }
      ]
    })
    .sort('-createdAt')
    .limit(100);

    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/:id/read - mark one as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/read-all - mark all as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role ? req.user.role.toLowerCase() : '';

    await Notification.updateMany(
      {
        $or: [
          { userId },
          { role },
          { role: 'all' },
          { userId: { $exists: false }, role: { $exists: false } }
        ],
        isRead: false
      },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PushSubscription = require('../models/PushSubscription.model');
const { sendNotification } = require('../utils/socket');

// GET /api/notifications/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(404).json({ success: false, message: 'VAPID public key not configured' });
  }
  res.json({ success: true, vapidPublicKey: key });
});

// POST /api/notifications/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, message: 'Invalid subscription payload' });
    }

    // Check if subscription already exists for this user and endpoint
    let sub = await PushSubscription.findOne({
      userId: req.user.id,
      'subscription.endpoint': subscription.endpoint
    });

    if (sub) {
      sub.subscription.keys = subscription.keys;
      await sub.save();
    } else {
      sub = await PushSubscription.create({
        userId: req.user.id,
        subscription
      });
    }

    res.status(201).json({ success: true, message: 'Subscribed to push notifications successfully', data: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications/test-trigger
router.post('/test-trigger', async (req, res) => {
  try {
    const { type } = req.body;
    const user = req.user;

    let title = 'General Alert';
    let message = 'This is a test notification from your Employee Portal.';

    switch (type) {
      case 'email':
        title = 'New Email: Meeting Summary: Status Call';
        message = 'From: Forge India Connect AI';
        break;
      case 'meeting':
        title = 'Meeting Summary: Sync Session';
        message = 'The summary for today\'s sync session is now available. Click to review.';
        break;
      case 'invite':
        title = 'Employee Invitation Sent';
        message = `An invitation was successfully sent to Rahul Sharma (rahul@forgeindiaconnect.com).`;
        break;
      case 'registration':
        title = 'Registration Completed';
        message = `${user.name} has completed their account registration successfully.`;
        break;
      case 'approval':
        title = 'Profile Approved';
        message = 'Your onboarding profile has been approved successfully.';
        break;
      case 'rejection':
        title = 'Profile Rejected';
        message = 'Your onboarding profile requires changes. Reason: Aadhaar card image is blurred.';
        break;
      case 'alert':
        title = 'HR Alert: Document Submission Deadline';
        message = 'Please submit your pending bank documents by tomorrow end of day.';
        break;
      default:
        title = 'Test Notification';
        message = 'This is a push notification from Forge India Connect.';
    }

    const notification = await sendNotification({
      title,
      message,
      type: type || 'alert',
      userId: user.id
    });

    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
