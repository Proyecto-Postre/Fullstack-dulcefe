# Informe de Ejecución — Fase 7 / Subfase 7.2: Backend Nitro & Servicios de Dominio de Tandas (Batch Recipes)

**Fecha de Ejecución:** 2026-09-22  
**Rama:** `feat/batch-recipes-yielding`  
**Referencia SSOT:** `docs/01 - Estrategia & Negocio/plan-tandas-porcionamiento-recetas.md`  
**Estado:** ✅ **Completado (10/10 Enterprise)**

---

## 1. Resumen de la Entrega: ¿Qué, Cómo y Por Qué?

### 1.1 ¿Qué se hizo?
Se desarrolló la capa completa de servicios y controladores HTTP en el servidor Nitro (`server/`) para:
1. Gestionar el ciclo de vida de **Tandas y Rendimientos** (CRUD con costeo en céntimos y cálculo exacto de mano de obra y gas CIF).
2. Asignar porciones de tanda y empaques directos a **Productos Comerciales** de vitrina.
3. Ejecutar el **Descargo Rápido de Piezas Sueltas** (consumo personal, regalo, merma o venta externa) descontando automáticamente la fracción proporcional de ingredientes en almacén.
4. Detectar de forma proactiva **Productos en Riesgo por Falta de Insumos** para alimentar el Dashboard.
5. Conectar la deducción de inventario de órdenes en `order.service.ts` para que al pasar a `processing` descuente insumos porcionados y congele el escandallo en `cost_snapshot` conforme a **ADR-008**.

### 1.2 ¿Por qué se hizo?
Para que el pastelero no tenga que realizar ningún cálculo manual en su jornada diaria. El backend asume la matemática financiera: suma los insumos y el CIF de la masa, divide entre las piezas que rinde el corte ($C_{\text{batch}} / Y$), añade el empaque de la caja y, al registrar una venta o consumo suelto, calcula la fracción exacta de tanda y descuenta los gramos necesarios del almacén.

### 1.3 ¿Cómo se hizo?
- Implementando el servicio `BatchRecipeService` (`server/services/batch-recipe.service.ts`).
- Publicando 9 endpoints HTTP en Nitro bajo `/api/admin/` protegidos con `requireAdmin` y correlación de `request_id`.
- Modificando `OrderService` para soportar tanto recetas directas tradicionales como tandas porcionadas con empaques.
- Blindando la estabilidad con 8 nuevas pruebas unitarias y de integración en Vitest (230 tests totales en verde).

---

## 2. Componentes Implementados

### 2.1 Servicio Central de Dominio (`BatchRecipeService`)
* **Archivo:** `server/services/batch-recipe.service.ts`
* **Métodos Principales:**
  - `getBatchRecipes()`: Listado con sumatoria de insumos, CIF de tanda y costo unitario por tamaño.
  - `getBatchRecipeById()`: Detalle completo de una tanda.
  - `createBatchRecipe()`: Registro transaccional de cabecera, ingredientes y rendimientos.
  - `updateBatchRecipe()`: Sincronización de insumos y rendimientos.
  - `deleteBatchRecipe()`: Eliminación de la tanda garantizando que **las materias primas del almacén físico permanecen 100% intactas**.
  - `getProductBatchComposition()`: Cálculo del costo consolidado de producción de un producto comercial.
  - `saveProductBatchMapping()`: Vinculación de piezas por empaque y materiales de presentación.
  - `quickDeductPieces()`: Descargo en 1 paso que calcula $F = \frac{\text{piezas}}{\text{rendimiento}}$, descuenta en `raw_materials.stock` y genera filas en `inventory_movements` y `piece_waste_logs`.
  - `getAtRiskProducts()`: Evaluación predictiva de suficiencia de materias primas por postre.

---

### 2.2 Integración en Pedidos (`OrderService`)
* **Archivo:** `server/services/order.service.ts`
* **Deducción de Inventario en `updateOrderStatus` (`processing`):**
  - Consulta unificada de `recipe_items`, `product_recipe_mappings` y `product_packaging_items`.
  - Descuento proporcional seguro y generación atómica de movimientos en `inventory_movements`.
* **Congelamiento de COGS (`getOrGenerateCostSnapshot`):**
  - Generación del snapshot inmutable con desglose de porción de masa y empaques en céntimos (ADR-008).

---

### 2.3 Catálogo de Endpoints HTTP en Nitro

1. `GET /api/admin/batch-recipes`: Listar tandas con costos.
2. `POST /api/admin/batch-recipes`: Crear tanda con rendimientos.
3. `GET /api/admin/batch-recipes/[id]`: Consultar tanda por ID.
4. `PUT /api/admin/batch-recipes/[id]`: Actualizar tanda.
5. `DELETE /api/admin/batch-recipes/[id]`: Eliminar tanda sin tocar almacén.
6. `GET /api/admin/product-recipes/[productId]/composition`: Composición de producto comercial.
7. `POST /api/admin/product-recipes/mapping`: Asignar porción y empaques a producto.
8. `POST /api/admin/batch-recipes/quick-deduction`: Descargo rápido de piezas sueltas.
9. `GET /api/admin/dashboard/at-risk-products`: Productos en riesgo por falta de insumos.

---

## 3. Verificación de Calidad y Pruebas Automatizadas

| Verificación | Comando | Resultado |
| :--- | :--- | :--- |
| **Pruebas Matemáticas de Tandas** | `vitest run tests/unit/batch-recipe-service.test.ts` | ✅ **5 / 5 tests pasando** |
| **Pruebas de Contrato de Endpoints** | `vitest run tests/api/admin-batch-recipes-endpoints.test.ts` | ✅ **3 / 3 tests pasando** |
| **Suite Completa de Pruebas** | `npm test` | ✅ **230 / 230 tests pasando (34 suites en verde)** |
| **Validación Estricta de Tipos** | `npx nuxi typecheck` | ✅ **0 errores de compilación** |
| **Compilación de Producción** | `npm run build` | ✅ **Build limpio completado en Nitro** |

---

## 4. Estado de la Rama y Próximo Paso
- **Rama:** `feat/batch-recipes-yielding`
- **Siguiente Subfase:** **Subfase 7.3 (Interfaz de Usuario Administrativa - UI / UX)**:
  - Componente modal para crear y editar tandas (`BatchRecipeModal.vue`).
  - Modal de descargo rápido en 1 solo paso (`QuickPieceDeductionModal.vue`).
  - Integración en la pestaña de Recetas (`AdminRecipesTab.vue`).
