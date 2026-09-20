# 📡 GUÍA DE ARQUITECTURA: TIEMPO REAL CON SERVER-SENT EVENTS (SSE)
> **Patrón Oficial de Comunicación Unidireccional en Tiempo Real sin Vendor Lock-in**  
> **Proyecto:** Dulce Fe ERP & E-Commerce  
> **Ámbito:** Frontend (Vue 3 / EventSource) & Backend (Nuxt 4 / Nitro / H3 Event Stream)

---

## 1. Contexto y Justificación Arquitectónica

En una aplicación de comercio y gestión de taller pastelero como Dulce Fe, múltiples pantallas requieren sincronización en vivo ante eventos del servidor:
1. **Seguimiento del Cliente (`/pedido/[token]`):** Conocer si su pedido pasó a *En taller*, *Listo* o *Entregado*.
2. **Kitchen Display System (`/admin/kds`):** Visualizar comandas nuevas o cambios de recetas sin recargar la página.
3. **Panel de Gestión de Órdenes (`/admin/orders`):** Recibir alertas inmediatas cuando un cliente finaliza un checkout o adjunta un comprobante.
4. **Almacén & Materias Primas (`/admin/inventory`):** Disparar alertas de reposición inmediata cuando un ingrediente cae por debajo del stock mínimo.

### ¿Por qué NO Polling (`setInterval`)?
- **Golpe constante a la base de datos:** Si 100 clientes o 5 operarios mantienen pestañas abiertas consultando cada 15-30 segundos, generan miles de peticiones innecesarias a Supabase PostgreSQL, agotando conexiones activas y cuotas de red.
- **Latencia artificial:** El cliente solo se entera del cambio hasta que expira el intervalo (hasta 30s de retraso).
- **Consumo de batería y ancho de banda en móviles:** Mantener peticiones HTTP constantes agota la batería del cliente.

### Matriz Comparativa de Tecnologías en Tiempo Real

| Criterio | Polling HTTP (`setInterval`) | WebSockets (`ws://`) | Supabase Realtime | **Server-Sent Events (SSE)** ✅ |
|---|---|---|---|---|
| **Dirección** | Cliente ➔ Servidor (Pull) | Bidireccional (Full Duplex) | Servidor ➔ Cliente | **Servidor ➔ Cliente (Push Unidireccional)** |
| **Complejidad de Infraestructura** | Mínima | Alta (requiere servidor WS dedicado, socket state) | Media (depende de Postgres WAL/CDC) | **Baja (HTTP/1.1 o HTTP/2 estándar)** |
| **Vendor Lock-in** | Nulo | Nulo | **Alto (acoplado al ecosistema Supabase)** | **Nulo (estándar W3C abierto)** |
| **Impacto en BD** | Crítico (consultas repetitivas) | Nulo (si se gestiona en memoria) | Medio (hace streaming de WAL) | **Cero (se emite en memoria por evento)** |
| **Reconexión Automática** | Manual | Manual (código custom) | Manejada por SDK Supabase | **Nativa del Navegador (W3C EventSource)** |
| **Idóneo para Dulce Fe** | ❌ Desaconsejado | ❌ Excesivo (no hay chat P2P) | ⚠️ Riesgo si se migra de BD | **⭐ Elección Oficial y Estándar** |

---

## 2. Anatomía del Patrón SSE en Nuxt 4 / Nitro

El patrón consta de 4 capas desacopladas:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. CAPA DE EVENTOS (server/utils/*-events.ts)                           │
│    - Bus de eventos en memoria con EventEmitter (Node.js nativo)        │
│    - Define canales tipados (ej: order:token:xyz, kds:refresh, stock)   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. DISPARADORES DE DOMINIO (server/services/*.service.ts)              │
│    - Al ejecutarse una mutación (ej. updateOrderStatus), emite payload  │
├────────────────────────────────────────────────────────────────────────┤
│ 3. ENDPOINT STREAM NITRO (server/api/.../stream.get.ts)                 │
│    - createEventStream(event) de H3                                    │
│    - Envía headers 'text/event-stream', 'Cache-Control: no-cache'       │
│    - Heartbeat cada 25s (ping) para prevenir caídas por inactividad     │
│    - Limpieza automática en eventStream.onClosed                        │
├────────────────────────────────────────────────────────────────────────┤
│ 4. CONSUMO EN CLIENTE VUE 3 (app/pages/... o composables)             │
│    - new EventSource('/api/.../stream')                                │
│    - Escucha de eventos 'order_updated', refresca estado con useFetch   │
│    - Cierre seguro en onUnmounted                                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Implementación Paso a Paso para Nuevas Pantallas

Cualquier desarrollador o agente que necesite añadir tiempo real a otra sección del sistema debe seguir estos 3 pasos:

### Paso 1: Definir el Evento en el Bus de Servidor
En `server/utils/` (ej. `server/utils/order-events.ts` o un bus general):

```typescript
// server/utils/order-events.ts
import { EventEmitter } from 'node:events'

export const orderEvents = new EventEmitter()
orderEvents.setMaxListeners(500)

export interface OrderUpdatePayload {
  order_id: string
  tracking_token?: string | null
  status: string
  timestamp: string
}

export function notifyOrderUpdated(payload: OrderUpdatePayload): void {
  if (payload.tracking_token) {
    orderEvents.emit(`order:token:${payload.tracking_token}`, payload)
  }
  if (payload.order_id) {
    orderEvents.emit(`order:id:${payload.order_id}`, payload)
  }
  // Notificación global para pantallas admin / KDS
  orderEvents.emit('orders:any_updated', payload)
}
```

### Paso 2: Crear el Endpoint SSE en Nitro
Crea una ruta GET terminada en `/stream.get.ts`:

```typescript
// server/api/admin/orders/stream.get.ts
import { defineEventHandler, createEventStream } from 'h3'
import { requireAdmin } from '~/server/utils/require-admin'
import { orderEvents } from '~/server/utils/order-events'

export default defineEventHandler(async (event) => {
  // 1. Proteger acceso (si es administrativo)
  await requireAdmin(event)

  const eventStream = createEventStream(event)

  // 2. Notificar conexión exitosa
  await eventStream.push(JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString()
  }))

  // 3. Suscribirse a eventos
  const onUpdate = async (payload: any) => {
    try {
      await eventStream.push(JSON.stringify({
        type: 'order_updated',
        data: payload
      }))
    } catch {
      // Ignorar si el stream se cerró
    }
  }

  orderEvents.on('orders:any_updated', onUpdate)

  // 4. Heartbeat contra timeouts de proxy
  const pingTimer = setInterval(async () => {
    try {
      await eventStream.push(JSON.stringify({ type: 'ping' }))
    } catch {
      clearInterval(pingTimer)
    }
  }, 25000)

  // 5. Limpieza garantizada
  eventStream.onClosed(() => {
    clearInterval(pingTimer)
    orderEvents.off('orders:any_updated', onUpdate)
  })

  return eventStream.send()
})
```

### Paso 3: Consumir en el Componente Vue 3
En el script de tu componente o página:

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

let eventSource: EventSource | null = null

onMounted(() => {
  if (typeof window !== 'undefined' && 'EventSource' in window) {
    eventSource = new EventSource('/api/admin/orders/stream')

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'order_updated') {
          // Refrescar los datos reactivos del composable o useFetch
          refreshOrders()
        }
      } catch (err) {
        // Ignorar heartbeats o no-JSON
      }
    }
  }
})

onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
})
</script>
```

---

## 4. Estrategia de Escalabilidad a Multi-Servidor (Clúster)

Actualmente la aplicación corre en una sola instancia de servidor (monolito Nuxt Nitro), por lo que el `EventEmitter` en memoria es ultra-rápido (< 1 ms de latencia) y no consume recursos de red externos.

Si en el futuro la aplicación escala horizontalmente a múltiples réplicas detrás de un balanceador de carga (Load Balancer / Kubernetes), el desacoplamiento implementado permite sustituir el bus en memoria por un adaptador **Redis Pub/Sub** en una sola línea en `server/utils/order-events.ts`, **sin tocar ninguna línea de código del frontend ni de los endpoints**.
