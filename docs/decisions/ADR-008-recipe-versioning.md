# ADR-008: Snapshot y Versionado de Escandallo de Recetas al Confirmar Pedidos (Deuda D8)

* **Estado:** Aceptado / Postergado
* **Fecha:** 2026-09-06
* **Decisores:** Equipo de Arquitectura Dulce Fe
* **Referencia SSOT:** `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§7.1, §10.5, §20.5 D8)

---

## 1. Contexto y Problema

Los costos de compra de las materias primas (`raw_materials.purchase_price`) fluctúan periódicamente debido a inflación o cambios de proveedor. Asimismo, las proporciones de una receta (`recipe_items.quantity_used`) pueden optimizarse con el tiempo.

Si un pedido se procesó hace tres meses con una harina a S/ 4.50/kg, y hoy la harina subió a S/ 6.00/kg o la receta redujo el azúcar en 20g, ¿cómo debe calcularse el costo CIF histórico y el margen de ganancia de ese pedido pasado?

Recalcular el escandallo dinámicamente contra la receta actual distorsionaría los reportes de rentabilidad histórica de la pastelería.

---

## 2. Factores Decisivos (Decision Drivers)

1. **Fidelidad Contable Histórica:** El margen bruto de un pedido debe reflejar la realidad económica del momento en que se produjo.
2. **Complejidad del Modelo de Datos:** Introducir tablas de histórico de recetas (`recipe_versions`, `recipe_item_history`) durante el refactor central incrementaría innecesariamente la superficie de migraciones.
3. **Punto de Corte Operativo:** En el refactor de arquitectura, el consumo de insumos se basa en la receta vigente al momento de transicionar a `processing`.

---

## 3. Opciones Consideradas

* **Opción A:** Crear un sistema completo de control de versiones de recetas con vigencias temporales (`valid_from`, `valid_to`). *(Descartada por complejidad en Fase 3).*
* **Opción B (Adoptada):** Utilizar la receta vigente en el momento en que la orden pasa a `processing` para deducir el stock de insumos, postergando la creación de snapshots inmutables de costo por pedido (Deuda D8).

---

## 4. Decisión Adoptada

Se adopta la **Opción B**. 
* El escandallo actual opera en tiempo real con las proporciones vigentes en `recipe_items`.
* El costeo histórico se documenta como deuda D8. Cuando se implemente analítica de rentabilidad avanzada, se agregará una columna `orders.cost_snapshot jsonb` que congelará los gramos y precios de insumos exactos aplicados en el momento de la confirmación.

---

## 5. Consecuencias

### Positivas
* Mantiene el esquema de base de datos conciso y enfocado en la estabilidad transaccional.
* Los cálculos de stock de la RPC operan con máxima velocidad sin joins temporales complejos.

### Negativas / Deuda Técnica
* Si una receta se altera profundamente, los reportes retrospectivos de costos para pedidos antiguos mostrarán el cálculo con los valores actuales.

---

## 6. Condiciones de Reapertura

Esta decisión se reabrirá mediante un ADR de recetas cuando el negocio requiera auditorías formales de costos históricos y comparativas de margen interanual.
