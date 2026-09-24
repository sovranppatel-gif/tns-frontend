import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  MapPin,
  RefreshCw,
} from 'lucide-react'
import logo from '../assets/tnslogo.png'
import { SITE } from '../data/site.js'
import {
  getActiveColleges,
  getPublicReferral,
  submitWorkshopRegistration,
} from '../services/workshopService.js'
import { formatDateDMY, formatTime12 } from '../utils/workshopFormat.js'

const COURSE_SUGGESTIONS = [
  'BCA',
  'MCA',
  'B.Sc (Computer Science)',
  'B.Sc',
  'B.Tech / B.E.',
  'M.Tech',
  'B.Com',
  'BBA',
  'MBA',
  'BA',
  'Diploma',
  'ITI',
  'PGDCA',
  'DCA',
]

const SEMESTER_OPTIONS = [
  '1st Semester',
  '2nd Semester',
  '3rd Semester',
  '4th Semester',
  '5th Semester',
  '6th Semester',
  '7th Semester',
  '8th Semester',
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Passed Out',
]

const CODING_EXPERIENCE = ['No Experience', 'Beginner', 'Intermediate', 'Advanced']

const EMPTY_FORM = {
  fullName: '',
  mobile: '',
  email: '',
  course: '',
  semesterYear: '',
  whatsappNumber: '',
  githubProfile: '',
  linkedinProfile: '',
  codingExperience: '',
}

function normalizeMobile(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

function profileUrlOk(value, host) {
  const raw = String(value || '').trim()
  if (!raw) return true
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    return host.test(url.hostname)
  } catch {
    return false
  }
}

function validate(form) {
  const errors = {}
  const name = form.fullName.trim()
  if (name.length < 2) errors.fullName = 'Enter your full name'
  else if (!/^[\p{L}\p{M} .'-]+$/u.test(name)) errors.fullName = "Use letters, spaces, . ' and - only"
  const mobile = normalizeMobile(form.mobile)
  if (!mobile) errors.mobile = 'Enter your mobile number'
  else if (!/^[6-9]\d{9}$/.test(mobile)) errors.mobile = 'Enter a valid 10-digit mobile number'
  const email = form.email.trim()
  if (!email) errors.email = 'Enter your email'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Enter a valid email address'
  if (!form.course.trim()) errors.course = 'Enter your course'
  if (!form.semesterYear) errors.semesterYear = 'Select your semester / year'
  const wa = normalizeMobile(form.whatsappNumber)
  if (wa && !/^[6-9]\d{9}$/.test(wa)) errors.whatsappNumber = 'Enter a valid 10-digit WhatsApp number'
  if (!profileUrlOk(form.githubProfile, /(^|\.)github\.com$/i)) {
    errors.githubProfile = 'Enter a GitHub URL, e.g. github.com/username'
  }
  if (!profileUrlOk(form.linkedinProfile, /(^|\.)linkedin\.com$/i)) {
    errors.linkedinProfile = 'Enter a LinkedIn URL, e.g. linkedin.com/in/username'
  }
  return errors
}

const inputBase =
  'block w-full min-w-0 rounded-xl border bg-white px-3.5 py-3 text-base text-navy-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-navy-700 focus:ring-2 focus:ring-brand-red/25 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600'

function Field({ id, label, required, optional, hint, error, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy-900">
        {label}
        {required ? (
          <span className="text-brand-red" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
        {optional ? <span className="font-normal text-slate-500"> (optional)</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-start gap-1 text-sm text-brand-red">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">{error}</span>
        </p>
      ) : null}
    </div>
  )
}

function fieldProps(id, errors, hint) {
  const describedBy = errors[id] ? `${id}-error` : hint ? `${id}-hint` : undefined
  return {
    id,
    name: id,
    'aria-invalid': errors[id] ? 'true' : undefined,
    'aria-describedby': describedBy,
    className: `${inputBase} ${errors[id] ? 'border-brand-red' : 'border-slate-300'}`,
  }
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <img src={logo} alt="" className="h-10 w-10 shrink-0 rounded-full object-contain" />
          <div className="min-w-0">
            <p className="break-words text-sm font-bold leading-tight text-navy-900">{SITE.shortName}</p>
            <p className="text-xs text-slate-500">Workshop registration</p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-8">{children}</main>
    </div>
  )
}

function StatusCard({ icon: Icon, tone = 'error', title, children, action }) {
  const toneClass = tone === 'error' ? 'bg-brand-red/10 text-brand-red' : 'bg-navy-900/10 text-navy-900'
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8">
      <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${toneClass}`}>
        <Icon size={24} aria-hidden="true" />
      </span>
      <h1 className="mt-4 break-words text-xl font-bold text-navy-900">{title}</h1>
      <div className="mt-2 break-words text-sm text-slate-600">{children}</div>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  )
}

function DetailItem({ icon: Icon, label, children }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-white/10 p-3">
      <Icon size={20} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-white/70">{label}</dt>
        <dd className="mt-0.5 break-words font-semibold text-white [overflow-wrap:anywhere]">{children}</dd>
      </div>
    </div>
  )
}

function WorkshopDetails({ referral, onRegisterClick }) {
  const startDate = formatDateDMY(referral.workshopStartDate)
  const endDate = formatDateDMY(referral.workshopEndDate)
  const startTime = formatTime12(referral.startTime)
  const endTime = formatTime12(referral.endTime)
  return (
    <section
      aria-labelledby="workshop-title"
      className="rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 p-5 text-white shadow-lg sm:p-7"
    >
      <p className="inline-block max-w-full break-words rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy-900">
        {referral.collegeName}
      </p>
      <h1
        id="workshop-title"
        className="mt-3 break-words text-2xl font-extrabold leading-tight [overflow-wrap:anywhere] sm:text-3xl"
      >
        {referral.workshopName}
      </h1>
      <dl className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <DetailItem icon={CalendarDays} label="Start date">
          {startDate || 'To be announced'}
        </DetailItem>
        <DetailItem icon={CalendarDays} label="End date">
          {endDate || 'To be announced'}
        </DetailItem>
        <DetailItem icon={Clock} label="Start time">
          {startTime || 'To be announced'}
        </DetailItem>
        <DetailItem icon={Clock} label="End time">
          {endTime || 'To be announced'}
        </DetailItem>
        <div className="sm:col-span-2">
          <DetailItem icon={MapPin} label="Place">
            {referral.workshopPlace || 'To be announced'}
          </DetailItem>
        </div>
      </dl>
      <button
        type="button"
        onClick={onRegisterClick}
        className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-red px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-brand-red-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 sm:w-auto"
      >
        Register now
      </button>
    </section>
  )
}

function Confirmation({ result, referral, onReset }) {
  const { registration, isDuplicate } = result
  return (
    <section
      aria-live="polite"
      className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8"
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={30} aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-navy-900">
        {isDuplicate ? 'You are already registered' : 'Registration successful'}
      </h1>
      <p className="mt-2 break-words text-sm text-slate-600">
        {isDuplicate
          ? 'We found an existing registration with this email and mobile number. Your details are below.'
          : `Thank you, ${registration.fullName}. Your seat request for the workshop has been received.`}
      </p>

      <div className="mt-5 rounded-xl bg-navy-900 px-4 py-4 text-white">
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">Registration ID</p>
        <p className="mt-1 break-all text-2xl font-extrabold tracking-wide text-gold">
          {registration.registrationId}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
        {[
          ['Name', registration.fullName],
          ['Workshop', registration.workshopName || referral?.workshopName],
          ['College', registration.collegeName],
          ['Course', `${registration.course} · ${registration.semesterYear}`],
          ['Email', registration.email],
          ['Mobile', registration.mobile],
          ['Status', registration.status],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-xl border border-slate-200 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-0.5 break-words font-semibold text-navy-900 [overflow-wrap:anywhere]">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 text-sm text-slate-600">Save your registration ID. You may need it at the venue.</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl border border-navy-900/20 px-6 py-3 text-base font-semibold text-navy-900 transition hover:border-brand-red hover:text-brand-red sm:mx-auto sm:w-auto"
      >
        Register another student
      </button>
    </section>
  )
}

export default function WorkshopPage() {
  const [searchParams] = useSearchParams()
  const refCode = (searchParams.get('ref') || '').trim()

  const [referral, setReferral] = useState(null)
  const [colleges, setColleges] = useState([])
  const [loadState, setLoadState] = useState('loading') // loading | ready | missing | notFound | error
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)
  const formRef = useRef(null)
  const formId = useId()

  const load = useCallback(async () => {
    if (!refCode) {
      setLoadState('missing')
      return
    }
    setLoadState('loading')
    setLoadError('')
    try {
      const [ref, collegeList] = await Promise.all([
        getPublicReferral(refCode),
        // The form still works without the list: the referral college is shown read-only.
        getActiveColleges().catch(() => []),
      ])
      setReferral(ref)
      setColleges(collegeList)
      setLoadState('ready')
    } catch (err) {
      if (err.status === 404) {
        setLoadState('notFound')
      } else {
        setLoadError(err.message || 'Unable to load workshop details')
        setLoadState('error')
      }
    }
  }, [refCode])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    document.title = referral ? `${referral.workshopName} | Registration` : 'Workshop Registration'
  }, [referral])

  // Lock the college to the one the referral link belongs to.
  const lockedCollege = useMemo(() => {
    if (!referral?.college) return null
    return colleges.find((c) => c.id === referral.college.universityId) || null
  }, [referral, colleges])

  const collegeName = lockedCollege?.name || referral?.collegeName || ''

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => document.getElementById('fullName')?.focus({ preventScroll: true }), 400)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    const nextErrors = validate(form)
    setErrors(nextErrors)
    const firstInvalid = Object.keys(nextErrors)[0]
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }
    setSubmitting(true)
    try {
      const data = await submitWorkshopRegistration({
        fullName: form.fullName.trim(),
        mobile: normalizeMobile(form.mobile),
        email: form.email.trim().toLowerCase(),
        universityId: lockedCollege?.id || '',
        collegeName,
        course: form.course.trim(),
        semesterYear: form.semesterYear,
        whatsappNumber: normalizeMobile(form.whatsappNumber),
        githubProfile: form.githubProfile.trim(),
        linkedinProfile: form.linkedinProfile.trim(),
        codingExperience: form.codingExperience,
        referralCode: referral.referralCode,
      })
      setResult({ registration: data.registration, isDuplicate: Boolean(data.isDuplicate) })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      if (err.errors) setErrors(err.errors)
      setSubmitError(err.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadState === 'loading') {
    return (
      <PageShell>
        <div role="status" aria-live="polite" className="space-y-4">
          <div className="h-64 animate-pulse rounded-2xl bg-navy-900/15" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
          <span className="sr-only">Loading workshop details…</span>
        </div>
      </PageShell>
    )
  }

  if (loadState === 'missing' || loadState === 'notFound') {
    return (
      <PageShell>
        <StatusCard icon={AlertCircle} title={loadState === 'missing' ? 'Registration link required' : 'Workshop link not found'}>
          {loadState === 'missing'
            ? 'Please open the workshop registration link shared by your college.'
            : `The referral code "${refCode}" is not valid or the workshop is no longer open. Please check the link with your college coordinator.`}
        </StatusCard>
      </PageShell>
    )
  }

  if (loadState === 'error') {
    return (
      <PageShell>
        <StatusCard
          icon={AlertCircle}
          title="Could not load the workshop"
          action={
            <button
              type="button"
              onClick={load}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3 font-semibold text-white sm:w-auto"
            >
              <RefreshCw size={18} aria-hidden="true" /> Try again
            </button>
          }
        >
          {loadError}
        </StatusCard>
      </PageShell>
    )
  }

  if (result) {
    return (
      <PageShell>
        <Confirmation
          result={result}
          referral={referral}
          onReset={() => {
            setResult(null)
            setForm(EMPTY_FORM)
            setErrors({})
          }}
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="space-y-5 sm:space-y-6">
        <WorkshopDetails referral={referral} onRegisterClick={scrollToForm} />

        <section
          ref={formRef}
          aria-labelledby={`${formId}-title`}
          className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7"
        >
          <h2 id={`${formId}-title`} className="text-xl font-bold text-navy-900">
            Registration form
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Fields marked <span className="text-brand-red">*</span> are required.
          </p>

          <form noValidate onSubmit={onSubmit} className="mt-5 space-y-6">
            <fieldset className="min-w-0 space-y-4">
              <legend className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Personal details</legend>
              <Field id="fullName" label="Full name" required error={errors.fullName}>
                <input
                  {...fieldProps('fullName', errors)}
                  type="text"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={onChange}
                  maxLength={100}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="mobile" label="Mobile number" required error={errors.mobile}>
                  <input
                    {...fieldProps('mobile', errors)}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="10-digit number"
                    value={form.mobile}
                    onChange={onChange}
                    maxLength={16}
                  />
                </Field>
                <Field id="email" label="Email" required error={errors.email}>
                  <input
                    {...fieldProps('email', errors)}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    value={form.email}
                    onChange={onChange}
                    maxLength={150}
                  />
                </Field>
              </div>
              <Field id="whatsappNumber" label="WhatsApp number" optional error={errors.whatsappNumber}>
                <input
                  {...fieldProps('whatsappNumber', errors)}
                  type="tel"
                  inputMode="numeric"
                  placeholder="If different from mobile"
                  value={form.whatsappNumber}
                  onChange={onChange}
                  maxLength={16}
                />
              </Field>
            </fieldset>

            <fieldset className="min-w-0 space-y-4">
              <legend className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Academic details</legend>
              {lockedCollege ? (
                <Field
                  id="college"
                  label="College / Institute"
                  required
                  hint="Set by your college's registration link"
                >
                  <div className="relative">
                    <select
                      {...fieldProps('college', errors, true)}
                      value={lockedCollege.id}
                      disabled
                      aria-readonly="true"
                      className={`${inputBase} appearance-none border-slate-300 pr-10`}
                    >
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Lock
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                  </div>
                </Field>
              ) : (
                <Field
                  id="college"
                  label="College / Institute"
                  required
                  hint="Set by your college's registration link"
                >
                  <input
                    {...fieldProps('college', errors, true)}
                    type="text"
                    value={collegeName}
                    readOnly
                    aria-readonly="true"
                    className={`${inputBase} border-slate-300 bg-slate-100 text-slate-700`}
                  />
                </Field>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="course" label="Course" required error={errors.course}>
                  <input
                    {...fieldProps('course', errors)}
                    type="text"
                    list="workshop-course-options"
                    placeholder="e.g. BCA"
                    value={form.course}
                    onChange={onChange}
                    maxLength={100}
                  />
                  <datalist id="workshop-course-options">
                    {COURSE_SUGGESTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <Field id="semesterYear" label="Semester / Year" required error={errors.semesterYear}>
                  <select {...fieldProps('semesterYear', errors)} value={form.semesterYear} onChange={onChange}>
                    <option value="">Select</option>
                    {SEMESTER_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field id="referralCode" label="Referral code">
                <input
                  id="referralCode"
                  type="text"
                  value={referral.referralCode}
                  readOnly
                  aria-readonly="true"
                  className={`${inputBase} border-slate-300 bg-slate-100 font-mono text-sm text-slate-700`}
                />
              </Field>
            </fieldset>

            <fieldset className="min-w-0 space-y-4">
              <legend className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                Coding profile <span className="font-normal normal-case tracking-normal">(optional)</span>
              </legend>
              <Field id="codingExperience" label="Coding experience" optional error={errors.codingExperience}>
                <select
                  {...fieldProps('codingExperience', errors)}
                  value={form.codingExperience}
                  onChange={onChange}
                >
                  <option value="">Select</option>
                  {CODING_EXPERIENCE.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="githubProfile" label="GitHub profile" optional error={errors.githubProfile}>
                  <input
                    {...fieldProps('githubProfile', errors)}
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    placeholder="github.com/username"
                    value={form.githubProfile}
                    onChange={onChange}
                    maxLength={200}
                  />
                </Field>
                <Field id="linkedinProfile" label="LinkedIn profile" optional error={errors.linkedinProfile}>
                  <input
                    {...fieldProps('linkedinProfile', errors)}
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    placeholder="linkedin.com/in/username"
                    value={form.linkedinProfile}
                    onChange={onChange}
                    maxLength={200}
                  />
                </Field>
              </div>
            </fieldset>

            {submitError ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-brand-red/30 bg-brand-red/5 p-3 text-sm text-brand-red"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">{submitError}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-brand-red-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-red/30 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-56"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Submitting…
                </>
              ) : (
                'Register for workshop'
              )}
            </button>
          </form>
        </section>
      </div>
    </PageShell>
  )
}
