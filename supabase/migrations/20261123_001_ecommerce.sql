-- =============================================================================
-- FZCASES · Migración 001: tienda online + settings propios
-- =============================================================================
-- Es ADITIVA: no borra ni renombra nada que use el sitio viejo. El sitio
-- actual (legacy/) sigue funcionando igual después de correrla.
--
-- Cómo correrla: Supabase Dashboard → SQL Editor → pegar todo → Run.
-- Se puede correr más de una vez sin romper nada (todo es "if not exists").
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Productos: flags que antes vivían como texto dentro de "notas"
-- -----------------------------------------------------------------------------
alter table public.products add column if not exists destacado      boolean not null default false;
alter table public.products add column if not exists nuevo_ingreso  boolean not null default false;
alter table public.products add column if not exists venta_online   boolean not null default false;
alter table public.products add column if not exists updated_at     timestamptz not null default now();

-- Pasar [DESTACADO] / [NUEVO] de las notas a columnas reales.
-- (No se borran de las notas: el sitio viejo todavía las lee de ahí.)
update public.products set destacado = true     where notas like '%[DESTACADO]%' and destacado = false;
update public.products set nuevo_ingreso = true where notas like '%[NUEVO]%'     and nuevo_ingreso = false;

-- Los accesorios se pueden comprar online desde el día uno.
update public.products set venta_online = true where categoria = 'Accesorios' and venta_online = false;

-- -----------------------------------------------------------------------------
-- 2. Settings: reemplaza los "productos fantasma" __CONFIG_SETTINGS__ / __SYSTEM_HERO__
-- -----------------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

drop policy if exists "settings: lectura pública" on public.settings;
create policy "settings: lectura pública" on public.settings
  for select using (true);

drop policy if exists "settings: admin escribe" on public.settings;
create policy "settings: admin escribe" on public.settings
  for all to authenticated using (true) with check (true);

-- Copiar la config actual (si existe) como punto de partida.
insert into public.settings (key, value)
select 'site', coalesce(nullif(notas, '')::jsonb, '{}'::jsonb)
from public.products
where nombre = '__CONFIG_SETTINGS__'
order by id
limit 1
on conflict (key) do nothing;

insert into public.settings (key, value) values ('site', '{}'::jsonb)
on conflict (key) do nothing;

-- Config de la tienda online (cotización, envíos, pagos).
insert into public.settings (key, value) values ('shop', jsonb_build_object(
  'usdRate',           1200,
  'whatsapp',          '5492494521518',
  'mercadoPagoEnabled', true,
  'whatsappCheckoutEnabled', true,
  'deliveryOptions', jsonb_build_array(
    jsonb_build_object('id', 'retiro_tandil',   'label', 'Retiro en Tandil',   'priceArs', 0, 'needsAddress', false),
    jsonb_build_object('id', 'retiro_necochea', 'label', 'Retiro en Necochea', 'priceArs', 0, 'needsAddress', false),
    jsonb_build_object('id', 'envio',           'label', 'Envío a domicilio',  'priceArs', 0, 'needsAddress', true,
                       'note', 'Costo de envío a coordinar por WhatsApp')
  )
))
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- 3. Pedidos online
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  numero           bigint generated always as identity unique,
  estado           text not null default 'pendiente'
                   check (estado in ('pendiente','pagado','preparando','listo','entregado','cancelado')),
  metodo_pago      text not null check (metodo_pago in ('mercadopago','whatsapp')),
  pago_estado      text not null default 'pendiente'
                   check (pago_estado in ('pendiente','aprobado','rechazado','reembolsado','a_coordinar')),
  mp_preference_id text,
  mp_payment_id    text,
  cliente_nombre   text not null,
  cliente_email    text,
  cliente_telefono text not null,
  cliente_dni      text,
  entrega          text not null,
  direccion        jsonb,
  notas            text,
  subtotal_usd     numeric(12,2) not null,
  cotizacion       numeric(12,2) not null,
  envio_ars        numeric(12,2) not null default 0,
  total_ars        numeric(14,2) not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.order_items (
  id             bigint generated always as identity primary key,
  order_id       uuid not null references public.orders(id) on delete cascade,
  producto_id    bigint references public.products(id) on delete set null,
  nombre         text not null,
  color          text,
  imagen         text,
  cantidad       int not null check (cantidad > 0),
  precio_usd     numeric(12,2) not null
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_estado_idx     on public.orders (estado);
create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Los clientes NO leen ni escriben pedidos directo: el servidor (service role)
-- los crea en /api/checkout. Solo el panel (usuario logueado) los ve y edita.
drop policy if exists "orders: admin" on public.orders;
create policy "orders: admin" on public.orders
  for all to authenticated using (true) with check (true);

drop policy if exists "order_items: admin" on public.order_items;
create policy "order_items: admin" on public.order_items
  for all to authenticated using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 4. Confirmar pago: descuenta stock y registra la venta. Idempotente.
-- -----------------------------------------------------------------------------
-- La llama el webhook de Mercado Pago (o el admin al marcar "pagado" un pedido
-- por WhatsApp). Si el pedido ya estaba pagado no hace nada, así un webhook
-- repetido no descuenta stock dos veces.
create or replace function public.confirmar_pago_pedido(p_order uuid, p_payment_id text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item  record;
begin
  select * into v_order from public.orders where id = p_order for update;
  if not found then
    raise exception 'pedido % no existe', p_order;
  end if;

  if v_order.pago_estado = 'aprobado' then
    return false; -- ya procesado
  end if;

  update public.orders
     set pago_estado   = 'aprobado',
         estado        = case when estado = 'pendiente' then 'pagado' else estado end,
         mp_payment_id = coalesce(p_payment_id, mp_payment_id),
         updated_at    = now()
   where id = p_order;

  for v_item in
    select oi.*, p.precio_costo
      from public.order_items oi
      left join public.products p on p.id = oi.producto_id
     where oi.order_id = p_order
  loop
    if v_item.producto_id is not null then
      update public.products
         set stock = greatest(coalesce(stock, 0) - v_item.cantidad, 0),
             updated_at = now()
       where id = v_item.producto_id;
    end if;

    insert into public.sales (producto_id, producto_nombre, cantidad, precio_final, precio_costo, cliente, metodo_pago, fecha)
    values (v_item.producto_id, v_item.nombre, v_item.cantidad, v_item.precio_usd,
            coalesce(v_item.precio_costo, 0), v_order.cliente_nombre,
            case v_order.metodo_pago when 'mercadopago' then 'Mercado Pago (web)' else 'Web / WhatsApp' end,
            now());
  end loop;

  return true;
end;
$$;

revoke all on function public.confirmar_pago_pedido(uuid, text) from public, anon;
grant execute on function public.confirmar_pago_pedido(uuid, text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 5. Storage para fotos (reemplaza las fotos en base64 dentro de la tabla)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media: lectura pública" on storage.objects;
create policy "media: lectura pública" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media: admin sube" on storage.objects;
create policy "media: admin sube" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');

drop policy if exists "media: admin edita" on storage.objects;
create policy "media: admin edita" on storage.objects
  for update to authenticated using (bucket_id = 'media');

drop policy if exists "media: admin borra" on storage.objects;
create policy "media: admin borra" on storage.objects
  for delete to authenticated using (bucket_id = 'media');
