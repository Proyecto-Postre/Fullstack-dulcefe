# Informe de Ejecución: Aislamiento de Entornos (Dev / Prod) y Erradicación de Secretos Hardcodeados

**Fecha:** 2026-10-06  
**Rama:** `fix/remove-hardcoded-secrets-and-dev-init`  
**Estado:** ✅ Completado y Verificado (248/248 Tests OK, Build OK)  
**Autor:** Antigravity & Equipo Dulce Fe  

---

## 1. Contexto y Diagnóstico del Problema

### 1.1. Incidente Inicial: Riesgo de Base de Datos Compartida
* **Situación:** La aplicación utilizaba una única base de datos Supabase (`rklxfrwzuwjvnfcdhmei`) compartida tanto para desarrollo local (`npm run dev`) como para producción.
* **Impacto:** Cualquier prueba local, reseteo de inventario, eliminación de pedidos o ajuste de recetas impactaba directamente en los datos de clientes reales de producción.

### 1.2. Descubrimiento de Fuga de Credenciales (Vulnerabilidad Crítica)
* **Hallazgo:** En `nuxt.config.ts`, las credenciales de producción (`SUPABASE_URL`, `SUPABASE_KEY` y `SUPABASE_SERVICE_ROLE_KEY`) estaban hardcodeadas en texto plano como valores por defecto (`fallback` con operador `||`).
* **Riesgo:** 
  1. Si en cualquier entorno faltaba una variable, la aplicación se conectaba silenciosamente a **Producción**, arriesgando integridad de datos.
  2. Las credenciales privadas y claves maestras estaban expuestas en el historial y archivos de código fuente.

---

## 2. Dificultades Técnicas y Errores Encontrados Durante la Ejecución

### 2.1. Error PostgreSQL `42P01: la relación "public.profiles" no existe`
* **Causa:** Al consolidar el script de inicialización para la nueva base de datos de desarrollo (`dulcefe-dev`), la función `public.is_admin()` estaba ubicada al inicio del archivo (línea 7). Al ser una función declarada con `LANGUAGE sql`, PostgreSQL valida la existencia de tablas al momento de la compilación/creación de la función. Dado que la tabla `public.profiles` se creaba más abajo (línea 77), la ejecución fallaba con error de relación inexistente.
* **Solución aplicada:** Se reestructuró el orden topológico de dependencias en `supabase/init_dev_database.sql`:
  1. Tablas principales y tablas de motor de tandas (Fase 7).
  2. Funciones de negocio y seguridad (`is_admin()`, triggers).
  3. Políticas RLS y Storage Buckets.
  4. Seed data inicial.

### 2.2. Corrupción Visual y Sintáctica por Traductor del Navegador
* **Causa:** El navegador web (Google Chrome / Edge) tenía activa la extensión de traducción automática en la pestaña de Supabase SQL Editor y Vercel. Esto tradujo palabras clave de PostgreSQL a español:
  * `DROP POLICY IF EXISTS` $\rightarrow$ `POLÍTICA DE GOTA SI EXISTE`
  * `SELECT` $\rightarrow$ `SELECCIONAR`
  * `WHERE` $\rightarrow$ `DONDE`
  * `AND` $\rightarrow$ `Y`
* **Solución aplicada:** Desactivación de traducción automática en dominios de infraestructura (`supabase.com`, `vercel.com`) y recarga limpia del editor.

### 2.3. Confusión entre Supabase Edge Functions Secrets y Vercel Environment Variables
* **Causa:** En Supabase existe una pantalla *Edge Functions > Secrets* que solo aplica para código Deno serverless ejecutado dentro de Supabase. El frontend/backend Nuxt corre en Vercel, por lo que las variables debían residir en Vercel.
* **Solución aplicada:** Configuración centralizada de las variables en **Vercel > Settings > Environment Variables** para el entorno `Production`.

### 2.4. Confusión de Claves (DEV vs PROD en Vercel)
* **Causa:** Durante la configuración en Vercel, se intentó pegar la clave del nuevo proyecto de DEV (`vsqm...`).
* **Solución preventiva:** Se verificaron los JWT decodificados para asegurar que en Vercel (`Production`) únicamente se carguen las credenciales con `ref: rklxfrwzuwjvnfcdhmei` y que el archivo local `.env` utilice las credenciales con `ref: vsqmstoiexuqndunorio`.

---

## 3. Acciones Técnicas Ejecutadas

### 3.1. Código Fuente (`nuxt.config.ts`)
* Se removieron todos los tokens JWT y URLs hardcodeadas.
* Ahora `runtimeConfig` y el módulo `@nuxtjs/supabase` leen estrictamente de `process.env.*` sin secretos como fallback.

### 3.2. Script Consolidado de Desarrollo (`supabase/init_dev_database.sql`)
* Se creó un script idempotente completo que incluye:
  * 15 tablas del ecosistema (categorías, productos, materias primas, pedidos, perfiles, tandas, mermas, idempotencia, auditoría).
  * Funciones de cálculo de inventario y puntos con blindaje `search_path`.
  * Triggers de `cart_items` y `auth.users`.
  * Habilitación de RLS estricto y políticas de acceso.
  * Configuración de bucket `payment-receipts`.
  * Datos semilla de empaques iniciales.

### 3.3. Certificación de Calidad y Cero Regresiones
* **Vitest Suite:** 37 suites ejecutadas, **248/248 tests aprobados**.
* **Typecheck Nuxt:** 0 errores de TypeScript.
* **Build de Producción Nitro (`npm run build`):** Compilación completa y exitosa sin advertencias bloqueantes.

---

## 4. Matriz de Entornos Actualizada

| Componente | Desarrollo Local (`npm run dev`) | Producción (`dulcefe.vercel.app`) |
| :--- | :--- | :--- |
| **Hosting / Runtime** | Máquina Local / Node.js 20 | Vercel Serverless / Edge |
| **Instancia Supabase** | `vsqmstoiexuqndunorio.supabase.co` (`dulcefe-dev`) | `rklxfrwzuwjvnfcdhmei.supabase.co` (`dulcefe-prod`) |
| **Origen de Variables** | Archivo local `.env` (ignorado en git) | Vercel Project Settings (Cifradas) |
| **Acceso a Producción** | Bloqueado desde local | Protegido con Service Role Key en Vercel |

---

## 5. Reglas Preventivas para el Futuro (Post-Mortem Guidelines)

1. **Nunca escribir valores por defecto con credenciales reales:** Usar siempre `process.env.VARIABLE || ''`. Si una variable es obligatoria, fallar en tiempo de inicialización o advertir, pero jamás recurrir a claves de producción.
2. **Orden estricto en DDL SQL:** Las tablas maestras deben declararse siempre antes de funciones `LANGUAGE sql` que las consulten.
3. **Desactivar traductores automáticos:** En herramientas de desarrollo web (Supabase, Vercel, AWS, GCP), la traducción del navegador debe estar deshabilitada permanentemente.
4. **Verificación de token antes de guardar:** Al manejar múltiples proyectos en Supabase, verificar el campo `ref` del JWT para evitar mezclar credenciales de desarrollo y producción.
