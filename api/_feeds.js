// api/_feeds.js — Medios mineros y lectura de sus feeds RSS (lo usa /api/titulares).
// Los archivos que empiezan con "_" no se publican como URL en Vercel.
import Parser from 'rss-parser';
import { createHash } from 'node:crypto';

const MIN = 'minería OR minero OR cobre OR litio OR Codelco OR SQM OR Cochilco OR yacimiento OR faena';
const MIN_EN = 'copper OR lithium OR mining OR miner OR "iron ore" OR gold';

// Mantén esta lista igual a SOURCES de index.html (mismos "id").
export const SOURCES = [
  // ---- Nacionales ----
  { id: 'mch',     scope: 'nac', name: 'Minería Chilena',                 site: 'mch.cl',           rss: 'https://www.mch.cl/feed/', query: '',  lang: 'es' },
  { id: 'nuevam',  scope: 'nac', name: 'Revista Nueva Minería y Energía', site: 'nuevamineria.com', rss: '', query: '',  lang: 'es' },
  { id: 'portal',  scope: 'nac', name: 'Portal Minero',                   site: 'portalminero.com', rss: '', query: '',  lang: 'es' },
  { id: 'reporte', scope: 'nac', name: 'Reporte Minero',                  site: 'reporteminero.cl', rss: '', query: '',  lang: 'es' },
  { id: 'emol',    scope: 'nac', name: 'Emol Economía',                   site: 'emol.com',         rss: '', query: MIN, lang: 'es' },
  { id: 'df',      scope: 'nac', name: 'Diario Financiero · Minería',     site: 'df.cl',            rss: '', query: MIN, lang: 'es' },
  // ---- Internacionales ----
  { id: 'miningcom',    scope: 'int', name: 'Mining.com',            site: 'mining.com',       rss: 'https://www.mining.com/feed/', query: '', lang: 'en' },
  { id: 'miningweekly', scope: 'int', name: 'Mining Weekly',         site: 'miningweekly.com', rss: 'https://www.miningweekly.com/page/south-america/feed', query: '', lang: 'en' },
  { id: 'reuters',      scope: 'int', name: 'Reuters · Commodities', site: 'reuters.com',      rss: '', query: MIN_EN, lang: 'en' },
];

const parser = new Parser({ timeout: 6000, headers: { 'User-Agent': 'PulsoMineroBot/1.0 (agregador de noticias mineras)' } });

export const googleNewsUrl = s => {
  const loc = s.lang === 'en' ? 'hl=en-US&gl=US&ceid=US:en' : 'hl=es-419&gl=CL&ceid=CL:es-419';
  return `https://news.google.com/rss/search?q=${encodeURIComponent(`site:${s.site}${s.query ? ` (${s.query})` : ''} when:3d`)}&${loc}`;
};
export const idFor = link => createHash('sha1').update(String(link)).digest('hex').slice(0, 16);

const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const fold = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export async function parseFeed(url) {
  const feed = await parser.parseURL(url);
  return (feed.items || []).map(i => ({ title: i.title || '', link: i.link || '', pubDate: i.isoDate || i.pubDate || '', description: (i.contentSnippet || i.content || '').slice(0, 600) }));
}

// Un medio: su feed directo (sale apenas publica) + Google News filtrado por su dominio. Se juntan y se ordenan.
export async function readSource(s, max = 10) {
  const [direct, google] = await Promise.all([
    s.rss ? parseFeed(s.rss).catch(() => []) : Promise.resolve([]),
    parseFeed(googleNewsUrl(s)).catch(() => []),
  ]);
  const clean = (i, fromGoogle) => {
    let title = strip(i.title);
    if (fromGoogle) title = title.replace(/\s[-–|]\s[^-–|]+$/, '');
    let summary = strip(i.description);
    if (fromGoogle || summary.toLowerCase().startsWith(title.toLowerCase().slice(0, 40))) summary = '';
    return { id: idFor(i.link || title), src: s.id, scope: s.scope, lang: s.lang, title, link: i.link, date: i.pubDate, summary: summary.slice(0, 500) };
  };
  const seen = new Set(), out = [];
  [...direct.map(i => clean(i, false)), ...google.map(i => clean(i, true))]
    .filter(i => i.title && i.link)
    .sort((a, b) => (new Date(b.date) || 0) - (new Date(a.date) || 0))
    .forEach(i => { const k = fold(i.title).slice(0, 70); if (!seen.has(k)) { seen.add(k); out.push(i); } });
  return out.slice(0, max);
}

export async function readAll(max = 10) {
  const results = await Promise.all(SOURCES.map(s => readSource(s, max).catch(() => [])));
  const seen = new Set(), all = [];
  results.flat().sort((a, b) => (new Date(b.date) || 0) - (new Date(a.date) || 0)).forEach(i => {
    const k = fold(i.title).slice(0, 70); if (!seen.has(k)) { seen.add(k); all.push(i); }
  });
  const ok = {}; SOURCES.forEach((s, ix) => { ok[s.id] = results[ix].length > 0; });
  return { items: all, ok };
}
