# ADR-004: Desacoplamiento de `products.stock` e Inventario Real por Materias Primas (Deuda D4)

* **Estado:** Aceptado
* **Fecha:** 2026-09-06
* **Decisores:** Equipo de Arquitectura Dulce Fe
* **Referencia SSOT:** `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§6.1, §7.3, §20.5 D4)

---

## 1. Contexto y Problema

En la tabla `products` existe una columna `stock integer`. Sin embargo, en el modelo de negocio de una pastelería artesanal fina bajo demanda, la mayoría de tortas y postres no existen en vitrina física terminada con anterioridad: se elaboran a partir de insumos crudos (`raw_materials`) conforme a fichas técnicas de escandallo (`recipe_items`).

Intentar sincronizar bidireccionalmente y en tiempo real el valor de `products.stock` con la disponibilidad calculada de docenas de insumos compartidos (ej. harina usada en 20 productos distintos) generaría condiciones de carrera extremas y bloqueos de base de datos.

---

## 2. Factores Decisivos (Decision Drivers)

1. **Naturaleza del Negocio:** Producción mixta (productos listos para entrega inmediata en mostrador vs tortas horneadas bajo pedido para fechas futuras).
2. **Desacoplamiento Operativo:** Las materias primas se descuentan únicamente al confirmar la producción (`order.status = 'processing'`).
3. **Claridad para el Cliente:** Evitar mostrar postres agotados cuando la cocina sí cuenta con los insumos para producirlos en la fecha solicitada.

---

## 3. Opciones Consideradas

* **Opción A:** Convertir `products.stock` en el único inventario del sistema y descontarlo al hacer checkout. *(Descartada: no modela la pastelería artesanal ni el consumo de insumos).*
* **Opción B (Adoptada):** Tratar `products.stock` como un indicador de disponibilidad inmediata de vitrina o cupo de producción diario, manteniendo el inventario estricto en `raw_materials` gobernado por la RPC `process_order_inventory`.

---

## 4. Decisión Adoptada

Se adopta la **Opción B**.
* `products.stock` opera como un control comercial para limitar ventas directas de mostrador o cupos máximos en catálogo.
* El inventario real y el control de quiebres físicos reside exclusivamente en `raw_materials.stock`.
* Al pasar un pedido a `processing`, se auditan las recetas (`recipe_items`) y se descuentan los insumos de forma atómica; si falta harina o chocolate, el sistema genera un error 409 `INSUFFICIENT_STOCK` y preserva la integridad del taller.

---

## 5. Consecuencias

### Positivas
* Flexibilidad para pasteles bajo pedido con entrega programada a días vista.
* Trazabilidad exacta de costos y existencias a nivel de gramo/mililitro.

### Negativas / Deuda Técnica
* Un producto podría mostrar disponibilidad comercial si el administrador no ajusta su cupo, aunque falten insumos específicos para su preparación (detectable al momento de procesar la orden).

---

## 6. Condiciones de Reapertura

Se reabrirá mediante un ADR de catálogo si el negocio decide implementar un motor de simulación de stock predictivo que oculte productos automáticamente en el menú según el stock de insumos críticos.
