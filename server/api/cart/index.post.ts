import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  const { product_id, quantity } = body

  if (!product_id || !quantity) {
    throw createError({ statusCode: 400, statusMessage: 'Missing product_id or quantity' })
  }

  const supabase = await serverSupabaseClient(event)

  // 1. Get cart
  let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single()
  if (!cart) {
    const { data: newCart } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single()
    cart = newCart
  }

  // 2. Upsert item
  const { error } = await supabase
    .from('cart_items')
    .upsert({ 
      cart_id: cart.id, 
      product_id, 
      quantity 
    }, { 
      onConflict: 'cart_id, product_id' 
    })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true }
})
