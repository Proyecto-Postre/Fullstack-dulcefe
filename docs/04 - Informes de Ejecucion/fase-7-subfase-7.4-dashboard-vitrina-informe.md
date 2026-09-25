# Informe de Ejecución — Fase 7 / Subfase 7.4: Dashboard Preventivo de Productos en Riesgo y Vitrina Comercial Artesanal

**Fecha de Ejecución:** 23 de Septiembre de 2026  
**Rama de Trabajo:** `feat/batch-recipes-yielding`  
**Estado:** ✅ Completado, Verificado y Probado en Verde (237/237 tests, Typecheck limpio, Build completo)  
**Autor:** Antigravity AI — Pair Programming Assistant

---

## 1. Resumen Ejecutivo

En esta subfase 7.4 se sincronizó la experiencia del Centro de Mando Administrativo (`AdminDashboardTab.vue`) y de la Vitrina Comercial Pública (`CatalogProductCard.vue` y `menu.vue`) con la realidad operativa del modelo de pastelería fina artesanal de Dulce Fe.

Anteriormente, el sistema operaba bajo un paradigma de supermercado de productos empaquetados:
- El Dashboard mostraba una alerta de "Productos por agotarse (stock <= 5)", obligando al pastelero a ingresar un stock numérico artificial en productos que se hornean frescos.
- La vitrina pública mostraba a los clientes avisos de falsa urgencia como `"Últimos 2"`, lo cual contradecía la promesa artesanal de postres recién horneados y creaba desconfianza.

Con esta entrega:
1. **Dashboard Preventivo:** Se transformó el panel operativo en **"Productos en Riesgo de Producción"** (consumiendo en vivo `GET /api/admin/dashboard/at-risk-products`), alertando proactivamente si un postre no puede hornearse o empaquetarse hoy debido al desabastecimiento de algún insumo de su tanda o empaque directo.
2. **Vitrina Comercial Artesanal:** Los productos disponibles muestran el prestigioso badge botánico **"🌿 Horneado Fresco"**, mientras que los productos pausados muestran **"Agotado por hoy"** con el botón de compra deshabilitado para evitar cobros de pedidos imposibles de cumplir.

---

## 2. ¿Qué se hizo? (Alcance Técnico)

### A. Dashboard Administrativo (`AdminDashboardTab.vue`)
- **Consulta Reactiva:** Integración con `/api/admin/dashboard/at-risk-products` tipada con la interfaz `AtRiskProductItem`.
- **Métrica KPI #2 en Carrusel/Desktop:**
  - Título: **"Productos en Riesgo"**.
  - Contador: Número de postres desabastecidos de materias primas o empaques.
  - Indicador visual: Verde lima si 0 (taller abastecido), Rojo si > 0.
- **Lista Operativa de Alerta (Columna Izquierda / Pestaña 1 en Móvil):**
  - Muestra la lista de postres en riesgo con miniatura, nombre y precio.
  - Desglose visual de insumos críticos faltantes con cantidades exactas (`disponible` vs `requerido`).
  - Botón de acción rápida "Revisar" para editar el producto o su escandallo.
  - Estado vacío positivo: *"🌿 ¡Taller 100% abastecido! Todos los postres cuentan con materias primas y empaques suficientes para producirse hoy."*
- **Paginación Adaptativa:** Soporte para paginar listas largas de productos en riesgo sin alterar la columna derecha de insumos con stock bajo.

### B. Vitrina Comercial Pública (`CatalogProductCard.vue`)
- **Eliminación de Falsa Urgencia:** Se retiraron los badges `"Últimos X"` con pulsos rojos alarmistas.
- **Badge Artesanal de Calidad:**
  - Si `stock > 0`: Badge elegante con backdrop blur: `🌿 Horneado Fresco`.
  - Si `stock === 0`: Badge `Agotado por hoy`.
- **Bloqueo Preventivo del Botón de Compra:**
  - Si `stock > 0`: Botón "Pedir" activo con icono de bolsa.
  - Si `stock === 0`: Botón deshabilitado con leyenda *"Agotado"*, cursor no permitido y prevención de click.

### C. Pruebas Automatizadas (`tests/unit/at-risk-dashboard.test.ts`)
- Verificación del contrato y estructura de datos de productos en riesgo.
- Validación de detección de insumos faltantes de masa y empaques directos.
- Validación de la lógica de presentación de la vitrina artesanal (Horneado Fresco vs Agotado por hoy).

---

## 3. ¿Cómo se hizo? (Decisiones de Arquitectura y Negocio)

### 1. Detección Preventiva en Tiempo Real
El backend evalúa la composición del producto (fracción de tanda requerida $\frac{\text{unidades}}{\text{rendimiento}} \times \text{insumo}$ y empaques directos). Si el stock físico en `raw_materials` es menor a lo necesario para preparar al menos 1 unidad de venta, se incluye inmediatamente en la lista de riesgo con el detalle exacto de lo faltante.

### 2. Protección Contractual del Cliente en Checkout
Al bloquear preventivamente el botón "Pedir" en la tarjeta de vitrina cuando un postre está pausado (`stock === 0`), se previene la fricción comercial de cobrar dinero a través de Yape/Plin por un postre que el taller no tiene insumos para preparar.

---

## 4. ¿Por qué se hizo? (Justificación de Negocio)

1. **Eficiencia en Compras del Taller:** El pastelero o encargado de compras no tiene que adivinar qué insumos faltan abriendo receta por receta; el Dashboard le dice al instante: *"No puedes vender la Caja x 6 Roles porque te quedan 100g de harina y requieres 333g, y se agotaron las cajas kraft"*.
2. **Coherencia con la Marca Dulce Fe:** Dulce Fe es una pastelería fina artesanal de alta gama, no un supermercado minorista. Los clientes valoran saber que su postre será horneado fresco el día de su entrega o retiro.

---

## 5. Resultados de Pruebas y Validación

### Pruebas Automatizadas Unitarias & Integración
```bash
Test Files  36 passed (36)
Tests       237 passed (237)
Duration    3.36s
```

### Validación de Tipos (TypeScript / vue-tsc)
```bash
npx nuxi typecheck
# Salida: The command exited with code 0. (0 errores de tipos)
```

### Validación de Compilación de Producción (Nitro / Rollup)
```bash
npm run build
# Salida: ✨ Build complete! (Código de salida 0)
```

---

## 6. Próximos Pasos (Fase 5: Pruebas E2E y de Integración Finales)
- Pruebas E2E y de flujo completo:
  - Flujo de creación de tanda $\to$ porcionamiento a producto comercial $\to$ pedido en vitrina $\to$ deducción proporcional en taller (`processing`) $\to$ congelamiento de escandallo en `cost_snapshot`.
  - Validación del descargo rápido de piezas sueltas y su reflejo inmediato en el almacén.
