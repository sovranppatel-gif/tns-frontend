import { useEffect, useState } from 'react'
import { Award, Check, Mail, MapPin, Pencil, Phone, User, X } from 'lucide-react'
import {
  getStudentMe,
  updateStudentProfile,
} from '../../../services/studentAuthService.js'
import { studentMediaUrl } from '../../../services/studentClient.js'
import {
  getStudentSession,
  getStudentToken,
  persistStudentSession,
} from '../../../utils/studentAuth.js'
import { DateInput } from '../../shared/DateInput.jsx'
import { Panel, PrimaryButton, SecondaryButton, SkeletonBlock } from '../shared/StudentUI.jsx'

const emptyAddress = () => ({
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
})
const emptyParent = () => ({
  name: '',
  relation: '',
  phone: '',
  email: '',
})
const emptyEmergency = () => ({
  name: '',
  relation: '',
  phone: '',
})

function avatarFromName(name) {
  const label = encodeURIComponent(String(name || 'Student').trim() || 'Student')
  return `https://ui-avatars.com/api/?name=${label}&background=FF5E14&color=fff&size=128`
}

function blankProfile(session) {
  const name = session?.name || 'Student'
  return {
    id: '',
    name,
    email: session?.email || '',
    phone: session?.mobile ? `+91 ${session.mobile}` : '',
    mobile: session?.mobile || '',
    dob: '',
    gender: '',
    bloodGroup: '',
    batch: '',
    course: '',
    semester: '',
    trainer: '',
    trainerEmail: '',
    enrollmentDate: '',
    rollNo: '',
    avatar: avatarFromName(name),
    address: emptyAddress(),
    parent: emptyParent(),
    emergency: emptyEmergency(),
    education: [],
    skills: [],
    achievements: [],
  }
}

function toFormState(user) {
  const mobile =
    user?.mobile ||
    String(user?.phone || '')
      .replace(/\D/g, '')
      .slice(-10) ||
    ''
  return {
    name: user?.name || '',
    mobile,
    dob: user?.dob || '',
    gender: user?.gender || '',
    bloodGroup: user?.bloodGroup || '',
    batch: user?.batch || '',
    course: user?.course || '',
    semester: user?.semester || '',
    rollNo: user?.rollNo || '',
    enrollmentDate: user?.enrollmentDate || '',
    trainer: user?.trainer || '',
    trainerEmail: user?.trainerEmail || '',
    address: { ...emptyAddress(), ...(user?.address || {}) },
    parent: { ...emptyParent(), ...(user?.parent || {}) },
    emergency: { ...emptyEmergency(), ...(user?.emergency || {}) },
    education:
      Array.isArray(user?.education) && user.education.length
        ? user.education.map((e) => ({
            level: e.level || '',
            institute: e.institute || '',
            year: e.year || '',
            percentage: e.percentage || '',
          }))
        : [{ level: '', institute: '', year: '', percentage: '' }],
    skillsText: Array.isArray(user?.skills) ? user.skills.join(', ') : '',
    achievementsText: Array.isArray(user?.achievements)
      ? user.achievements.join('\n')
      : '',
  }
}

const inputClass =
  'mt-0.5 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none transition focus:border-[#00A896] focus:ring-2 focus:ring-[#FF5E14]/20'

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  )
}

function DisplayValue({ value, placeholder = '—' }) {
  return (
    <dd className="mt-0.5 font-medium text-slate-800">{value || placeholder}</dd>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(() => blankProfile(getStudentSession()))
  const [form, setForm] = useState(() => toFormState(blankProfile(getStudentSession())))
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      const token = getStudentToken()
      if (!token) {
        setProfile(blankProfile(getStudentSession()))
        setLoading(false)
        return
      }
      try {
        const data = await getStudentMe(token)
        if (cancelled) return
        setProfile(data.user)
        setForm(toFormState(data.user))
        persistStudentSession({ token, user: data.user })
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'Failed to load profile')
        setProfile(blankProfile(getStudentSession()))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  function startEdit() {
    setForm(toFormState(profile))
    setError('')
    setSuccess('')
    setEditing(true)
  }

  function cancelEdit() {
    setForm(toFormState(profile))
    setError('')
    setEditing(false)
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function setNested(group, key, value) {
    setForm((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: value },
    }))
  }

  function setEducationRow(index, key, value) {
    setForm((prev) => {
      const education = prev.education.map((row, i) =>
        i === index ? { ...row, [key]: value } : row
      )
      return { ...prev, education }
    })
  }

  function addEducationRow() {
    setForm((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { level: '', institute: '', year: '', percentage: '' },
      ],
    }))
  }

  function removeEducationRow(index) {
    setForm((prev) => ({
      ...prev,
      education:
        prev.education.length <= 1
          ? prev.education
          : prev.education.filter((_, i) => i !== index),
    }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')
    const token = getStudentToken()
    if (!token) {
      setError('Please log in again to update your profile')
      setSaving(false)
      return
    }

    const payload = {
      name: form.name.trim(),
      mobile: form.mobile.replace(/\D/g, '').slice(-10),
      dob: form.dob,
      gender: form.gender,
      bloodGroup: form.bloodGroup,
      batch: form.batch,
      course: form.course,
      semester: form.semester,
      rollNo: form.rollNo,
      enrollmentDate: form.enrollmentDate,
      trainer: form.trainer,
      trainerEmail: form.trainerEmail,
      address: form.address,
      parent: form.parent,
      emergency: form.emergency,
      education: form.education,
      skills: form.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      achievements: form.achievementsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    }

    try {
      const data = await updateStudentProfile(token, payload)
      setProfile(data.user)
      setForm(toFormState(data.user))
      persistStudentSession({ token: data.token || token, user: data.user })
      setEditing(false)
      setSuccess('Profile updated successfully')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const p = profile
  const displayPhone =
    p.phone || (p.mobile ? `+91 ${p.mobile}` : '') || '—'

  if (loading) {
    return (
      <section className="space-y-3">
        <SkeletonBlock className="h-28" />
        <div className="grid gap-3 lg:grid-cols-2">
          <SkeletonBlock className="h-48" />
          <SkeletonBlock className="h-48" />
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-[#00A896]/30 bg-gradient-to-br from-[#06151C] via-[#0a2530] to-[#005F6B] p-3 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={studentMediaUrl(p.avatar) || avatarFromName(p.name)}
              alt={p.name}
              className="h-20 w-20 rounded-lg border-2 border-[#FF5E14]/50 object-cover"
            />
            <div>
              <h2 className="text-xl font-bold">{p.name || 'Student'}</h2>
              <p className="text-sm text-slate-300">{p.email || p.id || '—'}</p>
              <p className="mt-1 text-xs text-[#00E5CC]">
                {[p.course, p.batch].filter(Boolean).join(' · ') || 'Complete your profile'}
              </p>
            </div>
          </div>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              <SecondaryButton
                onClick={cancelEdit}
                disabled={saving}
                className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
              >
                <X size={14} />
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleSave} disabled={saving}>
                <Check size={14} />
                {saving ? 'Saving…' : 'Save Changes'}
              </PrimaryButton>
            </div>
          ) : (
            <PrimaryButton onClick={startEdit}>
              <Pencil size={14} />
              Edit Profile
            </PrimaryButton>
          )}
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Personal Details">
          {editing ? (
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Field label="Name">
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </Field>
              <Field label="Email (read-only)">
                <input className={inputClass} value={p.email || ''} disabled />
              </Field>
              <Field label="Mobile">
                <input
                  className={inputClass}
                  value={form.mobile}
                  maxLength={10}
                  onChange={(e) =>
                    setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                />
              </Field>
              <Field label="DOB">
                <DateInput
                  className={inputClass}
                  value={form.dob}
                  onChange={(e) => setField('dob', e.target.value)}
                />
              </Field>
              <Field label="Gender">
                <select
                  className={inputClass}
                  value={form.gender}
                  onChange={(e) => setField('gender', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Blood Group">
                <input
                  className={inputClass}
                  value={form.bloodGroup}
                  placeholder="e.g. B+"
                  onChange={(e) => setField('bloodGroup', e.target.value)}
                />
              </Field>
              <Field label="Roll No">
                <input
                  className={inputClass}
                  value={form.rollNo}
                  onChange={(e) => setField('rollNo', e.target.value)}
                />
              </Field>
              <Field label="Enrollment">
                <DateInput
                  className={inputClass}
                  value={form.enrollmentDate}
                  onChange={(e) => setField('enrollmentDate', e.target.value)}
                />
              </Field>
              <Field label="Semester">
                <input
                  className={inputClass}
                  value={form.semester}
                  onChange={(e) => setField('semester', e.target.value)}
                />
              </Field>
              <Field label="Course">
                <input
                  className={inputClass}
                  value={form.course}
                  onChange={(e) => setField('course', e.target.value)}
                />
              </Field>
              <Field label="Batch">
                <input
                  className={inputClass}
                  value={form.batch}
                  onChange={(e) => setField('batch', e.target.value)}
                />
              </Field>
            </div>
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ['Email', p.email],
                ['Phone', displayPhone],
                ['DOB', p.dob],
                ['Gender', p.gender],
                ['Blood Group', p.bloodGroup],
                ['Roll No', p.rollNo],
                ['Enrollment', p.enrollmentDate],
                ['Semester', p.semester],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">{k}</dt>
                  <DisplayValue value={v} />
                </div>
              ))}
            </dl>
          )}
        </Panel>

        <Panel title="Parent & Emergency Contact">
          {editing ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Parent</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="Name">
                    <input
                      className={inputClass}
                      value={form.parent.name}
                      onChange={(e) => setNested('parent', 'name', e.target.value)}
                    />
                  </Field>
                  <Field label="Relation">
                    <input
                      className={inputClass}
                      value={form.parent.relation}
                      onChange={(e) => setNested('parent', 'relation', e.target.value)}
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      className={inputClass}
                      value={form.parent.phone}
                      onChange={(e) => setNested('parent', 'phone', e.target.value)}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      className={inputClass}
                      value={form.parent.email}
                      onChange={(e) => setNested('parent', 'email', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
              <div className="rounded-lg bg-rose-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-rose-400">Emergency</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="Name">
                    <input
                      className={inputClass}
                      value={form.emergency.name}
                      onChange={(e) => setNested('emergency', 'name', e.target.value)}
                    />
                  </Field>
                  <Field label="Relation">
                    <input
                      className={inputClass}
                      value={form.emergency.relation}
                      onChange={(e) => setNested('emergency', 'relation', e.target.value)}
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      className={inputClass}
                      value={form.emergency.phone}
                      onChange={(e) => setNested('emergency', 'phone', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-400">Parent</p>
                <p className="mt-1 font-semibold text-slate-900">{p.parent?.name || '—'}</p>
                <p className="text-xs text-slate-500">{p.parent?.relation || ''}</p>
                <p className="mt-2 flex items-center gap-1.5 text-slate-600">
                  <Phone size={12} /> {p.parent?.phone || '—'}
                </p>
                <p className="flex items-center gap-1.5 text-slate-600">
                  <Mail size={12} /> {p.parent?.email || '—'}
                </p>
              </div>
              <div className="rounded-lg bg-rose-50 p-3">
                <p className="text-xs font-semibold uppercase text-rose-400">Emergency</p>
                <p className="mt-1 font-semibold text-slate-900">{p.emergency?.name || '—'}</p>
                <p className="text-xs text-slate-500">{p.emergency?.relation || ''}</p>
                <p className="mt-2 flex items-center gap-1.5 text-slate-600">
                  <Phone size={12} /> {p.emergency?.phone || '—'}
                </p>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Address">
          {editing ? (
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <Field label="Address line 1">
                <input
                  className={inputClass}
                  value={form.address.line1}
                  onChange={(e) => setNested('address', 'line1', e.target.value)}
                />
              </Field>
              <Field label="Address line 2">
                <input
                  className={inputClass}
                  value={form.address.line2}
                  onChange={(e) => setNested('address', 'line2', e.target.value)}
                />
              </Field>
              <Field label="City">
                <input
                  className={inputClass}
                  value={form.address.city}
                  onChange={(e) => setNested('address', 'city', e.target.value)}
                />
              </Field>
              <Field label="State">
                <input
                  className={inputClass}
                  value={form.address.state}
                  onChange={(e) => setNested('address', 'state', e.target.value)}
                />
              </Field>
              <Field label="Pincode">
                <input
                  className={inputClass}
                  value={form.address.pincode}
                  onChange={(e) => setNested('address', 'pincode', e.target.value)}
                />
              </Field>
            </div>
          ) : (
            <p className="flex items-start gap-2 text-sm text-slate-700">
              <MapPin size={16} className="mt-0.5 shrink-0 text-[#FF5E14]" />
              <span>
                {[p.address?.line1, p.address?.line2].filter(Boolean).join(', ') || '—'}
                {(p.address?.city || p.address?.state || p.address?.pincode) && (
                  <>
                    <br />
                    {[p.address?.city, p.address?.state].filter(Boolean).join(', ')}
                    {p.address?.pincode ? ` — ${p.address.pincode}` : ''}
                  </>
                )}
              </span>
            </p>
          )}
        </Panel>

        <Panel
          title="Education Details"
          action={
            editing ? (
              <button
                type="button"
                onClick={addEducationRow}
                className="text-xs font-semibold text-[#008C95] hover:underline"
              >
                + Add
              </button>
            ) : null
          }
        >
          {editing ? (
            <ul className="space-y-2">
              {form.education.map((e, index) => (
                <li
                  key={`edu-${index}`}
                  className="rounded-lg border border-slate-100 px-3 py-2.5 text-sm"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Level">
                      <input
                        className={inputClass}
                        value={e.level}
                        onChange={(ev) => setEducationRow(index, 'level', ev.target.value)}
                      />
                    </Field>
                    <Field label="Institute">
                      <input
                        className={inputClass}
                        value={e.institute}
                        onChange={(ev) =>
                          setEducationRow(index, 'institute', ev.target.value)
                        }
                      />
                    </Field>
                    <Field label="Year">
                      <input
                        className={inputClass}
                        value={e.year}
                        onChange={(ev) => setEducationRow(index, 'year', ev.target.value)}
                      />
                    </Field>
                    <Field label="Percentage">
                      <input
                        className={inputClass}
                        value={e.percentage}
                        onChange={(ev) =>
                          setEducationRow(index, 'percentage', ev.target.value)
                        }
                      />
                    </Field>
                  </div>
                  {form.education.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeEducationRow(index)}
                      className="mt-2 text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : p.education?.length ? (
            <ul className="space-y-2">
              {p.education.map((e) => (
                <li
                  key={`${e.level}-${e.institute}`}
                  className="rounded-lg border border-slate-100 px-3 py-2.5 text-sm"
                >
                  <p className="font-semibold text-slate-900">{e.level || '—'}</p>
                  <p className="text-xs text-slate-500">
                    {[e.institute, e.year, e.percentage].filter(Boolean).join(' · ') || '—'}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No education details added yet.</p>
          )}
        </Panel>

        <Panel title="Skills">
          {editing ? (
            <Field label="Comma-separated skills">
              <input
                className={inputClass}
                value={form.skillsText}
                placeholder="React, Node.js, MongoDB"
                onChange={(e) => setField('skillsText', e.target.value)}
              />
            </Field>
          ) : p.skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-[#00A896]/10 px-3 py-1 text-xs font-semibold text-[#005F6B]"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No skills added yet.</p>
          )}
        </Panel>

        <Panel title="Achievements & Certificates">
          {editing ? (
            <div className="space-y-3 text-sm">
              <Field label="Achievements (one per line)">
                <textarea
                  className={`${inputClass} min-h-[88px]`}
                  value={form.achievementsText}
                  onChange={(e) => setField('achievementsText', e.target.value)}
                />
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Trainer">
                  <input
                    className={inputClass}
                    value={form.trainer}
                    onChange={(e) => setField('trainer', e.target.value)}
                  />
                </Field>
                <Field label="Trainer email">
                  <input
                    className={inputClass}
                    value={form.trainerEmail}
                    onChange={(e) => setField('trainerEmail', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          ) : (
            <>
              {p.achievements?.length ? (
                <ul className="space-y-2">
                  {p.achievements.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-slate-700">
                      <Award size={14} className="shrink-0 text-[#FF5E14]" />
                      {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No achievements added yet.</p>
              )}
              <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <User size={12} />
                Trainer:{' '}
                {p.trainer
                  ? `${p.trainer}${p.trainerEmail ? ` (${p.trainerEmail})` : ''}`
                  : '—'}
              </p>
            </>
          )}
        </Panel>
      </div>
    </section>
  )
}
