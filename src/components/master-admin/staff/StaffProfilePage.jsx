import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, ArrowLeft, Pencil } from 'lucide-react'
import {
  archiveStaff,
  getStaffById,
  getStaffMeta,
  updateStaff,
  updateStaffStatus,
} from '../../../services/staffService.js'
import { API_URL } from '../../../utils/api.js'
import {
  Modal,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  StatusBadge,
} from '../shared/MasterAdminUI.jsx'
import StaffForm from './StaffForm.jsx'
import {
  emptyStaffForm,
  formToPayload,
  photoSrc,
  staffInitials,
  staffToForm,
  validateStaffForm,
} from './staffFormUtils.js'
import { STAFF_STATUSES, dutyDurationLabel } from './staffConstants.js'

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  )
}

export default function StaffProfilePage({ staffId }) {
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(() => emptyStaffForm())
  const [meta, setMeta] = useState({})
  const [formSaving, setFormSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async (opts = {}) => {
    if (!opts.silent) setLoading(true)
    setLoadError('')
    try {
      const data = await getStaffById(staffId)
      setEntry(data)
    } catch (err) {
      setLoadError(err?.message || 'Unable to load staff')
      setEntry(null)
    } finally {
      if (!opts.silent) setLoading(false)
    }
  }, [staffId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    getStaffMeta()
      .then(setMeta)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const openEdit = () => {
    setForm(staffToForm(entry))
    setError('')
    setFormOpen(true)
  }

  const saveEdit = async () => {
    const invalid = validateStaffForm(form)
    if (invalid) return setError(invalid)
    setFormSaving(true)
    setError('')
    try {
      await updateStaff(staffId, formToPayload(form))
      setToast('Staff updated')
      setFormOpen(false)
      await load({ silent: true })
    } catch (err) {
      setError(err?.message || 'Unable to save staff')
    } finally {
      setFormSaving(false)
    }
  }

  const changeStatus = async (status) => {
    try {
      await updateStaffStatus(staffId, status)
      setToast(`Staff marked ${status}`)
      await load({ silent: true })
    } catch (err) {
      setError(err?.message || 'Unable to update status')
    }
  }

  const archive = async () => {
    const ok = window.confirm(
      `Archive ${entry.fullName}?\n\nThis moves the record to Archived Staff. It can be restored later.`,
    )
    if (!ok) return
    try {
      await archiveStaff(staffId)
      setToast('Staff archived')
      navigate('/master-admin/staff/archive')
    } catch (err) {
      setError(err?.message || 'Unable to archive staff')
    }
  }

  if (loading) {
    return (
      <Panel title="Staff profile">
        <p className="py-8 text-center text-sm text-slate-500">Loading staff…</p>
      </Panel>
    )
  }

  if (!entry) {
    return (
      <Panel title="Staff profile">
        <p className="py-8 text-center text-sm text-rose-600">{loadError || 'Staff not found'}</p>
        <div className="flex justify-center">
          <SecondaryButton onClick={() => navigate('/master-admin/staff')}>
            <ArrowLeft size={15} /> Back to staff
          </SecondaryButton>
        </div>
      </Panel>
    )
  }

  const personal = entry.personalDetails || {}
  const employment = entry.employmentDetails || {}
  const emergency = entry.emergencyContact || {}
  const src = photoSrc(personal.profilePhoto || entry.profilePhoto, API_URL)
  const dutyHours = employment.dutyHours || dutyDurationLabel(employment.dutyStart, employment.dutyEnd) || entry.dutyHours
  const archived = Boolean(entry.isArchived)

  return (
    <section className="space-y-3">
      {toast ? (
        <div className="fixed right-3 top-3 z-[90] rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{error}</article>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <SecondaryButton onClick={() => navigate(archived ? '/master-admin/staff/archive' : '/master-admin/staff')}>
          <ArrowLeft size={15} /> Back
        </SecondaryButton>
        {!archived ? (
          <>
            <PrimaryButton onClick={openEdit}>
              <Pencil size={15} /> Edit
            </PrimaryButton>
            <select
              value={entry.status}
              onChange={(e) => changeStatus(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              {STAFF_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <SecondaryButton onClick={archive}>
              <Archive size={15} /> Archive
            </SecondaryButton>
          </>
        ) : (
          <StatusBadge status="Archived" />
        )}
      </div>

      <article className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
        {src ? (
          <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-lg bg-navy-900 text-lg font-bold text-gold">
            {staffInitials(entry.fullName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-navy-900">{entry.fullName}</h2>
            <StatusBadge status={entry.status} />
          </div>
          <p className="text-sm text-slate-500">
            {entry.staffId} · {entry.designation} · {entry.department || '—'}
          </p>
          <p className="text-xs text-slate-400">
            {entry.mobile || '—'} · {entry.email || 'No email'}
          </p>
        </div>
      </article>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Category" value={entry.staffCategory || '—'} />
        <StatCard label="Shift" value={entry.shift || '—'} hint={entry.dutyLabel} />
        <StatCard label="Employment" value={entry.employmentType || '—'} />
        <StatCard label="Salary" value={entry.monthlySalaryLabel || '₹0'} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Personal details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Full name" value={personal.fullName} />
            <Info label="Gender" value={personal.gender} />
            <Info label="Date of birth" value={personal.dateOfBirthLabel} />
            <Info label="Father / Husband" value={personal.fatherOrHusbandName} />
            <Info label="Mobile" value={personal.mobile} />
            <Info label="Alternate mobile" value={personal.alternateMobile} />
            <Info label="Email" value={personal.email} />
            <Info
              label="Full address"
              value={[personal.address, personal.city, personal.state, personal.pincode].filter(Boolean).join(', ')}
            />
          </div>
        </Panel>
        <Panel title="Employment details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Staff ID" value={entry.staffId} />
            <Info label="Designation" value={employment.designation} />
            <Info label="Department" value={employment.department} />
            <Info label="Staff category" value={employment.staffCategory} />
            <Info label="Employment type" value={employment.employmentType} />
            <Info label="Joining date" value={employment.joiningDateLabel} />
            <Info label="Reporting to" value={employment.reportingTo} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Shift & duty details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Shift" value={employment.shift} />
            <Info label="Duty start" value={employment.dutyStart} />
            <Info label="Duty end" value={employment.dutyEnd} />
            <Info label="Total duty hours" value={dutyHours} />
            <Info label="Weekly off" value={employment.weeklyOff} />
          </div>
        </Panel>
        <Panel title="Professional details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Qualification" value={employment.qualification} />
            <Info label="Experience" value={`${employment.experienceYears || 0} years`} />
            <Info label="Monthly salary" value={employment.monthlySalaryLabel || entry.monthlySalaryLabel} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Emergency contact">
          <div className="grid gap-3 sm:grid-cols-3">
            <Info label="Name" value={emergency.name} />
            <Info label="Relation" value={emergency.relation} />
            <Info label="Phone" value={emergency.phone} />
          </div>
        </Panel>
        <Panel title="Internal notes">
          <p className="whitespace-pre-wrap text-sm text-slate-700">{entry.notes || 'No notes added.'}</p>
        </Panel>
      </div>

      <Modal
        open={formOpen}
        title="Edit staff"
        onClose={() => setFormOpen(false)}
        wide
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setFormOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={formSaving} onClick={saveEdit}>
              {formSaving ? 'Saving…' : 'Save staff'}
            </PrimaryButton>
          </div>
        }
      >
        <StaffForm form={form} setForm={setForm} meta={meta} onUploadError={setError} />
      </Modal>
    </section>
  )
}
