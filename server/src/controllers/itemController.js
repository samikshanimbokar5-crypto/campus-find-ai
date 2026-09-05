import { Item } from '../models/Item.js';
import { Match } from '../models/Match.js';
import { ApiError } from '../utils/apiError.js';
import { generateMatches } from '../services/matchingService.js';

export async function createItem(req, res) {
  const { title, description, category, brand, color, location, date, lossReason } = req.body;
  if (!title || !description || !category || !location || !date) throw new ApiError(400, 'Title, description, category, location, and date are required.');
  const type = req.params.type.toUpperCase();
  if (!['LOST', 'FOUND'].includes(type)) throw new ApiError(400, 'Item type must be lost or found.');
  const item = await Item.create({ title, description, category, brand, color, location, date, lossReason: type === 'LOST' && lossReason ? lossReason : undefined, type, owner: req.user.id, imageUrl: req.file ? req.file.filename : undefined });
  await generateMatches(item);
  res.status(201).json({ success: true, data: item });
}

export async function listItems(req, res) {
  const filter = { status: req.query.status || 'ACTIVE' };
  filter.owner = req.user.id;
  if (req.query.type) filter.type = req.query.type.toUpperCase();
  for (const field of ['category', 'color', 'location']) if (req.query[field]) filter[field] = new RegExp(req.query[field], 'i');
  if (req.query.q) filter.$text = { $search: req.query.q };
  const items = await Item.find(filter).select('title type category color location date status createdAt').sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: items });
}

export async function getItem(req, res) {
  const item = await Item.findOne({ _id: req.params.id, owner: req.user.id });
  if (!item) throw new ApiError(404, 'Item not found.');
  res.json({ success: true, data: item });
}

export async function myItems(req, res) { res.json({ success: true, data: await Item.find({ owner: req.user.id }).sort({ createdAt: -1 }) }); }
export async function updateItem(req, res) {
  const item = await Item.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, req.body, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, 'Item not found or you are not the owner.');
  res.json({ success: true, data: item });
}
export async function resolveItem(req, res) {
  const item = await Item.findOneAndUpdate({ _id: req.params.id, owner: req.user.id, status: 'ACTIVE' }, { status: 'RECOVERED', recoveredAt: new Date() }, { new: true });
  if (!item) throw new ApiError(404, 'Item not found or you are not the owner.');
  await Match.updateMany({ $or: [{ lostItem: item._id }, { foundItem: item._id }], status: 'POSSIBLE' }, { status: 'DISMISSED' });
  res.json({ success: true, data: item });
}
export async function recoveryAnalytics(req, res) {
  const [totals, reasons] = await Promise.all([
    Item.aggregate([{ $group: { _id: null, lostReports: { $sum: { $cond: [{ $eq: ['$type', 'LOST'] }, 1, 0] } }, foundReports: { $sum: { $cond: [{ $eq: ['$type', 'FOUND'] }, 1, 0] } }, recovered: { $sum: { $cond: [{ $in: ['$status', ['RECOVERED', 'RESOLVED']] }, 1, 0] } } } }]),
    Item.aggregate([{ $match: { type: 'LOST', lossReason: { $exists: true, $ne: '' } } }, { $group: { _id: '$lossReason', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 5 }])
  ]);
  const labels = { LEFT_BEHIND: 'Left behind', DROPPED: 'Dropped', MISPLACED: 'Misplaced', STOLEN: 'Suspected stolen', OTHER: 'Other' };
  res.json({ success: true, data: { ...(totals[0] || { lostReports: 0, foundReports: 0, recovered: 0 }), lossReasons: reasons.map(({ _id, count }) => ({ reason: labels[_id] || 'Other', count })) } });
}
export async function itemMatches(req, res) {
  const item = await Item.findOne({ _id: req.params.id, owner: req.user.id });
  if (!item) throw new ApiError(404, 'Item not found.');
  const matches = await Match.find(item.type === 'LOST' ? { lostItem: item._id } : { foundItem: item._id }).populate('lostItem foundItem');
  res.json({ success: true, data: matches });
}
