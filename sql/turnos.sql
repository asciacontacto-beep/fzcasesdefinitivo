-- Tabla de turnos/citas para FZCASES.
-- Ejecutar una sola vez en Supabase: Dashboard -> SQL Editor -> pegar y correr.

create table if not exists public.turnos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  fecha date not null,
  hora text not null,                 -- "10:30" (24hs, texto para evitar líos de timezone)
  nombre text not null,
  telefono text not null,
  motivo text not null default 'Ver producto en persona',
  notas text,
  sucursal text not null default 'Tandil',   -- 'Tandil' | 'Necochea'
  estado text not null default 'pendiente',  -- 'pendiente' | 'confirmado' | 'cancelado' | 'completado'
  unique (fecha, hora, sucursal)
);

create index if not exists turnos_fecha_idx on public.turnos (fecha);

-- RLS activo: nadie puede leer/escribir directo desde el navegador con la anon key.
-- Todo el acceso pasa por /api/turnos.js, que usa la Service Role Key (server-side only).
-- El agente n8n/Claude debe conectarse con la Service Role Key (Supabase REST o el
-- connector nativo de Supabase en n8n), nunca con la anon key.
alter table public.turnos enable row level security;
