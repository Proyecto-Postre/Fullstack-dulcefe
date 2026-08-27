---
tipo: api-endpoint
metodo: GET
ruta: /api/raw-materials
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `GET` /api/raw-materials

## 🎯 Propósito
Lista todos los insumos y materias primas del almacén con sus datos de costeo por volumen y stock actual según [[formulas-costeo]].

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)` (Protegido por [[ADR-003-seguridad-rls-supabase-hardening]]).

## 📥 Request (Payload)
* **Headers:** `Authorization: Bearer <TOKEN>`

## 📤 Response
### ✅ `200 OK`
```json
[
  {
    "id": 1,
    "name": "Harina Pastelera Especial",
    "unit": "kg",
    "purchase_price": 45.00,
    "purchase_quantity": 10.0,
    "stock": 25.5,
    "created_at": "2026-08-26T08:00:00.000Z"
  }
]
```

## ❌ Manejo de Errores Comunes
* `401 Unauthorized`: Token no válido.
* `403 Forbidden`: Solo el administrador puede auditar costos de materias primas.
