---
tipo: api-endpoint
metodo: GET
ruta: /api/admin/audit/events
autenticacion: true
rol_requerido: ADMIN
modulo: auditoria-eventos
fase: 8
---

# `GET` /api/admin/audit/events

## Proposito
Consulta la bitácora inmutable de eventos de auditoría del sistema (`audit_events`).
Registra todas las acciones administrativas críticas: creación y edición de pedidos, validación de pagos, mutaciones de recetas, borrado de insumos y cambios de estados de cocina.

## Requisitos de Seguridad
* **Auth:** `requireAdmin(event)`

---

## Parametros de Query

| Parametro | Tipo | Requerido | Descripcion |
| :--- | :--- | :---: | :--- |
| `entity` | `string` | No | Entidad afectada (`orders`, `raw_materials`, `recipes`, etc.). |
| `action` | `string` | No | Acción auditada (`create`, `update`, `delete`, `payment_verify`, etc.). |
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
        "id": "ae-901",
        "entity": "orders",
        "action": "payment_verify",
        "record_id": "8491",
        "actor_id": "usr-admin-1",
        "metadata": {
          "method": "yape",
          "previous_status": "pending_payment",
          "new_status": "payment_verified"
        },
        "created_at": "2026-11-05T15:10:00Z"
      }
    ],
    "total": 128,
    "page": 1,
    "limit": 20,
    "totalPages": 7
  }
}
```
