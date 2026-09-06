import type { WhatsAppMessageParams } from '../types/checkout'

/**
 * Construye el mensaje oficial de WhatsApp para coordinar el pedido con la pastelería.
 * Solo utiliza los datos e importes oficiales devueltos por el servidor.
 */
export function buildWhatsAppOrderMessage(params: WhatsAppMessageParams): string {
  const shortId = params.orderId.length >= 8 ? params.orderId.slice(0, 8) : params.orderId
  let message = `¡Hola Dulce Fe! Deseo coordinar el pedido *#${shortId}*:\n\n`
  message += `*Cliente:* ${params.customerName}\n`
  
  if (params.customerPhone) {
    message += `*Teléfono:* ${params.customerPhone}\n`
  }

  if (params.mode === 'direct') {
    message += `*Tipo de Entrega:* Envío a Domicilio\n`
    if (params.address) {
      message += `*Dirección:* ${params.address}\n`
    }
    if (params.deliveryDate) {
      message += `*Fecha:* ${params.deliveryDate}\n`
    }
    if (params.deliveryTime) {
      message += `*Hora:* ${params.deliveryTime}\n`
    }
    if (params.notes) {
      message += `*Notas:* ${params.notes}\n`
    }
  } else {
    message += `(Detalles de entrega a coordinar por chat)\n`
  }

  message += `\n*Detalle de Productos:*\n`
  for (const item of params.items) {
    message += `- ${item.quantity}x ${item.name} (S/ ${Number(item.price_at_time).toFixed(2)})\n`
  }

  message += `\n*Total a Pagar Oficial:* S/ ${Number(params.totalAmount).toFixed(2)}`
  return message
}

/**
 * Genera el enlace wa.me codificado de forma segura.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encoded}`
}
