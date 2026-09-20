# Documentación Financiera y Algoritmos de Costeo (Escandallos)

> **PROPÓSITO:** Este documento es la biblia financiera del sistema. Si te asignaron trabajar en la pestaña de Recetas (`AdminRecipesTab.vue`) o en la exportación de Excel (`export.get.ts`), **debes** entender matemáticamente qué significa cada término, porque un error de multiplicación aquí podría ocasionarle pérdidas económicas reales al negocio.

El ERP Dulce Fe está diseñado para resolver un problema gastronómico clásico: *"Compro mis insumos por bultos o kilos (ej. 1 Saco de Harina de 50kg), pero en mis postres uso gramos (ej. 250g de Harina). ¿Cómo calculo el costo exacto?"*

A este proceso de desglose y costeo milimétrico de una receta se le denomina **Escandallar**.

---

## 1. Costo Unitario de Insumos (La Base)

Este cálculo ocurre en el momento en que un insumo entra al Almacén (`AdminMaterialsTab.vue`). El sistema necesita saber cuánto cuesta **1 unidad mínima** de ese ingrediente.

**Fórmula Algorítmica:**
```javascript
const costoUnitario = precioPagadoPorPaquete / cantidadQueTraeElPaquete;
```

**Ejemplo Práctico en la vida real:**
- El administrador va al supermercado y compra un bloque enorme de Mantequilla.
- El administrador registra: 
  - Unidad: `Kilos (kg)`
  - Precio Pagado: `S/ 18.00`
  - Cantidad Total: `1` (1 kilo).
- **El Cálculo Interno**: `18.00 / 1 = S/ 18.00` por Kg. (Si hubiera registrado en gramos diciendo que trae 1000g, el sistema dividiría `18/1000 = 0.018` por gramo).

*Responsabilidad del Frontend*: Este cálculo debe ser completamente transparente. En la tabla del Almacén, se muestra explícitamente en la columna "Costo Unitario".

---

## 2. Costo Parcial del Insumo (El Escandallo en Acción)

Ocurre dentro de la Ficha Técnica de la receta (`AdminRecipesTab.vue`). Aquí es donde relacionamos el producto final (ej. Pastel de Fresa) con los insumos del almacén.

**Fórmula Algorítmica:**
```javascript
// Ocurre en el servidor al pedir la receta (GET /api/recipes/[productId].get.ts)
const itemCost = cantidadUsadaEnReceta * costoUnitarioDelInsumo;
```

**Ejemplo Práctico en la vida real:**
- Para hacer la masa del pastel, la receta indica que se necesitan **0.16 Kg (160 gramos)** de Mantequilla.
- El sistema sabe que el Costo Unitario de la Mantequilla es S/ 18.00 el Kilo.
- **El Cálculo Interno**: `0.16 * 18.00 = S/ 2.88`. Esos 2.88 soles es el **Costo Parcial** (lo que me costó exactamente la porción de mantequilla que tiré al bowl de mezcla).

---

## 3. Costo Total de Producción (El Gasto Real)

Es el número más crítico del ERP. Nos dice cuánto dinero le cuesta al negocio fabricar **UN (1)** pastel, sumando tanto lo que está adentro del pastel (ingredientes) como los gastos externos que hicieron posible fabricarlo (Costos Fijos / CIF).

**Componentes de la Fórmula:**
1. **Sumatoria de Costos Parciales:** (La suma de la harina + huevos + mantequilla, etc).
2. **Empaques y Bases:** La caja de cartón, la cinta de adorno, la base de cartón dorado. Todo eso cuesta dinero y se va con el cliente.
3. **Servicios (Luz, Agua, Gas):** Un estimado del costo del horno o la electricidad por el tiempo horneado.
4. **Mano de Obra:** El valor del tiempo del chef pastelero invirtiendo en armar el pastel.

**Fórmula Algorítmica:**
```javascript
const computedTotalCost = computed(() => {
  // 1. Sumar ingredientes
  const sumatoriaInsumos = recipeItems.value.reduce((suma, item) => suma + item.item_total_cost, 0);
  
  // 2. Sumar Costos Indirectos (CIF)
  const costosExtra = additionalCosts.value.packaging + additionalCosts.value.utilities + additionalCosts.value.labor;
  
  return sumatoriaInsumos + costosExtra;
});
```

---

## 4. Margen Bruto (La Rentabilidad)

Este indicador le dice al dueño del negocio: *"Si lo vendo a este precio, ¿cuánto dinero limpio se va para mi bolsillo (o para el crecimiento de la empresa)?"*

**Fórmula Algorítmica:**
```javascript
const margenBruto = precioDeVentaSugerido - computedTotalCost;
```

**Lógica Visual (Frontend):**
- Si el `margenBruto` es mayor a 0, significa que el postre deja ganancias. El número en la pantalla debe pintarse de verde vibrante (`text-[#a3e635]`).
- Si el `margenBruto` es negativo (por error, el pastel cuesta S/ 50 en fabricarse pero lo venden a S/ 40), significa que el negocio está subsidiando la venta y perdiendo dinero por cada postre vendido. El texto debe pintarse de rojo pálido o intenso (`text-red-300`).

---

## 5. Exportación (ExcelJS)

Todas estas fórmulas son transferidas literalmente como "Fórmulas Nativas de Microsoft Excel" en el archivo que genera `/api/recipes/export.get.ts`.
- **Por qué**: Para que el cliente pueda descargar el reporte, desconectarse de internet, cambiar el precio de la harina en su computadora local (en Excel) y que el documento en Excel actualice instantáneamente el Margen Bruto usando las fórmulas embebidas (ej. `=SUM(E2:E8) + E10`). No exportamos "números muertos", exportamos "calculadoras vivas".
