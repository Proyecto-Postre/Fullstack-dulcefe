-- Migración: Blindaje Definitivo de Funciones y search_path (Database Linter Compliance)
-- Resuelve advertencias 0011 (search_path mutable) y 0028/0029 (revocación de SECURITY DEFINER de PUBLIC)

-- 1. Fijar search_path inmutable en funciones existentes
ALTER FUNCTION public.update_cart_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.award_loyalty_points(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.process_order_inventory(uuid) SET search_path = public, pg_temp;

-- 2. Revocar privilegios de ejecución a PUBLIC, anon y authenticated en funciones privadas
REVOKE EXECUTE ON FUNCTION public.award_loyalty_points(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_order_inventory(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 3. Garantizar que únicamente el service_role (backend oficial) pueda ejecutar estas funciones
GRANT EXECUTE ON FUNCTION public.award_loyalty_points(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_order_inventory(uuid) TO service_role;
