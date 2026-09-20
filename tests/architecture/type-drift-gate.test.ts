import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { Database } from '../../app/types/database.types'

describe('Database Type Drift Gate (§5.3 / V42 / V50)', () => {
  const dbTypesPath = path.resolve(__dirname, '../../app/types/database.types.ts')

  it('1. database.types.ts debe existir y contener la cabecera contractual DO NOT EDIT (§5.3)', () => {
    expect(fs.existsSync(dbTypesPath), 'El archivo app/types/database.types.ts debe existir.').toBe(true)

    const content = fs.readFileSync(dbTypesPath, 'utf-8')
    expect(
      content.includes('DO NOT EDIT DIRECTLY'),
      'database.types.ts debe contener la cabecera "DO NOT EDIT DIRECTLY" para evitar drift manual.'
    ).toBe(true)
  })

  it('2. El esquema público de Database debe contener todas las tablas canónicas del monolito', () => {

    type ExpectedTables = [
      'orders',
      'order_items',
      'products',
      'raw_materials',
      'recipe_items',
      'checkout_idempotency_keys',
      'checkout_rate_windows',
      'audit_events',
      'inventory_movements',
      'profiles',
      'addresses'
    ]

    const content = fs.readFileSync(dbTypesPath, 'utf-8')

    const expectedTableNames: ExpectedTables = [
      'orders',
      'order_items',
      'products',
      'raw_materials',
      'recipe_items',
      'checkout_idempotency_keys',
      'checkout_rate_windows',
      'audit_events',
      'inventory_movements',
      'profiles',
      'addresses'
    ]

    for (const table of expectedTableNames) {
      expect(
        content.includes(`${table}: {`),
        `Drift detectado: La tabla '${table}' no está definida en database.types.ts`
      ).toBe(true)
    }
  })

  it('3. Verificar integridad de columnas esenciales en orders y order_items (S9 / §14 / §16)', () => {
    type OrderRow = Database['public']['Tables']['orders']['Row']
    type OrderItemRow = Database['public']['Tables']['order_items']['Row']

    // Validación estática de campos mediante asignación de tipo
    const testOrder: Partial<OrderRow> = {
      id: 'uuid-test',
      status: 'pending',
      total_amount: 42.50,
      customer_name: 'Cliente Test',
      customer_phone: '987654321',
      inventory_processed: false,
      points_awarded: false
    }
    expect(testOrder.id).toBe('uuid-test')

    const testOrderItem: Partial<OrderItemRow> = {
      order_id: 'uuid-test',
      product_id: 1,
      quantity: 2,
      price_at_time: 15.00
    }
    expect(testOrderItem.quantity).toBe(2)
  })

  it('4. Verificar integridad de tablas de idempotencia, inventario y auditoría (§16 / §17)', () => {
    type IdempotencyRow = Database['public']['Tables']['checkout_idempotency_keys']['Row']
    type InventoryMovementRow = Database['public']['Tables']['inventory_movements']['Row']
    type AuditEventRow = Database['public']['Tables']['audit_events']['Row']

    const testIdempotency: Partial<IdempotencyRow> = {
      key: 'key-test',
      lifecycle: 'completed',
      operation: 'checkout.create',
      request_hash: 'hash-test'
    }
    expect(testIdempotency.lifecycle).toBe('completed')

    const testMovement: Partial<InventoryMovementRow> = {
      type: 'order_consumption',
      quantity_delta: -500,
      stock_before: 1000,
      stock_after: 500
    }
    expect(testMovement.type).toBe('order_consumption')

    const testAudit: Partial<AuditEventRow> = {
      action: 'order.status',
      entity: 'orders',
      result: 'ok'
    }
    expect(testAudit.action).toBe('order.status')
  })
})
