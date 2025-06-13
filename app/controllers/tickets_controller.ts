import type { HttpContext } from '@adonisjs/core/http'
import Ticket from '#models/ticket'

export default class TicketsController {
  async index({ request, inertia }: HttpContext) {
    const page = request.input('page', 1)
    const pageSize = 20
    const searchParam = request.input('search', '').trim()

    let query = Ticket.query()
    if (searchParam) {
      query = query.where((builder) => {
        builder
          .whereRaw('LOWER(title) LIKE LOWER(?)', [`%${searchParam}%`])
          .orWhereRaw('LOWER(content) LIKE LOWER(?)', [`%${searchParam}%`])
          .orWhereRaw('LOWER(user_email) LIKE LOWER(?)', [`%${searchParam}%`])
      })
    }
    const tickets = await query.orderBy('creation_time', 'desc').paginate(page, pageSize)

    return inertia.render('index', {
      tickets: tickets.toJSON(),
    })
  }
}
