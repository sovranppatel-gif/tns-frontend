import { useEffect, useMemo, useState } from 'react'
import { Download, GraduationCap } from 'lucide-react'
import { getMyExams } from '../../../services/studentExamService.js'
import { MarksComparisonChart, ProgressCircle } from '../shared/StudentCharts.jsx'
import {
  EmptyState,
  Panel,
  PrimaryButton,
  SkeletonBlock,
  StatCard,
  StatusBadge,
} from '../shared/StudentUI.jsx'

function examPercent(exam) {
  const value = Number(exam?.result?.percentage ?? exam?.percentage)
  return Number.isFinite(value) ? value : 0
}

export default function ExamResultsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [upcoming, setUpcoming] = useState([])
  const [live, setLive] = useState([])
  const [previous, setPrevious] = useState([])
  const [results, setResults] = useState([])

  useEffect(() => {
    let cancelled = false
    getMyExams()
      .then((data) => {
        if (cancelled) return
        setUpcoming(data.upcoming)
        setLive(data.live)
        setPrevious(data.completed)
        setResults(data.results)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.message || 'Unable to load exam results')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const percents = results.map(examPercent).filter((n) => n > 0)
    const avg = percents.length
      ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)
      : 0
    const last = percents[0] || 0
    const gpa = percents.length ? (avg / 10).toFixed(1) : '—'
    return { avg, last, gpa }
  }, [results])

  const subjectMarks = useMemo(() => {
    const map = new Map()
    for (const exam of results) {
      const subject = exam.subject || exam.course || exam.title || 'Exam'
      const marks = examPercent(exam)
      if (!marks) continue
      const prev = map.get(subject) || { subject, marks: 0, count: 0 }
      prev.marks += marks
      prev.count += 1
      map.set(subject, prev)
    }
    return [...map.values()].map((row) => ({
      subject: row.subject,
      marks: Math.round(row.marks / row.count),
    }))
  }, [results])

  if (loading) {
    return (
      <section className="grid gap-3 lg:grid-cols-2">
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-40" />
      </section>
    )
  }

  const scheduled = [...live, ...upcoming]

  return (
    <section className="space-y-3">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overall GPA" value={stats.gpa} icon={GraduationCap} />
        <StatCard label="Last Exam %" value={stats.last ? `${stats.last}%` : '—'} />
        <StatCard label="Released results" value={results.length} />
        <article className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-3">
          <ProgressCircle value={stats.last || stats.avg} size={100} label="Last Score" />
        </article>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Upcoming / Live Exams">
          {scheduled.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No exams scheduled"
              description="Assigned online exams will appear here and in Upcoming Exams."
            />
          ) : (
            <div className="space-y-3">
              {scheduled.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {[e.subject, e.date, e.time].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <StatusBadge status={e.scheduleStatus || 'Upcoming'} />
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Subject-wise Marks">
          {subjectMarks.length === 0 ? (
            <p className="text-sm text-slate-500">Released exam scores will plot here.</p>
          ) : (
            <MarksComparisonChart data={subjectMarks} />
          )}
        </Panel>
      </div>

      <Panel
        title="Previous Exams"
        action={
          results.length ? (
            <PrimaryButton>
              <Download size={14} />
              Download Marksheet
            </PrimaryButton>
          ) : null
        }
      >
        {previous.length === 0 && results.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No previous exams"
            description="Completed attempts and released results will list here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-3 py-3 font-medium">Exam</th>
                  <th className="px-3 py-3 font-medium">Subject</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Marks</th>
                  <th className="px-3 py-3 font-medium">%</th>
                  <th className="px-3 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {(results.length ? results : previous).map((e) => {
                  const percent = examPercent(e)
                  const obtained = e.result?.obtainedMarks
                  const total = e.result?.totalMarks || e.totalMarks
                  return (
                    <tr key={e.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-800">{e.title}</td>
                      <td className="px-3 py-3">{e.subject || '—'}</td>
                      <td className="px-3 py-3">{e.date || '—'}</td>
                      <td className="px-3 py-3">
                        {obtained != null && total != null ? `${obtained}/${total}` : '—'}
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#008C95]">
                        {percent ? `${percent}%` : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={e.result?.result || e.scheduleStatus || 'Completed'} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </section>
  )
}
