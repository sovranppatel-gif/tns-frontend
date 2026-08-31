import { examRequest, toQuery } from './examClient.js'

export async function getExamPapers(params = {}) {
  const data = await examRequest(`/api/exams/papers${toQuery(params)}`)
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
  }
}

export async function getExamPaperById(id) {
  const data = await examRequest(`/api/exams/papers/${encodeURIComponent(id)}`)
  return data.entry
}

export async function createExamPaper(payload) {
  const data = await examRequest('/api/exams/papers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function updateExamPaper(id, payload) {
  const data = await examRequest(`/api/exams/papers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function publishExamPaper(id) {
  const data = await examRequest(`/api/exams/papers/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  })
  return data.entry
}

export async function archiveExamPaper(id) {
  const data = await examRequest(`/api/exams/papers/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  })
  return data.entry
}

export async function addPaperQuestionFromBank(paperId, payload) {
  const data = await examRequest(`/api/exams/papers/${encodeURIComponent(paperId)}/questions/bank`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function addPaperInlineQuestion(paperId, payload) {
  const data = await examRequest(`/api/exams/papers/${encodeURIComponent(paperId)}/questions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}
