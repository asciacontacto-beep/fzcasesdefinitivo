// Genera una copia estática del catálogo dentro del repo.
//
// Para qué: si Supabase corta el servicio (402 por cuota excedida, o cualquier
// caída), /api/catalog y /api/img sirven esta copia y la tienda se sigue
// pudiendo mirar. Queda desactualizada hasta que se vuelva a correr, pero es
// infinitamente mejor que un catálogo vacío.
//
// Uso:  node scripts/snapshot-catalog.js
// Conviene correrlo cada vez que se cargan productos nuevos.
const fs = require('fs');
const path = require('path');
const { rest, isDataUrl } = require('../api/_supa');

const OUT = path.join(__dirname, '..', 'snapshot');
const LIST_FIELDS = 'id,nombre,categoria,subcategoria,almacenamiento,color,'
  + 'precio_venta,battery,ubicacion,notas,descripcion,imagen,'
  + 'stock,activo,created_at,orden';

const EXT = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
};

function guardarFoto(dataUrl, id, slot) {
  const comma = dataUrl.indexOf(',');
  const mime = (dataUrl.slice(5, comma).split(';')[0]) || 'image/jpeg';
  const ext = EXT[mime] || 'jpg';
  const buf = Buffer.from(dataUrl.slice(comma + 1), 'base64');
  const file = `${id}-${slot}.${ext}`;
  fs.writeFileSync(path.join(OUT, 'img', file), buf);
  return { file, bytes: buf.length };
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'img'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'detail'), { recursive: true });

  // ---- catálogo ----
  const rows = await rest(
    `products?select=${LIST_FIELDS}&order=orden.asc.nullslast,created_at.desc`
  );

  // Índice de id -> nombre de archivo, para que /api/img sepa qué servir sin
  // tener que adivinar la extensión.
  const index = {};
  let totalBytes = 0;

  const catalogo = rows.map((row) => {
    const out = { ...row };
    if (isDataUrl(row.imagen)) {
      const { file, bytes } = guardarFoto(row.imagen, row.id, 1);
      index[`${row.id}-1`] = file;
      totalBytes += bytes;
      out.imagen = null;
      out.has_img = true;
    } else {
      out.has_img = false;
    }
    return out;
  });

  fs.writeFileSync(path.join(OUT, 'catalog.json'), JSON.stringify(catalogo));

  // ---- detalle por producto (fotos 2 y 3 + variantes) ----
  const detalles = await rest('products?select=id,imagen2,imagen3,variantes');
  for (const d of detalles) {
    const out = {
      variantes: d.variantes || null,
      has_img2: isDataUrl(d.imagen2),
      has_img3: isDataUrl(d.imagen3),
      imagen2: isDataUrl(d.imagen2) ? null : (d.imagen2 || null),
      imagen3: isDataUrl(d.imagen3) ? null : (d.imagen3 || null),
    };
    if (isDataUrl(d.imagen2)) {
      const { file, bytes } = guardarFoto(d.imagen2, d.id, 2);
      index[`${d.id}-2`] = file; totalBytes += bytes;
    }
    if (isDataUrl(d.imagen3)) {
      const { file, bytes } = guardarFoto(d.imagen3, d.id, 3);
      index[`${d.id}-3`] = file; totalBytes += bytes;
    }
    fs.writeFileSync(path.join(OUT, 'detail', `${d.id}.json`), JSON.stringify(out));
  }

  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));

  console.log(`snapshot listo en /snapshot`);
  console.log(`  productos:   ${catalogo.length}`);
  console.log(`  detalles:    ${detalles.length}`);
  console.log(`  fotos:       ${Object.keys(index).length} (${(totalBytes / 1048576).toFixed(2)} MB)`);
})().catch((e) => { console.error('ERROR', e); process.exit(1); });
