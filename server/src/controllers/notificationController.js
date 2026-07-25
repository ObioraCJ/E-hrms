const Notification = require('../models/Notification');
const User = require('../models/User');
const { createNotificationForMany } = require('../utils/createNotification');

// ---- MY NOTIFICATIONS ----
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- MARK ONE AS READ ----
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id, // ensures you can only mark YOUR OWN notifications
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: 'Marked as read', notification });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- MARK ALL AS READ ----
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- BROADCAST ANNOUNCEMENT (HR/admin) ----
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    // Broadcasts to every active user - active check matters since
    // there's no point notifying someone who can't even log in.
    const users = await User.find({ isActive: true }).select('_id');
    const recipientIds = users.map((u) => u._id);

    await createNotificationForMany({
      recipients: recipientIds,
      type: 'announcement',
      title,
      message,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: `Announcement sent to ${recipientIds.length} user(s)` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};