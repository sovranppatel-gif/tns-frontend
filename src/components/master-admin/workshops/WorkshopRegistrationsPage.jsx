import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Copy,
  Download,
  Eye,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import {
  DataTable,
  EmptyState,
  Modal,
  Pagination,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SkeletonBlock,
  StatCard,
  StatusBadge,
  Tabs,
} from '../shared/MasterAdminUI.jsx'
import useVisibilityPolling from '../../../hooks/useVisibilityPolling.js'
import {
  createReferralLink,
  deleteReferralLink,
  downloadWorkshopRegistrationsCsv,
  listReferralLinks,
  listWorkshopRegistrations,
  suggestReferralCodeFromServer,
  updateReferralLink,
  updateWorkshopRegistrationStatus,
} from '../../../services/workshopService.js'
import { getUniversities } from '../../../services/universityService.js'
import { clearMasterAdminSession } from '../../../utils/masterAdminAuth.js'
import {
  formatDateDMY,
  formatDateTime,
  formatTime12,
  suggestReferralCode,
  workshopReferralUrl,
} from '../../../utils/workshopFormat.js'

const POLL_MS = 5000
const PAGE_SIZE = 20
const STATUSES = ['Registered', 'Verified', 'Approved', 'Rejected']
const EMPTY_FILTERS = { search: '', college: '', referralCode: '', course: '', semesterYear: '', status: '' }

const EMPTY_LINK_FORM = {
  universityId: '',
  collegeName: '',
  workshopName: 'Skills Enhance Workshop',
  workshopPlace: '',
  workshopStartDate: '',
  workshopEndDate: '',
  startTime: '',
  endTime: '',
  referralCode: '',
}

const inputClass =
  'block h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#00A896] focus:ring-2 focus:ring-[#00A896]/15'

function Field({ id, label, required, hint, error, children }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    el.remove()
    return ok
  }
}

function validateLinkForm(form) {
  if (!form.collegeName.trim()) return 'College name is required'
  if (!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(form.referralCode)) {
    return 'Referral code must be 2-40 characters: A-Z, 0-9, _ or -'
  }
  if (!form.workshopName.trim()) return 'Workshop name is required'
  if (!form.workshopPlace.trim()) return 'Workshop place is required'
  if (!form.workshopStartDate) return 'Workshop start date is required'
  if (!form.workshopEndDate) return 'Workshop end date is required'
  if (form.workshopEndDate < form.workshopStartDate) return 'End date cannot be before the start date'
  if (!form.startTime) return 'Workshop start time is required'
  if (!form.endTime) return 'Workshop end time is required'
  if (form.workshopStartDate === form.workshopEndDate && form.endTime <= form.startTime) {
    return 'End time must be after the start time'
  }
  return ''
}

function ReferralLinkForm({ open, editing, colleges, existingLinks, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_LINK_FORM)
  const [codeTouched, setCodeTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setSaving(false)
    if (editing) {
      setForm({
        ...EMPTY_LINK_FORM,
        ...Object.fromEntries(Object.keys(EMPTY_LINK_FORM).map((k) => [k, editing[k] ?? ''])),
      })
      setCodeTouched(true)
    } else {
      setForm(EMPTY_LINK_FORM)
      setCodeTouched(false)
    }
  }, [open, editing])

  const codeTaken = useMemo(() => {
    const code = form.referralCode
    return Boolean(code) && existingLinks.some((l) => l.referralCode === code && l._id !== editing?._id)
  }, [form.referralCode, existingLinks, editing])

  const setCollegeName = (collegeName, universityId = form.universityId) => {
    setForm((prev) => ({
      ...prev,
      collegeName,
      universityId,
      referralCode: codeTouched ? prev.referralCode : suggestReferralCode(collegeName),
    }))
  }

  // Ask the server for a free code (adds _2, _3 … when the base is taken).
  const refineSuggestion = async () => {
    if (codeTouched || !form.collegeName.trim()) return
    try {
      const code = await suggestReferralCodeFromServer(form.collegeName, editing?._id)
      if (code) setForm((prev) => (codeTouched ? prev : { ...prev, referralCode: code }))
    } catch {
      /* keep the client-side suggestion */
    }
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const message = codeTaken ? 'This referral code is already in use' : validateLinkForm(form)
    if (message) {
      setError(message)
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, universityId: form.universityId || null }
      const saved = editing
        ? await updateReferralLink(editing._id, payload)
        : await createReferralLink(payload)
      onSaved(saved, Boolean(editing))
    } catch (err) {
      setError(err.message || 'Could not save the referral link')
      setSaving(false)
    }
  }

  const codeChanged = editing && form.referralCode !== editing.referralCode

  return (
    <Modal
      open={open}
      wide
      title={editing ? 'Edit referral link' : 'Create referral link'}
      onClose={saving ? () => {} : onClose}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <SecondaryButton onClick={onClose} disabled={saving} className="justify-center">
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" form="referral-link-form" disabled={saving} className="justify-center">
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {editing ? 'Save changes' : 'Create link'}
          </PrimaryButton>
        </div>
      }
    >
      <form id="referral-link-form" noValidate onSubmit={onSubmit} className="space-y-4">
        {colleges.length ? (
          <Field id="rl-university" label="Pick from active colleges" hint="Optional. Links the referral to a college record so students see it pre-selected.">
            <select
              id="rl-university"
              className={inputClass}
              value={form.universityId || ''}
              onChange={(e) => {
                const college = colleges.find((c) => c._id === e.target.value)
                if (college) setCollegeName(college.name, college._id)
                else setForm((prev) => ({ ...prev, universityId: '' }))
              }}
            >
              <option value="">Not linked, use the college name below</option>
              {colleges.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.shortName ? ` (${c.shortName})` : ''}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="rl-college" label="College name" required>
            <input
              id="rl-college"
              className={inputClass}
              value={form.collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              onBlur={refineSuggestion}
              placeholder="e.g. MIMT NSP"
              maxLength={150}
            />
          </Field>
          <Field
            id="rl-code"
            label="Referral code"
            required
            error={codeTaken ? 'Already used by another link' : ''}
            hint={
              codeChanged
                ? 'Changing the code breaks the old link; existing registrations move to the new code.'
                : codeTouched
                  ? 'Edited manually'
                  : 'Suggested from the college name. You can edit it.'
            }
          >
            <div className="flex min-w-0 gap-2">
              <input
                id="rl-code"
                className={`${inputClass} font-mono uppercase`}
                value={form.referralCode}
                onChange={(e) => {
                  setCodeTouched(true)
                  setForm((prev) => ({
                    ...prev,
                    referralCode: e.target.value.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_-]/g, ''),
                  }))
                }}
                maxLength={40}
                aria-invalid={codeTaken ? 'true' : undefined}
              />
              {codeTouched && !editing ? (
                <button
                  type="button"
                  onClick={() => {
                    setCodeTouched(false)
                    setForm((prev) => ({ ...prev, referralCode: suggestReferralCode(prev.collegeName) }))
                  }}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:text-[#008C95]"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </Field>
        </div>

        <Field id="rl-workshop" label="Workshop name" required>
          <input id="rl-workshop" name="workshopName" className={inputClass} value={form.workshopName} onChange={onChange} maxLength={150} />
        </Field>
        <Field id="rl-place" label="Workshop place" required>
          <input
            id="rl-place"
            name="workshopPlace"
            className={inputClass}
            value={form.workshopPlace}
            onChange={onChange}
            placeholder="Venue / hall, campus, city"
            maxLength={250}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="rl-start-date" label="Start date" required>
            <input id="rl-start-date" type="date" name="workshopStartDate" className={inputClass} value={form.workshopStartDate} onChange={onChange} />
          </Field>
          <Field id="rl-end-date" label="End date" required>
            <input
              id="rl-end-date"
              type="date"
              name="workshopEndDate"
              min={form.workshopStartDate || undefined}
              className={inputClass}
              value={form.workshopEndDate}
              onChange={onChange}
            />
          </Field>
          <Field id="rl-start-time" label="Start time" required>
            <input id="rl-start-time" type="time" name="startTime" className={inputClass} value={form.startTime} onChange={onChange} />
          </Field>
          <Field id="rl-end-time" label="End time" required>
            <input id="rl-end-time" type="time" name="endTime" className={inputClass} value={form.endTime} onChange={onChange} />
          </Field>
        </div>

        {form.referralCode ? (
          <p className="break-all rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Public link: <span className="font-mono text-slate-800">{workshopReferralUrl(form.referralCode)}</span>
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </p>
        ) : null}
      </form>
    </Modal>
  )
}

function RegistrationDetails({ row, onClose }) {
  if (!row) return null
  const items = [
    ['Registration ID', row.registrationId],
    ['Registered at', formatDateTime(row.createdAt)],
    ['Full name', row.fullName],
    ['Mobile', row.mobile],
    ['Email', row.email],
    ['WhatsApp', row.whatsappNumber],
    ['College / Institute', row.collegeName],
    ['Course', row.course],
    ['Semester / Year', row.semesterYear],
    ['Coding experience', row.codingExperience],
    ['GitHub', row.githubProfile],
    ['LinkedIn', row.linkedinProfile],
    ['Referral code', row.referralCode],
    ['Workshop', row.workshopName],
    ['Status', row.status],
    ['Status changed by', row.statusUpdatedBy ? `${row.statusUpdatedBy} · ${formatDateTime(row.statusUpdatedAt)}` : ''],
  ]
  return (
    <Modal open title={row.fullName} onClose={onClose} wide>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-0.5 break-words text-sm font-medium text-slate-800 [overflow-wrap:anywhere]">
              {value && /^https?:\/\//.test(value) ? (
                <a href={value} target="_blank" rel="noreferrer noopener" className="text-[#008C95] underline">
                  {value}
                </a>
              ) : (
                value || '—'
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}

export default function WorkshopRegistrationsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('registrations')

  const [links, setLinks] = useState([])
  const [linksLoaded, setLinksLoaded] = useState(false)
  const [colleges, setColleges] = useState([])

  const [regData, setRegData] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const [error, setError] = useState('')
  const [bgError, setBgError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [toast, setToast] = useState('')
  const [exporting, setExporting] = useState(false)
  const [updatingId, setUpdatingId] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [viewing, setViewing] = useState(null)

  const queryParams = useMemo(() => ({ ...filters, page, limit: PAGE_SIZE }), [filters, page])
  const queryRef = useRef(queryParams)
  queryRef.current = queryParams
  const requestSeq = useRef(0)

  const handleAuthError = useCallback(
    (err) => {
      if (err?.status !== 401) return false
      clearMasterAdminSession()
      navigate('/master-admin', { replace: true })
      return true
    },
    [navigate],
  )

  /** Loads links + registrations. `silent` = background poll: no spinners, keep old data on error. */
  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      const seq = ++requestSeq.current
      const params = queryRef.current
      try {
        const [linkRows, regs] = await Promise.all([listReferralLinks(), listWorkshopRegistrations(params)])
        if (seq !== requestSeq.current) return // a newer request (e.g. filter change) superseded this one
        setLinks(linkRows)
        setLinksLoaded(true)
        setRegData(regs)
        setLastUpdated(new Date())
        setBgError(false)
        if (!silent) setError('')
      } catch (err) {
        if (handleAuthError(err)) return
        if (seq !== requestSeq.current) return
        if (silent) setBgError(true)
        else setError(err.message || 'Unable to load workshop data')
      }
    },
    [handleAuthError],
  )

  useEffect(() => {
    refresh()
  }, [queryParams, refresh])

  useVisibilityPolling(() => refresh({ silent: true }), POLL_MS)

  useEffect(() => {
    getUniversities()
      .then((data) => setColleges(data.rows.filter((r) => r.status === 'Active')))
      .catch(() => setColleges([]))
  }, [])

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((prev) => (prev.search === searchInput.trim() ? prev : { ...prev, search: searchInput.trim() }))
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setSearchInput('')
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const hasFilters = Object.values(filters).some(Boolean)

  const onCopy = async (code) => {
    const ok = await copyText(workshopReferralUrl(code))
    setToast(ok ? 'Referral URL copied' : 'Copy failed. Select the link and copy it manually.')
  }

  const onStatusChange = async (row, status) => {
    if (status === row.status) return
    setUpdatingId(row._id)
    setRegData((prev) =>
      prev ? { ...prev, rows: prev.rows.map((r) => (r._id === row._id ? { ...r, status } : r)) } : prev,
    )
    try {
      await updateWorkshopRegistrationStatus(row._id, status)
      setToast(`${row.registrationId} marked ${status}`)
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message || 'Status update failed')
    } finally {
      setUpdatingId('')
      refresh({ silent: true })
    }
  }

  const onExport = async () => {
    setExporting(true)
    try {
      const { page: _p, limit: _l, ...exportFilters } = queryRef.current
      await downloadWorkshopRegistrationsCsv(exportFilters)
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const onDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await deleteReferralLink(deleting._id)
      setToast(`Referral link ${deleting.referralCode} deleted`)
      setDeleting(null)
      refresh()
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message || 'Delete failed')
    } finally {
      setDeleteBusy(false)
    }
  }

  const showRegistrationsFor = (code) => {
    setSearchInput('')
    setFilters({ ...EMPTY_FILTERS, referralCode: code })
    setPage(1)
    setTab('registrations')
  }

  const stats = regData?.stats || {}
  const options = regData?.filterOptions || {}
  const initialLoading = !regData && !error

  const linkColumns = [
    {
      key: 'collegeName',
      label: 'College',
      render: (row) => (
        <div className="min-w-0">
          <p className="break-words font-semibold text-slate-900">{row.collegeName}</p>
          <p className="break-words text-xs text-slate-500">{row.workshopName}</p>
        </div>
      ),
    },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (row) => (
        <div className="text-xs text-slate-600">
          <p>
            {formatDateDMY(row.workshopStartDate)} to {formatDateDMY(row.workshopEndDate)}
          </p>
          <p>
            {formatTime12(row.startTime)} to {formatTime12(row.endTime)}
          </p>
        </div>
      ),
    },
    {
      key: 'workshopPlace',
      label: 'Place',
      render: (row) => <span className="block break-words text-sm">{row.workshopPlace || '—'}</span>,
    },
    {
      key: 'referralCode',
      label: 'Referral code',
      render: (row) => <span className="break-all font-mono text-xs font-semibold text-slate-800">{row.referralCode}</span>,
    },
    {
      key: 'registrationCount',
      label: 'Registrations',
      render: (row) => (
        <button
          type="button"
          onClick={() => showRegistrationsFor(row.referralCode)}
          className="inline-flex items-center gap-1 rounded-full bg-[#008C95]/10 px-2.5 py-1 text-xs font-bold text-[#005F6B] hover:bg-[#008C95]/20"
          aria-label={`View ${row.registrationCount} registrations for ${row.referralCode}`}
        >
          <Users size={12} /> {row.registrationCount}
        </button>
      ),
    },
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onCopy(row.referralCode)}
            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-[#008C95]/40 hover:text-[#008C95]"
          >
            <Copy size={12} /> Copy URL
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(row)
              setFormOpen(true)
            }}
            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[#008C95]/30 bg-[#008C95]/10 px-2.5 py-1 text-xs font-semibold text-[#008C95] hover:bg-[#008C95]/15"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleting(row)}
            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      ),
    },
  ]

  const registrationColumns = [
    {
      key: 'registrationId',
      label: 'Reg. ID',
      render: (row) => (
        <div>
          <p className="font-mono text-xs font-semibold text-slate-900">{row.registrationId}</p>
          <p className="text-[11px] text-slate-500">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'fullName',
      label: 'Student',
      render: (row) => (
        <div className="min-w-0">
          <p className="break-words font-semibold text-slate-900">{row.fullName}</p>
          <p className="break-all text-xs text-slate-500">{row.email}</p>
          <p className="text-xs text-slate-500">{row.mobile}</p>
        </div>
      ),
    },
    {
      key: 'collegeName',
      label: 'College',
      render: (row) => (
        <div className="min-w-0">
          <p className="break-words text-sm">{row.collegeName}</p>
          <p className="break-all font-mono text-[11px] text-slate-500">{row.referralCode}</p>
        </div>
      ),
    },
    {
      key: 'course',
      label: 'Course',
      render: (row) => (
        <div className="text-sm">
          <p className="break-words">{row.course}</p>
          <p className="text-xs text-slate-500">{row.semesterYear}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="sr-only" htmlFor={`status-${row._id}`}>
            Change status for {row.fullName}
          </label>
          <select
            id={`status-${row._id}`}
            value={row.status}
            disabled={updatingId === row._id}
            onChange={(e) => onStatusChange(row, e.target.value)}
            className="h-8 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#00A896] disabled:opacity-60"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setViewing(row)}
            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-[#008C95]"
          >
            <Eye size={12} /> View
          </button>
        </div>
      ),
    },
  ]

  const filterSelects = [
    ['college', 'College', options.colleges, 'All colleges'],
    ['referralCode', 'Referral code', options.referralCodes, 'All referral codes'],
    ['course', 'Course', options.courses, 'All courses'],
    ['semesterYear', 'Semester / Year', options.semesters, 'All semesters / years'],
    ['status', 'Status', STATUSES, 'All statuses'],
  ]

  return (
    <section className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          tabs={[
            { id: 'registrations', label: `Registrations${stats.total != null ? ` (${stats.total})` : ''}` },
            { id: 'links', label: `Referral links${linksLoaded ? ` (${links.length})` : ''}` },
          ]}
          active={tab}
          onChange={setTab}
        />
        <p className="flex items-center gap-1.5 text-xs text-slate-500" aria-live="polite">
          <span
            className={`inline-block h-2 w-2 rounded-full ${bgError ? 'bg-amber-500' : 'bg-emerald-500'}`}
            aria-hidden="true"
          />
          {bgError
            ? 'Connection issue, retrying…'
            : lastUpdated
              ? `Live · updated ${lastUpdated.toLocaleTimeString('en-IN')}`
              : 'Loading…'}
        </p>
      </div>

      {error ? (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="min-w-0 flex-1 break-words">{error}</span>
          <button type="button" aria-label="Dismiss error" onClick={() => setError('')} className="shrink-0">
            <X size={16} />
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Referral links" value={linksLoaded ? links.length : '—'} icon={Link2} />
        <StatCard label="Total registrations" value={stats.total ?? '—'} icon={Users} />
        {STATUSES.map((s) => (
          <StatCard key={s} label={s} value={stats[s] ?? '—'} />
        ))}
      </div>

      {tab === 'links' ? (
        <Panel
          title="Referral links"
          action={
            <PrimaryButton
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus size={15} /> Create referral link
            </PrimaryButton>
          }
        >
          {!linksLoaded && !error ? (
            <div className="space-y-2">
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-16" />
            </div>
          ) : links.length ? (
            <DataTable columns={linkColumns} rows={links} wrap />
          ) : (
            <EmptyState
              icon={Link2}
              title="No referral links yet"
              description="Create a link for a college and share it with their students."
            />
          )}
        </Panel>
      ) : (
        <Panel
          title="Workshop registrations"
          action={
            <SecondaryButton onClick={onExport} disabled={exporting || !regData?.total}>
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Export CSV
            </SecondaryButton>
          }
        >
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm sm:col-span-2 lg:col-span-3 xl:col-span-1">
              <Search size={15} className="shrink-0 text-[#FF5E14]" aria-hidden="true" />
              <span className="sr-only">Search registrations</span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name, email, mobile, ID…"
                className="min-w-0 flex-1 bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
            {filterSelects.map(([key, label, list, allLabel]) => (
              <label key={key} className="min-w-0">
                <span className="sr-only">Filter by {label}</span>
                <select
                  value={filters[key]}
                  onChange={(e) => setFilter(key, e.target.value)}
                  className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-[#00A896]"
                >
                  <option value="">{allLabel}</option>
                  {(list || []).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {hasFilters ? (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                {regData?.total ?? 0} matching registration{regData?.total === 1 ? '' : 's'}
              </span>
              <button type="button" onClick={clearFilters} className="font-semibold text-[#008C95] underline">
                Clear filters
              </button>
            </div>
          ) : null}

          {initialLoading ? (
            <div className="space-y-2">
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-16" />
            </div>
          ) : regData?.rows?.length ? (
            <>
              <DataTable columns={registrationColumns} rows={regData.rows} wrap />
              <Pagination page={page} pageSize={PAGE_SIZE} total={regData.total} onPageChange={setPage} />
            </>
          ) : (
            <EmptyState
              icon={Users}
              title={hasFilters ? 'No registrations match these filters' : 'No registrations yet'}
              description={
                hasFilters
                  ? 'Try a different search or clear the filters.'
                  : 'Registrations appear here automatically as students sign up through referral links.'
              }
            />
          )}
        </Panel>
      )}

      <ReferralLinkForm
        open={formOpen}
        editing={editing}
        colleges={colleges}
        existingLinks={links}
        onClose={() => setFormOpen(false)}
        onSaved={(saved, wasEdit) => {
          setFormOpen(false)
          setToast(wasEdit ? 'Referral link updated' : `Referral link ${saved.referralCode} created`)
          refresh()
        }}
      />

      <Modal
        open={Boolean(deleting)}
        title="Delete referral link?"
        onClose={() => !deleteBusy && setDeleting(null)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <SecondaryButton onClick={() => setDeleting(null)} disabled={deleteBusy} className="justify-center">
              Cancel
            </SecondaryButton>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteBusy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70"
            >
              {deleteBusy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete link
            </button>
          </div>
        }
      >
        {deleting ? (
          <p className="break-words text-sm text-slate-600">
            The link <span className="font-mono font-semibold text-slate-900">{deleting.referralCode}</span> for{' '}
            <strong>{deleting.collegeName}</strong> will stop working immediately. Its{' '}
            {deleting.registrationCount} existing registration{deleting.registrationCount === 1 ? '' : 's'} will be kept.
          </p>
        ) : null}
      </Modal>

      <RegistrationDetails row={viewing} onClose={() => setViewing(null)} />

      {toast ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-sm rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </section>
  )
}
