import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const cache = resolve(root, '.cache/generated-copy.json');
const output = resolve(root, 'generated-copy.js');
const readJSON = async file => JSON.parse(await readFile(file, 'utf8'));
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
const limits = { first:12, second:12, accent:6, body:70, personal:32, code:48, thought:40 };
export function validate(data) {
  if (!Array.isArray(data?.notes) || data.notes.length < 8 || data.notes.length > 16) throw new Error('Expected 8–16 notes');
  const seen = new Set();
  for (const note of data.notes) {
    for (const [field, max] of Object.entries(limits)) {
      const value = note[field];
      if (typeof value !== 'string' || !value.trim() || [...value].length > max || /[<>\n\r]|```|手抓饭|bug|昨晚|昨天|今晚/i.test(value)) throw new Error(`Invalid field: ${field}`);
    }
    if ([...note.second + note.accent].length > 12) throw new Error('Second title line too long');
    const signature = note.first + note.second + note.accent;
    if (seen.has(signature)) throw new Error('Duplicate title');
    seen.add(signature);
  }
  return data;
}
const schema = { type:'object', properties:{ notes:{type:'array', items:{type:'object', properties:Object.fromEntries(Object.keys(limits).map(k=>[k,{type:'string'}])), required:Object.keys(limits)}}}, required:['notes'] };
async function main() {
  let previous;
  try { previous = validate(await readJSON(cache)); } catch {}
  let batch;
  if (process.env.GEMINI_API_KEY) {
    try {
      const profile = JSON.parse(process.env.FRED_PROFILE || 'null');
      if (!profile) throw new Error('FRED_PROFILE missing');
      const recent = JSON.parse(process.env.FRED_RECENT || '{"events":[]}');
      if (!Array.isArray(recent.events)) throw new Error('FRED_RECENT events must be an array');
      const active = recent.events.filter(e => e.date <= today() && e.expires >= today());
      const style = await readFile(resolve(root,'content/style.md'),'utf8');
      const prompt = `${style}\n生成 12 套不同的完整短笺。second 不包含 accent，展示时二者相接。\n上海日期：${today()}\n背景：${JSON.stringify(profile)}\n有效近况：${JSON.stringify(active)}\n避开上一批标题：${JSON.stringify(previous?.notes.map(n=>n.first+n.second+n.accent)||[])}`;
      let model = process.env.GEMINI_MODEL;
      if (!model) {
        const available = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          headers: {'x-goog-api-key':process.env.GEMINI_API_KEY}, signal:AbortSignal.timeout(20000)
        });
        if (!available.ok) throw new Error(`Model discovery HTTP ${available.status}`);
        const catalog = await available.json();
        const models = (catalog.models || []).filter(m=>m.supportedGenerationMethods?.includes('generateContent'));
        const preferred = models.find(m=>m.name==='models/gemini-2.5-flash') || models.find(m=>/gemini.*flash/.test(m.name)&& !/image|tts|live|native-audio|exp/.test(m.name));
        if (!preferred) throw new Error('No text Flash model available; configure GEMINI_MODEL');
        model = preferred.name.replace(/^models\//,'');
      }
      console.log(`Generating with model: ${model}`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}], generationConfig:{responseMimeType:'application/json',responseSchema:schema,maxOutputTokens:8192}}),
        signal:AbortSignal.timeout(90000)
      });
      if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.filter(p=>!p.thought).map(p=>p.text||'').join('');
      batch = {notes:validate(JSON.parse(text)).notes.map(note=>Object.fromEntries(Object.keys(limits).map(k=>[k,note[k]])))};
      batch.generatedAt = new Date().toISOString();
      // Expire facts along with the earliest active event; do not extend old copy on failure.
      batch.validUntil = active.length ? active.map(e=>e.expires).sort()[0] : today();
      await mkdir(resolve(root,'.cache'),{recursive:true});
      await writeFile(cache+'.tmp',JSON.stringify(batch));
      await rename(cache+'.tmp',cache);
      console.log(`Generated ${batch.notes.length} Gemini notes.`);
    } catch (error) {
      const safeMessage = error instanceof SyntaxError ? 'Invalid JSON in configuration or response' : (error.name==='TimeoutError' ? 'Request timed out' : error.message);
      console.warn(`::warning::AI generation failed (${safeMessage}); using fallback.`);
    }
  } else console.log('GEMINI_API_KEY not configured; using fallback.');
  batch ||= previous?.validUntil >= today() ? previous : null;
  await writeFile(output, `// Generated at build time. No API credentials.\nwindow.aiCopy = ${JSON.stringify(batch).replaceAll('<','\\u003c')};\n`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
