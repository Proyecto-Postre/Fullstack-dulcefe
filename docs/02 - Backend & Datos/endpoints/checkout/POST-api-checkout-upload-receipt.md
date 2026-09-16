---
tipo: api-endpoint
metodo: POST
ruta: /api/checkout/upload-receipt
autenticacion: false
rol_requerido: PUBLIC_OR_AUTHENTICATED
estado: produccion
---

# ⚡ `POST` /api/checkout/upload-receipt

## 🎯 Propósito
Permite subir el comprobante o voucher de pago de transferencias móviles (Yape o Plin) durante o después del proceso de checkout ([[ADR-005-payment-gateways]]).  
Garantiza la seguridad del almacenamiento mediante **inspección estricta de Magic Bytes** (evitando ataques de inyección por renombrado de extensiones `.exe`/`.sh` a `.jpg`) y un límite máximo de tamaño de **2 MB**.

## 🔐 Requisitos de Seguridad
* **Auth:** Pública / Invitados permitidos.
* **Inspección de Magic Bytes:** Validación binaria de cabeceras JPEG (`FF D8 FF`), PNG (`89 50 4E 47`) y WebP (`RIFF...WEBP`).
* **Límite de Tamaño:** Máximo 2 MB por archivo.
* **Almacenamiento:** Bucket seguro `payment-receipts` de Supabase Storage con políticas RLS de acceso restringido.
* **Nombre de Archivo Sanitizado:** Renombrado automático a `voucher-<UUIDv4>.<ext>`, neutralizando ataques de Directory Traversal o inyecciones de nombre.

## 📥 Request (Multipart Form-Data)

```http
POST /api/checkout/upload-receipt HTTP/1.1
Host: dulcefe.pe
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="file"; filename="yape_comprobante.jpg"
Content-Type: image/jpeg

<DATOS BINARIOS DE LA IMAGEN>
------WebKitFormBoundary...--
```

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "url": "https://supabase.dulcefe.pe/storage/v1/object/public/payment-receipts/voucher-9f8a7b6c-5d4e-3f2a-1b0c-9d8e7f6a5b4c.jpg",
    "fileName": "voucher-9f8a7b6c-5d4e-3f2a-1b0c-9d8e7f6a5b4c.jpg"
  }
}
```

### ❌ `400 Bad Request`
Archivo corrupto, extensión no soportada o archivo mayor a 2 MB.
