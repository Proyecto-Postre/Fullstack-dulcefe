# Informe de Ejecución — Fase 6 / Subfase 6.1: Tracking Criptográfico de Invitados (ADR-002 / D2)

**Fecha de Ejecución:** 2026-09-06  
**Rama:** `feat/fase-06-restructuration_proyect`  
**Referencia SSOT:** `docs/01 - Estrategia & Negocio/plan-maestro.md` (§5.5) y `docs/decisions/ADR-002-guest-order-tracking.md`  
**Estado:** ✅ **Completado (10/10 Enterprise)**

---

## 1. Resumen de la Entrega

La **Subfase 6.1** materializa la resolución de la **Deuda Técnica D2 (ADR-002)**, permitiendo a clientes que realizan pedidos en modo invitado consultar en tiempo real el progreso de su orden sin requerir cuenta, login ni contraseñas, protegiendo estrictamente la privacidad y evitando vulnerabilidades de enumeración o IDOR.

---

## 2. Componentes Implementados

### 2.1 Migración de Base de Datos
* **Archivo:** `supabase/migrations/20260907000001_phase6_guest_tracking.sql`
* Se agregó la columna `tracking_token VARCHAR(64) UNIQUE` a la tabla `orders` junto a su índice B-Tree `idx_orders_tracking_token`.
* Se preservaron las políticas RLS: los clientes anónimos no tienen acceso directo a la tabla `orders`, canalizando toda lectura a través del backend Nitro.

### 2.2 Motor Criptográfico
* **Archivo:** `server/utils/crypto.ts`
* Generación de tokens deterministas HMAC-SHA256 de 64 caracteres hexadecimales derivados del `order_id`, `created_at` y sal criptográfica (`generateOrderTrackingToken`).
* Validación estricta de formato mediante regex `/^[a-f0-9]{64}$/` (`isValidTrackingTokenFormat`).

### 2.3 Contrato de Servicio y Creación de Órdenes
* **Archivo:** `server/services/order.service.ts`
* Tanto `createOrder` como `createAdminOrder` generan y persisten automáticamente el `tracking_token`.
* El DTO de respuesta `CheckoutResponseOrder` expone `tracking_token` y `tracking_url` (`/pedido/${trackingToken}`).

### 2.4 Endpoint de Seguimiento Público y Saneamiento de PII (Ley 29733)
* **Archivo:** `server/api/orders/track/[token].get.ts`
* **Protección de Datos:**
  * Extrae únicamente el primer nombre (`customer_first_name`) para el saludo personalizado.
  * Omite terminantemente: `customer_phone`, `address`, `notes`, `profile_id` y montos financieros.
* Devuelve la línea de tiempo operativa calculada dinámicamente:
  1. *Pedido Registrado* (`pending`)
  2. *En Taller / Horneado* (`processing`)
  3. *Listo para Entrega* (`ready`)
  4. *Entregado* (`delivered`)

### 2.5 Interfaz de Usuario Reactiva
* **Archivo:** `app/pages/pedido/[token].vue`
* Diseño artesanal cálido adaptado al sistema de diseño de Dulce Fe.
* Stepper visual responsivo con progreso, estados activos con animación de pulso y badges de estado.
* Polling inteligente cada 30 segundos sincronizado con la *Page Visibility API* (se suspende si la pestaña está en segundo plano).
* Botón contextual de WhatsApp con el `#short_id` inyectado para soporte directo con el taller.
* Accesibilidad WCAG 2.1 AA (`role="status"`, `aria-live="polite"`).

---

## 3. Verificación de Calidad

* **Tipado:** 0 errores en `npm run typecheck`.
* **Linting:** 0 errores, 0 warnings en `npm run lint`.
* **Pruebas Unitarias:** Nueva suite `tests/unit/order-tracking.test.ts` con 8 pruebas unitarias pasando al 100%. Total del proyecto: **130 / 130 tests pasando** en 22 suites.
