# Manual 05: Almacén de Insumos, Alertas & Descargo de Mermas

> **Objetivo:** Aprender a registrar compras al por mayor, vigilar las alertas de stock crítico y asentar pérdidas o mermas accidentales sin desfasar el inventario real.

---

## 1. El Almacén de Materias Primas (`AdminMaterialsTab.vue`)

En repostería tú compras por volumen (sacos, cajas, baldes, galones), pero cocinas en gramos y mililitros.

Ruta de acceso: `/admin` > pestaña **"Almacén"**.

### ¿Cómo registrar un insumo nuevo o una compra?
1. Haz clic en **"Nuevo Insumo"** (o en editar sobre uno existente).
2. Ingresa los datos de tu compra:
   * **Nombre:** Ej. *Harina Pastelera Especial*.
   * **Cantidad del paquete:** `50`
   * **Unidad de compra:** `kg`
   * **Precio pagado:** `S/ 120.00`
3. **Magia automática del sistema:**  
   El sistema calcula automáticamente:
   $$\text{Costo por Gramo} = \frac{\text{S/\ 120.00}}{50,000\text{ gramos}} = \mathbf{S/\ 0.0024\text{ por gramo}}$$
   Cuando uses 250 gramos de harina en un queque, el sistema sabrá con exactitud matemática que te costó exactamente **S/ 0.60**.

---

## 2. Alertas de Stock Mínimo

Cada insumo te permite configurar un **"Stock Mínimo de Seguridad"** (ej. *2,000 gramos de Mantequilla Gloria*):
* 🟢 **Verde:** Tienes stock suficiente para operar varios días.
* 🟡 **Amarillo:** El ingrediente está cerca del límite. Es hora de llamar al proveedor.
* 🔴 **Rojo:** Stock crítico o agotado. Se resalta en el panel para evitar que aceptes pedidos que no podrás hornear.

---

## 3. ¿Qué hacer si un postre o lote se estropea? (Descargo Rápido de Mermas)

En cualquier taller pastelero ocurren imprevistos: un bizcocho se quema en el horno, se rompe una tartaleta al desmoldar o se vence un insumo refrigerado.

**Error común:** No registrarlo y dejar que el inventario virtual diga que hay harina o postres cuando en realidad ya no existen.

### La Solución: Botón "Descargo Rápido" (`Quick Deduction`)
1. En `/admin` > pestaña **"Tandas"** o **"Almacén"**.
2. Haz clic en el botón con ícono de advertencia **"Descargo Rápido / Merma"**.
3. Selecciona qué se dañó:
   * *Opción 1: Merma de Insumo directo* (ej. Se derramó 1 litro de leche).
   * *Opción 2: Merma de Tanda / Porciones* (ej. Se quemó 1 molde de queque).
4. Elige el motivo del descarte: *Quemado*, *Vencimiento*, *Accidente en manipulación* o *Muestra de cata*.
5. Presiona **"Confirmar Descargo"**.

**¿Qué pasa luego?**  
* El inventario se ajusta de inmediato restando los insumos perdidos.
* Queda registrado en el historial de costos como pérdida operativa sin ensuciar tus reportes de ventas reales.
