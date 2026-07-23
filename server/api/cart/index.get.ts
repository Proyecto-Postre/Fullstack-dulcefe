import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) return { items: [] }

  const supabase = await serverSupabaseClient(event)

  // 1. Get or create cart
  let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single()
  
  if (!cart) {
    const { data: newCart, error } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single()
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    cart = newCart
  }

  // 2. Get items
  const { data: items, error } = await supabase
    .from('cart_items')
    .select(`
      quantity,
      products (
        id,
        name,
        price,
        image_url
      )
    `)
    .eq('cart_id', cart.id)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return {
    items: items.map((item: any) => ({
      id: item.products.id,
      product_id: item.products.id,
      name: item.products.name,
      price: item.products.price,
      image_url: item.products.image_url,
      quantity: item.quantity
    }))
  }
})
