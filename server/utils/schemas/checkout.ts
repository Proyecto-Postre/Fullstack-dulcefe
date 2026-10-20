import { z } from 'zod'

// Expresión regular para validar teléfonos válidos en Perú (9 dígitos o prefijo +51)
export const PERU_PHONE_REGEX = /^(?:\+51)?9\d{8}$/

// Expresión regular para montos monetarios formateados en dos decimales ("42.50")
export const CURRENCY_STRING_REGEX = /^\d+\.\d{2}$/

const emptyToNull = (val: unknown) => (typeof val === 'string' && val.trim() === '' ? null : val)

export function normalizeDeliveryDate(val: unknown): string | null {
  if (!val || typeof val !== 'string') return null
  const trimmed = val.trim()
  if (!trimmed) return null

  // Si ya es YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  // Si viene en DD/MM/YYYY o DD-MM-YYYY
  const parts = trimmed.split(/[/ -]/)
  if (parts.length === 3) {
    if ((parts[0]?.length || 0) <= 2 && (parts[1]?.length || 0) <= 2 && (parts[2]?.length || 0) === 4) {
      const day = parts[0]!.padStart(2, '0')
      const month = parts[1]!.padStart(2, '0')
      const year = parts[2]!
      return `${year}-${month}-${day}`
    }
  }

  return trimmed
}

export function normalizeDeliveryTime(val: unknown): string | null {
  if (!val || typeof val !== 'string') return null
  const trimmed = val.trim()
  if (!trimmed) return null

  // Si ya es HH:mm de 24 horas
  if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    return trimmed
  }

  // Si es un rango de horas (ej: "08:00 - 10:00" o "19:00 - 22:00")
  if (/^(?:[01]\d|2[0-3]):[0-5]\d\s*-\s*(?:[01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    return trimmed
  }

  // Si es texto de coordinacion
  if (/^por coordinar/i.test(trimmed)) {
    return 'Por coordinar'
  }

  // Si contiene AM o PM (ej: "03:00 PM", "3:30 pm", "12:15 AM")
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i)
  if (match) {
    let hours = parseInt(match[1]!, 10)
    const minutes = match[2]!
    const period = match[3]!.toUpperCase()

    if (period === 'PM' && hours < 12) {
      hours += 12
    } else if (period === 'AM' && hours === 12) {
      hours = 0
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`
  }

  return trimmed
}

export const CheckoutItemSchema = z.object({
  product_id: z.coerce.number().int().positive({ message: 'product_id debe ser un entero positivo' }),
  quantity: z.coerce.number().int().min(1, 'La cantidad mínima es 1').max(50, 'La cantidad máxima es 50')
})

export const CheckoutBodySchema = z.object({
  channel: z.enum(['direct', 'whatsapp_chat'], {
    message: "channel debe ser 'direct' o 'whatsapp_chat'"
  }),
  customer_name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'El nombre no puede exceder 80 caracteres'),
  customer_phone: z.preprocess(emptyToNull, z.string().trim().regex(PERU_PHONE_REGEX, 'El teléfono debe ser válido en Perú (ej. 987654321)').optional().nullable()),
  delivery_mode: z.enum(['delivery', 'meeting_point']).optional().default('delivery'),
  meeting_point_details: z.preprocess(emptyToNull, z.string().trim().max(200).optional().nullable()),
  address: z.preprocess(emptyToNull, z.string().trim().min(3, 'La dirección debe tener al menos 3 caracteres').max(200).optional().nullable()),
  delivery_date: z.preprocess((val) => normalizeDeliveryDate(emptyToNull(val)), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional().nullable()),
  delivery_slot: z.preprocess(emptyToNull, z.enum(['morning', 'night', 'special']).optional().nullable()),
  delivery_time: z.preprocess((val) => normalizeDeliveryTime(emptyToNull(val)), z.string().max(60, 'El horario no puede exceder 60 caracteres').optional().nullable()),
  is_custom_schedule: z.boolean().optional().default(false),
  notes: z.preprocess(emptyToNull, z.string().trim().max(500, 'Las notas no pueden exceder 500 caracteres').optional().nullable()),
  payment_method: z.preprocess(emptyToNull, z.enum(['cash', 'yape', 'plin', 'card']).optional().default('cash')),
  payment_reference: z.preprocess(emptyToNull, z.string().trim().max(100, 'La referencia no puede exceder 100 caracteres').optional().nullable()),
  payment_receipt_url: z.preprocess(emptyToNull, z.string().url('La URL del comprobante debe ser válida').max(1000).optional().nullable()),
  items: z.array(CheckoutItemSchema).min(1, 'El pedido debe contener al menos 1 producto').max(30, 'El pedido no puede superar 30 líneas')
}).superRefine((data, ctx) => {
  if (data.channel === 'direct') {
    if (!data.customer_phone || data.customer_phone.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customer_phone'],
        message: 'El teléfono es obligatorio para compras directas'
      })
    }
    if (data.delivery_mode === 'meeting_point') {
      const hasMeetingDetails = data.meeting_point_details && data.meeting_point_details.trim().length >= 3
      const hasAddress = data.address && data.address.trim().length >= 3
      if (!hasMeetingDetails && !hasAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['meeting_point_details'],
          message: 'Debes indicar el punto de encuentro acordado'
        })
      }
    } else {
      if (!data.address || data.address.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['address'],
          message: 'La dirección es obligatoria para compras directas con delivery a domicilio'
        })
      }
    }
  }
})

export type CheckoutBodyDTO = z.infer<typeof CheckoutBodySchema>
