# Informe de Ejecución — Fase 7 / Subfase 7.1: Capa de Datos & Migración SQL de Tandas (Batch Recipes) y Rendimientos

**Fecha de Ejecución:** 2026-09-22  
**Rama:** `feat/batch-recipes-yielding`  
**Referencia SSOT:** `docs/01 - Estrategia & Negocio/plan-tandas-porcionamiento-recetas.md`  
**Estado:** ✅ **Completado (10/10 Enterprise)**

---

## 1. Resumen de la Entrega: ¿Qué, Cómo y Por Qué?

### 1.1 ¿Qué se hizo?
Se implementó la infraestructura de base de datos relacional y los tipos estrictos de TypeScript para soportar el ciclo de producción culinario por **Tandas (Batches)**, el cálculo de **Rendimiento por Corte (Yield)**, la **Asignación a Productos Comerciales (Cajas/Empaques)** y la bitácora de **Descargo Rápido de Piezas Sueltas**.

### 1.2 ¿Por qué se hizo?
En la pastelería artesanal a pedido, las preparaciones como la masa de roles de canela no se elaboran desde cero para cada producto individual que el cliente compra en la web. Se prepara una **tanda completa de masa**, de la cual surgen piezas de distintos tamaños (12 grandes, 18 medianos o 24 mini). El modelo previo de `recipe_items` asumía erróneamente una relación 1 a 1 directa por cada producto. Esta entrega dota al sistema de la estructura necesaria para prorratear costos y deducir materias primas con precisión milimétrica ($\frac{U}{Y} \times \text{tanda}$).

### 1.3 ¿Cómo se hizo?
- Creando una migración SQL versionada cronológicamente en Supabase (`20260922152500_create_batch_recipes_and_yields.sql`).
- Blindando el acceso a las 6 tablas nuevas con políticas Row Level Security (RLS) exclusivas para administradores (`public.is_admin() = true`).
- Protegiendo la integridad física del almacén mediante llaves foráneas `ON DELETE RESTRICT` en materias primas.
- Tipando las 6 tablas en `app/types/database.types.ts` y creando los contratos de dominio en `app/types/batch-recipe.ts`.
- Validando la integridad mediante la suite automatizada `tests/architecture/batch-schema-integrity.test.ts`.

---

## 2. Componentes Implementados

### 2.1 Migración SQL de Base de Datos
* **Archivo:** `supabase/migrations/20260922152500_create_batch_recipes_and_yields.sql`
* **Tablas Creadas:**
  1. `public.base_recipes`: Cabecera de la tanda de masa/preparación (nombre, descripción, mano de obra `labor_cost` y servicios/horno `utilities_cost`).
  2. `public.base_recipe_items`: Renglones de insumos crudos utilizados para la tanda completa (harina, mantequilla, levadura) con FK a `raw_materials`.
  3. `public.recipe_yields`: Variantes de rendimiento por tamaño de corte (ej. Grande: 12u, Mediano: 18u, Mini: 24u) con `yield_units > 0`.
  4. `public.product_recipe_mappings`: Relación que indica qué variante de rendimiento usa un producto comercial de vitrina y cuántas piezas lleva (ej. *Caja 6 Roles Medianos* lleva 6 unidades).
  5. `public.product_packaging_items`: Empaques directos del producto comercial (caja de cartón, cinta, sticker).
  6. `public.piece_waste_logs`: Bitácora auditable de descargo rápido de piezas sueltas (quién sacó las piezas, cuántas, motivo: `personal_consumption`, `gift`, `spoilage`, `direct_sale`).

* **Optimización e Índices:**
  - `idx_base_recipe_items_recipe`
  - `idx_recipe_yields_recipe`
  - `idx_product_recipe_mappings_product`
  - `idx_product_packaging_items_product`
  - `idx_piece_waste_logs_yield`

* **Políticas Row Level Security (RLS):**
  - RLS activado en las 6 tablas.
  - Gestión restringida mediante `public.is_admin()` para evitar accesos indebidos de usuarios `anon` o clientes.

---

### 2.2 Principio Inmutable de Protección Total del Almacén

Se formalizó y garantizó en la base de datos la siguiente regla operativa:
1. **Los insumos físicos del almacén (`raw_materials`) NUNCA se eliminan ni se reducen al borrar una receta o tanda.**
2. Al eliminar una receta, únicamente se borra la ficha técnica anotada en el sistema (`base_recipe_items`). Los sacos de harina y cajas de mantequilla en el almacén físico permanecen 100% intactos.
3. El stock de materias primas **solo disminuye** ante tres eventos explícitos:
   - Venta real de un pedido que entra a taller (`order.status = 'processing'`).
   - Registro voluntario del pastelero mediante el botón de descargo rápido de piezas sueltas.
   - Ajuste o edición manual directa de existencias en la tabla de almacén.

---

### 2.3 Tipos TypeScript y Contratos de Datos

* **`app/types/database.types.ts`:**
  - Se integraron las definiciones tipadas de `Row`, `Insert`, `Update` y `Relationships` para las 6 tablas dentro de `Database['public']['Tables']`, respetando la cabecera contractual `DO NOT EDIT DIRECTLY`.
* **`app/types/batch-recipe.ts`:**
  - Interfaces de dominio: `BaseRecipeDetail`, `BaseRecipeItemDetail`, `RecipeYieldDetail`, `ProductBatchComposition`, `QuickPieceDeductionInput` y `QuickPieceDeductionResult`.

---

## 3. Verificación de Calidad y Pruebas Automatizadas

| Verificación | Comando | Resultado |
| :--- | :--- | :--- |
| **Prueba de Esquema de Tandas** | `vitest run tests/architecture/batch-schema-integrity.test.ts` | ✅ **5 / 5 tests pasando (100%)** |
| **Pruebas de Gobernanza de Migraciones** | `vitest run tests/architecture/sql-migrations.test.ts` | ✅ **4 / 4 tests pasando** |
| **Prueba de Type Drift Contractual** | `vitest run tests/architecture/type-drift-gate.test.ts` | ✅ **4 / 4 tests pasando** |
| **Suite Completa de Pruebas** | `npm test` | ✅ **222 / 222 tests pasando (32 suites en verde)** |
| **Validación Estricta de Tipos** | `npx nuxi typecheck` | ✅ **0 errores de compilación** |

---

## 4. Estado de la Rama y Próximo Paso
- **Rama:** `feat/batch-recipes-yielding`
- **Siguiente Subfase:** **Subfase 7.2 (Backend Nitro & Servicios)**:
  - Crear `server/services/batch-recipe.service.ts` con la lógica de cálculo de tandas y descargo rápido.
  - Implementar los endpoints CRUD para tandas (`/api/admin/batch-recipes/*`).
  - Actualizar `order.service.ts` para deducir insumos porcionados en órdenes.
