-- Migración: Reversión Atómica de Stock y Declaración de Mermas (Fase 6 / ADR-001 / D1)
-- Permite revertir stock o registrar mermas formalmente al cancelar un pedido procesado.

BEGIN;

-- 1. Función atómica de reversión y registro de mermas
CREATE OR REPLACE FUNCTION public.revert_order_inventory(
  p_order_id UUID,
  p_reason TEXT,
  p_restore_stock BOOLEAN,
  p_actor_id UUID DEFAULT NULL,
  p_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_movement RECORD;
  v_mat RECORD;
  v_stock_before NUMERIC;
  v_stock_after NUMERIC;
  v_restored_count INT := 0;
  v_consumed_qty NUMERIC;
BEGIN
  -- Validar existencia y bloquear fila para concurrencia
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  -- Iterar sobre los consumos previos generados por esta orden
  FOR v_movement IN 
    SELECT * FROM inventory_movements 
    WHERE order_id = p_order_id AND type = 'order_consumption'
  LOOP
    -- Obtener la cantidad consumida original (positiva)
    v_consumed_qty := ABS(v_movement.quantity_delta);

    -- Consultar el stock actual de la materia prima
    SELECT * INTO v_mat FROM raw_materials WHERE id = v_movement.raw_material_id FOR UPDATE;
    IF FOUND THEN
      v_stock_before := v_mat.stock;

      IF p_restore_stock THEN
        v_stock_after := v_stock_before + v_consumed_qty;

        -- Reponer físicamente los insumos al stock disponible
        UPDATE raw_materials 
        SET stock = v_stock_after 
        WHERE id = v_movement.raw_material_id;

        -- Registrar movimiento compensatorio auditable
        INSERT INTO inventory_movements (
          raw_material_id, 
          order_id, 
          type, 
          quantity_delta, 
          stock_before, 
          stock_after, 
          reason, 
          actor_id, 
          request_id
        ) VALUES (
          v_movement.raw_material_id, 
          p_order_id, 
          'cancellation_reversal', 
          v_consumed_qty, 
          v_stock_before, 
          v_stock_after, 
          COALESCE(p_reason, 'Reversión automática por cancelación de pedido'),
          p_actor_id,
          p_request_id
        );
      ELSE
        -- Registrar como merma/desperdicio de taller sin alterar stock físico
        v_stock_after := v_stock_before;

        INSERT INTO inventory_movements (
          raw_material_id, 
          order_id, 
          type, 
          quantity_delta, 
          stock_before, 
          stock_after, 
          reason, 
          actor_id, 
          request_id
        ) VALUES (
          v_movement.raw_material_id, 
          p_order_id, 
          'waste_declaration', 
          0, 
          v_stock_before, 
          v_stock_after, 
          COALESCE(p_reason, 'Insumos descartados por merma de pedido cancelado'),
          p_actor_id,
          p_request_id
        );
      END IF;

      v_restored_count := v_restored_count + 1;
    END IF;
  END LOOP;

  -- Actualizar bandera de inventario de la orden
  UPDATE orders 
  SET inventory_processed = false 
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'restored_stock', p_restore_stock,
    'items_affected', v_restored_count
  );
END;
$$;

-- 2. Blindaje de seguridad: Solo invocable vía Service Role en Nitro
REVOKE EXECUTE ON FUNCTION public.revert_order_inventory FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revert_order_inventory TO service_role;

COMMENT ON FUNCTION public.revert_order_inventory IS 'RPC atómica para compensación de stock o declaración de mermas ante cancelación de pedidos (ADR-001)';

COMMIT;
