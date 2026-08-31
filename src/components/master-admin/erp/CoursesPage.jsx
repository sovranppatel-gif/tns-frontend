import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Pencil, Plus, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react'
import {
  activateCourse,
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse,
} from '../../../services/courseService.js'
import { getUniversities } from '../../../services/universityService.js'
import {
  DataTable,
  PageToolbar,
  Pagination,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  StatusBadge,
  useClientTable,
  downloadCsv,
} from '../shared/MasterAdminUI.jsx'

const INSTITUTE_NAME = 'Thakur Niranjan Singh I.T.I. & Computer'
const INSTITUTE_SHORT = 'TNS'
const INSTITUTE_LABEL = `${INSTITUTE_SHORT} — ${INSTITUTE_NAME}`

const COURSE_TYPE_OPTIONS = [
  { value: 'University', label: 'University Course' },
  { value: 'ITI / SCVT', label: 'ITI / SCVT Course' },
  { value: 'Institute', label: 'Institute Self Course' },
]

const CATEGORY_OPTIONS = [
  'Degree',
  'Diploma',
  'PG Diploma',
  'Certificate',
  'Training',
  'ITI',
  'Other',
]

const STRUCTURE_OPTIONS = ['Semester', 'Year', 'Single Level']

const SUBJECT_TYPE_OPTIONS = [
  'Theory',
  'Practical',
  'Theory + Practical',
  'Project',
  'Internship',
  'Elective',
]

const columns = [
  { key: 'name', label: 'Course' },
  { key: 'code', label: 'Code' },
  { key: 'universityLabel', label: 'University / Authority' },
  { key: 'durationDisplay', label: 'Duration' },
  { key: 'structureType', label: 'Structure' },
  { key: 'category', label: 'Category' },
  { key: 'feesTotal', label: 'Fees' },
  { key: 'status', label: 'Status' },
]

function getTermLabel(structureType, number) {
  const n = Number(number) || 1
  if (structureType === 'Year') return `Year ${n}`
  if (structureType === 'Single Level') return `Level ${n}`
  return `Semester ${n}`
}

function isDefaultTermTitle(title) {
  return /^(Semester|Year|Level)\s+\d+$/i.test(String(title || '').trim()) || String(title || '').trim() === 'Course'
}

function requiresAuthority(type) {
  return type === 'University' || type === 'ITI / SCVT'
}

function parseFeeAmount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  const raw = String(value ?? '')
    .replace(/₹/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .trim()
  if (!raw || /as\s*per/i.test(raw)) return 0
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0
}

function formatFeeStore(value) {
  const amount = parseFeeAmount(value)
  if (!amount) return ''
  return `₹${amount.toLocaleString('en-IN')}`
}

function feeInputValue(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'number') return value === 0 ? '' : String(value)
  return String(value)
}

function emptySubject() {
  return {
    name: '',
    code: '',
    subjectType: 'Theory',
    theoryHours: 0,
    practicalHours: 0,
    credits: 0,
    maxMarks: 0,
    passingMarks: 0,
    theoryMarks: 0,
    practicalMarks: 0,
    internalMarks: 0,
    externalMarks: 0,
  }
}

function emptySemester(number = 1, structureType = 'Semester') {
  return {
    number,
    title: getTermLabel(structureType, number),
    durationMonths: structureType === 'Year' ? 12 : 6,
    description: '',
    subjects: [emptySubject()],
  }
}

function emptyTermFee(termNumber = 1) {
  return {
    termNumber,
    tuition: '',
    registration: '',
    exam: '',
    other: '',
    total: '',
  }
}

function emptyInstallment(number = 1) {
  return {
    number,
    amount: '',
    dueLabel: number === 1 ? 'Admission' : '',
    dueDays: 0,
  }
}

function emptyEligibilityDetails() {
  return {
    qualification: '',
    minimumPercentage: '',
    stream: '',
    ageLimit: '',
    other: '',
  }
}

function emptyFees() {
  return {
    total: '',
    registration: '',
    exam: '',
    tuition: '',
    other: '',
    installmentAllowed: true,
    installments: [],
    semesterFees: [],
  }
}

const emptyForm = {
  name: '',
  code: '',
  type: 'University',
  universityId: '',
  category: 'Diploma',
  structureType: 'Semester',
  durationMonths: 12,
  durationLabel: '',
  semesterCount: 2,
  semesters: [emptySemester(1, 'Semester'), emptySemester(2, 'Semester')],
  fees: {
    ...emptyFees(),
    semesterFees: [emptyTermFee(1), emptyTermFee(2)],
  },
  eligibility: '',
  eligibilityDetails: emptyEligibilityDetails(),
  mode: 'Offline',
  description: '',
  highlightsText: '',
  status: 'Active',
  remarks: '',
}

function termFeeTotal(fee = {}) {
  return (
    parseFeeAmount(fee.tuition) +
    parseFeeAmount(fee.registration) +
    parseFeeAmount(fee.exam) +
    parseFeeAmount(fee.other)
  )
}

function generalFeeTotal(fees = {}) {
  return (
    parseFeeAmount(fees.tuition) +
    parseFeeAmount(fees.registration) +
    parseFeeAmount(fees.exam) +
    parseFeeAmount(fees.other)
  )
}

function mapSubjectToPayload(sub) {
  return {
    name: String(sub.name || '').trim(),
    code: String(sub.code || '').trim().toUpperCase(),
    subjectType: SUBJECT_TYPE_OPTIONS.includes(sub.subjectType) ? sub.subjectType : 'Theory',
    theoryHours: Number(sub.theoryHours) || 0,
    practicalHours: Number(sub.practicalHours) || 0,
    credits: Number(sub.credits) || 0,
    maxMarks: Number(sub.maxMarks) || 0,
    passingMarks: Number(sub.passingMarks) || 0,
    theoryMarks: Number(sub.theoryMarks) || 0,
    practicalMarks: Number(sub.practicalMarks) || 0,
    internalMarks: Number(sub.internalMarks) || 0,
    externalMarks: Number(sub.externalMarks) || 0,
  }
}

function mapFormToPayload(form) {
  const structureType = STRUCTURE_OPTIONS.includes(form.structureType)
    ? form.structureType
    : 'Semester'

  const mappedSemesters = (Array.isArray(form.semesters) ? form.semesters : [])
    .map((sem, index) => ({
      number: Number(sem.number) || index + 1,
      title: String(sem.title || getTermLabel(structureType, index + 1)).trim(),
      durationMonths: Number(sem.durationMonths) || 0,
      description: String(sem.description || '').trim(),
      subjects: (Array.isArray(sem.subjects) ? sem.subjects : [])
        .map(mapSubjectToPayload)
        .filter((sub) => sub.name),
    }))
    .filter((sem) => sem.number >= 1)

  const semesters =
    structureType === 'Single Level'
      ? mappedSemesters[0]?.subjects?.length
        ? [
            {
              number: 1,
              title: mappedSemesters[0].title || 'Course',
              durationMonths: Number(form.durationMonths) || mappedSemesters[0].durationMonths || 0,
              description: mappedSemesters[0].description || '',
              subjects: mappedSemesters[0].subjects,
            },
          ]
        : []
      : mappedSemesters

  const installmentAllowed = Boolean(form.fees?.installmentAllowed)
  const semesterFees =
    structureType === 'Single Level'
      ? []
      : (Array.isArray(form.fees?.semesterFees) ? form.fees.semesterFees : []).map((fee, index) => {
          const tuition = parseFeeAmount(fee.tuition)
          const registration = parseFeeAmount(fee.registration)
          const exam = parseFeeAmount(fee.exam)
          const other = parseFeeAmount(fee.other)
          const computed = tuition + registration + exam + other
          return {
            termNumber: Number(fee.termNumber) || index + 1,
            tuition,
            registration,
            exam,
            other,
            total: parseFeeAmount(fee.total) || computed,
          }
        })

  const termSum = semesterFees.reduce((sum, fee) => sum + (Number(fee.total) || 0), 0)
  const generalSum = generalFeeTotal(form.fees)
  const total =
    termSum > 0
      ? formatFeeStore(termSum)
      : generalSum > 0
        ? formatFeeStore(generalSum)
        : String(form.fees?.total || '').trim()

  return {
    name: String(form.name || '').trim(),
    code: String(form.code || '').trim().toUpperCase(),
    type: form.type,
    universityId: requiresAuthority(form.type) ? form.universityId || null : null,
    universityName: form.type === 'Institute' ? INSTITUTE_NAME : undefined,
    universityShortName: form.type === 'Institute' ? INSTITUTE_SHORT : undefined,
    category: form.category,
    structureType,
    durationMonths: Number(form.durationMonths) || 0,
    durationLabel: String(form.durationLabel || '').trim(),
    semesterCount: structureType === 'Single Level' ? 0 : Number(form.semesterCount) || semesters.length,
    semesters,
    fees: {
      total,
      registration: String(form.fees?.registration || '').trim(),
      exam: String(form.fees?.exam || '').trim(),
      tuition: String(form.fees?.tuition || '').trim(),
      other: String(form.fees?.other || '').trim(),
      installmentAllowed,
      installments: installmentAllowed
        ? (Array.isArray(form.fees?.installments) ? form.fees.installments : [])
            .map((item, index) => ({
              number: Number(item.number) || index + 1,
              amount: parseFeeAmount(item.amount),
              dueLabel: String(item.dueLabel || '').trim(),
              dueDays: Number(item.dueDays) || 0,
            }))
            .filter((item) => item.amount > 0 || item.dueLabel)
        : [],
      semesterFees,
    },
    eligibility: String(form.eligibility || '').trim(),
    eligibilityDetails: {
      qualification: String(form.eligibilityDetails?.qualification || '').trim(),
      minimumPercentage: String(form.eligibilityDetails?.minimumPercentage || '').trim(),
      stream: String(form.eligibilityDetails?.stream || '').trim(),
      ageLimit: String(form.eligibilityDetails?.ageLimit || '').trim(),
      other: String(form.eligibilityDetails?.other || '').trim(),
    },
    mode: form.mode,
    description: String(form.description || '').trim(),
    highlights: String(form.highlightsText || '')
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean),
    status: form.status,
    remarks: String(form.remarks || '').trim(),
  }
}

function mapRowToForm(row) {
  const structureType = STRUCTURE_OPTIONS.includes(row.structureType)
    ? row.structureType
    : 'Semester'

  const semesters =
    Array.isArray(row.semesters) && row.semesters.length
      ? row.semesters.map((sem, index) => ({
          number: sem.number || index + 1,
          title: sem.title || getTermLabel(structureType, sem.number || index + 1),
          durationMonths: sem.durationMonths || 0,
          description: sem.description || '',
          subjects:
            Array.isArray(sem.subjects) && sem.subjects.length
              ? sem.subjects.map((sub) => ({
                  name: sub.name || '',
                  code: sub.code || '',
                  subjectType: SUBJECT_TYPE_OPTIONS.includes(sub.subjectType)
                    ? sub.subjectType
                    : 'Theory',
                  theoryHours: sub.theoryHours || 0,
                  practicalHours: sub.practicalHours || 0,
                  credits: sub.credits || 0,
                  maxMarks: sub.maxMarks || 0,
                  passingMarks: sub.passingMarks || 0,
                  theoryMarks: sub.theoryMarks || 0,
                  practicalMarks: sub.practicalMarks || 0,
                  internalMarks: sub.internalMarks || 0,
                  externalMarks: sub.externalMarks || 0,
                }))
              : [emptySubject()],
        }))
      : structureType === 'Single Level'
        ? [{ ...emptySemester(1, 'Single Level'), title: 'Course' }]
        : [emptySemester(1, structureType), emptySemester(2, structureType)]

  const mappedTermFees = Array.isArray(row.fees?.semesterFees)
    ? row.fees.semesterFees.map((fee, index) => ({
        termNumber: fee.termNumber || index + 1,
        tuition: feeInputValue(fee.tuition),
        registration: feeInputValue(fee.registration),
        exam: feeInputValue(fee.exam),
        other: feeInputValue(fee.other),
        total: feeInputValue(fee.total),
      }))
    : []

  const semesterFees =
    structureType === 'Single Level'
      ? []
      : semesters.map((sem, index) => {
          const existing = mappedTermFees.find((fee) => Number(fee.termNumber) === Number(sem.number))
          return existing || emptyTermFee(sem.number || index + 1)
        })

  return {
    name: row.name || '',
    code: row.code || '',
    type: COURSE_TYPE_OPTIONS.some((opt) => opt.value === row.type) ? row.type : 'University',
    universityId: row.universityId || '',
    category: CATEGORY_OPTIONS.includes(row.category) ? row.category : 'Diploma',
    structureType,
    durationMonths: row.durationMonths ?? 12,
    durationLabel: row.durationLabel || '',
    semesterCount: row.semesterCount || semesters.length,
    semesters,
    fees: {
      total: row.fees?.total || '',
      registration: row.fees?.registration || '',
      exam: row.fees?.exam || '',
      tuition: feeInputValue(row.fees?.tuition),
      other: feeInputValue(row.fees?.other),
      installmentAllowed:
        typeof row.fees?.installmentAllowed === 'boolean' ? row.fees.installmentAllowed : true,
      installments: Array.isArray(row.fees?.installments)
        ? row.fees.installments.map((item, index) => ({
            number: item.number || index + 1,
            amount: item.amount ?? '',
            dueLabel: item.dueLabel || '',
            dueDays: item.dueDays || 0,
          }))
        : [],
      semesterFees,
    },
    eligibility: row.eligibility || '',
    eligibilityDetails: {
      ...emptyEligibilityDetails(),
      ...(row.eligibilityDetails && typeof row.eligibilityDetails === 'object'
        ? row.eligibilityDetails
        : {}),
    },
    mode: row.mode || 'Offline',
    description: row.description || '',
    highlightsText: Array.isArray(row.highlights) ? row.highlights.join(', ') : '',
    status: row.status || 'Active',
    remarks: row.remarks || '',
  }
}

function applyStructureTypeChange(prev, structureType) {
  if (structureType === 'Single Level') {
    const first = prev.semesters?.[0] || emptySemester(1, 'Single Level')
    return {
      ...prev,
      structureType,
      semesterCount: 0,
      semesters: [{ ...first, number: 1, title: first.title && first.title !== getTermLabel(prev.structureType, 1) ? first.title : 'Course' }],
      fees: { ...prev.fees, semesterFees: [] },
    }
  }

  let source = Array.isArray(prev.semesters) ? [...prev.semesters] : []
  if (prev.structureType === 'Single Level') {
    const count = structureType === 'Year' ? 1 : 2
    source = Array.from({ length: count }, (_, i) => {
      if (i === 0 && source[0]) {
        return {
          ...source[0],
          number: 1,
          title: getTermLabel(structureType, 1),
          durationMonths: source[0].durationMonths || (structureType === 'Year' ? 12 : 6),
        }
      }
      return emptySemester(i + 1, structureType)
    })
  } else {
    if (!source.length) source = [emptySemester(1, structureType), emptySemester(2, structureType)]
    source = source.map((sem, i) => ({
      ...sem,
      number: i + 1,
      title: isDefaultTermTitle(sem.title) ? getTermLabel(structureType, i + 1) : sem.title,
    }))
  }

  const semesterFees = source.map((sem, i) => {
    const existing = prev.fees?.semesterFees?.find((fee) => Number(fee.termNumber) === i + 1)
    return existing ? { ...emptyTermFee(i + 1), ...existing, termNumber: i + 1 } : emptyTermFee(i + 1)
  })

  return {
    ...prev,
    structureType,
    semesterCount: source.length,
    semesters: source,
    fees: { ...prev.fees, semesterFees },
  }
}

function authorityOptions(universities, type, currentId) {
  const current = String(currentId || '')
  return (universities || []).filter((uni) => {
    const isCurrent = String(uni._id) === current
    if (uni.status !== 'Active' && !isCurrent) return false
    if (type === 'ITI / SCVT') return uni.universityType === 'ITI / SCVT' || isCurrent
    if (type === 'University') return uni.universityType !== 'ITI / SCVT' || isCurrent
    return false
  })
}

function Field({ label, children, className = '', hint = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  )
}

function FormSection({ title, hint, children }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}

function inputClassName(type = 'input') {
  const base =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#00A896] focus:ring-2 focus:ring-[#00A896]/15'
  if (type === 'textarea') return `${base} min-h-24 resize-y`
  return base
}

function durationHint(row) {
  const structureType = row.structureType || 'Semester'
  const count = row.semesterCount || 0
  if (!count || structureType === 'Single Level') return ''
  if (structureType === 'Year') return `${count} year${count === 1 ? '' : 's'}`
  return `${count} semester${count === 1 ? '' : 's'}`
}

export default function CoursesPage() {
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [universities, setUniversities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [structureFilter, setStructureFilter] = useState('')
  const formRef = useRef(null)

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const openForm = (nextForm = emptyForm, id = null) => {
    setEditingId(id)
    setForm(nextForm)
    setFormOpen(true)
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setError('')
      const [courseData, uniData] = await Promise.all([
        getCourses(),
        getUniversities().catch(() => ({ rows: [] })),
      ])
      setRows(courseData.rows)
      setStats(courseData.stats || {})
      setUniversities(uniData.rows || [])
    } catch (err) {
      setError(err?.message || 'Unable to load courses')
      setRows([])
      setStats({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (typeFilter && row.type !== typeFilter) return false
      if (categoryFilter && row.category !== categoryFilter) return false
      if (structureFilter && (row.structureType || 'Semester') !== structureFilter) return false
      return true
    })
  }, [rows, typeFilter, categoryFilter, structureFilter])

  const table = useClientTable(visibleRows, {
    searchKeys: ['name', 'code', 'universityLabel', 'category', 'type', 'structureType', 'durationDisplay'],
    pageSize: 8,
    filterKey: 'status',
  })

  const filterOptions = useMemo(() => ['Active', 'Inactive', 'Draft'], [])
  const selectedAuthorities = useMemo(
    () => authorityOptions(universities, form.type, form.universityId),
    [universities, form.type, form.universityId],
  )
  const usesTerms = form.structureType === 'Semester' || form.structureType === 'Year'
  const termNoun = form.structureType === 'Year' ? 'Year' : 'Semester'

  const updateSemester = (semIndex, key, value) => {
    setForm((prev) => {
      const semesters = [...(prev.semesters || [])]
      semesters[semIndex] = { ...semesters[semIndex], [key]: value }
      return {
        ...prev,
        semesters,
        semesterCount: prev.structureType === 'Single Level' ? 0 : semesters.length,
      }
    })
  }

  const updateSubject = (semIndex, subIndex, key, value) => {
    setForm((prev) => {
      const semesters = [...(prev.semesters || [])]
      const subjects = [...(semesters[semIndex]?.subjects || [])]
      subjects[subIndex] = { ...subjects[subIndex], [key]: value }
      semesters[semIndex] = { ...semesters[semIndex], subjects }
      return { ...prev, semesters }
    })
  }

  const addSemester = () => {
    setForm((prev) => {
      const nextNumber = (prev.semesters?.length || 0) + 1
      const semesters = [...(prev.semesters || []), emptySemester(nextNumber, prev.structureType)]
      return {
        ...prev,
        semesters,
        semesterCount: semesters.length,
        fees: {
          ...prev.fees,
          semesterFees: [...(prev.fees?.semesterFees || []), emptyTermFee(nextNumber)],
        },
      }
    })
  }

  const removeSemester = (semIndex) => {
    setForm((prev) => {
      const semesters = [...(prev.semesters || [])]
      if (semesters.length <= 1) {
        return {
          ...prev,
          semesters: [emptySemester(1, prev.structureType)],
          semesterCount: 1,
          fees: { ...prev.fees, semesterFees: [emptyTermFee(1)] },
        }
      }
      semesters.splice(semIndex, 1)
      const renumbered = semesters.map((sem, i) => ({
        ...sem,
        number: i + 1,
        title: isDefaultTermTitle(sem.title) ? getTermLabel(prev.structureType, i + 1) : sem.title,
      }))
      const semesterFees = (prev.fees?.semesterFees || [])
        .filter((_, i) => i !== semIndex)
        .map((fee, i) => ({ ...fee, termNumber: i + 1 }))
      return {
        ...prev,
        semesters: renumbered,
        semesterCount: renumbered.length,
        fees: { ...prev.fees, semesterFees },
      }
    })
  }

  const addSubject = (semIndex) => {
    setForm((prev) => {
      const semesters = [...(prev.semesters || [])]
      const subjects = [...(semesters[semIndex]?.subjects || []), emptySubject()]
      semesters[semIndex] = { ...semesters[semIndex], subjects }
      return { ...prev, semesters }
    })
  }

  const removeSubject = (semIndex, subIndex) => {
    setForm((prev) => {
      const semesters = [...(prev.semesters || [])]
      const subjects = [...(semesters[semIndex]?.subjects || [])]
      if (subjects.length <= 1) {
        semesters[semIndex] = { ...semesters[semIndex], subjects: [emptySubject()] }
      } else {
        subjects.splice(subIndex, 1)
        semesters[semIndex] = { ...semesters[semIndex], subjects }
      }
      return { ...prev, semesters }
    })
  }

  const applySemesterPreset = (count) => {
    const n = Math.max(1, Math.min(8, Number(count) || 2))
    setForm((prev) => {
      const monthsEach = prev.durationMonths
        ? Math.max(1, Math.round(prev.durationMonths / n))
        : prev.structureType === 'Year'
          ? 12
          : 6
      const semesters = Array.from({ length: n }, (_, i) => {
        const existing = prev.semesters?.[i]
        return existing
          ? {
              ...existing,
              number: i + 1,
              title: isDefaultTermTitle(existing.title)
                ? getTermLabel(prev.structureType, i + 1)
                : existing.title || getTermLabel(prev.structureType, i + 1),
            }
          : { ...emptySemester(i + 1, prev.structureType), durationMonths: monthsEach }
      })
      const semesterFees = semesters.map((sem, i) => {
        const existing = prev.fees?.semesterFees?.[i]
        return existing ? { ...existing, termNumber: i + 1 } : emptyTermFee(i + 1)
      })
      const labelFallback =
        prev.structureType === 'Year'
          ? `${n} year${n === 1 ? '' : 's'}`
          : prev.durationMonths === 6
            ? '6 months'
            : prev.durationMonths === 12
              ? `1 year (${n} semesters)`
              : `${prev.durationMonths} months (${n} semesters)`
      return {
        ...prev,
        semesterCount: n,
        semesters,
        durationLabel: prev.durationLabel || labelFallback,
        fees: { ...prev.fees, semesterFees },
      }
    })
  }

  const updateFeeField = (key, value) => {
    setForm((prev) => {
      const fees = { ...prev.fees, [key]: value }
      if (key !== 'total') {
        const termSum = (fees.semesterFees || []).reduce((sum, fee) => sum + termFeeTotal(fee), 0)
        const generalSum = generalFeeTotal(fees)
        if (termSum > 0) fees.total = formatFeeStore(termSum)
        else if (generalSum > 0) fees.total = formatFeeStore(generalSum)
      }
      return { ...prev, fees }
    })
  }

  const updateTermFee = (index, key, value) => {
    setForm((prev) => {
      const semesterFees = [...(prev.fees?.semesterFees || [])]
      const row = { ...(semesterFees[index] || emptyTermFee(index + 1)), [key]: value }
      if (key !== 'total') row.total = formatFeeStore(termFeeTotal(row))
      semesterFees[index] = row
      const termSum = semesterFees.reduce((sum, fee) => sum + termFeeTotal(fee), 0)
      return {
        ...prev,
        fees: {
          ...prev.fees,
          semesterFees,
          total: termSum > 0 ? formatFeeStore(termSum) : prev.fees.total,
        },
      }
    })
  }

  const updateInstallment = (index, key, value) => {
    setForm((prev) => {
      const installments = [...(prev.fees?.installments || [])]
      installments[index] = { ...installments[index], [key]: value }
      return { ...prev, fees: { ...prev.fees, installments } }
    })
  }

  const handleSave = async () => {
    setError('')
    if (!form.name.trim()) return setError('Course name is required')
    if (!form.code.trim()) return setError('Course code is required')
    if (form.type === 'University' && !form.universityId) {
      return setError('Select a university for university-linked courses')
    }
    if (form.type === 'ITI / SCVT' && !form.universityId) {
      return setError('Select an ITI / SCVT authority for this course')
    }

    setSaving(true)
    try {
      const payload = mapFormToPayload(form)
      if (editingId) {
        await updateCourse(editingId, payload)
        setToast('Course updated')
      } else {
        await createCourse(payload)
        setToast('Course added')
      }
      closeForm()
      try {
        await reload()
      } catch (reloadErr) {
        setToast('Saved. Refresh the list if data looks stale.')
        console.warn('courses reload after save failed:', reloadErr)
      }
    } catch (err) {
      setError(err?.message || 'Unable to save course')
    } finally {
      setSaving(false)
    }
  }

  const tableColumns = [
    {
      key: 'name',
      label: 'Course',
      render: (row) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setExpandedId((id) => (id === row._id ? null : row._id))}
            className="truncate text-left font-semibold text-slate-900 hover:text-[#008C95]"
          >
            {row.name}
          </button>
          <p className="truncate text-xs text-slate-500">
            {row.code || 'Code pending'} · {row.mode} · {row.subjectCount || 0} subjects
          </p>
        </div>
      ),
    },
    { key: 'code', label: 'Code' },
    {
      key: 'universityLabel',
      label: 'University / Authority',
      render: (row) => (
        <span className="block max-w-[13rem] truncate" title={row.universityLabel}>
          {row.universityLabel}
        </span>
      ),
    },
    {
      key: 'durationDisplay',
      label: 'Duration',
      render: (row) => (
        <span className="font-medium text-slate-700">
          {row.durationDisplay}
          {durationHint(row) ? (
            <span className="block text-xs font-normal text-slate-500">{durationHint(row)}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'structureType',
      label: 'Structure',
      render: (row) => <span className="text-slate-700">{row.structureType || 'Semester'}</span>,
    },
    { key: 'category', label: 'Category' },
    {
      key: 'fees',
      label: 'Fees',
      render: (row) => <span className="text-slate-700">{row.fees?.total || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex w-full flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => openForm(mapRowToForm(row), row._id)}
            className="inline-flex items-center gap-1 rounded-full border border-[#008C95]/30 bg-[#008C95]/10 px-2.5 py-1 text-xs font-semibold text-[#008C95] transition hover:bg-[#008C95]/15"
          >
            <Pencil size={12} /> Edit
          </button>
          {row.status === 'Inactive' ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  await activateCourse(row._id)
                  setToast('Course activated')
                  await reload()
                } catch (err) {
                  setError(err?.message || 'Activate failed')
                }
              }}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <ShieldCheck size={12} /> Activate
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const ok = window.confirm(
                  `${row.name} ko Inactive karein?\n\nRecord database mein rahega. University mapping se bhi sync hoga.`,
                )
                if (!ok) return
                try {
                  await deleteCourse(row._id)
                  setToast('Course marked Inactive')
                  await reload()
                } catch (err) {
                  setError(err?.message || 'Deactivate failed')
                }
              }}
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
            >
              <Trash2 size={12} /> Deactivate
            </button>
          )}
        </div>
      ),
    },
  ]

  const previewRows = useMemo(() => rows.filter((r) => r.status === 'Active').slice(0, 4), [rows])
  const expanded = useMemo(() => rows.find((r) => r._id === expandedId) || null, [rows, expandedId])
  const exportRows = useMemo(
    () =>
      table.filtered.map((row) => ({
        ...row,
        structureType: row.structureType || 'Semester',
        feesTotal: row.fees?.total || '',
      })),
    [table.filtered],
  )

  const renderSubjectEditor = (sem, semIndex) => (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subjects</span>
        <button
          type="button"
          onClick={() => addSubject(semIndex)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#008C95]"
        >
          <Plus size={12} /> Subject
        </button>
      </div>
      {(sem.subjects || [emptySubject()]).map((sub, subIndex) => (
        <div
          key={`sub-${semIndex}-${subIndex}`}
          className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Field label="Subject Name">
            <input
              value={sub.name || ''}
              onChange={(e) => updateSubject(semIndex, subIndex, 'name', e.target.value)}
              className={inputClassName()}
              placeholder="Web Development"
            />
          </Field>
          <Field label="Subject Code">
            <input
              value={sub.code || ''}
              onChange={(e) =>
                updateSubject(semIndex, subIndex, 'code', e.target.value.toUpperCase())
              }
              className={inputClassName()}
              placeholder="WD101"
            />
          </Field>
          <Field label="Type">
            <select
              value={sub.subjectType || 'Theory'}
              onChange={(e) => updateSubject(semIndex, subIndex, 'subjectType', e.target.value)}
              className={inputClassName()}
            >
              {SUBJECT_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Credits">
            <input
              type="number"
              min={0}
              value={sub.credits ?? 0}
              onChange={(e) =>
                updateSubject(semIndex, subIndex, 'credits', Number(e.target.value) || 0)
              }
              className={inputClassName()}
            />
          </Field>
          <Field label="Theory Hours">
            <input
              type="number"
              min={0}
              value={sub.theoryHours ?? 0}
              onChange={(e) =>
                updateSubject(semIndex, subIndex, 'theoryHours', Number(e.target.value) || 0)
              }
              className={inputClassName()}
            />
          </Field>
          <Field label="Practical Hours">
            <input
              type="number"
              min={0}
              value={sub.practicalHours ?? 0}
              onChange={(e) =>
                updateSubject(semIndex, subIndex, 'practicalHours', Number(e.target.value) || 0)
              }
              className={inputClassName()}
            />
          </Field>
          <Field label="Max Marks">
            <input
              type="number"
              min={0}
              value={sub.maxMarks ?? 0}
              onChange={(e) =>
                updateSubject(semIndex, subIndex, 'maxMarks', Number(e.target.value) || 0)
              }
              className={inputClassName()}
            />
          </Field>
          <Field label="Passing Marks">
            <input
              type="number"
              min={0}
              value={sub.passingMarks ?? 0}
              onChange={(e) =>
                updateSubject(semIndex, subIndex, 'passingMarks', Number(e.target.value) || 0)
              }
              className={inputClassName()}
            />
          </Field>
          <Field label="Theory Marks">
            <input
              type="number"
              min={0}
              value={sub.theoryMarks ?? 0}
              onChange={(e) =>
                updateSubject(semIndex, subIndex, 'theoryMarks', Number(e.target.value) || 0)
              }
              className={inputClassName()}
            />
          </Field>
          <Field label="Practical Marks">
            <input
              type="number"
              min={0}
              value={sub.practicalMarks ?? 0}
              onChange={(e) =>
                updateSubject(semIndex, subIndex, 'practicalMarks', Number(e.target.value) || 0)
              }
              className={inputClassName()}
            />
          </Field>
          <Field label="Internal Marks">
            <input
              type="number"
              min={0}
              value={sub.internalMarks ?? 0}
              onChange={(e) =>
                updateSubject(semIndex, subIndex, 'internalMarks', Number(e.target.value) || 0)
              }
              className={inputClassName()}
            />
          </Field>
          <div className="flex items-end gap-2">
            <Field label="External Marks" className="flex-1">
              <input
                type="number"
                min={0}
                value={sub.externalMarks ?? 0}
                onChange={(e) =>
                  updateSubject(semIndex, subIndex, 'externalMarks', Number(e.target.value) || 0)
                }
                className={inputClassName()}
              />
            </Field>
            <button
              type="button"
              onClick={() => removeSubject(semIndex, subIndex)}
              className="mb-0.5 inline-flex h-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-rose-600"
              aria-label="Remove subject"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <section className="w-full min-w-0 space-y-3 overflow-x-hidden">
      {toast ? (
        <div className="fixed right-3 top-3 z-[90] max-w-[calc(100vw-1.5rem)] rounded-lg bg-[#008C95] px-4 py-2 text-sm font-medium text-white shadow-lg sm:right-4 sm:top-4">
          {toast}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <StatCard label="Total Courses" value={loading ? '—' : String(stats.total ?? rows.length)} icon={BookOpen} />
        <StatCard
          label="University Courses"
          value={loading ? '—' : String(stats.university ?? 0)}
          hint="MCU / RDVV / IGNOU etc."
        />
        <StatCard
          label="ITI / SCVT Courses"
          value={loading ? '—' : String(stats.iti ?? 0)}
          hint="Linked to ITI / SCVT authorities"
        />
        <StatCard
          label="Institute Self Courses"
          value={loading ? '—' : String(stats.institute ?? 0)}
          hint="Thakur Niranjan Singh I.T.I. & Computer"
        />
      </div>

      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          {error}
        </article>
      ) : null}

      <PageToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search courses, codes, university…"
        filters={filterOptions}
        filterValue={table.filter}
        onFilter={table.setFilter}
        addLabel="Add Course"
        onAdd={() => openForm(emptyForm, null)}
        onExportCsv={() => downloadCsv('courses.csv', columns, exportRows)}
        onExportExcel={() => downloadCsv('courses.xls', columns, exportRows)}
        onExportPdf={() => window.print()}
        extraActions={
          <>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                table.setPage(1)
              }}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#00A896] sm:w-auto"
            >
              <option value="">All types</option>
              {COURSE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                table.setPage(1)
              }}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#00A896] sm:w-auto"
            >
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <select
              value={structureFilter}
              onChange={(e) => {
                setStructureFilter(e.target.value)
                table.setPage(1)
              }}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#00A896] sm:w-auto"
            >
              <option value="">All structures</option>
              {STRUCTURE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </>
        }
      />

      {formOpen ? (
        <div ref={formRef}>
          <Panel title={editingId ? 'Edit Course Details' : 'Add Course Details'} className="p-3">
            <div className="space-y-4">
              <FormSection title="Basic Course Information">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Course Name">
                    <input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className={inputClassName()}
                      placeholder="e.g. PGDCA / Full Stack Web Development"
                    />
                  </Field>
                  <Field label="Course Code">
                    <input
                      value={form.code}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                      }
                      className={inputClassName()}
                      placeholder="MCU-PGDCA / TNS-FSWD"
                    />
                  </Field>
                  <Field label="Course Type">
                    <select
                      value={form.type}
                      onChange={(e) => {
                        const type = e.target.value
                        setForm((prev) => {
                          const switching = type !== prev.type
                          let next = {
                            ...prev,
                            type,
                            universityId: type === 'Institute' || switching ? '' : prev.universityId,
                          }
                          if (!editingId) {
                            if (type === 'Institute') {
                              next = {
                                ...next,
                                category: 'Training',
                                durationMonths: 6,
                                durationLabel: '6 months',
                                structureType: 'Single Level',
                              }
                            } else if (type === 'ITI / SCVT') {
                              next = {
                                ...next,
                                category: prev.category === 'Training' ? 'ITI' : prev.category,
                                structureType: 'Year',
                              }
                            } else {
                              next = {
                                ...next,
                                category: prev.category === 'Training' ? 'Diploma' : prev.category,
                                structureType: 'Semester',
                              }
                            }
                            next = applyStructureTypeChange(next, next.structureType)
                          }
                          return next
                        })
                      }}
                      className={inputClassName()}
                    >
                      {COURSE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {form.type === 'Institute' ? (
                    <>
                      <Field label="Institute">
                        <input
                          value={INSTITUTE_NAME}
                          disabled
                          className={`${inputClassName()} bg-slate-50`}
                        />
                      </Field>
                      <Field label="Short Name">
                        <input
                          value={INSTITUTE_SHORT}
                          disabled
                          className={`${inputClassName()} bg-slate-50`}
                        />
                      </Field>
                    </>
                  ) : (
                    <Field
                      label={form.type === 'ITI / SCVT' ? 'ITI / SCVT Authority' : 'University / Authority'}
                    >
                      <select
                        value={form.universityId}
                        onChange={(e) => setForm((prev) => ({ ...prev, universityId: e.target.value }))}
                        className={inputClassName()}
                      >
                        <option value="">
                          {form.type === 'ITI / SCVT' ? 'Select ITI / SCVT authority' : 'Select university'}
                        </option>
                        {selectedAuthorities.map((uni) => (
                          <option key={uni._id} value={uni._id}>
                            {uni.shortName} — {uni.name}
                            {uni.status !== 'Active' ? ' (inactive)' : ''}
                          </option>
                        ))}
                      </select>
                      {!selectedAuthorities.length ? (
                        <p className="text-[11px] text-amber-700">
                          {form.type === 'ITI / SCVT'
                            ? 'No active ITI / SCVT authorities found. Add one in Universities first.'
                            : 'No active universities found.'}
                        </p>
                      ) : null}
                    </Field>
                  )}

                  <Field label="Category">
                    <select
                      value={form.category}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                      className={inputClassName()}
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Structure Type">
                    <select
                      value={form.structureType}
                      onChange={(e) =>
                        setForm((prev) => applyStructureTypeChange(prev, e.target.value))
                      }
                      className={inputClassName()}
                    >
                      {STRUCTURE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Duration (months)">
                    <input
                      type="number"
                      min={0}
                      value={form.durationMonths}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, durationMonths: Number(e.target.value) || 0 }))
                      }
                      className={inputClassName()}
                    />
                  </Field>
                  <Field label="Duration Label">
                    <input
                      value={form.durationLabel}
                      onChange={(e) => setForm((prev) => ({ ...prev, durationLabel: e.target.value }))}
                      className={inputClassName()}
                      placeholder="6 months / 1 year (2 semesters)"
                    />
                  </Field>
                  <Field label="Mode">
                    <select
                      value={form.mode}
                      onChange={(e) => setForm((prev) => ({ ...prev, mode: e.target.value }))}
                      className={inputClassName()}
                    >
                      <option value="Offline">Offline</option>
                      <option value="Online">Online</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                      className={inputClassName()}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Eligibility" hint="Keep the main eligibility text. Extra fields are optional.">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Eligibility" className="sm:col-span-2 lg:col-span-3">
                    <input
                      value={form.eligibility}
                      onChange={(e) => setForm((prev) => ({ ...prev, eligibility: e.target.value }))}
                      className={inputClassName()}
                      placeholder="Graduate / 10+2 / …"
                    />
                  </Field>
                  <Field label="Qualification">
                    <input
                      value={form.eligibilityDetails.qualification}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          eligibilityDetails: {
                            ...prev.eligibilityDetails,
                            qualification: e.target.value,
                          },
                        }))
                      }
                      className={inputClassName()}
                      placeholder="10+2 / Graduate"
                    />
                  </Field>
                  <Field label="Minimum Percentage">
                    <input
                      value={form.eligibilityDetails.minimumPercentage}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          eligibilityDetails: {
                            ...prev.eligibilityDetails,
                            minimumPercentage: e.target.value,
                          },
                        }))
                      }
                      className={inputClassName()}
                      placeholder="45%"
                    />
                  </Field>
                  <Field label="Stream">
                    <input
                      value={form.eligibilityDetails.stream}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          eligibilityDetails: { ...prev.eligibilityDetails, stream: e.target.value },
                        }))
                      }
                      className={inputClassName()}
                      placeholder="Any / Commerce / Science"
                    />
                  </Field>
                  <Field label="Age Limit">
                    <input
                      value={form.eligibilityDetails.ageLimit}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          eligibilityDetails: { ...prev.eligibilityDetails, ageLimit: e.target.value },
                        }))
                      }
                      className={inputClassName()}
                      placeholder="No limit / 17-25"
                    />
                  </Field>
                  <Field label="Other Eligibility" className="sm:col-span-2">
                    <input
                      value={form.eligibilityDetails.other}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          eligibilityDetails: { ...prev.eligibilityDetails, other: e.target.value },
                        }))
                      }
                      className={inputClassName()}
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Fee Structure" hint="Term totals are calculated automatically. Overall total stays in sync when term fees are entered.">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Course / Overall Total">
                    <input
                      value={form.fees.total}
                      onChange={(e) => updateFeeField('total', e.target.value)}
                      className={inputClassName()}
                      placeholder="₹18,000"
                    />
                  </Field>
                  <Field label="Tuition Fee">
                    <input
                      value={form.fees.tuition}
                      onChange={(e) => updateFeeField('tuition', e.target.value)}
                      className={inputClassName()}
                      placeholder="₹12,000"
                    />
                  </Field>
                  <Field label="Registration Fee">
                    <input
                      value={form.fees.registration}
                      onChange={(e) => updateFeeField('registration', e.target.value)}
                      className={inputClassName()}
                      placeholder="₹1,500"
                    />
                  </Field>
                  <Field label="Exam Fee">
                    <input
                      value={form.fees.exam}
                      onChange={(e) => updateFeeField('exam', e.target.value)}
                      className={inputClassName()}
                      placeholder="₹1,000"
                    />
                  </Field>
                  <Field label="Other Fee">
                    <input
                      value={form.fees.other}
                      onChange={(e) => updateFeeField('other', e.target.value)}
                      className={inputClassName()}
                      placeholder="₹500"
                    />
                  </Field>
                  <Field label="Installment Allowed">
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(form.fees.installmentAllowed)}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            fees: { ...prev.fees, installmentAllowed: e.target.checked },
                          }))
                        }
                      />
                      Installment allowed
                    </label>
                  </Field>
                </div>

                {usesTerms ? (
                  <div className="mt-3 space-y-2">
                    {(form.fees.semesterFees || []).map((fee, index) => (
                      <div key={`term-fee-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                        <p className="mb-2 text-sm font-semibold text-slate-800">
                          {getTermLabel(form.structureType, fee.termNumber || index + 1)} Fee
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                          <Field label="Tuition Fee">
                            <input
                              value={fee.tuition}
                              onChange={(e) => updateTermFee(index, 'tuition', e.target.value)}
                              className={inputClassName()}
                            />
                          </Field>
                          <Field label="Registration Fee">
                            <input
                              value={fee.registration}
                              onChange={(e) => updateTermFee(index, 'registration', e.target.value)}
                              className={inputClassName()}
                            />
                          </Field>
                          <Field label="Exam Fee">
                            <input
                              value={fee.exam}
                              onChange={(e) => updateTermFee(index, 'exam', e.target.value)}
                              className={inputClassName()}
                            />
                          </Field>
                          <Field label="Other Fee">
                            <input
                              value={fee.other}
                              onChange={(e) => updateTermFee(index, 'other', e.target.value)}
                              className={inputClassName()}
                            />
                          </Field>
                          <Field label="Total">
                            <input
                              value={fee.total || formatFeeStore(termFeeTotal(fee))}
                              readOnly
                              className={`${inputClassName()} bg-slate-50`}
                            />
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Single Level courses use the general fee structure above.
                  </p>
                )}

                {form.fees.installmentAllowed ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">Installment details (optional)</p>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            fees: {
                              ...prev.fees,
                              installments: [
                                ...(prev.fees.installments || []),
                                emptyInstallment((prev.fees.installments || []).length + 1),
                              ],
                            },
                          }))
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#008C95]"
                      >
                        <Plus size={12} /> Installment
                      </button>
                    </div>
                    {(form.fees.installments || []).map((item, index) => (
                      <div
                        key={`inst-${index}`}
                        className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-[0.6fr_1fr_1.2fr_0.8fr_auto]"
                      >
                        <Field label="No.">
                          <input
                            type="number"
                            min={1}
                            value={item.number}
                            onChange={(e) =>
                              updateInstallment(index, 'number', Number(e.target.value) || index + 1)
                            }
                            className={inputClassName()}
                          />
                        </Field>
                        <Field label="Amount">
                          <input
                            type="number"
                            min={0}
                            value={item.amount}
                            onChange={(e) => updateInstallment(index, 'amount', e.target.value)}
                            className={inputClassName()}
                            placeholder="5000"
                          />
                        </Field>
                        <Field label="Due label">
                          <input
                            value={item.dueLabel}
                            onChange={(e) => updateInstallment(index, 'dueLabel', e.target.value)}
                            className={inputClassName()}
                            placeholder="Admission / After 3 months"
                          />
                        </Field>
                        <Field label="Due days">
                          <input
                            type="number"
                            min={0}
                            value={item.dueDays}
                            onChange={(e) =>
                              updateInstallment(index, 'dueDays', Number(e.target.value) || 0)
                            }
                            className={inputClassName()}
                          />
                        </Field>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => {
                              const installments = [...(prev.fees.installments || [])]
                              installments.splice(index, 1)
                              return { ...prev, fees: { ...prev.fees, installments } }
                            })
                          }
                          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-rose-600"
                          aria-label="Remove installment"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </FormSection>

              {usesTerms ? (
                <FormSection
                  title={`${termNoun} Structure`}
                  hint={`${form.structureType === 'Year' ? 'Year-based' : 'Semester-based'} titles, duration and subjects.`}
                >
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {(form.structureType === 'Year' ? [1, 2, 3] : [1, 2, 4, 6]).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => applySemesterPreset(n)}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-[#008C95]/40 hover:text-[#008C95]"
                      >
                        {form.structureType === 'Year'
                          ? `${n} Year${n === 1 ? '' : 's'}`
                          : `${n} Sem`}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={addSemester}
                      className="inline-flex items-center gap-1 rounded-full border border-[#008C95]/30 bg-[#008C95]/10 px-2.5 py-1 text-xs font-semibold text-[#008C95]"
                    >
                      <Plus size={12} /> Add {termNoun}
                    </button>
                  </div>

                  {(form.semesters || []).map((sem, semIndex) => (
                    <div
                      key={`sem-${semIndex}`}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {sem.title || getTermLabel(form.structureType, sem.number || semIndex + 1)}
                        </p>
                        {(form.semesters || []).length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeSemester(semIndex)}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600"
                          >
                            <X size={12} /> Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Field label="Title">
                          <input
                            value={sem.title || ''}
                            onChange={(e) => updateSemester(semIndex, 'title', e.target.value)}
                            className={inputClassName()}
                          />
                        </Field>
                        <Field label="Duration (months)">
                          <input
                            type="number"
                            min={0}
                            value={sem.durationMonths ?? 0}
                            onChange={(e) =>
                              updateSemester(semIndex, 'durationMonths', Number(e.target.value) || 0)
                            }
                            className={inputClassName()}
                          />
                        </Field>
                        <Field label="Description">
                          <input
                            value={sem.description || ''}
                            onChange={(e) => updateSemester(semIndex, 'description', e.target.value)}
                            className={inputClassName()}
                            placeholder={`What this ${termNoun.toLowerCase()} covers`}
                          />
                        </Field>
                      </div>
                      {renderSubjectEditor(sem, semIndex)}
                    </div>
                  ))}
                </FormSection>
              ) : (
                <FormSection title="Subjects / Course Details" hint="Single Level courses do not use semester or year blocks.">
                  {renderSubjectEditor(form.semesters?.[0] || emptySemester(1, 'Single Level'), 0)}
                </FormSection>
              )}

              <FormSection title="Description / Highlights / Remarks">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Description" className="sm:col-span-2 lg:col-span-3">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      className={inputClassName('textarea')}
                      placeholder="Full course overview…"
                    />
                  </Field>
                  <Field label="Highlights (comma or new line)" className="sm:col-span-2">
                    <textarea
                      value={form.highlightsText}
                      onChange={(e) => setForm((prev) => ({ ...prev, highlightsText: e.target.value }))}
                      className={inputClassName('textarea')}
                      placeholder="MCU affiliated, 2 semesters, Practical labs"
                    />
                  </Field>
                  <Field label="Remarks">
                    <textarea
                      value={form.remarks}
                      onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                      className={inputClassName('textarea')}
                    />
                  </Field>
                </div>
              </FormSection>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
              <PrimaryButton disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : editingId ? 'Update Course' : 'Save Course'}
              </PrimaryButton>
            </div>
          </Panel>
        </div>
      ) : null}

      <Panel title="Course Snapshot" className="p-3">
        <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-4">
          {previewRows.map((row) => (
            <article key={row._id} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900">{row.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {row.universityLabel} · {row.code || '—'}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Type:</span>{' '}
                  {COURSE_TYPE_OPTIONS.find((opt) => opt.value === row.type)?.label || row.type}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Duration:</span> {row.durationDisplay}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Structure:</span>{' '}
                  {row.structureType || 'Semester'}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Total Fee:</span> {row.fees?.total || '—'}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Subjects:</span> {row.subjectCount || 0}
                </p>
              </div>
            </article>
          ))}
          {!loading && !previewRows.length ? (
            <p className="col-span-full py-6 text-center text-sm text-slate-500">
              No active courses yet. Click Add Course.
            </p>
          ) : null}
        </div>
      </Panel>

      {expanded ? (
        <Panel title={`${expanded.name} — Full Details`} className="p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              {expanded.universityLabel} · {expanded.durationDisplay} · {expanded.category} ·{' '}
              {expanded.mode} · {expanded.structureType || 'Semester'}
            </p>
            <button
              type="button"
              onClick={() => setExpandedId(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
          {expanded.description ? (
            <p className="mb-3 text-sm text-slate-700">{expanded.description}</p>
          ) : null}

          <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Fee</p>
              <p className="mt-1 font-semibold text-slate-800">{expanded.fees?.total || '—'}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tuition</p>
              <p className="mt-1 font-semibold text-slate-800">{expanded.fees?.tuition || '—'}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registration / Exam</p>
              <p className="mt-1 font-semibold text-slate-800">
                {expanded.fees?.registration || '—'} / {expanded.fees?.exam || '—'}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Installments</p>
              <p className="mt-1 font-semibold text-slate-800">
                {expanded.fees?.installmentAllowed
                  ? `${(expanded.fees?.installments || []).length || 0} planned`
                  : 'Not allowed'}
              </p>
            </article>
          </div>

          {Array.isArray(expanded.fees?.semesterFees) && expanded.fees.semesterFees.length ? (
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              {expanded.fees.semesterFees.map((fee) => (
                <article
                  key={`exp-fee-${fee.termNumber}`}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
                >
                  <p className="font-semibold text-slate-900">
                    {getTermLabel(expanded.structureType || 'Semester', fee.termNumber)} Fee
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tuition {fee.tuition || 0} · Registration {fee.registration || 0} · Exam {fee.exam || 0} ·
                    Other {fee.other || 0}
                  </p>
                  <p className="mt-1 font-medium">Total {fee.total || 0}</p>
                </article>
              ))}
            </div>
          ) : null}

          <div className="grid gap-2 lg:grid-cols-2">
            {(expanded.semesters || []).length ? (
              (expanded.semesters || []).map((sem) => (
                <article key={`view-${sem.number}`} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="font-semibold text-slate-900">
                    {sem.title ||
                      getTermLabel(expanded.structureType || 'Semester', sem.number)}
                    {sem.durationMonths ? (
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {sem.durationMonths} months
                      </span>
                    ) : null}
                  </p>
                  {sem.description ? (
                    <p className="mt-1 text-xs text-slate-500">{sem.description}</p>
                  ) : null}
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {(sem.subjects || []).map((sub, i) => (
                      <li key={`${sem.number}-${i}`} className="flex justify-between gap-2">
                        <span>
                          {sub.name}
                          {sub.code ? <span className="text-slate-400"> ({sub.code})</span> : null}
                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            {[
                              sub.subjectType,
                              sub.credits ? `${sub.credits} cr` : '',
                              sub.maxMarks ? `Max ${sub.maxMarks}` : '',
                              sub.passingMarks ? `Pass ${sub.passingMarks}` : '',
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </span>
                      </li>
                    ))}
                    {!(sem.subjects || []).length ? (
                      <li className="text-slate-400">No subjects listed</li>
                    ) : null}
                  </ul>
                </article>
              ))
            ) : (
              <article className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="font-semibold text-slate-900">Subjects / Course Details</p>
                <p className="mt-2 text-sm text-slate-400">No subjects listed</p>
              </article>
            )}
          </div>
        </Panel>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={reload}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[#FF5E14]/40 hover:text-[#FF5E14]"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <Panel title="Course Records" className="min-w-0 overflow-hidden p-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading courses…</p>
        ) : (
          <>
            <DataTable
              columns={tableColumns}
              rows={table.pageRows}
              emptyTitle="No courses added"
              emptyDescription="University, ITI / SCVT, and TNS self courses yahan manage karein."
            />
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
            />
            <div className="mt-3 text-xs text-slate-500">
              University and ITI / SCVT courses stay linked through <code>universityId</code>. Institute self
              courses use {INSTITUTE_LABEL} without a university id. Course name pe click karke structure
              details dekhein.
            </div>
          </>
        )}
      </Panel>
    </section>
  )
}
