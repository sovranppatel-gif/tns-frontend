import { MessageSquare } from 'lucide-react'
import { useStudentLearning } from '../../../hooks/useStudentLearning.js'
import { EmptyState, SkeletonBlock } from '../shared/StudentUI.jsx'

export default function MessagesPage() {
  const { rows, loading, error } = useStudentLearning('messages')

  if (loading) return <SkeletonBlock className="h-48" />

  return (
    <section className="space-y-3">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <EmptyState
        icon={MessageSquare}
        title={rows.length ? `${rows.length} conversations` : 'Inbox is empty'}
        description="Trainer chat will go live with the messages module. For now, use Support to reach the institute."
      />
    </section>
  )
}
