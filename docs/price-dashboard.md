# Price Dashboard

## Objetivo

Armar una fuente mensual para Looker Studio que compare el precio de Diez y Punto con competidores sobre productos comparables por nombre.

## Competidores iniciales

- `grupovelski.com`
- `merch.com.ar`
- `kapoi.com.ar`
- `focuslogo.com.ar`

## Hallazgos iniciales

### Sitios con precio público utilizable

- `merch.com.ar`: publica precio visible en listados y aclara `+ IVA`.
- `focuslogo.com.ar`: publica precio visible en listados de categoría.

### Sitios con riesgo alto para comparación de precio

- `grupovelski.com`: el catálogo público expone productos, pero en las páginas relevadas no aparece precio; predomina `contactanos`.
- `kapoi.com.ar`: varios productos muestran `Agregar a presupuesto` y en algunos casos aparece `$1.00`, que no es un precio competitivo usable.

## Regla de matching MVP

Comparar solo productos con nombre comparable.

Regla recomendada:

1. Normalizar título:
   - minúsculas
   - sin tildes
   - sin signos
   - espacios colapsados
2. Exigir coincidencia exacta del título normalizado.
3. Usar categoría como control adicional cuando esté disponible.

No usar matching semántico ni difuso en el MVP. Sube cobertura, pero también mete falsos positivos.

## Riesgo de comparabilidad

No todos los sitios publican precios con la misma base:

- `merch.com.ar` expone `+ IVA`.
- otros sitios pueden publicar precio final, precio desde, o precio sin personalización.

Por eso el dataset debe guardar estas banderas:

- `price_basis`: `final`, `plus_vat`, `from_price`, `unknown`
- `includes_personalization`: `true`, `false`, `unknown`
- `currency`: `ARS`

Sin esto, el dashboard puede mostrar diferencias engañosas.

## Dataset mensual para Looker

Grano recomendado: una fila por `mes + producto_diezypunto + competidor`.

Columnas:

- `snapshot_month`
- `snapshot_at`
- `our_product_id`
- `our_product_title`
- `our_category`
- `our_product_url`
- `our_price_ars`
- `our_price_basis`
- `competitor_domain`
- `competitor_product_title`
- `competitor_product_url`
- `competitor_category`
- `competitor_price_ars`
- `competitor_price_basis`
- `title_match_key`
- `match_type`
- `price_gap_ars`
- `price_gap_pct`
- `coverage_status`

Valores sugeridos para `coverage_status`:

- `matched_with_price`
- `matched_without_price`
- `no_title_match`
- `price_placeholder`
- `fetch_error`

## Dashboard en Looker Studio

### Página 1: Resumen ejecutivo

- cobertura total de matching
- cantidad de productos comparados por competidor
- mediana de brecha de precio por competidor
- porcentaje de productos donde Diez y Punto está:
  - más barato
  - alineado
  - más caro

### Página 2: Tabla operativa

Filtros:

- mes
- competidor
- categoría
- estado de cobertura

Columnas visibles:

- producto
- categoría
- precio Diez y Punto
- precio competidor
- diferencia ARS
- diferencia %
- competidor
- link al producto

### Página 3: Evolución mensual

- evolución de cobertura por competidor
- evolución de brecha mediana por competidor
- top productos con mayor cambio de brecha vs mes anterior

## Recomendación de MVP

Para el primer corte mensual:

- incluir `merch.com.ar`
- incluir `focuslogo.com.ar`
- dejar `grupovelski.com` y `kapoi.com.ar` fuera del benchmark principal hasta encontrar precio público consistente

Si igual se quieren mostrar:

- tratarlos como cobertura parcial
- no incluirlos en KPIs agregados de precio
- exponerlos en una tabla separada de "competidores sin precio público consistente"

## Entregable técnico recomendado

1. Script que genere un CSV mensual plano para Looker.
2. Snapshot guardado en `reports/`.
3. Un segundo archivo JSON con métricas de cobertura y errores.
4. Importación manual mensual a Google Sheets o archivo cargado a una fuente estable para Looker Studio.

## Siguiente implementación

Construir el pipeline en este orden:

1. dataset mensual Diez y Punto vs `merch.com.ar`
2. sumar `focuslogo.com.ar`
3. agregar banderas de base de precio
4. recién después evaluar `grupovelski.com` y `kapoi.com.ar`

## Uso actual

Primer exportador implementado:

```bash
npm run price-dashboard:merch
```

Salidas:

- `reports/price-dashboard-merch-com-ar-YYYY-MM.csv`
- `reports/price-dashboard-merch-com-ar-YYYY-MM-summary.json`

Opcional:

```bash
npm run price-dashboard:merch -- --snapshot-month=2026-03
```
