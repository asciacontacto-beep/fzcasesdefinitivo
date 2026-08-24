// GET /api/catalog
//
// Devuelve los MISMOS datos que antes pedía script.js directo a Supabase, pero
// sin las fotos en base64 adentro. Cada foto pesada se reemplaza por un flag
// (has_img) y el navegador la pide después a /api/img?id=..., que se cachea en
// el CDN de Vercel y por lo tanto NO vuelve a bajar de Supabase.
//
// Por qué existe este archivo: el catálogo en base64 pesaba ~3 MB y se bajaba
// entero en CADA visita a CADA página del sitio -> 13,4 GB de egress y la cuenta
// de Supabase pasada de cuota. Esta respuesta pesa ~35 KB y además queda
// cacheada, así que Supabase la sirve unas pocas veces por hora, no una vez por
// visitante.
const { rest, isDataUrl } = require('./_supa');

// Mismos campos que usaba CATALOG_LIST_FIELDS en script.js.
const LIST_FIELDS = 'id,nombre,categoria,subcategoria,almacenamiento,color,'
  + 'precio_venta,precio_costo,battery,ubicacion,notas,descripcion,imagen,'
  + 'stock,activo,created_at,orden';

module.exports = async (req, res) => {
  try {
    const rows = await rest(
      `products?select=${LIST_FIELDS}`
      + `&order=orden.asc.nullslast,created_at.desc`
    );

    const data = rows.map((row) => {
      const out = { ...row };
      if (isDataUrl(row.imagen)) {
        // La foto no viaja: viaja el aviso de que existe.
        out.imagen = null;
        out.has_img = true;
      } else {
        out.has_img = false;
      }
      return out;
    });

    // s-maxage: el CDN de Vercel guarda esta respuesta 5 min.
    // stale-while-revalidate: si está vencida sirve la vieja al instante y
    // refresca por atrás, así ningún visitante espera y Supabase recibe pocos
    // pedidos aunque entre mucha gente a la vez.
    res.setHeader('Cache-Control',
      'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify(data));
  } catch (err) {
    // Si esto falla, script.js vuelve solo al camino viejo (Supabase directo),
    // así que el sitio sigue funcionando igual.
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: String(err && err.message || err) });
  }
};
