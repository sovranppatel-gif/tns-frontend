import { studentRequest } from './studentClient.js'

export async function getStudentLearning(kind) {
  const data = await studentRequest(
    `/api/students/learning/${encodeURIComponent(kind)}`,
  )
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    ready: Boolean(data.ready),
  }
}
