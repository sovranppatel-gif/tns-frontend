import { examRequest, toQuery } from './examClient.js'

export async function getQuestions(params = {}) {
  const data = await examRequest(`/api/question-bank${toQuery(params)}`)
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  }
}

export async function getQuestionMeta() {
  const data = await examRequest('/api/question-bank/meta')
  return {
    types: data.types || [],
    difficulties: data.difficulties || [],
    statuses: data.statuses || [],
    subjects: data.subjects || [],
    courses: data.courses || [],
  }
}

export async function getQuestionById(id) {
  const data = await examRequest(`/api/question-bank/${encodeURIComponent(id)}`)
  return data.entry
}

export async function createQuestion(payload) {
  const data = await examRequest('/api/question-bank', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function updateQuestion(id, payload) {
  const data = await examRequest(`/api/question-bank/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function deleteQuestion(id) {
  const data = await examRequest(`/api/question-bank/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  return data.entry
}
