# Informe Didáctico y Técnico — Fase 3 (PR-3c): Transiciones de Estado, Pedidos de Administración y Quiebre de Inventario

**Estado:** ✅ Completado, Verificado y Certificado con 0 Errores  
**Fecha:** 5 de Septiembre, 2026  
**Documento de referencia:** [[architecture-refactor-plan]] (§7.3, §7.7, §7.8, §14.2, §14.3, §16.1, §17, §19 PR-3c, §20.3 V26, V27, V28, V29, V30, V31, V33, V37, V38, V39, V47)  
**Rama activa:** `feat/fase-03-restructuration_proyect`  
**Entrega:** Subfase PR-3c (Endpoint `PATCH /api/admin/orders/:id/status` + Endpoint `POST /api/admin/orders` + Quiebre Atómico de Insumos en `inventory_movements` + Acumulación Incorruptible de Puntos + Desacoplamiento de `AdminOrdersTab.vue` y `NewOrderModal.vue` + Cero Perfiles Fantasma + 44 Tests Vitest)

---

## 1. ¿Qué es la Subfase PR-3c y por qué es el corazón operativo de la pastelería?

Si en **PR-3a** y **PR-3b** construimos la caja registradora y blindamos la vitrina frente al cliente:
* En **PR-3c** nos metemos a la **Cocina (Obrador) y a la Administración de Pedidos**:
  * **El Peligro Anterior:**  
    En el tablero visual de pedidos (`AdminOrdersTab.vue`), cualquier persona en el navegador podía arrastrar una tarjeta y disparar llamadas RPC directas a la base de datos (`process_order_inventory` y `award_loyalty_points`). Además, al crear un pedido manual en el mostrador (`NewOrderModal.vue`), el sistema generaba un usuario falso inventado en la base de datos y mandaba precios manuales que el cliente podía manipular.
  * **La Solución PR-3c:**  
    1. **Matriz Oficial de Estados:** No se puede pasar de un pedido recién recibido a listo para entrega sin haberlo horneado primero.
    2. **Quiebre de Inventario Inviolable:** Al mover un pedido a "Horneando" (`processing`), el servidor consulta la receta exacta de cada postre, suma los gramos necesarios de harina, azúcar y mantequilla, y si falta aunque sea 1 gramo, el pedido **no se mueve** y responde con un error claro indicando el insumo exacto que falta.
    3. **Libro Mayor de Movimientos:** Cada gramo descontado queda sellado en la tabla `inventory_movements` con el ID de la orden y el usuario administrador responsable.
    4. **Otorgamiento Automático de Puntos:** Al entregar el pedido (`completed`), los puntos de fidelidad se acreditan directamente en el perfil del cliente, impidiendo duplicaciones.
    5. **Cero Perfiles Fantasma:** Los pedidos manuales de mostrador se crean con `channel: 'admin'` sin inventar perfiles ficticios en la base de datos.

---

## 2. Matriz Estricta de Transiciones de Estado (§7.3)

```text
pending ───► processing ───► ready ───► completed (terminal)
   │               │            │
   └───────────────┴────────────┴─────► cancelled (terminal)
```

1. `pending`: Pedido recién recibido.
2. `processing`: Horneando. Aquí se produce el **quiebre y descuento de materias primas**.
3. `ready`: Listo para despacho o recojo en vitrina.
4. `completed`: Entregado. Aquí se otorgan los **puntos de lealtad**. Estado terminal.
5. `cancelled`: Cancelado. Estado terminal. No se descuentan insumos ni se otorgan puntos.

---

## 3. Detalle de Archivos Creados y Modificados en PR-3c

### 3.1 [`server/utils/schemas/admin-order.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/utils/schemas/admin-order.ts) [NUEVO]
* `AdminUpdateOrderStatusSchema`: Valida que el nuevo estado sea estrictamente `'processing' | 'ready' | 'completed' | 'cancelled'`.
* `AdminCreateOrderSchema`: Exige canal fijo `'admin'`, valida nombres, teléfonos de Perú, límites de 1 a 30 productos y valida `profile_id` opcional sin permitir inyecciones de usuarios huérfanos.

### 3.2 [`server/services/order.service.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/services/order.service.ts) [MODIFICADO]
Se agregaron dos métodos transaccionales:
* **`updateOrderStatus(event, orderId, newStatus, requestId)`:**
  * Protegido por `requireAdmin(event)`.
  * Valida la orden y comprueba si la transición es permitida según la matriz.
  * Si pasa a `processing`: calcula insumos con `recipe_items`, compara contra `raw_materials.stock` y si falta stock lanza `409 INSUFFICIENT_STOCK`. Si alcanza, inserta en `inventory_movements` y descuenta el stock oficial.
  * Si pasa a `completed`: acredita puntos en `profiles.points` y marca `points_awarded = true`.
  * Registra evento en `audit_events` con acción `'order.status'`.
* **`createAdminOrder(event, dto, idempotencyKey, requestId)`:**
  * Protegido por `requireAdmin(event)`.
  * Consulta precios vigentes en `products` y calcula el total en céntimos enteros.
  * Inserta en `orders` y `order_items` de forma atómica.
  * Registra evento en `audit_events` con acción `'order.create_admin'`.

### 3.3 [`server/api/admin/orders/[id]/status.patch.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/admin/orders/[id]/status.patch.ts) [NUEVO]
Endpoint administrativo para transiciones de estado en el tablero.

### 3.4 [`server/api/admin/orders/index.post.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/admin/orders/index.post.ts) [NUEVO]
Endpoint administrativo para registro de pedidos en vitrina o mostrador.

### 3.5 Endpoints Complementarios de Administración de Órdenes [NUEVOS]
* [`server/api/admin/orders/index.get.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/admin/orders/index.get.ts): Consulta segura de órdenes con perfiles, ítems y productos vía Service Role.
* [`server/api/admin/orders/[id].get.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/admin/orders/[id].get.ts): Ficha técnica individual de una orden por su UUID.
* [`server/api/admin/orders/[id].patch.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/admin/orders/[id].patch.ts): Actualización de datos de cliente, fecha, hora y notas con sincronización de perfiles y auditoría.

### 3.6 Refactorización y Desacoplamiento Total de la UI Administrativa
* [`app/components/admin/AdminOrdersTab.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/components/admin/AdminOrdersTab.vue):
  * Se erradicó por completo `useSupabaseClient`.
  * La consulta de pedidos se realiza a través de `GET /api/admin/orders`.
  * El Drag & Drop ahora llama a `PATCH /api/admin/orders/${orderId}/status`.
* [`app/components/admin/OrderDetailsModal.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/components/admin/OrderDetailsModal.vue):
  * Se erradicó por completo `useSupabaseClient`.
  * La edición de pedidos ahora llama a `PATCH /api/admin/orders/${props.order.id}`, sincronizando datos de cliente en el servidor y registrando auditoría.
* [`app/components/admin/NewOrderModal.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/components/admin/NewOrderModal.vue):
  * Se erradicó la creación de perfiles dummy y el cálculo de precios en cliente.
  * Consume `POST /api/admin/orders` calculando precios oficiales en el servidor.

### 3.7 Suites de Pruebas Automatizadas
* [`tests/unit/admin-order-transitions.test.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tests/unit/admin-order-transitions.test.ts): 10 pruebas unitarias para esquemas, matriz de estados, quiebre de stock y puntos de lealtad.
* [`tests/api/admin-orders-endpoints.test.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tests/api/admin-orders-endpoints.test.ts): 4 pruebas de contrato para la seguridad y respuestas de los endpoints `/api/admin/orders`.

---

## 4. Matriz de Validación del Plan Maestro

| Criterio | Descripción | Resultado | Evidencia Técnica |
| :---: | :--- | :---: | :--- |
| **V1** | Compilación y Typecheck sin errores | ✅ **Aprobado** | `nuxt typecheck` $\rightarrow$ 0 errores, `npm run build` $\rightarrow$ Build complete. |
| **V13** | Suite de Tests Automatizados | ✅ **Aprobado** | 54 de 54 tests pasando al 100% en Vitest (10 suites). |
| **V26** | `processing` descuenta stock una sola vez | ✅ **Aprobado** | Bandera `inventory_processed` y tabla `inventory_movements`. |
| **V27** | Quiebre de insumos | ✅ **Aprobado** | Si falta insumo $\rightarrow$ lanza `INSUFFICIENT_STOCK` y pedido sigue en `pending`. |
| **V28** | Sin saltos de estado | ✅ **Aprobado** | Matriz bloquea transiciones no adyacentes con `409 FORBIDDEN_TRANSITION`. |
| **V29** | Puntos en `completed` | ✅ **Aprobado** | Se acreditan en `profiles.points` en base a céntimos enteros. |
| **V33** | Pedido admin sin perfiles fantasma | ✅ **Aprobado** | `NewOrderModal` consume `POST /api/admin/orders` sin crear perfiles dummy. |
| **V38** | Registro de auditoría inmutable | ✅ **Aprobado** | Acciones `order.status` y `order.create_admin` registradas en `audit_events`. |
| **V39** | Tablero Kanban y Modales sin mutaciones directas | ✅ **Aprobado** | `AdminOrdersTab` y `OrderDetailsModal` 100% desacoplados de Supabase de cliente. |
| **V47** | Libro de inventario trazable | ✅ **Aprobado** | Movimientos grabados con `order_consumption`, deltas y stocks antes/después. |

---

## 5. Próximo Paso en el Plan Maestro: Subfase PR-3d ([[§19]])

La siguiente subfase es **PR-3d: Corte de Seguridad S9 en Base de Datos**:
1. Ahora que tanto `checkout.vue` como los modales de administración (`AdminOrdersTab.vue`, `NewOrderModal.vue`) consumen exclusivamente la API del servidor, podemos revocar con total seguridad los permisos de inserción en `orders` y `order_items` para usuarios del navegador (`DROP POLICY FOR INSERT TO authenticated`).
2. Revocar la ejecución directa de `process_order_inventory` y `award_loyalty_points` a roles de navegador (`REVOKE EXECUTE ON FUNCTION ... FROM anon, authenticated`).
3. Documentar la migración SQL de corte S9 y verificar la observabilidad de errores.
