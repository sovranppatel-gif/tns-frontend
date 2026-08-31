import { useState } from 'react'
import { Camera } from 'lucide-react'
import { DateInput } from '../../shared/DateInput.jsx'
import { uploadFacultyPhoto } from '../../../services/facultyService.js'
import { API_URL } from '../../../utils/api.js'
import {
  EMPLOYMENT_TYPES,
  FACULTY_GENDERS,
  facultyInitials,
  inputClass,
  photoSrc,
} from './facultyFormUtils.js'

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

export default function FacultyForm({ form, setForm, meta, isCreate, onUploadError }) {
  const [uploading, setUploading] = useState(false)
  const src = photoSrc(form.profilePhoto, API_URL)

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const onPhoto = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const data = await uploadFacultyPhoto(file)
      set('profilePhoto', data.url)
    } catch (err) {
      onUploadError?.(err?.message || 'Unable to upload photo')
    } finally {
      setUploading(false)
    }
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
                {facultyInitials(form.fullName)}
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
              {FACULTY_GENDERS.map((g) => (
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
            <input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} className={inputClass} inputMode="numeric" maxLength={10} />
          </Field>
          <Field label="Alternate mobile">
            <input value={form.alternateMobile} onChange={(e) => set('alternateMobile', e.target.value)} className={inputClass} inputMode="numeric" maxLength={10} />
          </Field>
          <Field label="Email" required className="sm:col-span-2">
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
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
            <input value={form.pincode} onChange={(e) => set('pincode', e.target.value)} className={inputClass} maxLength={6} />
          </Field>
        </div>
      </Section>

      <Section title="Professional details">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Designation" required>
            <input
              list="faculty-designations"
              value={form.designation}
              onChange={(e) => set('designation', e.target.value)}
              className={inputClass}
            />
            <datalist id="faculty-designations">
              {(meta.designations || []).map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          <Field label="Department">
            <input
              list="faculty-departments"
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
              className={inputClass}
            />
            <datalist id="faculty-departments">
              {(meta.departments || []).map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          <Field label="Qualification">
            <input value={form.qualification} onChange={(e) => set('qualification', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Specialization">
            <input value={form.specialization} onChange={(e) => set('specialization', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Experience (years)">
            <input type="number" min="0" value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Joining date">
            <DateInput value={form.joiningDate} onChange={(e) => set('joiningDate', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Employment type" className="sm:col-span-2">
            <select value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)} className={inputClass}>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Account access">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.loginEnabled}
            onChange={(e) => set('loginEnabled', e.target.checked)}
          />
          Enable faculty login
        </label>
        {form.loginEnabled ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Username">
              <input value={form.username} onChange={(e) => set('username', e.target.value)} placeholder={form.email || 'email'} className={inputClass} />
            </Field>
            <Field label={isCreate ? 'Password' : 'New password'} required={isCreate}>
              <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className={inputClass} autoComplete="new-password" />
            </Field>
          </div>
        ) : null}
        {(meta.permissions || []).length ? (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Permissions</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {meta.permissions.map((perm) => (
                <label key={perm} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={(form.permissions || []).includes(perm)}
                    onChange={(e) => {
                      const next = new Set(form.permissions || [])
                      if (e.target.checked) next.add(perm)
                      else next.delete(perm)
                      set('permissions', [...next])
                    }}
                  />
                  {perm.replace('faculty.', '')}
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </Section>

      <Section title="Status">
        <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </Section>
    </div>
  )
}
