// GET /api/img?id=<id>&slot=<1|2|3>[&v=<version>]
//
// Devuelve UNA foto, ya decodificada de base64 a bytes reales, con cache larga.
// Dos ahorros acá:
//   1) base64 infla ~33%. Devolverla como imagen binaria de verdad la achica.
//   2) Cache-Control largo: el CDN de Vercel y el navegador se la guardan, así
//      que Supabase sirve cada foto unas pocas veces en total en vez de una vez
//      por visitante por página.
const fs = require('fs');
const path = require('path');
const { rest, isDataUrl } = require('./_supa');

const SLOTS = { 1: 'imagen', 2: 'imagen2', 3: 'imagen3' };

// Si Supabase no contesta, la foto se busca en la copia de /snapshot.
// Devuelve true si logró servirla.
function servirDesdeSnapshot(res, id, slot) {
  try {
    const dir = path.join(process.cwd(), 'snapshot');
    const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
    const file = index[`${id}-${slot}`];
    if (!file) return false;
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
    res.setHeader('X-Fz-Fuente', 'snapshot');
    res.redirect(302, `/snapshot/img/${file}`);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = async (req, res) => {
  const { id, slot = '1' } = req.query || {};
  const col = SLOTS[String(slot)];

  if (!id || !col) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'faltan id/slot válidos' });
  }

  try {
    const rows = await rest(
      `products?select=${col}&id=eq.${encodeURIComponent(id)}&limit=1`
    );
    const value = rows && rows[0] && rows[0][col];

    if (!value) {
      res.setHeader('Cache-Control', 'public, s-maxage=300');
      return res.status(404).json({ error: 'sin imagen' });
    }

    // Si la foto no es base64 sino una ruta/URL, no hay nada que decodificar.
    if (!isDataUrl(value)) {
      res.setHeader('Cache-Control', 'public, s-maxage=86400');
      return res.redirect(302, value);
    }

    const comma = value.indexOf(',');
    const mime = (value.slice(5, comma).split(';')[0]) || 'image/jpeg';
    const buf = Buffer.from(value.slice(comma + 1), 'base64');

    // 1 día en el navegador, 1 año en el CDN. stale-while-revalidate deja que
    // el CDN sirva la foto vieja al instante mientras busca la nueva por atrás.
    // Si se cambia una foto desde el panel y hay que verla ya, el front pide
    // /api/img?...&v=<timestamp> y ese &v distinto cuenta como otra URL.
    res.setHeader('Cache-Control',
      'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800');
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', String(buf.length));
    res.status(200).send(buf);
  } catch (err) {
    if (servirDesdeSnapshot(res, id, slot)) return;
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: String(err && err.message || err) });
  }
};
