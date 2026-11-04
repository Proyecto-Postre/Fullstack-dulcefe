import { getQuery } from 'h3'
import { AuditService } from '../../../services/audit.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const from = query.from ? String(query.from) : undefined
  const to = query.to ? String(query.to) : undefined
  const page = query.page ? Number(query.page) : 1
  const limit = query.limit ? Number(query.limit) : 20

  const result = await AuditService.getFinancialAudit(event, {
    from,
    to,
    page,
    limit
  })

  return {
    success: true,
    data: result
  }
})
