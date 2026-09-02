import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  CheckCircle2,
  Eye,
  FileText,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  UserCog,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import {
  assignStudentBatch,
  createStudentFromAdmission,
  getStudentById,
  getStudentMeta,
  getStudents,
  syncStudentsFromAdmissions,
  updateStudent,
  updateStudentStatus,
  uploadStudentDocument,
  uploadStudentPhoto,
} from '../../../services/studentService.js'
import { getUniversities } from '../../../services/universityService.js'
import { getCourses } from '../../../services/courseService.js'
import { getBatches } from '../../../services/batchService.js'
import { masterAdminPath } from '../../../utils/masterAdminRoutes.js'
import { printStudentProfile } from '../../../utils/printStudentProfile.js'
import { DateInput } from '../../shared/DateInput.jsx'
import {
  DataTable,
  Modal,
  PageToolbar,
  Pagination,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  StatusBadge,
  downloadCsv,
  useClientTable,
} from '../shared/MasterAdminUI.jsx'
import StudentProfilePage, { StudentPhoto, photoSrc } from './StudentProfilePage.jsx'
import { API_URL } from '../../../utils/api.js'

const exportColumns = [
  { key: 'studentId', label: 'Student ID' },
  { key: 'admissionId', label: 'Admission No.' },
  { key: 'nameEnglish', label: 'Name' },
  { key: 'courseLabel', label: 'Course' },
  { key: 'batchLabel', label: 'Batch' },
  { key: 'currentTermLabel', label: 'Current Term' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'email', label: 'Email' },
  { key: 'universityLabel', label: 'University' },
  { key: 'status', label: 'Status' },
]

const STUDENT_STATUSES = [
  'Active',
  'Inactive',
  'Completed',
  'Dropped',
  'Cancelled',
  'Transferred',
  'Suspended',
]

const EDU_DOC_ACCEPT =
  'application/pdf,image/jpeg,image/png,image/webp,image/gif,.pdf,.jpg,.jpeg,.png,.webp,.gif'

const DEFAULT_DOCUMENT_TYPES = [
  'Passport Photo',
  'Aadhaar',
  '10th Marksheet',
  '12th Marksheet',
  'Graduation Marksheet',
  'Transfer Certificate',
  'Migration Certificate',
  'Caste Certificate',
  'Domicile',
  'Other',
]

function absoluteUploadUrl(url) {
  if (!url) return ''
  if (/^(data:|https?:|blob:)/i.test(url)) return url
  return `${API_URL}${url.startsWith('/') ? url : `/${url}`}`
}

function toIsoDate(value) {
  if (!value) return ''
  const raw = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function emptyEducation() {
  return {
    className: '',
    board: '',
    year: '',
    rollNo: '',
    percentage: '',
    division: '',
    documentUrl: '',
    documentName: '',
    documentUploading: false,
    documentError: '',
  }
}

function emptyIdentityDoc() {
  return {
    documentType: 'Aadhaar',
    documentName: '',
    documentUrl: '',
    documentNumber: '',
    verified: false,
    uploading: false,
    error: '',
  }
}

function serializeEducation(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      className: String(row.className || '').trim(),
      board: String(row.board || '').trim(),
      year: String(row.year || '').trim(),
      rollNo: String(row.rollNo || '').trim(),
      percentage: String(row.percentage || '').trim(),
      division: String(row.division || '').trim(),
      documentUrl: String(row.documentUrl || '').trim(),
      documentName: String(row.documentName || '').trim(),
    }))
    .filter((row) => row.className || row.board || row.documentUrl || row.rollNo)
}

function serializeDocuments(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((doc) => ({
      ...(doc._id ? { _id: doc._id } : {}),
      documentType: String(doc.documentType || 'Other').trim() || 'Other',
      documentName: String(doc.documentName || '').trim(),
      documentUrl: String(doc.documentUrl || '').trim(),
      documentNumber: String(doc.documentNumber || '').trim(),
      verified: Boolean(doc.verified),
    }))
    .filter((doc) => doc.documentUrl || doc.documentName || doc.documentNumber)
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#00A896] focus:ring-2 focus:ring-[#00A896]/15'

const areaClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#00A896] focus:ring-2 focus:ring-[#00A896]/15'

function Field({ label, required = false, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </div>
  )
}

function FormSection({ title, children }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  )
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function termOptionsFromCourse(course) {
  if (!course) return []
  const structure = String(course.structureType || 'Semester')
  if (structure === 'Single Level') return []
  const type = structure === 'Year' ? 'Year' : 'Semester'
  const fromList = Array.isArray(course.semesters)
    ? course.semesters
        .map((s) => Number(s.number))
        .filter((n) => Number.isFinite(n) && n > 0)
    : []
  const count = Number(course.semesterCount) || fromList.length || 0
  if (count <= 0) return []
  return Array.from({ length: count }, (_, i) => ({
    type,
    number: i + 1,
    label: `${type} ${i + 1}`,
  }))
}

function emptyForm() {
  return {
    admissionMongoId: '',
    universityId: '',
    courseId: '',
    batchId: '',
    session: '',
    termType: 'Semester',
    termNumber: '',
    status: 'Active',
    admissionDate: '',
    photo: '',
    nameEnglish: '',
    nameHindi: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: '',
    category: '',
    samagraId: '',
    casteCertificateNo: '',
    maritalStatus: '',
    husbandName: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    permanentAddress: '',
    correspondenceAddress: '',
    village: '',
    post: '',
    tehsil: '',
    district: '',
    state: '',
    pinCode: '',
    guardianName: '',
    relation: '',
    guardianMobile: '',
    guardianAddress: '',
    education: [emptyEducation()],
    documents: [],
    admissionDetails: {},
  }
}

function mapStudentToForm(student) {
  const address = student.address || {}
  const guardian = student.guardian || {}
  const education = Array.isArray(student.education) && student.education.length
    ? student.education.map((row) => ({ ...emptyEducation(), ...row, documentUploading: false, documentError: '' }))
    : [emptyEducation()]
  const documents = Array.isArray(student.documents)
    ? student.documents.map((doc) => ({ ...emptyIdentityDoc(), ...doc, uploading: false, error: '' }))
    : []
  const admissionDetails = student.admissionDetails || {}
  return {
    admissionMongoId: student.admissionMongoId || '',
    universityId: student.universityId || '',
    courseId: student.courseId || '',
    batchId: student.batchId || '',
    session: student.session || '',
    termType: student.currentTerm?.type || 'Semester',
    termNumber: student.currentTerm?.number || '',
    status: student.status || 'Active',
    admissionDate: toIsoDate(student.admissionDate),
    photo: student.photo || '',
    nameEnglish: student.nameEnglish || '',
    nameHindi: student.nameHindi || '',
    fatherName: student.fatherName || '',
    motherName: student.motherName || '',
    dateOfBirth: student.dateOfBirth || '',
    gender: student.gender || '',
    category: student.category || '',
    samagraId: student.samagraId || '',
    casteCertificateNo: student.casteCertificateNo || '',
    maritalStatus: student.maritalStatus || '',
    husbandName: student.husbandName || '',
    mobile: student.contact?.mobile || student.mobile || '',
    alternateMobile: student.contact?.alternateMobile || '',
    email: student.contact?.email || student.email || '',
    permanentAddress: address.permanent || '',
    correspondenceAddress: address.correspondence || '',
    village: address.village || '',
    post: address.post || '',
    tehsil: address.tehsil || '',
    district: address.district || '',
    state: address.state || '',
    pinCode: address.pinCode || '',
    guardianName: guardian.name || '',
    relation: guardian.relation || '',
    guardianMobile: guardian.mobile || '',
    guardianAddress: guardian.address || '',
    education,
    documents,
    admissionDetails: {
      registrationNo: admissionDetails.registrationNo || student.admissionId || '',
      officeRegistrationNo: admissionDetails.officeRegistrationNo || '',
      totalFee: admissionDetails.totalFee || '',
      institutionName: admissionDetails.institutionName || '',
      officeDate: admissionDetails.officeDate || '',
      applicantDate: admissionDetails.applicantDate || '',
      mode: admissionDetails.mode || '',
      counsellor: admissionDetails.counsellor || '',
    },
  }
}

export default function StudentsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const viewId = searchParams.get('id') || ''

  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [meta, setMeta] = useState({ eligibleAdmissions: [], sessions: [] })
  const [universities, setUniversities] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  const [universityFilter, setUniversityFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [termFilter, setTermFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedAdmission, setSelectedAdmission] = useState(null)
  const formRef = useRef(null)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignStudent, setAssignStudent] = useState(null)
  const [assignForm, setAssignForm] = useState({
    batchId: '',
    session: '',
    joiningDate: todayIso(),
    termType: 'Semester',
    termNumber: '',
  })

  const [moreId, setMoreId] = useState('')
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setError('')
      const [studentData, metaData, uniData, courseData, batchData] = await Promise.all([
        getStudents(),
        getStudentMeta().catch(() => ({ eligibleAdmissions: [], sessions: [] })),
        getUniversities().catch(() => ({ rows: [] })),
        getCourses().catch(() => ({ rows: [] })),
        getBatches().catch(() => ({ rows: [] })),
      ])
      let nextRows = studentData.rows
      let nextStats = studentData.stats || {}
      let nextMeta = metaData
      if ((metaData.eligibleAdmissions || []).length > 0) {
        const synced = await syncStudentsFromAdmissions().catch(() => null)
        if (synced) {
          nextRows = synced.rows.length ? synced.rows : nextRows
          nextStats = synced.stats || nextStats
          if (synced.created > 0) {
            setToast(`${synced.created} student(s) added from approved admissions`)
          }
          nextMeta = await getStudentMeta().catch(() => metaData)
        }
      }
      setRows(nextRows)
      setStats(nextStats)
      setMeta(nextMeta)
      setUniversities(Array.isArray(uniData.rows) ? uniData.rows : [])
      setCourses(Array.isArray(courseData.rows) ? courseData.rows : [])
      setBatches(Array.isArray(batchData.rows) ? batchData.rows : [])
    } catch (err) {
      setError(err?.message || 'Unable to load students')
      setRows([])
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

  useEffect(() => {
    const createId = location.state?.createFromAdmissionId
    if (!createId) return undefined
    setForm((prev) => ({ ...prev, admissionMongoId: String(createId) }))
    setFormOpen(true)
    setEditingId(null)
    return undefined
  }, [location.state?.createFromAdmissionId])

  useEffect(() => {
    if (!viewId) {
      setProfile(null)
      return undefined
    }
    let cancelled = false
    setProfileLoading(true)
    getStudentById(viewId)
      .then((entry) => {
        if (!cancelled) setProfile(entry)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Unable to load student')
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [viewId])

  const filterCourses = useMemo(() => {
    if (!universityFilter) return courses
    return courses.filter((c) => String(c.universityId || '') === String(universityFilter) || c.type === 'Institute')
  }, [courses, universityFilter])

  const filterBatches = useMemo(() => {
    if (!courseFilter) return batches
    return batches.filter((b) => String(b.courseId) === String(courseFilter))
  }, [batches, courseFilter])

  const filterCourseDoc = useMemo(
    () => courses.find((c) => String(c._id) === String(courseFilter)) || null,
    [courses, courseFilter],
  )
  const filterTerms = useMemo(() => termOptionsFromCourse(filterCourseDoc), [filterCourseDoc])

  const sessionOptions = useMemo(() => {
    const set = new Set([...(meta.sessions || []), ...rows.map((r) => r.session).filter(Boolean)])
    if (!set.size) set.add('2026-2027')
    return [...set].sort()
  }, [meta.sessions, rows])

  const scopedRows = useMemo(() => {
    return rows.filter((row) => {
      if (universityFilter && String(row.universityId) !== String(universityFilter)) return false
      if (courseFilter && String(row.courseId) !== String(courseFilter)) return false
      if (sessionFilter && String(row.session) !== String(sessionFilter)) return false
      if (batchFilter && String(row.batchId) !== String(batchFilter)) return false
      if (termFilter) {
        const [type, number] = String(termFilter).split(':')
        if (String(row.currentTerm?.type || '') !== type) return false
        if (String(row.currentTerm?.number || '') !== String(number)) return false
      }
      if (genderFilter && String(row.gender) !== genderFilter) return false
      if (categoryFilter && String(row.category) !== categoryFilter) return false
      return true
    })
  }, [
    rows,
    universityFilter,
    courseFilter,
    sessionFilter,
    batchFilter,
    termFilter,
    genderFilter,
    categoryFilter,
  ])

  const table = useClientTable(scopedRows, {
    searchKeys: [
      'studentId',
      'admissionId',
      'nameEnglish',
      'mobile',
      'email',
      'courseLabel',
      'courseName',
      'batchLabel',
      'batchName',
      'universityLabel',
    ],
    pageSize: 8,
    filterKey: 'status',
  })

  const formCourse = useMemo(
    () => courses.find((c) => String(c._id) === String(form.courseId)) || null,
    [courses, form.courseId],
  )
  const formTerms = useMemo(() => termOptionsFromCourse(formCourse), [formCourse])
  const formBatches = useMemo(() => {
    if (!form.courseId) return []
    return batches.filter((b) => String(b.courseId) === String(form.courseId) && b.status !== 'Archived')
  }, [batches, form.courseId])

  const assignCourse = useMemo(
    () =>
      courses.find((c) => String(c._id) === String(assignStudent?.courseId)) ||
      null,
    [courses, assignStudent],
  )
  const assignTerms = useMemo(() => termOptionsFromCourse(assignCourse), [assignCourse])
  const assignBatches = useMemo(() => {
    if (!assignStudent?.courseId) return []
    return batches.filter(
      (b) => String(b.courseId) === String(assignStudent.courseId) && b.status !== 'Archived',
    )
  }, [batches, assignStudent])

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm())
    setSelectedAdmission(null)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setSelectedAdmission(null)
    setFormOpen(true)
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const openEdit = async (row) => {
    try {
      const full = row.contact ? row : await getStudentById(row._id || row.studentId)
      setEditingId(full._id)
      setForm(mapStudentToForm(full))
      setSelectedAdmission(null)
      setFormOpen(true)
      window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch (err) {
      setError(err?.message || 'Unable to load student for edit')
    }
  }

  const openProfile = (row) => {
    setMoreId('')
    setFormOpen(false)
    setSearchParams({ id: String(row._id || row.studentId) })
  }

  const openAssign = (row) => {
    setMoreId('')
    setAssignStudent(row)
    setAssignForm({
      batchId: row.batchId || '',
      session: row.session || '',
      joiningDate: todayIso(),
      termType: row.currentTerm?.type || 'Semester',
      termNumber: row.currentTerm?.number || '',
    })
    setAssignOpen(true)
  }

  const handleSave = async () => {
    setError('')
    if (!editingId && !form.admissionMongoId) {
      return setError('Select an approved admission to create a student')
    }
    setSaving(true)
    try {
      const payload = {
        universityId: form.universityId,
        courseId: form.courseId,
        batchId: form.batchId,
        session: form.session,
        currentTerm: {
          type: form.termType,
          number: form.termNumber ? Number(form.termNumber) : null,
        },
        status: form.status,
        contact: {
          mobile: form.mobile,
          alternateMobile: form.alternateMobile,
          email: form.email,
        },
      }
      if (editingId) {
        Object.assign(payload, {
          nameEnglish: form.nameEnglish,
          nameHindi: form.nameHindi,
          fatherName: form.fatherName,
          motherName: form.motherName,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          category: form.category,
          samagraId: form.samagraId,
          casteCertificateNo: form.casteCertificateNo,
          maritalStatus: form.maritalStatus,
          husbandName: form.husbandName,
          photo: form.photo,
          admissionDate: form.admissionDate || undefined,
          address: {
            permanent: form.permanentAddress,
            correspondence: form.correspondenceAddress,
            village: form.village,
            post: form.post,
            tehsil: form.tehsil,
            district: form.district,
            state: form.state,
            pinCode: form.pinCode,
          },
          guardian: {
            name: form.guardianName,
            relation: form.relation,
            mobile: form.guardianMobile,
            address: form.guardianAddress,
          },
          education: serializeEducation(form.education),
          documents: serializeDocuments(form.documents),
          admissionDetails: form.admissionDetails,
        })
        await updateStudent(editingId, payload)
        setToast('Student updated')
      } else {
        await createStudentFromAdmission({
          admissionMongoId: form.admissionMongoId,
          ...payload,
        })
        setToast('Student created')
      }
      closeForm()
      await reload()
      if (viewId) {
        const entry = await getStudentById(viewId)
        setProfile(entry)
      }
    } catch (err) {
      setError(err?.message || 'Unable to save student')
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async () => {
    if (!assignStudent) return
    if (!assignForm.batchId) return setError('Select a batch')
    setSaving(true)
    try {
      await assignStudentBatch(assignStudent._id || assignStudent.studentId, {
        universityId: assignStudent.universityId,
        courseId: assignStudent.courseId,
        batchId: assignForm.batchId,
        session: assignForm.session,
        joiningDate: assignForm.joiningDate,
        currentTerm: {
          type: assignForm.termType,
          number: assignForm.termNumber ? Number(assignForm.termNumber) : null,
        },
      })
      setToast('Batch assigned')
      setAssignOpen(false)
      setAssignStudent(null)
      await reload()
      if (viewId) {
        const entry = await getStudentById(viewId)
        setProfile(entry)
      }
    } catch (err) {
      setError(err?.message || 'Unable to assign batch')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (row) => {
    const ok = window.confirm(
      `Deactivate ${row.nameEnglish || row.studentId}?\n\nAdmission, fees, attendance and history will be kept.`,
    )
    if (!ok) return
    try {
      await updateStudentStatus(row._id || row.studentId, 'Inactive')
      setToast('Student deactivated')
      setMoreId('')
      await reload()
      if (viewId) {
        const entry = await getStudentById(viewId)
        setProfile(entry)
      }
    } catch (err) {
      setError(err?.message || 'Unable to deactivate student')
    }
  }

  const handlePrint = async (row) => {
    try {
      const full = await getStudentById(row._id || row.studentId)
      printStudentProfile(full)
    } catch (err) {
      setError(err?.message || 'Unable to print profile')
    }
  }

  const goFees = (row) => {
    const key = row.admissionId || row.studentId || row._id
    navigate(`/master-admin/fees/${encodeURIComponent(key)}`)
  }

  const goAttendance = (row) => {
    navigate(masterAdminPath('Attendance'), {
      state: { studentSearch: row.studentId || row.admissionId || row.nameEnglish },
    })
  }

  const goResults = () => navigate(masterAdminPath('Exam Results'))

  const goIdCard = async (row) => {
    try {
      const full = row.photo != null && row.contact ? row : await getStudentById(row._id || row.studentId)
      navigate(masterAdminPath('ID Card Generate'), { state: { student: full } })
    } catch (err) {
      setError(err?.message || 'Unable to open ID card')
    }
  }

  const handleSync = async () => {
    setSaving(true)
    try {
      const data = await syncStudentsFromAdmissions()
      setToast(data.message)
      setRows(data.rows.length ? data.rows : rows)
      if (data.stats) setStats(data.stats)
      await reload()
    } catch (err) {
      setError(err?.message || 'Sync failed')
    } finally {
      setSaving(false)
    }
  }

  const onAdmissionPick = (admissionId) => {
    const adm = (meta.eligibleAdmissions || []).find((a) => String(a._id) === String(admissionId))
    setSelectedAdmission(adm || null)
    setForm((prev) => ({
      ...prev,
      admissionMongoId: admissionId,
      universityId: adm?.universityId || prev.universityId,
      courseId: adm?.courseId || prev.courseId,
      session: adm?.session || prev.session,
    }))
  }

  const handleStudentPhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setError('')
      const data = await uploadStudentPhoto(file)
      setForm((prev) => ({ ...prev, photo: data.url || '' }))
    } catch (err) {
      setError(err?.message || 'Unable to upload photo')
    }
  }

  const handleStudentDocument = async (index, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.map((doc, i) => i === index ? { ...doc, uploading: true, error: '' } : doc),
    }))
    try {
      const data = await uploadStudentDocument(file)
      setForm((prev) => ({
        ...prev,
        documents: prev.documents.map((doc, i) => i === index
          ? { ...doc, documentUrl: data.url || '', documentName: data.name || file.name, uploading: false }
          : doc),
      }))
    } catch (err) {
      setForm((prev) => ({
        ...prev,
        documents: prev.documents.map((doc, i) => i === index ? { ...doc, uploading: false, error: err?.message || 'Upload failed' } : doc),
      }))
    }
  }

  const addStudentDocument = () => setForm((prev) => ({ ...prev, documents: [...prev.documents, emptyIdentityDoc()] }))
  const patchStudentDocument = (index, patch) => setForm((prev) => ({
    ...prev,
    documents: prev.documents.map((doc, i) => i === index ? { ...doc, ...patch } : doc),
  }))
  const removeStudentDocument = (index) => setForm((prev) => ({
    ...prev,
    documents: prev.documents.filter((_, i) => i !== index),
  }))

  const handleStudentEducationDocument = async (index, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setForm((prev) => ({
      ...prev,
      education: prev.education.map((row, i) => i === index ? { ...row, documentUploading: true, documentError: '' } : row),
    }))
    try {
      const data = await uploadStudentDocument(file)
      setForm((prev) => ({
        ...prev,
        education: prev.education.map((row, i) => i === index
          ? { ...row, documentUrl: data.url || '', documentName: data.name || file.name, documentUploading: false }
          : row),
      }))
    } catch (err) {
      setForm((prev) => ({
        ...prev,
        education: prev.education.map((row, i) => i === index ? { ...row, documentUploading: false, documentError: err?.message || 'Upload failed' } : row),
      }))
    }
  }

  const addStudentEducation = () => setForm((prev) => ({ ...prev, education: [...prev.education, emptyEducation()] }))
  const removeStudentEducation = (index) => setForm((prev) => ({
    ...prev,
    education: prev.education.length > 1 ? prev.education.filter((_, i) => i !== index) : prev.education,
  }))

  const actionBtn =
    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition'

  const tableColumns = [
    {
      key: 'photo',
      label: 'Photo',
      render: (row) => <StudentPhoto student={row} size="sm" />,
    },
    {
      key: 'nameEnglish',
      label: 'Student',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{row.nameEnglish || '—'}</p>
          <p className="text-xs text-slate-500">{row.studentId}</p>
          <p className="text-xs text-slate-500">Admission: {row.admissionId || '—'}</p>
        </div>
      ),
    },
    {
      key: 'studentId',
      label: 'Student ID',
      render: (row) => <span className="font-medium text-slate-800">{row.studentId}</span>,
    },
    {
      key: 'courseLabel',
      label: 'Course',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-800">{row.courseName || row.courseLabel || '—'}</p>
          <p className="text-xs text-slate-500">{row.courseCode || ''}</p>
        </div>
      ),
    },
    {
      key: 'batchLabel',
      label: 'Batch',
      render: (row) => row.batchLabel || '—',
    },
    {
      key: 'currentTermLabel',
      label: 'Current Term',
      render: (row) => row.currentTermLabel || '—',
    },
    {
      key: 'mobile',
      label: 'Mobile',
      render: (row) => row.mobile || '—',
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
        <div className="relative flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => openProfile(row)}
            className={`${actionBtn} border-[#008C95]/30 bg-[#008C95]/10 text-[#008C95] hover:bg-[#008C95]/15`}
          >
            <Eye size={12} /> View
          </button>
          <button
            type="button"
            onClick={() => openEdit(row)}
            className={`${actionBtn} border-slate-200 bg-white text-slate-700 hover:border-[#008C95]/40`}
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            onClick={() => openAssign(row)}
            className={`${actionBtn} border-[#FF5E14]/30 bg-[#FF5E14]/10 text-[#FF5E14] hover:bg-[#FF5E14]/15`}
          >
            <UserCog size={12} /> Assign Batch
          </button>
          <button
            type="button"
            onClick={() => setMoreId((id) => (id === row._id ? '' : row._id))}
            className={`${actionBtn} border-slate-200 bg-white text-slate-700`}
          >
            <MoreHorizontal size={12} /> More
          </button>
          {moreId === row._id ? (
            <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
              <button type="button" className="block w-full rounded-md px-3 py-1.5 text-left text-xs hover:bg-slate-50" onClick={() => goFees(row)}>
                View Fees
              </button>
              <button type="button" className="block w-full rounded-md px-3 py-1.5 text-left text-xs hover:bg-slate-50" onClick={() => goAttendance(row)}>
                Attendance
              </button>
              <button type="button" className="block w-full rounded-md px-3 py-1.5 text-left text-xs hover:bg-slate-50" onClick={goResults}>
                Results
              </button>
              <button type="button" className="block w-full rounded-md px-3 py-1.5 text-left text-xs hover:bg-slate-50" onClick={() => setToast('Documents are available on the student profile')}>
                Documents
              </button>
              <button type="button" className="block w-full rounded-md px-3 py-1.5 text-left text-xs hover:bg-slate-50" onClick={() => goIdCard(row)}>
                ID Card
              </button>
              <button type="button" className="block w-full rounded-md px-3 py-1.5 text-left text-xs hover:bg-slate-50" onClick={() => handlePrint(row)}>
                Print Profile
              </button>
              {row.status !== 'Inactive' ? (
                <button type="button" className="block w-full rounded-md px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50" onClick={() => handleDeactivate(row)}>
                  Deactivate
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ),
    },
  ]

  const studentFormPanel = formOpen ? (
    <div ref={formRef}>
      <StudentFormPanel
        form={form}
        setForm={setForm}
        editingId={editingId}
        saving={saving}
        universities={universities}
        courses={courses}
        formBatches={formBatches}
        formTerms={formTerms}
        meta={meta}
        selectedAdmission={selectedAdmission}
        onAdmissionPick={onAdmissionPick}
        onPhotoChange={handleStudentPhoto}
        onDocumentChange={handleStudentDocument}
        onDocumentPatch={patchStudentDocument}
        onDocumentAdd={addStudentDocument}
        onDocumentRemove={removeStudentDocument}
        onEducationChange={handleStudentEducationDocument}
        onEducationAdd={addStudentEducation}
        onEducationRemove={removeStudentEducation}
        onSave={handleSave}
        onCancel={closeForm}
        cancelLabel={viewId ? 'Back to profile' : 'Cancel'}
      />
    </div>
  ) : null

  if (viewId) {
    return (
      <>
        {toast ? (
          <div className="fixed right-3 top-3 z-[90] rounded-lg bg-[#008C95] px-4 py-2 text-sm font-medium text-white shadow-lg">
            {toast}
          </div>
        ) : null}
        {error ? (
          <article className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            {error}
          </article>
        ) : null}
        {formOpen ? (
          <section className="w-full min-w-0 space-y-3">
            {studentFormPanel}
          </section>
        ) : (
          <StudentProfilePage
            student={profile}
            loading={profileLoading}
            onBack={() => setSearchParams({})}
            onEdit={() => profile && openEdit(profile)}
            onAssignBatch={() => profile && openAssign(profile)}
            onPrint={() => profile && handlePrint(profile)}
            onIdCard={() => profile && goIdCard(profile)}
            onViewFees={() => profile && goFees(profile)}
            onViewAttendance={() => profile && goAttendance(profile)}
            onViewResults={goResults}
          />
        )}
        <Modal
          open={assignOpen}
          title="Assign Batch"
          wide
          onClose={() => setAssignOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setAssignOpen(false)}>Cancel</SecondaryButton>
              <PrimaryButton disabled={saving} onClick={handleAssign}>
                {saving ? 'Saving…' : 'Assign Batch'}
              </PrimaryButton>
            </div>
          }
        >
          <AssignFields
            student={assignStudent}
            form={assignForm}
            setForm={setAssignForm}
            batches={assignBatches}
            terms={assignTerms}
          />
        </Modal>
      </>
    )
  }

  return (
    <section className="w-full min-w-0 space-y-3 overflow-x-hidden">
      {toast ? (
        <div className="fixed right-3 top-3 z-[90] max-w-[calc(100vw-1.5rem)] rounded-lg bg-[#008C95] px-4 py-2 text-sm font-medium text-white shadow-lg sm:right-4 sm:top-4">
          {toast}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-5">
        <StatCard label="Total Students" value={loading ? '—' : String(stats.total ?? rows.length)} icon={Users} />
        <StatCard label="Active Students" value={loading ? '—' : String(stats.active ?? 0)} icon={CheckCircle2} />
        <StatCard label="New Admissions" value={loading ? '—' : String(stats.newAdmissions ?? 0)} icon={UserPlus} hint="This month" />
        <StatCard label="Completed" value={loading ? '—' : String(stats.completed ?? 0)} icon={GraduationCap} />
        <StatCard label="Inactive" value={loading ? '—' : String(stats.inactive ?? 0)} icon={UserMinus} hint="Includes dropped / cancelled" />
      </div>

      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          {error}
        </article>
      ) : null}

      <PageToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search ID, admission, name, mobile, email, course, batch…"
        filters={STUDENT_STATUSES}
        filterValue={table.filter}
        onFilter={table.setFilter}
        addLabel="Add Student"
        onAdd={openCreate}
        onExportCsv={() => downloadCsv('students.csv', exportColumns, table.filtered)}
        onExportExcel={() => downloadCsv('students.xls', exportColumns, table.filtered)}
        onExportPdf={() => window.print()}
        extraActions={
          <>
            <button type="button" onClick={reload} className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={handleSync}
              disabled={saving}
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-[#008C95]/30 bg-[#008C95]/10 px-3 text-sm font-semibold text-[#008C95]"
            >
              Sync from Admissions
            </button>
          </>
        }
      />

      <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <select
          value={universityFilter}
          onChange={(e) => {
            setUniversityFilter(e.target.value)
            setCourseFilter('')
            setBatchFilter('')
            table.setPage(1)
          }}
          className={inputClass}
        >
          <option value="">All universities</option>
          {universities.map((u) => (
            <option key={u._id} value={u._id}>
              {u.shortName ? `${u.shortName} — ${u.name}` : u.name}
            </option>
          ))}
        </select>
        <select
          value={courseFilter}
          onChange={(e) => {
            setCourseFilter(e.target.value)
            setBatchFilter('')
            setTermFilter('')
            table.setPage(1)
          }}
          className={inputClass}
        >
          <option value="">All courses</option>
          {filterCourses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.code ? `${c.name} — ${c.code}` : c.name}
            </option>
          ))}
        </select>
        <select value={sessionFilter} onChange={(e) => { setSessionFilter(e.target.value); table.setPage(1) }} className={inputClass}>
          <option value="">All sessions</option>
          {sessionOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={batchFilter} onChange={(e) => { setBatchFilter(e.target.value); table.setPage(1) }} className={inputClass}>
          <option value="">All batches</option>
          {filterBatches.map((b) => (
            <option key={b._id} value={b._id}>{b.name || b.batchId}</option>
          ))}
        </select>
        <select value={termFilter} onChange={(e) => { setTermFilter(e.target.value); table.setPage(1) }} className={inputClass}>
          <option value="">All terms</option>
          {filterTerms.map((t) => (
            <option key={`${t.type}:${t.number}`} value={`${t.type}:${t.number}`}>{t.label}</option>
          ))}
        </select>
        <select value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); table.setPage(1) }} className={inputClass}>
          <option value="">All genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); table.setPage(1) }} className={inputClass}>
          <option value="">All categories</option>
          {['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {studentFormPanel}

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading students…</p>
      ) : (
        <>
          <DataTable
            columns={tableColumns}
            rows={table.pageRows}
            emptyTitle="No students found"
            emptyDescription="Approve an admission, then create or sync students."
            onRowClick={openProfile}
            wrap
          />
          <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
        </>
      )}

      <Modal
        open={assignOpen}
        title="Assign Batch"
        wide
        onClose={() => setAssignOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setAssignOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving} onClick={handleAssign}>
              {saving ? 'Saving…' : 'Assign Batch'}
            </PrimaryButton>
          </div>
        }
      >
        <AssignFields
          student={assignStudent}
          form={assignForm}
          setForm={setAssignForm}
          batches={assignBatches}
          terms={assignTerms}
        />
      </Modal>
    </section>
  )
}

function StudentFormPanel({
  form,
  setForm,
  editingId,
  saving,
  universities,
  courses,
  formBatches,
  formTerms,
  meta,
  selectedAdmission,
  onAdmissionPick,
  onPhotoChange,
  onDocumentChange,
  onDocumentPatch,
  onDocumentAdd,
  onDocumentRemove,
  onEducationChange,
  onEducationAdd,
  onEducationRemove,
  onSave,
  onCancel,
  cancelLabel = 'Cancel',
}) {
  return (
    <Panel title={editingId ? 'Edit Student' : 'Create Student from Admission'} className="p-3">
      <div className="space-y-3">
        {!editingId ? (
          <FormSection title="Approved Admission">
            <Field label="Select admission" required>
              <select
                value={form.admissionMongoId}
                onChange={(e) => onAdmissionPick(e.target.value)}
                className={inputClass}
              >
                <option value="">Choose approved admission</option>
                {(meta.eligibleAdmissions || []).map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.admissionId} — {a.applicant} ({a.course})
                  </option>
                ))}
              </select>
            </Field>
            {selectedAdmission ? (
              <p className="text-xs text-slate-500">
                Personal, parent, contact and academic details will be copied from this admission. Student ID is generated on the server.
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                No duplicate admission form. If the list is empty, approve an admission or use Sync from Admissions.
              </p>
            )}
          </FormSection>
        ) : null}

        <FormSection title="Academic mapping">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="University">
              <select
                value={form.universityId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, universityId: e.target.value, courseId: '', batchId: '' }))
                }
                className={inputClass}
              >
                <option value="">Select university</option>
                {universities
                  .filter((u) => u.status === 'Active' || String(u._id) === String(form.universityId))
                  .map((u) => (
                    <option key={u._id} value={u._id} disabled={u.status !== 'Active' && String(u._id) !== String(form.universityId)}>
                      {u.shortName ? `${u.shortName} — ${u.name}` : u.name}
                      {u.status !== 'Active' ? ' (inactive)' : ''}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Course">
              <select
                value={form.courseId}
                onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value, batchId: '', termNumber: '' }))}
                className={inputClass}
              >
                <option value="">Select course</option>
                {courses
                  .filter((c) => {
                    if (form.universityId && String(c.universityId) !== String(form.universityId) && c.type !== 'Institute') {
                      return String(c._id) === String(form.courseId)
                    }
                    return c.status === 'Active' || String(c._id) === String(form.courseId)
                  })
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.code ? `${c.name} — ${c.code}` : c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Session">
              <input
                value={form.session}
                onChange={(e) => setForm((prev) => ({ ...prev, session: e.target.value }))}
                className={inputClass}
                placeholder="2026-2027"
              />
            </Field>
            <Field label="Batch">
              <select
                value={form.batchId}
                onChange={(e) => setForm((prev) => ({ ...prev, batchId: e.target.value }))}
                className={inputClass}
              >
                <option value="">Not assigned</option>
                {formBatches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name || b.batchId}</option>
                ))}
              </select>
            </Field>
            <Field label="Current Term">
              <select
                value={form.termNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, termNumber: e.target.value, termType: formTerms[0]?.type || prev.termType }))}
                className={inputClass}
              >
                <option value="">Select term</option>
                {formTerms.map((t) => (
                  <option key={t.number} value={t.number}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className={inputClass}>
                {STUDENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>

        <FormSection title="Contact updates">
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Mobile">
              <input value={form.mobile} onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Alternate mobile">
              <input value={form.alternateMobile} onChange={(e) => setForm((prev) => ({ ...prev, alternateMobile: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Email">
              <input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className={inputClass} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Applicant details">
          <div className="mb-3 flex flex-wrap items-start gap-3">
            <label className="flex h-28 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white text-center text-xs text-slate-500">
              {form.photo ? <img src={absoluteUploadUrl(form.photo)} alt="Student" className="h-full w-full object-cover" /> : <span>Passport Photo</span>}
              <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
            </label>
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['nameEnglish', 'Name (English)'], ['nameHindi', 'Name (Hindi)'], ['fatherName', 'Father Name'],
                ['motherName', 'Mother Name'], ['dateOfBirth', 'Date of Birth'], ['samagraId', 'Samagra ID'],
                ['casteCertificateNo', 'Caste Certificate No.'],
              ].map(([key, label]) => <Field key={key} label={label}><input type={key === 'dateOfBirth' ? 'date' : 'text'} value={form[key]} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} className={inputClass} /></Field>)}
              <Field label="Gender"><select value={form.gender} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))} className={inputClass}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
              <Field label="Category"><select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className={inputClass}><option value="">Select</option>{['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'].map((value) => <option key={value}>{value}</option>)}</select></Field>
              <Field label="Marital Status"><select value={form.maritalStatus} onChange={(e) => setForm((prev) => ({ ...prev, maritalStatus: e.target.value }))} className={inputClass}><option value="">Select</option><option>Single</option><option>Unmarried</option><option>Married</option></select></Field>
              {form.gender === 'Female' && form.maritalStatus === 'Married' ? <Field label="Husband Name"><input value={form.husbandName} onChange={(e) => setForm((prev) => ({ ...prev, husbandName: e.target.value }))} className={inputClass} /></Field> : null}
            </div>
          </div>
        </FormSection>

        <FormSection title="Address">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['permanentAddress', 'Permanent Address'], ['correspondenceAddress', 'Correspondence Address'], ['village', 'Village'],
              ['post', 'Post'], ['tehsil', 'Tehsil'], ['district', 'District'], ['state', 'State'], ['pinCode', 'PIN Code'],
            ].map(([key, label]) => <Field key={key} label={label} className={key.includes('Address') ? 'sm:col-span-2' : ''}><input value={form[key]} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} className={inputClass} /></Field>)}
          </div>
        </FormSection>

        <FormSection title="Parent / Guardian">
          <div className="grid gap-2 sm:grid-cols-2">
            {['guardianName', 'relation', 'guardianMobile', 'guardianAddress'].map((key) => <Field key={key} label={key === 'guardianName' ? 'Guardian Name' : key === 'guardianMobile' ? 'Guardian Mobile' : key === 'guardianAddress' ? 'Guardian Address' : 'Relation'}><input value={form[key]} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} className={inputClass} /></Field>)}
          </div>
        </FormSection>

        <FormSection title="Admission / Office details">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['registrationNo', 'Admission / Registration No.'], ['officeRegistrationNo', 'Office Registration No.'],
              ['totalFee', 'Total Fee'], ['institutionName', 'Institution'], ['officeDate', 'Office Date'],
              ['applicantDate', 'Applicant Date'], ['mode', 'Mode'], ['counsellor', 'Counsellor'],
            ].map(([key, label]) => <Field key={key} label={label}><input value={form.admissionDetails?.[key] || ''} onChange={(e) => setForm((prev) => ({ ...prev, admissionDetails: { ...prev.admissionDetails, [key]: e.target.value } }))} className={inputClass} /></Field>)}
          </div>
        </FormSection>

        <FormSection title="Educational qualification">
          <button type="button" onClick={onEducationAdd} className="mb-2 rounded-lg border border-[#008C95]/30 px-3 py-2 text-xs font-semibold text-[#008C95]">+ Add qualification</button>
          {form.education.map((row, index) => <div key={`education-${index}`} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-2 lg:grid-cols-4">
            {['className', 'board', 'year', 'rollNo', 'percentage', 'division'].map((key) => <Field key={key} label={key === 'className' ? 'Class' : key === 'rollNo' ? 'Roll No.' : key}><input value={row[key]} onChange={(e) => setForm((prev) => ({ ...prev, education: prev.education.map((item, i) => i === index ? { ...item, [key]: e.target.value } : item) }))} className={inputClass} /></Field>)}
            <label className="flex items-end"><span className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-[#008C95] px-2 text-xs font-semibold text-white">{row.documentUploading ? 'Uploading…' : 'Upload marksheet'}<input type="file" accept={EDU_DOC_ACCEPT} className="hidden" disabled={row.documentUploading} onChange={(e) => onEducationChange(index, e)} /></span></label>
            {row.documentUrl ? <a href={absoluteUploadUrl(row.documentUrl)} target="_blank" rel="noreferrer" className="self-end text-sm font-semibold text-[#008C95]">View document</a> : null}
            <button type="button" onClick={() => onEducationRemove(index)} className="self-end rounded-lg border border-rose-200 px-2 py-2 text-xs font-semibold text-rose-600">Remove</button>
            {row.documentError ? <p className="text-xs text-rose-600 sm:col-span-2 lg:col-span-4">{row.documentError}</p> : null}
          </div>)}
        </FormSection>

        <FormSection title="Documents">
          <div className="space-y-2">
            {form.documents.map((doc, index) => <div key={doc._id || `document-${index}`} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Document type"><select value={doc.documentType} onChange={(e) => onDocumentPatch(index, { documentType: e.target.value })} className={inputClass}>{DEFAULT_DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field>
              <Field label="Document name"><input value={doc.documentName} onChange={(e) => onDocumentPatch(index, { documentName: e.target.value })} className={inputClass} /></Field>
              <Field label="Document number"><input value={doc.documentNumber} onChange={(e) => onDocumentPatch(index, { documentNumber: e.target.value })} className={inputClass} /></Field>
              <label className="flex items-end"><span className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-[#008C95] px-2 text-xs font-semibold text-white">{doc.uploading ? 'Uploading…' : 'Upload file'}<input type="file" accept={EDU_DOC_ACCEPT} className="hidden" disabled={doc.uploading} onChange={(e) => onDocumentChange(index, e)} /></span></label>
              <button type="button" onClick={() => onDocumentRemove(index)} className="self-end rounded-lg border border-rose-200 px-2 py-2 text-xs font-semibold text-rose-600">Remove</button>
              {doc.documentUrl ? <a href={absoluteUploadUrl(doc.documentUrl)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#008C95]">{doc.documentName || 'View uploaded document'}</a> : null}
              {doc.error ? <p className="text-xs text-rose-600 sm:col-span-2 lg:col-span-5">{doc.error}</p> : null}
            </div>)}
            <button type="button" onClick={onDocumentAdd} className="rounded-lg border border-[#008C95]/30 px-3 py-2 text-xs font-semibold text-[#008C95]">+ Add document</button>
          </div>
        </FormSection>

        <div className="flex flex-wrap gap-2">
          <PrimaryButton disabled={saving} onClick={onSave}>
            {saving ? 'Saving…' : editingId ? 'Update Student' : 'Create Student'}
          </PrimaryButton>
          <SecondaryButton onClick={onCancel}>{cancelLabel}</SecondaryButton>
        </div>
      </div>
    </Panel>
  )
}

function AssignFields({ student, form, setForm, batches, terms }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {student?.nameEnglish} · {student?.studentId}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="University">
          <input readOnly value={student?.universityLabel || ''} className={`${inputClass} bg-slate-50`} />
        </Field>
        <Field label="Course">
          <input readOnly value={student?.courseLabel || ''} className={`${inputClass} bg-slate-50`} />
        </Field>
        <Field label="Session">
          <input
            value={form.session}
            onChange={(e) => setForm((prev) => ({ ...prev, session: e.target.value }))}
            className={inputClass}
            placeholder="2026-2027"
          />
        </Field>
        <Field label="Batch" required>
          <select
            value={form.batchId}
            onChange={(e) => setForm((prev) => ({ ...prev, batchId: e.target.value }))}
            className={inputClass}
          >
            <option value="">Select batch</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name || b.batchId}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Joining Date">
          <DateInput
            value={form.joiningDate}
            onChange={(e) => setForm((prev) => ({ ...prev, joiningDate: e.target.value }))}
            className={inputClass}
          />
        </Field>
        <Field label="Current Term">
          <select
            value={form.termNumber}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                termNumber: e.target.value,
                termType: terms[0]?.type || prev.termType,
              }))
            }
            className={inputClass}
          >
            <option value="">Select term</option>
            {terms.map((t) => (
              <option key={t.number} value={t.number}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  )
}
