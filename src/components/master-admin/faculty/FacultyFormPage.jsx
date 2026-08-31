import { useEffect, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createFaculty, getFacultyMeta } from '../../../services/facultyService.js'
import { masterAdminPath } from '../../../utils/masterAdminRoutes.js'
import { card } from '../../../utils/masterAdminTheme.js'
import { Panel, PrimaryButton, SecondaryButton } from '../shared/MasterAdminUI.jsx'
import FacultyForm from './FacultyForm.jsx'
import { emptyFacultyForm, formToPayload } from './facultyFormUtils.js'

export default function FacultyFormPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => emptyFacultyForm())
  const [meta, setMeta] = useState({ designations: [], departments: [], permissions: [] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    getFacultyMeta()
      .then(setMeta)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const goBack = () => navigate(masterAdminPath('Faculty'))

  const save = async () => {
    if (!String(form.fullName || '').trim()) return setError('Full name is required')
    if (!String(form.mobile || '').trim()) return setError('Mobile number is required')
    if (!String(form.email || '').trim()) return setError('Email is required')
    if (!String(form.designation || '').trim()) return setError('Designation is required')
    if (form.loginEnabled && !form.password) {
      return setError('Password is required when faculty login is enabled')
    }
    setSaving(true)
    setError('')
    try {
      await createFaculty(formToPayload(form))
      setToast('Faculty added')
      window.setTimeout(goBack, 500)
    } catch (err) {
      setError(err?.message || 'Unable to save faculty')
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
            <ArrowLeft size={14} /> Back to Faculty
          </SecondaryButton>
          <div>
            <p className="text-sm font-semibold text-slate-800">Add Faculty</p>
            <p className="text-xs text-slate-500">Create a new instructor, trainer or HOD profile.</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SecondaryButton onClick={goBack} className="flex-1 sm:flex-none">
            Cancel
          </SecondaryButton>
          <PrimaryButton disabled={saving} onClick={save} className="flex-1 sm:flex-none">
            <Save size={14} />
            {saving ? 'Saving…' : 'Save faculty'}
          </PrimaryButton>
        </div>
      </div>

      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{error}</article>
      ) : null}

      <Panel title="Faculty details">
        <FacultyForm
          form={form}
          setForm={setForm}
          meta={meta}
          isCreate
          onUploadError={setError}
        />
      </Panel>
    </section>
  )
}
