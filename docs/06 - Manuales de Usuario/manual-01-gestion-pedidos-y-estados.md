# Manual 01: Gestión de Pedidos & Ciclo de Vida del Taller

> **Objetivo:** Aprender a mover los pedidos a través de sus fases operativas, atender cambios de horario de los clientes y entender cuándo se descuenta el inventario.

---

## 1. Dónde Gestionar los Pedidos

1. Ingresa al panel de administración en `/admin`.
2. En la barra superior, selecciona la pestaña **"Pedidos"**.
3. Verás la lista de pedidos ordenada con los más recientes arriba, junto con su estado actual, cliente, total y fecha pactada.

---

## 2. El Semáforo del Pedido: ¿En qué fases lo puedes mover?

El sistema cuenta con 4 estados secuenciales principales y 1 estado de cancelación:

```
[ 1. Pendiente ] ────► [ 2. En Taller / Horneado ] ────► [ 3. Listo para Despacho ] ────► [ 4. Entregado ]
       │                                                                                             ▲
       └────────────────────────── [ Cancelado (Reversión) ] ────────────────────────────────────────┘
```

| Estado | Nombre en Pantalla | ¿Qué significa en la vida real? | ¿Qué hace el sistema por detrás? |
| :--- | :--- | :--- | :--- |
| `pending` | **Pendiente / Registrado** | El cliente hizo el pedido desde la web. Aún no se ha empezado a cocinar. | El pedido está guardado. **No se ha tocado el stock de insumos.** |
| `processing` | **En Taller / Horneado** | El pastelero tomó la orden y comenzó a batir o decorar. | ⚡ **Se descuentan automáticamente los gramos/ml de insumos** de almacén según las recetas del postre. |
| `ready` | **Listo para Despacho** | La torta o postre está en caja, sellada con cinta y lista para entrega o recojo. | El cliente ve en su pantalla que su postre ya está terminado. |
| `delivered` | **Entregado** | El cliente ya tiene el postre en sus manos. Pedido completado. | El pedido se cierra con éxito y se suma a las métricas finales. |
| `cancelled` | **Cancelado** | El cliente canceló o no se concretó el pago. | Si ya estaba en `processing`, **los insumos se devuelven al almacén** automáticamente. |

---

## 3. ¿Cómo mover un pedido de estado?

* **Opción A (Rápida desde la tabla):**  
  En la columna "Estado" de la tabla de pedidos, usa el selector desplegable y elige la nueva fase. El cambio se guarda de inmediato.
* **Opción B (Desde el Modal de Detalle):**  
  Haz clic sobre el pedido para abrir su ficha completa. Arriba a la derecha tienes el selector de estado con su botón de confirmación.

---

## 4. ¿Qué pasa si el cliente pide su torta antes o después de la hora pactada?

¡Tienes **control total y absoluto**!

1. **Adelantar el pedido antes de tiempo:**  
   Si terminaste antes o el cliente te escribe para recogerlo antes, no hay ningún bloqueo. Puedes pasarlo a `ready` o `delivered` en el momento que desees. El sistema no te obliga a esperar la hora fijada.
2. **Cambiar la fecha o la hora en el sistema:**  
   En el modal del pedido, haz clic en el botón **"Editar Pedido"** (ícono de lápiz). Podrás cambiar:
   * La fecha de entrega.
   * La hora de entrega.
   * La dirección o punto de encuentro acordado.  
   Al guardar, los datos quedan actualizados tanto para ti como en la pantalla de seguimiento del cliente.

---

## 5. ¿Cómo ve el cliente el avance de su pedido?

* Al finalizar la compra, el cliente recibe un enlace único:  
  `https://tudominio.pe/pedido/DF-XXXX-YYYY`
* En esa pantalla verá una **barra de progreso animada** con 4 etapas (Registrado -> En Taller -> Listo -> Entregado).
* **Actualización en vivo:** Gracias a la tecnología Server-Sent Events (SSE), cuando tú cambias el estado en tu pantalla, **la pantalla del cliente avanza sola en tiempo real sin que tenga que refrescar el navegador**.
