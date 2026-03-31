# GA4 + Funnel

## Variables

Definí en Vercel:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Setup de GA4

1. Crear una propiedad `Google Analytics 4`.
2. Crear un `Web data stream` para `https://diezypunto-web.vercel.app`.
3. Copiar el `Measurement ID`.
4. Agregarlo como `NEXT_PUBLIC_GA_MEASUREMENT_ID` en Vercel.
5. Redeploy del proyecto.

## Eventos ya instrumentados

- `page_view`
- `view_item`
- `add_to_cart`
- `remove_from_cart`
- `begin_checkout`
- `add_payment_info`
- `generate_lead`
- `share`

## Mapeo del funnel

- Vista de producto: `view_item`
- Agregado al carrito: `add_to_cart`
- Inicio de checkout: `begin_checkout`
- Selección de pago Mercado Pago: `add_payment_info`
- Lead por transferencia o WhatsApp de cotización: `generate_lead`

## Key Events recomendados en GA4

Marcar como `Key event`:

- `add_to_cart`
- `begin_checkout`
- `add_payment_info`
- `generate_lead`

## Looker Studio

1. Crear una fuente de datos `Google Analytics`.
2. Elegir la propiedad GA4 de Diez y Punto.
3. Armar una página de funnel con estas etapas:
   - `view_item`
   - `add_to_cart`
   - `begin_checkout`
   - `add_payment_info`
   - `generate_lead`
4. Agregar cortes por:
   - `Page path + query string`
   - `Device category`
   - `Session source / medium`
   - `Default channel group`

## Lectura del funnel

- Si cae mucho de `view_item` a `add_to_cart`, el problema suele estar en producto/precio/confianza.
- Si cae de `add_to_cart` a `begin_checkout`, el problema suele estar en fricción del carrito.
- Si cae de `begin_checkout` a `add_payment_info`, el problema suele estar en formulario o propuesta de pago.
- Si `generate_lead` pesa más que `add_payment_info`, la web está funcionando más como captación comercial que como checkout directo.

