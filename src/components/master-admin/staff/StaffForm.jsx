import { useState } from 'react'
import { Camera } from 'lucide-react'
import { DateInput } from '../../shared/DateInput.jsx'
import { uploadStaffPhoto } from '../../../services/staffService.js'
import { API_URL } from '../../../utils/api.js'
import {
  STAFF_EMPLOYMENT_TYPES,
  STAFF_GENDERS,
  STAFF_STATUSES,
  STAFF_WEEKLY_OFFS,
  dutyDurationLabel,
} from './staffConstants.js'
import { inputClass, photoSrc, staffInitials } from './staffFormUtils.js'

function Field({ label, required = false, children, className = '' }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </label>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  )
}

function namesFrom(list) {
  return (list || []).map((item) => (typeof item === 'string' ? { _id: item, name: item } : item))
}

export default function StaffForm({ form, setForm, meta, onUploadError, isCreate = false }) {
  const [uploading, setUploading] = useState(false)
  const src = photoSrc(form.profilePhoto, API_URL)
  const designations = namesFrom(meta?.designations)
  const departments = namesFrom(meta?.departments)
  const categories = namesFrom(meta?.categories)
  const shifts = namesFrom(meta?.shifts)
  const employmentTypes = meta?.employmentTypes?.length ? meta.employmentTypes : STAFF_EMPLOYMENT_TYPES
  const weeklyOffs = meta?.weeklyOffs?.length ? meta.weeklyOffs : STAFF_WEEKLY_OFFS
  const statuses = meta?.statuses?.length ? meta.statuses : STAFF_STATUSES
  const dutyHours = dutyDurationLabel(form.dutyStart, form.dutyEnd)

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const onPhoto = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const data = await uploadStaffPhoto(file)
      set('profilePhoto', data.url)
    } catch (err) {
      onUploadError?.(err?.message || 'Unable to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const applyShift = (name) => {
    const selected = shifts.find((s) => s.name === name)
    setForm((prev) => ({
      ...prev,
      shift: name,
      shiftId: selected && selected._id !== 'custom' ? selected._id : '',
      dutyStart: name === 'Custom' ? prev.dutyStart : selected?.startTime || prev.dutyStart,
      dutyEnd: name === 'Custom' ? prev.dutyEnd : selected?.endTime || prev.dutyEnd,
    }))
  }

  const applyDepartment = (name) => {
    const selected = departments.find((d) => d.name === name)
    setForm((prev) => ({
      ...prev,
      department: name,
      departmentId: selected?._id || '',
    }))
  }

  const applyDesignation = (name) => {
    const selected = designations.find((d) => d.name === name)
    setForm((prev) => ({
      ...prev,
      designation: name,
      designationId: selected?._id || '',
      department: !prev.department && selected?.department ? selected.department : prev.department,
    }))
  }

  const applyCategory = (name) => {
    const selected = categories.find((c) => c.name === name)
    setForm((prev) => ({
      ...prev,
      staffCategory: name,
      staffCategoryId: selected?._id || '',
    }))
  }

  return (
    <div className="space-y-3">
      <Section title="Personal information">
        <div className="flex flex-wrap items-start gap-3">
          <div className="relative">
            {src ? (
              <img src={src} alt="" className="h-20 w-20 rounded-lg border border-slate-200 object-cover" />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-navy-800">
                {staffInitials(form.fullName)}
              </div>
            )}
            <label className="absolute -bottom-2 -right-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-navy-900 text-white">
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => onPhoto(e.target.files?.[0])}
              />
            </label>
          </div>
          <p className="pt-2 text-xs text-slate-500">{uploading ? 'Uploading…' : 'JPG / PNG, max 400 KB'}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" required>
            <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputClass}>
              {STAFF_GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Date of birth">
            <DateInput value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Father / Husband name">
            <input value={form.fatherOrHusbandName} onChange={(e) => set('fatherOrHusbandName', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Mobile" required>
            <input value={form.mobile} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} className={inputClass} inputMode="numeric" maxLength={10} />
          </Field>
          <Field label="Alternate mobile">
            <input value={form.alternateMobile} onChange={(e) => set('alternateMobile', e.target.value.replace(/\D/g, '').slice(0, 10))} className={inputClass} inputMode="numeric" maxLength={10} />
          </Field>
          <Field label="Email" className="sm:col-span-2">
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} placeholder="Optional" />
          </Field>
        </div>
      </Section>

      <Section title="Address">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full address" className="sm:col-span-2">
            <textarea value={form.address} onChange={(e) => set('address', e.target.value)} className={`${inputClass} min-h-[72px]`} />
          </Field>
          <Field label="City">
            <input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} />
          </Field>
          <Field label="State">
            <input value={form.state} onChange={(e) => set('state', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Pincode">
            <input value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} className={inputClass} maxLength={6} />
          </Field>
        </div>
      </Section>

      <Section title="Role & employment">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Staff ID">
            <input value={form.staffId || (isCreate ? 'Auto-generated on save' : '')} readOnly className={`${inputClass} bg-slate-100 text-slate-500`} />
          </Field>
          <Field label="Designation" required>
            <input
              list="staff-designations"
              value={form.designation}
              onChange={(e) => applyDesignation(e.target.value)}
              className={inputClass}
            />
            <datalist id="staff-designations">
              {designations.map((d) => (
                <option key={d._id || d.name} value={d.name} />
              ))}
            </datalist>
          </Field>
          <Field label="Department">
            <select value={form.department} onChange={(e) => applyDepartment(e.target.value)} className={inputClass}>
              <option value="">Select department</option>
              {form.department && !departments.some((d) => d.name === form.department) ? (
                <option value={form.department}>{form.department}</option>
              ) : null}
              {departments.map((d) => (
                <option key={d._id || d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Staff category">
            <select value={form.staffCategory} onChange={(e) => applyCategory(e.target.value)} className={inputClass}>
              <option value="">Select category</option>
              {form.staffCategory && !categories.some((c) => c.name === form.staffCategory) ? (
                <option value={form.staffCategory}>{form.staffCategory}</option>
              ) : null}
              {categories.map((c) => (
                <option key={c._id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Employment type">
            <select value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)} className={inputClass}>
              {employmentTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Joining date">
            <DateInput value={form.joiningDate} onChange={(e) => set('joiningDate', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Reporting to" className="sm:col-span-2">
            <input value={form.reportingTo} onChange={(e) => set('reportingTo', e.target.value)} placeholder="Office head / Administrator" className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Shift & duty">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Shift">
            <select value={form.shift} onChange={(e) => applyShift(e.target.value)} className={inputClass}>
              {form.shift && !shifts.some((s) => s.name === form.shift) ? (
                <option value={form.shift}>{form.shift}</option>
              ) : null}
              {shifts.map((s) => (
                <option key={s._id || s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Weekly off">
            <select value={form.weeklyOff} onChange={(e) => set('weeklyOff', e.target.value)} className={inputClass}>
              {weeklyOffs.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Duty start">
            <input type="time" value={form.dutyStart} onChange={(e) => set('dutyStart', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Duty end">
            <input type="time" value={form.dutyEnd} onChange={(e) => set('dutyEnd', e.target.value)} className={inputClass} />
          </Field>
          <p className="sm:col-span-2 text-xs text-slate-500">
            {form.shift === 'Custom'
              ? 'Custom timings — enter duty start and end for this staff member.'
              : 'A predefined shift can be used, or choose Custom for individual duty hours.'}
            {dutyHours ? ` Total duty: ${dutyHours}.` : ''}
          </p>
        </div>
      </Section>

      <Section title="Professional details">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Qualification">
            <input value={form.qualification} onChange={(e) => set('qualification', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Experience (years)">
            <input type="number" min="0" value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Monthly salary (₹)">
            <input type="number" min="0" value={form.monthlySalary} onChange={(e) => set('monthlySalary', e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Emergency contact">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Contact name">
            <input value={form.emergencyName} onChange={(e) => set('emergencyName', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Relation">
            <input value={form.emergencyRelation} onChange={(e) => set('emergencyRelation', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Mobile number">
            <input value={form.emergencyPhone} onChange={(e) => set('emergencyPhone', e.target.value.replace(/\D/g, '').slice(0, 10))} className={inputClass} inputMode="numeric" maxLength={10} />
          </Field>
        </div>
      </Section>

      <Section title="Internal information">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Internal notes" className="sm:col-span-2">
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className={`${inputClass} min-h-[72px]`} placeholder="Duty remarks, ID card issued, etc." />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>
    </div>
  )
}
