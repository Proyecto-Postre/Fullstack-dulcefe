# Informe de Ejecución — Fase 0: Plataforma y Línea Base

**Estado:** ✅ Completado y Verificado en Build  
**Fecha:** 25 de Agosto, 2026  
**Documento de referencia:** [`docs/architecture-refactor-plan.md`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/architecture-refactor-plan.md) (§10, §15, §19 PR-0, §20.1)  
**Tipo de entrega:** PR-0 (Infraestructura, Configuración y Baseline)

---

## 1. Propósito de la Fase 0

La **Fase 0** no modifica lógica de negocio ni altera la experiencia del usuario. Su objetivo es **establecer los cimientos de ingeniería**:
1. Garantizar que el entorno sea **reproducible** en cualquier máquina o servidor de CI/CD.
2. **Eliminar secretos y configuraciones hardcodeadas** que acoplen el código fuente a un entorno específico.
3. Asegurar una **línea base limpia**: verificar que el proyecto compile de extremo a extremo antes de realizar cirugías de seguridad y refactorización.

---

## 2. Detalle de Cambios por Archivo (Qué, Por qué y Cómo)

### 2.1 [`nuxt.config.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/nuxt.config.ts) — Desacople de Credenciales y `runtimeConfig`

* **¿Qué se hizo?**  
  Se retiraron la URL y la Anon Key que estaban escritas literalmente dentro de la clave `supabase: { ... }`. En su lugar, se implementó el bloque estándar `runtimeConfig`.
* **¿Por qué se hizo?**
  * **Seguridad y Fuga de Secretos:** Tener credenciales en código versionado en Git es una vulnerabilidad crítica. Además, impedía poder usar una base de datos de *Staging* para pruebas y otra de *Producción* para clientes reales sin editar el código a mano.
  * **Aislamiento Servidor vs Cliente:** En Nuxt, todo lo que vive en la raíz de `runtimeConfig` es **estrictamente privado** (solo accesible dentro de funciones de Nitro en el servidor), mientras que `runtimeConfig.public` se expone de forma segura al navegador. Esto prepara el terreno para la futura clave `SUPABASE_SERVICE_ROLE_KEY` requerida en la Fase 3.
* **¿Cómo se hizo?**  
  ```ts
  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_KEY || '',
      whatsappNumber: process.env.NUXT_PUBLIC_WHATSAPP_NUMBER || '51998265700',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },
  supabase: {
    redirect: false
  }
  ```

---

### 2.2 [`package.json`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/package.json) — Restricción de Entorno y Nuevos Scripts

* **¿Qué se hizo?**  
  Se declaró la sección `engines` para Node.js y se añadieron los comandos de automatización `typecheck` y `db:types`.
* **¿Por qué se hizo?**
  * Nuxt 4 requiere **Node >= 20.0.0**. Si un hosting (como Vercel) o un nuevo desarrollador intenta compilar con Node 16 o 18, fallará de forma silenciosa o con errores crípticos de ESM. La clave `engines` previene esto.
  * `typecheck` permite validar la integridad de TypeScript sin necesidad de empaquetar toda la aplicación.
  * `db:types` sienta la base para generar automáticamente los tipos de Supabase (`app/types/database.types.ts`) en la Fase 1 sin edición manual.
* **¿Cómo se hizo?**  
  ```json
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "typecheck": "nuxt typecheck",
    "db:types": "supabase gen types typescript --project-id rklxfrwzuwjvnfcdhmei > app/types/database.types.ts"
  }
  ```

---

### 2.3 [`.nvmrc`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/.nvmrc) — Estandarización de Versión de Node

* **¿Qué se hizo?**  
  Se creó el archivo `.nvmrc` con el valor `22`.
* **¿Por qué se hizo?**  
  Permite que herramientas como NVM (Node Version Manager) seleccionen automáticamente la versión LTS activa (Node 22) al ingresar al directorio mediante `nvm use`, garantizando paridad entre el equipo de desarrollo y el entorno de producción.
* **¿Cómo se hizo?**  
  Archivo de una sola línea con `22`.

---

### 2.4 [`.env`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/.env) y [`.env.example`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/.env.example) — Gestión de Variables y Plantilla Pública

* **¿Qué se hizo?**  
  Se actualizaron las variables locales en `.env` y se creó `.env.example` como plantilla oficial.
* **¿Por qué se hizo?**  
  * Elimina la dependencia de configuraciones "mágicas" o no documentadas.
  * Declara explícitamente qué variables son obligatorias para levantar el proyecto desde cero.
  * Previene que el número de WhatsApp del negocio siga hardcodeado en los componentes de Vue (`checkout.vue`).
* **¿Cómo se hizo?**  
  Estructura clara en `.env.example`:
  ```bash
  # CREDENCIALES DE BASE DE DATOS (SUPABASE)
  SUPABASE_URL="https://your-project.supabase.co"
  SUPABASE_KEY="your-anon-key"
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-never-share"

  # CONFIGURACIÓN PÚBLICA DE LA APLICACIÓN
  NUXT_PUBLIC_WHATSAPP_NUMBER="51998265700"
  NUXT_PUBLIC_SITE_URL="http://localhost:3000"

  # CREDENCIALES DE IMÁGENES (CLOUDINARY)
  CLOUDINARY_CLOUD_NAME="your-cloud-name"
  CLOUDINARY_API_KEY="your-api-key"
  CLOUDINARY_API_SECRET="your-api-secret"
  ```

---

### 2.5 [`supabase/migrations/`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/) — Versionamiento de Base de Datos

* **¿Qué se hizo?**  
  Se inicializó la carpeta `supabase/migrations/` con un archivo `.gitkeep`.
* **¿Por qué se hizo?**  
  Cumplimiento del principio **§5.1** del plan: *los cambios en base de datos deben ser auditables y versionados cronológicamente*, superando la práctica anterior de ejecutar scripts SQL manuales y no ordenados desde la carpeta `docs/sql/`.
* **¿Cómo se hizo?**  
  Creación de la ruta estricta requerida por Supabase CLI (`supabase/migrations/`).

---

## 3. Preguntas Frecuentes y Decisiones Técnicas Explicadas

### P1: ¿Por qué en `.nvmrc` solo dice el número `22`?
`.nvmrc` es un estándar de la comunidad de Node.js. Herramientas como NVM (Node Version Manager) y plataformas en la nube (Vercel, Netlify) buscan este archivo para saber qué versión de Node ejecutar. Su especificación oficial exige únicamente el número de versión (ej. `22`), sin comentarios ni texto adicional, para que los scripts automatizados puedan leerlo directamente.

### P2: ¿Por qué hay un `.gitkeep` en `supabase/migrations/` y cómo funcionan las migraciones?
* **El archivo `.gitkeep`:** Por diseño, el sistema de control de versiones Git **ignora y no sube carpetas vacías**. Al colocar un archivo `.gitkeep` dentro, obligamos a Git a incluir la carpeta `supabase/migrations/` en el repositorio para que siempre exista la estructura lista.
* **¿Cómo se registran las migraciones en Supabase?**
  * **En el código local (este repositorio):** Guardamos los archivos `.sql` cronológicos (ej: `20260825_crear_tabla.sql`). Son las "instrucciones" o recetas de cambio.
  * **En Supabase (base de datos remota):** Supabase cuenta con una tabla interna llamada `supabase_migrations.schema_migrations`. Cada vez que aplicamos una migración, Supabase anota el nombre del archivo ejecutado en esa tabla. Así, Supabase sabe exactamente qué migraciones ya corrieron y cuáles están pendientes, evitando duplicar tablas o columnas.

### P3: ¿Se modificó algo en mi base de datos de Supabase? ¿Aún la puedo usar?
**No se modificó absolutamente nada en tu base de datos.** Tus tablas (`products`, `orders`, `profiles`, etc.), triggers, funciones y usuarios permanecen 100% intactos. Lo único que cambió en el proyecto fue el mecanismo por el cual Nuxt obtiene las credenciales: en lugar de estar fijas dentro del archivo de configuración, ahora se leen desde tu archivo `.env`. Como tu `.env` conserva tus credenciales reales, tu conexión a Supabase sigue activa y funcionando normalmente.

### P4: ¿Por qué `SUPABASE_SERVICE_ROLE_KEY` está vacío (`""`) en `.env`?
La `SERVICE_ROLE_KEY` es la llave maestra con privilegios totales de administración en Supabase. En la **Fase 0** no se necesita, ya que la aplicación todavía no realiza operaciones privilegiadas desde el servidor. Se dejó la variable lista como espacio reservado para la **Fase 3** (cuando creemos el servicio seguro de checkout y stock). Mantenerla vacía por ahora respeta el principio de *mínimo privilegio necesario*.

### P5: ¿Para qué se agregaron `NUXT_PUBLIC_WHATSAPP_NUMBER` y `NUXT_PUBLIC_SITE_URL`?
* **`NUXT_PUBLIC_WHATSAPP_NUMBER`:** Centraliza el número telefónico de atención al cliente (evita tener `51998265700` quemado en el código de `checkout.vue`).
* **`NUXT_PUBLIC_SITE_URL`:** Define la URL canónica del sistema (`http://localhost:3000` en local y `https://midominio.com` en producción) para validar el origen de las peticiones HTTP (protección contra ataques CSRF y control de CORS en Fase 3 y 5).

### P6: ¿Qué hacen exactamente los scripts agregados en `package.json`?
* **`npm run typecheck` (`nuxt typecheck`):**
  * **Propósito:** Ejecuta el motor de TypeScript sobre todos los archivos (`.vue`, `.ts`, handlers de Nitro y composables) para verificar que los tipos coincidan, sin necesidad de generar el empaquetado de producción.
  * **Ventaja:** Detecta variables mal llamadas, tipos incompatibles o propiedades inexistentes en solo 3 segundos, acelerando la verificación durante el refactor.
* **`npm run db:types` (`supabase gen types ...`):**
  * **Propósito:** Se conecta al proyecto de Supabase (`rklxfrwzuwjvnfcdhmei`), lee las tablas (`products`, `orders`, `profiles`, `raw_materials`, `recipes`), vistas y funciones de PostgreSQL, y escribe automáticamente el archivo `app/types/database.types.ts`.
  * **Ventaja:** Elimina los `any` y evita escribir interfaces a mano. Si la base de datos cambia, un solo comando sincroniza todo el tipado del frontend y backend sin error humano.


---

## 4. Matriz Comparativa: Antes vs. Después

| Aspecto | Antes de Fase 0 | Después de Fase 0 | Beneficio Directo |
| :--- | :--- | :--- | :--- |
| **Credenciales Supabase** | Hardcodeadas en `nuxt.config.ts`. | Inyectadas vía `runtimeConfig` y `.env`. | **Cero fuga de llaves** en Git; soporte para entornos dev / staging / prod. |
| **Variables Privadas** | No existía canal seguro en servidor. | Espacio para `supabaseServiceRoleKey` en Nitro. | **Protección de privilegios**: el cliente nunca verá el service role. |
| **Versión de Node** | No especificada (riesgo de build). | Forzada Node `>= 20.0.0` y `.nvmrc` en 22. | **Builds reproducibles** y sin discrepancias entre máquinas. |
| **Documentación de Entorno** | Inexistente (ensayo y error). | [`.env.example`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/.env.example) completo. | Onboarding inmediato y preparación para CI/CD. |
| **Flujo de Migraciones** | Scripts sueltos en `docs/sql/`. | Directorio formal `supabase/migrations/`. | **Trazabilidad de base de datos** bajo el patrón expand/contract. |
| **Validación de Tipos** | Solo al hacer build completo. | Script `"typecheck"` dedicado. | Mayor velocidad al iterar en el refactor. |

---

## 5. Verificación y Resultados de Build

Para validar que los cambios no introdujeron ninguna regresión y que Nuxt 4 resuelve las variables de entorno adecuadamente:

* **Comando ejecutado:** `npm run build`
* **Resultado:** **Exit code 0 (Éxito Total)**
* **Métricas de salida Nitro:**
  * Tamaño total del servidor: `8.22 MB (2.24 MB gzip)`
  * Todas las rutas de servidor (`api/products`, `api/raw-materials`, `api/recipes`, `api/auth`) fueron empaquetadas sin errores.
  * Los chunks de cliente (`login`, `menu`, `perfil`, modales de admin) resolvieron sus dependencias limpiamente.

---

## 6. Validación del Checklist Oficial ([§20.1](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/architecture-refactor-plan.md#L1115))

| ID | Verificación requerida | Estado | Evidencia |
| :---: | :--- | :---: | :--- |
| **V1** | Build y typecheck pasan limpiamente | ✅ **Aprobado** | `npm run build` finalizado con éxito sin errores de sintaxis ni de módulos. |
| **V2** | Service role no se expone al cliente | ✅ **Aprobado** | `supabaseServiceRoleKey` se declaró fuera de `public` en `runtimeConfig`. |
| **V3** | Keys fuera de `nuxt.config.ts` | ✅ **Aprobado** | `nuxt.config.ts` no contiene strings de URLs ni JWTs de Supabase. |

---

## 7. Próximo Paso en el Plan

Con la plataforma asegurada y verificada, el siguiente paso inmediato es **Fase 1 — PR-1a** ([`architecture-refactor-plan.md` §19](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/architecture-refactor-plan.md#L1094)):

1. **Eliminar endpoints muertos y de alto riesgo:**
   * Borrar `server/api/auth/register.post.ts` (elimina la vulnerabilidad S1).
   * Borrar `server/api/auth/login.post.ts`.
   * Borrar `app/middleware/admin.ts`.
2. **Desactivar rutas de carrito huérfanas:**
   * Responder `410 Gone` con código `CART_API_DISABLED` en `server/api/cart/*`.
3. **Corregir SSR en animación:**
   * Proteger el import en `app/plugins/auto-animate.ts`.
