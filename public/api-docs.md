# Diezypunto API Documentation

Base URL: `https://diezypunto-web.vercel.app`

## Endpoints

### GET /api/products

Browse and filter the product catalog.

**Query parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | — | Filter by category name (e.g., "Escritura") |
| `search` | string | — | Text search across title, description, materials |
| `min_price` | number | — | Minimum price filter |
| `max_price` | number | — | Maximum price filter |
| `eco_friendly` | boolean | — | Filter eco-friendly products only |
| `personalization` | string | — | Filter by personalization method |
| `sort` | string | — | `price_asc`, `price_desc`, or `name_asc` |
| `limit` | number | 24 | Products per page |
| `offset` | number | 0 | Pagination offset |

**Response:**
```json
{
  "products": [...],
  "total": 528,
  "limit": 24,
  "offset": 0,
  "has_more": true
}
```

### POST /api/search

AI-powered natural language search. Understands context like "algo para regalar en un evento tech" or "mochilas eco-friendly para 200 personas".

**Request:**
```json
{
  "query": "termos para evento corporativo de 100 personas",
  "session_id": "optional — for follow-up searches"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "products": [...],
  "extracted_needs": { "event_type": "corporativo", "quantity": 100 },
  "summary": "Encontré 12 termos ideales para tu evento...",
  "total_matches": 12,
  "has_more": false
}
```

### GET /api/categories

List all available categories with product counts.

**Response:**
```json
{
  "categories": [
    { "name": "Escritura", "count": 85, "subcategories": [] },
    { "name": "Textil", "count": 72, "subcategories": [] }
  ],
  "total_products": 528
}
```

### POST /api/checkout

Generate a Mercado Pago payment link.

**Request:**
```json
{
  "items": [
    {
      "id": "3587",
      "title": "Bol Tyrell",
      "quantity": 590,
      "unit_price": 341.87
    }
  ]
}
```

**Response:**
```json
{
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?..."
}
```

### POST /api/cart-review

Get AI-powered analysis of a shopping cart (minimum 2 items).

**Request:**
```json
{
  "items": [
    { "product_id": "3587", "title": "Bol Tyrell", "quantity": 590 },
    { "product_id": "3699", "title": "Boligrafo Pascal", "quantity": 500 }
  ]
}
```

**Response:**
```json
{
  "summary": "Buen combo de escritura corporativa...",
  "score": 78,
  "insights": [
    { "type": "tip", "icon": "💡", "message": "Considerá agregar un producto de otra categoría..." },
    { "type": "optimization", "icon": "📊", "message": "Podrías ahorrar..." }
  ]
}
```

### GET /api/catalog-feed

Full catalog in a single request, structured for agent consumption. No pagination.

**Response:**
```json
{
  "business": { "name": "Diezypunto", "description": "...", "country": "Argentina" },
  "catalog": { "total": 528, "categories": [...] },
  "products": [{ "id": "3587", "title": "...", "category": "...", ... }],
  "capabilities": { "ai_search": "POST /api/search", "browse": "GET /api/products" }
}
```

## Rate Limits

- AI endpoints (`/api/search`, `/api/cart-review`) are rate-limited per IP
- Browse endpoints (`/api/products`, `/api/categories`, `/api/catalog-feed`) have no rate limit

## Notes

- All prices are in ARS (Argentine Pesos) + IVA
- Product images are hosted on Zecat CDN
- The AI search uses Claude for natural language understanding
