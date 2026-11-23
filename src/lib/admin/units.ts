// Un equipo se carga como una lista de UNIDADES (cada iPhone físico que hay en
// stock, con su color, capacidad, batería, SIM, caja y notas). Es el mismo
// modelo que usaba el panel anterior: la primera unidad va en las columnas del
// producto y el resto en `variantes`. El stock es la cantidad de unidades.

import type { ProductRow, UnitRow } from "./data";

export interface Unit {
  key: string;
  storage: string;
  color: string;
  battery: string;
  sim: string; // "", "eSIM", "SIM Física"
  box: string; // "", "Con Caja", "Sin Caja"
  notes: string;
  image: string | null;
}

let seq = 0;
export const newKey = () => `u${Date.now().toString(36)}${(seq++).toString(36)}`;

export function emptyUnit(from?: Partial<Unit>): Unit {
  return { key: newKey(), storage: "", color: "", battery: "", sim: "", box: "", notes: "", image: null, ...from };
}

const TAG = (name: string) => new RegExp(`\\[${name}:\\s*([^\\]]*)\\]\\s*`, "i");

export function parseUnitNotes(raw: string | null | undefined) {
  let s = raw ?? "";
  const sim = TAG("SIM").exec(s)?.[1]?.trim() ?? "";
  const box = TAG("CAJA").exec(s)?.[1]?.trim() ?? "";
  s = s.replace(TAG("SIM"), "").replace(TAG("CAJA"), "").replace(/\[(DESTACADO|NUEVO)\]/g, "").trim();
  return { sim, box, notes: s };
}

export function composeUnitNotes(u: Pick<Unit, "sim" | "box" | "notes">) {
  return [u.sim && `[SIM: ${u.sim}]`, u.box && `[CAJA: ${u.box}]`, u.notes.trim()].filter(Boolean).join(" ");
}

export function rowToUnits(p: ProductRow, variantes: UnitRow[] | null): Unit[] {
  const main = parseUnitNotes(p.notas);
  const first = emptyUnit({
    storage: p.almacenamiento && p.almacenamiento !== "-" ? p.almacenamiento : "",
    color: p.color ?? "",
    battery: (p.battery ?? "").replace("%", ""),
    ...main,
    image: null,
  });
  const rest = (variantes ?? []).map((v) =>
    emptyUnit({
      storage: v.almacenamiento ?? "",
      color: v.color ?? "",
      battery: String(v.bateria ?? "").replace("%", ""),
      ...parseUnitNotes(v.notas),
      image: v.imagen ?? null,
    }),
  );
  return [first, ...rest];
}

export function unitToVariant(u: Unit): UnitRow {
  return { color: u.color, almacenamiento: u.storage, bateria: u.battery, notas: composeUnitNotes(u), imagen: u.image };
}
