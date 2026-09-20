# Informe Técnico y Didáctico de Ejecución — Fase 4 (Subfase PR-4d): Dominio Recetas y Escandallos

**Estado:** ✅ Completado, Verificado y Certificado con 0 Errores  
**Fecha:** 6 de Septiembre, 2026  
**Documento de Referencia:** [[architecture-refactor-plan]] (§6, §10 Fase 4, §19, §20.4)  
**Rama Activa:** `feat/fase-04-restructuration_proyect`  
**Entrega:** Subfase PR-4d (Modularización de escandallos y fichas técnicas, composable `useAdminRecipes.ts`, erradicación total de 18 `any` en `AdminRecipesTab.vue`, cálculos financieros en servidor y cliente, y 84 tests automáticos en Vitest).

---

## 1. ¿Qué se hizo en la Subfase PR-4d?

### 1.1 Resumen Ejecutivo
El módulo de Recetas y Escandallos (`AdminRecipesTab.vue`) es el motor de rentabilidad y costeo unitario de Dulce Fé. Permite a los pasteleros y administradores vincular materias primas a productos del catálogo, calcular el costo marginal al gramo o mililitro, sumar Costos Indirectos de Fabricación (CIF: empaques, servicios públicos, mano de obra), proyectar márgenes de beneficio bruto y sugerir precios comerciales antes de publicar los postres en la vitrina.

Antes de esta subfase:
1. **`AdminRecipesTab.vue`** era un componente monolítico de casi 500 líneas con **más de 18 instancias de `any`** (`catalog: any`, `materials: any`, `modelValue: any`, `res: any`, `err: any`, etc.).
2. Toda la lógica de negocio (cálculo de costos CIF, cálculo de margen bruto en Soles y porcentaje, validaciones de entrada, exportación viva a Excel y publicación en vitrina) estaba acoplada directamente en el bloque `<script setup>` del componente.
3. No existía un contrato tipado para los ítems de receta (`RecipeItem`) ni para los costos adicionales (`AdditionalCosts`), dejando desprotegida la interoperabilidad entre el servidor Nitro (`/api/recipes/:id`) y la interfaz.
4. No había pruebas unitarias automatizadas que validaran la precisión decimal del margen de ganancia o la protección contra divisiones por cero cuando el precio de venta es `0` o nulo.

En esta subfase se ejecutó:
1. **Creación del contrato de tipos** en [`app/types/recipe.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/types/recipe.ts) (`RecipeItemRow`, `RecipeItem`, `AdditionalCosts`, `RecipeApiResponse`, `NewRecipeItemInput`, `ProfitAnalysis`).
2. **Diseño e implementación del Composable de Dominio** [`app/composables/admin/useAdminRecipes.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/composables/admin/useAdminRecipes.ts), que centraliza la reactividad de escandallos, llamadas asíncronas seguras, exportación a Excel y las funciones matemáticas puras de análisis financiero (`calculateComputedTotalCost`, `calculateProfitMargin`, `calculateProfitMarginPercent`, `calculateSuggestedPrice`).
3. **Refactorización integral de `AdminRecipesTab.vue`**, erradicando el 100% de los `any`, tipando estrictamente los mapeos de opciones para `CustomSelect` (`ProductRow` y `RawMaterialRow`), e integrando el modal de producto tipado.
4. **Suite de pruebas unitarias exhaustiva** en [`tests/unit/admin-recipes-ui.test.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tests/unit/admin-recipes-ui.test.ts) elevando la suite global a **84 tests en verde**.

---

### 1.2 Inventario de Archivos Creados y Modificados

| Archivo | Rol Arquitectónico | Estado | Propósito |
|---|---|:---:|---|
| [`app/types/recipe.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/types/recipe.ts) | Dominio / Tipos | **[NUEVO]** | Tipos `RecipeItem`, `AdditionalCosts`, `RecipeApiResponse`, `NewRecipeItemInput`, `RecipePublishInput`, `ProfitAnalysis`. |
| [`app/composables/admin/useAdminRecipes.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/composables/admin/useAdminRecipes.ts) | Coordinación / Negocio | **[NUEVO]** | Composable reactivo para escandallos, cálculo de CIF, márgenes de rentabilidad, consumo de `/api/recipes`, exportación a Excel y publicación. |
| [`app/components/admin/AdminRecipesTab.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/components/admin/AdminRecipesTab.vue) | UI Admin Tab | **[MODIFICADO]** | Pestaña de escandallos; erradicación del 100% de los `any`, tipado estricto `ProductRow`, delegación al composable y manejo seguro de nulos. |
| [`tests/unit/admin-recipes-ui.test.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tests/unit/admin-recipes-ui.test.ts) | Calidad / Tests | **[NUEVO]** | 11 pruebas unitarias cubriendo costeo CIF, márgenes de ganancia, prevención de división por cero y estado reactivo. |

---

### 1.3 Inventario de Erradicación de `any`

| Archivo | Línea Original | Código Anterior (Deuda Técnica) | Código Nuevo (Tipado Estricto) |
|---|:---:|---|---|
| `AdminRecipesTab.vue` | 6 | `catalog: any` | `catalog: { success: boolean; data: ProductRow[] } \| null \| undefined` |
| `AdminRecipesTab.vue` | 7 | `materials: any` | `materials: { success: boolean; data: RawMaterialRow[] } \| null \| undefined` |
| `AdminRecipesTab.vue` | 8 | `modelValue: any` | `modelValue: ProductRow \| null \| undefined` |
| `AdminRecipesTab.vue` | 12 | `(e: 'update:modelValue', val: any): void` | `(e: 'update:modelValue', val: ProductRow \| null): void` |
| `AdminRecipesTab.vue` | 22 | `const recipeItems = ref<any[]>([])` | `const recipeItems = ref<RecipeItem[]>([])` (en composable) |
| `AdminRecipesTab.vue` | 51 | `find((m: any) => m.id === newRecipeItem.value.raw_material_id)` | `find((m: RawMaterialRow) => m.id === idNum)` |
| `AdminRecipesTab.vue` | 62 | `const res: any = await $fetch(...)` | `const res = await $fetch<RecipeApiResponse>(...)` |
| `AdminRecipesTab.vue` | 67 | `catch (err: any)` | `catch (err: unknown)` |
| `AdminRecipesTab.vue` | 93 | `catch (err: any)` | `catch (err: unknown)` |
| `AdminRecipesTab.vue` | 108 | `catch (err: any)` | `catch (err: unknown)` |
| `AdminRecipesTab.vue` | 141 | `const res: any = await $fetch(...)` | `const res = await $fetch<{ success: boolean }>(...)` |
| `AdminRecipesTab.vue` | 155 | `catch (err: any)` | `catch (err: unknown)` |
| `AdminRecipesTab.vue` | 162 | `function handleProductSaved(savedProduct: any, isNew: boolean)` | `function handleProductSaved(savedProduct: ProductRow, isNew: boolean): void` |
| `AdminRecipesTab.vue` | 197 | `(catalog?.data \|\| []).map((p: any) => ...)` | `(catalog?.data \|\| []).map((p: ProductRow) => ...)` |
| `AdminRecipesTab.vue` | 225 | `(materials?.data \|\| []).map((m: any) => ...)` | `(materials?.data \|\| []).map((m: RawMaterialRow) => ...)` |

---

## 2. ¿Cómo se hizo? (Arquitectura Técnica)

### 2.1 Aritmética Financiera Desacoplada y Determinista
En repostería artesanal, los escandallos requieren precisión matemática en tres capas:
1. **Costo de Materias Primas:** Calculado en el servidor exacto en céntimos vía `RecipeService.getRecipeWithCosts` para evitar discrepancias por redondeo en coma flotante de JavaScript.
2. **Costos Indirectos de Fabricación (CIF):** Empaques, servicios de energía/gas y mano de obra del maestro pastelero.
3. **Margen Bruto y Precio Sugerido:** 
   $$\text{Margen Bruto} = \text{Precio de Venta} - \text{Costo Total Producción}$$
   $$\text{Margen \%} = \left(\frac{\text{Margen Bruto}}{\text{Precio de Venta}}\right) \times 100$$
   $$\text{Precio Sugerido} = \frac{\text{Costo Total Producción}}{1 - \text{Margen Deseado}}$$

Se implementaron como funciones puras en `useAdminRecipes.ts`:
```typescript
export function calculateProfitMarginPercent(salePrice: number, totalCost: number): number {
  if (salePrice <= 0) return 0
  const margin = salePrice - totalCost
  return Number(((margin / salePrice) * 100).toFixed(1))
}

export function calculateSuggestedPrice(totalCost: number, targetMarginPercent: number = 30): number {
  if (totalCost <= 0) return 0
  const marginDecimal = targetMarginPercent / 100
  if (marginDecimal >= 1) return totalCost * 2
  return Number((totalCost / (1 - marginDecimal)).toFixed(2))
}
```

### 2.2 Sincronización Reactiva con Selección de Catálogo
Cuando el usuario selecciona un producto del catálogo en la vista, se dispara un `watch` que:
1. Invoca `fetchRecipe()` para traer los ingredientes de la ficha técnica desde Supabase.
2. Inicializa reactivamente los inputs de `publishData.price` y `publishData.stock` con los valores actuales del producto.
3. Al deseleccionar, invoca `resetRecipeState()`, limpiando la memoria y evitando estados corruptos.

---

## 3. ¿Por qué se hizo? (Decisiones de Ingeniería)

1. **Protección Contra Errores Silenciosos de Runtime:** Antes, `activeProduct.price` o `mat.unit` se accedían dinámicamente sobre variables `any`. Si un insumo no tenía unidad (`null`), la plantilla fallaba o mostraba cadenas vacías sin control. Ahora, el tipado estricto asegura que `unit` siempre retorne un `string` (`(mat && mat.unit) ? mat.unit : ''`).
2. **Separación de Responsabilidades (SoC):** El componente de interfaz `AdminRecipesTab.vue` ahora solo se preocupa por renderizar y orquestar eventos del usuario. Toda la lógica de persistencia `$fetch`, serialización para Excel y cálculo de márgenes reside en el composable reutilizable y testeable.
3. **Preparación para la Fase 5:** Con contratos inmutables de recetas y costos, los cálculos de inventario automático tras órdenes completadas contarán con contratos de datos sólidos.

---

## 4. Matriz de Validación y Certificación Técnica

| Prueba / Verificación | Comando Ejecutado | Resultado | Detalle |
|---|---|:---:|---|
| **Suite Vitest** | `npm test` | ✅ **84 / 84 Pasaron** | 14 suites en verde, incluyendo `admin-recipes-ui.test.ts`. |
| **Comprobación de Tipos** | `npx nuxi typecheck` | ✅ **0 Errores** | Compilación TypeScript limpia sin advertencias. |
| **Auditoría de Tipos `any`** | Inspección de código | ✅ **0 Ocurrencias** | 18 ocurrencias erradicadas en su totalidad. |

---

## 5. Próximo Paso
Avanzar a la **Subfase PR-4e: Dominio Pedidos Admin, Kanban & Dashboard** (`AdminOrdersTab.vue`, `NewOrderModal.vue`, `OrderDetailsModal.vue`, `AdminDashboardTab.vue`, composable `useAdminOrders.ts`, erradicación final de `any` en el panel administrativo).
