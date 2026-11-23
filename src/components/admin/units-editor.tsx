"use client";
import { Copy, Plus, Trash2 } from "lucide-react";
import { emptyUnit, newKey, type Unit } from "@/lib/admin/units";
import { ImageSlot } from "./image-slot";

const COLORS = ["Negro", "Blanco", "Azul", "Rosa", "Verde", "Midnight", "Starlight", "Silver", "Space Gray", "Natural Titanium", "Desert Titanium", "Dorado", "Lavanda", "Teal", "Ultramarine", "Orange"];
const STORAGES = ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"];

/**
 * Tabla de unidades físicas en stock. Cada fila es un equipo real.
 * La primera fila es la que se muestra en la tarjeta del catálogo.
 */
function UnitField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 ${className ?? ""}`}>
      <span className="mb-1 block text-[13px] text-muted">{label}</span>
      {children}
    </label>
  );
}

export function UnitsEditor({ units, onChange, showBattery, productId }: { units: Unit[]; onChange: (u: Unit[]) => void; showBattery: boolean; productId: number | null }) {
  const update = (key: string, patch: Partial<Unit>) => onChange(units.map((u) => (u.key === key ? { ...u, ...patch } : u)));
  const remove = (key: string) => onChange(units.filter((u) => u.key !== key));
  const duplicate = (u: Unit) => {
    const i = units.findIndex((x) => x.key === u.key);
    const copy = { ...u, key: newKey(), battery: "", image: null };
    onChange([...units.slice(0, i + 1), copy, ...units.slice(i + 1)]);
  };

  return (
    <div>
      <datalist id="dl-colors">{COLORS.map((c) => <option key={c} value={c} />)}</datalist>
      <datalist id="dl-storage">{STORAGES.map((c) => <option key={c} value={c} />)}</datalist>

      <div className="space-y-3">
        {units.map((u, i) => (
          <div key={u.key} className="rounded-[12px] border border-line p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-medium text-muted">
                Unidad {i + 1}
                {i === 0 && " · la que se ve en el catálogo"}
              </p>
              <div className="flex gap-1">
                <button type="button" onClick={() => duplicate(u)} title="Duplicar" aria-label={`Duplicar unidad ${i + 1}`} className="grid h-9 w-9 place-items-center rounded-[8px] text-ink-soft hover:bg-alt">
                  <Copy size={15} />
                </button>
                <button type="button" onClick={() => remove(u.key)} disabled={units.length === 1} title="Quitar" aria-label={`Quitar unidad ${i + 1}`} className="grid h-9 w-9 place-items-center rounded-[8px] text-ink-soft hover:bg-alt hover:text-danger disabled:opacity-30">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0">
                <span className="mb-1 block text-[13px] text-muted">Foto</span>
                <ImageSlot compact value={u.image} onChange={(image) => update(u.key, { image })} folder={`products/${productId ?? "nuevo"}/unidades`} label="foto de esta unidad" />
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
                <UnitField label="Capacidad">
                  <input list="dl-storage" value={u.storage} onChange={(e) => update(u.key, { storage: e.target.value })} placeholder="128GB" className="input" />
                </UnitField>
                <UnitField label="Color">
                  <input list="dl-colors" value={u.color} onChange={(e) => update(u.key, { color: e.target.value })} placeholder="Negro" className="input" />
                </UnitField>
                {showBattery && (
                  <UnitField label="Batería %">
                    <input inputMode="numeric" value={u.battery} onChange={(e) => update(u.key, { battery: e.target.value.replace(/[^\d]/g, "").slice(0, 3) })} placeholder="90" className="input" />
                  </UnitField>
                )}
                <UnitField label="SIM">
                  <select value={u.sim} onChange={(e) => update(u.key, { sim: e.target.value })} className="input">
                    <option value="">—</option>
                    <option value="eSIM">eSIM</option>
                    <option value="SIM Física">SIM física</option>
                  </select>
                </UnitField>
                <UnitField label="Caja">
                  <select value={u.box} onChange={(e) => update(u.key, { box: e.target.value })} className="input">
                    <option value="">—</option>
                    <option value="Con Caja">Con caja</option>
                    <option value="Sin Caja">Sin caja</option>
                  </select>
                </UnitField>
              </div>
            </div>
            <UnitField label="Notas de esta unidad" className="mt-3">
              <input value={u.notes} onChange={(e) => update(u.key, { notes: e.target.value })} placeholder="Ej. garantía hasta 10/09/26" className="input" />
            </UnitField>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...units, emptyUnit({ storage: units.at(-1)?.storage ?? "", sim: units.at(-1)?.sim ?? "", box: units.at(-1)?.box ?? "" })])}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-ink/25 text-[15px] font-medium text-ink-soft transition hover:border-ink hover:text-ink"
      >
        <Plus size={16} /> Agregar unidad
      </button>
    </div>
  );
}
