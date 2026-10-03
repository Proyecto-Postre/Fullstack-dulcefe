---
tipo: adr
numero: 008
titulo: Modelo Dual de Tandas Maestras, Rendimientos Inversos, Porcionamiento y Empaques Desacoplados
fecha: 2026-09-22
estado: aceptado
relacionado:
  - "[[plan-tandas-porcionamiento-recetas]]"
  - "[[formulas-costeo]]"
  - "[[esquema-base-datos]]"
  - "[[api-endpoints]]"
---

# 🏛️ ADR-008: Modelo Dual de Tandas Maestras, Rendimientos Inversos y Descargo Rápido de Taller

## 1. Contexto & Problema
En pastelería artesanal y repostería fina, **la producción nunca ocurre por unidad individual vendida**, sino en bloque o "tandas" (ej. un tazón de masa para 120 alfajorcitos, una lata de 30 tartaletas o un bizcocho de 24 porciones).
El modelo tradicional 1:1 de recetas directas (`recipe_items` atado rígidamente a `products`) presentaba fallas operativas graves:
1. **Inconsistencia de Inventario:** Vender 1 porción de torta intentaba descontar 0.083 huevos o 12.5 gramos de harina en tiempo real.
2. **Imposibilidad de Variedad Multiformato:** Una misma preparación de masa base alimenta múltiples productos de vitrina (alfajor clásico x unidad, caja de alfajores x12, mini alfajor para eventos x100).
3. **Mermas y Pérdidas Culinarias no Auditadas:** Piezas quemadas o rotas durante el horneado no se podían dar de baja sin alterar los pedidos de clientes.
4. **Acoplamiento de Packaging con Insumos:** Las cajas, blondas y bolsas se mezclaban como ingredientes en la receta de cocina, distorsionando el costo de masa y CIF.

## 2. Decisión Tomada
Se implementó la arquitectura de **Tandas Maestras y Rendimientos Proporcionales (Fase 7)** fundamentada en 4 pilares:

1. **Desacoplamiento en Capas (Dual Architecture):**
   * `base_recipes` + `base_recipe_items`: Receta de preparación en bloque (ej. "Tanda Masa Sablé").
   * `recipe_yields`: Rendimiento físico cuantificable (ej. "80 tapitas individuales", "12 porciones").
   * `product_recipe_mappings`: Relación N:M que asocia un postre del catálogo con la porción exacta de la tanda consumida.
2. **Empaques Independientes (`product_packaging_items`):**
   * Clasificación estricta de materias primas (`type: 'ingredient' | 'packaging'`). Los empaques se descuentan al ensamblar el producto terminado y no forman parte del costo de cocción.
3. **Descargo Rápido de Taller (`piece_waste_logs` + `/api/admin/batch-recipes/quick-deduction`):**
   * El pastelero puede registrar mermas operativas por piezas en 2 toques, deduciendo automáticamente la fracción proporcional de insumos en el kardex contable (`inventory_movements` con tipo `waste_declaration`).
4. **Panel Preventivo de Riesgo:**
   * Algoritmo de cuello de botella que calcula el "Stock Crítico Virtual" basándose en el insumo más escaso de la tanda para alertar antes de que un producto quede desabastecido en vitrina.

## 3. Consecuencias & Beneficios
* **Cero Fracciones Fantasma:** Los descargos reflejan con exactitud matemática el consumo físico de materia prima.
* **Escalabilidad y Flexibilidad:** Si cambia el precio de la harina, se actualiza una sola tanda maestra y automáticamente recalculan los márgenes de todos los productos derivados.
* **Trazabilidad 100% Auditada:** Cumplimiento de kardex y trazabilidad para costeo contable.
