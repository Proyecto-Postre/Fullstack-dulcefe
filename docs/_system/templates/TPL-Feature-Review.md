# Plantilla: Lista de Revisión de Feature (Definition of Done)

> **Referencia Arquitectónica:** `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§10.6)  
> **Uso:** Esta lista debe ser completada y anexada en todo Pull Request o revisión de diseño antes de fusionar código a `dev`.

---

## 📋 Control de Calidad por Feature

### 1. Dominio y Ubicación Arquitectónica (§6.2, §8.1)
- [ ] ¿El código se encuentra en su módulo correspondiente (`app/components/[dominio]`, `app/composables/[dominio]`, `server/api/[dominio]`, `server/services/[dominio].service.ts`)?
- [ ] ¿La UI de checkout o administración evita llamadas directas al cliente de Supabase para mutaciones?
- [ ] ¿Los componentes de presentación reciben props tipadas y emiten eventos sin ejecutar lógica de negocio ni manipulación de base de datos?

### 2. Tipado Estricto & Tipos de Base de Datos (§7.8, §20.4 V41)
- [ ] ¿Cero ocurrencias de `any` explícito nuevo (verificado con ESLint)?
- [ ] ¿Las entidades de base de datos reutilizan las interfaces generadas en `app/types/database.types.ts`?
- [ ] ¿Los importes monetarios (`total_amount`, `price_at_time`) se manejan en servidor como céntimos enteros y en DTOs HTTP como cadenas con dos decimales (`"42.50"`)?

### 3. Validación de Entrada HTTP (§7.7, §14)
- [ ] ¿Todo payload entrante es validado en el handler mediante un esquema Zod estricto?
- [ ] ¿Se validan límites de tamaño de body, longitudes máximas y formatos específicos (teléfono Perú de 9 dígitos, fechas ISO en timezone `America/Lima`)?
- [ ] ¿Las peticiones de checkout y mutaciones críticas incluyen clave de idempotencia (`X-Idempotency-Key` o campo `idempotency_key`)?

### 4. Permisos, Autorización y RLS (§7.7, §9.3)
- [ ] ¿Los endpoints administrativos utilizan `require-admin(event)` validando `profiles.is_admin = true` en base de datos (nunca confiando únicamente en JWT del cliente)?
- [ ] ¿Las operaciones de usuario registrado validan `require-user(event)`?
- [ ] ¿Las tablas de Supabase involucradas cuentan con políticas de RLS activas y coherentes con los servicios del servidor?
- [ ] ¿Las funciones PostgreSQL creadas/modificadas fijan `SECURITY DEFINER` con `SET search_path = public`?

### 5. Pruebas Automatizadas (§18, §20)
- [ ] ¿Se añadieron o actualizaron pruebas unitarias o de integración en `tests/` que cubran los nuevos caminos críticos y de error?
- [ ] ¿Se validaron los códigos de estado HTTP de error (400, 401, 403, 404, 409)?
- [ ] ¿Todos los tests del proyecto pasan exitosamente (`npm test`)?

### 6. Impacto en Base de Datos & SQL (§10.3, §17)
- [ ] ¿La feature requiere cambios de esquema DDL? Si no, marcar N/A.
- [ ] Si requiere cambios DDL, ¿se creó una migración versionada en `supabase/migrations/YYYYMMDDHHMMSS_*.sql`?
- [ ] ¿La migración fue ejecutada y probada localmente o en staging antes de ir a producción?
- [ ] ¿Se ejecutó `npm run db:types` y se verificó que no haya drift de tipos en Git?
