import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import AuthLayout from '../components/AuthLayout'
import {
  registerStudent as registerStudentApi,
  sendEmailOtp,
  verifyEmailOtp,
} from '../services/studentAuthService'
import { persistStudentSession } from '../utils/studentAuth'

const COURSES = ['COPA / ITI', 'DCA', 'PGDCA', 'Tally', 'Data Entry', 'CPCT', 'Computer Fundamentals', 'Other']

const HEARD_ABOUT_OPTIONS = [
  'Google / Search',
  'Instagram',
  'Facebook',
  'YouTube',
  'WhatsApp',
  'Friend / Family',
  'College / University',
  'Advertisement',
  'Partner / Counsellor',
  'Others',
]

const initial = {
  name: '',
  email: '',
  mobile: '',
  course: '',
  heardAbout: '',
  heardAboutOther: '',
  password: '',
  confirm: '',
}

export default function StudentSignUp() {
  const navigate = useNavigate()
  const [step, setStep] = useState('form') // 'form' | 'otp'
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState('')
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = window.setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = 'Enter a valid 10-digit mobile number.'
    if (!form.course) next.course = 'Please select a course.'
    if (!form.heardAbout) next.heardAbout = 'Please select an option.'
    if (form.heardAbout === 'Others' && !form.heardAboutOther.trim()) {
      next.heardAboutOther = 'Please tell us where you heard about us.'
    }
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters.'
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSendOtp = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setInfo('')
    if (!validate()) return
    setBusy(true)
    try {
      const data = await sendEmailOtp(form.email.trim().toLowerCase())
      setOtp('')
      setStep('otp')
      setInfo(`OTP sent to ${form.email.trim()}`)
      setResendIn(Number(data.resendAfterSeconds) || 60)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const onResendOtp = async () => {
    if (resendIn > 0 || busy) return
    setSubmitError('')
    setBusy(true)
    try {
      const data = await sendEmailOtp(form.email.trim().toLowerCase())
      setInfo(`OTP sent again to ${form.email.trim()}`)
      setResendIn(Number(data.resendAfterSeconds) || 60)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const onVerifyAndCreate = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!/^\d{6}$/.test(otp.trim())) {
      setErrors({ otp: 'Enter the 6-digit OTP from your email.' })
      return
    }
    setErrors({})
    setBusy(true)
    try {
      const email = form.email.trim().toLowerCase()
      await verifyEmailOtp(email, otp.trim())
      const data = await registerStudentApi({
        name: form.name.trim(),
        email,
        mobile: form.mobile.trim(),
        password: form.password,
        heardAbout: form.heardAbout,
        heardAboutOther: form.heardAbout === 'Others' ? form.heardAboutOther.trim() : undefined,
      })
      persistStudentSession({
        token: data.token,
        user: { ...data.user, course: form.course },
      })
      navigate('/student/dashboard', { replace: true })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const backToForm = () => {
    setSubmitError('')
    setErrors({})
    setInfo('')
    setStep('form')
  }

  if (step === 'otp') {
    return (
      <AuthLayout title="Verify your email" subtitle={`Check ${form.email.trim()} for the 6-digit code.`}>
        <form className="mt-6 space-y-4" onSubmit={onVerifyAndCreate} noValidate>
          {submitError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-brand-red">{submitError}</p>
          )}
          {info && !submitError && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{info}</p>
          )}

          <label className="block text-sm font-semibold text-navy-800">
            OTP
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-navy-700"
              placeholder="000000"
            />
            {errors.otp && <span className="mt-1 block text-xs text-brand-red">{errors.otp}</span>}
          </label>

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Please wait…' : 'Verify & Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Did not get the email?{' '}
          {resendIn > 0 ? (
            <span>Resend in {resendIn}s</span>
          ) : (
            <button type="button" className="font-bold text-brand-red hover:underline" onClick={onResendOtp}>
              Resend OTP
            </button>
          )}
        </p>

        <p className="mt-5 text-center text-sm text-slate-600">
          <button type="button" className="font-bold text-navy-800 hover:underline" onClick={backToForm}>
            Back to details
          </button>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Student Sign Up" subtitle="Create your TNS student account in a few details.">
      <form className="mt-6 space-y-4" onSubmit={onSendOtp} noValidate>
        {submitError && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-brand-red">{submitError}</p>
        )}

        <label className="block text-sm font-semibold text-navy-800">
          Full Name
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            autoComplete="name"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy-700"
            placeholder="Enter your name"
          />
          {errors.name && <span className="mt-1 block text-xs text-brand-red">{errors.name}</span>}
        </label>

        <label className="block text-sm font-semibold text-navy-800">
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy-700"
            placeholder="email@example.com"
          />
          {errors.email && <span className="mt-1 block text-xs text-brand-red">{errors.email}</span>}
        </label>

        <label className="block text-sm font-semibold text-navy-800">
          Mobile Number
          <input
            name="mobile"
            inputMode="numeric"
            maxLength={10}
            value={form.mobile}
            onChange={onChange}
            autoComplete="tel"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy-700"
            placeholder="10-digit mobile number"
          />
          {errors.mobile && <span className="mt-1 block text-xs text-brand-red">{errors.mobile}</span>}
        </label>

        <label className="block text-sm font-semibold text-navy-800">
          Course Interested In
          <select
            name="course"
            value={form.course}
            onChange={onChange}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-700"
          >
            <option value="">Select a course</option>
            {COURSES.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
          {errors.course && <span className="mt-1 block text-xs text-brand-red">{errors.course}</span>}
        </label>

        <label className="block text-sm font-semibold text-navy-800">
          How did you hear about us?
          <select
            name="heardAbout"
            value={form.heardAbout}
            onChange={onChange}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-700"
          >
            <option value="">Select an option</option>
            {HEARD_ABOUT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.heardAbout && <span className="mt-1 block text-xs text-brand-red">{errors.heardAbout}</span>}
        </label>

        {form.heardAbout === 'Others' && (
          <label className="block text-sm font-semibold text-navy-800">
            Please specify
            <input
              name="heardAboutOther"
              value={form.heardAboutOther}
              onChange={onChange}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy-700"
              placeholder="Tell us where you heard about us"
            />
            {errors.heardAboutOther && (
              <span className="mt-1 block text-xs text-brand-red">{errors.heardAboutOther}</span>
            )}
          </label>
        )}

        <label className="block text-sm font-semibold text-navy-800">
          Password
          <span className="relative mt-1.5 block">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={onChange}
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none focus:border-navy-700"
              placeholder="Minimum 6 characters"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </span>
          {errors.password && <span className="mt-1 block text-xs text-brand-red">{errors.password}</span>}
        </label>

        <label className="block text-sm font-semibold text-navy-800">
          Confirm Password
          <input
            name="confirm"
            type={showPassword ? 'text' : 'password'}
            value={form.confirm}
            onChange={onChange}
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy-700"
            placeholder="Re-enter password"
          />
          {errors.confirm && <span className="mt-1 block text-xs text-brand-red">{errors.confirm}</span>}
        </label>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Sending OTP…' : 'Send OTP & Continue'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link to="/signin" className="font-bold text-brand-red hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
