export const STUDENT_COLS = [
  { key: 'studentId', label: 'Student ID' },
  { key: 'name', label: 'Name' },
  { key: 'course', label: 'Course' },
  { key: 'batch', label: 'Batch' },
  { key: 'session', label: 'Session' },
  { key: 'university', label: 'University' },
  { key: 'gender', label: 'Gender' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'documents', label: 'Documents' },
  { key: 'admitted', label: 'Admitted' },
]

export const ADMISSION_COLS = [
  { key: 'admissionId', label: 'Admission ID' },
  { key: 'applicant', label: 'Applicant' },
  { key: 'course', label: 'Course' },
  { key: 'mode', label: 'Mode' },
  { key: 'status', label: 'Status' },
  { key: 'phone', label: 'Phone' },
  { key: 'counsellor', label: 'Counsellor' },
  { key: 'session', label: 'Session' },
  { key: 'date', label: 'Date' },
]

export const FEE_ACCOUNT_COLS = [
  { key: 'feeId', label: 'Fee ID' },
  { key: 'student', label: 'Student' },
  { key: 'course', label: 'Course' },
  { key: 'billed', label: 'Billed' },
  { key: 'paid', label: 'Paid' },
  { key: 'due', label: 'Due' },
  { key: 'status', label: 'Status' },
  { key: 'nextDue', label: 'Next due' },
  { key: 'phone', label: 'Phone' },
]

export const FEE_RECEIPT_COLS = [
  { key: 'date', label: 'Date' },
  { key: 'feeId', label: 'Fee ID' },
  { key: 'student', label: 'Student' },
  { key: 'course', label: 'Course' },
  { key: 'amount', label: 'Amount' },
  { key: 'method', label: 'Method' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'status', label: 'Status' },
]

export const DEFAULTER_COLS = [
  { key: 'feeId', label: 'Fee ID' },
  { key: 'student', label: 'Student' },
  { key: 'course', label: 'Course' },
  { key: 'due', label: 'Due' },
  { key: 'paid', label: 'Paid' },
  { key: 'billed', label: 'Billed' },
  { key: 'status', label: 'Status' },
  { key: 'nextDue', label: 'Next due' },
  { key: 'phone', label: 'Phone' },
]

export const ATTENDANCE_COLS = [
  { key: 'studentCode', label: 'Code' },
  { key: 'student', label: 'Student' },
  { key: 'course', label: 'Course' },
  { key: 'batch', label: 'Batch' },
  { key: 'present', label: 'Present' },
  { key: 'absent', label: 'Absent' },
  { key: 'late', label: 'Late' },
  { key: 'leave', label: 'Leave' },
  { key: 'marked', label: 'Marked' },
  { key: 'percent', label: 'Percent' },
  { key: 'status', label: 'Status' },
]

export const EXAM_COLS = [
  { key: 'studentCode', label: 'Code' },
  { key: 'student', label: 'Student' },
  { key: 'exam', label: 'Exam' },
  { key: 'course', label: 'Course' },
  { key: 'batch', label: 'Batch' },
  { key: 'obtained', label: 'Obtained' },
  { key: 'totalMarks', label: 'Total' },
  { key: 'percent', label: 'Percent' },
  { key: 'result', label: 'Result' },
  { key: 'date', label: 'Date' },
]

export const FACULTY_COLS = [
  { key: 'code', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'department', label: 'Department' },
  { key: 'type', label: 'Type' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'subjects', label: 'Subjects' },
  { key: 'status', label: 'Status' },
  { key: 'joined', label: 'Joined' },
  { key: 'mobile', label: 'Mobile' },
]

export const STAFF_COLS = [
  { key: 'code', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'department', label: 'Department' },
  { key: 'category', label: 'Category' },
  { key: 'shift', label: 'Shift' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'joined', label: 'Joined' },
  { key: 'mobile', label: 'Mobile' },
]

export const SUMMARY_COLS = [
  { key: 'label', label: 'Metric' },
  { key: 'value', label: 'Value' },
]

export function statsToRows(stats = {}) {
  return Object.entries(stats)
    .filter(([, value]) => value == null || ['string', 'number', 'boolean'].includes(typeof value))
    .map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
      value: value === true ? 'Yes' : value === false ? 'No' : String(value),
    }))
}

export function downloadDelimited(filename, columns, rows) {
  const header = columns.map((c) => c.label).join(',')
  const body = (rows || [])
    .map((row) =>
      columns
        .map((c) => {
          const str = String(row[c.key] ?? '').replaceAll('"', '""')
          return `"${str}"`
        })
        .join(','),
    )
    .join('\n')
  const blob = new Blob([`\uFEFF${header}\n${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function stampName(prefix, from, to, ext) {
  return `tns-${prefix}-${from}_to_${to}.${ext}`
}

export function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
