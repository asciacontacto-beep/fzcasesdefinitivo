// GET /api/dolar → cotizaciones de dolarapi.com (para mostrarlas en el panel)
import { fetchAllDolares } from "@/lib/dolar";

export async function GET() {
  const quotes = await fetchAllDolares();
  return Response.json(quotes, {
    status: quotes.length ? 200 : 502,
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
  });
}
