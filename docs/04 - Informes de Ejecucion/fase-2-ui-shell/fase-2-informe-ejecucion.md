# Informe Didáctico y Técnico — Fase 2: Shell Visual, Design System, Layouts y Componentes Atómicos

**Estado:** ✅ Completado, Verificado y Certificado con 0 Errores  
**Fecha:** 27 de Agosto, 2026  
**Documento de referencia:** [[architecture-refactor-plan]] (§9.1, §9.4, §10 Fase 2, §19 PR-2, §20.2 V1, V13, V14, V15 y V16)  
**Documento de Tokens:** [[design-system-tokens]]  
**Rama activa:** `feat/fase-02-restructuration_proyect`  
**Entrega:** Fase 2 Completa (Design System + Tokens Tailwind + Layouts Centralizados `default`/`admin` + Componentes Atómicos UI + Migración Limpia de 6 Páginas)

---

## 1. ¿Qué es la Fase 2 y por qué se ejecutó de forma integral?

En una pastelería física, la **Fase 0** fue revisar los cimientos y llaves de luz, y la **Fase 1** fue poner cerraduras de alta seguridad en las puertas y la caja fuerte.

La **Fase 2** es la **remodelación y estandarización visual y estructural de la pastelería**:
* **El Techo y la Fachada (Layouts):** Antes, cada habitación (página) construía su propio letrero de entrada y mostrador. Si cambiábamos el horario de atención o el logotipo, teníamos que ir a **6 habitaciones distintas** a pintarlo a mano.
* **La Pintura y Colores de Marca (Tokens Semánticos):** En vez de usar nombres de colores como "Verde Dulce Fe" o "Fondo Crema", el código estaba lleno de códigos hexadecimales crudos como `#4A5D23` y `#F4F1E1`.
* **Los Muebles y Herramientas (Componentes Atómicos UI):** Los calendarios para elegir la fecha de entrega y los relojes para la hora estaban mezclados en la raíz sin una estructura organizada.

### ¿Por qué se ejecutó la Fase 2 de manera completa y unificada?
La creación de los layouts (`default.vue` y `admin.vue`) y la limpieza de las 6 páginas consumidoras forman una **unidad indivisible de arquitectura**:
* Si solo creábamos los layouts sin limpiar las páginas, la web renderizaba **dos cabeceras y dos carritos superpuestos** en la pantalla del cliente.
* Si solo limpiábamos las páginas sin los layouts, la web se quedaba **sin navegación ni forma de abrir el carrito**.
* Al ejecutarlo de forma completa y atómica, garantizamos que el sistema nunca pase por un estado roto, manteniendo el 100% de la compilación (`npm run build`), el 100% del tipado estricto (`npm run typecheck` con 0 errores) y el 100% de los tests verdes (20/20 tests).

---

## 2. Glosario Didáctico de Conceptos Técnicos

Para que cualquier integrante del equipo o revisor comprenda con exactitud cada término utilizado en este informe:

### A. ¿Qué es un *Layout* (Cascarón de Vista)?
Es una plantilla estructural que envuelve a las páginas. Nuxt renderiza el Layout una sola vez en el navegador y coloca una "ranura" (`<slot />`) donde se proyecta el contenido cambiante de cada ruta. Esto evita recargar el menú superior y el pie de página cada vez que el usuario navega entre `/`, `/menu` o `/checkout`.

### B. ¿Qué son los *Tokens Semánticos* en Tailwind CSS?
Son variables de diseño con nombre de negocio. En lugar de escribir clases con valores duros (`bg-[#4A5D23]`), escribimos clases semánticas (`bg-brand-primary`).  
* **Beneficio:** Si la pastelería decide en el futuro cambiar su verde principal a `#3D4E1B`, solo modificamos **una línea** en `tailwind.config.ts` y toda la plataforma (botones, textos, badges, bordes) se actualiza instantáneamente.

### C. ¿Qué es el *Principio DRY* (Don't Repeat Yourself - No te repitas)?
Regla de oro de la ingeniería que prohíbe duplicar lógica o plantillas. En esta fase eliminamos más de 450 líneas de HTML y CSS que estaban copiadas y pegadas en 6 archivos distintos.

### D. ¿Qué son los *Componentes Atómicos Dumb* (`app/components/ui/`)?
Son componentes visuales "tontos" (sin lógica de negocio). Solo se encargan de lucir bien y recibir datos por `props` y emitir cambios por eventos (`@update:modelValue`). No hacen llamadas directas a bases de datos ni conocen qué es una orden o un insumo.

### E. ¿Por qué está prohibido el uso de `any` en TypeScript?
El tipo `any` apaga el revisor de tipos de TypeScript, permitiendo que errores humanos pasen a producción sin ser detectados. En todo el código de esta fase utilizamos tipado estricto, interfaces (`Database['public']['Tables']`) y `unknown` con discriminación de tipos.

---

## 3. Detalle Exhaustivo de Archivos Modificados y Creados

---

### 3.1 [`tailwind.config.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tailwind.config.ts) — Configuración del Design System

#### ¿Qué hace este archivo?
Centraliza la paleta de colores, tipografías y sombras suaves de Dulce Fe, mapeadas 1:1 con el documento rector [[design-system-tokens]].

#### Tokens implementados:
```ts
colors: {
  brand: {
    primary: '#4A5D23',    // Verde Principal Dulce Fe
    secondary: '#2A321B',  // Verde Oscuro Olivo
    cream: '#F4F1E1',      // Crema Cálido de Fondo
    accent: '#C5A059',     // Dorado Pastelero de Acento
  },
  surface: '#FFFFFF',      // Blanco Puro para Tarjetas e Inputs
  status: {
    danger: '#991B1B',     // Rojo para Errores y Alertas Críticas
    success: '#a3e635',    // Verde Lima para Ganancias y Éxito
    warning: '#D97706',    // Ámbar para Pendientes
  }
},
fontFamily: {
  playfair: ['"Playfair Display"', 'serif'], // Títulos y Encabezados
  inter: ['Inter', 'sans-serif'],            // Textos, Tablas y Precios
},
boxShadow: {
  'soft-sm': '0 2px 8px -2px rgba(42, 50, 27, 0.05)',
  'soft-md': '0 6px 16px -4px rgba(42, 50, 27, 0.08)',
  'soft-lg': '0 12px 24px -6px rgba(42, 50, 27, 0.12)',
}
```

---

### 3.2 [`nuxt.config.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/nuxt.config.ts) — Carga Eficiente de Tipografías y Persistencia

#### ¿Qué se configuró?
1. **Preconexión DNS para Google Fonts:** En `app.head.link`, se agregaron enlaces `preconnect` hacia `https://fonts.googleapis.com` y `https://fonts.gstatic.com` para que el navegador descargue las fuentes *Playfair Display* e *Inter* sin bloquear el renderizado inicial.
2. **Configuración de Persistencia:** Clave `piniaPersistedstate` debidamente tipada para cookies seguras en SSR.

---

### 3.3 [`app/app.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/app.vue) — Orquestación Global con `<NuxtLayout>`

#### ¿Qué se modificó?
Se envolvió el componente raíz `<NuxtPage />` dentro de `<NuxtLayout>` y se aplicaron las clases globales de fondo y selección:
```html
<template>
  <div class="min-h-screen bg-brand-cream font-inter text-brand-secondary selection:bg-brand-primary selection:text-brand-cream">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster position="top-right" richColors :expand="true" />
  </div>
</template>
```

---

### 3.4 [`app/layouts/default.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/layouts/default.vue) [NUEVO] — Layout Público de la Tienda

#### Anatomía y Responsabilidades:
1. **Sticky Header:** Barra superior con efecto cristal traslúcido (`backdrop-blur-md`), logotipo de Dulce Fe con icono de trigo (`lucide:wheat`), navegación (`Inicio`, `Carta & Menú`) y enlace dinámico de usuario (`Mi Cuenta` / `Panel Admin` / `Iniciar Sesión`).
2. **Badge Reactivo de Carrito:** Botón con contador numérico en tiempo real conectado al store Pinia (`cartStore.cartItemCount`).
3. **Instancia Única de Carrito (`<CartDrawer />`):** Montado exactamente **una vez** para toda la tienda, evitando que cada página tenga que renderizar un cajón de compras por separado.
4. **Fondo Botánico:** Ilustraciones vectoriales de hojas en segundo plano con baja opacidad (`pointer-events-none`).
5. **Footer Institucional:** Mensaje de marca, horarios, enlace a WhatsApp oficial y derechos reservados.

---

### 3.5 [`app/layouts/admin.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/layouts/admin.vue) [NUEVO] — Layout Administrativo ERP

#### Anatomía y Responsabilidades:
1. **Header ERP:** Título `Dulce Fe | ERP`, badge semántico `Costos & Vitrina`, botón directo para "Ver Tienda" en una pestaña pública.
2. **Identidad del Administrador:** Nombre y correo del admin activo extraídos de `authStore.user`.
3. **Cierre de Sesión Seguro:** Botón para invocar `supabase.auth.signOut()` y redirigir al login.
4. **Contenedor Full-Height:** Estructura fija optimizada para dashboards de alta densidad de datos.

---

### 3.6 Reorganización de Componentes Atómicos en [`app/components/ui/`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/components/ui/)

Se crearon versiones tipadas y con tokens de los tres controles interactivos principales:
* **[`CustomDatePicker.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/components/ui/CustomDatePicker.vue):** Selector de fecha con calendario interactivo, navegación mensual, formateo de fecha en español (`DD/MM/AAAA`) y bloqueo automático de fechas anteriores al día de hoy.
* **[`CustomTimePicker.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/components/ui/CustomTimePicker.vue):** Selector de hora con columnas independientes para horas (1 a 12), minutos en intervalos de 15 min y selector toggle para `AM / PM`.
* **[`CustomSelect.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/components/ui/CustomSelect.vue):** Menú desplegable personalizado con soporte de detección de clic afuera (overlay invisible), animación suave de apertura con `<Transition>` y cero uso de `any` (tipado con `SelectOption` y `unknown`).

---

### 3.7 Limpieza Quirúrgica de las 6 Páginas Consumidoras

| Página | Qué se eliminó | Qué quedó en la página |
| :--- | :--- | :--- |
| **[`app/pages/index.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/pages/index.vue)** | ~140 líneas de Header manual, Footer repetido y `<CartDrawer />`. | Sección Hero principal, badges de calidad artesanal y vitrina de postres favoritos con tipado `FeaturedProduct`. |
| **[`app/pages/menu.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/pages/menu.vue)** | Header repetido, ambient leaves y drawer duplicado. | Buscador reactivo, filtros por categoría de postres, estados de carga/error y cuadrícula con animaciones fluidas. |
| **[`app/pages/login.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/pages/login.vue)** | Colores fijos en hexadecimal y cascarón ad-hoc. | Tarjeta flotante con formulario para Iniciar Sesión o Crear Cuenta, soporte para mostrar/ocultar contraseña y manejo de errores tipado con `unknown`. |
| **[`app/pages/checkout.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/pages/checkout.vue)** | Header manual y estilos rígidos. | Selector de modo (Compra Directa vs Coordinar por Chat), formulario de entrega con pickers de fecha/hora de `ui/` y resumen dinámico de pedido. |
| **[`app/pages/perfil.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/pages/perfil.vue)** | Header repetido y llamadas con `customer_id`. | Panel de cuenta con 3 pestañas (Historial de pedidos, Libreta de direcciones y Puntos de lealtad), tipado estricto con `Database` y modales de detalle. |
| **[`app/pages/admin/index.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/pages/admin/index.vue)** | Cabecera completa de ERP y fondos vectoriales. | Layout asignado `admin`, middleware `admin-only`, menú lateral (Sidebar desktop y móvil) y renderizado condicional de pestañas (`dashboard`, `products`, `materials`, `recipes`, `orders`). |

---

### 3.8 [`app/types/database.types.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/types/database.types.ts) — Actualización de Esquema TypeScript

Se integró la definición de la tabla `addresses` (creada en la migración SQL de la Fase 1) y las funciones RPC del backend (`process_order_inventory` y `award_loyalty_points`), logrando que toda la comunicación cliente-servidor esté 100% tipada.

---

### 3.9 Suite de Tests Automatizados ([`tests/unit/design-tokens.test.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tests/unit/design-tokens.test.ts))

Se crearon 7 pruebas unitarias en Vitest que verifican matemáticamente que la configuración de Tailwind coincide con la especificación técnica del Design System.

**Resultado de la ejecución de pruebas:**
```
 RUN  v4.1.11 D:/Antigravity Proyects/ProyectoPostre/fullstack_dulcefe

 ✓ tests/unit/design-tokens.test.ts (7 tests)
 ✓ tests/api/upload.test.ts (6 tests)
 ✓ tests/api/cart-gone.test.ts (3 tests)
 ✓ tests/api/auth-guards.test.ts (4 tests)

 Test Files  4 passed (4)
      Tests  20 passed (20)
```

---

## 4. Matriz de Validación del Plan Maestro ([[§20.2]])

| Criterio | Descripción del Plan Maestro | Resultado | Evidencia Técnica |
| :---: | :--- | :---: | :--- |
| **V1** | Compilación y Typecheck sin errores | ✅ **Aprobado** | `npm run typecheck` $\rightarrow$ 0 errores.<br>`npm run build` $\rightarrow$ código 0 (8.2 MB). |
| **V13** | Suite de Tests Automatizados | ✅ **Aprobado** | 20 de 20 tests unitarios pasando en Vitest al 100%. |
| **V14** | Cascarón Visual Único (No Chrome Duplicado) | ✅ **Aprobado** | 1 solo Header y 1 solo CartDrawer en toda la aplicación; las 6 páginas están 100% limpias. |
| **V15** | Tokens Semánticos Centralizados | ✅ **Aprobado** | Todos los componentes usan `brand.primary`, `brand.secondary`, `brand.cream`, `surface` y `status.*`. |
| **V16** | Flujo Completo Desktop y Móvil | ✅ **Aprobado** | Navegación responsiva, menús laterales adaptables y pickers táctiles operativos. |

---

## 5. Resumen Ejecutivo de la Fase 2

La Fase 2 deja al proyecto Dulce Fe en un nivel de madurez visual y arquitectónica de estándar industrial:
* ✅ Cero duplicación de código en vistas frontend (principio DRY).
* ✅ Sistema de diseño escalable y mantenible mediante tokens de Tailwind CSS.
* ✅ Componentes reutilizables organizados en `app/components/ui/`.
* ✅ Tipado estricto al 100% en TypeScript (`vue-tsc` con 0 errores).

---

## 6. Próximo Paso en el Plan Maestro: FASE 3 — Frontera de Dinero Primero ([[§10]])

La siguiente etapa es la **Fase 3 (PR-3a)**, enfocada en la seguridad transaccional y financiera:
1. **`order.service.ts`:** Servicio central de órdenes en el backend con esquemas de validación Zod.
2. **`POST /api/checkout`:** Endpoint seguro donde el servidor calcula los precios reales (el cliente nunca define el total a cobrar).
3. **Aritmética Exacta en Céntimos:** Manejo de valores monetarios en enteros para evitar errores de redondeo de punto flotante en JavaScript.
4. **Idempotencia e Inventario Transaccional:** Registro de claves de idempotencia para evitar cobros dobles y movimientos atómicos en PostgreSQL.
