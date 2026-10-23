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

## 4. Hoja de Ruta de Evolucion a Futuro: Multi-Rol (RBAC) y Rutas Anidadas

Cuando el equipo de Dulce Fe incorpore colaboradores con distintas responsabilidades (pasteleros, encargados de despacho, atencion al cliente o contabilidad), el panel debera migrar de forma planificada del modelo de pestañas unificadas al modelo de **subrutas jerarquicas con control de acceso basado en roles (RBAC)**.

A continuacion se documenta la especificacion tecnica lista para implementar en esa etapa:

---

### 4.1 Definicion de Roles y Matriz de Permisos del Negocio

Se recomienda implementar un enum de roles en la base de datos PostgreSQL (`user_role`):

| Rol de Usuario | Vistas Permitidas | Vistas Restringidas | Descripcion Operativa |
| :--- | :--- | :--- | :--- |
| **`superadmin`** (Dueño / Gerente) | Todas (`dashboard`, `pedidos`, `vitrina`, `almacen`, `recetas`, `kds`) | Ninguna | Acceso total financiero, creacion de productos, edicion de margenes y administracion de usuarios. |
| **`chef`** (Jefe de Taller / Pastelero) | `kds`, `almacen` (insumos), `recetas` (tandas y mermas) | `dashboard` financiero, clientes y pedidos con pagos | Gestion de comandas en vivo, registro de horneado y descargo de materias primas. |
| **`logistics`** (Despacho / Motorizado) | `pedidos` (estados de entrega y tracking), `kds` | `recetas`, `almacen`, `dashboard` financiero | Visualizacion de direcciones de envio, puntos de encuentro y cambio a estado "entregado". |
| **`sales`** (Atencion al Cliente / Counter) | `vitrina` (stock y porciones), `pedidos` (verificacion de pagos y WhatsApp) | Costeo de escandallo, CIF y margenes confidenciales | Soporte directo al cliente, toma de pedidos manuales y validacion de comprobantes Yape/Plin. |

---

### 4.2 Arquitectura de Rutas Anidadas en Nuxt (`<NuxtPage />`)

Para mantener la navegacion fluida sin recargas completas de pantalla (SPA) y al mismo tiempo tener URLs limpias y permisos aislados, se utilizara la directiva `<NuxtPage />` con la siguiente estructura de archivos:

```text
app/pages/admin.vue                     <-- Layout padre que renderiza el sidebar y <NuxtPage />
app/pages/admin/index.vue               <-- Redirige automaticamente segun el rol del usuario
app/pages/admin/dashboard.vue           <-- Solo superadmin
app/pages/admin/pedidos/index.vue       <-- superadmin, sales, logistics
app/pages/admin/pedidos/[id].vue        <-- Detalle profundo de orden
app/pages/admin/vitrina.vue             <-- superadmin, sales
app/pages/admin/almacen.vue             <-- superadmin, chef
app/pages/admin/recetas.vue             <-- superadmin, chef
app/pages/admin/kds.vue                 <-- superadmin, chef, logistics
```

#### Ventajas del Layout Padre `app/pages/admin.vue`:
Al navegar entre `/admin/pedidos` y `/admin/almacen`, Nuxt **no vuelve a cargar el sidebar ni la cabecera**. Solo sustituye el contenido interior dentro de `<NuxtPage />`, conservando la velocidad instantánea de la aplicacion actual pero con las ventajas del code-splitting por ruta.

---

### 4.3 Middleware de Servidor y Cliente para Validacion de Rol (`role-guard`)

En lugar de verificar permisos con `v-if` en la interfaz (lo cual es inseguro), la proteccion se delega a un middleware de Nuxt:

```typescript
// app/middleware/role-guard.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) {
    return navigateTo('/login')
  }

  const userRole = authStore.profile?.role || 'customer'
  const requiredRoles = to.meta.allowedRoles as string[] | undefined

  if (requiredRoles && !requiredRoles.includes(userRole)) {
    // Si no tiene permisos, se le redirige a su seccion por defecto
    const defaultRouteByRole: Record<string, string> = {
      chef: '/admin/kds',
      logistics: '/admin/pedidos',
      sales: '/admin/vitrina'
    }
    return navigateTo(defaultRouteByRole[userRole] || '/')
  }
})
```

Y en cada pagina individual se declara de forma declarativa:
```vue
<!-- app/pages/admin/recetas.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin-only', 'role-guard'],
  allowedRoles: ['superadmin', 'chef']
})
</script>
```

---

### 4.4 Seguridad en Base de Datos (PostgreSQL RLS)

Para blindar la seguridad a nivel de datos (Security Rule S5):
1. **Politica RLS:** La tabla `profiles` debe incluir la columna `role` restringida mediante CHECK:
   ```sql
   ALTER TABLE public.profiles 
   ADD COLUMN role text NOT NULL DEFAULT 'customer' 
   CHECK (role IN ('customer', 'superadmin', 'chef', 'logistics', 'sales'));
   ```
2. **Endpoints Nitro:** Cada endpoint de servidor (`server/api/admin/...`) debe validar la identidad y el rol usando la funcion `requireUserRole(event, ['superadmin', 'chef'])`, impidiendo que un usuario con rol de `logistics` pueda manipular precios de insumos mediante llamadas directas a la API.

---

### 4.5 Pistas de Auditoria Operativa (`audit_logs`)

Cuando operan multiples personas, es mandatorio saber quien ejecuto cada cambio critico. Se debe registrar en una tabla `admin_audit_logs`:
- Usuario que ejecuto la accion (`user_id`).
- Tipo de accion (`order.status_change`, `inventory.waste_declaration`, `price.update`).
- Valor anterior y valor nuevo en formato JSONB.
- Direccion IP y fecha exacta con timestamp UTC.
