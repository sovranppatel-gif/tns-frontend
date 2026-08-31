import {
  Award,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  IndianRupee,
  RefreshCw,
  User,
  Video,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getStudentSession, getStudentToken } from '../../../utils/studentAuth.js'
import { primaryBtn } from '../../../utils/masterAdminTheme.js'
import {
  EmptyState,
  ProgressBar,
  SkeletonBlock,
  StatCard,
  formatINR,
} from '../shared/StudentUI.jsx'
import { ProgressCircle } from '../shared/StudentCharts.jsx'
import {
  emptyDashboard,
  getStudentDashboard,
} from '../../../services/studentDashboardService.js'

const QUICK_ACTIONS = [
  { id: 'notes', label: 'Download Notes', section: 'Notes', Icon: FileText },
  { id: 'live', label: 'Join Live Class', section: 'Live Classes', Icon: Video },
  { id: 'attendance', label: 'View Attendance', section: 'Attendance', Icon: CheckCircle2 },
  { id: 'fees', label: 'Pay Fees', section: 'Fee Management', Icon: IndianRupee },
  { id: 'assignment', label: 'Submit Assignment', section: 'Assignments', Icon: ClipboardList },
  { id: 'result', label: 'View Result', section: 'My Results', Icon: Award },
]

const activityIcons = {
  assignment: ClipboardList,
  fee: IndianRupee,
  exam: GraduationCap,
  certificate: Award,
  attendance: CheckCircle2,
  homework: BookOpen,
  admission: User,
}

function highlightText(value, fallback) {
  return value || fallback
}

export default function DashboardHome({ onNavigate, liveProfile, unreadCount = 0 }) {
  const session = getStudentSession()
  const [data, setData] = useState(() => emptyDashboard(session))
  const [loading, setLoading] = useState(Boolean(getStudentToken()))
  const [error, setError] = useState('')

  const load = async () => {
    if (!getStudentToken()) {
      setData(emptyDashboard(session))
      setLoading(false)
      setError('')
      return
    }
    setError('')
    try {
      const next = await getStudentDashboard()
      setData(next)
    } catch (err) {
      setError(err?.message || 'Unable to load dashboard')
      setData((prev) => (prev.profile?.name ? prev : emptyDashboard(session)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const profile = {
    ...emptyDashboard(session).profile,
    ...(data.profile || {}),
    ...(liveProfile || {}),
  }
  const s = {
    ...(data.stats || {}),
    unreadNotifications: unreadCount || data.stats?.unreadNotifications || 0,
  }
  const highlights = data.highlights || {}
  const feeDue = highlights.feeDue
  const nextExam = highlights.nextExam

  const stats = [
    ['Attendance %', `${s.attendancePercent || 0}%`, CheckCircle2],
    ['Present Days', s.presentDays || 0, CalendarClock],
    ['Absent Days', s.absentDays || 0, CalendarClock],
    ['Total Courses', s.totalCourses || 0, BookOpen],
    ['Completed Courses', s.completedCourses || 0, GraduationCap],
    ['Live Exams', s.liveExams || 0, Video],
    ['Upcoming Exams', s.upcomingExams || 0, GraduationCap],
    ['Fee Pending', formatINR(s.feePending || 0), IndianRupee],
    ['Fee Paid', formatINR(s.feePaid || 0), IndianRupee],
    ['Unread Notifications', s.unreadNotifications || 0, Bell],
  ]

  return (
    <section className="space-y-3">
      {loading ? <SkeletonBlock className="h-1.5" /> : null}
      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-[#00A896]/30 bg-gradient-to-br from-[#06151C] via-[#0a2530] to-[#005F6B] p-3 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)] sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <img
            src={
              profile.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Student')}&background=FF5E14&color=fff&size=128`
            }
            alt={profile.name || 'Student'}
            className="h-14 w-14 shrink-0 rounded-lg border-2 border-[#FF5E14]/50 object-cover shadow-lg sm:h-20 sm:w-20"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00E5CC] sm:text-[11px]">
              Welcome back
            </p>
            <h2 className="mt-0.5 truncate text-lg font-bold sm:mt-1 sm:text-2xl">
              {profile.name || session?.name || 'Student'}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-300 sm:text-sm">
              {[profile.enrollmentId || profile.rollNo, profile.batch].filter(Boolean).join(' · ') ||
                profile.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] sm:mt-3 sm:gap-2 sm:text-[11px]">
              {profile.course ? (
                <span className="rounded-full border border-[#00A896]/35 bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1">
                  {profile.course}
                </span>
              ) : null}
              {profile.semester ? (
                <span className="rounded-full border border-[#00A896]/35 bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1">
                  {profile.semester}
                </span>
              ) : null}
              {profile.trainer ? (
                <span className="rounded-full border border-[#00A896]/35 bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1">
                  Trainer: {profile.trainer}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 px-1 py-3 sm:py-4">
            <ProgressCircle value={s.overallCompletion || 0} size={78} label="Complete" tone="dark" />
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2 py-3 text-center sm:py-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 sm:text-[11px]">Attendance</p>
            <p className="mt-1 text-2xl font-bold text-[#00E5CC] sm:text-3xl">
              {s.attendancePercent || 0}%
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2 py-3 text-center sm:py-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 sm:text-[11px]">
              {s.currentGpa ? 'Current GPA' : 'Last exam'}
            </p>
            <p className="mt-1 text-2xl font-bold text-[#FFB380] sm:text-3xl">
              {s.currentGpa || (s.lastExamPercent ? `${s.lastExamPercent}%` : '—')}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 sm:text-[11px]">Next Exam</p>
            <p className="mt-1 text-sm font-semibold leading-snug">
              {highlightText(nextExam?.title, 'No exam scheduled')}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {nextExam ? [nextExam.date, nextExam.time].filter(Boolean).join(' · ') : 'Check Upcoming Exams'}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 sm:text-[11px]">Upcoming Class</p>
            <p className="mt-1 text-sm font-semibold leading-snug">
              {highlightText(highlights.nextClass?.subject, 'No class listed yet')}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {highlights.nextClass?.time || 'Timetable module is not live yet'}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 sm:text-[11px]">Fee Due</p>
            <p className="mt-1 text-sm font-semibold leading-snug">
              {feeDue ? formatINR(feeDue.amount) : formatINR(s.feePending || 0)}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {feeDue
                ? [feeDue.installment, feeDue.dueDate].filter(Boolean).join(' · ')
                : s.feePending
                  ? 'Pending on your fee account'
                  : 'No dues'}
            </p>
          </div>
        </div>
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-3">
        <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onNavigate?.(a.section)}
              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:border-[#FF5E14]/40 hover:bg-[#FF5E14]/5 hover:text-[#FF5E14]"
            >
              <a.Icon size={16} className="shrink-0 text-[#008C95]" />
              <span className="truncate">{a.label}</span>
            </button>
          ))}
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {stats.map(([label, value, Icon]) => (
          <StatCard key={label} label={label} value={value} icon={Icon} />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <article className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900">Fee progress</h2>
          <ProgressBar
            value={
              (s.feePaid || 0) + (s.feePending || 0) > 0
                ? ((s.feePaid || 0) / ((s.feePaid || 0) + (s.feePending || 0))) * 100
                : 0
            }
            label="Fees paid"
          />
          <ProgressBar value={s.attendancePercent || 0} label="Attendance" color="teal" />
          <button type="button" onClick={() => onNavigate?.('Fee Management')} className={primaryBtn}>
            <IndianRupee size={15} />
            Open fee account
          </button>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-3 lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activities</h2>
          {data.activities.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Bell}
                title="No recent activity"
                description="Notifications, fees and exam updates will show up here."
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.activities.slice(0, 6).map((act) => {
                const Icon = activityIcons[act.type] || User
                return (
                  <li key={act.id} className="flex gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00A896]/10 text-[#008C95]">
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{act.title}</p>
                      {act.detail ? (
                        <p className="truncate text-xs text-slate-500">{act.detail}</p>
                      ) : null}
                      <p className="mt-0.5 text-[11px] text-slate-400">{act.time}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </article>

        <article className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming Events</h2>
          {data.upcomingEvents.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nothing upcoming"
              description="Exams and fee dues will appear here when they are assigned."
            />
          ) : (
            <ul className="space-y-2">
              {data.upcomingEvents.map((ev) => (
                <li key={ev.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-sm font-medium text-slate-800">{ev.title}</p>
                  <p className="text-xs text-slate-500">
                    {[ev.date, ev.time].filter(Boolean).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => onNavigate?.('My Profile')} className={primaryBtn}>
            <User size={15} />
            View Profile
          </button>
        </article>
      </div>
    </section>
  )
}
