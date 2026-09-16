---
tipo: api-endpoint
metodo: POST
ruta: /api/admin/orders/:id/verify-payment
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `POST` /api/admin/orders/:id/verify-payment

## 🎯 Propósito
Permite al administrador verificar o rechazar en 1-click el comprobante de pago (Yape/Plin/Transferencia) asociado a un pedido ([[ADR-005-payment-gateways]]).  
Al verificar:
- Actualiza `payment_status = 'verified'` y marca `payment_verified_at` con el timestamp actual y el `admin_id`.
- Transiciona la orden si corresponde y emite un evento auditable `payment.verified` a la bitácora inmutable `audit_events`.
- Dispara webhook firmado con HMAC-SHA256 a n8n para notificar al cliente vía WhatsApp.

## 🔐 Requisitos de Seguridad
* **Auth:** Obligatorio (`requireAdmin(event)`).
* **Auditoría:** Registro obligatorio en `audit_events`.

## 📥 Request

```http
POST /api/admin/orders/c1d2e3f4-a5b6-7890-abcd-ef1234567890/verify-payment HTTP/1.1
Host: dulcefe.pe
Authorization: Bearer <JWT_ADMIN>
Content-Type: application/json

{
  "action": "verify",
  "notes": "Voucher confirmado en cuenta BCP."
}
```

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "order_id": "c1d2e3f4-a5b6-7890-abcd-ef1234567890",
    "payment_status": "verified",
    "verified_at": "2026-09-15T21:00:00Z"
  }
}
```
