---
tipo: api-endpoint
metodo: GET
ruta: /api/products
autenticacion: false
rol_requerido: PUBLIC
estado: produccion
---

# ⚡ `GET` /api/products

## 🎯 Propósito
Retorna el catálogo completo de postres y tortas disponibles para el storefront público de Dulce Fe y la lista de administración.

## 🔐 Requisitos de Seguridad
* **Auth:** 🌐 Acceso Público (No requiere token JWT).

## 📥 Request (Payload)
* **Headers:** `Accept: application/json`
* **Query Params:** Ninguno (obtiene todos los productos activos ordenados por ID).

## 📤 Response
### ✅ `200 OK`
```json
[
  {
    "id": 1,
    "name": "Torta Tres Leches Clásica",
    "price": 65.00,
    "stock": 10,
    "image_url": "https://[project].supabase.co/storage/v1/object/public/products/tres-leches.webp",
    "created_at": "2026-08-26T12:00:00.000Z"
  }
]
```

## ❌ Manejo de Errores Comunes
* `500 Internal Server Error`: Fallo de conexión con la base de datos Supabase.
