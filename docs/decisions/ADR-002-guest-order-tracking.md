# ADR-002: Arquitectura de Seguimiento de Pedidos para Invitados Mediante Tokens Criptográficos (Deuda D2)

* **Estado:** Aceptado / Postergado
* **Fecha:** 2026-09-06
* **Decisores:** Equipo de Arquitectura Dulce Fe
* **Referencia SSOT:** `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§10.5, §14.1, §20.5 D2)

---

## 1. Contexto y Problema

El flujo de compra permite pedidos como invitado (`profile_id = null`). Sin embargo, un cliente invitado requiere consultar el estado de su orden (si está en preparación, listo o en camino) sin tener credenciales ni cuenta registrada en Supabase Auth.

Permitir consultas públicas a `orders` por ID secuencial o UUID directo expondría la base de datos a ataques de enumeración (IDOR) y filtración de datos de entrega (dirección, nombre y teléfono).

---

## 2. Factores Decisivos (Decision Drivers)

1. **Privacidad y RLS:** La tabla `orders` prohíbe el acceso público anónimo tras el corte de seguridad S9.
2. **Minimización de PII:** La pantalla de seguimiento no debe revelar datos personales a terceros con enlaces compartidos.
3. **No Bloqueo del Monolito:** El checkout y la venta funcionan completamente enviando el resumen y confirmación por WhatsApp.

---

## 3. Opciones Consideradas

* **Opción A:** Permitir lectura pública de `orders` filtrando por UUID en la URL. *(Descartada por riesgo IDOR).*
* **Opción B:** Exigir creación obligatoria de cuenta para comprar. *(Descartada por fricción en tasa de conversión).*
* **Opción C (Adoptada):** Mantener el seguimiento vía confirmación directa en WhatsApp en Fase 3–5, y diseñar para el futuro una ruta pública `/pedido/[token]` gobernada por un token efímero de consulta (`HMAC-SHA256`).

---

## 4. Decisión Adoptada

Se adopta la **Opción C**. 
* En el refactor actual, el cliente invitado recibe el ID de orden y el enlace de contacto con WhatsApp con los detalles verificados por el servidor.
* La ruta `/pedido/[token]` se posterga formalmente como deuda técnica D2. Cuando se desarrolle, el backend generará un token firmado que permitirá a la API `/api/orders/track` devolver únicamente el estado logístico de la orden (`status`, `delivery_date`, `items.name`), sin exponer nombres ni direcciones completas.

---

## 5. Consecuencias

### Positivas
* Se previene la apertura de agujeros de seguridad en las políticas RLS de Supabase.
* No se añaden tablas ni columnas no utilizadas durante el refactor de arquitectura.

### Negativas / Deuda Técnica
* El usuario invitado debe consultar el avance de su entrega a través del canal de atención de WhatsApp.

---

## 6. Condiciones de Reapertura

Se reabrirá como feature de producto del Plan Maestro cuando se implemente la pantalla pública de tracking en el frontend.
