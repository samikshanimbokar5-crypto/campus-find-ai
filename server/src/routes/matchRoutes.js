import { Router } from 'express';
import { Match } from '../models/Match.js';
import { Item } from '../models/Item.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(async (req, res) => {
  const ownedItems = await Item.find({ owner: req.user.id }).distinct('_id');
  const matches = await Match.find({ $or: [{ lostItem: { $in: ownedItems } }, { foundItem: { $in: ownedItems } }] }).populate('lostItem foundItem');
  res.json({ success: true, data: matches });
}));
router.get('/:id', asyncHandler(async (req, res) => {
  const ownedItems = await Item.find({ owner: req.user.id }).distinct('_id');
  const match = await Match.findOne({ _id: req.params.id, $or: [{ lostItem: { $in: ownedItems } }, { foundItem: { $in: ownedItems } }] }).populate('lostItem foundItem');
  if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
  res.json({ success: true, data: match });
}));
export default router;
