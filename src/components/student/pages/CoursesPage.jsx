import { useEffect, useState } from 'react'
import { BookOpen, Building2, Calendar, Play, RefreshCw } from 'lucide-react'
import { getMyApprovedCourses } from '../../../services/admissionService.js'
import { getStudentToken } from '../../../utils/studentAuth.js'
import {
  EmptyState,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SkeletonBlock,
  StatusBadge,
} from '../shared/StudentUI.jsx'

function mapApprovedToCourse(row) {
  const details = row?.details && typeof row.details === 'object' ? row.details : {}
  const university =
    row.universityName ||
    details.universityName ||
    row.college ||
    'TNS ITI & Computer'
  const duration =
    row.duration ||
    details.courseDuration ||
    (row.semesterCount ? `${row.semesterCount} semesters` : '—')

  return {
    id: row._id || row.admissionId || row.id,
    admissionId: row.admissionId || row.id || '—',
    title: row.title || row.course || 'Course',
    university,
    duration,
    mode: row.mode || 'Online',
    fee: row.fee || '—',
    category: row.category || details.category || '',
    courseCode: row.courseCode || details.courseCode || '',
    counsellor: row.counsellor && row.counsellor !== '—' ? row.counsellor : '',
    date: row.date || '—',
    status: 'Current',
  }
}

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCourses = async () => {
    const token = getStudentToken()
    if (!token) {
      setCourses([])
      setError('Please log in again to view your courses.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const { rows } = await getMyApprovedCourses(token)
      setCourses(rows.map(mapApprovedToCourse))
    } catch (err) {
      setCourses([])
      setError(err?.message || 'Unable to load your courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const CourseCard = ({ c }) => (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{c.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <Building2 size={12} className="shrink-0" />
            <span className="truncate">{c.university}</span>
          </p>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>Duration: {c.duration}</span>
        <span>Mode: {c.mode}</span>
        {c.courseCode ? <span>Code: {c.courseCode}</span> : null}
        {c.category ? <span>{c.category}</span> : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Calendar size={12} />
          Approved {c.date}
        </span>
        <span>ID: {c.admissionId}</span>
        {c.counsellor ? <span>Counsellor: {c.counsellor}</span> : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-sm font-semibold text-slate-800">Fee: {c.fee}</p>
        <PrimaryButton>
          <Play size={14} />
          Continue Learning
        </PrimaryButton>
      </div>
    </article>
  )

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          Courses from your{' '}
          <span className="font-semibold text-slate-900">approved</span> admission
          plans.
        </p>
        <SecondaryButton onClick={loadCourses} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </SecondaryButton>
      </div>

      <Panel title="My Courses">
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <SkeletonBlock className="h-40" />
            <SkeletonBlock className="h-40" />
          </div>
        ) : error ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-sm text-rose-600">{error}</p>
            <PrimaryButton onClick={loadCourses}>Try again</PrimaryButton>
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No approved courses yet"
            description="Once TNS ITI & Computer approves your admission plan, your course will appear here."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {courses.map((c) => (
              <CourseCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </Panel>
    </section>
  )
}
