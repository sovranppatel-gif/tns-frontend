import { useEffect, useState } from 'react'
import { getMyExamResult } from '../../../services/studentExamService.js'
import { Panel, StatCard, StatusBadge } from '../shared/StudentUI.jsx'

function formatDuration(seconds) {
  const n = Number(seconds) || 0
  const m = Math.floor(n / 60)
  const s = n % 60
  return `${m} min ${s} sec`
}

export default function ExamResultPage({ examId }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState('')

  useEffect(() => {
    if (!examId) return
    getMyExamResult(examId)
      .then(setResult)
      .catch((err) => {
        const message = err.message || 'Unable to load result'
        if (/not available/i.test(message)) setPending(message)
        else setError(message)
      })
  }, [examId])

  if (error) {
    return <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
  }
  if (pending) {
    return (
      <Panel title="Result pending">
        <p className="text-sm text-slate-600">{pending}</p>
      </Panel>
    )
  }
  if (!result) {
    return <p className="py-8 text-center text-sm text-slate-500">Loading result…</p>
  }

  return (
    <section className="space-y-3">
      <Panel title="ONLINE EXAM RESULT">
        <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <p><span className="font-semibold">Exam:</span> {result.examTitle}</p>
          <p><span className="font-semibold">Student:</span> {result.studentName || '—'}</p>
          <p><span className="font-semibold">Course:</span> {result.courseName || '—'}</p>
          <p><span className="font-semibold">Batch:</span> {result.batchName || '—'}</p>
          <p><span className="font-semibold">Exam date:</span> {result.examDate ? new Date(result.examDate).toLocaleString('en-IN') : '—'}</p>
          <p><span className="font-semibold">Time taken:</span> {formatDuration(result.timeTakenSeconds)}</p>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Questions" value={result.totalQuestions} />
        <StatCard label="Attempted" value={result.attempted} />
        <StatCard label="Correct" value={result.correct} />
        <StatCard label="Wrong" value={result.wrong} />
        <StatCard label="Unanswered" value={result.unanswered} />
        <StatCard label="Total Marks" value={result.totalMarks} />
        <StatCard label="Obtained Marks" value={result.obtainedMarks} />
        <StatCard label="Percentage" value={`${result.percentage}%`} />
      </div>

      <Panel title="Result">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={result.result} />
          <p className="text-sm text-slate-600">Passing percentage: {result.passingPercentage}%</p>
        </div>
      </Panel>
    </section>
  )
}
