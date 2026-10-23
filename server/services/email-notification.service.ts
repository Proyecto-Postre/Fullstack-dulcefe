import {
  getCanonicalSiteUrl,
  getEnvironmentAlertBannerText,
  getEnvironmentSubjectPrefix,
  isNonProduction
} from '../utils/environment'

export interface OrderEmailNotificationData {
  orderId: string
  trackingToken: string
  customerName: string
  customerPhone?: string | null
  deliveryMode: 'delivery' | 'meeting_point' | string
  meetingPointDetails?: string | null
  address?: string | null
  deliveryDate?: string | null
  deliveryTime?: string | null
  paymentMethod?: string | null
  paymentReference?: string | null
  totalAmount: string | number
  notes?: string | null
  items: Array<{
    name: string
    quantity: number
    price_at_time: string | number
  }>
}

/**
 * Genera una plantilla HTML responsive, elegante y amigable para la notificación de pedidos.
 * Diseñada para máxima compatibilidad con Gmail, Outlook y dispositivos móviles.
 */
export function generateOrderEmailHtml(data: OrderEmailNotificationData, siteUrl: string, isDev: boolean = false): string {
  const shortId = data.orderId.slice(0, 8).toUpperCase()
  const cleanPhone = data.customerPhone ? data.customerPhone.replace(/\D/g, '') : ''
  const phoneForWa = (cleanPhone.startsWith('51') && cleanPhone.length === 11) ? cleanPhone : `51${cleanPhone}`
  const waUrl = cleanPhone
    ? `https://wa.me/${phoneForWa}?text=${encodeURIComponent(`Hola ${data.customerName}, te escribimos de Dulce Fe respecto a tu pedido #${shortId}.`)}`
    : null

  const isMeetingPoint = data.deliveryMode === 'meeting_point'
  const trackingFullUrl = `${siteUrl.replace(/\/+$/, '')}/pedido/${data.trackingToken}`
  const adminFullUrl = `${siteUrl.replace(/\/+$/, '')}/admin?tab=pedidos`
  const alertText = getEnvironmentAlertBannerText() || 'AVISO: PEDIDO DE PRUEBA (ENTORNO LOCAL / DEV) — NO DESPACHAR EN TALLER'

  const itemsHtml = data.items
    .map(it => {
      const unitPrice = Number(it.price_at_time || 0)
      const subtotal = unitPrice * it.quantity
      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #ECE8DC; font-size: 13px; color: #2A321B; font-weight: 600;">
            ${it.name}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #ECE8DC; font-size: 13px; color: #2A321B; text-align: center;">
            ${it.quantity}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #ECE8DC; font-size: 13px; color: #2A321B; text-align: right;">
            S/ ${unitPrice.toFixed(2)}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #ECE8DC; font-size: 13px; color: #4A5D23; font-weight: 700; text-align: right;">
            S/ ${subtotal.toFixed(2)}
          </td>
        </tr>
      `
    })
    .join('')

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Pedido #${shortId} — Dulce Fe</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2A321B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF8F3; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E5DFCF; box-shadow: 0 4px 12px rgba(42, 50, 27, 0.05);" cellspacing="0" cellpadding="0">
          ${
            isDev
              ? `
          <!-- Alerta de Entorno de Prueba / Dev -->
          <tr>
            <td style="background-color: #FEF08A; border-bottom: 2px solid #EAB308; padding: 10px 16px; text-align: center; color: #854D0E; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
              ${alertText}
            </td>
          </tr>
          `
              : ''
          }
          <!-- Encabezado Editorial Dulce Fe -->
          <tr>
            <td style="background-color: #4A5D23; padding: 28px 24px; text-align: center; color: #FFFFFF;">
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #E8F0D6;">
                Dulce Fe • Pastelería Fina
              </p>
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #FFFFFF;">
                ¡Nuevo Pedido Recibido!
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #D7E5C0;">
                Orden <strong>#${shortId}</strong> registrada en la tienda web
              </p>
            </td>
          </tr>

          <!-- Banner de Modalidad de Entrega Destacado -->
          <tr>
            <td style="padding: 20px 24px 10px 24px;">
              ${
                isMeetingPoint
                  ? `
                <div style="background-color: #ECFDF5; border: 1.5px solid #10B981; border-radius: 14px; padding: 14px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #047857; padding-bottom: 4px;">
                        Modalidad: Punto de Encuentro (Sin costo)
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 15px; font-weight: 700; color: #065F46; line-height: 1.4;">
                        ${data.meetingPointDetails || data.address || 'Lugar acordado previamente con el cliente'}
                      </td>
                    </tr>
                  </table>
                </div>
              `
                  : `
                <div style="background-color: #F4F1E1; border: 1.5px solid #D1C9A6; border-radius: 14px; padding: 14px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #4A5D23; padding-bottom: 4px;">
                        Modalidad: Delivery a Domicilio
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 14px; font-weight: 700; color: #2A321B; line-height: 1.4;">
                        ${data.address || 'Dirección no especificada'}
                      </td>
                    </tr>
                  </table>
                </div>
              `
              }
            </td>
          </tr>

          <!-- Sección: Datos del Cliente -->
          <tr>
            <td style="padding: 10px 24px;">
              <table role="presentation" width="100%" style="background-color: #FAF8F3; border-radius: 14px; padding: 16px; border: 1px solid #ECE8DC;" cellspacing="0" cellpadding="0">
                <tr>
                  <td colspan="2" style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #4A5D23; padding-bottom: 10px;">
                    Datos del Cliente
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #6E7060; padding: 4px 0; width: 35%;">Cliente:</td>
                  <td style="font-size: 14px; font-weight: 700; color: #2A321B; padding: 4px 0;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #6E7060; padding: 4px 0;">Teléfono:</td>
                  <td style="font-size: 14px; font-weight: 700; color: #2A321B; padding: 4px 0;">
                    ${data.customerPhone || 'No registrado'}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #6E7060; padding: 4px 0;">Fecha de Entrega:</td>
                  <td style="font-size: 14px; font-weight: 700; color: #2A321B; padding: 4px 0;">${data.deliveryDate || 'Por coordinar'}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #6E7060; padding: 4px 0;">Franja Horaria:</td>
                  <td style="font-size: 14px; font-weight: 700; color: #2A321B; padding: 4px 0;">${data.deliveryTime || 'Por coordinar'}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #6E7060; padding: 4px 0;">Método de Pago:</td>
                  <td style="font-size: 14px; font-weight: 700; color: #2A321B; padding: 4px 0; text-transform: capitalize;">
                    ${data.paymentMethod} ${data.paymentReference ? `(Ref: ${data.paymentReference})` : ''}
                  </td>
                </tr>
                ${
                  waUrl
                    ? `
                <tr>
                  <td colspan="2" style="padding-top: 12px;">
                    <a href="${waUrl}" target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-weight: 700; font-size: 12px; padding: 8px 16px; border-radius: 10px; text-decoration: none;">
                      Abrir WhatsApp con el Cliente
                    </a>
                  </td>
                </tr>
                `
                    : ''
                }
              </table>
            </td>
          </tr>

          ${
            data.notes
              ? `
          <!-- Indicaciones / Dedicatoria -->
          <tr>
            <td style="padding: 10px 24px;">
              <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 12px; padding: 12px 14px;">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #92400E; letter-spacing: 0.5px;">
                  Indicaciones / Dedicatoria:
                </p>
                <p style="margin: 0; font-size: 13px; color: #78350F; line-height: 1.4; font-style: italic;">
                  "${data.notes}"
                </p>
              </div>
            </td>
          </tr>
          `
              : ''
          }

          <!-- Sección: Detalle de Productos -->
          <tr>
            <td style="padding: 16px 24px;">
              <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #4A5D23;">
                Detalle del Pedido
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #ECE8DC; border-radius: 12px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #F4F1E1;">
                    <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 800; color: #4A5D23; text-transform: uppercase;">Producto</th>
                    <th style="padding: 8px 12px; text-align: center; font-size: 11px; font-weight: 800; color: #4A5D23; text-transform: uppercase;">Cant.</th>
                    <th style="padding: 8px 12px; text-align: right; font-size: 11px; font-weight: 800; color: #4A5D23; text-transform: uppercase;">P. Unit</th>
                    <th style="padding: 8px 12px; text-align: right; font-size: 11px; font-weight: 800; color: #4A5D23; text-transform: uppercase;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr>
                    <td colspan="3" style="padding: 12px; text-align: right; font-size: 14px; font-weight: 800; color: #2A321B; background-color: #FAF8F3;">
                      Total a Cobrar:
                    </td>
                    <td style="padding: 12px; text-align: right; font-size: 16px; font-weight: 900; color: #4A5D23; background-color: #FAF8F3;">
                      S/ ${Number(data.totalAmount).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Botones de Acción -->
          <tr>
            <td style="padding: 10px 24px 24px 24px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${adminFullUrl}" target="_blank" style="display: inline-block; background-color: #4A5D23; color: #FFFFFF; font-weight: 800; font-size: 13px; padding: 12px 24px; border-radius: 12px; text-decoration: none; margin: 4px;">
                      Gestionar en Panel de Administrador
                    </a>
                    <a href="${trackingFullUrl}" target="_blank" style="display: inline-block; background-color: #FAF8F3; color: #4A5D23; font-weight: 700; font-size: 12px; padding: 12px 20px; border-radius: 12px; text-decoration: none; border: 1px solid #4A5D23; margin: 4px;">
                      Ver Seguimiento del Cliente
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #F4F1E1; padding: 16px 24px; text-align: center; border-top: 1px solid #ECE8DC; font-size: 11px; color: #6E7060;">
              <p style="margin: 0 0 4px 0; font-weight: 700; color: #2A321B;">
                Dulce Fe • Pastelería Fina Artesanal
              </p>
              <p style="margin: 0;">
                Este es un mensaje automático del sistema de pedidos en línea.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export class EmailNotificationService {
  private static getApiKey(): string | undefined {
    return process.env.RESEND_API_KEY
  }

  private static getAdminEmail(): string {
    return process.env.ADMIN_NOTIFICATION_EMAIL || 'jafethworren@gmail.com'
  }

  private static getFromEmail(): string {
    return process.env.EMAIL_FROM || 'Dulce Fe Pedidos <onboarding@resend.dev>'
  }

  private static getSiteUrl(): string {
    return getCanonicalSiteUrl()
  }

  static isDevelopmentEnvironment(): boolean {
    return isNonProduction()
  }

  /**
   * Envía una notificación de correo al administrador cuando entra un nuevo pedido.
   * Diseñado con tolerancia a fallos: no interrumpe el checkout si el servicio de correo no está disponible.
   */
  static async sendNewOrderNotification(data: OrderEmailNotificationData): Promise<boolean> {
    const apiKey = this.getApiKey()
    const adminEmail = this.getAdminEmail()
    const fromEmail = this.getFromEmail()
    const siteUrl = this.getSiteUrl()
    const isDev = this.isDevelopmentEnvironment()

    const shortId = data.orderId.slice(0, 8).toUpperCase()
    const modeLabel = data.deliveryMode === 'meeting_point'
      ? 'Punto de Encuentro Acordado'
      : 'Delivery a Domicilio'

    const prefix = getEnvironmentSubjectPrefix()
    const subject = `${prefix}Nuevo Pedido #${shortId} — ${modeLabel} (S/ ${Number(data.totalAmount).toFixed(2)})`
    const html = generateOrderEmailHtml(data, siteUrl, isDev)

    if (!apiKey) {
      console.info(
        `[EmailNotification] RESEND_API_KEY no configurado en entorno. Notificación simulada exitosamente para ${adminEmail}.`
      )
      return false
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [adminEmail],
          subject,
          html
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(
          `[EmailNotification] Fallo al enviar email via Resend (Status ${response.status}): ${errorText}`
        )
        return false
      }

      console.info(
        `[EmailNotification] Notificación de nuevo pedido #${shortId} enviada exitosamente a ${adminEmail}`
      )
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(
        `[EmailNotification] Error despachando email a ${adminEmail}: ${errorMsg}`
      )
      return false
    }
  }
}
