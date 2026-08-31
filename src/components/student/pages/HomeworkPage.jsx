import { CheckCircle2, Circle, NotebookPen } from 'lucide-react'
import { useStudentLearning } from '../../../hooks/useStudentLearning.js'
import { EmptyState, Panel, SkeletonBlock, StatusBadge } from '../shared/StudentUI.jsx'

export default function HomeworkPage() {
  const { rows, loading, error } = useStudentLearning('homework')

  if (loading) return <SkeletonBlock className="h-48" />

  return (
    <section className="space-y-3">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {rows.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No homework assigned"
          description="Daily homework from your trainer will show here with due dates and priority."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((hw) => (
            <article
              key={hw.id || hw._id}
              className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {hw.completed ? (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#00A896]" />
                  ) : (
                    <Circle size={18} className="mt-0.5 shrink-0 text-slate-300" />
                  )}
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{hw.title}</h3>
                    <p className="mt-0.5 text-xs text-[#008C95]">{hw.subject}</p>
                  </div>
                </div>
                <StatusBadge status={hw.priority || 'Medium'} />
              </div>
              {hw.description ? <p className="mt-3 text-sm text-slate-600">{hw.description}</p> : null}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>Due: {hw.dueDate || '—'}</span>
                <StatusBadge status={hw.completed ? 'Completed' : 'Pending'} />
              </div>
            </article>
          ))}
        </div>
      )}
      <Panel title="Tips">
        <p className="text-sm text-slate-600">
          Homework published by faculty for your batch will sync here automatically.
        </p>
      </Panel>
    </section>
  )
}
