"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Share2 } from "lucide-react";
import { useShop } from "@/components/layout/shop-context";
import { WhatsAppIcon } from "@/components/layout/whatsapp-fab";
import { Button, buttonClass } from "@/components/ui/button";
import { cn, waLink } from "@/lib/format";
import { logEvent } from "@/lib/analytics";

// Mismas opciones y reglas que el formulario del sitio anterior.
const MODELS = [
  "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17 Air", "iPhone 17", "iPhone 17e",
  "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16", "iPhone 16e",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 14 Pro", "iPhone 14", "iPhone 13",
];
const CAPACITIES = ["128GB", "256GB", "512GB", "1TB"];
const STATES = [
  { value: "Como nuevo", hint: "Sin rayones ni golpes" },
  { value: "Muy bueno", hint: "Detalles mínimos" },
  { value: "Bueno", hint: "Rayones leves" },
];
const FAULTS = ["Pantalla táctil", "Face ID / Touch ID", "Cámaras (frontal o trasera)", "Botones, parlantes o micrófono"];
const SIMS = ["Chip físico", "eSIM", "Ambos (chip + eSIM)"];
const MIN_BATTERY = 85;
const STORAGE_KEY = "fz-canje";

interface CanjeData {
  modelo: string;
  otroModelo: string;
  capacidad: string;
  color: string;
  ubicacion: string;
  deseadoTipo: string;
  deseadoModelo: string;
  estado: string;
  detalles: string;
  todoFunciona: boolean;
  fallas: string[];
  reparaciones: string;
  bateria: string;
  ciclos: string;
  fotoBateria: string | null;
  fotoInfo: string | null;
  cable: boolean;
  caja: boolean;
  garantia: boolean;
  sim: string;
  antiguedad: string;
  origen: string;
}

const EMPTY: CanjeData = {
  modelo: "", otroModelo: "", capacidad: "", color: "", ubicacion: "", deseadoTipo: "", deseadoModelo: "",
  estado: "", detalles: "", todoFunciona: false, fallas: [], reparaciones: "", bateria: "", ciclos: "",
  fotoBateria: null, fotoInfo: null, cable: false, caja: false, garantia: false, sim: "", antiguedad: "", origen: "",
};

const STEPS = ["Tu iPhone", "El canje", "Estado", "Funcionamiento", "Batería", "Accesorios", "Enviar"];

const modelName = (d: CanjeData) => (d.modelo === "Otro" ? d.otroModelo.trim() : d.modelo);
const needsCycles = (d: CanjeData) => /\b1[5-9]\b/.test(modelName(d));

function stepValid(step: number, d: CanjeData): boolean {
  switch (step) {
    case 0: return modelName(d).length > 2 && !!d.capacidad;
    case 1: return !!d.ubicacion && !!d.deseadoTipo;
    case 2: return !!d.estado;
    case 3: return d.todoFunciona || d.fallas.length > 0;
    case 4: {
      const b = Number(d.bateria);
      return b >= MIN_BATTERY && b <= 100 && !!d.fotoBateria && !!d.fotoInfo && (!needsCycles(d) || d.ciclos.trim().length > 0);
    }
    case 5: return d.cable && d.caja && d.origen.trim().length > 1;
    default: return true;
  }
}

function buildMessage(d: CanjeData) {
  const si = (v: boolean) => (v ? "Sí" : "No");
  return [
    "PLAN CANJE - Consulta desde la web",
    "",
    `Modelo: ${modelName(d)}`,
    `Capacidad: ${d.capacidad}`,
    `Color: ${d.color || "-"}`,
    `Sucursal: ${d.ubicacion}`,
    `Lo quiero cambiar por: ${d.deseadoTipo}${d.deseadoModelo ? ` - ${d.deseadoModelo}` : ""}`,
    `Estado: ${d.estado}`,
    `Detalles estéticos: ${d.detalles || "-"}`,
    `Funcionamiento: ${d.todoFunciona ? "Funciona todo correctamente" : `Falla: ${d.fallas.join(", ")}`}`,
    `Reparaciones: ${d.reparaciones || "-"}`,
    `Batería: ${d.bateria}%${d.ciclos ? ` (${d.ciclos} ciclos)` : ""}`,
    `Cable original: ${si(d.cable)}`,
    `Caja: ${si(d.caja)}`,
    `En garantía: ${si(d.garantia)}`,
    `Chip o eSIM: ${d.sim || "-"}`,
    `Antigüedad: ${d.antiguedad || "-"}`,
    `Lo compré: ${d.origen}`,
    "",
    "Ahora les mando las capturas de batería e información.",
  ].join("\n");
}

/** Achica la captura para que entre en el almacenamiento del navegador y se comparta rápido. */
function compressToDataUrl(file: File, maxSide = 1100): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = url;
  });
}

// Sin fetch: en iOS navigator.share() tiene que correr en el mismo toque del usuario.
function dataUrlToFile(dataUrl: string, name: string) {
  const [head, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(head)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}

export function CanjeWizard() {
  const { whatsapp } = useShop();
  const [data, setData] = useState<CanjeData>(EMPTY);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [sent, setSent] = useState<{ files: File[] } | null>(null);
  const top = useRef<HTMLDivElement>(null);

  // Recuperar lo que el cliente ya había completado
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una sola vez al montar
      if (raw) setData({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Sin espacio (fotos grandes): se guarda sin las fotos
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, fotoBateria: null, fotoInfo: null }));
      } catch {}
    }
  }, [data, loaded]);

  const set = <K extends keyof CanjeData>(k: K, v: CanjeData[K]) => setData((d) => ({ ...d, [k]: v }));
  const go = (n: number) => {
    setStep(n);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const send = () => {
    const files = [
      data.fotoBateria && dataUrlToFile(data.fotoBateria, "bateria.jpg"),
      data.fotoInfo && dataUrlToFile(data.fotoInfo, "informacion.jpg"),
    ].filter(Boolean) as File[];
    const canShare = files.length > 0 && typeof navigator !== "undefined" && !!navigator.canShare?.({ files });
    // El aviso para compartir las capturas se muestra ANTES de abrir WhatsApp:
    // en el celular la app cambia casi al instante y lo que viene después puede no correr.
    setSent({ files: canShare ? files : [] });
    const { fotoBateria: _a, fotoInfo: _b, ...resumen } = data;
    void _a;
    void _b;
    logEvent("canje", resumen);
    window.open(waLink(whatsapp, buildMessage(data)), "_blank");
  };

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(EMPTY);
    setSent(null);
    go(0);
  };

  if (sent) {
    return (
      <div className="rounded-[20px] border border-line bg-card p-6 md:p-10">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-paper"><Check size={22} /></span>
        <h2 className="text-display mt-6 text-[28px] md:text-[36px]">Te abrimos WhatsApp con tu consulta</h2>
        <p className="mt-3 text-lg text-ink-soft">Mandá el mensaje y después las dos capturas, así te pasamos la cotización.</p>
        {sent.files.length > 0 ? (
          <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={() => navigator.share({ files: sent.files, title: "Capturas Plan Canje FZCASES" }).catch(() => {})}>
            <Share2 size={18} /> Compartir las capturas por WhatsApp
          </Button>
        ) : (
          <p className="mt-6 rounded-[12px] bg-alt px-4 py-3 text-[15px] text-ink-soft">
            Desde la compu no se pueden adjuntar solas: arrastrá las dos capturas al chat de WhatsApp Web.
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-4 text-[15px] font-medium">
          <a href={waLink(whatsapp, buildMessage(data))} target="_blank" rel="noopener"><span className="link-draw">Abrir WhatsApp de nuevo</span></a>
          <button onClick={restart}><span className="link-draw">Cotizar otro iPhone</span></button>
        </div>
      </div>
    );
  }

  const valid = stepValid(step, data);
  const battery = Number(data.bateria);

  return (
    <div ref={top} className="scroll-mt-24 rounded-[20px] border border-line bg-card">
      {/* Progreso */}
      <div className="border-b border-line px-6 py-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[15px] font-medium">{STEPS[step]}</p>
          <p className="text-[13px] text-muted">Paso {step + 1} de {STEPS.length}</p>
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s} className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-ink" : "bg-line")} />
          ))}
        </div>
      </div>

      <div className="space-y-8 p-6 md:p-8">
        {step === 0 && (
          <>
            <Group title="¿Qué modelo de iPhone tenés?">
              <Pills options={[...MODELS, "Otro"]} value={data.modelo} onChange={(v) => set("modelo", v)} />
              {data.modelo === "Otro" && (
                <input autoFocus value={data.otroModelo} onChange={(e) => set("otroModelo", e.target.value)} placeholder="Escribí el modelo" className="input mt-3" />
              )}
            </Group>
            <Group title="Capacidad">
              <Pills options={CAPACITIES} value={data.capacidad} onChange={(v) => set("capacidad", v)} />
            </Group>
            <Group title="Color" optional>
              <input value={data.color} onChange={(e) => set("color", e.target.value)} placeholder="Ej: Azul, Midnight" className="input" />
            </Group>
          </>
        )}

        {step === 1 && (
          <>
            <Group title="¿En qué sucursal harías el canje?">
              <Pills options={["Necochea", "Tandil"]} value={data.ubicacion} onChange={(v) => set("ubicacion", v)} />
            </Group>
            <Group title="¿Por cuál te gustaría cambiarlo?">
              <Pills options={["Sellado", "Usado"]} value={data.deseadoTipo} onChange={(v) => set("deseadoTipo", v)} />
              <input value={data.deseadoModelo} onChange={(e) => set("deseadoModelo", e.target.value)} placeholder="¿Algún modelo en particular? Ej: iPhone 17 Pro 256GB (opcional)" className="input mt-3" />
            </Group>
          </>
        )}

        {step === 2 && (
          <>
            <Group title="¿En qué estado está tu iPhone?">
              <div className="grid gap-3 sm:grid-cols-3">
                {STATES.map((s) => (
                  <OptionCard key={s.value} selected={data.estado === s.value} onClick={() => set("estado", s.value)} title={s.value} hint={s.hint} />
                ))}
              </div>
            </Group>
            <Group title="Detalles estéticos" optional hint="Marcas en los costados o atrás. Miralo sin funda.">
              <textarea rows={3} value={data.detalles} onChange={(e) => set("detalles", e.target.value)} className="input" />
            </Group>
            <Rule>No tomamos equipos con roturas, rayaduras ni arreglos. Si tenés dudas, mandanos una foto por WhatsApp.</Rule>
          </>
        )}

        {step === 3 && (
          <>
            <Group title="¿Funciona todo?">
              <OptionCard selected={data.todoFunciona} onClick={() => setData((d) => ({ ...d, todoFunciona: !d.todoFunciona, fallas: [] }))} title="Funciona todo correctamente" />
              <p className="mb-2 mt-5 text-[15px] text-ink-soft">O marcá lo que no funciona:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {FAULTS.map((f) => (
                  <OptionCard
                    key={f}
                    selected={data.fallas.includes(f)}
                    onClick={() => setData((d) => ({ ...d, todoFunciona: false, fallas: d.fallas.includes(f) ? d.fallas.filter((x) => x !== f) : [...d.fallas, f] }))}
                    title={f}
                    check
                  />
                ))}
              </div>
            </Group>
            <Group title="¿Tuvo reparaciones?" optional hint="Incluye cambio de batería, pantalla, etc.">
              <input value={data.reparaciones} onChange={(e) => set("reparaciones", e.target.value)} placeholder="Ej: No, nunca se abrió" className="input" />
            </Group>
          </>
        )}

        {step === 4 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Group title="Condición de la batería (%)" hint={`Tomamos equipos con ${MIN_BATTERY}% o más.`}>
                <input inputMode="numeric" value={data.bateria} onChange={(e) => set("bateria", e.target.value.replace(/[^\d]/g, "").slice(0, 3))} placeholder="Ej: 88" className="input" />
                {data.bateria && battery < MIN_BATTERY && (
                  <p className="mt-2 text-[13px] text-danger">Con {battery}% no podemos tomarlo en canje. Igual consultanos por WhatsApp.</p>
                )}
              </Group>
              {needsCycles(data) && (
                <Group title="Ciclos de carga" hint="Ajustes > Batería > Salud de la batería">
                  <input inputMode="numeric" value={data.ciclos} onChange={(e) => set("ciclos", e.target.value.replace(/[^\d]/g, "").slice(0, 5))} placeholder="Ej: 150" className="input" />
                </Group>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <PhotoInput label="Captura de Ajustes > Batería > Salud" value={data.fotoBateria} onChange={(v) => set("fotoBateria", v)} />
              <PhotoInput label="Captura de Ajustes > General > Información" value={data.fotoInfo} onChange={(v) => set("fotoInfo", v)} />
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <Rule>Es requisito entregar el equipo con su caja y su cable original.</Rule>
            <div className="grid gap-2 sm:grid-cols-3">
              <OptionCard check selected={data.cable} onClick={() => set("cable", !data.cable)} title="Tengo el cable original" />
              <OptionCard check selected={data.caja} onClick={() => set("caja", !data.caja)} title="Tengo la caja" />
              <OptionCard check selected={data.garantia} onClick={() => set("garantia", !data.garantia)} title="Está en garantía" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Group title="¿Chip o eSIM?" optional>
                <select value={data.sim} onChange={(e) => set("sim", e.target.value)} className="input">
                  <option value="">Elegí una opción</option>
                  {SIMS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Group>
              <Group title="Antigüedad" optional>
                <input value={data.antiguedad} onChange={(e) => set("antiguedad", e.target.value)} placeholder="Ej: 1 año y medio" className="input" />
              </Group>
            </div>
            <Group title="¿Lo compraste sellado o usado?" hint="Si es usado, contanos dónde lo compraste.">
              <input value={data.origen} onChange={(e) => set("origen", e.target.value)} placeholder="Ej: Sellado en Apple / Usado en otra tienda" className="input" />
            </Group>
            <Rule>No tomamos equipos tester.</Rule>
          </>
        )}

        {step === 6 && (
          <>
            <p className="text-lg text-ink-soft">Revisá que esté todo bien. Al enviar se abre WhatsApp con tu consulta escrita.</p>
            <dl className="divide-y divide-line rounded-[12px] border border-line text-[15px]">
              {[
                ["Modelo", `${modelName(data)} · ${data.capacidad}${data.color ? ` · ${data.color}` : ""}`],
                ["Sucursal", data.ubicacion],
                ["Lo querés cambiar por", `${data.deseadoTipo}${data.deseadoModelo ? ` · ${data.deseadoModelo}` : ""}`],
                ["Estado", data.estado],
                ["Funcionamiento", data.todoFunciona ? "Funciona todo" : data.fallas.join(", ")],
                ["Batería", `${data.bateria}%${data.ciclos ? ` · ${data.ciclos} ciclos` : ""}`],
                ["Accesorios", [data.caja && "Caja", data.cable && "Cable", data.garantia && "En garantía"].filter(Boolean).join(" · ")],
                ["Lo compraste", data.origen],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 px-4 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <button onClick={send} className={buttonClass("whatsapp", "lg", "w-full")}>
              <WhatsAppIcon size={20} /> Enviar por WhatsApp
            </button>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
        <Button variant="secondary" onClick={() => go(step - 1)} disabled={step === 0}>Anterior</Button>
        {step < STEPS.length - 1 && (
          <Button onClick={() => go(step + 1)} disabled={!valid}>Siguiente</Button>
        )}
      </div>
    </div>
  );
}

function Group({ title, optional, hint, children }: { title: string; optional?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1 text-[17px] font-medium">
        {title} {optional && <span className="text-[15px] font-normal text-muted">(opcional)</span>}
      </legend>
      {hint && <p className="mb-3 text-[13px] text-muted">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </fieldset>
  );
}

function Pills({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={cn("h-11 rounded-[10px] border px-4 text-[15px] font-medium transition", value === o ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/40")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function OptionCard({ selected, onClick, title, hint, check }: { selected: boolean; onClick: () => void; title: string; hint?: string; check?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn("flex min-h-14 w-full items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition", selected ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/40")}
    >
      {check && (
        <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border", selected ? "border-ink bg-ink text-paper" : "border-ink/30")}>
          {selected && <Check size={13} strokeWidth={3} />}
        </span>
      )}
      <span>
        <span className="block text-[15px] font-medium">{title}</span>
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
    </button>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[12px] bg-alt px-4 py-3 text-[15px] text-ink-soft">{children}</p>;
}

function PhotoInput({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <p className="mb-2 text-[15px] font-medium">{label}</p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={cn("relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-[12px] border border-dashed transition hover:border-ink", value ? "border-line" : "border-ink/25 bg-alt")}
      >
        {value ? (
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-contain bg-alt" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-[15px] text-muted">
            {busy ? <Loader2 className="animate-spin" size={22} /> : <ImagePlus size={22} strokeWidth={1.5} />}
            Subir captura
          </span>
        )}
      </button>
      {value && (
        <button type="button" onClick={() => onChange(null)} className="mt-2 text-[13px] text-ink-soft hover:text-danger">Cambiar captura</button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            onChange(await compressToDataUrl(f));
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
