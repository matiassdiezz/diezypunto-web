# Competitor Analytics

Snapshot único para comparar Diez y Punto contra:

- `merch.com.ar`
- `grupovelski.com`
- `kapoi.com.ar`

## Generación

```bash
npx tsx scripts/build-competitor-analytics.ts
```

El script deja:

- `analytics/latest.json`
- `analytics/snapshots/competitor-benchmark-YYYY-MM-DD.json`

## Dashboard

La ruta interna lee `analytics/latest.json` y expone:

- cantidad de artículos por sitio
- cobertura de precio público
- mediana y promedio por sitio
- comparación por categoría normalizada
- distribución de precios
- tabla de matches exactos, manuales y canónicos contra Diez y Punto
- explorador filtrable de catálogo

## Caveats

- `Merch` publica precio usable.
- `Grupo Velski` no publica precio consistente.
- `Kapoi` opera mayormente en modo presupuesto y puede usar placeholder técnico `ARS 1.00`.
- El matching entre sitios usa tres niveles:
  - exacto por título normalizado
  - manual por overrides curados para equivalencias de alta confianza
  - canónico por misma familia/categoría para variantes con medidas o sufijos menores
