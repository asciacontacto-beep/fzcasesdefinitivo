// Tipos del dominio. La DB usa nombres en español (products.precio_venta, etc.);
// el front trabaja con estos tipos normalizados, armados en lib/catalog.ts.

export type Condition = "Nuevo" | "Usado";

export interface Variant {
  color: string;
  storage: string;
  battery: string;
  notes: string;
  image: string | null;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  condition: Condition;
  storage: string;
  color: string;
  priceUsd: number;
  battery: string;
  location: string;
  notes: string;
  description: string;
  image: string | null;
  stock: number;
  order: number;
  featured: boolean;
  isNew: boolean;
  /** Se puede comprar con carrito + checkout (accesorios). El resto se consulta por WhatsApp. */
  sellOnline: boolean;
  createdAt: string;
}

export interface ProductDetail extends Product {
  images: string[];
  variants: Variant[];
}

export interface CategoryNavItem {
  name: string;
  url: string;
  imgUrl: string;
  active: boolean;
}

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroSlides: string[];
  logoUrl: string | null;
  categoryNav: { enabled: boolean; items: CategoryNavItem[] };
  customModels: Record<string, string[]>;
  canjeTitle: string;
  canjeSubtitle: string;
}

export interface DeliveryOption {
  id: string;
  label: string;
  priceArs: number;
  needsAddress: boolean;
  note?: string;
}

/** Tipos de dólar que publica dolarapi.com */
export type DolarCasa = "oficial" | "blue" | "bolsa" | "contadoconliqui" | "mayorista" | "cripto" | "tarjeta";

export interface BankAccount {
  titular: string;
  banco: string;
  cuenta: string;
  cbu: string;
  alias: string;
  cuil: string;
}

export interface ShopSettings {
  /** Cotización que se usa para cobrar (ya resuelta: manual o la de dolarapi + ajuste). */
  usdRate: number;
  /** "manual": usa usdRate tal cual. "dolarapi": toma la venta de `usdCasa` y le suma `usdAdjust`. */
  usdSource: "manual" | "dolarapi";
  usdCasa: DolarCasa;
  /** Pesos a sumar (o restar) a la cotización automática. */
  usdAdjust: number;
  /** Cotización manual guardada (se usa también si dolarapi no responde). */
  usdManual: number;
  /** De dónde salió `usdRate` en esta carga, para mostrarlo en el panel. */
  usdInfo?: { source: "manual" | "dolarapi" | "fallback"; updatedAt?: string };
  whatsapp: string;
  mercadoPagoEnabled: boolean;
  transferEnabled: boolean;
  transferDiscountPct: number;
  bank: BankAccount;
  /** Efectivo al retirar / coordinar por WhatsApp */
  whatsappCheckoutEnabled: boolean;
  deliveryOptions: DeliveryOption[];
}

export type OrderStatus = "pendiente" | "pagado" | "preparando" | "listo" | "entregado" | "cancelado";
export type PaymentStatus = "pendiente" | "aprobado" | "rechazado" | "reembolsado" | "a_coordinar";

export interface OrderItemRow {
  id: number;
  order_id: string;
  producto_id: number | null;
  nombre: string;
  color: string | null;
  imagen: string | null;
  cantidad: number;
  precio_usd: number;
}

export interface OrderRow {
  id: string;
  numero: number;
  estado: OrderStatus;
  metodo_pago: "mercadopago" | "whatsapp" | "transferencia";
  descuento_ars?: number;
  pago_estado: PaymentStatus;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  cliente_nombre: string;
  cliente_email: string | null;
  cliente_telefono: string;
  cliente_dni: string | null;
  entrega: string;
  direccion: { calle?: string; ciudad?: string; cp?: string; provincia?: string } | null;
  notas: string | null;
  subtotal_usd: number;
  cotizacion: number;
  envio_ars: number;
  total_ars: number;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
}
