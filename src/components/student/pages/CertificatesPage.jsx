import { Award, Download, Eye } from 'lucide-react'
import { useStudentLearning } from '../../../hooks/useStudentLearning.js'
import { EmptyState, Panel, PrimaryButton, SkeletonBlock } from '../shared/StudentUI.jsx'

export default function CertificatesPage() {
  const { rows, loading, error } = useStudentLearning('certificates')

  if (loading) return <SkeletonBlock className="h-48" />

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No certificates issued yet"
        description="Completed course certificates will show here for preview and download."
      />
    )
  }

  return (
    <section className="space-y-3">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Panel title="Completed Certificates">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <article
              key={c.id || c._id}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex h-36 flex-col items-center justify-center bg-gradient-to-br from-[#06151C] via-[#0a2530] to-[#005F6B] p-3 text-center text-white">
                <Award className="mb-2 text-[#FFB380]" size={28} />
                <p className="text-sm font-semibold">{c.title}</p>
                <p className="mt-1 text-[11px] text-slate-300">{c.issuer || 'TNS ITI & Computer'}</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-slate-500">Issued {c.issueDate || '—'}</p>
                {c.credentialId ? (
                  <p className="mt-1 text-[11px] font-mono text-slate-400">{c.credentialId}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <PrimaryButton>
                    <Download size={14} />
                    Download
                  </PrimaryButton>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                  >
                    <Eye size={14} />
                    Preview
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  )
}
