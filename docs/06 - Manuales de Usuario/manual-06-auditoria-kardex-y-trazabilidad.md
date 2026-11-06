# Manual 06: Auditoria, Kardex de Insumos & Trazabilidad

**¿Para quien es esta guia?** Administradores, Gerencia y Contabilidad  
**Tiempo estimado de lectura:** 3 minutos  
**Seccion en el panel:** Panel Administrativo > Pestaña *"Auditoria"* (`/admin`)

---

## 1. Vision General del Modulo

El modulo de **Auditoria** es el centro de control y vigilancia de Dulce Fe. Centraliza en 4 vistas independientes toda la historia de lo que entra, sale y ocurre en la operacion:

1. **Kardex (Movimientos de Insumos):** El balance fisico de materias primas.
2. **Eventos (Bitacora del Sistema):** Quien hizo que, cuando y con que datos.
3. **Mermas (Desperdicios en Taller):** Piezas quemadas, rotas o caidas.
4. **Financiero (Rentabilidad Real):** Margen bruto y costos de cada orden horneada.

---

## 2. Pestaña 1: Kardex de Insumos (Stock Movements)

### ¿Como funciona?
Cada vez que:
- Se registra una compra de insumos en Almacen,
- Un pedido pasa a *"En Taller / Horneado"* (descuento automatico por escandallo),
- Se reporta una merma en cocina,
- O el administrador ajusta el stock a mano,

El sistema genera una fila inmutable con el insumo, la cantidad (+ o -), el motivo y la fecha exacta.

### Filtros Disponibles:
* **Materia Prima:** Permite ver el historial exclusivo de un solo insumo (ej. Harina Pastelera, Chocolate Bitter, Manjar Blanco).
* **Tipo de Movimiento:**
  - `purchase`: Entradas por compras a proveedores.
  - `production_order`: Consumo por pedidos que entraron a produccion.
  - `waste`: Descuentos por mermas o desperdicios.
  - `manual_adjustment`: Correcciones manuales de inventario.
* **Rango de Fechas:** Filtro desde / hasta para cierres semanales o mensuales.

### Exportacion a Excel (`.xlsx`):
1. Aplica los filtros deseados en pantalla.
2. Presiona el boton **"Exportar Excel (.xlsx)"** en la esquina superior derecha.
3. Se descargara un reporte con la tipografia institucional, anchos de columna automaticos y formatos contables listos para revision tributaria o conciliacion.

---

## 3. Pestaña 2: Bitacora de Eventos (`audit_events`)

Registra eventos criticos del sistema para seguridad:
* **Aprobacion de pagos:** Registro de cuando se valido o rechazo un voucher Yape/Plin.
* **Transicion de pedidos:** Cambios de estado en KDS o recepcion.
* **Modificacion de recetas y precios:** Cambios en fichas tecnicas o costos unitarios.

Haz clic en *"Ver Detalle"* en cualquier evento para inspeccionar el payload JSON con los valores anteriores y los nuevos.

---

## 4. Pestaña 3: Registro de Mermas de Taller

Permite auditar el desperdicio generado en cocina:
* Indica que receta o rendimiento se vio afectado (ej. Porcion Tres Leches, Alfajor).
* Muestra el motivo (`burned`, `dropped`, `expired`, `damaged`) y las observaciones del personal.
* Permite cruzar informacion con los descargos rapidos de la pestaña de Tandas Maestras.

---

## 5. Pestaña 4: Auditoria Financiera & Margenes Reales

Muestra el desempeno economico de las ordenes entregadas o en curso:
* **Ingreso Total (PEN):** Monto cobrado al cliente.
* **Costo Total (COGS):** Costo real congelado al momento de hornear (Materia Prima + CIF + Mano de Obra).
* **Margen Bruto:** Ganancia neta en soles y porcentaje sobre la venta.
* **Barra de Rentabilidad:**
  - Verde: Margen superior al 55%.
  - Ambar: Margen entre 40% y 55%.
  - Rojo: Margen critico menor al 40%.
