---
tipo: api-endpoint
metodo: GET
ruta: /api/auth/profile
autenticacion: true
rol_requerido: AUTHENTICATED
estado: produccion
---

# ⚡ `GET` /api/auth/profile

## 🎯 Propósito
Obtiene el perfil de usuario autenticado directamente desde la base de datos PostgreSQL (`public.profiles`). Retorna el nombre completo, teléfono, rol (`admin` / `customer`), puntos de fidelidad acumulados e indicador de permisos administrativos (`is_admin`).

## 🔐 Requisitos de Seguridad
* **Auth:** Obligatorio (`requireUser(event)`). Valida el token JWT de la sesión de Supabase Auth.
* **Resiliencia:** Normaliza el claim `user.id` o `user.sub` para compatibilidad completa entre entornos de servidor y cliente.
* **Acceso a Datos:** Consulta ejecutada con cliente administrativo de servidor para garantizar consistencia con las políticas RLS.

## 📥 Request
No requiere parámetros en la URL ni cuerpo. Requiere cookie o cabecera `Authorization: Bearer <JWT>`.

```http
GET /api/auth/profile HTTP/1.1
Host: dulcefe.pe
Authorization: Bearer eyJhbGciOi...
```

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "cliente@dulcefe.pe",
    "full_name": "María Torres",
    "phone": "987654321",
    "role": "customer",
    "is_admin": false,
    "points": 120,
    "created_at": "2026-09-01T12:00:00Z"
  }
}
```

### ❌ `401 Unauthorized`
```json
{
  "statusCode": 401,
  "statusMessage": "Unauthorized",
  "data": {
    "error": {
      "code": "AUTH_REQUIRED",
      "message": "Debes iniciar sesión para consultar tu perfil."
    }
  }
}
```

### ❌ `404 Not Found`
```json
{
  "statusCode": 404,
  "statusMessage": "Not Found",
  "data": {
    "error": {
      "code": "PROFILE_NOT_FOUND",
      "message": "Perfil de usuario no encontrado en la base de datos."
    }
  }
}
```
