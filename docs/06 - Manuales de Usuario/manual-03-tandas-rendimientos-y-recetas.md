# Manual 03: Tandas Maestras, Rendimientos & Recetas

> **Objetivo:** Dominar el corazón financiero y operativo del taller: cómo registrar mezclas de producción al por mayor, asociarlas a los postres de la carta y calcular el costo real de cada porción.

---

## 1. El Concepto Clave: ¿Qué es una Tanda Maestra?

En una pastelería artesanal no preparas una sola porción de queque ni horneas una torta individual de cero. Preparas una **Tanda Maestra (Batch)**:

* *Ejemplo:* Preparas un batido completo de **Bizcocho de Chocolate de 4.5 kg** (harina, cacao, huevos, mantequilla, azúcar).
* Esa misma tanda te sirve para armar:
  * 2 Tortas Medianas de 20 porciones (consumen 40% de la tanda cada una = 80%).
  * 4 Queques individuales (consumen 5% cada uno = 20%).

El sistema de Dulce Fe está diseñado exactamente así: **una sola tanda base puede alimentar varios productos distintos de tu menú**.

---

## 2. Los 3 Pasos para Configurar una Receta

Para que los costos y el inventario funcionen perfectos, sigue este orden:

```
[ 1. Tanda Maestra ] ────► [ 2. Rendimiento (Yield) ] ────► [ 3. Empaque Desacoplado ]
  (Ingredientes en g/ml)     (% o porciones por torta)       (Caja, base, lazo)
```

---

### Paso 1: Crear o Editar la Tanda Maestra (`AdminBatchRecipesTab.vue`)
1. Ve a `/admin` > pestaña **"Tandas"**.
2. Haz clic en **"Nueva Tanda Maestra"**.
3. Indica el nombre (ej. *Base Queque de Vainilla y Naranja - 3kg*).
4. Agrega los insumos seleccionándolos de tu lista de materias primas con sus cantidades exactas en **gramos (g)** o **mililitros (ml)**.
5. El sistema sumará automáticamente el costo de todos los insumos y te dirá:  
   *Costo Total de la Tanda: S/ 42.50*.

---

### Paso 2: Asociar la Tanda al Producto del Menú (Rendimiento / Yield)
1. Ve a `/admin` > pestaña **"Recetas"**.
2. Selecciona el postre de tu carta que se prepara con esa tanda (ej. *Queque Artesanal de Naranja Mediano*).
3. Vincula la Tanda Maestra que creaste en el Paso 1.
4. Indica cuánto consume este producto de esa tanda:
   * **Por Porcentaje:** Ej. `33.33%` (significa que la tanda rinde para 3 queques iguales).
   * **Por Unidades directas:** Ej. `1 de 3 unidades`.
5. El sistema calcula al instante:  
   *Costo de masa/bizcocho de este queque: S/ 14.17*.

---

### Paso 3: Asignar Empaques (Cajas, Bases y Cintas)
**¿Por qué los empaques van separados de la masa?**  
Porque si un cliente te pide el postre en caja kraft estándar cuesta una cantidad, pero si usa caja con visor o base dorada especial tiene otro costo. Además, las cajas no se miden en gramos, sino por **unidad**.

1. En la misma ficha de la receta del producto, ve a la sección **"Empaques & Presentación"**.
2. Agrega los elementos unitarios:
   * 1 Caja de Cartón para Torta Mediana (S/ 2.80).
   * 1 Base Dorada Rígida (S/ 1.50).
   * 1 Lazo de Cinta de Tela (S/ 0.60).

---

## 3. El Resultado: Tu Ficha de Rentabilidad Automática

Con estos 3 pasos, el sistema te muestra en tiempo real:

$$\text{Costo Total} = \text{Masa (S/ 14.17)} + \text{Empaque (S/ 4.90)} = \mathbf{S/\ 19.07}$$

* Si tu **Precio de Venta** en la web es **S/ 55.00**:
  * Tu **Margen Bruto** es de **S/ 35.93 (65.3% de ganancia)**.
* ¡Tienes la certeza matemática de que nunca venderás un postre a pérdida!
