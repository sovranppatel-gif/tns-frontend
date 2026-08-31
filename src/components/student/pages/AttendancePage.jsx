import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Download, Filter, Loader2 } from 'lucide-react'
import { getMyAttendance } from '../../../services/studentAttendanceService.js'
import { AttendanceTrendChart } from '../shared/StudentCharts.jsx'
import { Panel, PrimaryButton, StatCard, StatusBadge } from '../shared/StudentUI.jsx'

const statusColor = {
  present: 'bg-emerald-500',
  absent: 'bg-rose-500',
  leave: 'bg-sky-500',
  late: 'bg-amber-500',
  holiday: 'bg-slate-300',
}

function currentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function downloadCsv(rows, monthLabel) {
  const headers = [
    'Date',
    'Status',
    'Course',
    'Semester',
    'Method',
    'Note',
    'Attendance ID',
  ]
  const lines = [headers.join(',')]
  rows.forEach((row) => {
    const cells = [
      row.dateLabel || row.date || '',
      row.status || '',
      row.courseName || row.course || '',
      row.semesterTitle || row.semester || '',
      row.method || '',
      row.note || '',
      row.attendanceId || '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`)
    lines.push(cells.join(','))
  })

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `attendance-${String(monthLabel || 'report').replace(/\s+/g, '-').toLowerCase()}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function AttendancePage() {
  const [month, setMonth] = useState(currentMonthValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    attendancePercent: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 0,
  })
  const [calendar, setCalendar] = useState({
    year: new Date().getFullYear(),
    monthIndex: new Date().getMonth(),
    month: '',
    daysInMonth: 31,
    days: {},
  })
  const [trend, setTrend] = useState([])
  const [subjects, setSubjects] = useState([])
  const [months, setMonths] = useState([])
  const [rows, setRows] = useState([])

  const load = useCallback(async (monthValue) => {
    setLoading(true)
    setError('')
    try {
      const data = await getMyAttendance({ month: monthValue })
      setStats(data.stats || {})
      setCalendar(
        data.calendar || {
          year: new Date().getFullYear(),
          monthIndex: new Date().getMonth(),
          month: '',
          daysInMonth: 31,
          days: {},
        },
      )
      setTrend(data.trend || [])
      setSubjects(data.subjects || [])
      setMonths(data.months || [])
      setRows(data.rows || [])
      if (data.meta?.selectedMonth) {
        setMonth(data.meta.selectedMonth)
      }
    } catch (err) {
      setError(err?.message || 'Unable to load attendance')
      setStats({
        attendancePercent: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        leaveDays: 0,
      })
      setCalendar({
        year: new Date().getFullYear(),
        monthIndex: new Date().getMonth(),
        month: '',
        daysInMonth: 31,
        days: {},
      })
      setTrend([])
      setSubjects([])
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(month)
  }, [month, load])

  const firstDow = useMemo(() => {
    const y = Number(calendar.year) || new Date().getFullYear()
    const mi = Number.isFinite(calendar.monthIndex)
      ? calendar.monthIndex
      : new Date().getMonth()
    return new Date(y, mi, 1).getDay()
  }, [calendar.year, calendar.monthIndex])

  const daysInMonth = Number(calendar.daysInMonth) || 31

  const cells = useMemo(() => {
    const arr = []
    for (let i = 0; i < firstDow; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ day: d, status: calendar.days?.[d] || calendar.days?.[String(d)] || null })
    }
    return arr
  }, [firstDow, daysInMonth, calendar.days])

  const monthOptions =
    months.length > 0
      ? months
      : [{ value: month, label: calendar.month || month }]

  const handleDownload = () => {
    if (!rows.length) {
      setError('No attendance records to download for this month')
      return
    }
    downloadCsv(rows, calendar.month || month)
  }

  return (
    <section className="space-y-3">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Attendance %"
          value={`${stats.attendancePercent ?? 0}%`}
          icon={CalendarDays}
        />
        <StatCard label="Present Days" value={stats.presentDays ?? 0} />
        <StatCard label="Absent Days" value={stats.absentDays ?? 0} />
        <StatCard label="Late Marks" value={stats.lateDays ?? 0} />
        <StatCard label="Leave Days" value={stats.leaveDays ?? 0} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#008C95]" />
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            disabled={loading}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-[#00A896]"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <PrimaryButton type="button" onClick={handleDownload} disabled={loading || !rows.length}>
          <Download size={14} />
          Download Report
        </PrimaryButton>
      </div>

      {loading ? (
        <Panel title="Loading attendance">
          <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin text-[#FF5E14]" />
            Fetching your attendance from the server…
          </div>
        </Panel>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title={`Monthly Calendar · ${calendar.month || month}`}>
              <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
                {Object.entries(statusColor).map(([k, c]) => (
                  <span key={k} className="inline-flex items-center gap-1.5 capitalize">
                    <span className={`h-2.5 w-2.5 rounded-full ${c}`} />
                    {k}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, i) =>
                  cell ? (
                    <div
                      key={i}
                      className="flex aspect-square flex-col items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-xs text-slate-700"
                      title={cell.status ? String(cell.status) : undefined}
                    >
                      <span>{cell.day}</span>
                      {cell.status ? (
                        <span
                          className={`mt-0.5 h-1.5 w-1.5 rounded-full ${statusColor[cell.status] || 'bg-slate-300'}`}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <div key={i} />
                  ),
                )}
              </div>
              {!Object.keys(calendar.days || {}).length ? (
                <p className="mt-3 text-center text-xs text-slate-400">
                  No attendance marked for this month yet.
                </p>
              ) : null}
            </Panel>

            <Panel title="Attendance Trend">
              {trend.length ? (
                <AttendanceTrendChart data={trend} />
              ) : (
                <p className="py-10 text-center text-sm text-slate-400">
                  Trend will appear once attendance is marked.
                </p>
              )}
            </Panel>
          </div>

          <Panel title="Course-wise Attendance">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="px-3 py-3 font-medium">Course</th>
                    <th className="px-3 py-3 font-medium">Present</th>
                    <th className="px-3 py-3 font-medium">Absent</th>
                    <th className="px-3 py-3 font-medium">Late</th>
                    <th className="px-3 py-3 font-medium">%</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                        No course attendance records found yet.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((row) => (
                      <tr key={row.subject} className="border-b border-slate-100">
                        <td className="px-3 py-3 font-medium text-slate-800">{row.subject}</td>
                        <td className="px-3 py-3">{row.present}</td>
                        <td className="px-3 py-3">{row.absent}</td>
                        <td className="px-3 py-3">{row.late}</td>
                        <td className="px-3 py-3 font-semibold text-[#008C95]">{row.percent}%</td>
                        <td className="px-3 py-3">
                          <StatusBadge
                            status={
                              row.percent >= 90
                                ? 'Present'
                                : row.percent >= 75
                                  ? 'Partial'
                                  : 'Absent'
                            }
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </section>
  )
}
