import { Film, Play } from 'lucide-react'
import { useStudentLearning } from '../../../hooks/useStudentLearning.js'
import { EmptyState, Panel, PrimaryButton, ProgressBar, SkeletonBlock } from '../shared/StudentUI.jsx'

const gradients = [
  'from-[#FF5E14] to-[#FF8800]',
  'from-[#008C95] to-[#00A896]',
  'from-[#005F6B] to-[#008C95]',
  'from-[#FF7A00] to-[#008C95]',
  'from-[#0a2530] to-[#005F6B]',
]

export default function RecordedLecturesPage() {
  const { rows, loading, error } = useStudentLearning('lectures')

  if (loading) return <SkeletonBlock className="h-48" />

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Film}
        title="No recorded lectures yet"
        description="Recorded class videos will appear here once faculty uploads them for your batch."
      />
    )
  }

  return (
    <section className="space-y-3">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Panel title="Recorded Lectures">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((lec, i) => (
            <article
              key={lec.id || lec._id}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <div
                className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${gradients[i % gradients.length]}`}
              >
                <button
                  type="button"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#FF5E14] shadow-lg"
                >
                  <Play size={20} className="ml-0.5" />
                </button>
                {lec.duration ? (
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/50 px-2 py-0.5 text-[11px] text-white">
                    {lec.duration}
                  </span>
                ) : null}
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-[#008C95]">{lec.subject}</p>
                <h3 className="mt-1 text-sm font-semibold text-slate-900">{lec.title}</h3>
                <div className="mt-3">
                  <ProgressBar value={lec.progress || 0} label="Watch progress" color="teal" />
                </div>
                <div className="mt-3">
                  <PrimaryButton>
                    <Play size={14} />
                    Watch Now
                  </PrimaryButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  )
}
