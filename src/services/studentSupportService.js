import { studentRequest } from './studentClient.js'

export async function getMySupportTickets() {
  const data = await studentRequest('/api/students/support/tickets')
  return Array.isArray(data.rows) ? data.rows : []
}

export async function createSupportTicket(payload) {
  const data = await studentRequest('/api/students/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}
