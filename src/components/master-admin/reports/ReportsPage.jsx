import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  IndianRupee,
  Printer,
  RefreshCw,
  UserX,
  Users,
  Wallet,
} from 'lucide-react'
import { getReport, getReportsMeta } from '../../../services/reportService.js'
import { DateInput, formatDisplayDate } from '../../shared/DateInput.jsx'
import {
  DataTable,
  Pagination,
  Panel,
  StatCard,
  StatusBadge,
  downloadCsv,
  useClientTable,
} from '../shared/MasterAdminUI.jsx'
import { BarMetricChart as BarChart, DonutChart as PieChart } from '../shared/MasterAdminCharts.jsx'
import { card, primaryBtn, secondaryBtn } from '../../../utils/masterAdminTheme.js'
import { printInstituteReport } from '../../../utils/printReport.js'

const inputClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00A896]'

function monthStartKey() {
  const d = new Date()
  if (d.getDate() <= 7) d.setMonth(d.getMonth() - 1)
  d.setDate(1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const REPORTS = [
  {
    id: 'overview',
    label: 'Monthly Institute',
    hint: 'Owner snapshot',
    icon: BarChart3,
  },
  {
    id: 'students',
    label: 'Student Strength',
    hint: 'Course · category · docs',
    icon: Users,
  },
  {
    id: 'admissions',
    label: 'Admissions',
    hint: 'Enquiry conversion',
    icon: ClipboardList,
  },
  {
    id: 'fees',
    label: 'Fee Collection',
    hint: 'Paid vs pending',
    icon: Wallet,
  },
  {
    id: 'defaulters',
    label: 'Defaulters',
    hint: 'Outstanding dues',
    icon: IndianRupee,
  },
  {
    id: 'attendance',
    label: 'Attendance',
    hint: 'Shortage below 75%',
    icon: UserX,
  },
  {
    id: 'exams',
    label: 'Exam Results',
    hint: 'Pass · fail · toppers',
    icon: GraduationCap,
  },
  {
    id: 'people',
    label: 'Faculty & Staff',
    hint: 'Load and headcount',
    icon: Users,
  },
]

function Field({ label, children }) {
  return (
    <label className="min-w-0 space-y-1">
      <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{label}</span>
      {children}
    </label>
  )
}

function emptyFilters() {
  return {
    from: monthStartKey(),
    to: todayKey(),
    universityId: '',
    courseId: '',
    batchId: '',
    session: '',
    threshold: '75',
    shortageOnly: false,
  }
}

export default function ReportsPage() {
  const [type, setType] = useState('overview')
  const [filters, setFilters] = useState(emptyFilters)
  const [meta, setMeta] = useState({ universities: [], courses: [], batches: [], sessions: [] })
  const [report, setReport] = useState(null)
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
    if (filters.universityId) {
      list = list.filter((b) => !b.universityId || b.universityId === filters.universityId)
    }
    if (filters.courseId) {
      list = list.filter((b) => !b.courseId || b.courseId === filters.courseId)
    }
    return list
  }, [meta.batches, filters.universityId, filters.courseId])

  const loadMeta = useCallback(async () => {
    try {
      const next = await getReportsMeta()
      setMeta(next)
    } catch {
      /* filters stay empty */
    }
  }, [])

  const loadReport = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError('')
    try {
      const next = await getReport(type, {
        from: filters.from,
        to: filters.to,
        universityId: filters.universityId,
        courseId: filters.courseId,
        batchId: filters.batchId,
        session: filters.session,
        threshold: filters.threshold,
        shortageOnly: filters.shortageOnly ? 'true' : '',
      })
      if (requestId !== requestIdRef.current) return
      setReport(next)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setReport(null)
      setError(err.message || 'Unable to load report')
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [type, filters])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const patchFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'universityId') {
        next.courseId = ''
        next.batchId = ''
      }
      if (key === 'courseId') next.batchId = ''
      return next
    })
  }

  const stats = report?.stats || {}
  const charts = report?.charts || {}
  const lists = report?.lists || {}
  const rows = Array.isArray(report?.rows) ? report.rows : []
  const payments = Array.isArray(report?.payments) ? report.payments : []
  const facultyRows = Array.isArray(report?.facultyRows) ? report.facultyRows : []
  const staffRows = Array.isArray(report?.staffRows) ? report.staffRows : []

  const periodLabel = `Period ${formatDisplayDate(filters.from)} to ${formatDisplayDate(filters.to)}`
  const filterBits = [
    meta.universities.find((u) => u.id === filters.universityId)?.name,
    courses.find((c) => c.id === filters.courseId)?.name,
    batches.find((b) => b.id === filters.batchId)?.name,
    filters.session,
  ].filter(Boolean)
  const filterLabel = filterBits.length ? filterBits.join(' · ') : 'All courses / batches'

  const kpiCards = useMemo(() => {
    if (type === 'students') {
      return [
        { label: 'Total students', value: stats.total ?? 0, hint: `${stats.newInPeriod || 0} admitted in period` },
        { label: 'Active', value: stats.active ?? 0 },
        { label: 'Completed', value: stats.completed ?? 0 },
        { label: 'Incomplete profiles', value: stats.incomplete ?? 0, hint: 'No photo or documents' },
      ]
    }
    if (type === 'admissions') {
      return [
        { label: 'Admissions', value: stats.total ?? 0, hint: `${stats.pending || 0} pending review` },
        { label: 'Approved', value: stats.approved ?? 0 },
        { label: 'Enquiries', value: stats.enquiries ?? 0, hint: `${stats.leads || 0} leads` },
        { label: 'Conversion', value: `${stats.conversionRate ?? 0}%` },
      ]
    }
    if (type === 'fees') {
      return [
        { label: 'Collected (period)', value: stats.periodCollectedLabel || '₹0', hint: `${stats.periodPayments || 0} receipts` },
        { label: 'Collected (all-time)', value: stats.collectedLabel || '₹0' },
        { label: 'Pending', value: stats.pendingLabel || '₹0' },
        { label: 'Collection rate', value: `${stats.collectionRate ?? 0}%` },
      ]
    }
    if (type === 'defaulters') {
      return [
        { label: 'Defaulters', value: stats.count ?? 0 },
        { label: 'Total due', value: stats.dueLabel || '₹0' },
        { label: 'Overdue accounts', value: stats.overdue ?? 0 },
        { label: 'Partial', value: stats.partial ?? 0 },
      ]
    }
    if (type === 'attendance') {
      return [
        { label: 'Attendance', value: `${stats.percent ?? 0}%`, hint: `${stats.students || 0} students marked` },
        { label: 'Average student %', value: `${stats.average ?? 0}%` },
        { label: `Below ${stats.threshold || 75}%`, value: stats.below ?? 0 },
        { label: 'Absent marks', value: stats.absent ?? 0, hint: `${stats.late || 0} late · ${stats.leave || 0} leave` },
      ]
    }
    if (type === 'exams') {
      return [
        { label: 'Results', value: stats.total ?? 0 },
        { label: 'Pass rate', value: `${stats.passRate ?? 0}%` },
        { label: 'Passed', value: stats.passed ?? 0 },
        { label: 'Average score', value: `${stats.average ?? 0}%` },
      ]
    }
    if (type === 'people') {
      return [
        { label: 'Active faculty', value: stats.facultyActive ?? 0, hint: `${stats.faculty || 0} total` },
        { label: 'Active staff', value: stats.staffActive ?? 0, hint: `${stats.staff || 0} total` },
        { label: 'Teaching assignments', value: stats.assignments ?? 0 },
        { label: 'Joined in period', value: (stats.facultyJoined || 0) + (stats.staffJoined || 0) },
      ]
    }
    return [
      { label: 'Health score', value: stats.health ?? 0, hint: 'Collection + attendance + conversion + pass' },
      { label: 'Active students', value: stats.activeStudents ?? 0, hint: `${stats.students || 0} total` },
      { label: 'Collected in period', value: stats.collectedLabel || '₹0', hint: `${stats.collectionRate || 0}% overall rate` },
      { label: 'Fee pending', value: stats.pendingLabel || '₹0', hint: `${stats.overdueLabel || '₹0'} overdue` },
      { label: 'Attendance', value: `${stats.attendancePercent ?? 0}%`, hint: `${stats.attendanceShortage || 0} below 75%` },
      { label: 'Admissions', value: stats.admissions ?? 0, hint: `${stats.pendingAdmissions || 0} pending` },
      { label: 'Exam pass rate', value: `${stats.examPassRate ?? 0}%`, hint: `avg ${stats.examAverage || 0}%` },
      { label: 'Faculty / staff', value: `${stats.faculty || 0} / ${stats.staff || 0}` },
    ]
  }, [type, stats])

  const tableConfig = useMemo(() => {
    if (type === 'students') {
      return {
        searchKeys: ['studentId', 'name', 'course', 'batch', 'mobile', 'status'],
        columns: [
          { key: 'studentId', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'course', label: 'Course' },
          { key: 'batch', label: 'Batch' },
          { key: 'category', label: 'Category' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'documents', label: 'Docs' },
          { key: 'incomplete', label: 'Profile', render: (row) => (row.incomplete ? 'Incomplete' : 'OK') },
        ],
        exportCols: [
          { key: 'studentId', label: 'Student ID' },
          { key: 'name', label: 'Name' },
          { key: 'course', label: 'Course' },
          { key: 'batch', label: 'Batch' },
          { key: 'session', label: 'Session' },
          { key: 'gender', label: 'Gender' },
          { key: 'category', label: 'Category' },
          { key: 'status', label: 'Status' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'documents', label: 'Documents' },
          { key: 'admitted', label: 'Admitted' },
        ],
      }
    }
    if (type === 'admissions') {
      return {
        searchKeys: ['admissionId', 'applicant', 'course', 'phone', 'status'],
        columns: [
          { key: 'admissionId', label: 'ID' },
          { key: 'applicant', label: 'Applicant' },
          { key: 'course', label: 'Course' },
          { key: 'mode', label: 'Mode' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'counsellor', label: 'Counsellor' },
          { key: 'date', label: 'Date' },
        ],
        exportCols: [
          { key: 'admissionId', label: 'Admission ID' },
          { key: 'applicant', label: 'Applicant' },
          { key: 'course', label: 'Course' },
          { key: 'mode', label: 'Mode' },
          { key: 'status', label: 'Status' },
          { key: 'phone', label: 'Phone' },
          { key: 'counsellor', label: 'Counsellor' },
          { key: 'session', label: 'Session' },
          { key: 'date', label: 'Date' },
        ],
      }
    }
    if (type === 'fees') {
      return {
        searchKeys: ['feeId', 'student', 'course', 'status'],
        columns: [
          { key: 'feeId', label: 'Fee ID' },
          { key: 'student', label: 'Student' },
          { key: 'course', label: 'Course' },
          { key: 'billedLabel', label: 'Billed' },
          { key: 'paidLabel', label: 'Paid' },
          { key: 'dueLabel', label: 'Due' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'nextDue', label: 'Next due' },
        ],
        exportCols: [
          { key: 'feeId', label: 'Fee ID' },
          { key: 'student', label: 'Student' },
          { key: 'course', label: 'Course' },
          { key: 'billed', label: 'Billed' },
          { key: 'paid', label: 'Paid' },
          { key: 'due', label: 'Due' },
          { key: 'status', label: 'Status' },
          { key: 'nextDue', label: 'Next due' },
          { key: 'phone', label: 'Phone' },
        ],
      }
    }
    if (type === 'defaulters') {
      return {
        searchKeys: ['feeId', 'student', 'course', 'phone'],
        columns: [
          { key: 'student', label: 'Student' },
          { key: 'course', label: 'Course' },
          { key: 'dueLabel', label: 'Due' },
          { key: 'paidLabel', label: 'Paid' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'nextDue', label: 'Next due' },
          { key: 'phone', label: 'Phone' },
        ],
        exportCols: [
          { key: 'feeId', label: 'Fee ID' },
          { key: 'student', label: 'Student' },
          { key: 'course', label: 'Course' },
          { key: 'due', label: 'Due' },
          { key: 'paid', label: 'Paid' },
          { key: 'billed', label: 'Billed' },
          { key: 'status', label: 'Status' },
          { key: 'nextDue', label: 'Next due' },
          { key: 'phone', label: 'Phone' },
        ],
      }
    }
    if (type === 'attendance') {
      return {
        searchKeys: ['student', 'studentCode', 'course', 'batch', 'status'],
        columns: [
          { key: 'student', label: 'Student' },
          { key: 'course', label: 'Course' },
          { key: 'batch', label: 'Batch' },
          { key: 'present', label: 'Present' },
          { key: 'absent', label: 'Absent' },
          { key: 'late', label: 'Late' },
          { key: 'marked', label: 'Marked' },
          { key: 'percent', label: '%', render: (row) => `${row.percent}%` },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ],
        exportCols: [
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
        ],
      }
    }
    if (type === 'exams') {
      return {
        searchKeys: ['student', 'exam', 'course', 'result'],
        columns: [
          { key: 'student', label: 'Student' },
          { key: 'exam', label: 'Exam' },
          { key: 'course', label: 'Course' },
          { key: 'marks', label: 'Marks' },
          { key: 'percent', label: '%', render: (row) => `${row.percent}%` },
          { key: 'result', label: 'Result', render: (row) => <StatusBadge status={row.result} /> },
          { key: 'date', label: 'Date' },
        ],
        exportCols: [
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
        ],
      }
    }
    if (type === 'people') {
      return {
        searchKeys: ['code', 'name', 'department', 'designation'],
        columns: [
          { key: 'code', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'designation', label: 'Designation' },
          { key: 'department', label: 'Department' },
          { key: 'assignments', label: 'Load' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ],
        exportCols: [
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
        ],
      }
    }
    return {
      searchKeys: ['label', 'value'],
      columns: [
        { key: 'label', label: 'Metric' },
        { key: 'value', label: 'Value' },
      ],
      exportCols: [
        { key: 'label', label: 'Metric' },
        { key: 'value', label: 'Value' },
      ],
    }
  }, [type])

  const mainRows = type === 'people' ? facultyRows : rows
  const table = useClientTable(mainRows, { searchKeys: tableConfig.searchKeys, pageSize: 12 })
  const paymentTable = useClientTable(payments, {
    searchKeys: ['feeId', 'student', 'invoice', 'method'],
    pageSize: 10,
  })
  const staffTable = useClientTable(staffRows, {
    searchKeys: ['code', 'name', 'department', 'category'],
    pageSize: 12,
  })

  const staffColumns = [
    { key: 'code', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Department' },
    { key: 'category', label: 'Category' },
    { key: 'shift', label: 'Shift' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ]

  const paymentColumns = [
    { key: 'date', label: 'Date' },
    { key: 'student', label: 'Student' },
    { key: 'course', label: 'Course' },
    { key: 'amountLabel', label: 'Amount' },
    { key: 'method', label: 'Method' },
    { key: 'invoice', label: 'Invoice' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ]

  const exportCurrent = () => {
    const stamp = `${filters.from}_to_${filters.to}`
    if (type === 'people') {
      downloadCsv(`tns-faculty-${stamp}.csv`, tableConfig.exportCols, facultyRows)
      downloadCsv(
        `tns-staff-${stamp}.csv`,
        [
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
        ],
        staffRows,
      )
      return
    }
    if (type === 'fees') {
      downloadCsv(`tns-fee-accounts-${stamp}.csv`, tableConfig.exportCols, rows)
      downloadCsv(
        `tns-fee-receipts-${stamp}.csv`,
        [
          { key: 'date', label: 'Date' },
          { key: 'feeId', label: 'Fee ID' },
          { key: 'student', label: 'Student' },
          { key: 'course', label: 'Course' },
          { key: 'amount', label: 'Amount' },
          { key: 'method', label: 'Method' },
          { key: 'invoice', label: 'Invoice' },
          { key: 'status', label: 'Status' },
        ],
        payments,
      )
      return
    }
    downloadCsv(`tns-${type}-${stamp}.csv`, tableConfig.exportCols, table.filtered)
  }

  const printCurrent = () => {
    const printStats = kpiCards.map((k) => ({ label: k.label, value: k.value }))
    const tables = []
    if (type === 'overview') {
      tables.push({
        title: 'Summary',
        columns: [
          { key: 'label', label: 'Metric' },
          { key: 'value', label: 'Value' },
        ],
        rows,
      })
      tables.push({
        title: 'Fee defaulters',
        columns: [
          { key: 'student', label: 'Student' },
          { key: 'course', label: 'Course' },
          { key: 'dueLabel', label: 'Due' },
          { key: 'status', label: 'Status' },
        ],
        rows: lists.defaulters || [],
      })
      tables.push({
        title: 'Attendance shortage',
        columns: [
          { key: 'student', label: 'Student' },
          { key: 'course', label: 'Course' },
          { key: 'percent', label: '%' },
        ],
        rows: lists.shortage || [],
      })
    } else if (type === 'people') {
      tables.push({
        title: 'Faculty',
        columns: tableConfig.exportCols,
        rows: facultyRows,
      })
      tables.push({
        title: 'Staff',
        columns: [
          { key: 'code', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'designation', label: 'Designation' },
          { key: 'department', label: 'Department' },
          { key: 'category', label: 'Category' },
          { key: 'shift', label: 'Shift' },
          { key: 'status', label: 'Status' },
        ],
        rows: staffRows,
      })
    } else if (type === 'fees') {
      tables.push({ title: 'Fee accounts', columns: tableConfig.exportCols, rows })
      tables.push({
        title: 'Receipts in period',
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'student', label: 'Student' },
          { key: 'amountLabel', label: 'Amount' },
          { key: 'method', label: 'Method' },
          { key: 'invoice', label: 'Invoice' },
        ],
        rows: payments,
      })
    } else {
      tables.push({
        title: report?.title || 'Report',
        columns: tableConfig.exportCols,
        rows: table.filtered,
      })
    }

    printInstituteReport({
      title: report?.title || 'Institute report',
      description: report?.description || '',
      periodLabel,
      filterLabel,
      stats: printStats,
      tables,
    })
  }

  const chartPair = () => {
    if (type === 'students') {
      return [
        { title: 'By course', data: charts.byCourse },
        { title: 'By status', data: charts.byStatus, donut: true },
      ]
    }
    if (type === 'admissions') {
      return [
        { title: 'Funnel', data: charts.funnel },
        { title: 'By course', data: charts.byCourse },
      ]
    }
    if (type === 'fees') {
      return [
        { title: 'Collection by course', data: charts.byCourse },
        { title: 'Payment mode', data: charts.byMethod, donut: true },
      ]
    }
    if (type === 'defaulters') {
      return [{ title: 'By status', data: charts.byStatus, donut: true }]
    }
    if (type === 'attendance') {
      return [
        { title: 'Course-wise %', data: charts.byCourse },
        { title: 'Marks', data: charts.byStatus, donut: true },
      ]
    }
    if (type === 'exams') {
      return [
        { title: 'Pass / fail', data: charts.byResult, donut: true },
        { title: 'By course', data: charts.byCourse },
      ]
    }
    if (type === 'people') {
      return [
        { title: 'Faculty by department', data: charts.facultyByDept },
        { title: 'Staff by category', data: charts.staffByCategory, donut: true },
      ]
    }
    return [
      { title: 'Students by course', data: charts.byCourse },
      { title: 'Fee accounts', data: charts.feeStatus, donut: true },
    ]
  }

  const chartsToShow = chartPair()

  return (
    <section className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {REPORTS.map((item) => {
          const Icon = item.icon
          const active = type === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setType(item.id)}
              className={`rounded-lg border p-3 text-left transition ${
                active
                  ? 'border-brand-red bg-brand-red/5 shadow-sm ring-1 ring-brand-red/20'
                  : 'border-slate-200 bg-white hover:border-brand-red/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-navy-900">{item.label}</p>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-red/10 text-brand-red">
                  <Icon size={15} />
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{item.hint}</p>
            </button>
          )
        })}
      </div>

      <div className={`${card} space-y-3 p-3`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-navy-900">{report?.title || 'Reports'}</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {report?.description ||
                'Date range applies to collections, attendance, admissions and exams. Strength and dues are current.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondaryBtn} onClick={exportCurrent} disabled={loading}>
              <FileSpreadsheet size={14} /> CSV
            </button>
            <button type="button" className={secondaryBtn} onClick={printCurrent} disabled={loading || !report}>
              <Printer size={14} /> Print / PDF
            </button>
            <button type="button" className={primaryBtn} onClick={loadReport} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Field label="From">
            <DateInput value={filters.from} onChange={(e) => patchFilter('from', e.target.value)} className={inputClass} />
          </Field>
          <Field label="To">
            <DateInput value={filters.to} onChange={(e) => patchFilter('to', e.target.value)} className={inputClass} />
          </Field>
          <Field label="University">
            <select
              className={inputClass}
              value={filters.universityId}
              onChange={(e) => patchFilter('universityId', e.target.value)}
            >
              <option value="">All</option>
              {meta.universities.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Course">
            <select className={inputClass} value={filters.courseId} onChange={(e) => patchFilter('courseId', e.target.value)}>
              <option value="">All</option>
              {courses.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Batch">
            <select className={inputClass} value={filters.batchId} onChange={(e) => patchFilter('batchId', e.target.value)}>
              <option value="">All</option>
              {batches.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Session">
            <select className={inputClass} value={filters.session} onChange={(e) => patchFilter('session', e.target.value)}>
              <option value="">All</option>
              {meta.sessions.map((row) => (
                <option key={row} value={row}>
                  {row}
                </option>
              ))}
            </select>
          </Field>
          {type === 'attendance' ? (
            <Field label="Shortage below %">
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  max="100"
                  value={filters.threshold}
                  onChange={(e) => patchFilter('threshold', e.target.value)}
                />
              </div>
            </Field>
          ) : (
            <div className="flex items-end">
              <p className="pb-2 text-[11px] text-slate-400">{periodLabel}</p>
            </div>
          )}
        </div>
        {type === 'attendance' ? (
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={filters.shortageOnly}
              onChange={(e) => patchFilter('shortageOnly', e.target.checked)}
            />
            Show shortage list only
          </label>
        ) : null}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className={`grid gap-3 sm:grid-cols-2 ${kpiCards.length > 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-4'}`}>
        {kpiCards.map((st) => (
          <StatCard key={st.label} label={st.label} value={String(st.value)} hint={st.hint} />
        ))}
      </div>

      {chartsToShow.length ? (
        <div className={`grid gap-3 ${chartsToShow.length > 1 ? 'lg:grid-cols-2' : ''}`}>
          {chartsToShow.map((block) => (
            <Panel key={block.title} title={block.title}>
              {block.donut ? (
                <PieChart data={block.data} height={220} />
              ) : (
                <BarChart data={block.data} height={220} yLabel={block.title} />
              )}
            </Panel>
          ))}
        </div>
      ) : null}

      {type === 'overview' ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Fee defaulters">
            <DataTable
              columns={[
                { key: 'student', label: 'Student' },
                { key: 'course', label: 'Course' },
                { key: 'dueLabel', label: 'Due' },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              ]}
              rows={lists.defaulters || []}
              emptyTitle="No dues"
              emptyDescription="No pending fee accounts in this filter."
            />
          </Panel>
          <Panel title="Attendance shortage">
            <DataTable
              columns={[
                { key: 'student', label: 'Student' },
                { key: 'course', label: 'Course' },
                { key: 'percent', label: '%', render: (row) => `${row.percent}%` },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              ]}
              rows={lists.shortage || []}
              emptyTitle="No shortage"
              emptyDescription="Nobody is below the attendance threshold in this period."
            />
          </Panel>
          <Panel title="Pending admissions">
            <DataTable
              columns={[
                { key: 'applicant', label: 'Applicant' },
                { key: 'course', label: 'Course' },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                { key: 'date', label: 'Date' },
              ]}
              rows={lists.pendingAdmissions || []}
              emptyTitle="None pending"
              emptyDescription="No pending or verification admissions in this period."
            />
          </Panel>
          <Panel title="Exam toppers">
            <DataTable
              columns={[
                { key: 'student', label: 'Student' },
                { key: 'exam', label: 'Exam' },
                { key: 'percent', label: '%', render: (row) => `${row.percent}%` },
              ]}
              rows={lists.toppers || []}
              emptyTitle="No results"
              emptyDescription="Exam results in this period will appear here."
            />
          </Panel>
        </div>
      ) : null}

      {type !== 'overview' ? (
        <Panel
          title={type === 'people' ? 'Faculty' : report?.title || 'Records'}
          action={
            <input
              value={table.search}
              onChange={(e) => table.setSearch(e.target.value)}
              placeholder="Search…"
              className="h-9 w-full max-w-xs rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A896]"
            />
          }
        >
          <DataTable
            columns={tableConfig.columns}
            rows={loading ? [] : table.pageRows}
            emptyTitle={loading ? 'Loading…' : 'No records'}
            emptyDescription={loading ? 'Fetching live data from the server.' : 'Try another date range or filter.'}
          />
          <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
        </Panel>
      ) : null}

      {type === 'fees' ? (
        <Panel
          title="Receipts in this period"
          action={
            <input
              value={paymentTable.search}
              onChange={(e) => paymentTable.setSearch(e.target.value)}
              placeholder="Search receipts…"
              className="h-9 w-full max-w-xs rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A896]"
            />
          }
        >
          <DataTable
            columns={paymentColumns}
            rows={paymentTable.pageRows}
            emptyTitle="No receipts"
            emptyDescription="No successful payments in the selected dates."
          />
          <Pagination
            page={paymentTable.page}
            pageSize={paymentTable.pageSize}
            total={paymentTable.total}
            onPageChange={paymentTable.setPage}
          />
        </Panel>
      ) : null}

      {type === 'people' ? (
        <Panel
          title="Staff"
          action={
            <input
              value={staffTable.search}
              onChange={(e) => staffTable.setSearch(e.target.value)}
              placeholder="Search staff…"
              className="h-9 w-full max-w-xs rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A896]"
            />
          }
        >
          <DataTable columns={staffColumns} rows={staffTable.pageRows} emptyTitle="No staff" emptyDescription="Staff directory is empty for this filter." />
          <Pagination
            page={staffTable.page}
            pageSize={staffTable.pageSize}
            total={staffTable.total}
            onPageChange={staffTable.setPage}
          />
        </Panel>
      ) : null}

      <p className="text-[11px] text-slate-400">
        {periodLabel} · {filterLabel}
        {report?.generatedAt ? ` · Generated ${new Date(report.generatedAt).toLocaleString('en-IN')}` : ''}
      </p>
    </section>
  )
}
