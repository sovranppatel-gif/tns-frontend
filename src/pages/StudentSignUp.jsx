import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import AuthLayout from '../components/AuthLayout'
import { registerStudent } from '../utils/studentAuth'

const COURSES = ['COPA / ITI', 'DCA', 'PGDCA', 'Tally', 'Data Entry', 'CPCT', 'Computer Fundamentals', 'Other']
const initial = { name: '', email: '', mobile: '', course: '', password: '', confirm: '' }

export default function StudentSignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = 'Enter a valid 10-digit mobile number.'
    if (!form.course) next.course = 'Please select a course.'
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters.'
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return
    try {
      registerStudent(form)
      navigate('/student/dashboard', { replace: true })
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  return (
    <AuthLayout title="Student Sign Up" subtitle="Create your TNS student account in a few details.">
      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
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

        <button type="submit" className="btn-primary w-full">
          Create Student Account
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
