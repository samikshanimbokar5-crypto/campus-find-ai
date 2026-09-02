import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';

export async function listNotifications(req, res) { res.json({ success: true, data: await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50) }); }
export async function readNotification(req, res) {
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true }, { new: true });
  if (!notification) throw new ApiError(404, 'Notification not found.');
  res.json({ success: true, data: notification });
}
