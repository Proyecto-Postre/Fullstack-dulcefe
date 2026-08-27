---
tipo: api-endpoint
metodo: POST
ruta: /api/products/upload
autenticacion: true
rol_requerido: ADMIN
estado: produccion
ultima_actualizacion: 2026-08-26
---

# ⚡ `POST` /api/products/upload

## 🎯 Propósito
Sube archivos de imagen directamente al bucket `product_images` en Supabase Storage tras validar su firma binaria (Magic Bytes) y retorna la URL pública permanente.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)` (Retorna 401 si no hay sesión, 403 si no es administrador).
* **Validación de Tamaño:** Máximo **2 MB** (`2,097,152` bytes).
* **Inspección Binaria (Magic Bytes):** Solo acepta `image/jpeg` (`FF D8 FF`), `image/png` (`89 50 4E 47...`) y `image/webp` (`RIFF...WEBP`). Cero confianza en extensiones del cliente.
* **Sanitización:** Genera ruta inmutable `products/<uuid>.<ext>` previniendo Path Traversal.

## 📥 Request (Payload)
* **Headers:** `Content-Type: multipart/form-data`, `Authorization: Bearer <TOKEN>`
* **Body:** Form data con campo `file` (Buffer de imagen JPEG, PNG o WebP).

## 📤 Response
### ✅ `200 OK`
```json
{
  "success": true,
  "url": "https://[project].supabase.co/storage/v1/object/public/product_images/products/550e8400-e29b-41d4-a716-446655440000.webp"
}
```

## ❌ Catálogo de Errores (§14.5)
```json
{
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Formato de imagen no permitido. Solo se aceptan archivos JPEG, PNG o WebP auténticos."
  }
}
```

* `401 Unauthorized` (`UNAUTHORIZED`): Petición anónima.
* `403 Forbidden` (`FORBIDDEN`): Usuario no cuenta con privilegios de administrador (`is_admin === false`).
* `400 Bad Request` (`NO_FILE_UPLOADED`): No se envió archivo en el formulario.
* `400 Bad Request` (`FILE_TOO_LARGE`): Archivo excede el tope de 2 MB.
* `400 Bad Request` (`INVALID_FILE_TYPE`): Magic Bytes no corresponden a JPEG, PNG o WebP.
* `500 Internal Server Error` (`STORAGE_UPLOAD_ERROR` / `INTERNAL_ERROR`): Falla al almacenar en Supabase Storage.
