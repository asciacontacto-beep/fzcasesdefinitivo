// GET /api/detail?id=<id>
//
// Lo que hace falta recién cuando alguien abre el modal de un producto: fotos 2
// y 3 y las variantes (cada variante tiene su propia foto). Igual que en
// /api/catalog, las fotos pesadas no viajan acá: viaja el flag y el navegador
// las pide a /api/img, que sí queda cacheado.
const { rest, isDataUrl } = require('./_supa');

module.exports = async (req, res) => {
  const { id } = req.query || {};
  if (!id) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'falta id' });
  }

  try {
    const rows = await rest(
      `products?select=imagen2,imagen3,variantes`
      + `&id=eq.${encodeURIComponent(id)}&limit=1`
    );
    const row = (rows && rows[0]) || {};

    const out = {
      // Las variantes son livianas salvo por su foto; se dejan tal cual porque
      // esta respuesta ya queda cacheada por producto.
      variantes: row.variantes || null,
      has_img2: isDataUrl(row.imagen2),
      has_img3: isDataUrl(row.imagen3),
      // Si no eran base64 sino rutas cortas, se mandan como están.
      imagen2: isDataUrl(row.imagen2) ? null : (row.imagen2 || null),
      imagen3: isDataUrl(row.imagen3) ? null : (row.imagen3 || null),
    };

    res.setHeader('Cache-Control',
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify(out));
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: String(err && err.message || err) });
  }
};
