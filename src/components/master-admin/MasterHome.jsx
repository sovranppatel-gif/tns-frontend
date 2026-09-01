import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  IndianRupee,
  Layers,
  MessageSquare,
  RefreshCw,
  Ticket,
  Trophy,
  University,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import logo from '../../assets/tnslogo.png'
import { institute } from '../../data/masterAdminData'
import { getMasterAdminSession } from '../../utils/masterAdminAuth'
import { getMasterDashboardOverview } from '../../services/dashboardService'
import { formatINR, ProgressBar, StatusBadge } from './shared/MasterAdminUI.jsx'
import {
  AreaTrendChart,
  BarMetricChart,
  DonutChart,
  MultiLineChart,
} from './shared/MasterAdminCharts.jsx'

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

function relativeTime(value) {
  const t = value ? new Date(value).getTime() : 0
  if (!t) return ''
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 45) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
  if (s < 172800) return 'Yesterday'
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function DashPanel({ title, action, children, isDark, className = '' }) {
  return (
    <article
      className={`min-w-0 overflow-hidden rounded-lg border p-3 shadow-sm ${
        isDark ? 'border-white/10 bg-navy-900/80' : 'border-slate-200 bg-white'
      } ${className}`}
    >
      {(title || action) && (
        <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
          {title ? (
            <h2 className={`min-w-0 text-base font-semibold sm:text-lg ${isDark ? 'text-white' : 'text-navy-900'}`}>
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action || null}
        </div>
      )}
      {children}
    </article>
  )
}

function KpiCard({ label, value, hint, icon: Icon, onClick, isDark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isDark
          ? 'border-white/10 bg-navy-900/80 hover:border-brand-red/40'
          : 'border-slate-200 bg-white hover:border-brand-red/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[11px] font-medium tracking-wide uppercase ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
          {label}
        </p>
        {Icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-red/10 text-brand-red">
            <Icon size={15} />
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 bg-gradient-to-r from-brand-red to-navy-800 bg-clip-text text-2xl font-semibold tabular-nums text-transparent">
        {value}
      </p>
      {hint ? <p className={`mt-1 text-[11px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{hint}</p> : null}
    </button>
  )
}

function EmptyList({ text, isDark }) {
  return <p className={`py-6 text-center text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{text}</p>
}

function LinkBtn({ onClick, children, isDark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-semibold ${isDark ? 'text-gold hover:underline' : 'text-brand-red hover:underline'}`}
    >
      {children}
    </button>
  )
}

const QUICK = [
  { label: 'Admissions', section: 'Admissions' },
  { label: 'Students', section: 'Students' },
  { label: 'Fees', section: 'Fees' },
  { label: 'Attendance', section: 'Attendance' },
  { label: 'Courses', section: 'Courses' },
  { label: 'Batches', section: 'Batches' },
  { label: 'Online Exams', section: 'Online Exams' },
  { label: 'Enquiry', section: 'Enquiry Management' },
  { label: 'Reports', section: 'Reports' },
  { label: 'Analytics', section: 'Analytics' },
  { label: 'Downloads', section: 'Downloads' },
  { label: 'Backup', section: 'Backup' },
]

export default function MasterHome({ onNavigate, isDark = false }) {
  const now = useClock()
  const session = getMasterAdminSession()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const dateStr = useMemo(
    () => now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    [now],
  )
  const timeStr = useMemo(
    () => now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    [now],
  )

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const next = await getMasterDashboardOverview()
      setData(next)
    } catch (err) {
      setError(err?.message || 'Unable to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const kpis = data?.kpis || {}
  const charts = data?.charts || {}
  const lists = data?.lists || {}
  const health = data?.health || { score: 0, grade: '—', collectionRate: 0, attendanceRate: 0 }
  const muted = isDark ? 'text-white/55' : 'text-slate-500'
  const strong = isDark ? 'text-white' : 'text-navy-900'
  const rowClass = isDark ? 'border-white/10' : 'border-slate-100'

  const pendingAdmissions = (kpis.admissions?.pending || 0) + (kpis.admissions?.verification || 0)
  const unmarked = kpis.attendance?.unmarked || 0
  const openTickets = kpis.tickets?.open || 0
  const liveExams = kpis.exams?.live || 0

  const alerts = [
    pendingAdmissions > 0
      ? { label: `${pendingAdmissions} admissions pending review`, section: 'Admissions' }
      : null,
    (kpis.fees?.overdue || 0) > 0
      ? { label: `${kpis.fees.overdueLabel || formatINR(kpis.fees.overdue)} fee overdue`, section: 'Fees' }
      : null,
    unmarked > 0 ? { label: `${unmarked} students unmarked today`, section: 'Attendance' } : null,
    openTickets > 0 ? { label: `${openTickets} help-desk tickets open`, section: 'Help Desk' } : null,
    liveExams > 0 ? { label: `${liveExams} exam(s) live / scheduled`, section: 'Exam Schedule' } : null,
  ].filter(Boolean)

  const kpiCards = [
    {
      label: 'Active Students',
      value: kpis.students?.active ?? '—',
      hint: `${kpis.students?.total || 0} total · ${kpis.students?.newThisMonth || 0} new this month`,
      icon: Users,
      section: 'Students',
    },
    {
      label: 'Admissions this month',
      value: kpis.admissions?.thisMonth ?? '—',
      hint: `${pendingAdmissions} pending / verification`,
      icon: ClipboardList,
      section: 'Admissions',
    },
    {
      label: "Today's Attendance",
      value: `${kpis.attendance?.percent ?? 0}%`,
      hint: `${kpis.attendance?.present || 0} present · ${kpis.attendance?.absent || 0} absent`,
      icon: CalendarDays,
      section: 'Attendance',
    },
    {
      label: 'Fee Collected',
      value: kpis.fees?.collectedLabel || '₹0',
      hint: `${kpis.fees?.collectionRate || 0}% collection rate`,
      icon: Wallet,
      section: 'Fees',
    },
    {
      label: 'Fee Pending',
      value: kpis.fees?.pendingLabel || '₹0',
      hint: `${kpis.fees?.overdueLabel || '₹0'} overdue`,
      icon: IndianRupee,
      section: 'Fees',
    },
    {
      label: 'Running Batches',
      value: kpis.batches?.running ?? '—',
      hint: `${kpis.batches?.total || 0} total · ${kpis.batches?.avgProgress || 0}% avg progress`,
      icon: Layers,
      section: 'Batches',
    },
    {
      label: 'Active Courses',
      value: kpis.courses?.active ?? '—',
      hint: `${kpis.courses?.total || 0} listed · ${kpis.universities?.active || 0} universities`,
      icon: BookOpen,
      section: 'Courses',
    },
    {
      label: 'Enquiries',
      value: kpis.enquiries?.thisMonth ?? '—',
      hint: `${kpis.enquiries?.total || 0} all-time · ${kpis.leads?.newLeads || 0} new leads`,
      icon: MessageSquare,
      section: 'Enquiry Management',
    },
    {
      label: 'Universities',
      value: kpis.universities?.total ?? '—',
      hint: `${kpis.universities?.active || 0} active partners`,
      icon: University,
      section: 'Universities',
    },
    {
      label: 'Exam Pass Rate',
      value:
        (kpis.exams?.passed || 0) + (kpis.exams?.failed || 0) > 0
          ? `${Math.round(((kpis.exams?.passed || 0) / ((kpis.exams?.passed || 0) + (kpis.exams?.failed || 0))) * 100)}%`
          : '—',
      hint: `${kpis.exams?.passed || 0} pass · ${kpis.exams?.failed || 0} fail · avg ${kpis.exams?.averageScore || 0}%`,
      icon: GraduationCap,
      section: 'Exam Results',
    },
    {
      label: 'Open Tickets',
      value: openTickets,
      hint: `${kpis.tickets?.inProgress || 0} in progress · ${kpis.tickets?.resolved || 0} resolved`,
      icon: Ticket,
      section: 'Help Desk',
    },
    {
      label: 'Activity today',
      value: kpis.activity?.today ?? '—',
      hint: `${kpis.activity?.total || 0} logged actions`,
      icon: Activity,
      section: 'Audit Logs',
    },
  ]

  return (
    <section className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-navy-800/40 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-3 text-white shadow-lg sm:p-4">
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-brand-red/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <img src={logo} alt="" className="h-14 w-14 rounded-lg bg-white object-contain p-1" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold sm:text-2xl">{institute.short}</h2>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-gold uppercase">
                  Live ERP
                </span>
              </div>
              <p className="mt-1 text-xs text-white/75 sm:text-sm">
                {institute.branch} · {institute.academicYear}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/70">
                <span className="rounded-md bg-white/5 px-2 py-1">{institute.session}</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1">
                  <CalendarDays size={12} className="text-gold" /> {dateStr}
                </span>
                <span className="rounded-md bg-white/5 px-2 py-1 font-mono">{timeStr}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs">
              <p className="text-white/55">Signed in</p>
              <p className="font-semibold">{session?.email || institute.email}</p>
            </div>
            <button
              type="button"
              onClick={() => load(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:border-brand-red/50 hover:text-gold disabled:opacity-60"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="relative mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Institute Health Score</span>
              <Activity size={14} className="text-gold" />
            </div>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{health.score}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-red to-gold transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(100, health.score || 0))}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Fee collection</span>
              <Wallet size={14} className="text-gold" />
            </div>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{health.collectionRate}%</p>
            <p className="mt-2 text-[11px] text-white/55">Collected vs pending + collected</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Institute grade</span>
              <Trophy size={14} className="text-gold" />
            </div>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{health.grade}</p>
            <p className="mt-2 text-[11px] text-white/55">
              Attendance {health.attendanceRate}% · updated {data?.generatedAt ? relativeTime(data.generatedAt) : '—'}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <span>{error}</span>
          <button type="button" onClick={() => load()} className="font-semibold underline">
            Retry
          </button>
        </div>
      ) : null}

      <DashPanel title="Quick actions" isDark={isDark}>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((item) => (
            <button
              key={item.section}
              type="button"
              onClick={() => onNavigate?.(item.section)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white/80 hover:border-brand-red/40 hover:text-gold'
                  : 'border-slate-200 bg-slate-50 text-navy-800 hover:border-brand-red/40 hover:text-brand-red'
              }`}
            >
              <Zap size={12} />
              {item.label}
            </button>
          ))}
        </div>
      </DashPanel>

      {alerts.length ? (
        <div
          className={`flex flex-wrap gap-2 rounded-lg border px-3 py-2 ${
            isDark ? 'border-amber-400/20 bg-amber-400/10' : 'border-amber-200 bg-amber-50'
          }`}
        >
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
            <AlertTriangle size={14} /> Needs attention
          </span>
          {alerts.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => onNavigate?.(a.section)}
              className="rounded-full border border-amber-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-amber-800 hover:border-brand-red/40"
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`h-24 animate-pulse rounded-lg ${isDark ? 'bg-white/10' : 'bg-slate-200/80'}`} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} isDark={isDark} onClick={() => onNavigate?.(card.section)} />
          ))}
        </div>
      )}

      <div className="grid gap-3 xl:grid-cols-3">
        <DashPanel
          title="Admissions & enquiries (6 months)"
          className="xl:col-span-2"
          isDark={isDark}
          action={<LinkBtn isDark={isDark} onClick={() => onNavigate?.('Admissions')}>Open admissions</LinkBtn>}
        >
          <MultiLineChart
            data={charts.kpiTrend}
            series={[
              { key: 'admissions', label: 'Admissions' },
              { key: 'enquiries', label: 'Enquiries' },
            ]}
            height={260}
            isDark={isDark}
          />
        </DashPanel>
        <DashPanel title="Fee status mix" isDark={isDark} action={<LinkBtn isDark={isDark} onClick={() => onNavigate?.('Fees')}>Fees</LinkBtn>}>
          <DonutChart data={charts.feeStatus} height={260} isDark={isDark} />
        </DashPanel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <DashPanel title="Fee collection (₹)" isDark={isDark}>
          <BarMetricChart
            data={charts.feeTrend}
            yKey="collected"
            yLabel="Collected"
            height={230}
            isDark={isDark}
            formatter={(value) => formatINR(value)}
          />
        </DashPanel>
        <DashPanel title="Attendance this week (%)" isDark={isDark}>
          <AreaTrendChart
            data={charts.attendanceWeek}
            yKey="percent"
            yLabel="Attendance %"
            height={230}
            isDark={isDark}
            fillId="tnsAttendanceFill"
          />
        </DashPanel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <DashPanel title="Students by course" isDark={isDark}>
          <BarMetricChart data={charts.coursePopularity} yLabel="Students" height={220} isDark={isDark} />
        </DashPanel>
        <DashPanel title="Admission pipeline" isDark={isDark}>
          <DonutChart data={charts.admissionStatus} height={220} isDark={isDark} />
        </DashPanel>
        <DashPanel title="Lead pipeline" isDark={isDark}>
          <BarMetricChart data={charts.leadPipeline} yLabel="Leads" height={220} isDark={isDark} />
        </DashPanel>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashPanel title="Gender split" isDark={isDark}>
          <DonutChart data={charts.genderSplit} height={200} isDark={isDark} />
        </DashPanel>
        <DashPanel title="Enquiry sources" isDark={isDark}>
          <DonutChart data={charts.enquirySources} height={200} isDark={isDark} />
        </DashPanel>
        <DashPanel title="Exam results" isDark={isDark}>
          <DonutChart data={charts.examResults} height={200} isDark={isDark} />
        </DashPanel>
        <DashPanel title="Admission mode" isDark={isDark}>
          <DonutChart data={charts.admissionMode} height={200} isDark={isDark} />
        </DashPanel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <DashPanel
          title="Recent admissions"
          isDark={isDark}
          action={<LinkBtn isDark={isDark} onClick={() => onNavigate?.('Admissions')}>View all</LinkBtn>}
        >
          {lists.recentAdmissions?.length ? (
            <ul className="space-y-2">
              {lists.recentAdmissions.map((row) => (
                <li key={row.id} className={`flex items-start justify-between gap-2 border-b pb-2 last:border-0 ${rowClass}`}>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-medium ${strong}`}>{row.applicant}</p>
                    <p className={`text-[11px] ${muted}`}>
                      {row.course} · {row.mode} · {row.date}
                    </p>
                  </div>
                  <StatusBadge status={row.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyList text="No admissions yet" isDark={isDark} />
          )}
        </DashPanel>

        <DashPanel
          title="Fee dues"
          isDark={isDark}
          action={<LinkBtn isDark={isDark} onClick={() => onNavigate?.('Fees')}>Collect</LinkBtn>}
        >
          {lists.overdueFees?.length ? (
            <ul className="space-y-2">
              {lists.overdueFees.map((row) => (
                <li key={row.id} className={`flex items-start justify-between gap-2 border-b pb-2 last:border-0 ${rowClass}`}>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-medium ${strong}`}>{row.student}</p>
                    <p className={`text-[11px] ${muted}`}>
                      {row.course} · due {row.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-brand-red">{row.due}</p>
                    <StatusBadge status={row.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyList text="No pending dues" isDark={isDark} />
          )}
        </DashPanel>

        <DashPanel
          title="Upcoming exams"
          isDark={isDark}
          action={<LinkBtn isDark={isDark} onClick={() => onNavigate?.('Exam Schedule')}>Schedule</LinkBtn>}
        >
          {lists.upcomingExams?.length ? (
            <ul className="space-y-2">
              {lists.upcomingExams.map((row) => (
                <li key={row.id} className={`flex items-start justify-between gap-2 border-b pb-2 last:border-0 ${rowClass}`}>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-medium ${strong}`}>{row.title}</p>
                    <p className={`text-[11px] ${muted}`}>
                      {row.course} · {row.batch} · {row.assigned} assigned
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[11px] font-semibold ${isDark ? 'text-gold' : 'text-navy-700'}`}>{row.start}</p>
                    <StatusBadge status={row.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyList text="No upcoming exams" isDark={isDark} />
          )}
        </DashPanel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <DashPanel
          title="Running batches"
          isDark={isDark}
          action={<LinkBtn isDark={isDark} onClick={() => onNavigate?.('Batches')}>Batches</LinkBtn>}
        >
          {lists.runningBatches?.length ? (
            <ul className="space-y-3">
              {lists.runningBatches.map((row) => (
                <li key={row.id}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-medium ${strong}`}>{row.name}</p>
                      <p className={`text-[11px] ${muted}`}>
                        {row.course} · {row.enrolled}/{row.capacity} seats
                      </p>
                    </div>
                    <span className={`text-xs font-semibold ${isDark ? 'text-gold' : 'text-navy-700'}`}>{row.progress}%</span>
                  </div>
                  <ProgressBar value={row.progress} color="teal" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyList text="No running batches" isDark={isDark} />
          )}
        </DashPanel>

        <DashPanel
          title="Latest enquiries"
          isDark={isDark}
          action={<LinkBtn isDark={isDark} onClick={() => onNavigate?.('Enquiry Management')}>Enquiry</LinkBtn>}
        >
          {lists.recentEnquiries?.length ? (
            <ul className="space-y-2">
              {lists.recentEnquiries.map((row) => (
                <li key={row.id} className={`border-b pb-2 last:border-0 ${rowClass}`}>
                  <p className={`text-sm font-medium ${strong}`}>{row.name}</p>
                  <p className={`text-[11px] ${muted}`}>
                    {row.interest} · {row.source} · {row.date}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyList text="No enquiries yet" isDark={isDark} />
          )}
        </DashPanel>

        <DashPanel
          title="Recent activity"
          isDark={isDark}
          action={<LinkBtn isDark={isDark} onClick={() => onNavigate?.('Audit Logs')}>Audit logs</LinkBtn>}
        >
          {lists.recentActivity?.length ? (
            <ul className="space-y-2">
              {lists.recentActivity.map((row) => (
                <li key={row.id} className={`border-b pb-2 last:border-0 ${rowClass}`}>
                  <p className={`text-sm ${strong}`}>{row.message}</p>
                  <p className={`text-[11px] ${muted}`}>
                    {row.section} · {row.actor} · {relativeTime(row.at)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyList text="No activity yet" isDark={isDark} />
          )}
        </DashPanel>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Students', hint: `${kpis.students?.active || 0} active`, icon: GraduationCap, section: 'Students' },
          { label: 'Pending fees', hint: kpis.fees?.pendingLabel || '₹0', icon: Wallet, section: 'Fees' },
          { label: 'New admission', hint: 'Open admission form', icon: ClipboardList, section: 'New Admission' },
        ].map((item) => (
          <button
            key={item.section}
            type="button"
            onClick={() => onNavigate?.(item.section)}
            className={`flex items-center gap-2.5 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
              isDark ? 'border-white/10 bg-navy-900/80' : 'border-slate-200 bg-white'
            }`}
          >
            <item.icon size={18} className="text-brand-red" />
            <span>
              <span className={`block text-sm font-semibold ${strong}`}>{item.label}</span>
              <span className={`text-[11px] ${muted}`}>{item.hint}</span>
            </span>
            <ArrowRight size={14} className={`ml-auto ${muted}`} />
          </button>
        ))}
      </div>
    </section>
  )
}
