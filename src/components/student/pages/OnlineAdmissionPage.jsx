import { useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Eye,
  FileText,
  Plus,
  Send,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import {
  createOnlineAdmission,
  getAdmissionCatalog,
  getMyOnlineAdmission,
  uploadEducationDocument,
} from '../../../services/admissionService.js'
import { API_URL } from '../../../utils/api.js'
import { getStudentSession, getStudentToken } from '../../../utils/studentAuth.js'
import { DateInput } from '../../shared/DateInput.jsx'
import { Panel, PrimaryButton, SecondaryButton } from '../shared/StudentUI.jsx'

const INSTITUTE_HINDI = 'टीएनएस आईटीआई एंड कंप्यूटर'

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

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#00A896] focus:ring-2 focus:ring-[#FF5E14]/20'
const labelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500'

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
const EDU_DOC_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp,image/gif,.pdf,.jpg,.jpeg,.png,.webp,.gif'

function absoluteUploadUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_URL}${url.startsWith('/') ? url : `/${url}`}`
}

const todayIso = () => new Date().toISOString().slice(0, 10)

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {required ? <span className="text-[#FF5E14]"> *</span> : null}
      </span>
      {children}
    </label>
  )
}

export default function OnlineAdmissionPage() {
  const session = getStudentSession()

  const [form, setForm] = useState(() => ({
    registrationNo: '',
    nameHindi: '',
    nameEnglish: session?.name ? String(session.name).toUpperCase() : '',
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
    contactNo: session?.phone || '',
    homeAddress: '',
    email: session?.email || '',
    officeRegistrationNo: '',
    totalFee: '',
    registrationFee: '',
    universityId: '',
    course: '',
    courseId: '',
    session: '2026-2027',
    admissionDate: todayIso(),
    photoPreview: '',
    institutionName: INSTITUTE_HINDI,
    guardianName: '',
    guardianAddress: '',
    relation: '',
    guardianMobile: '',
    studentMobile: session?.phone || '',
    agreeAffidavit: false,
    paymentMode: 'Online',
    onlineMethod: 'UPI',
    offlineMethod: 'Cash',
    paymentAmount: '',
    transactionId: '',
    paymentNote: '',
    paymentProofName: '',
  }))

  const [errors, setErrors] = useState({})
  const [application, setApplication] = useState(null)
  const [loadingApplication, setLoadingApplication] = useState(true)
  const [universities, setUniversities] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')

  const appStatus = String(application?.status || '')
  const isUnderReview = appStatus === 'Pending' || appStatus === 'Verification'
  const isApproved = appStatus === 'Approved'
  const isRejected = appStatus === 'Rejected'

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      try {
        setCatalogError('')
        const data = await getAdmissionCatalog()
        if (cancelled) return
        setUniversities(data.universities || [])
      } catch (err) {
        if (!cancelled) {
          setUniversities([])
          setCatalogError(err?.message || 'Unable to load universities and courses')
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    }

    loadCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadMine() {
      const token = getStudentToken()
      if (!token) {
        setLoadingApplication(false)
        return
      }
      try {
        const entry = await getMyOnlineAdmission(token)
        if (!cancelled) setApplication(entry)
      } catch {
        if (!cancelled) setApplication(null)
      } finally {
        if (!cancelled) setLoadingApplication(false)
      }
    }

    loadMine()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedUniversity = useMemo(
    () => universities.find((u) => u.id === form.universityId) || null,
    [universities, form.universityId],
  )

  const courseOptions = useMemo(
    () => (Array.isArray(selectedUniversity?.courses) ? selectedUniversity.courses : []),
    [selectedUniversity],
  )

  const selectedCourse = useMemo(
    () => courseOptions.find((c) => c.id === form.courseId || c.label === form.course) || null,
    [courseOptions, form.courseId, form.course],
  )

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const setUpper = (key, value) => setField(key, String(value || '').toUpperCase())

  const updateEducation = (index, key, value) => {
    setForm((prev) => {
      const education = prev.education.map((row, i) => {
        if (i !== index) return row
        const nextVal =
          key === 'year' ||
          key === 'rollNo' ||
          key === 'percentage' ||
          key === 'documentUrl' ||
          key === 'documentName' ||
          key === 'documentError' ||
          key === 'documentUploading'
            ? value
            : String(value || '').toUpperCase()
        return { ...row, [key]: nextVal }
      })
      return { ...prev, education }
    })
  }

  const patchEducation = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.map((row, i) =>
        i === index ? { ...row, ...patch } : row
      ),
    }))
  }

  const addEducationRow = () => {
    setForm((prev) => ({ ...prev, education: [...prev.education, emptyEducation()] }))
  }

  const removeEducationRow = (index) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.length <= 1 ? [emptyEducation()] : prev.education.filter((_, i) => i !== index),
    }))
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

    const token = getStudentToken()
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

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photoPreview: 'Photo must be under 2 MB' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setField('photoPreview', String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

  const handlePaymentProof = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setField('paymentProofName', file.name)
  }

  const validate = () => {
    const next = {}
    if (!form.nameEnglish.trim()) next.nameEnglish = 'Required'
    if (!form.email.trim()) next.email = 'Required'
    if (!form.contactNo.trim()) next.contactNo = 'Required'
    if (!form.universityId) next.universityId = 'Required'
    if (!form.course) next.course = 'Required'
    if (!form.agreeAffidavit) next.agreeAffidavit = 'Please accept the affidavit'
    if (!form.paymentMode) next.paymentMode = 'Required'
    if (!form.paymentAmount.trim()) next.paymentAmount = 'Required'
    if (form.paymentMode === 'Online' && !form.onlineMethod) next.onlineMethod = 'Required'
    if (form.paymentMode === 'Offline' && !form.offlineMethod) next.offlineMethod = 'Required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isUnderReview || isApproved) {
      setToast(
        isApproved
          ? 'Your admission is already approved.'
          : 'Your application is already under review.'
      )
      window.setTimeout(() => setToast(''), 2800)
      return
    }
    if (!validate()) {
      setToast('Please fill required fields before sending.')
      window.setTimeout(() => setToast(''), 2800)
      return
    }

    const token = getStudentToken()
    if (!token) {
      setToast('Please log in again to submit your application.')
      window.setTimeout(() => setToast(''), 3200)
      return
    }

    setSubmitting(true)
    try {
      const universityName = selectedUniversity?.label || selectedUniversity?.name || ''
      const courseName = selectedCourse?.label || selectedCourse?.name || form.course
      const education = form.education.map((row) => ({
        className: row.className || '',
        board: row.board || '',
        year: row.year || '',
        rollNo: row.rollNo || '',
        percentage: row.percentage || '',
        division: row.division || '',
        documentUrl: row.documentUrl || '',
        documentName: row.documentName || '',
      }))

      const details = {
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
        education,
        permanentAddress: form.permanentAddress.trim(),
        village: form.village.trim(),
        post: form.post.trim(),
        tehsil: form.tehsil.trim(),
        pinCode: form.pinCode.trim(),
        contactNo: form.contactNo.trim(),
        homeAddress: form.homeAddress.trim(),
        officeRegistrationNo: form.officeRegistrationNo.trim(),
        totalFee: form.totalFee.trim() || selectedCourse?.feesTotal || '',
        registrationFee:
          form.registrationFee.trim() || selectedCourse?.feesRegistration || '',
        session: form.session.trim(),
        photoPreview: form.photoPreview,
        institutionName: form.institutionName.trim(),
        guardianName: form.guardianName.trim() || form.fatherName.trim(),
        guardianAddress: form.guardianAddress.trim() || form.permanentAddress.trim(),
        relation: form.relation.trim(),
        guardianMobile: form.guardianMobile.trim(),
        studentMobile: form.studentMobile.trim() || form.contactNo.trim(),
        universityId: form.universityId,
        universityName,
        universityShortName: selectedUniversity?.shortName || '',
        courseId: selectedCourse?.id || form.courseId || '',
        courseCode: selectedCourse?.code || '',
        courseDuration: selectedCourse?.durationLabel || '',
        agreeAffidavit: form.agreeAffidavit,
        payment: {
          mode: form.paymentMode,
          onlineMethod: form.onlineMethod,
          offlineMethod: form.offlineMethod,
          amount: form.paymentAmount.trim(),
          transactionId: form.transactionId.trim(),
          note: form.paymentNote.trim(),
          proofName: form.paymentProofName || '',
        },
      }

      const payload = {
        applicant: form.nameEnglish.trim(),
        email: form.email.trim(),
        phone: form.contactNo.trim(),
        course: courseName,
        mode: 'Online',
        counsellor: '',
        fee: form.paymentAmount.trim() || form.totalFee.trim() || '₹5,000',
        status: 'Pending',
        city: form.village.trim() || form.tehsil.trim(),
        state: 'Madhya Pradesh',
        college: universityName,
        studentStatus: '',
        notes: form.paymentNote.trim(),
        admissionDate: form.admissionDate,
        details,
      }

      const entry = await createOnlineAdmission(payload, token)
      setApplication(entry)
      setToast(
        `Application ${entry?.admissionId || ''} submitted. Waiting for TNS ITI & Computer approval.`
      )
      window.setTimeout(() => setToast(''), 5000)
    } catch (err) {
      if (err?.entry) setApplication(err.entry)
      setToast(err.message || 'Failed to submit application')
      window.setTimeout(() => setToast(''), 4000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-[#00A896]/30 bg-gradient-to-br from-[#06151C] via-[#0a2530] to-[#005F6B] p-3 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00E5CC]">
              Online Admission
            </p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">Apply for Admission</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              Fill the same details as offline admission, choose online or offline payment, then send
              your application.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#00A896]/40 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#00E5CC]">
            <UserRound size={14} />
            Mode: Online
          </span>
        </div>
      </div>

      {toast ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#00A896]/30 bg-[#00A896]/10 px-3 py-2.5 text-sm font-medium text-[#005F6B]">
          <CheckCircle2 size={16} className="shrink-0 text-[#008C95]" />
          {toast}
        </div>
      ) : null}

      {loadingApplication ? (
        <Panel title="Application Status">
          <p className="text-sm text-slate-500">Checking your application status…</p>
        </Panel>
      ) : application ? (
        <Panel title="Application Status">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {isUnderReview ? (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                {appStatus === 'Verification' ? 'Under Verification' : 'Pending Review'}
              </span>
            ) : null}
            {isApproved ? (
              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                Approved
              </span>
            ) : null}
            {isRejected ? (
              <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                Rejected
              </span>
            ) : null}
            <p className="text-slate-600">
              Application{' '}
              <span className="font-semibold text-slate-800">
                {application.admissionId || application.id}
              </span>
              {isUnderReview
                ? ' is with TNS ITI & Computer for verification and approval.'
                : null}
              {isApproved
                ? ' has been approved. Your admission is confirmed.'
                : null}
              {isRejected
                ? ' was rejected. You can update details and submit again.'
                : null}
            </p>
          </div>
          {application.course ? (
            <p className="mt-2 text-xs text-slate-500">
              Course: {application.course}
              {application.date ? ` · Submitted: ${application.date}` : ''}
            </p>
          ) : null}
        </Panel>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Panel title="Course & Session">
          {catalogError ? (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {catalogError}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="University" required>
              <select
                className={fieldClass}
                value={form.universityId}
                disabled={catalogLoading || Boolean(isUnderReview)}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    universityId: e.target.value,
                    course: '',
                    courseId: '',
                  }))
                  if (errors.universityId || errors.course) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.universityId
                      delete next.course
                      return next
                    })
                  }
                }}
              >
                <option value="">
                  {catalogLoading ? 'Loading universities…' : 'Select University'}
                </option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label || u.name}
                  </option>
                ))}
              </select>
              {errors.universityId ? (
                <p className="mt-1 text-[11px] text-rose-600">{errors.universityId}</p>
              ) : null}
            </Field>
            <Field label="Course" required>
              <select
                className={fieldClass}
                value={form.courseId || form.course}
                disabled={!form.universityId || catalogLoading || Boolean(isUnderReview)}
                onChange={(e) => {
                  const value = e.target.value
                  const picked =
                    courseOptions.find((c) => c.id === value || c.label === value) || null
                  setForm((prev) => ({
                    ...prev,
                    courseId: picked?.id || value,
                    course: picked?.label || picked?.name || value,
                    totalFee: picked?.feesTotal || prev.totalFee || '',
                    registrationFee:
                      picked?.feesRegistration || prev.registrationFee || '',
                  }))
                  if (errors.course) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.course
                      return next
                    })
                  }
                }}
              >
                <option value="">
                  {!form.universityId
                    ? 'Select university first'
                    : catalogLoading
                      ? 'Loading courses…'
                      : courseOptions.length
                        ? 'Select Course'
                        : 'No courses mapped'}
                </option>
                {courseOptions.map((c) => (
                  <option key={c.id || c.label} value={c.id || c.label}>
                    {c.label || c.name}
                    {c.durationLabel ? ` · ${c.durationLabel}` : ''}
                  </option>
                ))}
              </select>
              {errors.course ? <p className="mt-1 text-[11px] text-rose-600">{errors.course}</p> : null}
              {selectedCourse?.feesTotal ? (
                <p className="mt-1 text-[11px] text-slate-500">Fees: {selectedCourse.feesTotal}</p>
              ) : null}
            </Field>
            <Field label="Session">
              <input
                className={fieldClass}
                value={form.session}
                onChange={(e) => setField('session', e.target.value)}
                placeholder="2026-2027"
              />
            </Field>
            <Field label="Admission Date">
              <DateInput
                className={fieldClass}
                value={form.admissionDate}
                onChange={(e) => setField('admissionDate', e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div className="h-28 w-24 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
              {form.photoPreview ? (
                <img src={form.photoPreview} alt="Passport" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-center text-[10px] text-slate-400">
                  Passport
                  <br />
                  Photo
                </div>
              )}
            </div>
            <div className="min-w-[12rem] flex-1">
              <Field label="Passport Photo (max 2 MB)">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-[#00A896]">
                  <Upload size={14} className="text-[#008C95]" />
                  Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </label>
              </Field>
              {errors.photoPreview ? (
                <p className="mt-1 text-[11px] text-rose-600">{errors.photoPreview}</p>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel title="Applicant Details">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Registration No">
              <input
                className={fieldClass}
                value={form.registrationNo}
                onChange={(e) => setField('registrationNo', e.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Field label="Name (Hindi)">
              <input
                className={`${fieldClass} normal-case`}
                value={form.nameHindi}
                onChange={(e) => setField('nameHindi', e.target.value)}
              />
            </Field>
            <Field label="Name (English)" required>
              <input
                className={`${fieldClass} uppercase`}
                value={form.nameEnglish}
                onChange={(e) => setUpper('nameEnglish', e.target.value)}
              />
              {errors.nameEnglish ? (
                <p className="mt-1 text-[11px] text-rose-600">{errors.nameEnglish}</p>
              ) : null}
            </Field>
            <Field label="Father's Name">
              <input
                className={`${fieldClass} uppercase`}
                value={form.fatherName}
                onChange={(e) => {
                  const v = String(e.target.value || '').toUpperCase()
                  setForm((prev) => ({
                    ...prev,
                    fatherName: v,
                    guardianName: prev.guardianName || v,
                  }))
                }}
              />
            </Field>
            <Field label="Mother's Name">
              <input
                className={`${fieldClass} uppercase`}
                value={form.motherName}
                onChange={(e) => setUpper('motherName', e.target.value)}
              />
            </Field>
            <Field label="Date of Birth">
              <DateInput
                className={fieldClass}
                value={form.dateOfBirth}
                onChange={(e) => setField('dateOfBirth', e.target.value)}
              />
            </Field>
            <Field label="Gender">
              <select
                className={fieldClass}
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
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Category">
              <input
                className={`${fieldClass} uppercase`}
                value={form.category}
                onChange={(e) => setUpper('category', e.target.value)}
                placeholder="GEN / OBC / SC / ST"
              />
            </Field>
            <Field label="Samagra Id">
              <input
                className={fieldClass}
                value={form.samagraId}
                onChange={(e) => setField('samagraId', e.target.value)}
              />
            </Field>
            <Field label="Caste Certificate No">
              <input
                className={fieldClass}
                value={form.casteCertificateNo}
                onChange={(e) => setField('casteCertificateNo', e.target.value)}
              />
            </Field>
            <Field label="Marital Status">
              <select
                className={fieldClass}
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
              >
                <option value="">Select</option>
                <option value="Unmarried">Unmarried</option>
                <option value="Married">Married</option>
              </select>
            </Field>
            {form.gender === 'Female' && form.maritalStatus === 'Married' ? (
              <Field label="Husband Name">
                <input
                  className={`${fieldClass} uppercase`}
                  value={form.husbandName}
                  onChange={(e) => setUpper('husbandName', e.target.value)}
                  placeholder="Husband's full name"
                />
              </Field>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Educational Qualification"
          action={
            <SecondaryButton type="button" onClick={addEducationRow}>
              <Plus size={14} />
              Add Row
            </SecondaryButton>
          }
        >
          <div className="space-y-3">
            {form.education.map((row, index) => (
              <div
                key={`edu-${index}`}
                className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3"
              >
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
                  <Field label="Class">
                    <input
                      className={`${fieldClass} uppercase`}
                      value={row.className}
                      onChange={(e) => updateEducation(index, 'className', e.target.value)}
                      placeholder="10TH"
                    />
                  </Field>
                  <Field label="Board">
                    <input
                      className={`${fieldClass} uppercase`}
                      value={row.board}
                      onChange={(e) => updateEducation(index, 'board', e.target.value)}
                    />
                  </Field>
                  <Field label="Year">
                    <input
                      className={fieldClass}
                      value={row.year}
                      onChange={(e) => updateEducation(index, 'year', e.target.value)}
                    />
                  </Field>
                  <Field label="Roll No">
                    <input
                      className={fieldClass}
                      value={row.rollNo}
                      onChange={(e) => updateEducation(index, 'rollNo', e.target.value)}
                    />
                  </Field>
                  <Field label="Percentage">
                    <input
                      className={fieldClass}
                      value={row.percentage}
                      onChange={(e) => updateEducation(index, 'percentage', e.target.value)}
                      placeholder="77.80%"
                    />
                  </Field>
                  <Field label="Division">
                    <input
                      className={`${fieldClass} uppercase`}
                      value={row.division}
                      onChange={(e) => updateEducation(index, 'division', e.target.value)}
                    />
                  </Field>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeEducationRow(index)}
                      className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={14} />
                      Remove
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
        </Panel>

        <Panel title="Address & Contact">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Permanent Address">
                <input
                  className={`${fieldClass} uppercase`}
                  value={form.permanentAddress}
                  onChange={(e) => {
                    const v = String(e.target.value || '').toUpperCase()
                    setForm((prev) => ({
                      ...prev,
                      permanentAddress: v,
                      homeAddress: prev.homeAddress || v,
                      guardianAddress: prev.guardianAddress || v,
                    }))
                  }}
                />
              </Field>
            </div>
            <Field label="Village / City">
              <input
                className={`${fieldClass} uppercase`}
                value={form.village}
                onChange={(e) => setUpper('village', e.target.value)}
              />
            </Field>
            <Field label="Post">
              <input
                className={`${fieldClass} uppercase`}
                value={form.post}
                onChange={(e) => setUpper('post', e.target.value)}
              />
            </Field>
            <Field label="Tehsil">
              <input
                className={`${fieldClass} uppercase`}
                value={form.tehsil}
                onChange={(e) => setUpper('tehsil', e.target.value)}
              />
            </Field>
            <Field label="Pin Code">
              <input
                className={fieldClass}
                value={form.pinCode}
                maxLength={6}
                onChange={(e) => setField('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </Field>
            <Field label="Contact No." required>
              <input
                className={fieldClass}
                value={form.contactNo}
                onChange={(e) => {
                  const v = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    contactNo: v,
                    studentMobile: prev.studentMobile || v,
                  }))
                }}
              />
              {errors.contactNo ? (
                <p className="mt-1 text-[11px] text-rose-600">{errors.contactNo}</p>
              ) : null}
            </Field>
            <Field label="E-Mail" required>
              <input
                type="email"
                className={fieldClass}
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
              />
              {errors.email ? <p className="mt-1 text-[11px] text-rose-600">{errors.email}</p> : null}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Home Address">
                <input
                  className={`${fieldClass} uppercase`}
                  value={form.homeAddress}
                  onChange={(e) => setUpper('homeAddress', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Office Registration No">
              <input
                className={fieldClass}
                value={form.officeRegistrationNo}
                onChange={(e) => setField('officeRegistrationNo', e.target.value)}
              />
            </Field>
            <Field label="Total Fee">
              <input
                className={fieldClass}
                value={form.totalFee}
                onChange={(e) => setField('totalFee', e.target.value)}
                placeholder={selectedCourse?.feesTotal || '₹5,000'}
              />
            </Field>
            <Field label="Registration Fee">
              <input
                className={fieldClass}
                value={form.registrationFee}
                onChange={(e) => setField('registrationFee', e.target.value)}
                placeholder={selectedCourse?.feesRegistration || '₹1,500'}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="शपथ पत्र / Affidavit & Guardian">
          <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-800">नियम एवं शर्तें</p>
            <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-slate-600">
              {AFFIDAVIT_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Institution">
              <input
                className={fieldClass}
                value={form.institutionName}
                onChange={(e) => setField('institutionName', e.target.value)}
              />
            </Field>
            <Field label="पालक नाम (Guardian Name)">
              <input
                className={`${fieldClass} uppercase`}
                value={form.guardianName}
                onChange={(e) => setUpper('guardianName', e.target.value)}
              />
            </Field>
            <Field label="संबंध (Relation)">
              <input
                className={fieldClass}
                value={form.relation}
                onChange={(e) => setField('relation', e.target.value)}
                placeholder="पिता / माता / अभिभावक"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="पालक पता (Guardian Address)">
                <input
                  className={`${fieldClass} uppercase`}
                  value={form.guardianAddress}
                  onChange={(e) => setUpper('guardianAddress', e.target.value)}
                />
              </Field>
            </div>
            <Field label="पालक मोबा (Guardian Mobile)">
              <input
                className={fieldClass}
                value={form.guardianMobile}
                onChange={(e) => setField('guardianMobile', e.target.value)}
              />
            </Field>
            <Field label="छात्र मोबा (Student Mobile)">
              <input
                className={fieldClass}
                value={form.studentMobile}
                onChange={(e) => setField('studentMobile', e.target.value)}
              />
            </Field>
          </div>
          <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.agreeAffidavit}
              onChange={(e) => setField('agreeAffidavit', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#008C95] focus:ring-[#FF5E14]"
            />
            <span>
              मैं उपरोक्त सभी नियमों से सहमत हूँ / I agree to all the affidavit terms above.
              {errors.agreeAffidavit ? (
                <span className="mt-1 block text-[11px] text-rose-600">{errors.agreeAffidavit}</span>
              ) : null}
            </span>
          </label>
        </Panel>

        <Panel title="Payment Options">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setField('paymentMode', 'Online')}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                form.paymentMode === 'Online'
                  ? 'border-[#FF5E14] bg-[#FF5E14]/5 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-[#00A896]/50'
              }`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF5E14]/10 text-[#FF5E14]">
                <CreditCard size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900">Online Payment</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Pay via UPI, Card or Net Banking
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setField('paymentMode', 'Offline')}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                form.paymentMode === 'Offline'
                  ? 'border-[#008C95] bg-[#00A896]/5 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-[#00A896]/50'
              }`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#00A896]/10 text-[#008C95]">
                <Banknote size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900">Offline Payment</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Cash, cheque or bank deposit at institute
                </span>
              </span>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Payment Amount" required>
              <input
                className={fieldClass}
                value={form.paymentAmount}
                onChange={(e) => setField('paymentAmount', e.target.value)}
                placeholder="₹5,000"
              />
              {errors.paymentAmount ? (
                <p className="mt-1 text-[11px] text-rose-600">{errors.paymentAmount}</p>
              ) : null}
            </Field>

            {form.paymentMode === 'Online' ? (
              <>
                <Field label="Online Method" required>
                  <select
                    className={fieldClass}
                    value={form.onlineMethod}
                    onChange={(e) => setField('onlineMethod', e.target.value)}
                  >
                    <option value="UPI">UPI</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Wallet">Wallet</option>
                  </select>
                </Field>
                <Field label="Transaction ID">
                  <input
                    className={fieldClass}
                    value={form.transactionId}
                    onChange={(e) => setField('transactionId', e.target.value)}
                    placeholder="Enter UTR / Txn ID (if already paid)"
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Offline Method" required>
                  <select
                    className={fieldClass}
                    value={form.offlineMethod}
                    onChange={(e) => setField('offlineMethod', e.target.value)}
                  >
                    <option value="Cash">Cash at Institute</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Deposit">Bank Deposit / NEFT</option>
                    <option value="Demand Draft">Demand Draft</option>
                  </select>
                </Field>
                <Field label="Payment Proof / Receipt">
                  <label className="inline-flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-[#00A896]">
                    <Upload size={14} className="text-[#008C95]" />
                    <span className="truncate">
                      {form.paymentProofName || 'Upload receipt (optional)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handlePaymentProof}
                    />
                  </label>
                </Field>
              </>
            )}

            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Payment Note">
                <textarea
                  className={fieldClass}
                  rows={2}
                  value={form.paymentNote}
                  onChange={(e) => setField('paymentNote', e.target.value)}
                  placeholder="Any remark about fee / installment…"
                />
              </Field>
            </div>
          </div>

          {form.paymentMode === 'Online' ? (
            <p className="mt-3 text-xs text-slate-500">
              Payment gateway will be connected later. For now this captures your preferred method
              with the application.
            </p>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              Visit the institute counter or deposit to the institute account, then attach proof if
              available.
            </p>
          )}
        </Panel>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-sm text-slate-600">
            {isUnderReview
              ? 'Your application is already under review. Please wait for TNS ITI & Computer approval.'
              : isApproved
                ? 'Your admission is already approved. No new application needed.'
                : 'Review all details carefully, then send your application for admission.'}
          </p>
          <PrimaryButton type="submit" disabled={submitting || isUnderReview || isApproved}>
            <Send size={14} />
            {submitting
              ? 'Submitting…'
              : isUnderReview
                ? 'Awaiting Approval'
                : isApproved
                  ? 'Already Approved'
                  : 'Send Application for Admission'}
          </PrimaryButton>
        </div>
      </form>
    </section>
  )
}
