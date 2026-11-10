// api/explicar.js — Botón "Explicar": entrega la explicación de una noticia.
// Si otro visitante ya la pidió, se devuelve la guardada (gratis). Si no, se llama a Claude una vez y se guarda para todos.
import { explicarNoticia } from './_claude.js';
import { leerCompartida, guardarCompartida } from './_compartidas.js';

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST' });
  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed && req.headers.origin && req.headers.origin !== allowed) return res.status(403).json({ error: 'Origen no permitido' });

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const title = clean(body.title, 300), summary = clean(body.summary, 2500), link = clean(body.link, 500);
  if (!title) return res.status(400).json({ error: 'Falta el título' });
  res.setHeader('Cache-Control', 'no-store');

  const guardada = await leerCompartida(link);
  if (guardada) return res.status(200).json({ ...guardada, compartida: true });
  if (body.soloGuardada) return res.status(404).json({ error: 'Aún no explicada' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Falta configurar ANTHROPIC_API_KEY en Vercel' });

  try {
    const data = await explicarNoticia({ title, summary, link, source: clean(body.source, 80), scope: clean(body.scope, 5), date: clean(body.date, 40) });
    await guardarCompartida(link, data);
    return res.status(200).json(data);
  } catch (e) {
    console.error(e.message);
    if (e.status === 429 || e.status === 529) return res.status(429).json({ error: 'Demasiadas solicitudes, intenta en un minuto' });
    return res.status(502).json({ error: 'No se pudo generar la explicación' });
  }
}
function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
