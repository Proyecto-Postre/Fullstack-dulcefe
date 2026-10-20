# Manual 02: Aprobación de Pagos con Vouchers Yape y Plin

> **Objetivo:** Verificar y validar comprobantes de pago en 1-clic, detectar pagos fraudulentos o erróneos y coordinar con el cliente por WhatsApp.

---

## 1. El Flujo de Pago en Dulce Fe

Cuando un cliente compra en la web y selecciona **Yape** o **Plin**:
1. El sistema le muestra el código QR y número oficial de la pastelería.
2. El cliente realiza la transferencia desde su app bancaria.
3. El cliente adjunta la captura de pantalla (voucher) y opcionalmente escribe el N° de Operación.
4. El pedido ingresa al sistema con el sello **"Pendiente de Pago"** (color ámbar).

---

## 2. Paso a Paso: ¿Cómo revisar y aprobar el comprobante?

### Paso 1: Abrir el pedido
En `/admin` > **Pedidos**, haz clic sobre el pedido que tenga el badge amarillo de *"Pendiente"*.

### Paso 2: Ubicar la tarjeta "Información de Pago"
Desplázate hacia la mitad del modal. Verás un bloque dedicado con:
* **Método de pago:** Yape o Plin.
* **N° de Operación:** Si el cliente lo ingresó, verás los dígitos bancarios.
* **Miniatura del Voucher:** Imagen de la captura subida por el cliente.

### Paso 3: Abrir la imagen en tamaño completo
Haz clic sobre la miniatura o sobre el enlace azul **"Ver voucher completo"**. Se abrirá una nueva pestaña en tu navegador con la foto en alta resolución para que compruebes:
* Que el monto coincida exactamente con el total del pedido.
* Que el nombre de la cuenta receptora sea el de Dulce Fe.
* Que la fecha y hora sean recientes y no una captura reciclada.

---

## 3. Las Dos Acciones de Validación (1-Clic)

Directamente debajo del voucher tienes dos botones:

```
[ ✔ Confirmar Pago Válido ]    ó    [ ✖ Rechazar Pago ]
```

### Caso A: El dinero ingresó a tu banco (Aprobar)
1. Presiona el botón verde **"Confirmar Pago Válido"**.
2. **Resultado inmediato:**
   * El badge cambia a **"Verificado"** en color verde esmeralda.
   * El sistema graba internamente tu usuario, la fecha y la hora exacta de la aprobación.
   * El cliente ve en su pantalla de seguimiento que su pago fue aceptado.
   * *¡Listo! Ahora el equipo de taller ya puede hornear con total tranquilidad.*

### Caso B: El comprobante no coincide o no llegó el dinero (Rechazar)
1. Presiona el botón rojo **"Rechazar Pago"**.
2. **Resultado inmediato:**
   * El badge cambia a **"Pago Observado / Rechazado"** en color rojo.
   * La orden queda marcada para no producirse por el momento.
3. **Contactar al cliente:**
   * En la parte superior del modal tienes el botón verde **"WhatsApp"**.
   * Al hacerle clic, se abre WhatsApp Web o tu app con el número del cliente y un mensaje listo:  
     *"Hola [Nombre del cliente], te escribimos de Dulce Fe sobre tu pedido..."*
   * Ahí puedes solicitarle la constancia correcta de la operación.
