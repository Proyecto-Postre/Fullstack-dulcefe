---
tipo: api-endpoint
metodo: GET
ruta: /api/admin/audit/kardex
autenticacion: true
rol_requerido: ADMIN
modulo: auditoria-kardex
fase: 8
---

# `GET` /api/admin/audit/kardex

## Proposito
Consulta paginada y filtrable del Kárdex oficial de movimientos de almacén (`inventory_movements`) de materias primas e insumos de taller.
Permite auditar ingresos por compras, quiebres atómicos por producción de órdenes, ajustes manuales y descartes por merma, calculando trazabilidad física y contable.

## Requisitos de Seguridad
* **Auth:** `requireAdmin(event)`
* **Bypass RLS:** Utiliza cliente administrativo con auditoría para consolidar insumos y materias primas.

---

## Parametros de Query

| Parametro | Tipo | Requerido | Descripcion |
| :--- | :--- | :---: | :--- |
| `materialId` | `number` | No | Filtra por ID específico de materia prima (`raw_material_id`). |
| `type` | `string` | No | Tipo de movimiento: `purchase`, `production_order`, `waste`, `manual_adjustment`, o `all`. |
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
        "id": 142,
        "raw_material_id": 5,
        "type": "production_order",
        "quantity": -250,
        "unit": "g",
        "reference_id": "df-ord-8491",
        "created_at": "2026-11-05T14:30:00Z",
        "notes": "Consumo por horneado de orden #DF-8491",
        "raw_materials": {
          "id": 5,
          "name": "Harina Pastelera Especial",
          "unit": "g",
          "type": "solid"
        }
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

