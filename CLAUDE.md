# Diezypunto Web — Catálogo + Búsqueda AI + Presupuestos

## Qué es

Landing page + catálogo de merchandising corporativo + búsqueda inteligente con AI + armador de presupuestos con checkout MercadoPago. Para Diezypunto (Martín Diez, B2B merchandising en Buenos Aires).

**Stack:** Next.js 16 / React 19 / TypeScript / Tailwind v4 / Claude Haiku / Zustand / Vercel

**Live:** diezypunto-web.vercel.app

## Arquitectura

```
diezypunto-web/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # 12 API routes (server-side)
│   │   │   ├── search/            # AI search (Claude Haiku reranking)
│   │   │   ├── ai-picks/          # Top picks curados por AI
│   │   │   ├── cart-review/       # AI review del carrito
│   │   │   ├── advisor/           # AI quote advisor
│   │   │   ├── checkout/          # MercadoPago preference creation
│   │   │   └── ...
│   │   ├── catalogo/              # Browse por categoría
│   │   ├── producto/[id]/         # Detalle de producto
│   │   ├── carrito/               # Carrito + checkout
│   │   ├── page.tsx               # Home
│   │   └── layout.tsx             # Root layout
│   ├── components/
│   │   ├── home/                  # Hero, secciones, FAQ
│   │   ├── advisor/               # UI del advisor interactivo
│   │   ├── quote/                 # Carrito y review
│   │   ├── search/                # Interfaz de búsqueda
│   │   └── catalog/               # Grilla de productos, filtros
│   ├── lib/
│   │   ├── engine/
│   │   │   ├── llm.ts             # Claude Haiku — search, picks, cart review, advisor
│   │   │   ├── local-catalog.ts   # Text search instantáneo (stemming español + sinónimos)
│   │   │   ├── zecat.ts           # Zecat API client (fallback)
│   │   │   └── rate-limit.ts      # Rate limiting por IP
│   │   ├── stores/
│   │   │   ├── quote-store.ts     # Carrito (Zustand + localStorage)
│   │   │   ├── search-store.ts    # Estado de búsqueda (ephemeral)
│   │   │   └── advisor-store.ts   # Estado del advisor
│   │   ├── types.ts               # Interfaces TypeScript
│   │   ├── api.ts                 # Client-side API wrapper
│   │   └── telegram.ts            # Deep linking al bot Telegram
│   └── data/
│       └── catalog.json           # Catálogo completo (~1.1 MB, synced desde Zecat)
├── scripts/
│   ├── generate-llms-full.ts      # Prebuild: catalog.json → public/llms-full.txt
│   └── sync-catalog.ts            # Sync desde Zecat API
├── .env.example                   # Template de env vars
└── package.json
```

## Cómo correr

```bash
npm install
cp .env.example .env.local
# Completar las API keys en .env.local
npm run dev
# → http://localhost:3000
```

### Scripts útiles

```bash
npm run dev            # Dev server
npm run build          # Build (genera llms-full.txt + next build)
npm run sync-catalog   # Sync catálogo desde Zecat API
npm run lint           # ESLint
```

## Variables de entorno

| Variable | Qué es | Requerida |
|---|---|---|
| `ANTHROPIC_API_KEY` | API key de Claude (Haiku para search/picks/review) | Sí |
| `ZECAT_API_TOKEN` | Token de Zecat (base64 email:token) | Sí |
| `MERCADOPAGO_ACCESS_TOKEN` | MercadoPago checkout (sin esto, checkout devuelve 503) | No |

## Cómo funciona la búsqueda AI

1. **Text search local** — query tokenizado + stemming español + sinónimos → top ~50 candidatos desde `catalog.json` (instantáneo)
2. **Claude Haiku reranking** — un solo call que: extrae needs, selecciona mejores productos (max 12), genera summary en español argentino
3. **Cache** — 5 min in-memory por query normalizado
4. **Rate limit** — por IP, in-memory

## Catálogo

- **Fuente principal:** `src/data/catalog.json` (~1.1 MB, estático)
- **Sync:** `npm run sync-catalog` baja de Zecat API y actualiza el JSON
- **Fallback:** `zecat.ts` hace lookups individuales si un producto no está en el JSON
- **528+ productos** en 8 categorías: drinkware, bags, apparel, kits, tech, premium, eco, office

## Estado (Zustand)

| Store | Persistencia | Qué guarda |
|---|---|---|
| `quote-store` | localStorage (`diezypunto-quote`) | Carrito: items + qty |
| `search-store` | No (ephemeral) | Resultados de búsqueda, needs extraídas |
| `advisor-store` | No (ephemeral) | Estado del advisor form |

## Repos relacionados

| Repo | Relación |
|---|---|
| `diezypunto-vault` | Cerebro del negocio — config del bot, catálogo curado |
| `kairos-merch-core` | Bot engine — la web podría usar su API de search |

## Deploy

- **Vercel** — auto-deploy en push a `main`
- Env vars configuradas en Vercel dashboard
- Prebuild hook genera `public/llms-full.txt` desde catalog.json

## Convenciones

- **UI:** Tailwind v4 inline utilities, no CSS modules
- **Animaciones:** Framer Motion
- **Iconos:** lucide-react
- **Español argentino** en todo el UI y respuestas AI
- Precios en **ARS**, siempre mostrar **"+ IVA"**
- Pedido mínimo: **10 unidades**
