# Lista Maestra de Revisión por Feature (Checklist de Gobernanza §10.6)

**Versión:** 1.0.0  
**Ámbito:** Todo cambio de código, nueva funcionalidad o refactorización en `fullstack_dulcefe`.  
**Referencia SSOT:** `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§10.6, §20)

Esta lista condensa las 6 dimensiones obligatorias que todo ingeniero debe verificar antes de someter un cambio a revisión o fusionar a `dev`.

---

| Dimensión | Requisito Obligatorio | Verificación Automatizada |
| :--- | :--- | :--- |
| **1. Dominio** | Respetar las fronteras modulares de §6.2 y §8.1. La UI no llama directamente a Supabase para mutar catálogo, órdenes, materiales o recetas. | `tests/architecture/architectural-boundaries.test.ts` |
| **2. Tipo** | Tipado estricto en TypeScript. Prohibición absoluta de `any` nuevo. Importes monetarios en céntimos enteros en backend y strings con 2 decimales en HTTP. | `npm run lint` (`@typescript-eslint/no-explicit-any`) y `npm run typecheck` |
| **3. Validación** | Esquema Zod en el handler de servidor. Formatos de teléfono Perú (`9xxxxxxxx`), límites de tamaño de body, saneamiento de notas sin PII embebida. | Tests de esquema Zod en `tests/unit/checkout-validation.test.ts` |
| **4. Permiso** | Autorización real vía `require-user` o `require-admin` leyendo `profiles.is_admin` en PostgreSQL. Prohibido confiar en `user_metadata.is_admin`. RLS activo en toda tabla. | `tests/api/auth-guards.test.ts` |
| **5. Prueba** | Cobertura unitaria y de integración para casos de éxito y caminos de error (400, 401, 403, 409). Verificación de no regresión. | `npm test` (122 tests pasando) |
| **6. SQL** | Toda mutación de esquema reside en `supabase/migrations/` con timestamp secuencial. `SECURITY DEFINER` con `search_path = public`. Sincronización contractual con `db:types`. | `tests/architecture/sql-migrations.test.ts` y `tests/architecture/type-drift-gate.test.ts` |
