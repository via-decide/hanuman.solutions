const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STAGES = new Set(['Idea / requirement','Existing prototype','Existing production system','Production failure','Not sure']);
const DOMAINS = new Set(['AI','Embedded / electronics','Industrial software','Automation / robotics','Infrastructure','Production rescue','Other']);
function clean(value, max) { return String(value || '').trim().slice(0, max); }
module.exports = async function intake(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const data = { name: clean(body.name, 100), email: clean(body.email, 254), company: clean(body.company, 160), brief: clean(body.brief, 5000), stage: clean(body.stage, 80), domain: clean(body.domain, 80), deadline: clean(body.deadline, 160), budget: clean(body.budget, 160) };
  if (!data.name || !EMAIL_RE.test(data.email) || data.brief.length < 20 || !STAGES.has(data.stage) || !DOMAINS.has(data.domain)) return res.status(400).json({ error: 'Complete all required fields with a valid project description.' });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Secure intake delivery is temporarily unavailable. Please use the direct email link.' });
  const text = ['HANUMAN PROJECT INTAKE','',`Name: ${data.name}`,`Email: ${data.email}`,`Company: ${data.company || 'Not provided'}`,`Stage: ${data.stage}`,`Domain: ${data.domain}`,`Deadline: ${data.deadline || 'Not provided'}`,`Budget: ${data.budget || 'Not provided'}`,'','Project brief:',data.brief].join('\n');
  try {
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.INTAKE_FROM_EMAIL || 'Hanuman Intake <intake@hanuman.solutions>', to: [process.env.INTAKE_TO_EMAIL || 'dharam@viadecide.com'], reply_to: data.email, subject: `[Hanuman Intake] ${data.domain} — ${data.stage}`, text }) });
    if (!response.ok) throw new Error(`Delivery failed: ${response.status}`);
    return res.status(201).json({ received: true });
  } catch (error) { console.error('[Intake API]', error.message); return res.status(502).json({ error: 'Intake could not be delivered. Please use the direct email link.' }); }
};
