# Plan maestro de arquitectura — Dulce Fe

**Estado:** SSOT de arquitectura de código (sustituye cualquier borrador previo de este archivo y a `docs/architecture-refactor-addendum-10-10.md`).  
**Ámbito:** refactor del monolito Nuxt 4 existente. No es un segundo plan de producto.  
**Fuera de alcance:** KDS, n8n, BI, Custom Cake Builder, Redis, Meilisearch, microservicios, RBAC de cuatro roles.  
**Operación:** los contratos para ejecutar sin inventar (secretos, DTOs, stock, corte S9, dinero exacto, idempotencia, inventario auditable, red, tipos, Storage, PII, tests, PRs y checklist) viven en §14–§20. No son un segundo plan; son el cierre de este.

Este documento es el único lugar donde se decide *cómo se organiza el código*. El producto vive en `docs/plan-maestro.md`. El diseño visual vive en `docs/design-system-tokens.md`. El costeo vive en `docs/formulas-costeo.md`. `docs/architecture-refactor-addendum-10-10.md` es historial; no se ejecuta.

---

## 1. Propósito

Ordenar Dulce Fe para que pueda crecer en funcionalidades, usuarios y equipo sin convertirse en un conjunto de páginas enormes que dependen unas de otras de manera accidental.

El objetivo no es separar archivos por separar ni imitar Angular. El objetivo es que cada parte del sistema tenga una responsabilidad evidente, límites claros y un lugar predecible donde añadir una nueva funcionalidad.

Los `any`, estilos repetidos, componentes extensos y consultas directas son síntomas. Se resuelven dentro de esta arquitectura; no son el centro del refactor.

**Qué cierra este plan**

- Seguridad real (API + RLS), no solo middleware de ruta.
- Frontera cliente/servidor para dinero, inventario y permisos.
- Aritmética monetaria exacta, transiciones atómicas, idempotencia concurrente y libro de inventario.
- Confianza HTTP (Origin, IP de Vercel), Storage con ciclo de vida y minimización de PII.
- Estructura por dominio adoptada módulo a módulo.
- Contratos tipados y una sola fuente de verdad por decisión.

**Qué no cierra**

- Nuevas features de producto (KDS, n8n, pasteles a medida, analítica BCG).
- Rediseño visual completo; solo tokens y layouts mientras se toca cada pantalla.
- Migración a otra base de datos o a un API Gateway separado.

---

## 2. As-is — estado real del repositorio

Nuxt **4.4.8** (`package.json`) con directorio `app/`. Una sola app desplegable, una sola base Supabase. No hay layouts, no hay `server/services/`, no hay tipos generados, no hay `lint` / `typecheck` / `test`.

### 2.1 Superficie actual

**Páginas (chrome duplicado, lógica mezclada)**

| Archivo | Líneas | Qué hace hoy |
|---|---|---|
| `app/pages/index.vue` | 280 | Home + header/footer públicos embebidos |
| `app/pages/menu.vue` | 377 | Catálogo vía `$fetch('/api/products')` + header duplicado |
| `app/pages/login.vue` | 171 | `supabase.auth` directo; no llama a `/api/auth/*` |
| `app/pages/checkout.vue` | 390 | Inserta `orders` y `order_items` desde el cliente; `price_at_time` sale del carrito Pinia |
| `app/pages/perfil.vue` | 437 | Pedidos, direcciones y puntos vía Supabase directo |
| `app/pages/admin/index.vue` | 300 | Shell ERP (header + sidebar + tabs) + `useFetch` de productos e insumos |

**Admin (pestañas inteligentes, 300–500 líneas)**

| Archivo | Líneas |
|---|---|
| `app/components/admin/AdminMaterialsTab.vue` | 500 |
| `app/components/admin/AdminRecipesTab.vue` | 490 |
| `app/components/admin/AdminOrdersTab.vue` | 467 |
| `app/components/admin/AdminProductsTab.vue` | 366 |
| `app/components/admin/OrderDetailsModal.vue` | 345 |
| `app/components/admin/AdminDashboardTab.vue` | 311 |
| `app/components/admin/NewOrderModal.vue` | 298 |
| `app/components/admin/MaterialModal.vue` | 252 |
| `app/components/admin/ProductModal.vue` | 211 |

**Cliente compartido**

| Archivo | Líneas | Notas |
|---|---|---|
| `app/components/CartDrawer.vue` | 209 | Usa `v-auto-animate` |
| `app/components/CustomerOrderDetailsModal.vue` | 219 | |
| `app/components/CustomDatePicker.vue` | 204 | Candidato a `components/ui/` |
| `app/components/CustomTimePicker.vue` | 210 | Candidato a `components/ui/` |
| `app/components/CustomSelect.vue` | 111 | Candidato a `components/ui/` |
| `app/stores/auth.ts` | 157 | Perfil y direcciones vía cliente Supabase |
| `app/stores/cart.ts` | 99 | Cookie Pinia; `isSyncing` no se usa |
| `app/composables/useConfetti.ts` | 49 | Único composable |
| `app/middleware/admin-only.ts` | 25 | **Único** middleware de ruta cableado (`/admin`) |
| `app/middleware/admin.ts` | 13 | Muerto: nadie lo referencia |
| `app/plugins/auto-animate.ts` | 12 | Import SSR de `@formkit/auto-animate/vue` — riesgo de build |

No existe `app/layouts/`. No existe `app/types/`. No existe `app/utils/`.

### 2.2 API actual

```text
server/middleware/auth.ts          JWT en POST/PUT/DELETE /api/products y en /api/admin/* (namespace vacío)
server/api/auth/login.post.ts      muerto: la UI no lo llama
server/api/auth/register.post.ts   muerto y peligroso: asigna role ADMIN
server/api/products/*              CRUD + upload; mutaciones sin chequeo de is_admin
server/api/raw-materials/*         CRUD; sin middleware de auth
server/api/recipes/*               POST/GET/DELETE/export; sin middleware de auth
server/api/cart/*                  muerto: el carrito vive en Pinia
```

No existe `server/services/`. No existe `server/utils/require-user.ts` ni `require-admin.ts`.

### 2.3 Dónde se escribe la base de datos hoy

| Operación | Camino real |
|---|---|
| Login / registro UI | Cliente Supabase en `login.vue` |
| Lectura catálogo | `$fetch('/api/products')` |
| CRUD admin productos / insumos / recetas | `$fetch` a API plana |
| Carrito | Pinia + cookie. `/api/cart` no se usa |
| Crear pedido (checkout) | `supabase.from('orders')` en `checkout.vue` |
| Crear pedido (admin) | `supabase.from('orders')` en `NewOrderModal.vue` |
| Cambiar estado de pedido | `AdminOrdersTab.vue` y `OrderDetailsModal.vue` |
| Descontar stock | RPC `process_order_inventory` **desde el cliente** en `AdminOrdersTab.vue` |
| Puntos | RPC `award_loyalty_points` **desde el cliente** en `AdminOrdersTab.vue` |
| Perfil / direcciones | Store `auth.ts` y `perfil.vue` |

### 2.4 Calidad y config

- `package.json` solo tiene `build`, `dev`, `generate`, `preview`, `postinstall`.
- `tailwind.config.ts` no define tokens de marca; los hex (`#4A5D23`, `#2A321B`, `#F4F1E1`, `#991B1B`, `#a3e635`) están hardcodeados.
- `nuxt.config.ts` tiene URL y anon key de Supabase en el archivo. `redirect: false`.
- Hay 80+ `any` (stores, admin, handlers con `serverSupabaseClient<any>`).
- SQL versionado en `docs/sql/`, no hay runner de migraciones.

---

## 3. Decisión arquitectónica

Se adopta un **monolito modular orientado a funcionalidades**, con las convenciones de Nuxt 4.

Adecuado para Dulce Fe hoy: una sola aplicación, una sola base, módulos internos independientes. No conviene microservicios, Clean Architecture completa ni Feature-Sliced Architecture estricta: añadirían capas sin resolver un problema real del producto.

Patrones combinados:

1. **Módulos por dominio (vertical slices).** Cada área de negocio vive junta.
2. **Capas ligeras dentro de cada módulo.** La interfaz presenta; los composables coordinan el cliente; las rutas API validan y autorizan; los servicios de servidor contienen reglas y acceso a datos.
3. **Composición de Vue.** Los componentes son pequeños y combinables. Las páginas de Nuxt enrutan, cargan lo inicial y componen una pantalla.
4. **Layouts para la estructura global.** `default` (tienda) y `admin` (ERP). Las páginas no duplican chrome.
5. **Contratos explícitos.** Tipos, DTOs y validaciones en cada frontera.
6. **UI reutilizable, no genérica en exceso.** Extraer a `ui/` solo con dos consumidores o una primitiva estable (modal, badge, select).

**Admin permanece en `/admin` con pestañas.** El layout `admin.vue` es dueño del chrome (header, sidebar, slot). No se parte en `/admin/products`, `/admin/orders`, etc. en este refactor. El orquestador de tabs se adelgaza; las pestañas dejan de hablar con Supabase.

**Auth permanece en el cliente** vía `@nuxtjs/supabase` (`signIn` / `signUp` en `login.vue`). Un solo camino. Las rutas `/api/auth/*` se eliminan (ver §11).

```text
Página / componente de dominio
        │  $fetch, nunca supabase.from() para mutaciones de negocio
        ▼
Ruta Nitro (valida DTO + require-user / require-admin)
        │
        ▼
Servicio de servidor (reglas, precios, stock, puntos)
        │
        ▼
Supabase (RLS con public.is_admin() como segunda línea)
```

---

## 4. Fuente de verdad — contradicciones cerradas

Estas decisiones quedan cerradas. No se reabren en medio de una fase.

| Conflicto | Decisión |
|---|---|
| Clean Architecture + repositorios (`docs/arquitectura-patrones.md`) vs este plan | **Este archivo gana** para estructura de código. Servicios en `server/services/`, no repositorios. `arquitectura-patrones.md` queda histórico; n8n/eventos son futuro. |
| Neo-Brutalismo (`docs/herramientas-ui.md`) vs Premium Soft (`docs/design-system-tokens.md`) | **Premium Soft.** `herramientas-ui.md` es legado. |
| Tabs que fetchean (`docs/componentes-arquitectura.md`) vs mutaciones en servidor | `componentes-arquitectura.md` describe el **as-is**. El target es este plan. Actualizar o marcar legado al terminar cada dominio en Fase 4. |
| `profiles.points` vs `profiles.loyalty_points` | **`profiles.points`.** El store y `user_profiles.sql` ya la usan. Corregir `award_loyalty_points` para UPDATE `points`, no `loyalty_points`. |
| Margen: verde si > 0 (`formulas-costeo.md`) vs umbrales 45/25 (`plan-maestro.md`) | **Cálculo** = `formulas-costeo.md`. **Color UI admin** = verde >45%, amarillo 25–44%, rojo <25%. El signo negativo sigue siendo el caso de pérdida. |
| Carrito Pinia vs `/api/cart` vs tablas SQL | **Pinia + cookie** para invitado y autenticado. `/api/cart` congelada. Tablas `carts` / `cart_items` no se activan hasta un ADR futuro. |
| Guest checkout (plan-maestro) vs RLS `auth.uid() = profile_id` en INSERT | Guest checkout **soportado**. `profile_id` nullable. Crear pedidos **solo en servidor** (service role / RPC). El RLS actual bloquea invitados desde el cliente; eso es un argumento más, no un bug a “arreglar” abriendo INSERT público. |
| Cuatro roles (plan-maestro) vs `is_admin` | **`is_admin` booleano + `public.is_admin()`.** RBAC de SuperAdmin / Ventas / Pastelero queda fuera de alcance. |
| Dos middlewares de admin | Solo `admin-only.ts`. Eliminar `admin.ts`. |
| Dos caminos de auth | Solo cliente Supabase. Eliminar `server/api/auth/*`. |
| Duplicar este plan en `docs/architecture.md` | **No.** Este archivo es el SSOT. |
| Redis para rate limit / idempotencia | **Tablas SQL** (§17). Redis sigue fuera de alcance. |
| `products.stock` vs insumos | **Insumos.** `products.stock` es legado; no se decrementa. |
| Pedido admin crea `profiles` fantasma | **Prohibido.** `customer_name` / `customer_phone` / `address` en `orders`. |
| Direcciones del perfil | **Cliente + RLS de dueño** (políticas actuales). El teléfono del checkout autenticado se persiste en el servicio de checkout, no con `supabase.from('profiles')` en Vue. |
| Saltos de estado en el kanban | **No.** Obligatorio pasar por `processing` para descontar stock. |
| `number` de JS vs dinero exacto | **Céntimos enteros en el servicio.** HTTP serializa importes como string `"42.50"`. Postgres `numeric(12,2)`. Nunca sumar, comparar ni hacer `FLOOR` con `Number`. |
| Idempotencia: esperar vs rechazar | **409 `IDEMPOTENCY_IN_PROGRESS` + `Retry-After: 2`.** No esperar dentro de la función de Vercel. |
| Principal de invitado | **`guest` + la `Idempotency-Key`.** El cliente guarda la key en `sessionStorage` para reintentos. Autenticado: `user:{profile_id}`. Admin: `admin:{actor_id}`. No se usa IP ni huella de dispositivo. |
| Fotos de producto públicas vs firmadas | **Públicas.** Bucket `product_images`, lectura anónima, escritura solo admin. Tope **2 MB**. JPEG / PNG / WebP. |
| Reversión de stock al cancelar | **No en este refactor (D1).** El libro de movimientos no incluye `cancellation_reversal` hasta ese ADR. |
| Segundo plan / addendum 10-10 | **No.** Este archivo gana. El addendum queda histórico. |

---

## 5. Inventario de seguridad P0

Cada fila es un agujero real hoy y el remedio obligatorio en Fase 1 o Fase 3.

| ID | Agujero | Dónde | Riesgo | Remedio | Fase |
|---|---|---|---|---|---|
| S1 | Registro público asigna `role: 'ADMIN'` en user_metadata | `server/api/auth/register.post.ts` | Privilegio falso en JWT. Hoy `isAdmin` lee `is_admin`, no `role`, así que **no escala a admin real**; igual es superficie muerta y peligrosa | Eliminar el endpoint (la UI no lo usa). Nunca mapear `user_metadata.role` a permiso | 1 |
| S2 | Middleware de servidor no comprueba `is_admin`; solo JWT | `server/middleware/auth.ts` | Cualquier usuario logueado muta catálogo vía `/api/products` | Sustituir por `require-admin` en cada handler de mutación; no confiar en un middleware global incompleto | 1 |
| S3 | `raw-materials`, `recipes`, `products/upload` sin auth de servidor | `server/api/raw-materials/*`, `server/api/recipes/*`, `upload.post.ts` | Mutación anónima o de cliente | `require-admin` en POST/PUT/DELETE; GET de insumos/recetas también admin | 1 |
| S4 | RLS “solo admins” usa `auth.role() = 'authenticated'` | `docs/sql/security_policies.sql` | Cualquier logueado escribe products / raw_materials / recipe_items | Políticas nuevas con `public.is_admin()`. Deprecar ese SQL | 1 |
| S5 | `isAdmin` en Pinia acepta JWT metadata | `app/stores/auth.ts` | UI de admin si el cliente forja `user_metadata.is_admin` | Solo `profile.value?.is_admin`. La UI nunca es la frontera de seguridad | 1 |
| S6 | Checkout fija `price_at_time` desde el carrito | `app/pages/checkout.vue` | Precio manipulado en el cliente | `order.service`: leer precio vigente de `products`; snapshot en servidor | 3 |
| S7 | Admin crea pedidos y cambia estados desde Vue | `NewOrderModal.vue`, `AdminOrdersTab.vue`, `OrderDetailsModal.vue` | Salta validación, stock y puntos | API admin de pedidos; RPCs solo desde el servicio | 3 |
| S8 | RPCs de inventario y puntos invocadas desde el cliente | `AdminOrdersTab.vue` | Se puede descontar stock o otorgar puntos sin transicionar de verdad | El servicio de pedidos es el único caller de `process_order_inventory` y `award_loyalty_points` | 3 |
| S9 | RLS de orders permite INSERT al dueño, no a invitados; y el cliente escribe igual | `docs/sql/user_profiles.sql` + checkout | Pedidos huéspedes rotos o inseguros; clientes autenticados insertan ítems con precio propio | Quitar INSERT de orders/order_items al rol `authenticated`. Solo el servidor crea. SELECT propio se mantiene | 3 |
| S10 | Políticas admin de pedidos incompletas respecto a catálogo | `admin_policies_v2.sql` cubre orders/profiles, no products/materials/recipes | Defensa en profundidad rota | Extender `is_admin()` a esas tablas en el SQL de Fase 1 | 1 |
| S11 | RPCs `SECURITY DEFINER` sin un contrato de privilegios explícito | `inventory_trigger.sql`, `loyalty_points.sql` | Un `GRANT EXECUTE` demasiado amplio permitiría alterar stock o puntos fuera del flujo | Fijar `search_path`, revocar `EXECUTE` a `anon`/`authenticated` y exponer solo una operación atómica controlada por el servidor | 3 |
| S12 | Upload acepta cualquier archivo y no tiene límites | `server/api/products/upload.post.ts` | Abuso de Storage, archivos no esperados y coste innecesario | `require-admin`, JPEG/PNG/WebP por magic bytes, tope 2 MB, ruta `products/<uuid>.<ext>`, bucket `product_images` de lectura pública y escritura admin | 1 |

**Regla permanente:** un middleware de ruta de Nuxt (`admin-only`) solo oculta pantallas. No es autorización.

Un registro público **nunca** otorga privilegios de administrador. El alta de `is_admin = true` es un acto manual en base de datos (como ya hace `admin_policies_v2.sql` para un correo concreto).

### 5.1 Operación segura de base de datos (requisito para producción)

- Los cambios de esquema, RLS, funciones y grants viven en migraciones versionadas y ordenadas, no solo en archivos sueltos de `docs/sql/`.
- Se adopta Supabase CLI (o un runner equivalente) con `supabase/migrations/<timestamp>_descripcion.sql`; `docs/sql/` conserva material histórico o de referencia, no es el mecanismo de despliegue.
- Toda migración se prueba primero contra un proyecto de staging con datos anonimizados. Producción recibe una copia inmutable de la misma migración, revisada en PR.
- Cada migración indica compatibilidad hacia atrás, verificación post-despliegue y rollback seguro. Si un rollback de datos no es posible, se documenta una migración compensatoria antes de aprobarla.
- Las credenciales privilegiadas solo existen en variables de entorno privadas de Nitro. La URL y anon key de Supabase pueden ser públicas, pero se mueven a `runtimeConfig.public` para no acoplar entornos al código.
- Inventario concreto de variables, service role y prohibiciones: §15. No se improvisa `SUPABASE_SERVICE_ROLE_KEY` en medio de Fase 3.

### 5.2 Expandir → migrar → verificar → contraer

Vercel publica un deployment de servidor atómico. El riesgo real es JS viejo en el teléfono del cliente, no dos pods. Aun así, todo cambio de esquema, RLS, Storage o endpoint sigue este orden:

1. **Expandir:** añadir columnas/tablas/índices/políticas compatibles. Lo nuevo nace nullable o con default seguro.
2. **Migrar:** desplegar la app que escribe el contrato nuevo y, si hace falta, backfill idempotente por lotes.
3. **Verificar:** lecturas vieja/nueva, tests de RLS y un flujo real en staging.
4. **Contraer:** en **otro** despliegue, retirar columnas, políticas, RPCs o rutas viejas. El PR declara la migración compensatoria y hasta cuándo aplica.

El corte S9 (§16.2) ya es este patrón. Un CHECK nuevo sobre tablas con filas heredadas se aplica en staging **después** de reparar datos incompatibles; no se lanza a producción a ciegas.

### 5.3 Tipos generados y drift

- `app/types/database.types.ts` se genera (`npm run db:types` → `supabase gen types`). Cabecera `DO NOT EDIT`. Cero ediciones manuales.
- Los DTOs HTTP no reexportan el tipo de tabla. Así no se filtran costos, roles ni columnas internas.
- En CI (Fase 5; en local desde Fase 1 si hay Docker): levantar Supabase local, aplicar migraciones desde cero, regenerar tipos y fallar si `git diff --exit-code -- app/types/database.types.ts` ve cambios.
- Fase 0 registra Docker Desktop (o un runner CI con Docker). Sin eso no hay Supabase local reproducible.

---

## 6. Dominios y dependencias

### 6.1 Límites

```text
Catálogo       productos publicados, precio de venta, imagen, disponibilidad
Carrito        ítems temporales, cantidades, totales de UI (no precio de verdad)
Checkout       entrega, invitado o cuenta, validación, pide a Pedidos crear la orden
Perfil         cuenta, direcciones, puntos, historial personal
Pedidos        ciclo de vida, ítems, snapshot de precio, transiciones de estado
Inventario     materias primas, stock, unidades, alertas
Recetas        insumos por producto, CIF, costo, margen, export Excel
Administración permisos (is_admin) y shell ERP; no es un dominio de datos
```

Administración no posee tablas. Es el layout y la autorización que envuelve Catálogo, Inventario, Recetas y Pedidos.

### 6.2 Grafo permitido

```text
UI Catálogo  → API catálogo (lectura pública)
UI Carrito   → store cart (local). No escribe DB.
UI Checkout  → API checkout → servicio Pedidos → (opcional) Perfil.phone
UI Perfil    → API perfil / pedidos (lectura propia)
UI Admin     → API /api/admin/* → servicios Catálogo | Inventario | Recetas | Pedidos

Pedidos      → Catálogo (precio vigente, existencia)
Pedidos      → Inventario (solo al transicionar a processing, vía RPC)
Pedidos      → Perfil (puntos al completed, vía RPC; profile_id opcional)
Recetas      → Inventario (insumos y costo unitario)
Recetas      → Catálogo (producto dueño de la ficha)

Prohibido:
  Vue → supabase.from() para orders, order_items, products (write), raw_materials, recipe_items
  Vue → supabase.from('profiles') para escribir teléfono en checkout
  Admin → insertar profiles fantasma o UUID inventados
  Checkout UI → tablas de pedidos
  Inventario UI → cambiar pedidos
  Catálogo UI → leer raw_materials o costos
  Carrito → decidir precio persistido
  Browser → rpc('process_order_inventory' | 'award_loyalty_points')
```

Ejemplo: checkout pide a Pedidos crear una orden; no actualiza tablas desde el formulario. Inventario participa al confirmar (estado `processing`); esa regla vive en `order.service.ts`, no en una vista.

---

## 7. Contratos de servidor

Estos contratos son la capa de dominio. Los servicios no improvisan fórmulas.

### 7.1 Costeo (dueño: `recipe.service` + `docs/formulas-costeo.md`)

```text
costoUnitario = precioPagado / cantidadPaquete          // al dar de alta el insumo
costoParcial  = cantidadUsada × costoUnitario           // línea de receta
costoTotal    = Σ(costoParcial) + empaque + servicios + manoDeObra
margenBruto   = precioVenta - costoTotal
%margen       = margenBruto / precioVenta               // para umbrales de color
```

- Unidad base del insumo es obligatoria: `kg | g | L | ml | und`.
- El cliente de tienda **nunca** recibe costos, CIF ni insumos.
- Export Excel (`/api/recipes/export`) embebe fórmulas nativas (`=SUM(...)`), no números muertos. Dueño: servicio de recetas, no el tab Vue.

### 7.2 Colores de margen (solo UI admin)

```text
%margen > 0.45        → status.success (#a3e635)
0.25 ≤ %margen ≤ 0.45 → status.warning (token a definir sobre la paleta)
%margen < 0.25        → status.danger (#991B1B), incluido margen negativo
```

### 7.3 Pedidos

Estados en DB (no se inventan otros):

```text
pending → processing → ready → completed
                 ↘ cancelled
```

Etiquetas de cliente (mapeo en `utils/status.ts`, no en SQL):

| DB | Cliente | Admin |
|---|---|---|
| `pending` | Recibido | Recibido |
| `processing` | En cocina | Horneando |
| `ready` | Listo | Listo |
| `completed` | Entregado | Entregado |
| `cancelled` | Cancelado | Cancelado |

“En decoración” del plan-maestro **no tiene columna**. No se añade en este refactor.

**Creación (checkout o admin):**

1. Validar DTO (nombre, teléfono, dirección o recojo, fecha/hora, ítems).
2. Resolver cada `product_id` en DB; rechazar si no existe o no está disponible.
3. `price_at_time` = precio de `products` en ese instante, leído como `numeric` y convertido a céntimos. Ignorar el precio del cliente.
4. `total_amount` = suma de céntimos en el servicio, persistida como `numeric(12,2)`. Ignorar el total del cliente.
5. `profile_id` = usuario autenticado o `null` (invitado).
6. Insertar order + items en una única transacción / RPC. Nunca dejar una orden sin ítems si falla una inserción posterior.
7. Reclamar la llave de idempotencia con `INSERT … ON CONFLICT` **dentro de esa misma transacción** (§17). No hacer `SELECT` y luego `INSERT` aparte.

**Transiciones permitidas (solo admin, servidor). No se salta `processing`:**

```text
pending     → processing | cancelled
processing  → ready | cancelled
ready       → completed | cancelled
completed   → (ninguna)
cancelled   → (ninguna)
```

- `pending → ready` o `pending → completed` está **prohibido**: saltarse `processing` omite el descuento de stock.
- Toda transición es un `UPDATE orders SET status = $nuevo WHERE id = $id AND status = $esperado` (o RPC equivalente) en **una** transacción. Si no actualiza fila → `CONFLICT`. Nunca “releer y continuar”. El kanban, si hizo UI optimista, revierte la tarjeta.
- Orden de bloqueo fijo para evitar deadlocks: primero la fila de `orders` (`FOR UPDATE`), luego `raw_materials` por `id ASC`.
- A `processing`: la misma transacción valida stock, escribe `inventory_movements`, actualiza `raw_materials.stock`, pone `inventory_processed = true` y cambia el estado. Se **reescribe** `process_order_inventory` (hoy no bloquea, no chequea quiebre ni marca el flag). Si hay quiebre: no cambia estado, `INSUFFICIENT_STOCK`.
- A `completed`: `award_loyalty_points` hace `SELECT … FOR UPDATE` del pedido, suma `profiles.points` y marca `points_awarded` como una unidad. Columna: `points`, no `loyalty_points`.
- A `cancelled`: no descontar stock; si `inventory_processed = true`, la reversión queda **D1**. No otorgar puntos. No revertir puntos si ya se completó (completed es terminal).
- `NewOrderModal` **nunca** crea un `profiles` fantasma ni un UUID inventado. Pedido admin = mismo servicio de creación, `channel: 'admin'`, `profile_id` null salvo que se pase un perfil existente. Nombre, teléfono y dirección van a `orders.customer_name` / `orders.customer_phone` / `orders.address` (migración Fase 3), no a notas libres ni a `user_id`.

### 7.4 Inventario

```text
total_needed = recipe_items.quantity_used × order_items.quantity
raw_materials.stock -= total_needed   // solo si stock >= total_needed para todos los insumos
```

`quantity_used` está en la **misma unidad** que `raw_materials.unit`. No hay conversión implícita kg ↔ g. Si el insumo se compra en kg, la receta se escribe en kg.

Solo ocurre en servidor al pasar a `processing`. El tab de materiales no descuenta por ventas: un ajuste manual pasa por `inventory.service` y deja un movimiento `manual_adjustment` (motivo + actor). No se edita ni borra un movimiento ya aplicado; la corrección es otro movimiento.

Cada consumo de pedido escribe un `inventory_movements` por insumo en la misma transacción. Unique parcial `(order_id, raw_material_id)` donde `type = order_consumption`. El pedido entero se marca una vez con `inventory_processed`. Producto sin receta: no-op de stock (no falla, no crea movimientos).

`products.stock` **no** es la fuente de verdad de inventario. Si la columna existe, se trata como legado: no se decrementa en este refactor. Un ADR futuro decide si se elimina o se deriva.

La receta usada es la vigente en el instante de `processing`. Versionar/snapshot de receta es D8, no se cambia de forma implícita.

Política de quiebre y mensaje de error: §16. DDL del libro: §17.

### 7.5 Lealtad

```text
puntos = floor(total_cents / 100)     // 1 punto por S/ entero, solo si profile_id no es null
UPDATE profiles SET points = points + puntos
```

Columna: `profiles.points`. Invocación: solo `order.service` al completar, con bloqueo de la fila del pedido. Invitados no acumulan. Un total de `"42.50"` otorga 42 puntos, no 4250.

### 7.6 Carrito (cliente)

- Persistencia: Pinia + cookie (`@pinia-plugin-persistedstate/nuxt`).
- El total del drawer es UX. El total de cobro lo calcula el servidor.
- Guest checkout: no exige cuenta. Tracking por token público queda **fuera de alcance** (no hay ruta `/pedido/[token]` todavía; no bloquear Fase 3 por eso).

### 7.7 Invariantes operativas y antabuso

- Toda entrada HTTP se valida en servidor con un esquema único por DTO (por ejemplo Zod): tipo, longitud, rangos, formato de teléfono, fecha/hora e ítems. El cliente valida solo para UX; no sustituye al servidor.
- `POST /api/checkout` tiene límite de tamaño de body, límite de ítems/cantidades, rate limit por IP y una clave de idempotencia. Reintentar la misma petición no crea un segundo pedido. Almacén: tablas SQL (§17), no Redis. El incremento de `checkout_rate_windows` es un `INSERT … ON CONFLICT DO UPDATE` atómico.
- Contratos HTTP, códigos de error y shapes: §14. El cliente no inventa el JSON.
- La transacción de creación bloquea filas de `products` implicadas (o usa una RPC atómica) y escribe `orders` + `order_items` como una unidad.
- El cambio de estado comprueba la transición permitida y su efecto previo: inventario se descuenta una vez, puntos se otorgan una vez y un estado terminal no vuelve atrás sin una operación explícita de reversión.
- Las funciones `SECURITY DEFINER` fijan `SET search_path = public`, validan sus argumentos y no quedan ejecutables por `anon` ni `authenticated`; Nitro o una RPC de alto nivel con contrato mínimo es el único caller.
- El upload valida magic bytes, extensión y tamaño (2 MB) antes de Storage. No se confía solo en el `contentType` enviado por el navegador. Ruta de objeto: `products/<uuid>.<ext>`. Al reemplazar un producto, borrar el objeto previo **después** de confirmar que ya no está referenciado, o marcar limpieza asíncrona. Un fallo de Storage no bloquea la mutación de base.
- Las acciones administrativas relevantes (crear/editar producto, material, receta, crear pedido, cambiar estado y ajustar stock) dejan un registro en `audit_events` (§17). Actor, acción, entidad, resultado. Sin payloads de cliente, teléfonos, tokens ni secretos.
- WhatsApp no es la fuente de verdad. El servidor crea el pedido y devuelve ítems y totales; el cliente arma el enlace con **esos** números (formatea el string `"42.50"`). El teléfono del negocio vive en `runtimeConfig.public.whatsappNumber`, no hardcodeado.
- `delivery_date` y `delivery_time` son una promesa comercial en `America/Lima`, no un `Date` del navegador. Siguen como texto `YYYY-MM-DD` / `HH:mm`. `created_at` es `timestamptz` UTC.
- `X-Request-Id` se acepta solo si es UUID v4; si no, el servidor genera uno. Va en logs, auditoría y respuesta.

### 7.8 Dinero (céntimos, no `Number`)

`price_at_time`, `total_amount`, costos y márgenes no se calculan con coma flotante de JS.

- Postgres: importes de pedido `numeric(12,2)` (se ensancha el `DECIMAL(10,2)` actual en expand). Cantidades de receta/insumo `numeric(14,4)`.
- Servicio: enteros en céntimos (`4250` = S/ 42.50). Un helper único `solesToCents` / `centsToSoles` redondea half-up a 2 decimales. El costeo (`purchase_price / purchase_quantity`) también pasa por céntimos o por `numeric` en SQL; no por `Number(…).toFixed`.
- HTTP: strings con dos decimales (`"42.50"`). Zod: `/^\d+\.\d{2}$/`. Una sola convención en todos los endpoints de pedido. La UI formatea con `Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })` y no recalcula el total oficial.
- Restricciones de base (tras reparar filas en staging): `order_items.quantity > 0` (ya existe), precios y totales `>= 0`, `raw_materials.stock >= 0`, `orders.status` en el set de §7.3.

### 7.9 Confianza HTTP (Vercel + cookies)

- La app es mismo origen. No se habilita CORS permisivo. Orígenes extra: `NUXT_PUBLIC_SITE_URL` y, en preview, `https://${VERCEL_URL}`.
- Mutaciones autenticadas por cookie validan `Origin` contra esa lista. Complementa `SameSite=Lax`; no lo sustituye.
- IP para rate limit: `getRequestIP(event, { xForwardedFor: true })`. En Vercel ese header lo fija el proxy, no el cliente. Fallback: `0.0.0.0` (cuenta como un cubo compartido; no se inventa una IP).
- Errores de producción: catálogo §14.5. Sin stack, SQL, IDs internos de Supabase ni mensajes crudos de proveedores. `details` de stock solo admin.

### 7.10 Datos personales

Marco: Ley 29733 (Perú). PII: nombre, teléfono, dirección, notas y cualquier referencia de entrega.

- Con `customer_name` / `customer_phone` / `address` en columnas propias, **prohibido** volver a embeber esos campos en `orders.notes` (hoy el checkout lo hace).
- `audit_events` y logs no guardan PII ni payloads crudos. El enlace de diagnóstico es `request_id`.
- Retención de pedidos: 24 meses; después se anonimizan `customer_*` y se vacían `notes`. Perfiles: hasta que el dueño borre la cuenta. Invitado sin cuenta: baja por solicitud al admin con teléfono + `order_id`.
- Exports de recetas/costos: solo admin, sin datos de clientes.
- WhatsApp exfiltra PII por diseño de cobro actual; no se añade otro canal de copia (email masivo, hojas sueltas). El backup de Supabase no es canal de consulta diaria.

---

## 8. Estructura objetivo y mapa de migración

No se mueve todo de una vez. La estructura se adopta módulo por módulo cuando se toca ese módulo.

### 8.1 Árbol objetivo

```text
app/
  layouts/
    default.vue
    admin.vue
  pages/                         # routing y composición
    index.vue
    menu.vue
    login.vue
    checkout.vue
    perfil.vue
    admin/index.vue              # orquestador de tabs, sin chrome
  components/
    ui/                          # CustomSelect, DatePicker, TimePicker, BaseModal, EmptyState, StatusBadge
    catalog/
    cart/
    checkout/
    profile/
    admin/
      products/
      materials/
      recipes/
      orders/
  composables/
    catalog/
    checkout/
    profile/
    admin/
  stores/
    auth.ts
    cart.ts
  types/
    catalog.ts
    cart.ts
    checkout.ts
    order.ts
    profile.ts
    inventory.ts
    api.ts
    database.types.ts            # generado
  utils/
    formatters.ts
    validators.ts
    status.ts                    # mapeo pending → Recibido, etc.

server/
  api/
    catalog/
    checkout/
    profile/
    admin/
      products/
      materials/
      recipes/
      orders/
  services/
    catalog.service.ts
    order.service.ts
    inventory.service.ts
    recipe.service.ts
  utils/
    require-user.ts
    require-admin.ts
    validation.ts
```

Las rutas públicas de lectura de catálogo pueden quedarse como `/api/products` (GET) para no romper `menu.vue` en Fase 1; las mutaciones se agrupan bajo `/api/admin/` en Fase 3. No es obligatorio renombrar GET en el mismo commit que se añade `require-admin`.

### 8.2 Mapa archivo actual → destino

| Hoy | Destino | Fase |
|---|---|---|
| `app/pages/index.vue` (header/footer) | `layouts/default.vue` + `components/` públicos | 2 |
| `app/pages/menu.vue` (header) | layout `default` + `components/catalog/` | 2 luego 4 |
| `app/pages/admin/index.vue` (header/sidebar) | `layouts/admin.vue`; la página solo orquesta tabs | 2 |
| `app/pages/checkout.vue` | página fina + `components/checkout/` + `composables/checkout/` + `POST /api/checkout` | 3 (API) y 4 (UI) |
| `app/pages/perfil.vue` | `components/profile/` + composable + API perfil | 4 (UI) / 3 si hay mutaciones |
| `AdminProductsTab.vue` + `ProductModal.vue` | `components/admin/products/` | 4 |
| `AdminMaterialsTab.vue` + `MaterialModal.vue` | `components/admin/materials/` | 4 |
| `AdminRecipesTab.vue` | `components/admin/recipes/` | 4 |
| `AdminOrdersTab.vue` + modales de pedido | `components/admin/orders/` | 3 (dejar de hablar con Supabase) y 4 (partir UI) |
| `AdminDashboardTab.vue` | `components/admin/` (dashboard) | 4 |
| `CartDrawer.vue` | `components/cart/` | 4 |
| `CustomerOrderDetailsModal.vue` | `components/profile/` o `components/orders/` | 4 |
| `CustomSelect/Date/TimePicker.vue` | `components/ui/` | 2 |
| `app/middleware/admin.ts` | **eliminar** | 1 |
| `server/api/auth/*` | **eliminar** | 1 |
| `server/api/cart/*` | congelar (no usar, no borrar hasta ADR) | — |
| `server/api/products/index.post.ts` y mutaciones | `server/api/admin/products/` + `catalog.service` | 3 |
| `server/api/raw-materials/*` | `server/api/admin/materials/` + `inventory.service` | 3 |
| `server/api/recipes/*` | `server/api/admin/recipes/` + `recipe.service` | 3 |
| `server/middleware/auth.ts` | reemplazar por helpers por ruta; no ampliar el global a medias | 1 |
| Tipos inline (`UserProfile`, `Product` en páginas) | `app/types/*` + `database.types.ts` | 1 (DB) y 4 (dominio) |

---

## 9. Reglas de diseño

### 9.1 Componentes y estilos

- SFC de Vue: `template`, `script setup` y `style scoped` pueden vivir juntos. No separar HTML/lógica/CSS al estilo Angular.
- Separar un componente cuando mezcla responsabilidades (tabla + filtro + modal + formulario + fetch + cálculo), no por un número de líneas.
- Un componente cohesivo de 250 líneas puede ser más claro que cinco archivos artificiales.
- Presentación: props tipadas y eventos. No conoce permisos. No escribe en la base.
- Estilos específicos junto al componente. Tokens, reset y utilidades globales van a Tailwind / CSS global.
- Tokens semánticos en `tailwind.config.ts`, mapeo 1:1 con `docs/design-system-tokens.md`. No reemplazar hex con un find-and-replace ciego; se cambia al tocar cada feature.

```text
brand.primary     #4A5D23
brand.secondary   #2A321B
brand.cream       #F4F1E1
surface           #FFFFFF
status.danger     #991B1B
status.success    #a3e635
```

Tipografía: Playfair Display (títulos), Inter (cuerpo y números), según el design system. Sombras suaves (`shadow-sm` / `shadow-md`), no sombras duras neo-brutalistas.

### 9.2 Estado y lógica

- Pinia solo para estado global: sesión, perfil activo, carrito, preferencias. No es el lugar de toda consulta.
- Composables: coordinación de UI y llamadas a API. No duplican reglas de servidor.
- Funciones puras (formato, filtros, mapeo de estados, %margen) en `app/utils/`.
- Cada petición tiene DTO de entrada y salida. Los `any` se eliminan por dominio, no con casts sueltos.

### 9.3 Servidor y seguridad

- Toda regla que afecte datos, dinero, inventario o permisos se ejecuta en servidor.
- La ruta API valida, autoriza y delega al servicio. No es una pantalla de lógica en miniatura.
- `require-user` / `require-admin` leen la sesión y `profiles.is_admin` (o `public.is_admin()`), nunca solo el JWT metadata.
- RLS es la segunda línea. Coherente con `is_admin()`.
- GET de insumos y recetas es admin. GET de productos publicados es público.

### 9.4 Cómo decidir si dividir un archivo

Dividir cuando hay una sección visual independiente, se mezcla carga de datos con formulario, hay más de un motivo para cambiar, o hace falta leer cientos de líneas para un detalle local.

No dividir solo porque pasa de 200 líneas.

---

## 10. Plan por fases

Cada fase tiene resultado, tareas, criterio de hecho y verificación. No se avanza de fase con el criterio anterior en rojo.

### Fase 0 — Plataforma reproducible y línea base

**Resultado:** un punto de partida verificable y un camino seguro de despliegue antes de modificar permisos o datos.

1. Registrar versiones reales de Node, npm, Nuxt (4.4.8) y Supabase CLI; fijar Node 22 LTS en `.nvmrc` y `engines` (Nuxt 4 requiere Node ≥ 20). Anotar Docker Desktop (o el runner CI con Docker) para Supabase local.
2. Crear la estructura de migraciones versionadas y documentar el flujo local → staging → producción de §5.1–§5.2.
3. Crear/stabilizar un proyecto Supabase de staging y una cuenta no-admin de prueba; no probar cambios de RLS inicialmente en producción.
4. Añadir `runtimeConfig` según §15. Sacar URL y anon key de `nuxt.config.ts`. Confirmar que el service role no se expone al navegador ni entra en Git. El número de WhatsApp pasa a `NUXT_PUBLIC_WHATSAPP_NUMBER`. Añadir `NUXT_PUBLIC_SITE_URL`.
5. Guardar una línea base: `npm run build`, conteo de `any`, rutas API existentes y flujos manuales críticos (catálogo, login, checkout, admin).
6. Añadir Zod cuando se toque la primera ruta validada (Fase 1 upload / Fase 3 checkout). No esperar a “un PR de dependencias” suelto.

**Terminado cuando:** una migración vacía puede aplicarse y verificarse en staging; el build actual y los riesgos conocidos están registrados; existe un procedimiento breve de rollback.

**Verificación:** ejecutar la migración en una base local/staging limpia y en una copia con datos de prueba; confirmar que el artefacto de producción no contiene variables privadas.

### Fase 1 — Cerrar agujeros y bases (P0)

**Resultado:** build estable, permisos reales, tipos de DB, este documento como SSOT.

1. Corregir el build de `@formkit/auto-animate/vue` (import SSR en `app/plugins/auto-animate.ts`).
2. Eliminar `server/api/auth/register.post.ts` y `server/api/auth/login.post.ts`.
3. Eliminar `app/middleware/admin.ts`.
4. Crear `server/utils/require-user.ts` y `require-admin.ts`. Usarlos en **todas** las mutaciones: products POST/PUT/DELETE/upload, raw-materials POST/PUT/DELETE, recipes POST/DELETE, recipes/export si expone costos.
5. Dejar de usar `server/middleware/auth.ts` como única aduana (o vaciarlo). La autorización vive en el handler.
6. `isAdmin` del store: solo `profile.is_admin`. Nunca `user_metadata`, `app_metadata` ni `role`.
7. SQL: políticas `public.is_admin()` en `products`, `raw_materials`, `recipe_items` (SELECT de materiales/recetas admin-only; SELECT de products público; writes admin-only). `CREATE OR REPLACE FUNCTION public.is_admin()` con `SET search_path = public`. Igual para `handle_new_user`. Implementar como migración versionada (§5.1). Marcar `security_policies.sql` y `admin_policies.sql` como obsoletos en un comentario o README de `docs/sql/`.
8. Generar tipos Supabase en `app/types/database.types.ts` (§5.3). Script `db:types`.
9. Añadir script `typecheck` (`nuxt typecheck` o `vue-tsc`) y usarlo junto a `build`.
10. Proteger `products/upload`: autorización admin, JPEG/PNG/WebP por magic bytes, tope 2 MB, ruta `products/<uuid>.<ext>`, bucket `product_images` lectura pública / escritura admin. No se confía en el `contentType` del navegador.
11. Incorporar tests automatizados de autorización de API para anónimo, usuario normal y admin (§18). Corren contra Supabase local o mocks; staging es verificación extra, no el runner del CI.
12. Desactivar `server/api/cart/*`: responder **410 Gone** con `CART_API_DISABLED`. No dejar POST/GET/DELETE invocables. `docs/sql/cart_tables.sql` sigue sin aplicarse.
13. No crear `docs/architecture.md`. Este archivo ya es el SSOT.
14. Ejecutar en PRs pequeños según §19 (PR-0 → PR-1d). No un único commit “Fase 1”.

**Terminado cuando:**

- `npm run build` y `npm run typecheck` pasan.
- Un usuario autenticado no-admin recibe 401/403 al mutar catálogo, insumos o recetas.
- RLS impide el mismo write con el cliente Supabase (anon + sesión de cliente).
- Nadie puede registrarse como admin por HTTP.
- Upload rechaza un usuario no-admin, no-imagen, MIME mentido y archivos > 2 MB.
- Los tests de autorización corren localmente (Vitest) y pasan.
- `GET/POST/DELETE /api/cart*` responden 410.

**Verificación:** llamadas HTTP y tests automatizados a cada POST/PUT/DELETE con: anónimo, cliente y admin. Comprobar S1–S5, S10 y S12, además de probar las políticas RLS directamente con el cliente Supabase.

### Fase 2 — Shell visual

**Resultado:** chrome único y tokens usables, sin cambiar comportamiento.

1. Crear `app/layouts/default.vue` y `app/layouts/admin.vue`.
2. Extraer header público, footer y mover pickers a `components/ui/` (ya tienen ≥2 usos).
3. Migrar inicio, menú, login, checkout, perfil y admin a layouts.
4. Definir tokens Tailwind de §9.1.
5. Sustituir hex al tocar cada archivo de chrome, no en un barrido global.

**Terminado cuando:** cambiar la marca (un token) actualiza header/footer/admin shell; las páginas de tienda ya no copian 70 líneas de header.

**Verificación:** recorrer `/`, `/menu`, `/login`, `/checkout`, `/perfil`, `/admin` en desktop y móvil. Mismos flujos que antes.

### Fase 3 — Frontera de dinero primero

**Resultado:** el servidor es la fuente de verdad para operaciones de negocio.

Orden interno (no negociable):

1. **Pedidos / checkout** — `order.service.ts`, contratos §14, `POST /api/checkout`, `POST /api/admin/orders`, `PATCH /api/admin/orders/:id/status`. Mover inserts y RPCs fuera de Vue. Migraciones: `customer_name`, `customer_phone`, `address`, `inventory_processed`, `numeric(12,2)` de importes, tablas §17 (idempotencia, rate limit, `audit_events`, `inventory_movements`), helper de céntimos, RPC de puntos → `profiles.points` con `FOR UPDATE`, RPC de stock reescrita (quiebre + movimientos + `SET search_path`). Corte S9 con runbook §16. Service role solo aquí (§15). Logs estructurados de checkout/estado (correlation id) **en esta fase**, no en la 5. `audit_events` para crear pedido y cambiar estado. Origin + IP según §7.9.
2. **Catálogo (mutaciones ya existentes)** — agrupar bajo `/api/admin/products/`, `catalog.service.ts`, DTOs. Auditar writes.
3. **Inventario y recetas** — `inventory.service.ts`, `recipe.service.ts`, `/api/admin/materials/`, `/api/admin/recipes/`. El GET de receta calcula costos en servidor (céntimos / `numeric`, no `Number`). El ajuste de stock del tab pasa por el libro. Auditar writes.

Los composables quedan como clientes de esas rutas. No duplican precios ni stock.

**Terminado cuando:**

- `checkout.vue` y `NewOrderModal.vue` no llaman `supabase.from('orders')`.
- El cliente no puede persistir un `price_at_time` distinto al de `products`.
- `AdminOrdersTab.vue` no llama RPCs; el cambio a `processing` descuenta stock una sola vez.
- Completar un pedido con `profile_id` suma `profiles.points`.
- Un reintento de checkout con la misma clave de idempotencia y el mismo hash devuelve el mismo pedido. Misma clave y body distinto → 409. Dos POST simultáneos → un pedido; si el primero aún no tiene `order_id`, el segundo recibe 409 `IDEMPOTENCY_IN_PROGRESS`.
- Quiebre de insumo al pasar a `processing` deja el pedido en `pending` y no resta stock. Cada descuento deja un movimiento trazable.
- Pedido admin no crea perfiles fantasma. Invitado no acumula puntos.
- El enlace de WhatsApp usa totales e ítems de la respuesta del servidor.
- Ningún rol de navegador puede ejecutar directamente las RPCs internas de inventario o lealtad (`REVOKE EXECUTE` a `anon`/`authenticated`).
- El corte S9 se aplicó en el orden de §16 (API viva **antes** de quitar INSERT).
- Un fallo de checkout deja un log con `request_id` y código de error, sin token ni body completo.

**Verificación:** tests de servicio e integración (precio manipulado → se ignora; orden con múltiples ítems → escritura atómica; doble transición a processing → un descuento; invitado con `profile_id` null → pedido ok, 0 puntos; reintento de checkout → un pedido). Más prueba manual de checkout y kanban en staging.

### Fase 4 — Refactor de UI por dominio

**Resultado:** módulos pequeños y encontrables. El dinero ya no vive en Vue.

Orden (práctica segura **después** de Fase 3):

1. Perfil
2. Catálogo y carrito
3. Inventario
4. Recetas
5. Pedidos administrativos (partir tabs/modales)

Para cada dominio:

1. Acordar responsabilidades y contratos (ya definidos en §6–§7).
2. Extraer composables de coordinación.
3. Dividir la pantalla por fronteras visuales reales.
4. Sustituir `any` de ese dominio por tipos de DB y DTOs.
5. Verificar flujos del dominio antes de pasar al siguiente.

**Terminado cuando:** una persona nueva encuentra UI, composable, API, servicio y tipos de una funcionalidad sin recorrer todo el repo.

### Fase 5 — Disciplina

**Resultado:** el repo impide que vuelvan los patrones viejos.

1. ESLint (+ regla de no `any` explícito nuevo).
2. Completar cobertura de tests de autorización de API, servicios y rutas críticas de UI; los mínimos de Fase 1 y 3 no se eliminan.
3. CI: `typecheck`, `lint`, `test`, `build`, migraciones desde cero y gate de tipos §5.3.
4. Detectar imports que rompan el grafo de §6.2. Prohibido importar el cliente Supabase de navegador en `checkout`, `admin/orders` y en código que mute catálogo, inventario o recetas. Excepciones de perfil/direcciones: documentadas y con test de RLS.
5. ADRs cortos en `docs/decisions/` solo para excepciones (ej. activar carrito en DB).
6. Lista de revisión por feature: dominio, tipo, validación, permiso, prueba, ¿toca SQL?
7. Completar observabilidad: logs estructurados (ya desde Fase 3) y alertas sobre ellos — checkout 5xx, `INSUFFICIENT_STOCK` repetido, conflictos de idempotencia, migración fallida, 401/403 anómalos en admin. No se añade un SaaS nuevo en este refactor; destino = logs de Vercel + un dueño nombrado en el doc de operación. Nunca loguear contraseñas, tokens, PII ni payloads completos de cliente.
8. Documentar operación: variables por entorno, rotación de credenciales, backup/restore, despliegue, rollback y responsable de incidentes. El ensayo de restore es **descargar un backup de Supabase y restaurarlo en el proyecto de staging** (PITR si el plan de Supabase lo incluye; si no, dump semanal). Tener backup sin restore ensayado no cuenta.
9. Añadir verificación de accesibilidad a los flujos tocados: etiquetas de formularios, foco visible, navegación por teclado, contraste y mensajes de error asociados al campo.

**Terminado cuando:** un PR no puede introducir `any` nuevo, mutación de pedido en un `.vue`, migración no validada o una ruta crítica sin pruebas mínimas; los fallos operativos de checkout son detectables y trazables.

---

## 11. Código muerto y congelado

**Eliminar en Fase 1**

- `app/middleware/admin.ts`
- `server/api/auth/register.post.ts`
- `server/api/auth/login.post.ts`

**Desactivar en Fase 1 (410, no borrar el archivo todavía)**

- `server/api/cart/index.get.ts`
- `server/api/cart/index.post.ts`
- `server/api/cart/[productId].delete.ts`

**Congelar (no aplicar)**

- `docs/sql/cart_tables.sql` — no aplicar a producción hasta ADR.

**Marcar legado (no borrar; no seguir)**

- `docs/herramientas-ui.md`
- `docs/arquitectura-patrones.md` (salvo ideas futuras de n8n)
- `docs/architecture-refactor-addendum-10-10.md`
- `docs/sql/security_policies.sql`
- `docs/sql/admin_policies.sql`

**Vigentes**

| Documento | Rol |
|---|---|
| `docs/architecture-refactor-plan.md` | SSOT arquitectura de código (§14–§20 = operación) |
| `docs/plan-maestro.md` | Visión de producto (KDS/n8n = futuro) |
| `docs/design-system-tokens.md` | SSOT visual |
| `docs/formulas-costeo.md` | SSOT de fórmulas de escandallo |
| `docs/sql/admin_policies_v2.sql` | Base de `is_admin()`, a extender en Fase 1 |
| `docs/sql/inventory_trigger.sql` | RPC stock; caller = servicio |
| `docs/sql/loyalty_points.sql` | RPC puntos; corregir columna a `points` |

---

## 12. Métricas de éxito

- Las páginas son composiciones ligeras; no concentran reglas, consultas y modales grandes.
- Cada dominio tiene ubicación predecible y dependencias según §6.2.
- Ninguna operación crítica depende de seguridad del cliente (S1–S12 cerrados).
- Migraciones reproducibles, revisadas y verificadas en staging antes de producción.
- `typecheck`, `build` y tests de autorización pasan desde Fase 1; cobertura de servicios, lint y CI completo desde Fase 5.
- No entran `any` nuevos; los viejos desaparecen por dominio en Fase 4.
- Añadir una promoción, un estado de pedido o un insumo toca sobre todo un módulo, no pantallas copiadas.
- El precio cobrado y el stock descontado se pueden explicar leyendo un servicio, no un `.vue`.
- Los reintentos de checkout no duplican órdenes ni efectos de inventario/puntos.
- Un quiebre de insumo no mueve el pedido ni deja stock a medias.
- El equipo puede desplegar, detectar un fallo y volver a una versión segura siguiendo §15, §16 y §20.
- Dos POST iguales no crean dos pedidos. Dos transiciones iguales no descuentan stock dos veces. Cada movimiento de inventario es trazable.
- Los importes de pedido no se calculan con `Number`. Los tipos de DB no se editan a mano.

---

## 13. Primera entrega y disciplina de avance

Ejecutar **Fase 0 y Fase 1** primero, en los PRs de §19: una plataforma reproducible, app compilable y permisos reales. La Fase 2 puede avanzar después sin bloquear la seguridad.

Después **Fase 3 completa** (dinero en servidor, contratos §14, corte §16) **antes** de partir componentes en Fase 4. Partir Vue con el checkout todavía escribiendo en Supabase solo replica el agujero en más archivos.

Luego Fase 4 un dominio a la vez, y Fase 5 para que el diseño y la operación no dependan de memoria individual.

Si una feature de producto urge en paralelo (por ejemplo un campo nuevo en checkout), se implementa **contra estas reglas**: API + servicio, no un `supabase.from()` extra en la página. No se espera a “terminar el refactor” para dejar de agrandar el problema.

Antes de marcar cualquier fase como hecha: recorrer el checklist de §20 que corresponda a esa fase. No se avanza con una fila crítica en rojo.

---

## 14. Contratos HTTP (no se improvisan)

Validación: Zod en el handler. El cliente valida para UX. Límites globales de checkout: body ≤ 32 KB, ≤ 30 líneas, cantidad 1–50, timezone `America/Lima` para “fecha no pasada”.

Teléfono Perú: 9 dígitos que empiezan por `9`, o `+51` + esos 9. Nombre 2–80 chars. Notas ≤ 500 (texto libre; **sin** re-embeber teléfono ni dirección). `delivery_date` YYYY-MM-DD. `delivery_time` `HH:mm`.

Importes en todos los DTOs de pedido: string `/^\d+\.\d{2}$/` (ej. `"42.50"`). El servicio los pasa a céntimos antes de sumar. El cliente **no** envía precios; si los manda, se ignoran.

Cabeceras de checkout:

```text
Idempotency-Key: <uuid v4>     # obligatorio en POST /api/checkout y POST /api/admin/orders
X-Request-Id: <uuid>           # opcional; si no viene, el servidor lo genera y lo devuelve
```

### 14.1 `POST /api/checkout`

Público (invitado o sesión). No exige JWT. Si hay sesión, `profile_id = auth.uid()`; si no, `null`.

```ts
// body
{
  channel: 'direct' | 'whatsapp_chat'
  customer_name: string
  customer_phone?: string        // obligatorio si channel = 'direct'
  address?: string               // obligatorio si channel = 'direct'
  delivery_date?: string
  delivery_time?: string
  notes?: string
  items: { product_id: number; quantity: number }[]
}

// 201
{
  request_id: string
  order: {
    id: string
    status: 'pending'
    profile_id: string | null
    customer_name: string
    customer_phone: string | null
    total_amount: string         // servidor, "42.50"
    delivery_date: string | null
    delivery_time: string | null
    items: {
      product_id: number
      name: string
      quantity: number
      price_at_time: string      // servidor, "12.00"
    }[]
  }
}
```

El cliente **ignora** cualquier precio o total que mandara el carrito. WhatsApp se arma con `order.items` y `order.total_amount`. `address` y teléfono se persisten en `orders.address` / `customer_*` y, si hay sesión y teléfono, el servicio actualiza `profiles.phone`. No se copian otra vez a `notes`.

### 14.2 `POST /api/admin/orders`

`require-admin`. Mismo body que checkout salvo `channel` fijo `'admin'` (no se acepta otro). `customer_name` e `items` obligatorios. `profile_id` opcional (uuid de un perfil existente; si no existe → `PROFILE_NOT_FOUND`). Prohibido insertar en `profiles`.

### 14.3 `PATCH /api/admin/orders/:id/status`

`require-admin`.

```ts
// body
{ status: 'processing' | 'ready' | 'completed' | 'cancelled' }

// 200
{
  request_id: string
  order_id: string
  from: string
  to: string
  inventory_processed: boolean
  points_awarded: boolean
}
```

### 14.4 Lecturas

| Ruta | Auth | Devuelve |
|---|---|---|
| `GET /api/products` | público | productos publicados, **sin** costo ni receta |
| `GET /api/profile/orders` | `require-user` | pedidos del `auth.uid()` |
| `GET /api/admin/orders` | `require-admin` | listado kanban + items + customer_* + address |
| `GET /api/admin/orders/:id` | `require-admin` | detalle |
| `GET /api/admin/materials` | `require-admin` | insumos |
| `GET /api/admin/recipes/:productId` | `require-admin` | receta + costos calculados en servidor |
| `GET/POST/DELETE /api/cart*` | — | **410** `CART_API_DISABLED` |

Mutaciones de catálogo/insumos/recetas: mismos DTOs de hoy (nombre, precio, unidad, cantidades) validados con Zod; viven bajo `/api/admin/*` desde Fase 3. GET público de productos puede quedarse en `/api/products` (Fase 1).

### 14.5 Catálogo de errores

Cuerpo uniforme: `{ error: { code, message, request_id, details? } }`. `details` de stock **solo** para admin.

| code | HTTP | Cuándo |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod falla |
| `UNAUTHORIZED` | 401 | Sin sesión donde se exige |
| `FORBIDDEN` | 403 | Sesión no admin / no dueño |
| `PRODUCT_NOT_FOUND` | 422 | `product_id` inexistente |
| `PRODUCT_UNAVAILABLE` | 422 | producto no publicado / no disponible |
| `PROFILE_NOT_FOUND` | 422 | `profile_id` admin inválido |
| `INSUFFICIENT_STOCK` | 409 | `processing` dejaría un insumo < 0 |
| `FORBIDDEN_TRANSITION` | 409 | salto o estado terminal |
| `IDEMPOTENT_REPLAY` | 200 | misma key + mismo hash; se devuelve el pedido original (no es error; el handler corta) |
| `IDEMPOTENCY_KEY_REUSED` | 409 | misma key + hash distinto |
| `IDEMPOTENCY_IN_PROGRESS` | 409 | misma key, pedido aún sin `order_id`; `Retry-After: 2` |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | falta cabecera |
| `RATE_LIMITED` | 429 | > 10 checkouts / 15 min / IP |
| `CART_API_DISABLED` | 410 | cualquier `/api/cart` |
| `CONFLICT` | 409 | carrera (pedido ya movido) |
| `INTERNAL_ERROR` | 500 | no clasificado; se loguea con `request_id` |

---

## 15. Secretos y entorno

| Variable | Dónde | Pública | Notas |
|---|---|---|---|
| `SUPABASE_URL` | `runtimeConfig.public.supabaseUrl` | sí | Hoy está hardcodeada en `nuxt.config.ts`; sale en Fase 0 |
| `SUPABASE_KEY` | `runtimeConfig.public.supabaseAnonKey` | sí | Anon key. No es secreta, pero no se commitea como única fuente |
| `SUPABASE_SERVICE_ROLE_KEY` | `runtimeConfig.supabaseServiceRoleKey` (privado) | **no** | Solo Nitro. Solo `order.service` (y migraciones CLI). Nunca `useRuntimeConfig().public` |
| `NUXT_PUBLIC_WHATSAPP_NUMBER` | `runtimeConfig.public.whatsappNumber` | sí | Reemplaza `51998265700` en `checkout.vue` |
| `NUXT_PUBLIC_SITE_URL` | `runtimeConfig.public.siteUrl` | sí | Origen canónico (ej. `https://dulcefe.vercel.app`). Allowlist de Origin + previews `https://${VERCEL_URL}` |

Prohibido: service role en el cliente, en `.vue`, en logs, en Git, en `nuxt.config` literal. Si se filtra: rotar en el dashboard de Supabase **antes** de seguir.

El módulo `@nuxtjs/supabase` recibe URL y keys desde env (`supabase.url`, `supabase.key`, `supabase.serviceKey`). `redirect` sigue en `false`.

Quién usa qué cliente:

```text
Lectura pública / sesión de usuario  → serverSupabaseClient / cliente del browser
Mutación de dinero, stock, puntos,
corte RLS, revoke RPCs               → serverSupabaseServiceRole  (solo servicios)
```

Dependencias muertas a quitar en Fase 1 si nadie las importa: `bcryptjs`, `jsonwebtoken` (el login JWT propio no se usa).

---

## 16. Política de stock y corte S9

### 16.1 Quiebre de insumos

Antes de `UPDATE orders SET status = 'processing'`:

1. `UPDATE orders SET status = 'processing' WHERE id = ? AND status = 'pending' AND inventory_processed = false` (o equivalente en la RPC). Cero filas → `CONFLICT`.
2. Calcular `total_needed` por `raw_material_id` con la receta vigente. Unidades = `raw_materials.unit`.
3. Leer esas filas `FOR UPDATE` ordenadas por `id ASC`.
4. Si alguna `stock < total_needed` → abortar, estado sigue `pending`, código `INSUFFICIENT_STOCK`. `details` admin: `{ material_id, name, have, need, unit }`.
5. Si todas alcanzan → insertar **un** `inventory_movements` por `raw_material_id` (cantidades ya agregadas), descontar stock, `inventory_processed = true`, estado `processing`. El unique `(order_id, raw_material_id)` impide duplicar la línea.

Producto sin `recipe_items`: no bloquea. Stock de producto (`products.stock`) no participa.

### 16.2 Runbook S9 (orden no negociable)

Hoy el checkout autenticado inserta desde el browser porque RLS lo permite (`auth.uid() = profile_id`). Quitar ese INSERT **antes** de tener `POST /api/checkout` en producción deja la tienda muerta.

```text
1. Staging: API checkout + admin orders + tests §18.
2. Producción: desplegar la app nueva (Vue ya no inserta; llama a la API).
   Verificar 1 pedido invitado y 1 autenticado reales o de prueba.
3. Recién entonces aplicar la migración que DROP POLICY de INSERT
   en orders y order_items para authenticated, y REVOKE EXECUTE
   de process_order_inventory / award_loyalty_points a anon y authenticated.
4. Verificar: cliente Supabase con sesión de no-admin recibe error
   al from('orders').insert(...). La API sigue creando.
5. Rollback de app: volver al release anterior SOLO si el paso 3
   no se aplicó. Si el paso 3 ya corrió, rollback de app sin
   restaurar INSERT deja checkout roto. Restaurar políticas
   es la migración compensatoria documentada en el PR de SQL.
```

`profile_id` nullable se confirma en la misma migración de Fase 3 que añade `customer_name`, `customer_phone`, `address`, `inventory_processed` y ensancha importes a `numeric(12,2)`.

---

## 17. Tablas de apoyo (sin Redis)

Migración única de Fase 3 (además de columnas de `orders`, ensanche `numeric(12,2)` y grants de RPCs).

```sql
-- Idempotencia de checkout / pedido admin (TTL 24 h)
CREATE TABLE public.checkout_idempotency_keys (
  operation        text NOT NULL,
  principal_scope  text NOT NULL,
  key              text NOT NULL,
  request_hash     text NOT NULL,
  order_id         uuid REFERENCES public.orders(id),
  lifecycle        text NOT NULL CHECK (lifecycle IN ('processing', 'completed')),
  status_code      int  NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  PRIMARY KEY (operation, principal_scope, key)
);
CREATE INDEX checkout_idempotency_keys_expires_at_idx
  ON public.checkout_idempotency_keys (expires_at);

-- Rate limit: 10 POST /api/checkout cada 15 min por IP
CREATE TABLE public.checkout_rate_windows (
  ip            inet NOT NULL,
  window_start  timestamptz NOT NULL,
  hit_count     int  NOT NULL DEFAULT 1,
  PRIMARY KEY (ip, window_start)
);

-- Auditoría mínima (Fase 3: pedidos; catálogo/insumos/recetas al mover esas APIs)
CREATE TABLE public.audit_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid,
  action      text NOT NULL,
  entity      text NOT NULL,
  entity_id   text,
  result      text NOT NULL CHECK (result IN ('ok', 'error')),
  request_id  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Libro de inventario (Fase 3)
CREATE TABLE public.inventory_movements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id bigint NOT NULL REFERENCES public.raw_materials(id),
  order_id        uuid REFERENCES public.orders(id),
  type            text NOT NULL CHECK (type IN ('order_consumption', 'manual_adjustment')),
  quantity_delta  numeric(14,4) NOT NULL,
  stock_before    numeric(14,4) NOT NULL,
  stock_after     numeric(14,4) NOT NULL,
  reason          text,
  actor_id        uuid,
  request_id      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX inventory_movements_one_consumption_per_order_material
  ON public.inventory_movements (order_id, raw_material_id)
  WHERE type = 'order_consumption';
```

RLS: estas tablas no son accesibles a `anon`/`authenticated`. Solo service role / migraciones.

`operation`: `checkout.create` | `admin.order.create`.  
`principal_scope`: `guest` | `user:{uuid}` | `admin:{uuid}`.

Reglas:

- Reclamo: `INSERT` con `lifecycle = 'processing'` y `order_id` null. Conflicto + misma hash + `completed` → 200 replay. Conflicto + misma hash + `processing` → 409 `IDEMPOTENCY_IN_PROGRESS` + `Retry-After: 2`. Conflicto + hash distinta → 409 `IDEMPOTENCY_KEY_REUSED`.
- El hash es de una serialización canónica del body **validado** (channel + items + customer_* + fechas). Campos de presentación no entran.
- Una fila `order_id` null **nunca** se responde como 201. Al terminar, `lifecycle = 'completed'` y `order_id` not null, en la misma transacción que crea la orden.
- Limpieza TTL: borrar `expires_at < now()` **solo** si `lifecycle = 'completed'`. Índice por `expires_at`.
- Rate limit: `INSERT … ON CONFLICT (ip, window_start) DO UPDATE SET hit_count = checkout_rate_windows.hit_count + 1`.
- `audit_events.action` cerrado: `checkout.create` | `order.create_admin` | `order.status` | `product.write` | `material.write` | `recipe.write` | `upload.write` | `stock.adjust`.
- No guardar teléfono, notas, ni body crudo.
- `inventory_movements`: `order_consumption` exige `order_id`; `manual_adjustment` exige `reason` y `actor_id`. No hay `cancellation_reversal` hasta D1.

---

## 18. Stack de tests

Decisión: **Vitest + `@nuxt/test-utils`**. Playwright solo en Fase 5 (dos smokes: checkout invitado y login admin).

```text
tests/
  api/auth-guards.test.ts      # Fase 1
  api/upload.test.ts           # Fase 1
  api/cart-gone.test.ts        # Fase 1
  api/checkout.test.ts         # Fase 3
  services/order.service.test.ts
  rls/catalog-write.test.ts    # Fase 1, Supabase local
```

Scripts: `test` (vitest), `typecheck`, `build`. CI desde Fase 5; local desde Fase 1.

Cómo se autentica un test: usuarios seed en Supabase local (`anon`, `cliente@test`, `admin@test` con `profiles.is_admin = true`). Prohibido apuntar el suite por defecto al proyecto de producción. Staging es verificación manual + opcional.

Casos mínimos de Fase 3 (además de los de Fase 1):

1. Precio manipulado en el carrito → `price_at_time` = precio de `products`.
2. Invitado → `profile_id` null, 0 puntos al completar.
3. Autenticado + `completed` → `profiles.points` incrementa una vez.
4. Dos POST concurrentes (`Promise.all`) con la misma key → un pedido.
5. Misma key, ítems distintos → 409 `IDEMPOTENCY_KEY_REUSED`.
6. Segunda POST mientras `lifecycle = processing` → 409 `IDEMPOTENCY_IN_PROGRESS`.
7. Dos transiciones concurrentes a `processing` → un descuento y N movimientos (uno por insumo), no 2N.
8. Insumo insuficiente → 409, estado `pending`, stock igual, cero movimientos.
9. `pending → ready` → 409 `FORBIDDEN_TRANSITION`.
10. Cliente browser `from('orders').insert` → falla tras S9.
11. `anon`/`authenticated` `rpc('process_order_inventory')` → permiso denegado.
12. `0.10 + 0.20` en céntimos → `"0.30"`; puntos de `"42.50"` → 42.
13. Upload: `.exe`, MIME mentido y > 2 MB → 400; JPEG ≤ 2 MB admin → 200.
14. Ajuste manual de stock sin motivo → 400; con motivo → movimiento `manual_adjustment`.

---

## 19. Cortes de PR y esfuerzo

Tamaños para **un** dev que ya conoce el repo. No son plazos de calendario.

| PR | Fase | Qué entra | Tamaño |
|---|---|---|---|
| PR-0 | 0 | `.nvmrc`, `engines`, `runtimeConfig` §15 (`SITE_URL` + WhatsApp), sacar keys de `nuxt.config`, carpeta `supabase/migrations`, anotar Docker, baseline de build | S |
| PR-1a | 1 | Borrar `server/api/auth/*` y `middleware/admin.ts`. 410 en `/api/cart`. Fix `auto-animate`. Quitar `bcryptjs`/`jsonwebtoken` si no se usan | S |
| PR-1b | 1 | `require-user` / `require-admin` en todas las mutaciones actuales. Vaciar middleware global | M |
| PR-1c | 1 | Store `isAdmin` solo `profile.is_admin`. Migración RLS + `search_path` de `is_admin()` / `handle_new_user` | M |
| PR-1d | 1 | Upload 2 MB + magic bytes + path `products/<uuid>`. `typecheck` + `db:types`. Tests de guards + upload + cart 410 | M |
| PR-2 | 2 | Layouts `default`/`admin`, tokens Tailwind, pickers a `ui/` | M |
| PR-3a | 3 | Migraciones §16–§17 + columnas de `orders` + céntimos + grants RPC. `order.service` + `POST /api/checkout` + Origin/IP | L |
| PR-3b | 3 | Vue checkout deja de hablar con Supabase. WhatsApp con respuesta servidor | M |
| PR-3c | 3 | `PATCH` estado + pedido admin. Kanban y `NewOrderModal` dejan Supabase de mutación | L |
| PR-3d | 3 | Migración S9 **después** de 3b/3c en prod. Tests §18. Logs + `audit_events` | M |
| PR-3e | 3 | Catálogo / insumos / recetas bajo `/api/admin/*` + servicios | L |
| PR-4.* | 4 | Un dominio por PR (perfil, catálogo, inventario, recetas, pedidos UI) | M c/u |
| PR-5 | 5 | ESLint, CI (incl. gate de tipos §5.3), smokes Playwright, restore de backup en staging, a11y de flujos tocados | M |

Regla: si un PR mezcla “quitar INSERT de RLS” con “estrenar la API”, se parte. Esa mezcla es la forma de tumbar producción.

---

## 20. Checklist de validación y deuda

Cada fila es un punto que hay que **ver y marcar**. Crítica = no se avanza de fase con ella en rojo.

### 20.1 Fase 0–1

| ID | Qué validar | Cómo | Crítica |
|---|---|---|---|
| V1 | Build y typecheck | `npm run build` && `npm run typecheck` | sí |
| V2 | Service role no va al cliente | buscar en el bundle / Network: no aparece `service_role` | sí |
| V3 | Keys fuera de `nuxt.config` | el archivo no contiene la URL ni el JWT anon | sí |
| V4 | S1 muerto | `POST /api/auth/register` → 404 | sí |
| V5 | Anónimo no muta catálogo | POST products / materials / recipes / upload → 401 | sí |
| V6 | Cliente logueado no muta catálogo | mismo, 403 | sí |
| V7 | Admin sí muta | 200/201 | sí |
| V8 | RLS equivalente | cliente Supabase no-admin no inserta products / materials / recipe_items | sí |
| V9 | `isAdmin` no lee JWT | forjar `user_metadata.is_admin` no abre `/admin` | sí |
| V10 | Upload | no-admin 403; `.exe`, MIME mentido o > 2 MB → 400; jpeg ≤ 2 MB ok | sí |
| V11 | Cart 410 | GET/POST/DELETE `/api/cart` | sí |
| V12 | Middleware muerto | `admin.ts` no existe; solo `admin-only` | no |
| V13 | Tests de guards | `npm run test` verde en local | sí |

### 20.2 Fase 2

| ID | Qué validar | Cómo | Crítica |
|---|---|---|---|
| V14 | Chrome único | `/`, `/menu`, `/login`, `/checkout`, `/perfil` usan `default`; `/admin` usa `admin` | sí |
| V15 | Token de marca | cambiar `brand.primary` mueve header/footer/shell | no |
| V16 | Desktop + móvil | mismos flujos que antes, sin regresión de compra | sí |

### 20.3 Fase 3

| ID | Qué validar | Cómo | Crítica |
|---|---|---|---|
| V17 | Precio servidor | checkout con item.price = 1 → `price_at_time` = precio DB | sí |
| V18 | Total servidor | `total_amount` = suma servidor, no del Pinia | sí |
| V19 | Invitado | pedido ok, `profile_id` null | sí |
| V20 | Autenticado | `profile_id` = uid; teléfono llega a perfil vía API | sí |
| V21 | Guest + RLS | invitado no necesita INSERT público; lo hace el servicio | sí |
| V22 | Idempotencia ok | dos POST, misma key, un pedido | sí |
| V23 | Idempotencia conflicto | misma key, body distinto, 409 | sí |
| V24 | Rate limit | 11º POST / 15 min / IP → 429 | no |
| V25 | Atomicidad | fallo a mitad no deja order sin items | sí |
| V26 | Processing una vez | dos PATCH processing → un descuento | sí |
| V27 | Quiebre | stock 0 → 409, sigue pending | sí |
| V28 | Sin salto | pending→ready → 409 | sí |
| V29 | Puntos | completed + profile → `points` + floor(cents/100); `"42.50"` → 42; segunda vez no suma | sí |
| V30 | Invitado completed | 0 puntos | sí |
| V31 | Cancel pending | no stock, no puntos | sí |
| V32 | Cancel post-processing | no revierte stock (deuda D1); no puntos | no |
| V33 | Admin order | sin perfil fantasma; `customer_name` persistido | sí |
| V34 | RPC revocada | browser `rpc('process_order_inventory')` denegado | sí |
| V35 | S9 | browser `from('orders').insert` denegado; API ok | sí |
| V36 | WhatsApp | texto usa precios de la respuesta API | sí |
| V37 | Logs | error de checkout tiene `request_id` y `code`; no token | sí |
| V38 | Audit | crear/cambiar pedido escribe `audit_events` | no |
| V39 | Kanban | Vue no llama `supabase.from('orders').update` ni RPCs | sí |
| V45 | Céntimos | dos líneas `"0.10"` + `"0.20"` → total `"0.30"`; DTO no usa `number` | sí |
| V46 | Idempotencia in-flight | segundo POST concurrente → 409 `IDEMPOTENCY_IN_PROGRESS` o un solo 201 | sí |
| V47 | Libro de inventario | `processing` crea movimientos; segundo `processing` no duplica filas | sí |
| V48 | Origin / IP | Origin no listado → 403; rate limit usa `getRequestIP` | no |
| V49 | Notas sin PII embebida | checkout persistido no repite teléfono/dirección en `notes` | sí |

### 20.4 Fase 4–5

| ID | Qué validar | Cómo | Crítica |
|---|---|---|---|
| V40 | Dominio encontrable | UI + composable + API + servicio + tipos del mismo feature | sí (por dominio) |
| V41 | Sin `any` nuevo | ESLint | sí |
| V42 | CI | typecheck, lint, test, build, migrate from scratch, `db:types` sin diff | sí |
| V43 | A11y mínima | label, foco, teclado, error ligado al campo en checkout y login | no |
| V44 | Backup / rollback | dump de Supabase restaurado en staging al menos una vez | sí |
| V50 | Drift de tipos | editar `database.types.ts` a mano falla CI | sí |

### 20.5 Deuda explícita (no se “olvida”: se nombra)

| ID | Deuda | Por qué no entra ahora | Se reabre cuando |
|---|---|---|---|
| D1 | Revertir stock al cancelar después de `processing` | Requiere RPC de compensación y decisión de negocio (¿insumo ya usado?) | ADR + dueño de pastelería |
| D2 | Tracking de invitado `/pedido/[token]` | plan-maestro lo pide; no bloquea dinero | Feature de producto |
| D3 | Carrito en DB (`carts` / `cart_items`) | Pinia+cookie basta | ADR |
| D4 | `products.stock` | No es el inventario real | ADR de catálogo |
| D5 | Pagos Yape / Plin / tarjeta | plan-maestro; hoy el cobro es WhatsApp | Feature de producto |
| D6 | n8n, KDS, RBAC 4 roles, pasteles a medida, Meilisearch | Fuera de alcance de este archivo | plan-maestro |
| D7 | Reversión de puntos si se “des-completa” | completed es terminal | Nunca, salvo ADR que abra el estado |
| D8 | Snapshot / versionado de receta al vender | El costeo histórico no es bloqueo de Fase 3; se usa la receta vigente en `processing` | ADR de recetas |

Nada de D1–D8 se implementa “de paso” en un PR de refactor. Si urge, se abre ADR y se trata como feature, con API + servicio. `cancellation_reversal` no existe en el DDL hasta D1.
