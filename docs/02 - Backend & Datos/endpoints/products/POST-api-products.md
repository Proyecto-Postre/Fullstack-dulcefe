---
tipo: api-endpoint
metodo: POST
ruta: /api/products
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `POST` /api/products

## 🎯 Propósito
Crea y publica un nuevo postre en el catálogo general.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)` (JWT de Supabase con `is_admin: true`).

## 📥 Request (Payload)
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`
```json
{
  "name": "Cheesecake de Frutos Rojos",
  "price": 75.00,
  "stock": 8,
  "image_url": "https://[project].supabase.co/storage/v1/object/public/products/cheesecake.webp"
}
```

## 📤 Response
### ✅ `201 Created`
```json
{
  "id": 15,
  "name": "Cheesecake de Frutos Rojos",
  "price": 75.00,
  "stock": 8,
  "image_url": "https://[project].supabase.co/storage/v1/object/public/products/cheesecake.webp",
  "created_at": "2026-08-26T14:30:00.000Z"
}
```

## ❌ Manejo de Errores Comunes
* `400 Bad Request`: `name` o `price` ausentes en el cuerpo.
* `401 Unauthorized`: Token no provisto o sesión expirada.
* `403 Forbidden`: Usuario autenticado no tiene privilegios de administrador.
