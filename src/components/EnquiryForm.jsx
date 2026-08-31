import { useState } from 'react'
import { PHONES, waLink } from '../data/site'

const COURSES = ['COPA / ITI', 'DCA', 'PGDCA', 'Tally', 'Data Entry', 'CPCT', 'Computer Fundamentals', 'Other']

const initial = { name: '', mobile: '', course: '', message: '' }

export default function EnquiryForm({ compact = false, className = 'card-surface p-6 sm:p-8' }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const validate = () => {
    const next = {}
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Please enter your full name.'
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = 'Enter a valid 10-digit mobile number.'
    if (!form.course) next.course = 'Please select a course.'
    if (!form.message.trim() || form.message.trim().length < 8) next.message = 'Please write a short message (at least 8 characters).'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const text = `Admission Enquiry — TNS ITI & Computer\nName: ${form.name}\nMobile: ${form.mobile}\nCourse: ${form.course}\nMessage: ${form.message}`
    window.open(waLink(PHONES.primary, text), '_blank', 'noopener,noreferrer')
    setSent(true)
    setForm(initial)
  }

  return (
    <form onSubmit={onSubmit} className={className} noValidate>
      <h3 className="text-xl font-extrabold text-navy-900">Submit Enquiry</h3>
      <p className="mt-1 text-sm text-slate-500">Your enquiry will open in WhatsApp with your details filled in.</p>

      <label className={`${compact ? 'mt-4' : 'mt-5'} block text-sm font-semibold text-navy-800`}>
        Full Name
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-navy-700 sm:text-sm"
          placeholder="Enter your name"
          autoComplete="name"
        />
        {errors.name && <span className="mt-1 block text-xs font-medium text-brand-red">{errors.name}</span>}
      </label>

      <label className="mt-4 block text-sm font-semibold text-navy-800">
        Mobile Number
        <input
          name="mobile"
          value={form.mobile}
          onChange={onChange}
          inputMode="numeric"
          maxLength={10}
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-navy-700 sm:text-sm"
          placeholder="10-digit mobile number"
          autoComplete="tel"
        />
        {errors.mobile && <span className="mt-1 block text-xs font-medium text-brand-red">{errors.mobile}</span>}
      </label>

      <label className="mt-4 block text-sm font-semibold text-navy-800">
        Course Interested In
        <select
          name="course"
          value={form.course}
          onChange={onChange}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-navy-700 sm:text-sm"
        >
          <option value="">Select a course</option>
          {COURSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.course && <span className="mt-1 block text-xs font-medium text-brand-red">{errors.course}</span>}
      </label>

      <label className="mt-4 block text-sm font-semibold text-navy-800">
        Message
        <textarea
          name="message"
          value={form.message}
          onChange={onChange}
          rows={compact ? 3 : 4}
          className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-navy-700 sm:text-sm"
          placeholder="Tell us about the course you want to join"
        />
        {errors.message && <span className="mt-1 block text-xs font-medium text-brand-red">{errors.message}</span>}
      </label>

      <button type="submit" className="btn-primary mt-6 w-full">
        Submit Enquiry
      </button>
      {sent && (
        <p className="mt-3 text-center text-sm font-semibold text-green-700">
          Enquiry prepared. Complete sending it on WhatsApp.
        </p>
      )}
    </form>
  )
}
