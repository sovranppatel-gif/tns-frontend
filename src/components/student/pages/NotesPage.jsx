import { Bookmark, Download, FileText, Pin } from 'lucide-react'
import { useStudentLearning } from '../../../hooks/useStudentLearning.js'
import { EmptyState, Panel, PrimaryButton, SkeletonBlock } from '../shared/StudentUI.jsx'

export default function NotesPage() {
  const { rows, loading, error } = useStudentLearning('notes')
  const pinned = rows.filter((n) => n.pinned)
  const subjects = [...new Set(rows.map((n) => n.subject).filter(Boolean))]

  if (loading) return <SkeletonBlock className="h-48" />

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No notes uploaded yet"
        description="Subject notes shared by faculty will appear here for download."
      />
    )
  }

  return (
    <section className="space-y-3">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {pinned.length > 0 ? (
        <Panel title="Pinned Notes">
          <div className="grid gap-3 sm:grid-cols-2">
            {pinned.map((n) => (
              <div key={n.id || n._id} className="rounded-lg border border-[#FF5E14]/20 bg-gradient-to-br from-[#FFF0E6] to-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#FF5E14]">{n.subject}</p>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900">{n.title}</h3>
                  </div>
                  <Pin size={14} className="text-[#FF5E14]" />
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Updated {n.updated || n.date || '—'}</p>
                <div className="mt-3 flex gap-2">
                  <PrimaryButton>
                    <Download size={14} />
                    Download
                  </PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel title="Subject-wise Notes">
        <div className="mb-3 flex flex-wrap gap-2">
          {subjects.map((s) => (
            <span key={s} className="rounded-full bg-[#00A896]/10 px-3 py-1 text-xs font-semibold text-[#005F6B]">
              {s}
            </span>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="px-3 py-3 font-medium">Title</th>
                <th className="px-3 py-3 font-medium">Subject</th>
                <th className="px-3 py-3 font-medium">Updated</th>
                <th className="px-3 py-3 font-medium">Bookmark</th>
                <th className="px-3 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((n) => (
                <tr key={n.id || n._id} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-medium text-slate-800">{n.title}</td>
                  <td className="px-3 py-3">{n.subject}</td>
                  <td className="px-3 py-3">{n.updated || n.date || '—'}</td>
                  <td className="px-3 py-3">
                    <Bookmark
                      size={16}
                      className={n.bookmarked ? 'fill-[#FF5E14] text-[#FF5E14]' : 'text-slate-300'}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#008C95] hover:text-[#FF5E14]"
                    >
                      <Download size={12} />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  )
}
