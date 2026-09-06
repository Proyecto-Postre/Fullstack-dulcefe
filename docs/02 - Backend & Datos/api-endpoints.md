---
tipo: api-catalog
modulo: backend-nitro
framework: Nuxt 4 (Nitro Server Engine)
seguridad: Supabase Auth / JWT + RLS
relacionado:
  - "[[esquema-base-datos]]"
  - "[[arquitectura-patrones]]"
  - "[[formulas-costeo]]"
  - "[[ADR-003-seguridad-rls-supabase-hardening]]"
  - "[[ADR-004-motor-escandallos-exportacion-exceljs]]"
ultima_actualizacion: 2026-08-26
---

# ⚡ Catálogo Maestro de Endpoints API — Backend Nitro

Este documento centraliza todas las rutas del backend en `server/api/`. Cada endpoint cuenta con su ficha técnica individual detallada en la carpeta `endpoints/`.

---

## 🔐 Seguridad & Guardianes de Acceso
* **`requireUser(event)`:** Valida sesión activa con token JWT de Supabase.
* **`requireAdmin(event)`:** Valida permisos de administrador (`is_admin = true`). Protegido a nivel de base de datos según [[ADR-003-seguridad-rls-supabase-hardening]].

---

## 📦 1. Módulo: Catálogo de Productos (`/api/products`)
* [[GET-api-products|GET /api/products]] — 🌐 Catálogo público de postres y tortas.
* [[POST-api-products|POST /api/products]] — 🔒 Creación de nuevo postre (Solo Admin).
* [[GET-api-products-id|GET /api/products/:id]] — 🌐 Ficha detallada de un postre por ID.
* [[PUT-api-products-id|PUT /api/products/:id]] — 🔒 Actualización de nombre, precio o stock (Solo Admin).
* [[DELETE-api-products-id|DELETE /api/products/:id]] — 🔒 Eliminación de un postre (Solo Admin).
* [[POST-api-products-upload|POST /api/products/upload]] — 🔒 Subida de imágenes a Supabase Storage (Solo Admin).

---

## 🌾 2. Módulo: Materias Primas & Almacén (`/api/raw-materials`)
Alimenta el cerebro financiero de escandallos ([[formulas-costeo]]).
* [[GET-api-raw-materials|GET /api/raw-materials]] — 🔒 Inventario de insumos con costo unitario en gramos/ml.
* [[POST-api-raw-materials|POST /api/raw-materials]] — 🔒 Registro de compras por volumen (sacos, litros, cajas).
* [[PUT-api-raw-materials-id|PUT /api/raw-materials/:id]] — 🔒 Ajustes de inventario y actualización de costos.
* [[DELETE-api-raw-materials-id|DELETE /api/raw-materials/:id]] — 🔒 Baja de materias primas.

---

## 🧾 3. Módulo: Fichas Técnicas & Escandallos (`/api/recipes`)
* [[GET-api-recipes-productId|GET /api/recipes/:productId]] — 🔒 Ficha técnica de un postre con insumos y gramos usados.
* [[POST-api-recipes|POST /api/recipes]] — 🔒 Guardar o actualizar la receta de un postre.
* [[DELETE-api-recipes-id|DELETE /api/recipes/:id]] — 🔒 Remover ingrediente de una receta.
* [[GET-api-recipes-export|GET /api/recipes/export]] — 🔒 Generación en streaming de libro Excel (`.xlsx`) con fórmulas vivas según [[ADR-004-motor-escandallos-exportacion-exceljs]].

---

## 🛒 4. Módulo: Carrito de Compras (`/api/cart`) [DESACTIVADO 410 GONE]
* [[GET-api-cart|GET /api/cart]] — ⛔ Desactivado (410 GONE). Carrito gestionado 100% en cliente con Pinia según [[ADR-006-carrito-cliente-pinia-cookies]].
* [[POST-api-cart|POST /api/cart]] — ⛔ Desactivado (410 GONE).
* [[DELETE-api-cart-productId|DELETE /api/cart/:productId]] — ⛔ Desactivado (410 GONE).

---

## 💳 5. Módulo: Checkout & Pedidos Públicos (`/api/checkout`)
* [[POST-api-checkout|POST /api/checkout]] — 🌐 Checkout transaccional con precios de servidor en céntimos, soporte de invitados y usuarios registrados, control de idempotencia de 24h y rate limiting por IP.

---

## 📋 6. Módulo: Pedidos & Operaciones Admin (`/api/admin/orders`)
* [[GET-api-admin-orders|GET /api/admin/orders]] — 🔒 Listado completo de órdenes para el tablero Kanban con relaciones (Solo Admin).
* [[GET-api-admin-orders-id|GET /api/admin/orders/:id]] — 🔒 Detalle exhaustivo de una orden específica (Solo Admin).
* [[PATCH-api-admin-orders-id|PATCH /api/admin/orders/:id]] — 🔒 Actualización de datos del cliente, fecha, hora de entrega y notas (Solo Admin).
* [[PATCH-api-admin-orders-id-status|PATCH /api/admin/orders/:id/status]] — 🔒 Transición de estado de pedidos en Kanban KDS, quiebre atómico de insumos y otorgamiento de puntos (Solo Admin).
* [[POST-api-admin-orders|POST /api/admin/orders]] — 🔒 Creación de pedidos manuales de mostrador con precios oficiales de servidor y cero perfiles fantasma (Solo Admin).

---

## 🛠️ 7. Módulo: Dominio Administrativo Namespace (`/api/admin/*`)
Rutas con namespace dedicado que delegan a `CatalogService`, `InventoryService` y `RecipeService`:
* `/api/admin/products` — Gestión de catálogo delegado a `CatalogService`.
* `/api/admin/materials` — Gestión de materias primas con kardex delegado a `InventoryService`.
* `/api/admin/recipes` — Gestión de fichas técnicas delegada a `RecipeService`.


