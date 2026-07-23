import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const productId = getRouterParam(event, 'productId')
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Missing productId' })

  const supabase = await serverSupabaseClient(event)

  // 1. Get cart
  const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single()
  if (!cart) return { success: true } // Nothing to delete

  // 2. Delete item
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .match({ cart_id: cart.id, product_id: productId })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true }
})
