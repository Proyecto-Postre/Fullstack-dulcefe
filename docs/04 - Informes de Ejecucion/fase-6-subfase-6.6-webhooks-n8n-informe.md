# Informe de Ejecución — Fase 6 / Subfase 6.6: Ecosistema de Webhooks Seguros para Automatización n8n (ADR-006 / D6 / Módulo E)

**Fecha de Ejecución:** 2026-09-06  
**Rama:** `feat/fase-06-restructuration_proyect`  
**Referencia SSOT:** `docs/decisions/ADR-006-webhook-dispatcher-n8n.md` y `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§7.5 Módulo E, §17.3, §20.6 D6)  
**Estado:** ✅ **Completado (10/10 Enterprise)**

---

## 1. Resumen de la Entrega

La **Subfase 6.6** resuelve la **Deuda Técnica D6 (ADR-006)** sobre automatizaciones externas e integración de eventos asíncronos con n8n, Make y servicios de mensajería. Establece una infraestructura de webhooks de salida (`WebhookService`) fuertemente tipada, firmada con criptografía HMAC-SHA256 (`X-DulceFe-Signature`), protegida contra ataques de repetición con timestamps canónicos y tolerante a fallos (fire-and-forget con timeout estricto de 4s), garantizando que las caídas o demoras de endpoints externos jamás degraden el rendimiento de compra del cliente ni las operaciones de taller.

---

## 2. Componentes Implementados

### 2.1 Criptografía y Firmas Digitales (`server/utils/crypto.ts`)
* **`generateWebhookSignature(payload, secret)`:**
  * Genera el resumen HMAC-SHA256 en formato hexadecimal de 64 caracteres en minúsculas.
* **`verifyWebhookSignature(payload, secret, receivedSignature)`:**
  * Comprueba la integridad y autenticidad del payload utilizando comparación en tiempo constante (`crypto.timingSafeEqual`) para prevenir vulnerabilidades de canal lateral (timing attacks).

### 2.2 Servicio de Despacho de Eventos (`server/services/webhook.service.ts`)
* **Cabeceras HTTP Canónicas:**
  * `X-DulceFe-Event`: Nombre formal del evento (`order.created`, `order.status_updated`, `order.cancelled`, `payment.verified`, `payment.rejected`).
  * `X-DulceFe-Delivery`: UUID v4 único por despacho para deduplicación e idempotencia en n8n.
  * `X-DulceFe-Timestamp`: Fecha y hora ISO 8601 del disparo.
  * `X-DulceFe-Signature`: Firma digital `sha256=<hex>` que n8n valida con su secreto compartido.
* **Resiliencia Operativa:**
  * Manejo con `AbortController` (timeout máximo de 4.000 ms).
  * Retorno limpio de booleano (`false`) en caso de red inalcanzable, registrando aviso en logs sin interrumpir la transacción principal de Nitro.
  * No-op automático si `N8N_WEBHOOK_URL` no está definida en el entorno.

### 2.3 Eventos Integrados en el Ciclo de Vida de Órdenes (`server/services/order.service.ts`)
* **`order.created`:** Disparado inmediatamente tras la creación de órdenes de checkout directo o WhatsApp, enviando datos de contacto, monto, URL de tracking y método de pago.
* **`order.status_updated` / `order.cancelled`:** Disparado al transicionar estados en `updateOrderStatus`.
* **`payment.verified` / `payment.rejected`:** Disparado al validar o rechazar comprobantes en `verifyPayment`.

---

## 3. Verificación de Calidad

* **Pruebas Unitarias:**
  * Archivo: `tests/unit/webhook-dispatcher.test.ts` (8 pruebas pasando al 100%).
  * Valida longitud y determinismo de HMAC-SHA256, detección de firmas adulteradas, prevención de timing attacks, fallback silencioso ante ausencia de variable de entorno y tolerancia total ante timeouts o caídas de n8n.
* **Linters & Typecheck:**
  * `npm run lint` ➔ 0 errores, 0 advertencias.
  * `npm run typecheck` ➔ 0 errores de compilación TypeScript.
* **Métricas de Tests:**
  * Total del proyecto: **168 / 168 pruebas aprobadas** en 27 suites de Vitest.
