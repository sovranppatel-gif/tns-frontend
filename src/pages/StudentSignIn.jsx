import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import AuthLayout from '../components/AuthLayout'
import {
  loginStudent,
  resetStudentPassword,
  sendStudentResetOtp,
  verifyStudentResetOtp,
} from '../utils/studentAuth'

const initial = { email: '', password: '' }

export default function StudentSignIn() {
  const navigate = useNavigate()
  const [view, setView] = useState('login')
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [busy, setBusy] = useState(false)

  const [forgot, setForgot] = useState({
    step: 1,
    identifier: '',
    email: '',
    emailMasked: '',
    otp: '',
    password: '',
    confirm: '',
    info: '',
  })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = window.setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const openForgot = (identifier = form.email) => {
    setSubmitError('')
    setErrors({})
    setForgot({
      step: 1,
      identifier,
      email: '',
      emailMasked: '',
      otp: '',
      password: '',
      confirm: '',
      info: '',
    })
    setView('forgot')
  }

  const backToLogin = () => {
    setSubmitError('')
    setErrors({})
    setView('login')
  }

  const validate = () => {
    const next = {}
    if (!form.email.trim()) next.email = 'Enter your email or mobile number.'
    if (!form.password) next.password = 'Enter your password.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return
    setBusy(true)
    try {
      await loginStudent(form.email, form.password)
      navigate('/student/dashboard', { replace: true })
    } catch (err) {
      if (err.mustResetPassword) {
        openForgot(form.email)
        setSubmitError(err.message)
      } else {
        setSubmitError(err.message)
      }
    } finally {
      setBusy(false)
    }
  }

  const onSendOtp = async (e) => {
    e.preventDefault()
    setSubmitError('')
    const identifier = forgot.identifier.trim()
    if (!identifier) {
      setErrors({ identifier: 'Enter your email or 10-digit mobile number.' })
      return
    }
    setErrors({})
    setBusy(true)
    try {
      const data = await sendStudentResetOtp(identifier)
      setForgot((prev) => ({
        ...prev,
        step: 2,
        email: data.email || '',
        emailMasked: data.emailMasked || '',
        otp: '',
        info: `OTP sent to ${data.emailMasked || 'your registered email'}`,
      }))
      setResendIn(Number(data.resendAfterSeconds) || 60)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const onVerifyOtp = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!/^\d{6}$/.test(forgot.otp.trim())) {
      setErrors({ otp: 'Enter the 6-digit OTP from your email.' })
      return
    }
    setErrors({})
    setBusy(true)
    try {
      const data = await verifyStudentResetOtp(forgot.email, forgot.otp)
      setForgot((prev) => ({
        ...prev,
        step: 3,
        email: data.email || prev.email,
        password: '',
        confirm: '',
        info: 'OTP verified. Set a new password.',
      }))
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const onResetPassword = async (e) => {
    e.preventDefault()
    setSubmitError('')
    const next = {}
    if (forgot.password.length < 6) next.password = 'Password must be at least 6 characters.'
    if (forgot.confirm !== forgot.password) next.confirm = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      await resetStudentPassword(forgot.email, forgot.password)
      navigate('/student/dashboard', { replace: true })
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
      const data = await sendStudentResetOtp(forgot.identifier)
      setForgot((prev) => ({
        ...prev,
        email: data.email || prev.email,
        emailMasked: data.emailMasked || prev.emailMasked,
        info: `OTP sent again to ${data.emailMasked || 'your registered email'}`,
      }))
      setResendIn(Number(data.resendAfterSeconds) || 60)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (view === 'forgot') {
    const titles = {
      1: ['Forgot password', 'Enter the email or mobile on your student profile. OTP will be sent to your email.'],
      2: ['Enter OTP', `Check ${forgot.emailMasked || 'your email'} for the 6-digit code.`],
      3: ['Set new password', 'Choose a password you will use from now on.'],
    }
    const [title, subtitle] = titles[forgot.step] || titles[1]

    return (
      <AuthLayout title={title} subtitle={subtitle}>
        <form
          className="mt-6 space-y-4"
          onSubmit={forgot.step === 1 ? onSendOtp : forgot.step === 2 ? onVerifyOtp : onResetPassword}
          noValidate
        >
          {submitError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-brand-red">{submitError}</p>
          )}
          {forgot.info && !submitError && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{forgot.info}</p>
          )}

          {forgot.step === 1 && (
            <label className="block text-sm font-semibold text-navy-800">
              Email or Mobile
              <input
                value={forgot.identifier}
                onChange={(e) => setForgot((prev) => ({ ...prev, identifier: e.target.value }))}
                autoComplete="username"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy-700"
                placeholder="email@example.com or 10-digit mobile"
              />
              {errors.identifier && <span className="mt-1 block text-xs text-brand-red">{errors.identifier}</span>}
            </label>
          )}

          {forgot.step === 2 && (
            <label className="block text-sm font-semibold text-navy-800">
              OTP
              <input
                value={forgot.otp}
                onChange={(e) =>
                  setForgot((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-navy-700"
                placeholder="000000"
              />
              {errors.otp && <span className="mt-1 block text-xs text-brand-red">{errors.otp}</span>}
            </label>
          )}

          {forgot.step === 3 && (
            <>
              <label className="block text-sm font-semibold text-navy-800">
                New password
                <span className="relative mt-1.5 block">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={forgot.password}
                    onChange={(e) => setForgot((prev) => ({ ...prev, password: e.target.value }))}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none focus:border-navy-700"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowNewPassword((v) => !v)}
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </span>
                {errors.password && <span className="mt-1 block text-xs text-brand-red">{errors.password}</span>}
              </label>
              <label className="block text-sm font-semibold text-navy-800">
                Confirm password
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={forgot.confirm}
                  onChange={(e) => setForgot((prev) => ({ ...prev, confirm: e.target.value }))}
                  autoComplete="new-password"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy-700"
                  placeholder="Re-enter password"
                />
                {errors.confirm && <span className="mt-1 block text-xs text-brand-red">{errors.confirm}</span>}
              </label>
            </>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy
              ? 'Please wait…'
              : forgot.step === 1
                ? 'Send OTP'
                : forgot.step === 2
                  ? 'Verify OTP'
                  : 'Save password and sign in'}
          </button>
        </form>

        {forgot.step === 2 && (
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
        )}

        <p className="mt-5 text-center text-sm text-slate-600">
          <button type="button" className="font-bold text-navy-800 hover:underline" onClick={backToLogin}>
            Back to sign in
          </button>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Student Sign In" subtitle="Use the email or mobile number on your student profile.">
      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        {submitError && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-brand-red">{submitError}</p>
        )}

        <label className="block text-sm font-semibold text-navy-800">
          Email or Mobile
          <input
            name="email"
            value={form.email}
            onChange={onChange}
            autoComplete="username"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy-700"
            placeholder="email@example.com or 10-digit mobile"
          />
          {errors.email && <span className="mt-1 block text-xs text-brand-red">{errors.email}</span>}
        </label>

        <label className="block text-sm font-semibold text-navy-800">
          Password
          <span className="relative mt-1.5 block">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={onChange}
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none focus:border-navy-700"
              placeholder="Enter password"
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

        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm font-bold text-brand-red hover:underline"
            onClick={() => openForgot()}
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-600">
        First time? Use <strong>Forgot password</strong>. OTP is sent to the email on your profile — then set a new
        password.
      </p>
      <p className="mt-5 text-center text-sm text-slate-600">
        New enquiry account?{' '}
        <Link to="/signup" className="font-bold text-brand-red hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
