import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { searchLocalCatalog, getLocalProduct, getAllProducts } from "@/lib/engine/local-catalog";
import { checkRateLimit } from "@/lib/engine/rate-limit";

const SYSTEM_PROMPT = `Sos un vendedor experto de Diezypunto, empresa de merchandising corporativo B2B en Argentina.

Tu rol:
- Ayudar al cliente a encontrar productos para sus eventos, regalos corporativos, merchandising de marca
- Armar combos/pedidos completos con precios
- Responder consultas sobre productos, personalización, tiempos de entrega
- Ser profesional pero cercano, hablar en segunda persona (vos)

Comportamiento:
1. Si el cliente pide algo específico ("botellas eco"), usá search_catalog para buscar y mostrá resultados
2. Si el cliente quiere armar un pedido/combo, hacé 1-2 preguntas clave (presupuesto, cantidad de personas) y después usá search_catalog + armá el combo
3. Si te faltan datos para recomendar bien, preguntá (pero máximo 1-2 preguntas, no un interrogatorio)
4. Cuando muestres productos, usá SIEMPRE el formato de producto estructurado (ver abajo)
5. Los precios son siempre + IVA. Mencionalo.
6. Pedido mínimo: 10 unidades por producto
7. Tiempos de entrega: estándar 15 días hábiles, express 5 días hábiles (+30%)

Formato para mostrar productos — usá EXACTAMENTE este formato para cada producto:
<product id="PRODUCT_ID" title="TÍTULO" price="PRECIO" image="IMAGE_URL" category="CATEGORÍA" />

Para combos, mostrá los productos y después un resumen:
<combo total="TOTAL_POR_PERSONA" count="CANTIDAD_PERSONAS">
Descripción breve del combo
</combo>

Reglas:
- NUNCA inventar productos. Solo recomendar los que devuelve search_catalog.
- NUNCA mostrar precios de costo. Solo precio final + IVA.
- Si no encontrás lo que buscan, decilo honestamente y sugerí alternativas.
- Máximo 8 productos por respuesta. Si hay más, mostrá los mejores y mencioná que hay más.
- Respuestas concisas. No walls of text.`;

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

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    messages,
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
