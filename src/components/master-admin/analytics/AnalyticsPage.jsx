import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { getAnalyticsOverview } from '../../../services/analyticsService.js'
import { getReportsMeta } from '../../../services/reportService.js'
import { DateInput, formatDisplayDate } from '../../shared/DateInput.jsx'
import { Panel, Tabs, formatINR } from '../shared/MasterAdminUI.jsx'
import {
  AreaTrendChart,
  BarMetricChart,
  DonutChart,
  GroupedBarChart,
  MultiLineChart,
} from '../shared/MasterAdminCharts.jsx'
import { card, primaryBtn, secondaryBtn } from '../../../utils/masterAdminTheme.js'

const inputClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00A896]'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'admissions', label: 'Admissions' },
  { id: 'fees', label: 'Fees' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'exams', label: 'Exams' },
]

const PRESETS = [
  { id: '30d', label: '30 days', months: 0, days: 30 },
  { id: '90d', label: '90 days', months: 0, days: 90 },
  { id: '6m', label: '6 months', months: 5, days: 0 },
  { id: '12m', label: '12 months', months: 11, days: 0 },
]

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDaysKey(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthsAgoKey(monthsBack) {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsBack)
  d.setDate(1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function defaultFilters() {
  return {
    from: monthsAgoKey(5),
    to: todayKey(),
    universityId: '',
    courseId: '',
    batchId: '',
    session: '',
    preset: '6m',
  }
}

function Field({ label, children }) {
  return (
    <label className="min-w-0 space-y-1">
      <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{label}</span>
      {children}
    </label>
  )
}

function Delta({ value }) {
  if (value == null || Number.isNaN(Number(value))) return null
  const n = Number(value)
  if (n === 0) return <span className="text-[11px] font-medium text-slate-400">Same as last period</span>
  const up = n > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
      <Icon size={12} />
      {up ? '+' : ''}
      {n}% vs last period
    </span>
  )
}

function Kpi({ label, value, hint, delta }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 bg-gradient-to-r from-brand-red to-navy-800 bg-clip-text text-2xl font-semibold tabular-nums text-transparent">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
      <div className="mt-1">
        <Delta value={delta} />
      </div>
    </article>
  )
}

function InsightCard({ item }) {
  const tone =
    item.tone === 'warn'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : item.tone === 'good'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : 'border-sky-200 bg-sky-50 text-sky-900'
  const Icon = item.tone === 'warn' ? AlertTriangle : item.tone === 'good' ? CheckCircle2 : Info
  return (
    <article className={`rounded-lg border p-3 ${tone}`}>
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold">
        <Icon size={14} /> {item.title}
      </p>
      <p className="mt-1 text-sm">{item.text}</p>
    </article>
  )
}

export default function AnalyticsPage({ onNavigate }) {
  const [filters, setFilters] = useState(defaultFilters)
  const [meta, setMeta] = useState({ universities: [], courses: [], batches: [], sessions: [] })
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestIdRef = useRef(0)

  const courses = useMemo(() => {
    const list = meta.courses || []
    if (!filters.universityId) return list
    return list.filter((c) => !c.universityId || c.universityId === filters.universityId)
  }, [meta.courses, filters.universityId])

  const batches = useMemo(() => {
    let list = meta.batches || []
    if (filters.universityId) list = list.filter((b) => !b.universityId || b.universityId === filters.universityId)
    if (filters.courseId) list = list.filter((b) => !b.courseId || b.courseId === filters.courseId)
    return list
  }, [meta.batches, filters.universityId, filters.courseId])

  const loadMeta = useCallback(async () => {
    try {
      setMeta(await getReportsMeta())
    } catch {
      /* keep empty filters */
    }
  }, [])

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError('')
    try {
      const next = await getAnalyticsOverview({
        from: filters.from,
        to: filters.to,
        universityId: filters.universityId,
        courseId: filters.courseId,
        batchId: filters.batchId,
        session: filters.session,
      })
      if (requestId !== requestIdRef.current) return
      setData(next)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setData(null)
      setError(err.message || 'Unable to load analytics')
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  useEffect(() => {
    load()
  }, [load])

  const patch = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value, preset: key === 'from' || key === 'to' ? '' : prev.preset }
      if (key === 'universityId') {
        next.courseId = ''
        next.batchId = ''
      }
      if (key === 'courseId') next.batchId = ''
      return next
    })
  }

  const applyPreset = (preset) => {
    const item = PRESETS.find((p) => p.id === preset)
    if (!item) return
    setFilters((prev) => ({
      ...prev,
      preset,
      to: todayKey(),
      from: item.days ? addDaysKey(item.days - 1) : monthsAgoKey(item.months),
    }))
  }

  const kpis = data?.kpis || {}
  const charts = data?.charts || {}
  const insights = data?.insights || []
  const inr = (value) => formatINR(value)

  return (
    <section className="space-y-3">
      <div className={`${card} space-y-3 p-3`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-navy-900">{data?.title || 'Institute analytics'}</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {data?.description || 'Trends and period-over-period comparison from live ERP data.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondaryBtn} onClick={() => onNavigate?.('Reports')}>
              Reports <ArrowRight size={14} />
            </button>
            <button type="button" className={primaryBtn} onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => applyPreset(item.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                filters.preset === item.id
                  ? 'border-brand-red bg-brand-red text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-brand-red/40'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Field label="From">
            <DateInput value={filters.from} onChange={(e) => patch('from', e.target.value)} className={inputClass} />
          </Field>
          <Field label="To">
            <DateInput value={filters.to} onChange={(e) => patch('to', e.target.value)} className={inputClass} />
          </Field>
          <Field label="University">
            <select className={inputClass} value={filters.universityId} onChange={(e) => patch('universityId', e.target.value)}>
              <option value="">All</option>
              {meta.universities.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Course">
            <select className={inputClass} value={filters.courseId} onChange={(e) => patch('courseId', e.target.value)}>
              <option value="">All</option>
              {courses.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Batch">
            <select className={inputClass} value={filters.batchId} onChange={(e) => patch('batchId', e.target.value)}>
              <option value="">All</option>
              {batches.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Session">
            <select className={inputClass} value={filters.session} onChange={(e) => patch('session', e.target.value)}>
              <option value="">All</option>
              {meta.sessions.map((row) => (
                <option key={row} value={row}>
                  {row}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="text-[11px] text-slate-400">
          {formatDisplayDate(filters.from)} – {formatDisplayDate(filters.to)}
          {data?.filters?.previousFrom
            ? ` · compared with ${formatDisplayDate(data.filters.previousFrom)} – ${formatDisplayDate(data.filters.previousTo)}`
            : ''}
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Active students"
          value={kpis.activeStudents?.value ?? '—'}
          hint={`${kpis.activeStudents?.total || 0} total on roll`}
        />
        <Kpi
          label="New in period"
          value={kpis.newStudents?.value ?? '—'}
          delta={kpis.newStudents?.delta}
        />
        <Kpi
          label="Admissions"
          value={kpis.admissions?.value ?? '—'}
          hint={`${kpis.enquiries?.value || 0} enquiries`}
          delta={kpis.admissions?.delta}
        />
        <Kpi
          label="Collected in period"
          value={kpis.collected?.label || inr(kpis.collected?.value)}
          hint={`${kpis.collectionRate?.value || 0}% overall rate · ${kpis.pending?.label || '₹0'} pending`}
          delta={kpis.collected?.delta}
        />
        <Kpi label="Attendance" value={`${kpis.attendance?.value ?? 0}%`} delta={kpis.attendance?.delta} />
        <Kpi
          label="Exam pass rate"
          value={`${kpis.passRate?.value ?? 0}%`}
          hint={`Average ${kpis.examAverage?.value || 0}%`}
          delta={kpis.passRate?.delta}
        />
        <Kpi label="Conversion" value={`${kpis.conversionRate?.value ?? 0}%`} hint="Approved admissions / enquiries" />
        <Kpi label="Enquiries" value={kpis.enquiries?.value ?? '—'} delta={kpis.enquiries?.delta} />
      </div>

      {insights.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {insights.map((item) => (
            <InsightCard key={item.title} item={item} />
          ))}
        </div>
      ) : null}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' ? (
        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-3">
            <Panel title="Admissions, enquiries & collection" className="xl:col-span-2">
              <MultiLineChart
                data={charts.monthly}
                series={[
                  { key: 'admissions', label: 'Admissions' },
                  { key: 'enquiries', label: 'Enquiries' },
                ]}
                height={260}
              />
            </Panel>
            <Panel title="Fee account mix">
              <DonutChart data={charts.feeStatus} height={260} />
            </Panel>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Students by course">
              <BarMetricChart data={charts.studentsByCourse} yLabel="Students" height={230} />
            </Panel>
            <Panel title="Attendance trend">
              <AreaTrendChart data={charts.attendance} yKey="percent" yLabel="Attendance %" height={230} fillId="tnsAnalyticsAtt" />
            </Panel>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Panel title="Gender">
              <DonutChart data={charts.studentsByGender} height={200} />
            </Panel>
            <Panel title="Admission pipeline">
              <DonutChart data={charts.admissionStatus} height={200} />
            </Panel>
            <Panel title="Enquiry sources">
              <DonutChart data={charts.enquirySources} height={200} />
            </Panel>
            <Panel title="Exam results">
              <DonutChart data={charts.examResults} height={200} />
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === 'admissions' ? (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Monthly admissions vs enquiries">
              <GroupedBarChart
                data={charts.monthly}
                series={[
                  { key: 'admissions', label: 'Admissions' },
                  { key: 'enquiries', label: 'Enquiries' },
                ]}
                height={250}
              />
            </Panel>
            <Panel title="Conversion funnel">
              <BarMetricChart data={charts.funnel} yLabel="Count" height={250} />
            </Panel>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Panel title="Status">
              <DonutChart data={charts.admissionStatus} height={220} />
            </Panel>
            <Panel title="Mode">
              <DonutChart data={charts.admissionMode} height={220} />
            </Panel>
            <Panel title="Course demand">
              <BarMetricChart data={charts.admissionCourse} yLabel="Forms" height={220} />
            </Panel>
            <Panel title="Lead pipeline">
              <BarMetricChart data={charts.leadPipeline} yLabel="Leads" height={220} />
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === 'fees' ? (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Monthly collection">
              <AreaTrendChart
                data={charts.feeMonthly}
                yKey="collected"
                yLabel="Collected"
                height={250}
                fillId="tnsAnalyticsFee"
              />
            </Panel>
            <Panel title="Collection by course">
              <GroupedBarChart
                data={charts.feeByCourse}
                series={[
                  { key: 'collected', label: 'Collected' },
                  { key: 'pending', label: 'Pending' },
                ]}
                height={250}
                formatter={(value) => inr(value)}
              />
            </Panel>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Panel title="Account status">
              <DonutChart data={charts.feeStatus} height={230} />
            </Panel>
            <Panel title="Payment mode (this period)">
              <DonutChart data={charts.paymentMethods} height={230} />
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === 'attendance' ? (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Attendance % over time">
              <AreaTrendChart data={charts.attendance} yKey="percent" yLabel="Attendance %" height={250} fillId="tnsAnalyticsAttTab" />
            </Panel>
            <Panel title="Course-wise %">
              <BarMetricChart data={charts.attendanceByCourse} yLabel="%" height={250} />
            </Panel>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Panel title="Mark mix">
              <DonutChart data={charts.attendanceStatus} height={230} />
            </Panel>
            <Panel title="Students by status">
              <DonutChart data={charts.studentsByStatus} height={230} />
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === 'exams' ? (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Pass / fail by month">
              <GroupedBarChart
                data={charts.examMonthly}
                series={[
                  { key: 'passed', label: 'Pass' },
                  { key: 'failed', label: 'Fail' },
                ]}
                height={250}
              />
            </Panel>
            <Panel title="Results by course">
              <GroupedBarChart
                data={charts.examByCourse}
                series={[
                  { key: 'passed', label: 'Pass' },
                  { key: 'failed', label: 'Fail' },
                ]}
                height={250}
              />
            </Panel>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Panel title="Overall result">
              <DonutChart data={charts.examResults} height={230} />
            </Panel>
            <Panel title="Category mix">
              <DonutChart data={charts.studentsByCategory} height={230} />
            </Panel>
          </div>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-slate-200/80" />
          ))}
        </div>
      ) : null}

      <p className="text-[11px] text-slate-400">
        {data?.generatedAt ? `Generated ${new Date(data.generatedAt).toLocaleString('en-IN')}` : ''}
        {' · '}
        Comparison is the equal-length window immediately before the selected dates.
      </p>
    </section>
  )
}
