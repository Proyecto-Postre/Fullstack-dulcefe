# ADR-005: Desacople de Pasarelas de Pago: Canal WhatsApp vs Pasarelas Electrónicas Integradas (Deuda D5)

* **Estado:** Aceptado / Postergado
* **Fecha:** 2026-09-06
* **Decisores:** Equipo de Arquitectura Dulce Fe
* **Referencia SSOT:** `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§10.5, §14.1, §20.5 D5)

---

## 1. Contexto y Problema

El Plan Maestro contempla a futuro el cobro mediante billeteras digitales peruanas (Yape, Plin) y tarjetas de crédito/débito. En el modelo operativo vigente de Dulce Fe, el cobro se realiza principalmente mediante interacción conversacional por WhatsApp, donde el cliente envía la constancia de transferencia o pago contra entrega.

Integrar de forma apresurada SDKs de pasarelas de pago externas (Culqi, Niubiz, MercadoPago o Stripe) antes de consolidar el ciclo de vida de pedidos y la seguridad de datos comprometería el alcance del refactor de arquitectura.

---

## 2. Factores Decisivos (Decision Drivers)

1. **Alineación con el Canal Actual:** Gran parte de los clientes prefieren acordar personalizaciones y coordinar el pago vía WhatsApp.
2. **Cero Manipulación de Precios:** Sin importar la pasarela o canal, el monto total cobrado debe ser inmutablemente calculado por el backend (`order.service.ts`), sin tolerar manipulación desde el navegador.
3. **Desacoplamiento Tecnológico:** El servicio de pedidos no debe estar acoplado a la API de ninguna pasarela específica.

---

## 3. Opciones Consideradas

* **Opción A:** Integrar pasarelas de pago bancarias directamente en el checkout de Fase 3. *(Descartada: fuera de alcance de arquitectura, retrasa la entrega y añade dependencias externas).*
* **Opción B (Adoptada):** Mantener el canal de confirmación por WhatsApp en el checkout (`POST /api/checkout` genera la orden, calcula el total exacto en céntimos y devuelve el DTO con el que se formatea el mensaje oficial), abstrayendo el flujo bajo el concepto de canal (`channel: 'direct' | 'whatsapp_chat'`).

---

## 4. Decisión Adoptada

Se adopta la **Opción B**. 
* En el refactor de arquitectura, el checkout persiste la orden en estado `pending`, valida la idempotencia y genera el mensaje de WhatsApp estructurado con los precios verificados del servidor.
* La integración de pasarelas electrónicas automáticas se formaliza como deuda D5. Se diseña la arquitectura para que en el futuro un webhook de pago (`/api/webhooks/payment`) invoque directamente al servicio de pedidos sin alterar los contratos actuales.

---

## 5. Consecuencias

### Positivas
* El flujo comercial actual de la pastelería se mantiene sin fricciones para los clientes recurrentes.
* La lógica monetaria en céntimos y los contratos HTTP quedan perfectamente preparados para admitir webhooks de pago automatizados.

### Negativas / Deuda Técnica
* La confirmación del abono depende de la verificación manual del comprobante por parte del equipo de atención.

---

## 6. Condiciones de Reapertura

Esta decisión se reabrirá como una feature de producto cuando la gerencia contrate un agregador de pagos y se defina la política de comisiones financieras.
