import { Video } from 'lucide-react'
import { useStudentLearning } from '../../../hooks/useStudentLearning.js'
import { EmptyState, Panel, PrimaryButton, SkeletonBlock, StatusBadge } from '../shared/StudentUI.jsx'

function ClassList({ items, showJoin }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">None right now.</p>
  }
  return (
    <div className="space-y-3">
      {items.map((c) => (
        <div
          key={c.id || c._id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF5E14]/10 text-[#FF5E14]">
              <Video size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{c.title}</p>
              <p className="text-xs text-slate-500">
                {[c.trainer, c.time].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {c.status ? <StatusBadge status={c.status} /> : null}
            {showJoin && c.status !== 'Completed' && c.joinUrl ? (
              <PrimaryButton>
                <Video size={14} />
                Join
              </PrimaryButton>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LiveClassesPage() {
  const { rows, loading, error } = useStudentLearning('live-classes')
  const today = rows.filter((c) => c.when === 'today' || c.status === 'Live')
  const upcoming = rows.filter((c) => c.when === 'upcoming' || c.status === 'Upcoming')
  const previous = rows.filter((c) => c.when === 'previous' || c.status === 'Completed')

  if (loading) return <SkeletonBlock className="h-48" />

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Video}
        title="No live classes scheduled"
        description="Join links for today and upcoming sessions will appear here when the timetable module goes live."
      />
    )
  }

  return (
    <section className="space-y-3">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Panel title="Today's Live Classes">
        <ClassList items={today} showJoin />
      </Panel>
      <Panel title="Upcoming Live Classes">
        <ClassList items={upcoming} showJoin />
      </Panel>
      <Panel title="Previous Sessions">
        <ClassList items={previous} showJoin={false} />
      </Panel>
    </section>
  )
}
