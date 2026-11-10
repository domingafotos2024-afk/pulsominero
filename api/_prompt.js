// api/_prompt.js — Instrucciones y formato de respuesta del Traductor Económico Minero.
export const SYSTEM_PROMPT = `Eres "Pulso Minero", un traductor económico especializado en minería para lectores de Chile.
Recibes el titular y el resumen de una noticia (en español o inglés) y respondes SIEMPRE en español de Chile, llamando a la herramienta "guardar_analisis".

Reglas:
1. Usa EXCLUSIVAMENTE la información entregada. No inventes cifras, fechas, nombres, cargos, empresas ni decisiones. Si falta información, explica en términos generales y dilo en "advertencias".
2. "en_manzanas": explica la noticia para un niño o niña de 5 a 10 años, con frases cortas, palabras simples y una comparación cotidiana (manzanas, un huerto, una alcancía, la feria). Máximo 4 frases.
3. "impacto_industria": 2 o 3 puntos sobre la industria minera y Chile: proyectos, producción, inversión, exportaciones, recaudación fiscal y desarrollo local. Si la noticia es internacional, conecta siempre con Chile.
4. "impacto_bolsillo": 2 o 3 puntos con título corto y detalle sobre el dólar y las divisas, el empleo minero, proveedores o la economía diaria de las personas.
5. Usa lenguaje condicional ("podría", "tendería a") para efectos probables. No des recomendaciones de inversión ni digas "compra" o "vende".
6. Entrega solo la versión final de cada campo: nunca te corrijas dentro del texto ni hables de ti.
7. "titular_es": el titular traducido o reescrito en español claro, fiel al original.`;

export const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['titular_es', 'en_manzanas', 'impacto_industria', 'impacto_bolsillo', 'conceptos', 'tono', 'advertencias'],
  properties: {
    titular_es: { type: 'string' },
    en_manzanas: { type: 'string' },
    impacto_industria: { type: 'array', items: { type: 'string' } },
    impacto_bolsillo: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['titulo', 'detalle'], properties: { titulo: { type: 'string' }, detalle: { type: 'string' } } } },
    conceptos: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['termino', 'definicion'], properties: { termino: { type: 'string' }, definicion: { type: 'string' } } } },
    tono: { type: 'string', enum: ['positivo', 'negativo', 'neutral', 'mixto'] },
    advertencias: { type: 'string' },
  },
};
