-- ==========================================
-- DULCE FE - LOYALTY POINTS RPC
-- ==========================================

-- 1. Añadir columna points_awarded a la tabla orders si no existe
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS points_awarded BOOLEAN DEFAULT FALSE;

-- 2. Crear función RPC para otorgar puntos
CREATE OR REPLACE FUNCTION public.award_loyalty_points(order_uuid UUID)
RETURNS void AS $$
DECLARE
    v_order RECORD;
    v_points_to_award INTEGER;
BEGIN
    -- Obtener el pedido y verificar si ya se otorgaron puntos
    SELECT id, profile_id, total_amount, points_awarded 
    INTO v_order
    FROM public.orders 
    WHERE id = order_uuid;

    -- Si el pedido no existe o ya se otorgaron puntos, salir
    IF v_order.id IS NULL OR v_order.points_awarded = TRUE THEN
        RETURN;
    END IF;

    -- Calcular puntos (1 punto por cada 1 Sol gastado, redondeado hacia abajo)
    v_points_to_award := FLOOR(v_order.total_amount);

    -- Si hay puntos para otorgar y el usuario existe
    IF v_points_to_award > 0 AND v_order.profile_id IS NOT NULL THEN
        -- Sumar puntos al perfil del usuario
        UPDATE public.profiles
        SET loyalty_points = COALESCE(loyalty_points, 0) + v_points_to_award,
            updated_at = NOW()
        WHERE id = v_order.profile_id;

        -- Marcar el pedido como que ya otorgó puntos
        UPDATE public.orders
        SET points_awarded = TRUE
        WHERE id = order_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
