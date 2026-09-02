import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['MATCH', 'SYSTEM'], default: 'SYSTEM' },
  relatedItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  relatedMatch: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
  read: { type: Boolean, default: false }
}, { timestamps: true });
export const Notification = mongoose.model('Notification', notificationSchema);
