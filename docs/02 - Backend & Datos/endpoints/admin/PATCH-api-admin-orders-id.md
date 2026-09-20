---
tipo: api-endpoint
metodo: PATCH
ruta: /api/admin/orders/:id
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `PATCH` /api/admin/orders/:id

## 🎯 Propósito
Permite al administrador editar la información de entrega, notas y datos del cliente (nombre y teléfono) asociados a una orden existente. Sincroniza automáticamente los datos de contacto con la tabla `profiles` si la orden está vinculada a un cliente registrado, registrando un evento en `audit_events`.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)` (JWT de Supabase con `is_admin: true` en `profiles`).
* **Cabeceras:** `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`.
* **Auditoría:** Registra `order.status` o modificación en `audit_events`.

---

## 📥 Request (Payload)
* **Parámetro URL:** `:id` (UUID de la orden).
* **Body:**
```json
{
  "customer_name": "Juan Pérez",
  "customer_phone": "987654321",
  "delivery_date": "2026-09-12",
  "delivery_time": "17:30",
  "notes": "Entregar en puerta principal"
}
```
*(También se admiten `full_name` y `phone` como alias para máxima compatibilidad con formularios existentes).*

---

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "e4299b84-4863-4c99-923f-42e5652516fa",
    "customer_name": "Juan Pérez",
    "customer_phone": "987654321",
    "delivery_date": "2026-09-12",
    "delivery_time": "17:30",
    "notes": "Entregar en puerta principal"
  }
}
```

---

## ❌ Manejo de Errores Comunes
* `400 Bad Request` (`VALIDATION_ERROR`): Body no es un JSON o ID ausente.
* `401 Unauthorized` (`UNAUTHORIZED`): Token JWT ausente o expirado.
* `403 Forbidden` (`FORBIDDEN`): El usuario no posee privilegios de administrador.
* `404 Not Found` (`NOT_FOUND`): La orden no existe.
* `500 Internal Server Error` (`INTERNAL_ERROR`): Fallo interno al actualizar la orden.
