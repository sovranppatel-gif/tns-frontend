export const QUESTION_TYPES = ['Single Choice', 'Multiple Choice', 'True / False', 'Yes / No']
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
export const QUESTION_STATUSES = ['Active', 'Inactive', 'Draft']

export const inputClass =
  'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00A896]'

export const textareaClass =
  'mt-1 min-h-[88px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#00A896]'

export function defaultOptions(type) {
  if (type === 'True / False') return [{ key: 'True', text: 'True' }, { key: 'False', text: 'False' }]
  if (type === 'Yes / No') return [{ key: 'Yes', text: 'Yes' }, { key: 'No', text: 'No' }]
  return [
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' },
  ]
}

export function emptyQuestion(overrides = {}) {
  const type = overrides.type || 'Single Choice'
  return {
    text: '',
    type,
    options: defaultOptions(type),
    correctAnswer: type === 'Multiple Choice' ? [] : '',
    marks: 1,
    negativeMarks: 0,
    subject: '',
    courseId: '',
    difficulty: 'Medium',
    explanation: '',
    status: 'Active',
    ...overrides,
  }
}

export function isCorrect(type, key, correctAnswer) {
  if (type === 'Multiple Choice') {
    return Array.isArray(correctAnswer) && correctAnswer.includes(key)
  }
  return String(correctAnswer || '') === String(key)
}

export function toggleCorrect(type, key, correctAnswer) {
  if (type === 'Multiple Choice') {
    const current = Array.isArray(correctAnswer) ? [...correctAnswer] : []
    return current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
  }
  return key
}

export function formatAnswer(value) {
  if (Array.isArray(value)) return value.join(', ')
  return value || '—'
}

export function labelOf(row, fallback = '—') {
  if (!row) return fallback
  return row.name || row.title || row.label || fallback
}
