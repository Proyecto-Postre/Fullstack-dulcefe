import { z } from 'zod'

const PERU_PHONE_REGEX = /^(?:\+51)?9\d{8}$/

export const AdminUpdateOrderStatusSchema = z.object({
  status: z.enum(['processing', 'ready', 'completed', 'cancelled'], {
    message: "El estado debe ser 'processing', 'ready', 'completed' o 'cancelled'"
  }),
  cancellation_reason: z.string().trim().min(3, 'El motivo debe tener al menos 3 caracteres').max(200).optional(),
  restore_stock: z.boolean().optional()
})

export type AdminUpdateOrderStatusInput = z.infer<typeof AdminUpdateOrderStatusSchema>

export const AdminCreateOrderSchema = z.object({
  channel: z.literal('admin', {
    message: "El canal para pedidos de administración debe ser 'admin'"
  }),
  customer_name: z
    .string({ message: 'El nombre del cliente es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede exceder 80 caracteres'),
  customer_phone: z
    .string()
    .trim()
    .regex(PERU_PHONE_REGEX, 'El teléfono debe ser un celular válido de Perú (ej. 987654321 o +51987654321)')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .max(200, 'La dirección no puede exceder 200 caracteres')
    .optional()
    .or(z.literal('')),
  delivery_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  delivery_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'La hora debe tener formato HH:mm')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .trim()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  profile_id: z
    .string()
    .uuid('El profile_id debe ser un UUID válido')
    .optional()
    .nullable(),
  items: z
    .array(
      z.object({
        product_id: z.number({ message: 'El ID de producto es obligatorio' }).int().positive(),
        quantity: z
          .number({ message: 'La cantidad es obligatoria' })
          .int()
          .min(1, 'La cantidad mínima es 1')
          .max(50, 'La cantidad máxima es 50')
      }),
      { message: 'Debe incluir al menos un producto' }
    )
    .min(1, 'El pedido debe contener al menos un producto')
    .max(30, 'El pedido no puede exceder 30 ítems diferentes')
})

export type AdminCreateOrderInput = z.infer<typeof AdminCreateOrderSchema>
