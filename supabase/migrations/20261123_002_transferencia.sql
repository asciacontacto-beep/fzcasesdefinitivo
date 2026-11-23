-- =============================================================================
-- FZCASES · Migración 002: pago por transferencia con descuento
-- =============================================================================
-- Agrega "transferencia" como forma de pago de los pedidos y guarda el
-- descuento aplicado. No toca productos, ventas ni pedidos existentes.
-- Se puede correr más de una vez.
-- =============================================================================

-- 1. Permitir metodo_pago = 'transferencia'
--    (Supabase avisa "destructive" por el DROP CONSTRAINT: solo se reemplaza la
--     regla que valida el campo por una que acepta un valor más.)
alter table public.orders drop constraint if exists orders_metodo_pago_check;
alter table public.orders add constraint orders_metodo_pago_check
  check (metodo_pago in ('mercadopago', 'whatsapp', 'transferencia'));

-- 2. Descuento aplicado al total (en pesos)
alter table public.orders add column if not exists descuento_ars numeric(14,2) not null default 0;

-- 3. La venta que se registra al confirmar el pago dice "Transferencia (web)"
create or replace function public.confirmar_pago_pedido(p_order uuid, p_payment_id text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item  record;
  v_factor numeric;
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

  -- Si hubo descuento, la venta se registra con el precio efectivamente cobrado
  v_factor := case
    when v_order.total_ars + v_order.descuento_ars > 0
      then v_order.total_ars / (v_order.total_ars + v_order.descuento_ars)
    else 1
  end;

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
    values (v_item.producto_id, v_item.nombre, v_item.cantidad, round(v_item.precio_usd * v_factor, 2),
            coalesce(v_item.precio_costo, 0), v_order.cliente_nombre,
            case v_order.metodo_pago
              when 'mercadopago'   then 'Mercado Pago (web)'
              when 'transferencia' then 'Transferencia (web)'
              else 'Web / WhatsApp'
            end,
            now());
  end loop;

  return true;
end;
$$;

revoke all on function public.confirmar_pago_pedido(uuid, text) from public, anon;
grant execute on function public.confirmar_pago_pedido(uuid, text) to authenticated, service_role;
