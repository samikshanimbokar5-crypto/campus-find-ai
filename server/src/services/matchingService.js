import { Item } from '../models/Item.js';
import { Match } from '../models/Match.js';
import { Notification } from '../models/Notification.js';

const weights = { description: 0.35, category: 0.2, color: 0.15, location: 0.15, date: 0.15 };
const words = (value = '') => new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 2));
const overlap = (a, b) => { const left = words(a); const right = words(b); if (!left.size || !right.size) return 0; return [...left].filter(word => right.has(word)).length / Math.max(left.size, right.size); };
const exact = (a, b) => a && b && a.toLowerCase() === b.toLowerCase() ? 1 : overlap(a, b);
const dateScore = (a, b) => Math.max(0, 1 - Math.abs(new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24 * 30));
const aiText = attributes => [attributes?.semanticDescription, ...(attributes?.keywords || [])].filter(Boolean).join(' ');

async function enrichWithGemini(item) {
  if (!process.env.AI_API_KEY) return item;

  const model = process.env.AI_MODEL || 'gemini-2.0-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.AI_API_KEY)}`;
  const prompt = `Analyze this campus lost-and-found report. Return JSON only with these keys: normalizedCategory, normalizedColor, normalizedLocation, keywords (array of short strings), semanticDescription (one short sentence). Do not invent details. Report: ${JSON.stringify({ title: item.title, description: item.description, category: item.category, brand: item.brand, color: item.color, location: item.location })}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
  });
  if (!response.ok) throw new Error(`Gemini request failed with ${response.status}`);
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini returned no analysis');
  const json = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  const attributes = JSON.parse(json);
  const safeAttributes = {
    normalizedCategory: String(attributes.normalizedCategory || '').slice(0, 120),
    normalizedColor: String(attributes.normalizedColor || '').slice(0, 80),
    normalizedLocation: String(attributes.normalizedLocation || '').slice(0, 160),
    keywords: Array.isArray(attributes.keywords) ? attributes.keywords.filter(Boolean).map(String).slice(0, 20) : [],
    semanticDescription: String(attributes.semanticDescription || '').slice(0, 500)
  };
  item.aiAttributes = safeAttributes;
  await Item.findByIdAndUpdate(item._id, { aiAttributes: safeAttributes });
  return item;
}

function scorePair(item, candidate) {
  const itemAi = item.aiAttributes || {};
  const candidateAi = candidate.aiAttributes || {};
  const scores = {
    description: overlap(`${item.title} ${item.description} ${item.brand} ${aiText(itemAi)}`, `${candidate.title} ${candidate.description} ${candidate.brand} ${aiText(candidateAi)}`),
    category: exact(itemAi.normalizedCategory || item.category, candidateAi.normalizedCategory || candidate.category),
    color: exact(itemAi.normalizedColor || item.color, candidateAi.normalizedColor || candidate.color),
    location: overlap(itemAi.normalizedLocation || item.location, candidateAi.normalizedLocation || candidate.location),
    date: dateScore(item.date, candidate.date)
  };
  const overallScore = Math.round(Object.entries(weights).reduce((total, [key, weight]) => total + scores[key] * weight, 0) * 100);
  const explanation = Object.entries(scores).filter(([, value]) => value >= 0.55).map(([key]) => ({ description: itemAi.semanticDescription || candidateAi.semanticDescription ? 'AI found similar identifying details' : 'similar identifying details', category: 'same category', color: 'similar color', location: 'nearby location', date: 'close report dates' })[key]);
  return { overallScore, scores: Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, Math.round(value * 100)])), explanation };
}

export async function generateMatches(item) {
  if (process.env.AI_API_KEY) {
    try { await enrichWithGemini(item); } catch (error) { console.error('AI enrichment failed; using baseline matching:', error.message); }
  }
  const candidates = await Item.find({ type: item.type === 'LOST' ? 'FOUND' : 'LOST', status: 'ACTIVE', _id: { $ne: item._id } }).limit(100);
  for (const candidate of candidates) {
    const lostItem = item.type === 'LOST' ? item : candidate;
    const foundItem = item.type === 'FOUND' ? item : candidate;
    const result = scorePair(item, candidate);
    if (result.overallScore < 35) continue;
    const match = await Match.findOneAndUpdate({ lostItem: lostItem._id, foundItem: foundItem._id }, { ...result }, { upsert: true, new: true, setDefaultsOnInsert: true });
    if (result.overallScore >= 60) {
      const recipients = [
        { user: lostItem.owner, item: lostItem, message: 'A found-item report may match your lost item. Review the private match in-app.' },
        { user: foundItem.owner, item: foundItem, message: 'A lost-item report may match the item you found. Review the private match in-app.' }
      ];
      for (const recipient of recipients) {
        if (!await Notification.exists({ user: recipient.user, relatedMatch: match._id, type: 'MATCH' })) {
          await Notification.create({ user: recipient.user, title: 'Possible match found', message: recipient.message, type: 'MATCH', relatedItem: recipient.item._id, relatedMatch: match._id });
        }
      }
    }
  }
}

export { scorePair };
