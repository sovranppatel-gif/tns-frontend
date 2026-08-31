import { useEffect, useState } from 'react'
import { Panel } from '../shared/MasterAdminUI.jsx'
import FacultyTimetable from './FacultyTimetable.jsx'

export default function FacultyTimetablePage() {
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  return (
    <section className="space-y-3">
      {toast ? (
        <div className="fixed right-3 top-3 z-[90] rounded-lg bg-navy-900 px-4 py-2 text-sm text-white">{toast}</div>
      ) : null}
      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{error}</article>
      ) : null}
      <Panel title="Institute timetable">
        <FacultyTimetable
          showFacultyPicker
          onToast={setToast}
          onError={setError}
        />
      </Panel>
    </section>
  )
}
