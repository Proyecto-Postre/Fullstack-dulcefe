---
tipo: adr
numero: 002
titulo: Estrategia de Autenticación Híbrida y Guest Checkout (Sin Registro Obligatorio)
fecha: 2026-08-26
estado: aceptado
autores: Equipo de Desarrollo Dulce Fe
relacionado:
  - "[[plan-maestro]]"
  - "[[logica-negocio-pedidos]]"
  - "[[esquema-base-datos]]"
---

# 🏛️ ADR-002: Guest Checkout vs Registro Obligatorio de Usuarios

## 1. Contexto & Problema
En la venta de repostería artesanal, gran parte de los pedidos son por impulso o urgencia (celebraciones de último minuto, regalos de aniversario). Obligar a un cliente a crear usuario, contraseña y confirmar correo antes de pagar genera una fricción que descarta hasta el 40% de los carritos de compra.

---

## 2. Decisión Tomada
Se adopta una **Estrategia de Autenticación Híbrida**:
1. **Modo Invitado (Guest Checkout):** El cliente compra solo indicando Nombre, Teléfono (WhatsApp) y Dirección. La orden se registra con `profile_id = NULL` y se genera un token/código de rastreo público (ej: `DF-8492`).
2. **Modo Registrado (Fidelización):** Opcional al finalizar la compra. Permite login con 1 clic (Google Auth) para acumular "Puntos Dulce Fe" y guardar direcciones.
3. **Panel Admin:** Estrictamente protegido con autenticación obligatoria y Row Level Security (RLS) en PostgreSQL (`is_admin = true`).

---

## 3. Consecuencias
* **Impacto:** Máxima tasa de conversión de ventas en el E-Commerce sin comprometer la seguridad del panel administrativo.
