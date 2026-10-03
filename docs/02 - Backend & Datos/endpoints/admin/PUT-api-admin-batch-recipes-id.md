---
tipo: api-endpoint
metodo: PUT
ruta: /api/admin/batch-recipes/:id
autenticacion: true
rol_requerido: ADMIN
modulo: tandas-maestras
fase: 7
---

# ⚡ `PUT` /api/admin/batch-recipes/:id

## 🎯 Propósito
Actualiza atómicamente la cabecera, ingredientes y rendimientos de una tanda maestra existente. Sincroniza la lista de insumos y rendimientos reemplazando las relaciones previas.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`
* **Auditoría:** Registra `batch_recipe.update` en `audit_events`.

---

## 📥 Request Body
Mismo esquema que `POST /api/admin/batch-recipes`, con soporte opcional de identificadores de ítems y rendimientos existentes.

---

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tanda Masa Alfajores Clásicos (Ajustada)",
    "updated_at": "2026-09-24T12:00:00Z"
  }
}
```
