import { useMemo, useState } from 'react'
import { Download, ExternalLink, FileArchive, FileText, Film, FolderOpen, Link2, Presentation } from 'lucide-react'
import { useStudentLearning } from '../../../hooks/useStudentLearning.js'
import { EmptyState, Panel, PrimaryButton, SearchInput, SkeletonBlock } from '../shared/StudentUI.jsx'

const typeIcon = {
  PDF: FileText,
  Video: Film,
  PPT: Presentation,
  ZIP: FileArchive,
  Link: Link2,
}

export default function StudyMaterialsPage() {
  const { rows, loading, error } = useStudentLearning('materials')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const categories = ['All', 'Notes', 'Video', 'Slides', 'Resources', 'Link']

  const filtered = useMemo(() => {
    return rows.filter((m) => {
      const q =
        !query ||
        String(m.title || '')
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        String(m.subject || '')
          .toLowerCase()
          .includes(query.toLowerCase())
      const c = category === 'All' || m.category === category
      return q && c
    })
  }, [rows, query, category])

  if (loading) return <SkeletonBlock className="h-48" />

  return (
    <section className="space-y-3">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[200px] flex-1">
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search materials…" />
        </div>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              category === c
                ? 'bg-gradient-to-r from-[#FF5E14] to-[#008C95] text-white'
                : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No study materials yet"
          description="PDFs, videos and slides shared for your courses will list here."
        />
      ) : (
        <Panel title="Recently Added">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m) => {
              const Icon = typeIcon[m.type] || FileText
              return (
                <div
                  key={m.id || m._id}
                  className="flex flex-col rounded-lg border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#00A896]/10 text-[#008C95]">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{m.title}</p>
                      <p className="text-xs text-slate-500">
                        {[m.subject, m.type, m.size].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <PrimaryButton className="w-full justify-center">
                      {m.type === 'Link' ? <ExternalLink size={14} /> : <Download size={14} />}
                      {m.type === 'Link' ? 'Open Link' : 'Download'}
                    </PrimaryButton>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      )}
    </section>
  )
}
