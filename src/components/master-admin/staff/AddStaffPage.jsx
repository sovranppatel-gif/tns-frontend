import { useEffect, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createStaff, getStaffMeta } from '../../../services/staffService.js'
import { masterAdminPath } from '../../../utils/masterAdminRoutes.js'
import { card } from '../../../utils/masterAdminTheme.js'
import { Panel, PrimaryButton, SecondaryButton } from '../shared/MasterAdminUI.jsx'
import StaffForm from './StaffForm.jsx'
import { emptyStaffForm, formToPayload, validateStaffForm } from './staffFormUtils.js'

export default function AddStaffPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => emptyStaffForm())
  const [meta, setMeta] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

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

  const goBack = () => navigate(masterAdminPath('Staff'))

  const save = async ({ addAnother = false } = {}) => {
    const invalid = validateStaffForm(form)
    if (invalid) return setError(invalid)
    setSaving(true)
    setError('')
    try {
      await createStaff(formToPayload(form))
      setToast('Staff added')
      if (addAnother) {
        setForm(emptyStaffForm())
      } else {
        window.setTimeout(goBack, 400)
      }
    } catch (err) {
      setError(err?.message || 'Unable to save staff')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-3">
      {toast ? (
        <div className="fixed right-3 top-3 z-[90] rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className={`flex flex-col gap-3 ${card} p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between`}>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <SecondaryButton onClick={goBack}>
            <ArrowLeft size={14} /> Back to directory
          </SecondaryButton>
          <div>
            <p className="text-sm font-semibold text-slate-800">Add Staff</p>
            <p className="text-xs text-slate-500">Create a non-teaching staff record. No login is created.</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SecondaryButton onClick={goBack} className="flex-1 sm:flex-none">
            Cancel
          </SecondaryButton>
          <SecondaryButton disabled={saving} onClick={() => save({ addAnother: true })} className="flex-1 sm:flex-none">
            Save & add another
          </SecondaryButton>
          <PrimaryButton disabled={saving} onClick={() => save()} className="flex-1 sm:flex-none">
            <Save size={14} />
            {saving ? 'Saving…' : 'Save staff'}
          </PrimaryButton>
        </div>
      </div>

      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{error}</article>
      ) : null}

      <Panel title="Staff details">
        <StaffForm form={form} setForm={setForm} meta={meta} isCreate onUploadError={setError} />
      </Panel>
    </section>
  )
}
