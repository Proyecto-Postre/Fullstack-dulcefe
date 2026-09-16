---
tipo: api-endpoint
metodo: GET
ruta: /api/admin/orders/:id/cost-snapshot
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `GET` /api/admin/orders/:id/cost-snapshot

## 🎯 Propósito
Congela u obtiene el snapshot inmutable del escandallo de costos (Cost of Goods Sold - COGS) para una orden específica ([[ADR-008-recipe-versioning]]).  
Calcula el costo exacto de los insumos en el instante de entrar a producción basándose en los precios de compra vigentes en ese momento. Esto garantiza que futuras variaciones o inflaciones en los precios de la harina o mantequilla no alteren la contabilidad histórica de pedidos pasados.

## 🔐 Requisitos de Seguridad
* **Auth:** Obligatorio (`requireAdmin(event)`).
* **Inmutabilidad:** Si la orden ya cuenta con un `cost_snapshot` previo, retorna el snapshot existente sin recalcular.

## 📥 Request

```http
GET /api/admin/orders/c1d2e3f4-a5b6-7890-abcd-ef1234567890/cost-snapshot HTTP/1.1
Host: dulcefe.pe
Authorization: Bearer <JWT_ADMIN>
```

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "order_id": "c1d2e3f4-a5b6-7890-abcd-ef1234567890",
    "total_cogs_cents": 1850,
    "gross_margin_cents": 4650,
    "items_breakdown": [
      {
        "product_id": 4,
        "product_name": "Torta Tres Leches",
        "quantity": 1,
        "unit_cogs_cents": 1850,
        "materials": [
          { "name": "Harina Pastelera", "quantity_used": 250, "unit": "gr", "cost_cents": 450 },
          { "name": "Leche Condensada", "quantity_used": 300, "unit": "gr", "cost_cents": 800 }
        ]
      }
    ]
  }
}
```
