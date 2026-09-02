import { Item } from '../models/Item.js';
import { Match } from '../models/Match.js';
import { Notification } from '../models/Notification.js';

const weights = { description: 0.35, category: 0.2, color: 0.15, location: 0.15, date: 0.15 };
const words = (value = '') => new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 2));
const overlap = (a, b) => { const left = words(a); const right = words(b); if (!left.size || !right.size) return 0; return [...left].filter(word => right.has(word)).length / Math.max(left.size, right.size); };
const exact = (a, b) => a && b && a.toLowerCase() === b.toLowerCase() ? 1 : overlap(a, b);
const dateScore = (a, b) => Math.max(0, 1 - Math.abs(new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24 * 30));

function scorePair(item, candidate) {
  const scores = {
    description: overlap(`${item.title} ${item.description} ${item.brand}`, `${candidate.title} ${candidate.description} ${candidate.brand}`),
    category: exact(item.category, candidate.category), color: exact(item.color, candidate.color),
    location: overlap(item.location, candidate.location), date: dateScore(item.date, candidate.date)
  };
  const overallScore = Math.round(Object.entries(weights).reduce((total, [key, weight]) => total + scores[key] * weight, 0) * 100);
  const explanation = Object.entries(scores).filter(([, value]) => value >= 0.55).map(([key]) => ({ description: 'similar identifying details', category: 'same category', color: 'similar color', location: 'nearby location', date: 'close report dates' })[key]);
  return { overallScore, scores: Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, Math.round(value * 100)])), explanation };
}

export async function generateMatches(item) {
  const candidates = await Item.find({ type: item.type === 'LOST' ? 'FOUND' : 'LOST', status: 'ACTIVE', _id: { $ne: item._id } }).limit(100);
  for (const candidate of candidates) {
    const lostItem = item.type === 'LOST' ? item : candidate;
    const foundItem = item.type === 'FOUND' ? item : candidate;
    const result = scorePair(item, candidate);
    if (result.overallScore < 35) continue;
    const match = await Match.findOneAndUpdate({ lostItem: lostItem._id, foundItem: foundItem._id }, { ...result }, { upsert: true, new: true, setDefaultsOnInsert: true });
    if (result.overallScore >= 60) {
      await Notification.create({ user: lostItem.owner, title: 'Possible match found', message: 'A report closely matches your item. Review it before contacting the other reporter.', type: 'MATCH', relatedItem: lostItem._id, relatedMatch: match._id });
    }
  }
}

export { scorePair };
