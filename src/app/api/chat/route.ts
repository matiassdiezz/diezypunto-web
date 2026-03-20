import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";
import { searchLocalCatalog, getLocalProduct, getAllProducts } from "@/lib/engine/local-catalog";
import { getPriceForQuantity } from "@/lib/engine/pricing";
import { checkRateLimit } from "@/lib/engine/rate-limit";

const SYSTEM_PROMPT = `Sos un vendedor experto de Diezypunto, empresa de merchandising corporativo B2B en Argentina. Profesional pero cercano, hablás de vos.

IMÁGENES (cuando el usuario adjunta fotos):
- Mirá la imagen: describí brevemente qué se ve (producto, logo, merchandising, colores) sin inventar datos del catálogo.
- Relacioná lo visual con búsquedas reales usando search_catalog (términos concretos: tipo de producto, material, uso).
- Si la foto muestra un pedido escrito o lista, usá eso como contexto para buscar y recomendar.
- NUNCA inventes IDs ni productos: solo los que devuelve search_catalog o get_product_detail.

FORMATO DE RESPUESTA — MUY IMPORTANTE:
- Respondé en MÁXIMO 2 párrafos cortos de texto (1-3 oraciones cada uno)
- NO uses markdown (nada de ##, **, ---, listas con -)
- NO categorices productos con headers ni separadores
- Después del texto, listá los productos usando EXACTAMENTE este tag en UNA SOLA LÍNEA cada uno:
<product id="ID" title="TÍTULO" price="PRECIO" image="URL" category="CATEGORÍA" suggested_qty="CANTIDAD" />
- El atributo suggested_qty es opcional: ponelos solo si el cliente dio una cantidad (debe coincidir con quantity en search_catalog). El price del tag debe ser el unit_price_at_quantity del resultado de search_catalog cuando haya cantidad, si no el precio unitario base.
- La herramienta search_catalog devuelve un objeto con "products" (hasta 4), "quantity_context" y "total_matches_hint". Si total_matches_hint > 4, mencioná que hay más opciones en el Catálogo del sitio.
- Entre 3 y 4 productos por respuesta como máximo (nunca más de 4)
- Precios siempre + IVA

COMPORTAMIENTO:
- Si el cliente pide productos, usá search_catalog y mostrá resultados directo
- Si el cliente menciona una cantidad (ej. "500 lapiceras", "100 unidades"), pasá quantity a search_catalog y usá en el tag price el número unit_price_at_quantity que devuelve la herramienta (precio unitario final para esa cantidad, ya con lógica por volumen). Agregá suggested_qty="500" (o la cantidad que sea) en cada tag cuando aplique.
- Mostrá como máximo 4 productos (ideal 3). Si hay más resultados en la herramienta, no los listés: decí en texto que puede ver más variedad en el Catálogo del sitio.
- Si necesitás info para recomendar bien (presupuesto, cantidad), preguntá 1-2 cosas máximo Y buscá opciones populares mientras tanto
- NUNCA inventes productos. Solo los que devuelve search_catalog.
- Si no encontrás nada, decilo y sugerí alternativas.

EJEMPLO de respuesta ideal (con cantidad):
Te dejo tres opciones de lapiceras que encajan con tu pedido de 500 unidades. Si querés ver más modelos, entrá al Catálogo del sitio.
<product id="abc" title="Lapicera plástica" price="450" image="https://..." category="Escritura" suggested_qty="500" />
<product id="def" title="Lapicera metal" price="890" image="https://..." category="Escritura" suggested_qty="500" />`;

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
          quantity: z.number().optional().describe("Cantidad total que el cliente mencionó (ej. 500 lapiceras, 100 unidades). Sirve para calcular precio unitario por tramo de volumen."),
        }),
        execute: async (args: {
          query: string;
          category?: string;
          eco_only?: boolean;
          max_price?: number;
          quantity?: number;
        }) => {
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

          const qty =
            args.quantity != null && args.quantity > 0 ? Math.round(args.quantity) : undefined;
          const totalMatches = results.length;
          const capped = results.slice(0, 4);

          return {
            total_matches_hint: totalMatches,
            showing: capped.length,
            quantity_context: qty ?? null,
            products: capped.map((p) => {
              const full = getLocalProduct(p.product_id);
              let unitPriceAtQty: number | null = p.price;
              if (full && qty != null) {
                const list = full.list_price ?? full.price_max ?? full.price;
                if (list != null && list > 0) {
                  unitPriceAtQty = getPriceForQuantity(
                    list,
                    qty,
                    full.subcategory || full.category,
                  ).finalPrice;
                }
              }
              return {
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
                unit_price_at_quantity: unitPriceAtQty,
              };
            }),
          };
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
