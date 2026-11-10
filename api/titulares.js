// api/titulares.js — Lee todos los medios en el servidor y entrega las noticias al minuto
// (Vercel guarda la respuesta 60 s). Marca las que ya tienen explicación compartida.
import { readAll, SOURCES } from './_feeds.js';
import { idsCompartidos } from './_compartidas.js';

export default async function handler(req, res) {
  try {
    const [{ items: base, ok }, ya] = await Promise.all([readAll(10), idsCompartidos()]);
    const items = base.map(i => ({ ...i, explicada: ya.has(i.id) }));
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ updated_at: new Date().toISOString(), ok, total_sources: SOURCES.length, items });
  } catch {
    return res.status(502).json({ error: 'No se pudieron leer los medios', items: [] });
  }
}
