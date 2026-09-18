---
tipo: api-catalog
modulo: backend-nitro
framework: Nuxt 4 (Nitro Server Engine)
seguridad: Supabase Auth / JWT + RLS + Rate Limiting
relacionado:
  - "[[esquema-base-datos]]"
  - "[[arquitectura-patrones]]"
  - "[[formulas-costeo]]"
  - "[[ADR-002-guest-order-tracking]]"
  - "[[ADR-003-seguridad-rls-supabase-hardening]]"
  - "[[ADR-004-motor-escandallos-exportacion-exceljs]]"
  - "[[ADR-005-payment-gateways]]"
  - "[[ADR-008-recipe-versioning]]"
ultima_actualizacion: 2026-09-15
---

# ⚡ Catálogo Maestro de Endpoints API — Backend Nitro

Este documento centraliza todas las rutas oficiales del backend en `server/api/`. Cada endpoint cuenta con su ficha técnica individual detallada en la carpeta `endpoints/`.

---

## 🔐 Seguridad & Guardianes de Acceso
* **`requireUser(event)`:** Valida sesión activa con token JWT de Supabase Auth.
* **`requireAdmin(event)`:** Valida permisos estrictos de administrador (`is_admin = true`). Protegido a nivel de base de datos según [[ADR-003-seguridad-rls-supabase-hardening]].
* **`getAdminSupabaseClient(event)`:** Inicializa cliente con credenciales de Service Role en servidor para operaciones con auditoría y bypass controlado de RLS.
* **`validateImageBuffer(data, length)`:** Validación de Magic Bytes en uploads binarios contra inyecciones de archivos.
* **`isValidTrackingTokenFormat(token)`:** Validación de formato SHA-256 (64 hex) para consulta pública sin sesión.

---

## 🍰 1. Módulo: Catálogo de Productos (`/api/products`)
* [[GET-api-products|GET /api/products]] — 🌐 Catálogo público de postres y tortas con stock disponible.
* [[POST-api-products|POST /api/products]] — 🔒 Creación de nuevo postre (Solo Admin).
* [[GET-api-products-id|GET /api/products/:id]] — 🌐 Ficha detallada de un postre por ID.
* [[PUT-api-products-id|PUT /api/products/:id]] — 🔒 Actualización de nombre, precio o stock (Solo Admin).
* [[DELETE-api-products-id|DELETE /api/products/:id]] — 🔒 Eliminación de un postre (Solo Admin).
* [[POST-api-products-upload|POST /api/products/upload]] — 🔒 Subida segura de imágenes a Supabase Storage con Magic Bytes (Solo Admin).

---

## 🏷️ 2. Módulo: Categorías de Vitrina (`/api/categories`)
* [[GET-api-categories|GET /api/categories]] — 🌐 Listado público de categorías activas para filtros dinámicos en vitrina.

---

## 👤 3. Módulo: Autenticación & Perfil (`/api/auth`)
* [[GET-api-auth-profile|GET /api/auth/profile]] — 👤 Consulta del perfil autenticado en `public.profiles` con normalización de ID/sub.

---

## 🌾 4. Módulo: Materias Primas & Almacén (`/api/raw-materials`)
Alimenta el cerebro financiero de escandallos ([[formulas-costeo]]).
* [[GET-api-raw-materials|GET /api/raw-materials]] — 🔒 Inventario de insumos con costo unitario en gramos/ml.
* [[POST-api-raw-materials|POST /api/raw-materials]] — 🔒 Registro de compras por volumen (sacos, litros, cajas).
* [[PUT-api-raw-materials-id|PUT /api/raw-materials/:id]] — 🔒 Ajustes de inventario y actualización de costos de compra.
* [[DELETE-api-raw-materials-id|DELETE /api/raw-materials/:id]] — 🔒 Baja de materias primas.

---

## 🧾 5. Módulo: Fichas Técnicas & Escandallos (`/api/recipes`)
* [[GET-api-recipes-productId|GET /api/recipes/:productId]] — 🔒 Ficha técnica de un postre con insumos y gramos usados.
* [[POST-api-recipes|POST /api/recipes]] — 🔒 Guardar o actualizar la receta de un postre.
* [[DELETE-api-recipes-id|DELETE /api/recipes/:id]] — 🔒 Remover ingrediente de una receta.
* [[GET-api-recipes-export|GET /api/recipes/export]] — 🔒 Generación en streaming de libro Excel (`.xlsx`) con fórmulas vivas según [[ADR-004-motor-escandallos-exportacion-exceljs]].

---

## 🛒 6. Módulo: Carrito de Compras (`/api/cart`) [DESACTIVADO 410 GONE]
* [[GET-api-cart|GET /api/cart]] — ⛔ Desactivado (410 GONE). Carrito gestionado 100% en cliente con Pinia según [[ADR-006-carrito-cliente-pinia-cookies]].
* [[POST-api-cart|POST /api/cart]] — ⛔ Desactivado (410 GONE).
* [[DELETE-api-cart-productId|DELETE /api/cart/:productId]] — ⛔ Desactivado (410 GONE).

---

## 💳 7. Módulo: Checkout, Pagos & Comprobantes (`/api/checkout`)
* [[POST-api-checkout|POST /api/checkout]] — 🌐 Checkout transaccional con precios oficiales de servidor en céntimos, soporte de invitados y usuarios registrados, control de idempotencia de 24h y rate limit por IP.
* [[POST-api-checkout-upload-receipt|POST /api/checkout/upload-receipt]] — 🌐 Subida segura de comprobantes de pago (Yape/Plin) con validación Magic Bytes y límite de 2 MB en bucket `payment-receipts` ([[ADR-005-payment-gateways]]).

---

## 📍 8. Módulo: Seguimiento de Invitados (`/api/orders/track`)
* [[GET-api-orders-track-token|GET /api/orders/track/:token]] — 🌐 Consulta pública de estado de pedido en tiempo real mediante token HMAC-SHA256, con anonimización y protección de datos según Ley 29733 ([[ADR-002-guest-order-tracking]]).
* `GET /api/orders/track/:token/stream` — 🌐 Transmisión continua Server-Sent Events (SSE) en tiempo real con `createEventStream`, eliminando el polling periódico y notificando cambios de estado inmediatamente ([[patron-tiempo-real-sse]]).

---

## 📋 9. Módulo: Pedidos & Operaciones Admin (`/api/admin/orders`)
* [[GET-api-admin-orders|GET /api/admin/orders]] — 🔒 Listado completo de órdenes para el tablero Kanban con relaciones (Solo Admin).
* [[GET-api-admin-orders-id|GET /api/admin/orders/:id]] — 🔒 Detalle exhaustivo de una orden específica (Solo Admin).
* [[PATCH-api-admin-orders-id|PATCH /api/admin/orders/:id]] — 🔒 Actualización de datos del cliente, fecha, hora de entrega y notas (Solo Admin).
* [[PATCH-api-admin-orders-id-status|PATCH /api/admin/orders/:id/status]] — 🔒 Transición de estado de pedidos en Kanban KDS, quiebre atómico de insumos y otorgamiento de puntos (Solo Admin).
* [[POST-api-admin-orders|POST /api/admin/orders]] — 🔒 Creación de pedidos manuales de mostrador con precios de servidor y cero perfiles fantasma (Solo Admin).
* [[POST-api-admin-orders-id-verify-payment|POST /api/admin/orders/:id/verify-payment]] — 🔒 Validación o rechazo en 1-click de comprobantes de pago y emisión de evento auditable `payment.verified` ([[ADR-005-payment-gateways]]).
* [[GET-api-admin-orders-id-cost-snapshot|GET /api/admin/orders/:id/cost-snapshot]] — 🔒 Congelamiento inmutable de escandallo de costos (COGS) y margen bruto al entrar a producción ([[ADR-008-recipe-versioning]]).

---

## 👨‍🍳 10. Módulo: Kitchen Display System (`/api/admin/kds`)
* [[GET-api-admin-kds-orders|GET /api/admin/kds/orders]] — 🔒 Comandas de cocina activas (`pending`, `processing`, `ready`) con receta detallada para agregación de lotes mise en place.

---

## 🛠️ 11. Módulo: Servicios Delegados Namespace (`/api/admin/*`)
Rutas con namespace dedicado que delegan a `CatalogService`, `InventoryService` y `RecipeService`:
* `/api/admin/products` — Endpoints POST, PUT, DELETE delegados a `CatalogService`.
* `/api/admin/materials` — Endpoints GET, POST, PUT, DELETE con kardex delegados a `InventoryService`.
* `/api/admin/recipes` — Endpoints GET, POST, DELETE delegados a `RecipeService`.
