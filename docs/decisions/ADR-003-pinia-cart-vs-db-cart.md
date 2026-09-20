# ADR-003: Persistencia de Carrito Local (Pinia + Cookies) vs Carritos en Base de Datos (Deuda D3)

* **Estado:** Aceptado
* **Fecha:** 2026-09-06
* **Decisores:** Equipo de Arquitectura Dulce Fe
* **Referencia SSOT:** `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§6.1, §10.5, §11, §20.5 D3)

---

## 1. Contexto y Problema

El repositorio contenía originalmente endpoints `/api/cart` y borradores SQL en `docs/sql/cart_tables.sql` orientados a guardar cada adición de producto en tablas `carts` y `cart_items` en la base de datos PostgreSQL de Supabase.

Esta arquitectura generaba contención severa de escritura, incremento exponencial de conexiones a la base de datos para usuarios que solo exploran productos, acumulación de carritos huérfanos y vulnerabilidad ante manipulación de sesión en clientes no autenticados.

---

## 2. Factores Decisivos (Decision Drivers)

1. **Rendimiento y Contención:** Eliminar transacciones de red innecesarias hacia Supabase mientras el usuario agrega o remueve postres.
2. **Resiliencia Offline/Local:** La interacción con el carrito debe ser instantánea y funcionar fluidamente sin latencia de red.
3. **Seguridad Financiera:** La única entidad con autoridad monetaria es la orden generada en el servidor (`order.service.ts`). El carrito en el cliente es meramente una herramienta de navegación.

---

## 3. Opciones Consideradas

* **Opción A:** Reactivar las tablas en base de datos (`carts` / `cart_items`) e intermediar cada clic con llamadas HTTP.
* **Opción B (Adoptada):** Deprecar los endpoints de carrito con código HTTP 410 Gone (Fase 1), congelar `docs/sql/cart_tables.sql` y delegar el estado de selección al store local de Pinia persistido en Cookies Seguras (`pinia-plugin-persistedstate`).

---

## 4. Decisión Adoptada

Se adopta la **Opción B**. 
1. Los endpoints `/api/cart` quedan desactivados y responden HTTP 410.
2. El carrito reside en Pinia (`app/stores/cart.ts`) y se sincroniza en cookies del navegador (`storage: 'cookies'`).
3. El servidor nunca confía en los precios almacenados en el carrito: al pulsar "Comprar", el cliente envía únicamente `{ product_id, quantity }`, y el servidor recalcula el total exacto contra la tabla `products`.

---

## 5. Consecuencias

### Positivas
* Experiencia de usuario con latencia cero al alterar cantidades en el catálogo.
* Cero carga de transacciones y cero almacenamiento residual en Supabase.
* Cumplimiento estricto del principio de frontera cliente/servidor (§6.2).

### Negativas / Deuda Técnica
* Si un usuario cambia de dispositivo o navegador antes de completar su pedido, los productos seleccionados no se replican entre dispositivos.

---

## 6. Condiciones de Reapertura

Solo se evaluará la persistencia en base de datos si en el futuro se introduce una funcionalidad de marketing para recuperación de carritos abandonados mediante campañas de correo electrónico automáticas.
