# Patron de Enrutamiento del Panel de Administracion: Pestañas Reactivas vs Subrutas

**Proyecto:** Dulce Fe Fullstack  
**Fecha:** 2026-10-23  
**Estado:** Formalizado y en Produccion  
**Ubicacion:** `docs/03 - Arquitectura & UI/patron-enrutamiento-panel-admin-tabs-vs-rutas.md`

---

## 1. Contexto y Problematica

Durante la operacion del sistema y la integracion de notificaciones por correo electronico para administradores, se detecto que el boton "Gestionar en Panel de Administrador" dirigia a la URL:
`http://localhost:3000/admin/pedidos` (o su equivalente en produccion).

Al hacer clic, el navegador devolvia un **Error 404 ("Esta receta aun no sale del horno")**.

### Origen de la Discrepancia:
El panel administrativo de Dulce Fe no fue estructurado como un conjunto de subpaginas tradicionales basadas en carpetas (`app/pages/admin/pedidos/index.vue`), sino como una aplicacion de una sola vista (**Single-Page Application**) gobernada por pestañas sincronizadas con la URL mediante query params:
`/admin?tab=pedidos`, `/admin?tab=vitrina`, `/admin?tab=almacen`, `/admin?tab=escandallo`.

---

## 2. Comparativa Tecnica: Tabs con Query Params vs Subrutas

Para comprender la razon de este diseno y sus implicaciones tecnicas, se evaluaron ambos enfoques:

| Dimension | Pestañas con Query Params (`/admin?tab=...`) | Subrutas Jerarquicas (`/admin/pedidos`) |
| :--- | :--- | :--- |
| **Tiempo de transicion** | **Instantaneo (0 ms):** No hay recarga ni desmonte de la pagina. | Puede presentar micro-parpadeo o demoras al montar nuevos layouts. |
| **Persistencia de estado** | **Alta:** Si el operador escribe en un formulario o aplica filtros y cambia de pestaña, los datos en memoria se preservan. | **Baja:** Salir de la ruta destruye el componente a menos que se guarde en Pinia o localStorage. |
| **Consultas a la base de datos** | **Minimas:** Los catalogos de productos e insumos se cargan una sola vez al entrar al panel. | Se vuelven a consultar en cada montaje de pagina a menos que haya cache compleja. |
| **Carga inicial (Bundle)** | Mas pesada en la primera visita (descarga componentes de varias pestañas). | Mas ligera por pagina gracias a *code-splitting* automatico de Nuxt. |
| **Intuitividad de URLs** | Menos intuitiva para humanos (`/admin?tab=pedidos`). | Mas limpia y natural (`/admin/pedidos`). |
| **Control de acceso (RBAC)** | Requiere validaciones condicionales dentro del componente orquestador. | Permite adjuntar middlewares de ruta independientes por archivo. |

---

## 3. Solucion Hibrida Adoptada

En lugar de forzar una reescritura completa del panel que arriesgara la estabilidad de las 294 pruebas automatizadas, se implemento una **arquitectura hibrida y tolerante a fallos**:

### 3.1 Correccion en Enlaces Salientes
En el generador de correos de notificaciones transaccionales (`server/services/email-notification.service.ts`), la variable `adminFullUrl` fue actualizada para apuntar directamente a:
`${siteUrl}/admin?tab=pedidos`

### 3.2 Pagina Puente y Alias de Enrutamiento
Se creo el archivo `app/pages/admin/pedidos.vue` protegido con el layout administrativo y el middleware `admin-only`:
```vue
<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-only'
})

// Redireccion automatica y limpia al panel de pedidos
await navigateTo('/admin?tab=pedidos', { replace: true })
</script>
```
**Efecto:** Cualquier usuario o correo antiguo que acceda a `/admin/pedidos` es redirigido inmediatamente a la pestaña de pedidos sin experimentar nunca un error 404.

### 3.3 Regla de Redireccion en el Servidor Nitro
En `nuxt.config.ts`, se incorporo la directiva en `routeRules`:
```typescript
routeRules: {
  '/admin': { ssr: false },
  '/admin/pedidos': { redirect: '/admin?tab=pedidos' },
  '/admin/**': { ssr: false }
}
```

### 3.4 Control de Peticiones Redundantes en Cliente
Se erradicaron las consultas repetitivas a la tabla `addresses` de Supabase en `app/stores/auth.ts` mediante las banderas de control reactivas `hasFetchedAddresses` e `isFetchingAddresses`, garantizando que la consulta de autollenado en Checkout se ejecute una sola vez por sesion.

---

## 4. Criterio de Evolucion Futura

El diseno actual es optimo para la operacion agil de un administrador o repostero principal. Se recomienda evolucionar hacia la **Solucion B (Rutas hijas anidadas con `<NuxtPage />`)** unicamente si el negocio cumple una de las siguientes condiciones:

1. **Multi-rol con permisos estrictos (RBAC):** Cuando se contrate personal de almacén que tenga prohibido por contrato acceder a datos de facturacion, clientes o pedidos.
2. **Crecimiento masivo del modulo administrativo:** Cuando cada pestaña incorpore submodulos tan extensos que justifiquen su propio ciclo de vida y code-splitting granular.
