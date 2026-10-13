import { defineEventHandler } from 'h3'
import { CatalogService } from '../../../services/catalog.service'

export default defineEventHandler(async (event) => {
  const data = await CatalogService.listAdminCategories(event)
  return {
    success: true,
    count: data.length,
    data
  }
})
