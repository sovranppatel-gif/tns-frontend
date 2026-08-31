import { examRequest, toQuery } from './examClient.js'

export async function getExamOverview() {
  const data = await examRequest('/api/exams/overview')
  return data.stats || {}
}

export async function getExamResults(params = {}) {
  const data = await examRequest(`/api/exams/results${toQuery(params)}`)
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
  }
}

export async function getExamResultById(id) {
  const data = await examRequest(`/api/exams/results/${encodeURIComponent(id)}`)
  return data.entry
}

export async function allotReexam(resultId) {
  const data = await examRequest(`/api/exams/results/${encodeURIComponent(resultId)}/reexam`, {
    method: 'POST',
  })
  return data
}
