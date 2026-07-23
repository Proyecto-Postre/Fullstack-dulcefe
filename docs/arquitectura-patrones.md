# 🏛️ ARQUITECTURA DE SOFTWARE & PATRONES DE DISEÑO
> **Guía Técnica de Patrones, Capas de Abstracción y Escalabilidad**  
> **Proyecto:** Dulce Fe ERP & E-Commerce  
> **Versión:** 1.0.0  
> **Ámbito:** Frontend (Vue 3), Backend (Nuxt Nitro), Database (Supabase PostgreSQL) y Automatizaciones (n8n).

---

## 📋 TABLA DE CONTENIDOS

1. [Principios Fundamentales de Software](#1-principios-fundamentales-de-software)
2. [Arquitectura en Capas (Clean Architecture en Nuxt 4)](#2-arquitectura-en-capas-clean-architecture-en-nuxt-4)
3. [Patrones de Diseño Frontend (Vue 3 / Nuxt)](#3-patrones-de-diseño-frontend-vue-3--nuxt)
   - 3.1. Smart vs. Dumb Components (Container / Presentational)
   - 3.2. Composables Pattern (Reusabilidad de Lógica de Estado)
   - 3.3. Strategy Pattern (Motor de Cálculo de Precios y Personalización)
   - 3.4. State Management & Reactividad Unidireccional
4. [Patrones de Backend & Servidor (Nitro Engine & BFF)](#4-patrones-de-backend--servidor-nitro-engine--bff)
   - 4.1. Pattern BFF (Backend-For-Frontend)
   - 4.2. Repository Pattern (Abstracción de Datos)
   - 4.3. DTO Pattern (Data Transfer Objects)
   - 4.4. Middleware & Guards Pattern (Autorización Granular)
5. [Patrones de Base de Datos & Eventos (Supabase PostgreSQL)](#5-patrones-de-base-de-datos--eventos-supabase-postgresql)
   - 5.1. Event-Driven Architecture (Database Webhooks & Triggers)
   - 5.2. RLS Security Pattern (Seguridad en Capa de Datos)
6. [Arquitectura de Automatizaciones (n8n Webhook Architecture)](#6-arquitectura-de-automatizaciones-n8n-webhook-architecture)
7. [Estrategia de Escalabilidad & Decoupling a Futuro](#7-estrategia-de-escalabilidad--decoupling-a-futuro)

---

## 1. PRINCIPIOS FUNDAMENTALES DE SOFTWARE

Para asegurar que el proyecto se mantenga mantenible, testeable y libre de deuda técnica a largo plazo, el desarrollo en Dulce Fe sigue estrictamente los siguientes principios:

### 1.1 SOLID Aplicado a TypeScript y Vue
- **S - Single Responsibility Principle (SRP):** Cada archivo, componente o composable debe tener una sola razón para cambiar. Un componente de botón no calcula precios; un endpoint de recetas no envía correos.
- **O - Open/Closed Principle (OCP):** El código debe estar abierto a extensión pero cerrado a modificación. La adición de un nuevo método de pago o un nuevo tipo de masa no debe alterar el core del carrito de compras.
- **L - Liskov Substitution Principle (LSP):** Los tipos e interfaces definidos en TypeScript (`Database['public']['Tables']`) deben respetarse sin forzar castings inseguros (`any`).
- **I - Interface Segregation Principle (ISP):** Preferir interfaces pequeñas y específicas a objetos gigantescos monolithic.
- **D - Dependency Inversion Principle (DIP):** Los componentes de alto nivel no dependen de implementaciones concretas de base de datos, sino de la abstracción proveída por Nitro Server Engine o Composables.

### 1.2 DRY (Don't Repeat Yourself) & KISS (Keep It Simple, Stupid)
- La lógica de cálculo de precios y formateo de moneda (`S/ #,##0.00`) vive en utilidades centralizadas, nunca duplicada en plantillas HTML.

---

## 2. ARQUITECTURA EN CAPAS (CLEAN ARCHITECTURE EN NUXT 4)

El proyecto organiza sus componentes siguiendo una Clean Architecture adaptada a Nuxt 4:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. PRESENTATION LAYER (Vue Components, Pages, UI System)               │
├────────────────────────────────────────────────────────────────────────┤
│ 2. APPLICATION LAYER (Composables: useCart, useRecipes, useAuth)      │
├────────────────────────────────────────────────────────────────────────┤
│ 3. DOMAIN LAYER (Business Rules, Costing Formulas, DTOs, Interfaces)   │
├────────────────────────────────────────────────────────────────────────┤
│ 4. INFRASTRUCTURE LAYER (Nitro Handlers, Supabase Client, ExcelJS, n8n)│
└────────────────────────────────────────────────────────────────────────┘
```

- **Capa de Presentación (`app/pages/`, `app/components/`):** Se encarga únicamente del renderizado HTML/CSS, captura de eventos de usuario y animaciones.
- **Capa de Aplicación (`app/composables/`):** Coordina el estado reactivo, valida formularios y conecta la UI con el Backend.
- **Capa de Dominio (`app/types/`, `docs/formulas-costeo.md`):** Contiene los modelos de datos, tipos TypeScript y reglas financieras sagradas del negocio.
- **Capa de Infraestructura (`server/api/`, `server/middleware/`):** Conexión con Supabase PostgreSQL, generación de buffers binarios de ExcelJS y despacho de Webhooks a n8n.

---

## 3. PATRONES DE DISEÑO FRONTEND (VUE 3 / NUXT)

### 3.1. Smart vs. Dumb Components (Container / Presentational)
- **Container / Smart Components (`AdminRecipesTab.vue`, `AdminMaterialsTab.vue`):**
  - Conocen el origen de los datos (hacen peticiones fetch a `/api/...`).
  - Manejan el estado complejo de la pestaña y los modales.
- **Presentational / Dumb Components (`CustomSelect.vue`, `BaseButton.vue`):**
  - **Agnósticos a la lógica de negocio.**
  - Reciben datos vía `props` y emiten cambios vía `emits`.
  - Altamente reutilizables en cualquier parte de la aplicación.

### 3.2. Composables Pattern (Reusabilidad de Lógica de Estado)
En lugar de saturar las vistas `.vue` con lógica reactiva de decenas de líneas, extraemos la lógica de estado en **Composables** dentro de `app/composables/`:

```typescript
// app/composables/useRecipeCalculator.ts
import { ref, computed } from 'vue'

export function useRecipeCalculator(recipeItems: Ref<any[]>, additionalCosts: Ref<any>) {
  const sumIngredients = computed(() => {
    return recipeItems.value.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0)
  })

  const totalCost = computed(() => {
    const cif = Number(additionalCosts.value.packaging || 0) + 
                Number(additionalCosts.value.utilities || 0) + 
                Number(additionalCosts.value.labor || 0)
    return sumIngredients.value + cif
  })

  const calculateMargin = (suggestedPrice: number) => {
    const profit = suggestedPrice - totalCost.value
    const percentage = suggestedPrice > 0 ? (profit / suggestedPrice) * 100 : 0
    return { profit, percentage }
  }

  return { sumIngredients, totalCost, calculateMargin }
}
```

### 3.3. Strategy Pattern (Motor de Personalización de Tortas)
Para calcular el precio dinámico de una torta personalizada en el E-Commerce según la combinación de opciones (tamaño, bizcocho, relleno, cubierta, toppers), aplicamos el patrón **Strategy**:

```typescript
interface PricingStrategy {
  calculate(basePrice: number, options: CustomCakeOptions): number
}

class TieredCakeStrategy implements PricingStrategy {
  calculate(basePrice: number, options: CustomCakeOptions): number {
    let total = basePrice * options.portionsMultiplier
    if (options.filling === 'frutos_rojos') total += 15.00
    if (options.topper === 'acrilico_personalizado') total += 25.00
    return total
  }
}
```

---

## 4. PATRONES DE BACKEND & SERVIDOR (NITRO ENGINE & BFF)

### 4.1. Pattern BFF (Backend-For-Frontend)
Nuxt Nitro actúa como una capa **BFF**. En lugar de que el cliente web consulte directamente la base de datos de Supabase para operaciones financieras complejas, realiza peticiones a `/server/api/recipes/export.get.ts`.

**Ventajas del BFF:**
1. Oculta las credenciales privadas y claves maestras en el servidor.
2. Agrupa múltiples consultas a la base de datos en 1 sola respuesta limpia.
3. Ejecuta la generación de archivos pesados (ExcelJS) en el servidor sin congelar el navegador del usuario.

### 4.2. Repository Pattern (Abstracción de Datos)
Para evitar acoplar los endpoints de Nitro directamente a la sintaxis SQL o SDK de Supabase, encapsulamos las consultas en funciones de repositorio:

```typescript
// server/utils/repositories/recipeRepository.ts
import { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export async function getRecipeWithDetails(event: H3Event, productId: string) {
  const supabase = await serverSupabaseClient(event)
  return await supabase
    .from('recipe_items')
    .select('quantity_used, raw_materials(name, unit, purchase_price, purchase_quantity)')
    .eq('product_id', productId)
}
```

### 4.3. DTO Pattern (Data Transfer Objects)
Mapea los nombres de columnas de la base de datos (`purchase_price`, `purchase_quantity`) a un objeto limpio de dominio que el frontend o el exportador consumen con seguridad de tipos.

### 4.4. Middleware & Guards Pattern
En `server/middleware/auth.ts`, todo request que apunte a `/api/admin/*` pasa por un interceptor que valida el token JWT del usuario y su rol antes de permitir la ejecución.

---

## 5. PATRONES DE BASE DE DATOS & EVENTOS (SUPABASE POSTGRESQL)

### 5.1. Event-Driven Architecture (Database Webhooks & Triggers)
Supabase permite reaccionar a cambios en la base de datos sin sobrecargar el código de la aplicación:

```
[INSERT en tabla 'orders'] ➔ [PostgreSQL Trigger] ➔ [HTTP Webhook Dispatcher] ➔ [n8n Automation Engine]
```

### 5.2. RLS Security Pattern (Row Level Security)
Seguridad declarativa directamente en el motor de base de datos PostgreSQL:

```sql
-- Solo administradores pueden leer/modificar insumos de almacén
CREATE POLICY "Acceso total a Almacen solo para Admins"
ON raw_materials
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 6. ARQUITECTURA DE AUTOMATIZACIONES (N8N WEBHOOK ARCHITECTURE)

La orquestación de procesos externos no vive en el código del frontend ni sobrecarga el servidor Nuxt. Se delega a **n8n**:

```
 ┌─────────────────┐       HTTP POST       ┌─────────────────┐       API WhatsApp       ┌─────────────────┐
 │   Nuxt / Nitro  │ ────────────────────► │   n8n Engine    │ ─────────────────────► │ Cliente Final   │
 │ (Cambio Estado) │   (Payload JSON)      │ (Workflow DAG)  │    (Mensaje Texto)     │ (Celular/WA)    │
 └─────────────────┘                       └─────────────────┘                          └─────────────────┘
```

- **Desacoplamiento:** Si el proveedor de WhatsApp cambia o falla, la aplicación web sigue funcionando al 100% sin romperse.
- **Resiliencia:** n8n reintenta automáticamente el envío en caso de fallas de red (Retry Policy).

---

## 7. ESTRATEGIA DE ESCALABILIDAD & DECOUPLING A FUTURO

### ¿Cómo escalar el sistema de 100 a 100,000 usuarios sin reescribir?

1. **Fase Actual (Monolito Serverless en Nuxt 4):**
   - Frontend SSR + Backend Nitro API + Supabase DB.
   - Excelente para iniciar, costo casi cero, despliegue instantáneo en Vercel / Netlify.

2. **Fase de Crecimiento (Separación de Capas):**
   - **Frontend:** Se mantiene en Nuxt 4 optimizado con CDN global (Cloudflare).
   - **API Backend:** Los endpoints de `/server/api/` se pueden extraer a un servicio Node.js / Express / NestJS independiente en un contenedor Docker si se necesita procesamiento intensivo.
   - **Caché & Búsqueda:** Adición de **Redis** para almacenar carritos activos y **Meilisearch** para búsqueda instantánea en el catálogo.
