---
tipo: api-endpoint
metodo: GET
ruta: /api/admin/audit/financial
autenticacion: true
rol_requerido: ADMIN
modulo: auditoria-financiera
fase: 8
---

# `GET` /api/admin/audit/financial

## Proposito
Consulta histórica y detallada de la auditoría financiera de órdenes (`orders`) que cuentan con escandallo congelado (`cost_snapshot`).
Permite auditar el desglose de ingresos totales, costo de bienes vendidos (COGS), costos indirectos (CIF), mano de obra (MOD) y margen de utilidad bruta real obtenido en céntimos por cada pedido despachado.

## Requisitos de Seguridad
* **Auth:** `requireAdmin(event)`

---

## Parametros de Query

| Parametro | Tipo | Requerido | Descripcion |
| :--- | :--- | :---: | :--- |
| `from` | `string (ISO)` | No | Fecha/hora inicial de rango (`created_at >= from`). |
| `to` | `string (ISO)` | No | Fecha/hora final de rango (`created_at <= to`). |
| `page` | `number` | No | Número de página (default: `1`). |
| `limit` | `number` | No | Registros por página (default: `20`, max: `100`). |

---

## Response

### `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 8491,
        "code": "DF-8491",
        "customer_name": "Valeria Silva",
        "customer_phone": "+51987654321",
        "total_amount": 8500,
        "payment_method": "yape",
        "payment_status": "verified",
        "status": "delivered",
        "total_cost_cents": 3420,
        "gross_margin_cents": 5080,
        "created_at": "2026-11-04T12:00:00Z",
        "cost_snapshot": {
          "items": [
            {
              "product_id": 1,
              "name": "Torta Tres Leches Clásica",
              "quantity": 1,
              "unit_price_cents": 8500,
              "cogs_materials_cents": 2200,
              "cogs_labor_cents": 720,
              "cogs_utilities_cents": 500
            }
          ]
        }
      }
    ],
    "total": 38,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

