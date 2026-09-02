import { useCallback, useEffect, useRef, useState } from 'react'
import { Award, Camera, Check, Mail, MapPin, Pencil, Phone, User, X } from 'lucide-react'
import {
  getStudentMe,
  updateStudentProfile,
  uploadStudentAvatar,
} from '../../../services/studentAuthService.js'
import { studentMediaUrl } from '../../../services/studentClient.js'
import {
  getStudentSession,
  getStudentToken,
  persistStudentSession,
} from '../../../utils/studentAuth.js'
import { subscribeStudentNotifications } from '../../../utils/socket.js'
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

function personalSource(user, pending) {
  const proposed = pending?.status === 'Pending' ? pending.proposed : null
  if (!proposed) return user
  return {
    ...user,
    name: proposed.name ?? user?.name,
    email: proposed.email ?? user?.email,
    mobile: proposed.mobile ?? user?.mobile,
    dob: proposed.dob ?? user?.dob,
    gender: proposed.gender ?? user?.gender,
    bloodGroup: proposed.bloodGroup ?? user?.bloodGroup,
    avatar: proposed.avatar || user?.avatar,
    address: { ...emptyAddress(), ...(proposed.address || user?.address || {}) },
    parent: { ...emptyParent(), ...(proposed.parent || user?.parent || {}) },
    emergency: { ...emptyEmergency(), ...(proposed.emergency || user?.emergency || {}) },
  }
}

function toFormState(user, pending) {
  const src = personalSource(user, pending)
  const mobile =
    src?.mobile ||
    String(src?.phone || '')
      .replace(/\D/g, '')
      .slice(-10) ||
    ''
  return {
    name: src?.name || '',
    email: src?.email || '',
    mobile,
    dob: src?.dob || '',
    gender: src?.gender || '',
    bloodGroup: src?.bloodGroup || '',
    avatar: src?.avatar || '',
    address: { ...emptyAddress(), ...(src?.address || {}) },
    parent: { ...emptyParent(), ...(src?.parent || {}) },
    emergency: { ...emptyEmergency(), ...(src?.emergency || {}) },
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
  const photoInputRef = useRef(null)
  const [profile, setProfile] = useState(() => blankProfile(getStudentSession()))
  const [form, setForm] = useState(() => toFormState(blankProfile(getStudentSession())))
  const [pending, setPending] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const hadPendingRef = useRef(false)
  const editingRef = useRef(false)
  editingRef.current = editing

  const applyProfilePayload = useCallback((data, { silent = false } = {}) => {
    const token = getStudentToken()
    const nextPending = data.pendingProfileChange || null
    if (hadPendingRef.current && !nextPending && !editingRef.current) {
      setSuccess('Admin ne aapki profile request review kar di hai.')
    }
    hadPendingRef.current = Boolean(nextPending)
    setProfile(data.user)
    setPending(nextPending)
    if (!editingRef.current) setForm(toFormState(data.user, nextPending))
    persistStudentSession({ token: data.token || token, user: data.user })
    if (!silent) setError('')
  }, [])

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
        applyProfilePayload(data)
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
  }, [applyProfilePayload])

  useEffect(() => {
    if (!pending || editing) return undefined
    const id = window.setInterval(async () => {
      const token = getStudentToken()
      if (!token) return
      try {
        const data = await getStudentMe(token)
        applyProfilePayload(data, { silent: true })
      } catch {
        // keep current profile
      }
    }, 8000)
    return () => window.clearInterval(id)
  }, [applyProfilePayload, editing, pending])

  useEffect(() => {
    const session = getStudentSession()
    return subscribeStudentNotifications(
      { email: session?.email, userId: session?.id },
      (incoming) => {
        if (String(incoming?.type || '').toLowerCase() !== 'profile') return
        const token = getStudentToken()
        if (!token) return
        getStudentMe(token)
          .then((data) => applyProfilePayload(data, { silent: true }))
          .catch(() => {})
      },
    )
  }, [applyProfilePayload])

  function startEdit() {
    setForm(toFormState(profile, pending))
    setError('')
    setSuccess('')
    setEditing(true)
  }

  function cancelEdit() {
    setForm(toFormState(profile, pending))
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

  async function handlePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const token = getStudentToken()
    if (!token) {
      setError('Please log in again to upload a photo')
      return
    }
    setUploadingPhoto(true)
    setError('')
    try {
      const data = await uploadStudentAvatar(token, file)
      setField('avatar', data.data?.url || data.url || '')
    } catch (err) {
      setError(err.message || 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
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
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.replace(/\D/g, '').slice(-10),
      dob: form.dob,
      gender: form.gender,
      bloodGroup: form.bloodGroup,
      avatar: form.avatar,
      address: form.address,
      parent: form.parent,
      emergency: form.emergency,
    }

    try {
      const data = await updateStudentProfile(token, payload)
      setPending(data.pendingProfileChange || null)
      if (data.user) setProfile(data.user)
      setEditing(false)
      setSuccess(
        data.message ||
          'Request submitted. Admin approval ke baad profile update hogi.',
      )
    } catch (err) {
      setError(err.message || 'Failed to submit profile request')
    } finally {
      setSaving(false)
    }
  }

  const p = profile
  const displayPhone =
    p.phone || (p.mobile ? `+91 ${p.mobile}` : '') || '—'
  const heroPhoto = editing
    ? studentMediaUrl(form.avatar) || studentMediaUrl(p.avatar) || avatarFromName(form.name || p.name)
    : studentMediaUrl(p.avatar) || avatarFromName(p.name)
  const hasPending = pending?.status === 'Pending'

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
            <div className="relative">
              <img
                src={heroPhoto}
                alt={p.name}
                className="h-20 w-20 rounded-lg border-2 border-[#FF5E14]/50 object-cover"
              />
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45 text-white"
                    title="Change photo"
                  >
                    <Camera size={18} />
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handlePhoto}
                  />
                </>
              ) : null}
            </div>
            <div>
              <h2 className="text-xl font-bold">{p.name || 'Student'}</h2>
              <p className="text-sm text-slate-300">{p.email || p.id || '—'}</p>
              <p className="mt-1 text-xs text-[#00E5CC]">
                {[p.course, p.batch].filter(Boolean).join(' · ') || 'Complete your profile'}
              </p>
              {uploadingPhoto ? (
                <p className="mt-1 text-xs text-amber-200">Uploading photo…</p>
              ) : null}
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
              <PrimaryButton onClick={handleSave} disabled={saving || uploadingPhoto}>
                <Check size={14} />
                {saving ? 'Submitting…' : 'Submit for approval'}
              </PrimaryButton>
            </div>
          ) : (
            <PrimaryButton onClick={startEdit}>
              <Pencil size={14} />
              {hasPending ? 'Update request' : 'Edit Profile'}
            </PrimaryButton>
          )}
        </div>
      </div>

      {hasPending ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Aapki personal details ki request admin ke paas pending hai. Approve hone ke baad hi
          profile update hogi.
        </p>
      ) : null}

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
              <Field label="Email">
                <input
                  className={inputClass}
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                />
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

        <Panel title="Education Details">
          {p.education?.length ? (
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
          {p.skills?.length ? (
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
        </Panel>
      </div>
    </section>
  )
}
