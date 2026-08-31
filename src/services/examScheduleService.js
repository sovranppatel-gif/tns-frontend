import { examRequest, toQuery } from './examClient.js'

export async function getExamSchedules(params = {}) {
  const data = await examRequest(`/api/exams/schedules${toQuery(params)}`)
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
  }
}

export async function getExamScheduleById(id) {
  const data = await examRequest(`/api/exams/schedules/${encodeURIComponent(id)}`)
  return data.entry
}

export async function createExamSchedule(payload) {
  const data = await examRequest('/api/exams/schedules', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function updateExamSchedule(id, payload) {
  const data = await examRequest(`/api/exams/schedules/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function cancelExamSchedule(id) {
  const data = await examRequest(`/api/exams/schedules/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
  })
  return data.entry
}

export async function releaseExamResults(id) {
  const data = await examRequest(`/api/exams/schedules/${encodeURIComponent(id)}/release-results`, {
    method: 'POST',
  })
  return data.entry
}
