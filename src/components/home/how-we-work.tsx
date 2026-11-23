import { LinkButton } from "@/components/ui/button";

// Hechos que la tienda ya publicaba en "Info importante" y "Garantía".
const FACTS = [
  { title: "Solo equipos originales", text: "No vendemos réplicas. Cada equipo es Apple original, sellado o usado." },
  { title: "Usados de clientes", text: "Los usados vienen de clientes, no de otros comercios, y ninguno tiene arreglos, roturas ni rayaduras." },
  { title: "En caja y con cable original", text: "Entregamos cada equipo en su caja y con el cable original de Apple." },
  { title: "Garantía oficial Apple", text: "Los sellados tienen 12 meses de garantía oficial. Revisás y probás tu equipo antes de retirarte." },
];

export function HowWeWork() {
  return (
    <section className="container-x pt-24" aria-labelledby="how-title">
      <div className="grid gap-10 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-4">
          <h2 id="how-title" className="text-display text-[30px] md:text-5xl">Cómo vendemos</h2>
          <p className="mt-4 text-lg text-ink-soft">Lo que te llevás cuando comprás en FZCASES, por escrito.</p>
          <LinkButton href="/garantia" variant="secondary" className="mt-8">Leer la garantía</LinkButton>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-2 md:col-span-8">
          {FACTS.map((f) => (
            <li key={f.title} className="bg-card p-7">
              <h3 className="text-[20px] font-medium">{f.title}</h3>
              <p className="mt-2 text-ink-soft">{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
