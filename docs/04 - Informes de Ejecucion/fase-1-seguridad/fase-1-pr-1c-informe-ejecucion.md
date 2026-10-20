# Informe Didáctico y Técnico — Fase 1 (PR-1c): Seguridad en Store Pinia y Migración RLS en Base de Datos

**Estado:** ✅ Completado y Verificado  
**Fecha:** 26 de Agosto, 2026  
**Documento de referencia:** [[architecture-refactor-plan]] (§5 S4, S5, S10, S12, §10 Tareas 6-7, §12.3, §19 PR-1c, §20.1 V8, V9 y V10)  
**Rama activa:** `feat/fase-01-restructuration_proyect`  
**Entrega:** PR-1c (Seguridad Frontend Pinia + Migración SQL RLS en PostgreSQL)

---

## 1. ¿Qué es este PR-1c y por qué es tan crucial?

Imagina un banco que tiene guardias de seguridad en la puerta de entrada (nuestros guards del PR-1b en el servidor). Eso está muy bien, pero ¿qué pasaría si un cliente astuto lograra entrar al banco por una ventana trasera (el cliente Supabase directo en el navegador) o si engañara a los empleados mostrando una identificación falsa hecha en casa (un token JWT adulterado en el navegador)?

**Eso era exactamente lo que ocurría antes de este PR:**
1. **En el Frontend (Store de Pinia):** Si alguien cambiaba los metadatos de su token (`user_metadata.is_admin`), la página web le creía ciegamente y le mostraba todos los botones y menús de administrador.
2. **En la Base de Datos (PostgreSQL):** Las reglas de seguridad (RLS) decían *"si el usuario inició sesión, déjalo tocar todo"*. Esto significaba que cualquier cliente registrado podía conectarse a la base de datos y leer los costos secretos de los insumos o alterar las recetas de pasteles.

**Con este PR-1c cerramos definitivamente las vulnerabilidades S4, S5, S10 y S12**, garantizando una seguridad blindada tanto en la pantalla del usuario como en el corazón de la base de datos.

---

## 2. Detalle de Cambios por Archivo (Qué, Por qué y Cómo)

---

### 2.1 [`app/stores/auth.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/stores/auth.ts) [BLINDAJE] — Cierre de Vulnerabilidad S5 y Cero `any`

* **¿Qué problema tenía este archivo?**  
  El cálculo de `isAdmin` contenía fallbacks inseguros que confiaban en metadatos del token enviados desde el cliente (`user.value?.user_metadata?.is_admin` o `user.value?.app_metadata?.is_admin`). Además, utilizaba tipos `any` que debilitaban la robustez del código.
* **¿Cómo se solucionó?**  
  1. Se reescribió `isAdmin` para que dependa **exclusiva y estrictamente del valor `is_admin === true` registrado en la tabla `profiles` de la base de datos**:
     ```typescript
     // 🔒 CIERRE DE VULNERABILIDAD S5:
     const isAdmin = computed<boolean>(() => {
       if (!user.value || !profile.value) return false
       return profile.value.is_admin === true
     })
     ```
  2. Se importaron los tipos oficiales `User` de `@supabase/supabase-js` y `Database` de `~/types/database.types`.
  3. Se eliminaron todos los `any`, tipando fuertemente las direcciones (`UserAddress`), entradas (`SaveAddressInput`) y resultados de operaciones (`AddressOperationResult`).

---

### 2.2 [`supabase/migrations/20260826000001_phase1_security_rls.sql`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/20260826000001_phase1_security_rls.sql) [NUEVO] — Migración SQL Versionada de RLS

* **¿Qué es este archivo?**  
  La primera migración SQL oficial versionada del proyecto. Define todas las reglas de acceso a nivel de fila (Row Level Security - RLS) en PostgreSQL y repara las funciones de base de datos.
* **¿Qué vulnerabilidades cierra?**
  * **Cierre S10 (Search Path Hijacking):** Las funciones con privilegios elevados (`is_admin()` y `handle_new_user()`) ahora incluyen `SECURITY DEFINER SET search_path = public, pg_temp;`. Esto impide que un atacante inyecte esquemas maliciosos para engañar a Postgres.
  * **Cierre S4 (RLS permisivo):** Se eliminaron todas las políticas previas que usaban `auth.role() = 'authenticated'`.
* **Políticas Formales Instaladas:**
  * **`products`:** Lectura (`SELECT`) 100% pública para clientes de la tienda (`USING (true)`). Mutaciones (`INSERT`, `UPDATE`, `DELETE`) reservadas exclusivamente para `public.is_admin() = true`.
  * **`raw_materials`:** Confidencialidad total (`FOR ALL USING (public.is_admin() = true)`). Los clientes nunca pueden ver los costos de los insumos.
  * **`recipe_items`:** Confidencialidad total (`FOR ALL USING (public.is_admin() = true)`). Las recetas de cocina están protegidas contra espionaje.
  * **`profiles`:** Los usuarios solo leen y editan su propio perfil (`auth.uid() = id`), mientras que el administrador puede ver y gestionar todos.
  * **`addresses` / `orders` / `order_items`:** Aislamiento estricto por cliente (`auth.uid() = profile_id`), permitiendo al administrador el control total de pedidos.

---

### 2.3 [[sql/README]] [NUEVO] — Gobernanza SQL (Cierre S12)

* **¿Qué problema existía?**  
  Había 8 archivos `.sql` sueltos en `docs/sql/` ejecutados manualmente sin trazabilidad ni orden de precedencia.
* **¿Cómo se solucionó?**  
  Se creó el archivo de gobernanza marcando `docs/sql/` como **directorio histórico/obsoleto** y estableciendo formalmente que [`supabase/migrations/`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/) es la **Única Fuente de Verdad (SSOT)**.

---

## 3. Conceptos Explicados para Principiantes

### P1: ¿Qué es RLS (Row Level Security)?
Imagina que la base de datos es un archivador con miles de carpetas. Sin RLS, cualquiera que tenga la llave de la oficina puede abrir todas las carpetas. Con **RLS activado**, cada fila de la tabla tiene un candado digital invisible: Postgres revisa automáticamente quién eres (`auth.uid()`) antes de mostrarte una sola fila. Si no eres el dueño o el admin, Postgres responde como si la fila no existiera.

### P2: ¿Por qué `SET search_path = public, pg_temp` es tan importante?
Cuando una función corre como `SECURITY DEFINER`, adquiere permisos de superusuario. Si no fijas el camino de búsqueda (`search_path`), un atacante podría crear una tabla falsa con el mismo nombre en otro esquema para engañar a la función. Al fijarlo en `public, pg_temp`, obligas a PostgreSQL a buscar únicamente en los lugares seguros.

---

## 4. Validación del Checklist Oficial ([[§20.1]])

| ID | Verificación requerida | Estado | Evidencia |
| :---: | :--- | :---: | :--- |
| **V8** | Petición anónima directa a Supabase DB en `raw_materials` o `recipe_items` | ✅ **Aprobado** | La política RLS `raw_materials_all_admin` deniega el acceso a usuarios anónimos (retorna 0 filas). |
| **V9** | Petición de cliente autenticado no-admin a Supabase DB en `raw_materials` | ✅ **Aprobado** | `public.is_admin()` evalúa `false` y RLS bloquea la lectura directa desde consola o cliente JS. |
| **V10** | Token adulterado con `user_metadata.role = 'ADMIN'` en cliente | ✅ **Aprobado** | `useAuthStore().isAdmin` evalúa estrictamente `profile.value?.is_admin === true` en PostgreSQL, impidiendo la elevación de privilegios en la UI. |

---

## 5. Próximo Paso en el Plan Maestro: Fase 1 — PR-1d ([[§19]])

Con las tres capas de seguridad completadas (Nitro guards, Pinia store y PostgreSQL RLS), el siguiente subpaso de la Fase 1 es:
1. **Upload seguro de imágenes (`server/api/products/upload.post.ts` — Cierre S7 y S8):** Validación rigurosa de Magic Bytes en cabeceras de imagen, límite de tamaño a 5MB y sanitización de nombres de archivo.
2. **Generación formal de tipos de base de datos (`npm run db:types`):** Script automatizado para regenerar `database.types.ts` desde el CLI de Supabase.
