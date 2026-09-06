---
tipo: api-endpoint
metodo: POST
ruta: /api/v1/ejemplo
autenticacion: true
rol_requerido: ADMIN
estado: backlog
---

# ⚡ `{{metodo}}` {{ruta}}

## 🎯 Propósito
Descripción de lo que realiza este endpoint.

## 🔐 Requisitos de Seguridad
- **Auth:** `requireAdmin` / `requireUser`

## 📥 Request (Payload)
```json
{
  "campo": "valor"
}
```

## 📤 Response
```json
{
  "success": true,
  "data": {}
}
```
