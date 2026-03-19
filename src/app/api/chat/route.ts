import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";
import { searchLocalCatalog, getLocalProduct, getAllProducts } from "@/lib/engine/local-catalog";
import { checkRateLimit } from "@/lib/engine/rate-limit";

const SYSTEM_PROMPT = `Sos un vendedor experto de Diezypunto, empresa de merchandising corporativo B2B en Argentina. Profesional pero cercano, hablás de vos.

FORMATO DE RESPUESTA — MUY IMPORTANTE:
- Respondé en MÁXIMO 2 párrafos cortos de texto (1-3 oraciones cada uno)
- NO uses markdown (nada de ##, **, ---, listas con -)
- NO categorices productos con headers ni separadores
- Después del texto, listá los productos usando EXACTAMENTE este tag en UNA SOLA LÍNEA cada uno:
<product id="ID" title="TÍTULO" price="PRECIO" image="URL" category="CATEGORÍA" />
- Máximo 6 productos por respuesta
- Precios siempre + IVA

COMPORTAMIENTO:
- Si el cliente pide productos, usá search_catalog y mostrá resultados directo
- Si necesitás info para recomendar bien (presupuesto, cantidad), preguntá 1-2 cosas máximo Y buscá opciones populares mientras tanto
- NUNCA inventes productos. Solo los que devuelve search_catalog.
- Si no encontrás nada, decilo y sugerí alternativas.

EJEMPLO de respuesta ideal:
Encontré varias opciones de botellas para tu evento. Todas se pueden personalizar con tu logo.
<product id="abc" title="Botella Eco 750ml" price="3500" image="https://..." category="Botellas" />
<product id="def" title="Termo Stanley" price="8900" image="https://..." category="Botellas" />`;

export async function POST(req: Request) {
  // Rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.ok) {
    return new Response(JSON.stringify({ error: "Muchas consultas. Esperá unos segundos." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools: {
      search_catalog: tool({
        description: "Buscar productos en el catálogo de Diezypunto. Usá esto siempre que el cliente pida productos, busque algo, o necesites encontrar items para un combo.",
        inputSchema: z.object({
          query: z.string().describe("Búsqueda en lenguaje natural. Ej: 'botellas eco', 'tecnología', 'regalos corporativos premium'"),
          category: z.string().optional().describe("Filtrar por categoría específica si el usuario la mencionó"),
          eco_only: z.boolean().optional().describe("true si el usuario pidió específicamente productos eco/sustentables"),
          max_price: z.number().optional().describe("Precio máximo por unidad si el usuario mencionó presupuesto"),
        }),
        execute: async (args: { query: string; category?: string; eco_only?: boolean; max_price?: number }) => {
          let results = searchLocalCatalog(args.query, {
            category: args.category,
            eco_friendly: args.eco_only,
            maxResults: 20,
          });

          if (args.max_price) {
            results = results.filter((p) => p.price == null || p.price <= args.max_price!);
          }

          // If no results from search, try browsing by category
          if (results.length === 0 && args.category) {
            const all = getAllProducts({ category: args.category, limit: 12 });
            results = all.products;
          }

          return results.slice(0, 12).map((p) => ({
            id: p.product_id,
            title: p.title,
            category: p.category,
            price: p.price,
            min_qty: p.min_qty,
            materials: p.materials.slice(0, 3),
            colors: p.colors.slice(0, 5),
            personalization: p.personalization_methods.slice(0, 3),
            eco: p.eco_friendly,
            image: p.image_urls[0] || "",
          }));
        },
      }),

      get_product_detail: tool({
        description: "Obtener detalle completo de un producto específico por ID. Usá esto cuando el usuario pregunte sobre un producto en particular.",
        inputSchema: z.object({
          product_id: z.string().describe("ID del producto"),
        }),
        execute: async (args: { product_id: string }) => {
          const product = getLocalProduct(args.product_id);
          if (!product) return { error: "Producto no encontrado" };
          return {
            id: product.product_id,
            title: product.title,
            description: product.description,
            category: product.category,
            price: product.price,
            price_max: product.price_max,
            min_qty: product.min_qty,
            materials: product.materials,
            colors: product.colors,
            personalization: product.personalization_methods,
            eco: product.eco_friendly,
            image: product.image_urls[0] || "",
            lead_time_days: product.lead_time_days,
          };
        },
      }),
    },
    stopWhen: stepCountIs(3),
  });

  return result.toUIMessageStreamResponse();
}
