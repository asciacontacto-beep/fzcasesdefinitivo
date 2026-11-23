// Reseñas que ya estaban publicadas en el sitio anterior.
// TODO(cliente): confirmar que son reales o reemplazarlas por reseñas de Google.
const TESTIMONIALS = [
  { name: "Martín López", city: "Tandil", product: "iPhone 14, 128 GB", text: "Compré un iPhone 14 y llegó impecable. Me explicaron todo el proceso." },
  { name: "Lucía Fernández", city: "Necochea", product: "Plan canje", text: "Canjeé mi iPhone viejo por un 15 Pro. Fue rápido y me dieron un precio justo." },
  { name: "Carolina Ruiz", city: "Necochea", product: "MacBook Air M2", text: "Mi MacBook Air llegó perfecta. La garantía me dio tranquilidad." },
];

export function Testimonials() {
  return (
    <section className="container-x pt-24" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="text-display mb-10 text-[30px] md:text-5xl">Lo que cuentan los clientes</h2>
      <ul className="grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <li key={t.name} className="flex flex-col rounded-[20px] border border-line bg-card p-7">
            <blockquote className="text-display text-[24px] leading-snug">“{t.text}”</blockquote>
            <p className="mt-auto pt-8 text-[15px] font-medium">{t.name}</p>
            <p className="text-sm text-muted">{t.city} · {t.product}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
