# Manual 04: Pantalla de Cocina & Taller (KDS)

> **Objetivo:** Aprender a usar la pantalla táctil de cocina (/admin/kds) pensada para tablets y teléfonos en el taller, sin necesidad de teclado ni mouse.

---

## 1. ¿Qué es el KDS (Kitchen Display System)?

El **KDS** es una interfaz visual diseñada especialmente para la persona que está con las manos en la masa. Puedes abrirla en:
* Una tablet colocada en la pared o mesada de la cocina.
* El celular del pastelero.
* Una laptop en el área de producción.

Ruta de acceso directo: **`/admin/kds`**

---

## 2. Características del Tablero de Cocina

1. **Botones Gigantes Táctiles:** No requieres escribir ni usar mouse. Todo se controla tocando con el dedo.
2. **Semáforo de Urgencia (Colores Claros):**
   * 🔴 **Borde Rojo / Alerta:** Pedidos para entrega hoy en las próximas 3 horas (¡Máxima prioridad!).
   * 🟡 **Borde Ámbar:** Pedidos para entregar hoy por la tarde.
   * 🔵 **Borde Azul / Verde:** Pedidos programados para mañana o días posteriores.
3. **Detalle de Receta Rápido:** Toca cualquier tarjeta de pedido para ver qué bizcocho lleva, el relleno y las notas especiales del cliente (ej. *"Sin frutos secos"* o *"Dedicatoria: Feliz Cumpleaños Mamá"*).

---

## 3. El Flujo de Trabajo en Cocina (2 Toques)

### Paso 1: Iniciar el Horneado / Producción
Cuando vayas a comenzar a preparar el pedido:
* Toca el botón azul **"Iniciar Preparación"**.
* El pedido pasa automáticamente a estado `processing` (*En Taller*).
* **Almacén:** En ese mismo instante el sistema descuenta los insumos del inventario.

### Paso 2: Finalizar y Empaquetar
Cuando el postre sale del horno, se enfría, se decora y se coloca en su caja con cinta:
* Toca el botón verde **"Marcar Listo"**.
* El pedido pasa a estado `ready` (*Listo para Despacho*).
* La pantalla del cliente avanza a *"¡Listo para entrega!"* y la persona de recepción sabe que ya puede coordinar el recojo o delivery.

---

## 4. Agrupador de Lotes (Hornear en Serie)

En la parte superior del KDS tienes el panel **"Resumen de Lotes del Día"**:
* Si para hoy tienes 3 pedidos diferentes que llevan *Queque de Zanahoria*:
  * El KDS te dice: *"Total a hornear hoy: 3 Queques de Zanahoria"*.
* De esta forma bates una sola tanda grande y horneas todo de una sola vez, ahorrando gas, luz y tiempo de trabajo.
