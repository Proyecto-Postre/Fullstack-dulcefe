-- ============================================================================
-- MIGRACIÓN DE SEGURIDAD FASE 1 (PR-1c): RLS Y FUNCIONES BLINDADAS
-- Fecha: 2026-08-26
-- Cierra: Vulnerabilidades S4 (RLS permisivo), S10 (search_path) y S12 (Gobernanza)
-- ============================================================================

-- 1. BLINDAJE DE FUNCIONES SECURITY DEFINER (Cierre S10)
-- Se fija explícitamente 'search_path = public, pg_temp' para prevenir secuestro de resolución.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, is_admin)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    false -- Todo nuevo usuario SIEMPRE se inicializa como cliente regular
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS PÚBLICAS
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.addresses ENABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR POLÍTICAS OBSOLETAS O INSEGURAS PREVIAS (Cierre S4)
DROP POLICY IF EXISTS "Lectura publica de productos" ON public.products;
DROP POLICY IF EXISTS "Solo admins pueden insertar productos" ON public.products;
DROP POLICY IF EXISTS "Solo admins pueden actualizar productos" ON public.products;
DROP POLICY IF EXISTS "Solo admins pueden eliminar productos" ON public.products;
DROP POLICY IF EXISTS "Permitir lectura publica de productos" ON public.products;
DROP POLICY IF EXISTS "Permitir mutacion solo a administradores" ON public.products;

DROP POLICY IF EXISTS "Solo admins pueden ver insumos" ON public.raw_materials;
DROP POLICY IF EXISTS "Solo admins pueden insertar insumos" ON public.raw_materials;
DROP POLICY IF EXISTS "Solo admins pueden actualizar insumos" ON public.raw_materials;
DROP POLICY IF EXISTS "Solo admins pueden eliminar insumos" ON public.raw_materials;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en raw_materials" ON public.raw_materials;

DROP POLICY IF EXISTS "Solo admins pueden ver recetas" ON public.recipe_items;
DROP POLICY IF EXISTS "Solo admins pueden insertar recetas" ON public.recipe_items;
DROP POLICY IF EXISTS "Solo admins pueden actualizar recetas" ON public.recipe_items;
DROP POLICY IF EXISTS "Solo admins pueden eliminar recetas" ON public.recipe_items;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en recipe_items" ON public.recipe_items;

DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admin puede ver todos los perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin puede actualizar todos los perfiles" ON public.profiles;

-- 4. POLÍTICAS FORMALES DE ACCESO (DEFENSA EN PROFUNDIDAD)

-- A) TABLA PRODUCTS (Catálogo: Lectura pública, Modificación solo Administrador)
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "products_insert_admin"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin() = true);

CREATE POLICY "products_update_admin"
  ON public.products FOR UPDATE
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

CREATE POLICY "products_delete_admin"
  ON public.products FOR DELETE
  USING (public.is_admin() = true);

-- B) TABLA RAW_MATERIALS (Almacén: Solo Administrador)
CREATE POLICY "raw_materials_all_admin"
  ON public.raw_materials FOR ALL
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

-- C) TABLA RECIPE_ITEMS (Recetas y Escandallos: Solo Administrador)
CREATE POLICY "recipe_items_all_admin"
  ON public.recipe_items FOR ALL
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

-- D) TABLA PROFILES (Aislamiento de Perfiles)
CREATE POLICY "profiles_select_self_or_admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin() = true);

CREATE POLICY "profiles_update_self_or_admin"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin() = true)
  WITH CHECK (
    (auth.uid() = id AND is_admin IS NOT DISTINCT FROM (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()))
    OR public.is_admin() = true
  );

-- E) TABLA ADDRESSES (Direcciones privadas de clientes)
CREATE POLICY "addresses_all_owner_or_admin"
  ON public.addresses FOR ALL
  USING (auth.uid() = profile_id OR public.is_admin() = true)
  WITH CHECK (auth.uid() = profile_id OR public.is_admin() = true);

-- F) TABLAS ORDERS Y ORDER_ITEMS (Historial de Pedidos)
CREATE POLICY "orders_select_owner_or_admin"
  ON public.orders FOR SELECT
  USING (auth.uid() = profile_id OR public.is_admin() = true);

CREATE POLICY "orders_insert_owner_or_admin"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = profile_id OR public.is_admin() = true);

CREATE POLICY "orders_update_admin"
  ON public.orders FOR UPDATE
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

CREATE POLICY "order_items_select_owner_or_admin"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (o.profile_id = auth.uid() OR public.is_admin() = true)
    )
  );

CREATE POLICY "order_items_insert_owner_or_admin"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (o.profile_id = auth.uid() OR public.is_admin() = true)
    )
  );
