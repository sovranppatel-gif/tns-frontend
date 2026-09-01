import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Eye, FileText, Plus, Printer, Save, Trash2, Upload, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createAdmission,
  getAdmissionById,
  updateAdmission,
  uploadEducationDocument,
} from '../../../services/admissionService.js'
import { getUniversities } from '../../../services/universityService.js'
import { getCourseById, getCourses } from '../../../services/courseService.js'
import { API_URL } from '../../../utils/api.js'
import { getMasterAdminToken } from '../../../utils/masterAdminAuth.js'
import { masterAdminDashboardPath } from '../../../utils/masterAdminRoutes.js'
import { printAdmissionForm } from '../../../utils/printAdmissionForm.js'
import { DateInput } from '../../shared/DateInput.jsx'
import { PrimaryButton, SecondaryButton } from '../shared/MasterAdminUI.jsx'
import { card, inputFocus } from '../../../utils/masterAdminTheme.js'

const INSTITUTE_HINDI = 'Thakur Niranjan Singh I.T.I. & Computer'
const INSTITUTE_UNIVERSITY_ID = 'institute-gst'

const INSTITUTE_UNIVERSITY_OPTION = {
  _id: INSTITUTE_UNIVERSITY_ID,
  id: INSTITUTE_UNIVERSITY_ID,
  name: 'Thakur Niranjan Singh I.T.I. & Computer',
  shortName: 'TNS',
  status: 'Active',
  isInstituteOption: true,
}

const AFFIDAVIT_RULES = [
  'मैं यह वचन देता / देती हूँ कि मेरे द्वारा जमा की गई फीस किसी भी परिस्थिति में वापस नहीं ली जावेगी।',
  'मैं यह वचन देता / देती हूँ कि संस्थान में निर्धारित फीस प्रत्येक माह की 1 तारीख से 10 तारीख तक जमा करूंगा / करूंगी।',
  'मैं यह वचन देता / देती हूँ कि संस्थान में होने वाली समस्त सूचनायें सूचना पट्‌टिका के माध्यम से दी जावेगी।',
  'मैं यह वचन देता / देती हूँ कि संस्थान द्वारा दिये गये समस्त निर्देशों का पालन करूंगा / करूंगी।',
  'मैं यह वचन देता / देती हूँ कि निर्धारित समय पर फीस जमा न करने पर संस्थान द्वारा वैधानिक कार्यवाही की जा सकती है।',
  'मैं यह वचन देता / देती हूँ कि अध्ययन काल में 75% उपस्थिति अनिवार्य होगी।',
  'मैं यह वचन देता / देती हूँ कि समस्त अध्ययन कार्य संस्थान द्वारा निर्धारित समय में पूर्ण करूंगा / करूंगी।',
  'मैं यह वचन देता / देती हूँ कि संस्थान में अनुशासनहीनता / दुर्व्यवहार नहीं करूंगा / करूंगी।',
]

const emptyEducation = () => ({
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
})

const EDU_DOC_MAX_BYTES = 400 * 1024
const EDU_DOC_ACCEPT =
  'application/pdf,image/jpeg,image/png,image/webp,image/gif,.pdf,.jpg,.jpeg,.png,.webp,.gif'

function absoluteUploadUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_URL}${url.startsWith('/') ? url : `/${url}`}`
}

function mapEducationRow(row = {}) {
  return {
    ...emptyEducation(),
    className: row.className || '',
    board: row.board || '',
    year: row.year || '',
    rollNo: row.rollNo || '',
    percentage: row.percentage || '',
    division: row.division || '',
    documentUrl: row.documentUrl || '',
    documentName: row.documentName || '',
  }
}

function serializeEducation(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    className: String(row.className || '').trim(),
    board: String(row.board || '').trim(),
    year: String(row.year || '').trim(),
    rollNo: String(row.rollNo || '').trim(),
    percentage: String(row.percentage || '').trim(),
    division: String(row.division || '').trim(),
    documentUrl: String(row.documentUrl || '').trim(),
    documentName: String(row.documentName || '').trim(),
  }))
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const todayDisplay = () =>
  new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

function universityOptionLabel(uni) {
  const shortName = String(uni?.shortName || '').trim()
  const name = String(uni?.name || '').trim()
  if (shortName && name) return `${shortName} — ${name}`
  return shortName || name || 'University'
}

function isGstUniversity(uni) {
  if (!uni) return false
  if (String(uni._id || uni.id) === INSTITUTE_UNIVERSITY_ID) return true
  const shortName = String(uni?.shortName || '').trim()
  const name = String(uni?.name || '').trim()
  return (
    /^(GST|TNS)$/i.test(shortName) ||
    /grow\s*skills/i.test(name) ||
    /thakur\s*niranjan/i.test(name)
  )
}

function isInstituteCourse(course) {
  if (!course) return false
  if (String(course.type || '') === 'Institute') return true
  if (
    /^(GST|TNS)$/i.test(String(course.universityShortName || '')) &&
    !course.universityId
  ) {
    return true
  }
  return false
}

function courseOptionLabel(course) {
  if (!course) return ''
  const name = String(course.name || '').trim()
  const code = String(course.code || '').trim()
  if (!name) return code
  return code ? `${name} — ${code}` : name
}

function findCourseById(list, id) {
  if (!id) return null
  return (
    list.find((course) => String(course._id || course.id) === String(id)) || null
  )
}

function courseMatchesUniversity(course, university) {
  if (!course || !university) return false
  const uniId = String(university._id || university.id || '')
  if (isGstUniversity(university)) {
    return (
      isInstituteCourse(course) ||
      !course.universityId ||
      String(course.universityId || '') === uniId ||
      /^(GST|TNS)$/i.test(String(course.universityShortName || ''))
    )
  }
  return String(course.universityId || '') === uniId
}

function academicTermMeta(course) {
  if (!course) return { termType: '', count: 0, options: [] }
  const structureType = String(course.structureType || '').trim()
  if (structureType === 'Single Level') {
    return { termType: '', count: 0, options: [] }
  }

  const fromList = Array.isArray(course.semesters) ? course.semesters.length : 0
  const count = Number(course.semesterCount) || fromList || 0
  if (count <= 0) return { termType: '', count: 0, options: [] }

  const termType = structureType === 'Year' ? 'Year' : 'Semester'
  const options = Array.from({ length: count }, (_, i) => {
    const number = i + 1
    const sem = Array.isArray(course.semesters)
      ? course.semesters.find((row) => Number(row.number) === number)
      : null
    const label = String(sem?.title || '').trim() || `${termType} ${number}`
    return { number, label }
  })
  return { termType, count, options }
}

function feesFromCourse(course) {
  return {
    totalFee: String(course?.fees?.total || '').trim(),
  }
}

function courseDuration(course) {
  if (!course) return '—'
  return (
    String(course.durationLabel || course.durationDisplay || '').trim() ||
    (course.durationMonths ? `${course.durationMonths} months` : '—')
  )
}

function courseEligibility(course) {
  const text = String(course?.eligibility || '').trim()
  if (text) return text
  const details = course?.eligibilityDetails
  if (!details || typeof details !== 'object') return '—'
  const parts = [
    details.qualification,
    details.stream,
    details.minimumPercentage ? `Min ${details.minimumPercentage}%` : '',
  ].filter(Boolean)
  return parts.join(' · ') || '—'
}

function persistedUniversityId(universityId) {
  if (!universityId || universityId === INSTITUTE_UNIVERSITY_ID) return ''
  return universityId
}

const emptyForm = () => ({
  registrationNo: '',
  nameHindi: '',
  nameEnglish: '',
  fatherName: '',
  motherName: '',
  dateOfBirth: '',
  gender: '',
  category: '',
  samagraId: '',
  casteCertificateNo: '',
  maritalStatus: '',
  husbandName: '',
  education: [emptyEducation()],
  permanentAddress: '',
  village: '',
  post: '',
  tehsil: '',
  pinCode: '',
  contactNo: '',
  homeAddress: '',
  email: '',
  officeRegistrationNo: '',
  totalFee: '',
  universityId: '',
  courseId: '',
  legacyCourse: '',
  termType: '',
  termNumber: '',
  session: '2026-2027',
  admissionDate: todayIso(),
  officeDate: todayDisplay(),
  applicantDate: todayDisplay(),
  photoPreview: '',
  institutionName: INSTITUTE_HINDI,
  guardianName: '',
  guardianAddress: '',
  relation: '',
  guardianMobile: '',
  studentMobile: '',
  mode: 'Offline',
  status: 'Pending',
  counsellor: '',
})

const labelCls = 'mb-1 block text-xs font-semibold text-slate-600'
const fieldCls = `h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none ${inputFocus}`
const areaCls = `w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ${inputFocus}`

function Section({ title, children, action = null }) {
  return (
    <article className={`${card} p-3 sm:p-4`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {action}
      </div>
      {children}
    </article>
  )
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  )
}

export default function AdmissionFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const editingId = location.state?.editingId || null

  const [form, setForm] = useState(emptyForm)
  const [universities, setUniversities] = useState([])
  const [courses, setCourses] = useState([])
  const [loadedCollege, setLoadedCollege] = useState('')
  const [loading, setLoading] = useState(Boolean(editingId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [uniData, courseData] = await Promise.all([
          getUniversities(),
          getCourses().catch(() => ({ rows: [] })),
        ])
        if (cancelled) return
        setUniversities(Array.isArray(uniData.rows) ? uniData.rows : [])
        setCourses(Array.isArray(courseData.rows) ? courseData.rows : [])
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load universities')
          setUniversities([])
          setCourses([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!editingId) return undefined
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const entry = await getAdmissionById(editingId)
        if (cancelled) return
        const d = entry.details || {}
        setLoadedCollege(entry.college || d.universityNameSnapshot || d.universityName || '')
        setForm({
          ...emptyForm(),
          registrationNo: d.registrationNo || entry.admissionId || '',
          nameHindi: d.nameHindi || '',
          nameEnglish: d.nameEnglish || entry.applicant || '',
          fatherName: d.fatherName || '',
          motherName: d.motherName || '',
          dateOfBirth: d.dateOfBirth || '',
          gender: d.gender || '',
          category: d.category || '',
          samagraId: d.samagraId || '',
          casteCertificateNo: d.casteCertificateNo || '',
          maritalStatus: d.maritalStatus || '',
          husbandName: d.husbandName || '',
          education:
            Array.isArray(d.education) && d.education.length
              ? d.education.map((row) => mapEducationRow(row))
              : [emptyEducation()],
          permanentAddress: d.permanentAddress || '',
          village: d.village || '',
          post: d.post || '',
          tehsil: d.tehsil || '',
          pinCode: d.pinCode || '',
          contactNo: d.contactNo || entry.phone || '',
          homeAddress: d.homeAddress || '',
          email: entry.email || '',
          officeRegistrationNo: d.officeRegistrationNo || '',
          totalFee: d.totalFee || entry.fee || '',
          universityId: entry.universityId || d.universityId || '',
          courseId: entry.courseId || d.courseId || '',
          legacyCourse: entry.course || d.courseNameSnapshot || '',
          termType: entry.termType || d.termType || '',
          termNumber: entry.termNumber || d.termNumber || '',
          session: entry.session || d.session || '2026-2027',
          admissionDate: entry.admissionDate
            ? new Date(entry.admissionDate).toISOString().slice(0, 10)
            : todayIso(),
          officeDate: d.officeDate || todayDisplay(),
          applicantDate: d.applicantDate || todayDisplay(),
          photoPreview: d.photoPreview || '',
          institutionName:
            /grow\s*skills|ग्रो\s*स्किल्स/i.test(String(d.institutionName || ''))
              ? INSTITUTE_HINDI
              : d.institutionName || INSTITUTE_HINDI,
          guardianName: d.guardianName || d.fatherName || '',
          guardianAddress: d.guardianAddress || d.permanentAddress || '',
          relation: d.relation || '',
          guardianMobile: d.guardianMobile || '',
          studentMobile: d.studentMobile || d.contactNo || entry.phone || '',
          mode: entry.mode || 'Offline',
          status: entry.status || 'Pending',
          counsellor: entry.counsellor === '—' ? '' : entry.counsellor || '',
        })
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Unable to load admission')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [editingId])

  useEffect(() => {
    if (!form.courseId || findCourseById(courses, form.courseId)) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const entry = await getCourseById(form.courseId)
        if (cancelled || !entry) return
        setCourses((prev) =>
          findCourseById(prev, entry._id) ? prev : [...prev, entry],
        )
      } catch {
        /* keep legacy course string if the course master row is gone */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [form.courseId, courses])

  useEffect(() => {
    if (!universities.length || form.universityId || !loadedCollege) return
    const college = loadedCollege.trim().toLowerCase()
    const match = universities.find((uni) => {
      const name = String(uni.name || '').trim().toLowerCase()
      const shortName = String(uni.shortName || '').trim().toLowerCase()
      return name === college || shortName === college
    })
    if (match) {
      setForm((prev) => ({ ...prev, universityId: match._id || match.id || '' }))
    }
  }, [universities, form.universityId, loadedCollege])

  useEffect(() => {
    if (form.universityId || !form.courseId) return
    const course = findCourseById(courses, form.courseId)
    if (!course) return
    if (isInstituteCourse(course)) {
      const gst = universities.find(isGstUniversity)
      setForm((prev) => ({
        ...prev,
        universityId: gst?._id || gst?.id || INSTITUTE_UNIVERSITY_ID,
      }))
      return
    }
    if (course.universityId) {
      setForm((prev) => ({ ...prev, universityId: String(course.universityId) }))
    }
  }, [courses, universities, form.universityId, form.courseId])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const universityOptions = useMemo(() => {
    const active = universities.filter((uni) => String(uni.status || '') === 'Active')
    const hasGst = active.some(isGstUniversity)
    const hasInstituteCourses = courses.some(isInstituteCourse)
    const list = [...active]
    if (!hasGst && hasInstituteCourses) list.push(INSTITUTE_UNIVERSITY_OPTION)

    if (
      form.universityId &&
      !list.some((uni) => String(uni._id || uni.id) === String(form.universityId))
    ) {
      const extra = universities.find(
        (uni) => String(uni._id || uni.id) === String(form.universityId),
      )
      if (extra) list.unshift(extra)
      else if (String(form.universityId) === INSTITUTE_UNIVERSITY_ID) {
        list.unshift(INSTITUTE_UNIVERSITY_OPTION)
      }
    }
    return list
  }, [universities, courses, form.universityId])

  const selectedUniversity = useMemo(
    () =>
      universityOptions.find(
        (uni) => String(uni._id || uni.id) === String(form.universityId),
      ) || null,
    [universityOptions, form.universityId],
  )

  const selectedCourse = useMemo(
    () => findCourseById(courses, form.courseId),
    [courses, form.courseId],
  )

  const termMeta = useMemo(() => academicTermMeta(selectedCourse), [selectedCourse])

  const displayTotalFee = String(
    selectedCourse?.fees?.total || form.totalFee || '',
  ).trim()

  useEffect(() => {
    if (!selectedCourse) return
    const fees = feesFromCourse(selectedCourse)
    const nextTermType = academicTermMeta(selectedCourse).termType
    setForm((prev) => {
      const next = { ...prev }
      let changed = false
      if (fees.totalFee && prev.totalFee !== fees.totalFee) {
        next.totalFee = fees.totalFee
        changed = true
      }
      if (nextTermType && prev.termType !== nextTermType) {
        next.termType = nextTermType
        changed = true
      }
      return changed ? next : prev
    })
  }, [selectedCourse])

  const courseOptions = useMemo(() => {
    if (!form.universityId) return []
    const linked = courses.filter((course) => {
      const isSelected = String(course._id || course.id) === String(form.courseId)
      const active = String(course.status || 'Active') === 'Active'
      if (!active && !isSelected) return false
      return courseMatchesUniversity(course, selectedUniversity)
    })
    if (form.courseId && selectedCourse && !linked.some((course) => String(course._id) === String(form.courseId))) {
      return [selectedCourse, ...linked]
    }
    return linked
  }, [courses, form.universityId, form.courseId, selectedUniversity, selectedCourse])

  const onChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'universityId') {
        next.courseId = ''
        next.legacyCourse = ''
        next.totalFee = ''
        next.termType = ''
        next.termNumber = ''
      }
      if (key === 'courseId') {
        const course = findCourseById(courses, value)
        const fees = feesFromCourse(course)
        const meta = academicTermMeta(course)
        next.totalFee = fees.totalFee
        next.termType = meta.termType
        next.termNumber = ''
        next.legacyCourse = ''
      }
      if (key === 'fatherName') {
        if (!prev.guardianName || prev.guardianName === prev.fatherName) {
          next.guardianName = value
        }
      }
      if (key === 'permanentAddress') {
        if (!prev.homeAddress || prev.homeAddress === prev.permanentAddress) {
          next.homeAddress = value
        }
        if (!prev.guardianAddress || prev.guardianAddress === prev.permanentAddress) {
          next.guardianAddress = value
        }
      }
      if (key === 'contactNo') {
        if (!prev.studentMobile || prev.studentMobile === prev.contactNo) {
          next.studentMobile = value
        }
      }
      return next
    })
  }

  const onEducationChange = (index, key, value) => {
    setForm((prev) => {
      const education = prev.education.map((row, i) =>
        i === index ? { ...row, [key]: value } : row,
      )
      return { ...prev, education }
    })
  }

  const patchEducation = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    }))
  }

  const addEducationRow = () => {
    setForm((prev) => ({
      ...prev,
      education: [...prev.education, emptyEducation()],
    }))
  }

  const removeEducationRow = (index) => {
    setForm((prev) => {
      if (prev.education.length <= 1) return prev
      return {
        ...prev,
        education: prev.education.filter((_, i) => i !== index),
      }
    })
  }

  const handleEducationDocument = async (index, e) => {
    const input = e.target
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    const okType =
      /^(application\/pdf|image\/(jpeg|png|gif|webp))$/i.test(file.type) ||
      /\.(pdf|jpe?g|png|webp|gif)$/i.test(file.name)
    if (!okType) {
      patchEducation(index, {
        documentError: 'Only PDF or image files are allowed',
      })
      return
    }
    if (file.size > EDU_DOC_MAX_BYTES) {
      patchEducation(index, {
        documentError: 'Document must be 400 KB or smaller',
      })
      return
    }

    const token = getMasterAdminToken()
    if (!token) {
      patchEducation(index, {
        documentError: 'Please log in again to upload documents',
      })
      return
    }

    patchEducation(index, {
      documentUploading: true,
      documentError: '',
    })

    try {
      const data = await uploadEducationDocument(file, token)
      patchEducation(index, {
        documentUrl: data.url || '',
        documentName: data.name || file.name,
        documentUploading: false,
        documentError: '',
      })
    } catch (err) {
      patchEducation(index, {
        documentUploading: false,
        documentError: err.message || 'Upload failed',
      })
    }
  }

  const clearEducationDocument = (index) => {
    patchEducation(index, {
      documentUrl: '',
      documentName: '',
      documentError: '',
      documentUploading: false,
    })
  }

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be under 2 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange('photoPreview', String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const goBack = () => navigate(masterAdminDashboardPath('Admissions'))

  const courseSnapshotName = selectedCourse
    ? courseOptionLabel(selectedCourse)
    : form.legacyCourse
  const universityName =
    selectedUniversity?.name ||
    selectedUniversity?.shortName ||
    selectedCourse?.universityName ||
    (isInstituteCourse(selectedCourse) ? 'Thakur Niranjan Singh I.T.I. & Computer' : '')

  const buildDetails = () => {
    return {
      registrationNo: form.registrationNo.trim(),
      nameHindi: form.nameHindi.trim(),
      nameEnglish: form.nameEnglish.trim(),
      fatherName: form.fatherName.trim(),
      motherName: form.motherName.trim(),
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      category: form.category.trim(),
      samagraId: form.samagraId.trim(),
      casteCertificateNo: form.casteCertificateNo.trim(),
      maritalStatus: form.maritalStatus,
      husbandName:
        form.gender === 'Female' && form.maritalStatus === 'Married'
          ? form.husbandName.trim()
          : '',
      education: serializeEducation(form.education),
      permanentAddress: form.permanentAddress.trim(),
      village: form.village.trim(),
      post: form.post.trim(),
      tehsil: form.tehsil.trim(),
      pinCode: form.pinCode.trim(),
      contactNo: form.contactNo.trim(),
      homeAddress: form.homeAddress.trim(),
      officeRegistrationNo: form.officeRegistrationNo.trim(),
      totalFee: displayTotalFee,
      courseId: form.courseId || '',
      universityId: persistedUniversityId(form.universityId),
      universityName,
      universityNameSnapshot: universityName,
      universityShortName: selectedUniversity?.shortName || selectedCourse?.universityShortName || '',
      courseNameSnapshot: selectedCourse?.name || '',
      courseCodeSnapshot: selectedCourse?.code || '',
      termType: form.termType || termMeta.termType || '',
      termNumber: form.termNumber ? Number(form.termNumber) : '',
      session: form.session.trim(),
      officeDate: form.officeDate,
      applicantDate: form.applicantDate,
      photoPreview: form.photoPreview,
      institutionName: form.institutionName.trim(),
      guardianName: form.guardianName.trim() || form.fatherName.trim(),
      guardianAddress: form.guardianAddress.trim() || form.permanentAddress.trim(),
      relation: form.relation.trim(),
      guardianMobile: form.guardianMobile.trim(),
      studentMobile: form.studentMobile.trim() || form.contactNo.trim(),
    }
  }

  const handlePrint = () => {
    try {
      setError('')
      const details = buildDetails()
      printAdmissionForm({
        _id: editingId || '',
        admissionId: form.registrationNo || form.officeRegistrationNo || 'DRAFT',
        applicant: form.nameEnglish,
        email: form.email,
        phone: form.contactNo,
        course: courseSnapshotName,
        courseId: form.courseId,
        universityId: persistedUniversityId(form.universityId),
        session: form.session,
        termType: form.termType || termMeta.termType,
        termNumber: form.termNumber,
        mode: form.mode,
        counsellor: form.counsellor,
        fee: displayTotalFee,
        status: form.status,
        college: universityName,
        admissionDate: form.admissionDate,
        details,
      })
      setToast('Opening print dialog…')
    } catch (err) {
      setError(err?.message || 'Unable to print form')
    }
  }

  const handleSave = async () => {
    setError('')
    if (!form.nameEnglish.trim()) return setError('Name of applicant (English) is required')
    if (!form.email.trim()) return setError('E-Mail is required')
    if (!form.contactNo.trim()) return setError('Contact No. is required')
    if (!form.universityId) return setError('Please select a university')
    if (!form.courseId) {
      if (!editingId || !form.legacyCourse) return setError('Please select a course')
    }
    if (!form.session.trim()) return setError('Session is required')
    if (!form.admissionDate) return setError('Admission date is required')
    if (form.courseId && termMeta.count > 0 && !form.termNumber) {
      return setError(`Please select ${termMeta.termType.toLowerCase()}`)
    }
    if (form.education.some((row) => row.documentUploading)) {
      return setError('Please wait for education documents to finish uploading')
    }

    setSaving(true)
    try {
      const details = buildDetails()
      const payload = {
        applicant: form.nameEnglish.trim(),
        email: form.email.trim(),
        phone: form.contactNo.trim(),
        course: courseSnapshotName,
        courseId: form.courseId || undefined,
        universityId: persistedUniversityId(form.universityId) || undefined,
        termType: form.termType || termMeta.termType || '',
        termNumber: form.termNumber ? Number(form.termNumber) : null,
        session: form.session.trim(),
        mode: form.mode,
        counsellor: form.counsellor.trim(),
        fee: displayTotalFee,
        status: form.status,
        city: form.village.trim() || form.tehsil.trim(),
        state: 'Madhya Pradesh',
        college: universityName,
        studentStatus: '',
        notes: '',
        admissionDate: form.admissionDate,
        details,
      }

      if (editingId) {
        const entry = await updateAdmission(editingId, payload)
        setToast(
          payload.status === 'Approved' && entry?.studentId
            ? `Admission updated · Student ${entry.studentId} added`
            : 'Admission updated',
        )
      } else {
        const entry = await createAdmission(payload)
        setToast(
          payload.status === 'Approved' && entry?.studentId
            ? `Admission saved · Student ${entry.studentId} added`
            : 'Admission saved',
        )
      }
      window.setTimeout(goBack, 600)
    } catch (err) {
      setError(err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const pageTitle = useMemo(
    () => (editingId ? 'Edit Admission' : 'New Admission'),
    [editingId],
  )

  const showCourseSummary = Boolean(selectedCourse || form.legacyCourse || displayTotalFee)
  const structureLabel = termMeta.count
    ? `${termMeta.termType} · ${termMeta.count}`
    : selectedCourse?.structureType || '—'

  if (loading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
        Loading admission form…
      </section>
    )
  }

  return (
    <section className="space-y-3">
      {toast ? (
        <div className="fixed right-4 top-4 z-[90] rounded-lg bg-[#008C95] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className={`flex flex-col gap-3 ${card} p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between`}>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <SecondaryButton onClick={goBack}>
            <ArrowLeft size={14} /> Back to Admissions
          </SecondaryButton>
          <div>
            <p className="text-sm font-semibold text-slate-800">{pageTitle}</p>
            <p className="text-xs text-slate-500">
              Normal entry form — print pe official paper layout aayega.
            </p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SecondaryButton onClick={handlePrint} className="flex-1 sm:flex-none">
            <Printer size={14} /> Print Form
          </SecondaryButton>
          <PrimaryButton disabled={saving} onClick={handleSave} className="flex-1 sm:flex-none">
            <Save size={14} />
            {saving ? 'Saving…' : editingId ? 'Update Admission' : 'Save Admission'}
          </PrimaryButton>
        </div>
      </div>

      {error ? (
        <article className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
          {error}
        </article>
      ) : null}

      <Section title="Course & Session">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block sm:col-span-2 lg:col-span-1">
            <span className={labelCls}>University / Institute *</span>
            <select
              value={form.universityId}
              onChange={(e) => onChange('universityId', e.target.value)}
              className={fieldCls}
            >
              <option value="">Select university / institute</option>
              {universityOptions.map((uni) => {
                const id = uni._id || uni.id
                return (
                  <option key={id} value={id}>
                    {universityOptionLabel(uni)}
                  </option>
                )
              })}
            </select>
          </label>
          <label className="block sm:col-span-2 lg:col-span-1">
            <span className={labelCls}>Course *</span>
            <select
              value={form.courseId}
              onChange={(e) => onChange('courseId', e.target.value)}
              disabled={!form.universityId}
              className={`${fieldCls} disabled:bg-slate-50 disabled:text-slate-400`}
            >
              <option value="">
                {!form.universityId
                  ? 'Select university first'
                  : courseOptions.length
                    ? 'Select course'
                    : 'No courses found'}
              </option>
              {courseOptions.map((course) => {
                const id = course._id || course.id
                return (
                  <option key={id} value={id}>
                    {courseOptionLabel(course)}
                  </option>
                )
              })}
              {form.courseId &&
              !courseOptions.some(
                (course) => String(course._id || course.id) === String(form.courseId),
              ) ? (
                <option value={form.courseId}>
                  {form.legacyCourse || 'Previously selected course'}
                </option>
              ) : null}
            </select>
            {form.legacyCourse && !form.courseId ? (
              <p className="mt-1 text-[11px] text-amber-700">
                Legacy course: {form.legacyCourse}. Reselect from the list if available.
              </p>
            ) : null}
          </label>
          <label className="block">
            <span className={labelCls}>Session *</span>
            <input
              value={form.session}
              onChange={(e) => onChange('session', e.target.value)}
              className={fieldCls}
              placeholder="2026-2027"
            />
          </label>
          <label className="block">
            <span className={labelCls}>Admission Date *</span>
            <DateInput
              value={form.admissionDate}
              onChange={(e) => onChange('admissionDate', e.target.value)}
              className={fieldCls}
            />
          </label>
          {termMeta.count > 0 ? (
            <label className="block">
              <span className={labelCls}>Academic Term *</span>
              <select
                value={form.termNumber}
                onChange={(e) => onChange('termNumber', e.target.value)}
                className={fieldCls}
              >
                <option value="">Select {termMeta.termType.toLowerCase()}</option>
                {termMeta.options.map((option) => (
                  <option key={option.number} value={option.number}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block">
            <span className={labelCls}>Mode</span>
            <select
              value={form.mode}
              onChange={(e) => onChange('mode', e.target.value)}
              className={fieldCls}
            >
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
              <option value="Walk-in">Walk-in</option>
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Status</span>
            <select
              value={form.status}
              onChange={(e) => onChange('status', e.target.value)}
              className={fieldCls}
            >
              <option value="Pending">Pending</option>
              <option value="Verification">Verification</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Counsellor</span>
            <input
              value={form.counsellor}
              onChange={(e) => onChange('counsellor', e.target.value)}
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Admission / Registration No.</span>
            <input
              value={form.registrationNo}
              onChange={(e) => onChange('registrationNo', e.target.value.toUpperCase())}
              className={fieldCls}
              placeholder={editingId ? '' : 'Auto-generated on save'}
            />
          </label>
        </div>

        {showCourseSummary ? (
          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Course Summary
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryItem
                label="Course"
                value={selectedCourse?.name || form.legacyCourse}
              />
              <SummaryItem label="Code" value={selectedCourse?.code} />
              <SummaryItem
                label="University / Institute"
                value={
                  selectedCourse?.universityLabel ||
                  universityOptionLabel(selectedUniversity) ||
                  universityName
                }
              />
              <SummaryItem label="Category" value={selectedCourse?.category} />
              <SummaryItem label="Duration" value={courseDuration(selectedCourse)} />
              <SummaryItem label="Structure" value={structureLabel} />
              <SummaryItem
                label={termMeta.termType === 'Year' ? 'Years' : 'Semesters'}
                value={
                  termMeta.count
                    ? String(termMeta.count)
                    : selectedCourse?.semesterCount
                      ? String(selectedCourse.semesterCount)
                      : '—'
                }
              />
              <SummaryItem label="Mode" value={selectedCourse?.mode} />
              <SummaryItem label="Eligibility" value={courseEligibility(selectedCourse)} />
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Total Course Fee
                </p>
                <input
                  value={displayTotalFee}
                  readOnly
                  tabIndex={-1}
                  className={`${fieldCls} mt-1 max-w-xs cursor-not-allowed bg-white font-semibold text-slate-800`}
                  placeholder={form.courseId ? 'No fee on this course' : 'Select a course'}
                />
              </div>
            </div>
          </div>
        ) : null}
      </Section>

      <Section title="Applicant Details">
        <div className="mb-4 flex flex-wrap items-start gap-4">
          <label className="flex h-28 w-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-500 hover:border-[#00A896]">
            {form.photoPreview ? (
              <img src={form.photoPreview} alt="Applicant" className="h-full w-full object-cover" />
            ) : (
              <span className="px-1 text-center leading-tight">Passport Photo</span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
          </label>
          <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block sm:col-span-2 lg:col-span-1">
              <span className={labelCls}>Name (English) *</span>
              <input
                value={form.nameEnglish}
                onChange={(e) => onChange('nameEnglish', e.target.value.toUpperCase())}
                className={fieldCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Name (Hindi)</span>
              <input
                value={form.nameHindi}
                onChange={(e) => onChange('nameHindi', e.target.value)}
                className={fieldCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Father Name</span>
              <input
                value={form.fatherName}
                onChange={(e) => onChange('fatherName', e.target.value.toUpperCase())}
                className={fieldCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Mother Name</span>
              <input
                value={form.motherName}
                onChange={(e) => onChange('motherName', e.target.value.toUpperCase())}
                className={fieldCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Date of Birth</span>
              <DateInput
                value={form.dateOfBirth}
                onChange={(e) => onChange('dateOfBirth', e.target.value)}
                className={fieldCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Gender</span>
              <select
                value={form.gender}
                onChange={(e) => {
                  const value = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    gender: value,
                    husbandName:
                      value === 'Female' && prev.maritalStatus === 'Married'
                        ? prev.husbandName
                        : '',
                  }))
                }}
                className={fieldCls}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Category</span>
              <input
                value={form.category}
                onChange={(e) => onChange('category', e.target.value.toUpperCase())}
                className={fieldCls}
                placeholder="GEN / OBC / SC / ST"
              />
            </label>
            <label className="block">
              <span className={labelCls}>Marital Status</span>
              <select
                value={form.maritalStatus}
                onChange={(e) => {
                  const value = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    maritalStatus: value,
                    husbandName:
                      prev.gender === 'Female' && value === 'Married'
                        ? prev.husbandName
                        : '',
                  }))
                }}
                className={fieldCls}
              >
                <option value="">Select</option>
                <option value="Single">Single</option>
                <option value="Unmarried">Unmarried</option>
                <option value="Married">Married</option>
              </select>
            </label>
            {form.gender === 'Female' && form.maritalStatus === 'Married' ? (
              <label className="block">
                <span className={labelCls}>Husband Name</span>
                <input
                  value={form.husbandName}
                  onChange={(e) => onChange('husbandName', e.target.value.toUpperCase())}
                  className={fieldCls}
                  placeholder="Husband's full name"
                />
              </label>
            ) : null}
            <label className="block">
              <span className={labelCls}>Samagra ID</span>
              <input
                value={form.samagraId}
                onChange={(e) => onChange('samagraId', e.target.value)}
                className={fieldCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Caste Certificate No.</span>
              <input
                value={form.casteCertificateNo}
                onChange={(e) => onChange('casteCertificateNo', e.target.value)}
                className={fieldCls}
              />
            </label>
          </div>
        </div>
      </Section>

      <Section title="Contact & Address">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className={labelCls}>Contact No. *</span>
            <input
              value={form.contactNo}
              onChange={(e) => onChange('contactNo', e.target.value)}
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Student Mobile</span>
            <input
              value={form.studentMobile}
              onChange={(e) => onChange('studentMobile', e.target.value)}
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>E-Mail *</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              className={fieldCls}
            />
          </label>
          <label className="block sm:col-span-2 lg:col-span-3">
            <span className={labelCls}>Permanent Address</span>
            <textarea
              rows={2}
              value={form.permanentAddress}
              onChange={(e) => onChange('permanentAddress', e.target.value.toUpperCase())}
              className={areaCls}
            />
          </label>
          <label className="block sm:col-span-2 lg:col-span-3">
            <span className={labelCls}>Home / Correspondence Address</span>
            <textarea
              rows={2}
              value={form.homeAddress}
              onChange={(e) => onChange('homeAddress', e.target.value.toUpperCase())}
              className={areaCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Village</span>
            <input
              value={form.village}
              onChange={(e) => onChange('village', e.target.value.toUpperCase())}
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Post</span>
            <input
              value={form.post}
              onChange={(e) => onChange('post', e.target.value.toUpperCase())}
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Tehsil</span>
            <input
              value={form.tehsil}
              onChange={(e) => onChange('tehsil', e.target.value.toUpperCase())}
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>PIN Code</span>
            <input
              value={form.pinCode}
              onChange={(e) => onChange('pinCode', e.target.value)}
              className={fieldCls}
            />
          </label>
        </div>
      </Section>

      <Section
        title="Educational Qualification"
        action={
          <button
            type="button"
            onClick={addEducationRow}
            className="inline-flex items-center gap-1 rounded-full border border-[#00A896]/30 px-2.5 py-1 text-xs font-semibold text-[#008C95] hover:bg-[#00A896]/10"
          >
            <Plus size={12} /> Add row
          </button>
        }
      >
        <div className="space-y-3">
          {form.education.map((row, index) => (
            <div
              key={`edu-${index}`}
              className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5"
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
                <label className="block lg:col-span-1">
                  <span className={labelCls}>Class</span>
                  <input
                    value={row.className}
                    onChange={(e) =>
                      onEducationChange(index, 'className', e.target.value.toUpperCase())
                    }
                    className={fieldCls}
                  />
                </label>
                <label className="block lg:col-span-1">
                  <span className={labelCls}>Board</span>
                  <input
                    value={row.board}
                    onChange={(e) =>
                      onEducationChange(index, 'board', e.target.value.toUpperCase())
                    }
                    className={fieldCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Year</span>
                  <input
                    value={row.year}
                    onChange={(e) => onEducationChange(index, 'year', e.target.value)}
                    className={fieldCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Roll No.</span>
                  <input
                    value={row.rollNo}
                    onChange={(e) => onEducationChange(index, 'rollNo', e.target.value)}
                    className={fieldCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>%</span>
                  <input
                    value={row.percentage}
                    onChange={(e) => onEducationChange(index, 'percentage', e.target.value)}
                    className={fieldCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Division</span>
                  <input
                    value={row.division}
                    onChange={(e) =>
                      onEducationChange(index, 'division', e.target.value.toUpperCase())
                    }
                    className={fieldCls}
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={form.education.length <= 1}
                    onClick={() => removeEducationRow(index)}
                    className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-[#00A896]/35 bg-white px-3 py-2">
                <FileText size={16} className="shrink-0 text-[#008C95]" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-700">
                    Marksheet / Document
                    {row.className ? (
                      <span className="font-normal text-slate-500"> ({row.className})</span>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-slate-500">PDF or image · max 400 KB</p>
                </div>

                {row.documentUrl ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={absoluteUploadUrl(row.documentUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-[#005F6B] hover:bg-[#00A896]/10"
                    >
                      <Eye size={12} />
                      {row.documentName || 'View document'}
                    </a>
                    <button
                      type="button"
                      onClick={() => clearEducationDocument(index)}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <X size={12} />
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-gradient-to-r from-[#FF5E14] to-[#008C95] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95">
                    <Upload size={12} />
                    {row.documentUploading ? 'Uploading…' : 'Upload'}
                    <input
                      type="file"
                      accept={EDU_DOC_ACCEPT}
                      className="hidden"
                      disabled={row.documentUploading}
                      onChange={(e) => handleEducationDocument(index, e)}
                    />
                  </label>
                )}
              </div>
              {row.documentError ? (
                <p className="text-[11px] text-rose-600">{row.documentError}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Office">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className={labelCls}>Office Registration No.</span>
            <input
              value={form.officeRegistrationNo}
              onChange={(e) =>
                onChange('officeRegistrationNo', e.target.value.toUpperCase())
              }
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Institution (Hindi)</span>
            <input
              value={form.institutionName}
              onChange={(e) => onChange('institutionName', e.target.value)}
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Office Date</span>
            <input
              value={form.officeDate}
              onChange={(e) => onChange('officeDate', e.target.value)}
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Applicant Date</span>
            <input
              value={form.applicantDate}
              onChange={(e) => onChange('applicantDate', e.target.value)}
              className={fieldCls}
            />
          </label>
        </div>
      </Section>

      <Section title="शपथ पत्र / Guardian">
        <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-slate-600 sm:text-sm">
          {AFFIDAVIT_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Guardian Name</span>
            <input
              value={form.guardianName}
              onChange={(e) => onChange('guardianName', e.target.value.toUpperCase())}
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Relation</span>
            <input
              value={form.relation}
              onChange={(e) => onChange('relation', e.target.value)}
              className={fieldCls}
              placeholder="Father / Mother / Guardian"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelCls}>Guardian Address</span>
            <input
              value={form.guardianAddress}
              onChange={(e) => onChange('guardianAddress', e.target.value.toUpperCase())}
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Guardian Mobile</span>
            <input
              value={form.guardianMobile}
              onChange={(e) => onChange('guardianMobile', e.target.value)}
              className={fieldCls}
            />
          </label>
        </div>
      </Section>

      <div className="flex flex-wrap justify-end gap-2">
        <SecondaryButton disabled={saving} onClick={goBack}>
          Cancel
        </SecondaryButton>
        <SecondaryButton onClick={handlePrint}>
          <Printer size={14} /> Print Form
        </SecondaryButton>
        <PrimaryButton disabled={saving} onClick={handleSave}>
          <Save size={14} />
          {saving ? 'Saving…' : editingId ? 'Update Admission' : 'Save Admission'}
        </PrimaryButton>
      </div>
    </section>
  )
}
