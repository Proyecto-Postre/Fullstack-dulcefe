-- ============================================================================
-- FASE 3 (PR-3d): CORTE DE SEGURIDAD S9 Y REVOCACIÓN DE RPCS DE CLIENTE
-- ============================================================================
-- Descripción:
-- 1. Elimina las políticas de INSERT en 'orders' y 'order_items' para usuarios del navegador.
--    Toda orden ahora debe nacer a través del backend oficial Nitro (Service Role).
-- 2. Revoca permisos de ejecución directa de RPCs críticas a anon y authenticated.
-- ============================================================================

-- 1. Revocación de INSERT en 'orders' para clientes normales
DROP POLICY IF EXISTS "orders_insert_owner_or_admin" ON public.orders;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios pedidos" ON public.orders;

-- Solo administradores (o Service Role por omisión de RLS) pueden insertar directamente
CREATE POLICY "orders_insert_admin_only"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_admin() = true);

-- 2. Revocación de INSERT en 'order_items' para clientes normales
DROP POLICY IF EXISTS "order_items_insert_owner_or_admin" ON public.order_items;
DROP POLICY IF EXISTS "Usuarios pueden insertar items a sus pedidos" ON public.order_items;

CREATE POLICY "order_items_insert_admin_only"
  ON public.order_items FOR INSERT
  WITH CHECK (public.is_admin() = true);

-- 3. Revocar ejecución directa de funciones RPC a roles de navegador
DO $$
BEGIN
  -- Revocar process_order_inventory si existe
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'process_order_inventory'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.process_order_inventory(uuid) FROM anon, authenticated;';
  END IF;

  -- Revocar award_loyalty_points si existe
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'award_loyalty_points'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.award_loyalty_points(uuid) FROM anon, authenticated;';
  END IF;
END $$;
