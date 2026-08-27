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

## 🛒 4. Módulo: Carrito de Compras (`/api/cart`)
* [[GET-api-cart|GET /api/cart]] — 👤 Carrito de compras para usuarios autenticados.
* [[POST-api-cart|POST /api/cart]] — 👤 Agregar o actualizar cantidad de postres en el carrito.
* [[DELETE-api-cart-productId|DELETE /api/cart/:productId]] — 👤 Quitar postre del carrito.
*(Nota: Para visitantes anónimos el carrito opera 100% en cliente con Pinia según [[ADR-006-carrito-cliente-pinia-cookies]]).*
