import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  type: { type: String, enum: ['LOST', 'FOUND'], required: true, index: true },
  category: { type: String, required: true, trim: true, index: true },
  brand: { type: String, trim: true },
  color: { type: String, trim: true, index: true },
  location: { type: String, required: true, trim: true, index: true },
  date: { type: Date, required: true, index: true },
  imageUrl: String,
  status: { type: String, enum: ['ACTIVE', 'RESOLVED', 'FLAGGED'], default: 'ACTIVE', index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  aiAttributes: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

itemSchema.index({ title: 'text', description: 'text', brand: 'text', location: 'text' });
export const Item = mongoose.model('Item', itemSchema);
