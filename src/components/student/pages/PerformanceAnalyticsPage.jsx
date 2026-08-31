import { useEffect, useMemo, useState } from 'react'
import { Activity, Target, TrendingUp } from 'lucide-react'
import { getMyAttendance } from '../../../services/studentAttendanceService.js'
import { getMyExams } from '../../../services/studentExamService.js'
import {
  AttendanceTrendChart,
  MarksComparisonChart,
  ProgressCircle,
} from '../shared/StudentCharts.jsx'
import { EmptyState, Panel, SkeletonBlock, StatCard } from '../shared/StudentUI.jsx'

export default function PerformanceAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [trend, setTrend] = useState([])
  const [attendancePercent, setAttendancePercent] = useState(0)
  const [results, setResults] = useState([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getMyAttendance().catch(() => ({ stats: {}, trend: [] })),
      getMyExams().catch(() => ({ results: [] })),
    ])
      .then(([attendance, exams]) => {
        if (cancelled) return
        setTrend(Array.isArray(attendance.trend) ? attendance.trend : [])
        setAttendancePercent(Number(attendance.stats?.attendancePercent) || 0)
        setResults(Array.isArray(exams.results) ? exams.results : [])
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.message || 'Unable to load analytics')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const percents = results
    .map((row) => Number(row.result?.percentage ?? row.percentage) || 0)
    .filter((n) => n > 0)
  const avgScore = percents.length
    ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)
    : 0
  const overall = avgScore || attendancePercent

  const subjectMarks = useMemo(() => {
    const map = new Map()
    for (const exam of results) {
      const subject = exam.subject || exam.course || exam.title || 'Exam'
      const marks = Number(exam.result?.percentage ?? exam.percentage) || 0
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
        <SkeletonBlock className="h-48" />
        <SkeletonBlock className="h-48" />
      </section>
    )
  }

  return (
    <section className="space-y-3">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-3">
          <ProgressCircle value={overall} size={110} label="Overall" />
        </article>
        <StatCard label="Attendance" value={`${attendancePercent}%`} icon={TrendingUp} />
        <StatCard label="Avg exam score" value={avgScore ? `${avgScore}%` : '—'} icon={Target} />
        <StatCard label="Released results" value={results.length} icon={Activity} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Subject Comparison">
          {subjectMarks.length === 0 ? (
            <EmptyState
              title="No exam scores yet"
              description="Subject comparison appears after online exam results are released."
            />
          ) : (
            <MarksComparisonChart data={subjectMarks} />
          )}
        </Panel>
        <Panel title="Attendance Trend">
          {trend.length === 0 ? (
            <EmptyState
              title="No attendance trend"
              description="Monthly attendance % will chart here after attendance is marked."
            />
          ) : (
            <AttendanceTrendChart data={trend} />
          )}
        </Panel>
      </div>

      <Panel title="Insights">
        <div className="flex items-start gap-3 rounded-lg bg-[#00A896]/10 p-3 text-sm text-slate-700">
          <Activity size={18} className="mt-0.5 shrink-0 text-[#008C95]" />
          <p>
            {avgScore
              ? `Your average released exam score is ${avgScore}% with ${attendancePercent}% attendance.`
              : attendancePercent
                ? `Attendance so far is ${attendancePercent}%. Exam analytics will appear after results are released.`
                : 'Analytics will fill in from live attendance and exam results. Assignment and study-hour charts will appear when those modules go live.'}
          </p>
        </div>
      </Panel>
    </section>
  )
}
