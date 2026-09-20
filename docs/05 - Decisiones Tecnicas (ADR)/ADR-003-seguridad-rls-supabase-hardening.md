---
tipo: adr
numero: 003
titulo: Seguridad Declarativa con PostgreSQL RLS y Blindaje de Funciones
fecha: 2026-08-26
estado: aceptado
relacionado:
  - "[[esquema-base-datos]]"
  - "[[fase-1-pr-1c-informe-ejecucion]]"
---

# 🏛️ ADR-003: Row Level Security (RLS) en Supabase & Blindaje `search_path`

## 1. Contexto & Problema
Al usar Supabase directamente con clientes web, si la seguridad solo se maneja en el frontend o en middlewares de Node, una fuga del API Key pública permite a cualquier usuario ejecutar consultas directas y alterar tablas financieras (`raw_materials`, `recipe_items`) o impersonar roles de administrador.

## 2. Decisión Tomada
1. **RLS Obligatorio:** Se activa `ENABLE ROW LEVEL SECURITY` en todas las tablas públicas.
2. **Defensa en Profundidad (Cierre S4):** 
   - `products`: Lectura pública (`SELECT`), mutaciones exclusivas para administradores (`is_admin() = true`).
   - `raw_materials` y `recipe_items`: Acceso 100% restringido solo para administradores.
3. **Blindaje de Funciones Security Definer (Cierre S10):**
   - Se fija explícitamente `SET search_path = public, pg_temp` en `is_admin()` y `handle_new_user()` para prevenir secuestro de resolución de esquemas.

## 3. Consecuencias
* **Impacto:** Aunque un atacante intente consultar la base de datos con el cliente JS público, PostgreSQL rechaza a nivel de motor cualquier acceso no autorizado.
