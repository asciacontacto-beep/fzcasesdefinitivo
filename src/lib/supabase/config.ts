// La anon key es pública por diseño de Supabase (ya viajaba al navegador en el
// sitio viejo). Si se definen las variables de entorno, tienen prioridad.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ffvswmjaxbvomowmigtr.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdnN3bWpheGJ2b21vd21pZ3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjU3MTEsImV4cCI6MjA4NzY0MTcxMX0.96OTSCQOwg5SfidmxpQ3yNA4Qfy8DEqhgR57CpmMAW8";
