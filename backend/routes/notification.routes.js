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

module.exports = router;
