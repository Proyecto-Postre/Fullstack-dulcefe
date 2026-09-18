---
tipo: adr
numero: 007
titulo: Adopción de Server-Sent Events (SSE) para Tiempo Real Unidireccional y Erradicación de Polling
fecha: 2026-09-18
estado: aceptado
relacionado:
  - "[[arquitectura-patrones]]"
  - "[[patron-tiempo-real-sse]]"
  - "[[ADR-002-guest-checkout-auth-hibrida]]"
---

# 🏛️ ADR-007: Adopción de Server-Sent Events (SSE) vs Polling HTTP y Supabase Realtime

## 1. Contexto & Problema
La aplicación requería reflejar cambios de estado en vivo en la pantalla de seguimiento de pedidos (`/pedido/[token]`), y a futuro en el KDS de cocina y alertas de stock en almacén.
La implementación previa utilizaba *polling* periódico cada 30 segundos (`setInterval`), lo que generaba consultas innecesarias y continuas a la base de datos de Supabase PostgreSQL, agotando cuotas y conexiones concurrentes.

Se evaluaron tres alternativas:
1. **Polling periódico con `setInterval`:** Sobrecarga innecesaria de base de datos, latencia de hasta 30 segundos y consumo de batería en móviles.
2. **Supabase Realtime (WebSockets propietarios):** Acopla fuertemente el proyecto al proveedor de nube Supabase (*vendor lock-in*), dificultando una eventual migración a infraestructura propia con PostgreSQL o MySQL.
3. **WebSockets puros (`ws://`):** Complejidad excesiva para un flujo estrictamente unidireccional (el cliente solo escucha cambios de estado, no envía mensajes en vivo).

## 2. Decisión Tomada
Adoptar **Server-Sent Events (SSE)** mediante el motor nativo de **Nuxt 4 / Nitro (`createEventStream`)** con un **bus de eventos desacoplado en memoria (`EventEmitter`)**.

### Razones Técnicas:
1. **Cero Vendor Lock-in:** Funciona sobre HTTP estándar (Node.js/Nitro) y no depende de ningún servicio o SDK privativo de Supabase ni de nubes externas.
2. **Cero Consultas en Reposo a Base de Datos:** Los eventos se despachan en memoria únicamente cuando ocurre una mutación de estado en los servicios (`OrderService.updateOrderStatus`).
3. **Reconexión Nativa Automática:** El navegador (`window.EventSource`) reconecta automáticamente en caso de microcortes de red móvil sin requerir librerías pesadas en el frontend.
4. **Heartbeats Integrados:** Emisión de `ping` cada 25 segundos para evitar que proxies inversos (Nginx, Cloudflare) cierren conexiones por inactividad.

## 3. Consecuencias
* **Impacto Positivo:**
  - Reducción del 100% de consultas recurrentes a la base de datos durante el seguimiento de pedidos.
  - Sincronización instantánea (< 50 ms) en la interfaz del cliente cuando el taller avanza el pedido.
  - Patrón reutilizable transversalmente para KDS, alertas de stock y notificaciones de administrador.
* **Consideración de Escalabilidad:**
  - En clúster multi-instancia (múltiples réplicas Docker de Nitro), el bus `EventEmitter` puede respaldarse con un adaptador Redis Pub/Sub sin alterar la API ni el frontend.
