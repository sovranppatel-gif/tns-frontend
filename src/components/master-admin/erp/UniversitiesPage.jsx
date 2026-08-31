import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Building2, Pencil, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import {
  activateUniversity,
  createUniversity,
  deleteUniversity,
  getUniversities,
  updateUniversity,
} from '../../../services/universityService.js'
import {
  DataTable,
  PageToolbar,
  Pagination,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  StatusBadge,
  useClientTable,
  downloadCsv,
} from '../shared/MasterAdminUI.jsx'

const UNIVERSITY_TYPE_OPTIONS = [
  'State University',
  'Central University',
  'Private University',
  'Deemed University',
  'Open University',
  'ITI / SCVT',
  'Other',
]

const columns = [
  { key: 'name', label: 'University' },
  { key: 'universityCode', label: 'Code' },
  { key: 'universityType', label: 'Type' },
  { key: 'registrationNumber', label: 'Registration No.' },
  { key: 'city', label: 'City' },
  { key: 'status', label: 'Status' },
]

const emptyForm = {
  name: '',
  shortName: '',
  universityCode: '',
  universityType: '',
  establishedYear: '',
  logo: '',

  registrationNumber: '',
  affiliationNumber: '',
  affiliationAuthority: '',
  recognitionDetails: '',

  address: '',
  city: '',
  district: '',
  state: '',
  pincode: '',

  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  website: '',

  status: 'Active',
  remarks: '',
}

function mapFormToPayload(form) {
  return {
    name: String(form.name || '').trim(),
    shortName: String(form.shortName || '').trim(),
    universityCode: String(form.universityCode || '').trim().toUpperCase(),
    universityType: String(form.universityType || '').trim(),
    establishedYear: String(form.establishedYear || '').trim(),
    logo: String(form.logo || '').trim(),
    registrationNumber: String(form.registrationNumber || '').trim(),
    affiliationNumber: String(form.affiliationNumber || '').trim(),
    affiliationAuthority: String(form.affiliationAuthority || '').trim(),
    recognitionDetails: String(form.recognitionDetails || '').trim(),
    address: String(form.address || '').trim(),
    city: String(form.city || '').trim(),
    district: String(form.district || '').trim(),
    state: String(form.state || '').trim(),
    pincode: String(form.pincode || '').trim(),
    contactPerson: String(form.contactPerson || '').trim(),
    contactPhone: String(form.contactPhone || '').trim(),
    contactEmail: String(form.contactEmail || '').trim(),
    website: String(form.website || '').trim(),
    status: form.status || 'Active',
    remarks: String(form.remarks || '').trim(),
  }
}

function mapRowToForm(row) {
  return {
    name: row.name || '',
    shortName: row.shortName || '',
    universityCode: row.universityCode || '',
    universityType: row.universityType || '',
    establishedYear: row.establishedYear != null && row.establishedYear !== '' ? String(row.establishedYear) : '',
    logo: row.logo || '',
    registrationNumber: row.registrationNumber || '',
    affiliationNumber: row.affiliationNumber || '',
    affiliationAuthority: row.affiliationAuthority || '',
    recognitionDetails: row.recognitionDetails || '',
    address: row.address || '',
    city: row.city || '',
    district: row.district || '',
    state: row.state || '',
    pincode: row.pincode || '',
    contactPerson: row.contactPerson || '',
    contactPhone: row.contactPhone || '',
    contactEmail: row.contactEmail || '',
    website: row.website || '',
    status: row.status || 'Active',
    remarks: row.remarks || '',
  }
}

function locationText(row) {
  return [row.city, row.district, row.state].filter(Boolean).join(', ')
}

function isLikelyLogoUrl(value) {
  const v = String(value || '').trim()
  if (!v) return false
  return /^(https?:\/\/|\/)/i.test(v)
}

function isValidYear(value) {
  const raw = String(value || '').trim()
  if (!raw) return true
  if (!/^\d{4}$/.test(raw)) return false
  const year = Number(raw)
  const max = new Date().getFullYear() + 1
  return year >= 1800 && year <= max
}

function isValidPincode(value) {
  const raw = String(value || '').trim()
  if (!raw) return true
  return /^\d{6}$/.test(raw)
}

function isValidPhone(value) {
  const raw = String(value || '').trim()
  if (!raw) return true
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

function isValidEmail(value) {
  const raw = String(value || '').trim()
  if (!raw) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)
}

function isValidWebsite(value) {
  const raw = String(value || '').trim()
  if (!raw) return true
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`)
    return Boolean(url.hostname && /\./.test(url.hostname))
  } catch {
    return false
  }
}

function Field({ label, required = false, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </div>
  )
}

function FormSection({ title, children }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  )
}

function inputClassName(type = 'input') {
  const base =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#00A896] focus:ring-2 focus:ring-[#00A896]/15'
  if (type === 'textarea') return `${base} min-h-24 resize-y`
  return base
}

function LogoPreview({ src, size = 'md', fallback = null }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  const value = String(src || '').trim()
  if (!value || failed || !isLikelyLogoUrl(value)) return fallback

  const sizeClass = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12'

  return (
    <img
      src={value}
      alt="University logo"
      className={`${sizeClass} shrink-0 rounded-lg border border-slate-200 bg-white object-contain`}
      onError={() => setFailed(true)}
    />
  )
}

export default function UniversitiesPage() {
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const formRef = useRef(null)

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const openForm = (nextForm = emptyForm, id = null) => {
    setEditingId(id)
    setForm(nextForm)
    setFormOpen(true)
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setError('')
      const data = await getUniversities()
      setRows(data.rows)
      setStats(data.stats || {})
    } catch (err) {
      setError(err?.message || 'Unable to load universities')
      setRows([])
      setStats({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const table = useClientTable(rows, {
    searchKeys: [
      'name',
      'shortName',
      'universityCode',
      'universityType',
      'registrationNumber',
      'affiliationNumber',
      'city',
      'district',
      'state',
      'contactEmail',
    ],
    pageSize: 8,
    filterKey: 'status',
  })

  const filterOptions = useMemo(() => ['Active', 'Inactive', 'Draft'], [])

  const tableColumns = [
    {
      key: 'name',
      label: 'University',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{row.name}</p>
          <p className="truncate text-xs text-slate-500">
            {locationText(row) || 'Location pending'}
          </p>
        </div>
      ),
    },
    {
      key: 'universityCode',
      label: 'Code',
      render: (row) => (
        <span className="block max-w-[9rem] truncate font-medium text-slate-800">
          {row.universityCode || '—'}
        </span>
      ),
    },
    {
      key: 'universityType',
      label: 'Type',
      render: (row) => (
        <span className="block max-w-[11rem] truncate">{row.universityType || '—'}</span>
      ),
    },
    {
      key: 'registrationNumber',
      label: 'Registration No.',
      render: (row) => (
        <span className="block max-w-[10rem] truncate">{row.registrationNumber || '—'}</span>
      ),
    },
    {
      key: 'city',
      label: 'City',
      render: (row) => <span className="block max-w-[8rem] truncate">{row.city || '—'}</span>,
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
        <div className="flex w-full flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              openForm(mapRowToForm(row), row._id)
            }}
            className="inline-flex items-center gap-1 rounded-full border border-[#008C95]/30 bg-[#008C95]/10 px-2.5 py-1 text-xs font-semibold text-[#008C95] transition hover:bg-[#008C95]/15"
          >
            <Pencil size={12} /> Edit
          </button>
          {row.status === 'Inactive' ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  await activateUniversity(row._id)
                  setToast('University activated')
                  await reload()
                } catch (err) {
                  setError(err?.message || 'Activate failed')
                }
              }}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <ShieldCheck size={12} /> Activate
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const ok = window.confirm(
                  `${row.shortName || row.name} ko Inactive karein?\n\nYeh database me rahegi — purane students ke data ke liye. Status Inactive dikhega.`,
                )
                if (!ok) return
                try {
                  await deleteUniversity(row._id)
                  setToast('University marked Inactive (saved in database)')
                  await reload()
                } catch (err) {
                  setError(err?.message || 'Deactivate failed')
                }
              }}
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
            >
              <Trash2 size={12} /> Deactivate
            </button>
          )}
        </div>
      ),
    },
  ]

  const topUniversities = useMemo(
    () => rows.filter((row) => row.status === 'Active').slice(0, 3),
    [rows],
  )

  const handleAdd = () => {
    openForm(emptyForm, null)
  }

  const handleSave = async () => {
    setError('')
    if (!form.name.trim()) return setError('University name is required')
    if (!form.shortName.trim()) return setError('Short name is required')
    if (!form.universityCode.trim()) return setError('University code is required')
    if (!form.universityType.trim()) return setError('University type is required')
    if (!isValidYear(form.establishedYear)) {
      return setError('Established year must be a valid 4-digit year')
    }
    if (!isValidPincode(form.pincode)) {
      return setError('Pincode should be 6 digits')
    }
    if (!isValidPhone(form.contactPhone)) {
      return setError('Enter a valid contact phone number')
    }
    if (!isValidEmail(form.contactEmail)) {
      return setError('Enter a valid contact email')
    }
    if (!isValidWebsite(form.website)) {
      return setError('Official website should be a valid URL')
    }

    setSaving(true)
    try {
      const payload = mapFormToPayload(form)
      if (editingId) {
        await updateUniversity(editingId, payload)
        setToast('University updated')
      } else {
        await createUniversity(payload)
        setToast('University added')
      }
      setFormOpen(false)
      setEditingId(null)
      setForm(emptyForm)
      await reload()
    } catch (err) {
      setError(err?.message || 'Unable to save university')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="w-full min-w-0 space-y-3 overflow-x-hidden">
      {toast ? (
        <div className="fixed right-3 top-3 z-[90] max-w-[calc(100vw-1.5rem)] rounded-lg bg-[#008C95] px-4 py-2 text-sm font-medium text-white shadow-lg sm:right-4 sm:top-4">
          {toast}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <StatCard label="Total Universities" value={loading ? '—' : String(stats.total ?? rows.length)} icon={Building2} />
        <StatCard label="Active" value={loading ? '—' : String(stats.active ?? 0)} icon={ShieldCheck} hint="Currently in use" />
        <StatCard label="Inactive" value={loading ? '—' : String(stats.inactive ?? 0)} hint="Hidden but kept in DB" />
        <StatCard label="Draft" value={loading ? '—' : String(stats.draft ?? 0)} hint="Not published yet" />
      </div>

      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          {error}
        </article>
      ) : null}

      <PageToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search name, code, type, city, email…"
        filters={filterOptions}
        filterValue={table.filter}
        onFilter={table.setFilter}
        addLabel="Add University"
        onAdd={handleAdd}
        onExportCsv={() => downloadCsv('universities.csv', columns, table.filtered)}
        onExportExcel={() => downloadCsv('universities.xls', columns, table.filtered)}
        onExportPdf={() => window.print()}
      />

      {formOpen ? (
        <div ref={formRef}>
          <Panel title={editingId ? 'Edit University' : 'Add University'} className="p-3">
            <div className="space-y-3">
              <FormSection title="Basic Information">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="University Name" required>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className={inputClassName()}
                      placeholder="Full university name"
                    />
                  </Field>
                  <Field label="Short Name" required>
                    <input
                      value={form.shortName}
                      onChange={(e) => setForm((prev) => ({ ...prev, shortName: e.target.value.toUpperCase() }))}
                      className={inputClassName()}
                      placeholder="MCU / RDVV / IGNOU"
                    />
                  </Field>
                  <Field label="University Code" required>
                    <input
                      value={form.universityCode}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, universityCode: e.target.value.toUpperCase() }))
                      }
                      className={inputClassName()}
                      placeholder="Internal or official code"
                    />
                  </Field>
                  <Field label="University Type" required>
                    <select
                      value={form.universityType}
                      onChange={(e) => setForm((prev) => ({ ...prev, universityType: e.target.value }))}
                      className={inputClassName()}
                    >
                      <option value="">Select type</option>
                      {UNIVERSITY_TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Established Year">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1800}
                      max={new Date().getFullYear() + 1}
                      value={form.establishedYear}
                      onChange={(e) => setForm((prev) => ({ ...prev, establishedYear: e.target.value }))}
                      className={inputClassName()}
                      placeholder="e.g. 1957"
                    />
                  </Field>
                  <Field label="University Logo">
                    <div className="flex min-w-0 items-start gap-2">
                      <input
                        value={form.logo}
                        onChange={(e) => setForm((prev) => ({ ...prev, logo: e.target.value }))}
                        className={`${inputClassName()} min-w-0 flex-1`}
                        placeholder="https://… or /uploads/logo.png"
                      />
                      <LogoPreview src={form.logo} />
                    </div>
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Registration & Recognition">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="Registration Number">
                    <input
                      value={form.registrationNumber}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, registrationNumber: e.target.value.toUpperCase() }))
                      }
                      className={inputClassName()}
                      placeholder="Registration no."
                    />
                  </Field>
                  <Field label="Affiliation Number">
                    <input
                      value={form.affiliationNumber}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, affiliationNumber: e.target.value.toUpperCase() }))
                      }
                      className={inputClassName()}
                      placeholder="Affiliation / approval no."
                    />
                  </Field>
                  <Field label="Affiliation Authority" className="sm:col-span-2">
                    <input
                      value={form.affiliationAuthority}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, affiliationAuthority: e.target.value }))
                      }
                      className={inputClassName()}
                      placeholder="UGC / AICTE / State board / …"
                    />
                  </Field>
                  <Field label="Recognition / Approval Details" className="sm:col-span-2">
                    <textarea
                      value={form.recognitionDetails}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, recognitionDetails: e.target.value }))
                      }
                      className={inputClassName('textarea')}
                      placeholder="UGC recognition, AICTE approval, or other authority notes"
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Address">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Address" className="sm:col-span-2 lg:col-span-4">
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                      className={inputClassName('textarea')}
                      placeholder="Street, campus, landmark"
                    />
                  </Field>
                  <Field label="City">
                    <input
                      value={form.city}
                      onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                      className={inputClassName()}
                    />
                  </Field>
                  <Field label="District">
                    <input
                      value={form.district}
                      onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))}
                      className={inputClassName()}
                    />
                  </Field>
                  <Field label="State">
                    <input
                      value={form.state}
                      onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                      className={inputClassName()}
                    />
                  </Field>
                  <Field label="Pincode">
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      value={form.pincode}
                      onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value }))}
                      className={inputClassName()}
                      placeholder="6 digits"
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Contact Information">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="Contact Person">
                    <input
                      value={form.contactPerson}
                      onChange={(e) => setForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
                      className={inputClassName()}
                    />
                  </Field>
                  <Field label="Contact Phone">
                    <input
                      value={form.contactPhone}
                      onChange={(e) => setForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                      className={inputClassName()}
                    />
                  </Field>
                  <Field label="Contact Email">
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                      className={inputClassName()}
                    />
                  </Field>
                  <Field label="Official Website">
                    <input
                      value={form.website}
                      onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                      className={inputClassName()}
                      placeholder="https://..."
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection title="System">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="Status">
                    <select
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                      className={inputClassName()}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </Field>
                  <Field label="Remarks" className="sm:col-span-2">
                    <textarea
                      value={form.remarks}
                      onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                      className={inputClassName('textarea')}
                      placeholder="Any internal note, admission rule or document detail"
                    />
                  </Field>
                </div>
              </FormSection>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
              <PrimaryButton disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : editingId ? 'Update University' : 'Save University'}
              </PrimaryButton>
            </div>
          </Panel>
        </div>
      ) : null}

      <Panel title="Configured Universities" className="p-3">
        <div className="grid gap-2 lg:grid-cols-3">
          {topUniversities.map((row) => (
            <article key={row._id} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <LogoPreview
                    src={row.logo}
                    size="sm"
                    fallback={
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#008C95]">
                        <Building2 size={16} />
                      </div>
                    }
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">{row.shortName || row.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{row.name}</p>
                  </div>
                </div>
                <StatusBadge status={row.status} />
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="truncate">
                  <span className="font-semibold text-slate-800">Type:</span> {row.universityType || '—'}
                </p>
                <p className="truncate">
                  <span className="font-semibold text-slate-800">Code:</span> {row.universityCode || '—'}
                </p>
                <p className="truncate">
                  <span className="font-semibold text-slate-800">Location:</span> {locationText(row) || '—'}
                </p>
              </div>
            </article>
          ))}
          {!loading && !topUniversities.length ? (
            <p className="col-span-full py-6 text-center text-sm text-slate-500">
              No active universities yet. Click Add University.
            </p>
          ) : null}
        </div>
      </Panel>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={reload}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[#FF5E14]/40 hover:text-[#FF5E14]"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <Panel title="University Records" className="min-w-0 overflow-hidden p-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading universities…</p>
        ) : (
          <>
            <DataTable
              columns={tableColumns}
              rows={table.pageRows}
              emptyTitle="No universities added"
              emptyDescription="Click Add University to create your first university profile."
            />
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
            />
            <div className="mt-3 text-xs text-slate-500">
              Deactivate marks status Inactive but keeps the university in the database for student history. Use Activate to make it Active again.
            </div>
          </>
        )}
      </Panel>
    </section>
  )
}
