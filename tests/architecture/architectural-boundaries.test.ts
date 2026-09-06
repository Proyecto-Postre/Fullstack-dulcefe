import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles
  const files = fs.readdirSync(dirPath)

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file)
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles)
    } else if (file.endsWith('.vue') || file.endsWith('.ts')) {
      arrayOfFiles.push(fullPath)
    }
  })

  return arrayOfFiles
}

describe('Architectural Boundaries Guard (§6.2, §10.4, V40)', () => {
  const rootAppDir = path.resolve(__dirname, '../../app')

  it('1. Checkout UI no debe importar ni instanciar el cliente de Supabase (S9 / §6.2)', () => {
    const checkoutFiles = [
      path.join(rootAppDir, 'pages/checkout.vue'),
      ...getAllFiles(path.join(rootAppDir, 'components/checkout'))
    ]

    for (const file of checkoutFiles) {
      if (!fs.existsSync(file)) continue
      const content = fs.readFileSync(file, 'utf-8')
      const relativePath = path.relative(rootAppDir, file)

      expect(
        content.includes('useSupabaseClient') || content.includes('#supabase'),
        `Violación §6.2: ${relativePath} no debe importar ni utilizar useSupabaseClient.`
      ).toBe(false)

      expect(
        content.includes('supabase.from('),
        `Violación §6.2: ${relativePath} no debe llamar directamente a supabase.from().`
      ).toBe(false)
    }
  })

  it('2. Admin UI no debe mutar tablas de Supabase directamente desde el cliente (§6.2)', () => {
    const adminFiles = [
      ...getAllFiles(path.join(rootAppDir, 'components/admin')),
      ...getAllFiles(path.join(rootAppDir, 'pages/admin')),
      ...getAllFiles(path.join(rootAppDir, 'composables/admin'))
    ]

    const prohibitedDirectMutations = [
      /\.from\s*\(\s*['"`]orders['"`]\s*\)\s*\.(insert|update|delete|upsert)/i,
      /\.from\s*\(\s*['"`]order_items['"`]\s*\)\s*\.(insert|update|delete|upsert)/i,
      /\.from\s*\(\s*['"`]products['"`]\s*\)\s*\.(insert|update|delete|upsert)/i,
      /\.from\s*\(\s*['"`]raw_materials['"`]\s*\)\s*\.(insert|update|delete|upsert)/i,
      /\.from\s*\(\s*['"`]recipe_items['"`]\s*\)\s*\.(insert|update|delete|upsert)/i
    ]

    for (const file of adminFiles) {
      if (!fs.existsSync(file)) continue
      const content = fs.readFileSync(file, 'utf-8')
      const relativePath = path.relative(rootAppDir, file)

      for (const pattern of prohibitedDirectMutations) {
        expect(
          pattern.test(content),
          `Violación §6.2: ${relativePath} intenta mutar la base de datos directamente vía Supabase cliente. Todas las mutaciones deben realizarse vía /api/admin/*.`
        ).toBe(false)
      }
    }
  })

  it('3. RPCs críticas de servidor nunca deben ser invocadas desde el navegador (§6.2)', () => {
    const allAppFiles = getAllFiles(rootAppDir)

    const prohibitedRPCs = [
      /rpc\s*\(\s*['"`]process_order_inventory['"`]\s*\)/i,
      /rpc\s*\(\s*['"`]award_loyalty_points['"`]\s*\)/i
    ]

    for (const file of allAppFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      const relativePath = path.relative(rootAppDir, file)

      for (const rpcPattern of prohibitedRPCs) {
        expect(
          rpcPattern.test(content),
          `Violación §6.2 / S9: ${relativePath} intenta llamar a una RPC privada de backend (${rpcPattern}) en el cliente.`
        ).toBe(false)
      }
    }
  })

  it('4. Whitelist estricta de useSupabaseClient en el cliente (sólo Auth y Perfil RLS §6.2 / §10.4)', () => {
    const allAppFiles = getAllFiles(rootAppDir)
    
    // Archivos autorizados formalmente para autenticación (supabase.auth) o gestión de perfil bajo RLS (§6.2 / §10.4)
    const approvedSupabaseClientFiles = new Set([
      path.normalize(path.join(rootAppDir, 'pages/login.vue')),
      path.normalize(path.join(rootAppDir, 'pages/perfil.vue')),
      path.normalize(path.join(rootAppDir, 'layouts/admin.vue')),
      path.normalize(path.join(rootAppDir, 'stores/auth.ts')),
      path.normalize(path.join(rootAppDir, 'composables/useProfileOrders.ts'))
    ])

    for (const file of allAppFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      const normalizedPath = path.normalize(file)
      const relativePath = path.relative(rootAppDir, file)

      if (content.includes('useSupabaseClient')) {
        expect(
          approvedSupabaseClientFiles.has(normalizedPath),
          `Violación de gobernanza: ${relativePath} contiene useSupabaseClient sin estar en la whitelist de excepciones autorizadas (§10.4).`
        ).toBe(true)
      }
    }
  })

  it('5. Catálogo y Carrito público no deben filtrar costos ni insumos de recetas (§6.1)', () => {
    const publicCatalogFiles = [
      path.join(rootAppDir, 'pages/menu.vue'),
      path.join(rootAppDir, 'stores/cart.ts'),
      ...getAllFiles(path.join(rootAppDir, 'components/catalog')),
      ...getAllFiles(path.join(rootAppDir, 'components/cart'))
    ]

    const prohibitedCostKeywords = [
      /\braw_materials\b/i,
      /\bcostoUnitario\b/i,
      /\bmargenBruto\b/i
    ]

    for (const file of publicCatalogFiles) {
      if (!fs.existsSync(file)) continue
      const content = fs.readFileSync(file, 'utf-8')
      const relativePath = path.relative(rootAppDir, file)

      for (const kw of prohibitedCostKeywords) {
        expect(
          kw.test(content),
          `Violación §6.1 / §7.1: ${relativePath} contiene referencias internas de costos/materias primas no permitidas en la UI pública.`
        ).toBe(false)
      }
    }
  })
})
