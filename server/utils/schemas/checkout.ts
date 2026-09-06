import { z } from 'zod'

// Expresión regular para validar teléfonos válidos en Perú (9 dígitos o prefijo +51)
export const PERU_PHONE_REGEX = /^(?:\+51)?9\d{8}$/

// Expresión regular para montos monetarios formateados en dos decimales ("42.50")
export const CURRENCY_STRING_REGEX = /^\d+\.\d{2}$/

export const CheckoutItemSchema = z.object({
  product_id: z.number().int().positive({ message: 'product_id debe ser un entero positivo' }),
  quantity: z.number().int().min(1, 'La cantidad mínima es 1').max(50, 'La cantidad máxima es 50')
})

export const CheckoutBodySchema = z.object({
  channel: z.enum(['direct', 'whatsapp_chat'], {
    message: "channel debe ser 'direct' o 'whatsapp_chat'"
  }),
  customer_name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'El nombre no puede exceder 80 caracteres'),
  customer_phone: z.string().trim().regex(PERU_PHONE_REGEX, 'El teléfono debe ser válido en Perú (ej. 987654321)').optional().nullable(),
  address: z.string().trim().min(5, 'La dirección debe tener al menos 5 caracteres').max(200).optional().nullable(),
  delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional().nullable(),
  delivery_time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:mm)').optional().nullable(),
  notes: z.string().trim().max(500, 'Las notas no pueden exceder 500 caracteres').optional().nullable(),
  payment_method: z.enum(['cash', 'yape', 'plin', 'card']).optional().default('cash'),
  payment_reference: z.string().trim().max(100, 'La referencia no puede exceder 100 caracteres').optional().nullable(),
  payment_receipt_url: z.string().url('La URL del comprobante debe ser válida').max(1000).optional().nullable(),
  items: z.array(CheckoutItemSchema).min(1, 'El pedido debe contener al menos 1 producto').max(30, 'El pedido no puede superar 30 líneas')
}).superRefine((data, ctx) => {
  if (data.channel === 'direct') {
    if (!data.customer_phone || data.customer_phone.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customer_phone'],
        message: 'El teléfono es obligatorio para compras directas con delivery'
      })
    }
    if (!data.address || data.address.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['address'],
        message: 'La dirección es obligatoria para compras directas'
      })
    }
  }
})

export type CheckoutBodyDTO = z.infer<typeof CheckoutBodySchema>
