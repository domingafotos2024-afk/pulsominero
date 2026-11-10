// api/_claude.js — Llama a la API de Claude con la clave guardada en Vercel (nunca viaja al navegador).
import { SYSTEM_PROMPT, SCHEMA } from './_prompt.js';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';

export async function explicarNoticia({ title, summary, source, scope, date, link }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { const e = new Error('Falta ANTHROPIC_API_KEY'); e.status = 500; throw e; }
  const userMsg = `Medio: ${source || '—'} (${scope === 'int' ? 'internacional' : 'nacional'})\nFecha: ${date || 'sin fecha'}\nTitular: ${title}\nResumen: ${summary || '(el medio no entregó resumen; usa solo el titular)'}\nEnlace: ${link || '—'}`;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 1200,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [{ name: 'guardar_analisis', description: 'Guarda el análisis estructurado de la noticia minera.', input_schema: SCHEMA }],
      tool_choice: { type: 'tool', name: 'guardar_analisis' },
      messages: [{ role: 'user', content: userMsg }],
    }),
  });
  if (!r.ok) { const d = await r.text().catch(() => ''); const e = new Error(`Claude API ${r.status}: ${d.slice(0, 300)}`); e.status = r.status; throw e; }
  const data = await r.json();
  const block = (data.content || []).find(b => b.type === 'tool_use');
  if (!block) throw new Error('Respuesta inesperada de Claude');
  return block.input;
}
