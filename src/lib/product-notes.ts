// Las notas de cada equipo se cargan en el panel con etiquetas entre corchetes:
//   "[SIM: eSIM] [CAJA: Con Caja] Garantia hasta 10/09/26"
// Acá se separan en filas de especificaciones + el texto libre que queda.

export interface ParsedNotes {
  specs: { label: string; value: string }[];
  text: string;
}

const LABELS: Record<string, string> = {
  SIM: "SIM",
  CAJA: "Caja",
  CICLOS: "Ciclos de batería",
  GARANTIA: "Garantía",
};

export function parseNotes(raw: string): ParsedNotes {
  const specs: ParsedNotes["specs"] = [];
  const text = raw
    .replace(/\[([A-ZÁÉÍÓÚÑ ]+):\s*([^\]]+)\]/gi, (_, key: string, value: string) => {
      const k = key.trim().toUpperCase();
      // El valor queda tal cual se cargó ("eSIM", "Con Caja").
      specs.push({ label: LABELS[k] ?? capitalize(k.toLowerCase()), value: value.trim() });
      return "";
    })
    .replace(/\[(DESTACADO|NUEVO)\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return { specs, text: text ? capitalize(text) : "" };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
