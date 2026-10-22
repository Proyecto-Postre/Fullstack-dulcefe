---
tipo: informe-ejecucion
fase: Fase 8 — Hardening, Atelier & Experiencia Cliente
subfase: Notificaciones Transaccionales, Detección de Entornos y Política Cero Emojis
fecha: 2026-10-22
estado: Completado
tests_passing: 294/294 (100% green)
---

# Informe de Ejecución: Notificaciones Resend, Detección Unificada de Entornos y Política Cero Emojis

## 1. Contexto y Objetivos

En el marco de la puesta a punto para operaciones y despliegue en Vercel, se identificó la necesidad de:
1. Contar con un canal transaccional inmediato que notifique al administrador del taller cada vez que entra un pedido nuevo vía web, sin depender exclusivamente del pooling en el panel admin.
2. Resolver el riesgo operacional de despachar pedidos de prueba generados en desarrollo local o en despliegues de previsualización (Vercel Preview) confundiéndolos con pedidos de producción real.
3. Asegurar la resolución canónica de enlaces absolutos (`tracking_url` y accesos de administración) en entornos Vercel (`https://dulcefe.vercel.app`), previniendo fallbacks rotos a `localhost` en webhooks y correos.
4. Cumplir estrictamente la política institucional de **cero emojis** en código fuente, plantillas de correo, asuntos y mensajes de sistema.

---

## 2. Arquitectura de Componentes Implementados

### 2.1 Servicio de Notificación por Correo (`server/services/email-notification.service.ts`)
* **Proveedor:** Resend API REST (`https://api.resend.com/emails`) mediante `fetch` nativo con `AbortController` (timeout estricto de 6.000 ms).
* **Tolerancia a fallos:** El servicio nunca interrumpe el flujo de checkout. Si la clave `RESEND_API_KEY` no está presente o el servicio de correo experimenta fallos de conectividad, se registra el evento en logs de forma segura y el pedido se completa exitosamente en la base de datos.
* **Diseño Responsive:** Plantilla HTML estructurada con tablas y estilos CSS en línea probada para Gmail (Web/App), Outlook y clientes móviles. Incluye:
  - Encabezado con paleta editorial (#4A5D23 / #FAF8F3).
  - Selector visual de modalidad: Delivery a Domicilio vs Punto de Encuentro Acordado.
  - Tabla de detalle de productos, precios unitarios y subtotal en Soles (PEN).
  - Enlace directo preconfigurado para abrir conversación de WhatsApp con el cliente (`wa.me/51...`).
  - Botones de acción directa al panel administrativo y al enlace de seguimiento del pedido.

### 2.2 Motor de Detección de Entornos (`server/utils/environment.ts`)
Se centralizó la lógica de entornos en un módulo de utilidad con tipado estricto (`production` | `preview` | `development` | `test`):

```typescript
export function getAppEnvironment(): AppEnvironment {
  const explicitEnv = (process.env.APP_ENV || process.env.VERCEL_ENV || '').trim().toLowerCase()
  if (explicitEnv === 'production') return 'production'
  if (explicitEnv === 'preview' || explicitEnv === 'staging') return 'preview'
  if (explicitEnv === 'development' || explicitEnv === 'local' || explicitEnv === 'dev') return 'development'
  // Detección automática por contexto de ejecución
  if (process.env.NODE_ENV === 'test') return 'test'
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || ''
  if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) return 'development'
  return process.env.NODE_ENV === 'production' ? 'production' : 'development'
}
```

### 2.3 Matriz de Comportamiento por Entorno

| Entorno | Detección | Prefijo Asunto Email | Banner Superior en Correo | URL Canónica del Sitio |
|---|---|---|---|---|
| **Producción Real** | `APP_ENV=production` o `VERCEL_ENV=production` | *(Sin prefijo)* | *(Sin banner)* | `https://dulcefe.vercel.app` |
| **Vercel Preview** | `VERCEL_ENV=preview` | `[PREVIEW] ` | `AVISO: PEDIDO DE PRUEBA (ENTORNO VERCEL PREVIEW) — NO DESPACHAR EN TALLER` | `https://${VERCEL_URL}` |
| **Desarrollo Local** | `APP_ENV=development` o `localhost` | `[PRUEBA / DEV] ` | `AVISO: PEDIDO DE PRUEBA (ENTORNO LOCAL / DEV) — NO DESPACHAR EN TALLER` | `http://localhost:3000` |

### 2.4 Enriquecimiento de Webhooks (`server/services/webhook.service.ts`)
* Se agregó el campo `environment` en el envelope de cada evento (`WebhookEnvelope`).
* Se añadió la cabecera HTTP estándar `X-DulceFe-Environment` en cada despacho saliente.
* En `order.created`, se pasa el enlace de seguimiento absoluto canónico (`${canonicalSiteUrl}/pedido/${trackingToken}`) en vez de la ruta relativa, asegurando que plataformas externas (n8n, Make, bots de mensajería) dispongan de un enlace funcional.

---

## 3. Auditoría de Código y Erradicación de Emojis

Se ejecutó un escáner automático sobre la totalidad del árbol del proyecto identificando y saneando residuos de emojis:
* [email-notification.service.ts](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/server/services/email-notification.service.ts): Eliminados emojis de pastel, camión, marcador de mapa, globo de diálogo y advertencia.
* [app/stores/auth.ts](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/app/stores/auth.ts): Removido candado en comentario de regla S5.
* [server/api/products/upload.post.ts](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/server/api/products/upload.post.ts): Removidos candado y escudo en comentarios de validación.
* [server/api/raw-materials/index.get.ts](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/server/api/raw-materials/index.get.ts): Removido candado en comentario de guardia admin.
* [server/api/recipes/export.get.ts](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/server/api/recipes/export.get.ts): Removido candado en comentario de exportación Excel.

---

## 4. Aseguramiento de Calidad y Suite de Pruebas

Se diseñó la suite unitaria dedicada [tests/unit/environment.test.ts](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/tests/unit/environment.test.ts) que valida:
- Aislamiento e inmutabilidad de variables de entorno con `vi.resetModules()`.
- Detección de producción con `APP_ENV` y `VERCEL_ENV`.
- Detección de previsualizaciones y banners de alerta.
- Resolución de URL canónica de Vercel y fallbacks locales.

### Resumen de Verificación Técnica:
1. **Vitest Runner (`npm test`):** 42 suites, **294 tests passing**, 0 fallos.
2. **Validación de Tipos (`npm run typecheck`):** Nuxt Typecheck 100% limpio.
3. **Linter Estático (`npm run lint`):** ESLint 10 Flat Config pasando sin observaciones.
4. **Compilación de Producción (`npm run build`):** Salida compilada en `.output/server` (9.66 MB total, 2.57 MB gzip).
