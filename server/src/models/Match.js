import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  lostItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  foundItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  overallScore: { type: Number, min: 0, max: 100, required: true },
  scores: { description: Number, category: Number, color: Number, location: Number, date: Number, image: Number },
  explanation: { type: [String], default: [] },
  status: { type: String, enum: ['POSSIBLE', 'DISMISSED', 'CONFIRMED'], default: 'POSSIBLE' }
}, { timestamps: true });
matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });
export const Match = mongoose.model('Match', matchSchema);
