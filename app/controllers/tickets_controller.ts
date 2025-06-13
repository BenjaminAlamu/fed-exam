import type { HttpContext } from '@adonisjs/core/http'
import Ticket from '#models/ticket'
import { parse, isValid } from 'date-fns'

export default class TicketsController {
  async index({ request, inertia }: HttpContext) {
    const page = request.input('page', 1)
    const pageSize = 20
    const searchParam = request.input('search', '').trim()

    const filters = {
      beforeDate: undefined as Date | undefined,
      afterDate: undefined as Date | undefined,
      reporterEmail: undefined as string | undefined,
      searchValue: undefined as string | undefined,
    }

    const filterRegex = /^(before|after|reporter):(\S+)(.*)$/
    const match = searchParam.match(filterRegex)

    if (match) {
      const [, filterType, filterValue, remainingSearch] = match
      filters.searchValue = remainingSearch.trim().toLowerCase()

      if (filterType === 'before') {
        const beforeDate = parse(filterValue, 'dd/MM/yyyy', new Date())
        filters.beforeDate = isValid(beforeDate) ? beforeDate : undefined
      } else if (filterType === 'after') {
        const afterDate = parse(filterValue, 'dd/MM/yyyy', new Date())
        afterDate.setUTCHours(23, 59, 59, 999)
        filters.afterDate = isValid(afterDate) ? afterDate : undefined
      } else if (filterType === 'reporter') {
        filters.reporterEmail = filterValue.trim().toLowerCase()
      }
    } else {
      filters.searchValue = searchParam.trim().toLowerCase()
    }

    let query = Ticket.query()

    if (filters.searchValue) {
      query = query.where((builder) => {
        builder
          .whereRaw('LOWER(title) LIKE LOWER(?)', [`%${filters.searchValue}%`])
          .orWhereRaw('LOWER(content) LIKE LOWER(?)', [`%${filters.searchValue}%`])
      })
    }

    if (filters.beforeDate) {
      query = query.where('creation_time', '<', new Date(filters.beforeDate))
    }

    if (filters.afterDate) {
      query = query.where('creation_time', '>', new Date(filters.afterDate))
    }

    if (filters.reporterEmail) {
      query = query.whereRaw('LOWER(user_email) = LOWER(?)', [filters.reporterEmail])
    }

    const tickets = await query.orderBy('creation_time', 'desc').paginate(page, pageSize)
    const dashboardData = await Ticket.all()
    return inertia.render('index', {
      tickets: tickets.toJSON(),
      dashboardData,
    })
  }

  async dashboard({ inertia }: HttpContext) {
    const tickets = await Ticket.all()
    return inertia.render('Dashboard', { tickets })
  }
}
