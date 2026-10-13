---
tipo: api-endpoint
metodo: GET
ruta: /api/admin/categories
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `GET` /api/admin/categories

## 🎯 Propósito
Retorna el listado completo de categorías registradas en la base de datos (tanto activas como inactivas), ordenadas por `sort_order`, para su administración en el módulo ERP `/admin?tab=categorias`.

## 🔐 Requisitos de Seguridad
* **Auth:** Obligatoria (`requireAdmin(event)`).
* **Rol:** Exclusivo para administradores validados por Supabase Service Role.

## 📥 Request
```http
GET /api/admin/categories HTTP/1.1
Host: dulcefe.pe
Authorization: Bearer <ADMIN_TOKEN>
```

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "tortas",
      "name": "Tortas & Pasteles",
      "icon": "lucide:cake",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2026-10-12T16:00:00Z"
    },
    {
      "id": "tartaletas",
      "name": "Tartaletas & Pies",
      "icon": "lucide:sparkles",
      "sort_order": 2,
      "is_active": true,
      "created_at": "2026-10-12T16:00:00Z"
    }
  ]
}
```
