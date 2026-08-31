import { examRequest } from './examClient.js'

export async function getMyExams() {
  const data = await examRequest('/api/student/exams', {}, 'student')
  return {
    upcoming: Array.isArray(data.upcoming) ? data.upcoming : [],
    live: Array.isArray(data.live) ? data.live : [],
    completed: Array.isArray(data.completed) ? data.completed : [],
    results: Array.isArray(data.results) ? data.results : [],
  }
}

export async function getMyExam(id) {
  const data = await examRequest(`/api/student/exams/${encodeURIComponent(id)}`, {}, 'student')
  return data.entry
}

export async function startMyExam(id) {
  return examRequest(
    `/api/student/exams/${encodeURIComponent(id)}/start`,
    { method: 'POST' },
    'student',
  )
}

export async function saveMyExamAnswer(id, payload) {
  return examRequest(
    `/api/student/exams/${encodeURIComponent(id)}/answer`,
    { method: 'PUT', body: JSON.stringify(payload), timeoutMs: 15000 },
    'student',
  )
}

export async function submitMyExam(id) {
  return examRequest(
    `/api/student/exams/${encodeURIComponent(id)}/submit`,
    { method: 'POST', timeoutMs: 30000 },
    'student',
  )
}

export async function getMyExamResult(id) {
  const data = await examRequest(
    `/api/student/exams/${encodeURIComponent(id)}/result`,
    {},
    'student',
  )
  return data.entry
}
