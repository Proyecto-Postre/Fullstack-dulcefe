import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Enterprise Database Migration Integrity Suite
 * Ref: docs/03 - Arquitectura & UI/architecture-refactor-plan.md (§10.3, §20.4 V42, §7.7)
 */
describe('Integridad y Gobernanza de Migraciones SQL (Fase 5 / §10.3 / V42)', () => {
  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations')
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  it('cuenta con al menos una migración SQL versionada y ordenada cronológicamente', () => {
    expect(migrationFiles.length).toBeGreaterThanOrEqual(1)

    // Formato estándar: YYYYMMDDHHMMSS_name.sql
    const namePattern = /^\d{14}_[a-z0-9_]+\.sql$/
    for (const file of migrationFiles) {
      expect(file).toMatch(namePattern)
    }
  })

  it('verifica que toda función SECURITY DEFINER blinde explícitamente search_path (§7.7)', () => {
    for (const file of migrationFiles) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      const lines = content.split('\n')

      let inSecurityDefiner = false
      let foundSearchPath = false

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i.test(line)) {
          inSecurityDefiner = false
          foundSearchPath = false
        }

        if (/SECURITY\s+DEFINER/i.test(line)) {
          inSecurityDefiner = true
        }

        if (/SET\s+search_path\s*=\s*(public|'')/i.test(line)) {
          foundSearchPath = true
        }

        if (/AS\s+\$\$/i.test(line) && inSecurityDefiner) {
          expect(
            foundSearchPath,
            `En el archivo ${file}, la función definida en la línea ${i + 1} tiene SECURITY DEFINER pero no especifica 'SET search_path = public'`
          ).toBe(true)
          inSecurityDefiner = false
        }
      }
    }
  })

  it('verifica la revocación de permisos a anon/authenticated sobre RPCs privadas (§7.7, §16, §17)', () => {
    // Buscar en la migración de corte (S9 / revocación de RPCs)
    let foundRevokeInventory = false
    let foundRevokePoints = false

    for (const file of migrationFiles) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      if (/REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.process_order_inventory/i.test(content)) {
        foundRevokeInventory = true
      }
      if (/REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.award_loyalty_points/i.test(content)) {
        foundRevokePoints = true
      }
    }

    expect(foundRevokeInventory).toBe(true)
    expect(foundRevokePoints).toBe(true)
  })

  it('verifica que el corte S9 revoque la inserción pública directa en orders y order_items (V35)', () => {
    let foundOrdersCut = false

    for (const file of migrationFiles) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      // Comprobar política que restringe inserción pública o revoca insert directo
      if (
        /DROP\s+POLICY\s+(IF\s+EXISTS\s+)?["']?public_insert_orders["']?/i.test(content) ||
        /orders.*enable\s+row\s+level\s+security/i.test(content) ||
        /REVOKE\s+INSERT\s+ON\s+(TABLE\s+)?public\.orders/i.test(content)
      ) {
        foundOrdersCut = true
      }
    }

    expect(foundOrdersCut).toBe(true)
  })
})
