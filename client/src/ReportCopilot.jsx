import React, { useState } from 'react';
import { BrainCircuit, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { api } from './api.js';

export default function ReportCopilot() {
  const params = new URLSearchParams(location.search);
  const [type, setType] = useState(params.get('type') || 'lost');
  const [form, setForm] = useState({ title: '', description: '', category: '', brand: '', color: '', location: '', date: new Date().toISOString().slice(0, 10), lossReason: '' });
  const [aiAttributes, setAiAttributes] = useState(null);
  const [status, setStatus] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const fieldCount = [form.title, form.description, form.category, form.brand, form.color, form.location].filter(Boolean).length;
  const update = event => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setAnalyzing(true);
    setStatus('');
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      const { data } = await api.post(`/items/${type}`, payload);
      setAiAttributes(data.data.aiAttributes || null);
      setStatus('AI scan complete. Your report is now being compared with private campus reports.');
    } catch (error) {
      setStatus(error.response?.data?.message || 'Unable to submit report.');
    } finally {
      setAnalyzing(false);
    }
  }

  return <main className="form-page"><div className="page-intro"><p className="eyebrow"><BrainCircuit size={16}/> AI-assisted report</p><h1>Describe it.<br/><span>Let AI connect it.</span></h1><p className="lede">The copilot extracts identifying signals from your report, then compares them with private reports using explainable similarity scoring.</p><section className="ai-copilot"><div className="ai-copilot-head"><div><span className="ai-pulse"><Sparkles size={15}/></span><strong>AI Match Copilot</strong></div><span>{fieldCount}/6 signals ready</span></div><div className="ai-meter"><span style={{ width: `${Math.round(fieldCount / 6 * 100)}%` }}/></div><p>{fieldCount < 3 ? 'Add more details to improve the quality of the match.' : 'Strong report signal. AI can compare this against differently worded reports.'}</p>{aiAttributes && <div className="ai-result"><span className="eyebrow"><CheckCircle2 size={13}/> AI extracted</span><strong>{aiAttributes.semanticDescription || 'Identifying details analyzed'}</strong><small>{[aiAttributes.normalizedCategory, aiAttributes.normalizedColor, aiAttributes.normalizedLocation].filter(Boolean).join(' · ')}</small></div>}</section></div><form className="report-form" onSubmit={submit}><div className="segmented"><button type="button" className={type === 'lost' ? 'active' : ''} onClick={() => setType('lost')}>I lost something</button><button type="button" className={type === 'found' ? 'active' : ''} onClick={() => setType('found')}>I found something</button></div><div className="field-grid"><label>Item<input required name="title" value={form.title} onChange={update} placeholder="e.g. silver water bottle" /></label><label>Category<select required name="category" value={form.category} onChange={update}><option value="">Choose one</option><option value="ELECTRONICS">Electronics</option><option value="CLOTHING">Clothing</option><option value="BAG">Bag</option><option value="DOCUMENT">Document</option><option value="OTHER">Other</option></select></label><label>Description<textarea required name="description" value={form.description} onChange={update} placeholder="What makes this item identifiable?" /></label><label>Brand<input name="brand" value={form.brand} onChange={update} placeholder="Optional" /></label><label>Color<input name="color" value={form.color} onChange={update} placeholder="e.g. navy blue" /></label><label>Last known location<input required name="location" value={form.location} onChange={update} placeholder="e.g. North Library" /></label><label>Date<input required type="date" name="date" value={form.date} onChange={update} /></label>{type === 'lost' && <label>What happened?<select name="lossReason" value={form.lossReason} onChange={update}><option value="">Choose one</option><option value="LEFT_BEHIND">Left behind</option><option value="DROPPED">Dropped</option><option value="MISPLACED">Misplaced</option><option value="OTHER">Other</option></select></label>}</div>{status && <p className="form-status">{status}</p>}<button className="button" type="submit" disabled={analyzing}>{analyzing ? <><BrainCircuit size={17}/> AI is analyzing...</> : <>Run AI match scan <ChevronRight size={17}/></>}</button></form></main>;
}
