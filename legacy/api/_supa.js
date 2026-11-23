// Config compartida por los endpoints /api/*.
// La anon key ya viaja al navegador en script.js (es pública por diseño de
// Supabase), así que usarla acá no expone nada nuevo. Si algún día se define
// SUPABASE_ANON_KEY en Vercel, esa tiene prioridad.
const SUPABASE_URL = process.env.SUPABASE_URL
  || 'https://ffvswmjaxbvomowmigtr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdnN3bWpheGJ2b21vd21pZ3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjU3MTEsImV4cCI6MjA4NzY0MTcxMX0.96OTSCQOwg5SfidmxpQ3yNA4Qfy8DEqhgR57CpmMAW8';

async function rest(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!r.ok) throw new Error(`supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

// Las fotos se guardan en la DB como data URL base64 ("data:image/jpeg;base64,...").
// Eso es lo que pesa. Las que en cambio son rutas cortas ("assets/x.png" o una
// URL http) no molestan y viajan tal cual.
const isDataUrl = (v) => typeof v === 'string' && v.startsWith('data:');

module.exports = { rest, isDataUrl };
