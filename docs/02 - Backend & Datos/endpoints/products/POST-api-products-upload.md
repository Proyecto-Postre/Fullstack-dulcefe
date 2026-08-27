---
tipo: api-endpoint
metodo: POST
ruta: /api/products/upload
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `POST` /api/products/upload

## 🎯 Propósito
Sube archivos de imagen directamente al bucket `products` en Supabase Storage y retorna la URL pública permanente.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`.

## 📥 Request (Payload)
* **Headers:** `Content-Type: multipart/form-data`, `Authorization: Bearer <TOKEN>`
* **Body:** Form data con campo `file` (Buffer de imagen JPEG, PNG o WEBP).

## 📤 Response
### ✅ `200 OK`
```json
{
  "url": "https://[project].supabase.co/storage/v1/object/public/products/torta-chocolate-1724700000.webp"
}
```

## ❌ Manejo de Errores Comunes
* `400 Bad Request`: Archivo no adjunto o formato de imagen no permitido.
* `413 Payload Too Large`: Imagen supera el límite máximo permitido (5MB).
