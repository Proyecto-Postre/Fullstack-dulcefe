---
tipo: api-endpoint
metodo: GET
ruta: /api/admin/audit/waste
autenticacion: true
rol_requerido: ADMIN
modulo: auditoria-mermas
fase: 8
---

# `GET` /api/admin/audit/waste

## Proposito
Consulta histórica de registros de mermas y desperdicios físicos (`piece_waste_logs`) originados durante la preparación, horneado, porcionamiento o manipulación de piezas en taller.

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
        "id": 12,
        "recipe_yield_id": 4,
        "pieces_wasted": 3,
        "reason": "burned",
        "notes": "Horno a temperatura excesiva en lote matutino",
        "created_at": "2026-11-04T08:15:00Z",
        "recipe_yields": {
          "id": 4,
          "name": "Porción Torta Red Velvet",
          "base_recipes": {
            "id": 2,
            "name": "Masa Madre Red Velvet",
            "utilities_cost": 500,
            "labor_cost": 1200
          }
        }
      }
    ],
    "total": 14,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

