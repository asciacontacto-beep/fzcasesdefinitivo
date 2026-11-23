import type { DolarCasa, ShopSettings } from "./types";

/** Valores por defecto de la tienda online. Lo que se guarda en el panel los pisa. */
export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  usdRate: 1200,
  usdSource: "manual",
  usdCasa: "blue",
  usdAdjust: 0,
  usdManual: 1200,
  whatsapp: "5492494521518",
  mercadoPagoEnabled: true,
  transferEnabled: true,
  transferDiscountPct: 10,
  // Los datos de la cuenta se cargan desde el panel (no van en el código).
  bank: { titular: "", banco: "", cuenta: "", cbu: "", alias: "", cuil: "" },
  whatsappCheckoutEnabled: true,
  deliveryOptions: [
    { id: "retiro_tandil", label: "Retiro en Tandil", priceArs: 0, needsAddress: false },
    { id: "retiro_necochea", label: "Retiro en Necochea", priceArs: 0, needsAddress: false },
    { id: "envio", label: "Envío a domicilio", priceArs: 0, needsAddress: true, note: "Costo de envío a coordinar por WhatsApp" },
  ],
};

export const DOLAR_CASAS: { value: DolarCasa; label: string }[] = [
  { value: "blue", label: "Blue" },
  { value: "oficial", label: "Oficial" },
  { value: "bolsa", label: "MEP (bolsa)" },
  { value: "contadoconliqui", label: "Contado con liquidación" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "cripto", label: "Cripto" },
  { value: "mayorista", label: "Mayorista" },
];

/** Precio en pesos con el descuento por transferencia aplicado. */
export function transferPrice(ars: number, pct: number) {
  return Math.round(ars * (1 - Math.max(0, Math.min(pct, 90)) / 100));
}
