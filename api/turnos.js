// GET  /api/turnos?fecha=YYYY-MM-DD&sucursal=Tandil
//   -> horas ya ocupadas ese día (solo horarios, nada de datos personales:
//      es lo único que necesita el calendario público para pintar los slots
//      libres/ocupados).
//
// POST /api/turnos   { nombre, telefono, fecha, hora, motivo, notas, sucursal }
//   -> crea el turno. Corre server-side con la Service Role Key porque la
//      tabla turnos tiene RLS activo (nadie escribe/lee turnos ajenos desde
//      el navegador). Si el horario ya está tomado, devuelve 409.
//
// El agente de n8n / Claude que se instale después lee esta misma tabla
// directo en Supabase (con la Service Role Key, no la anon key) — ver
// sql/turnos.sql para el detalle de columnas y RLS.
const { restService } = require('./_supa');

const HORAS_VALIDAS = /^([01]\d|2[0-3]):(00|30)$/;
const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

function today() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const fecha = String(req.query.fecha || '');
      const sucursal = String(req.query.sucursal || 'Tandil');
      if (!FECHA_VALIDA.test(fecha)) {
        return res.status(400).json({ error: 'fecha inválida (YYYY-MM-DD)' });
      }
      const rows = await restService(
        `turnos?select=hora,estado&fecha=eq.${fecha}&sucursal=eq.${encodeURIComponent(sucursal)}`
        + `&estado=neq.cancelado`
      );
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({ ocupadas: rows.map((r) => r.hora) });
    } catch (err) {
      res.setHeader('Cache-Control', 'no-store');
      res.status(502).json({ error: String(err && err.message || err) });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');
      body = body || {};

      const nombre = String(body.nombre || '').trim();
      const telefono = String(body.telefono || '').trim();
      const fecha = String(body.fecha || '').trim();
      const hora = String(body.hora || '').trim();
      const motivo = String(body.motivo || 'Ver producto en persona').trim();
      const notas = body.notas ? String(body.notas).trim().slice(0, 500) : null;
      const sucursal = String(body.sucursal || 'Tandil').trim();

      if (nombre.length < 2) return res.status(400).json({ error: 'Falta el nombre.' });
      if (telefono.length < 6) return res.status(400).json({ error: 'Falta un teléfono válido.' });
      if (!FECHA_VALIDA.test(fecha)) return res.status(400).json({ error: 'Fecha inválida.' });
      if (!HORAS_VALIDAS.test(hora)) return res.status(400).json({ error: 'Horario inválido.' });
      if (fecha < today()) return res.status(400).json({ error: 'No se puede agendar en el pasado.' });

      let created;
      try {
        created = await restService('turnos', {
          method: 'POST',
          prefer: 'return=representation',
          body: { nombre, telefono, fecha, hora, motivo, notas, sucursal, estado: 'pendiente' },
        });
      } catch (err) {
        // Constraint unique(fecha,hora,sucursal) saltó: alguien tomó el slot antes.
        if (String(err.message || '').includes('23505')) {
          return res.status(409).json({ error: 'Ese horario ya fue reservado. Elegí otro.' });
        }
        throw err;
      }

      res.setHeader('Cache-Control', 'no-store');
      res.status(201).json({ ok: true, turno: Array.isArray(created) ? created[0] : created });
    } catch (err) {
      res.setHeader('Cache-Control', 'no-store');
      res.status(502).json({ error: String(err && err.message || err) });
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method not allowed' });
};
