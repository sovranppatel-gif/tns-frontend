import { Bell, CheckCheck } from 'lucide-react'
import { Panel, PrimaryButton } from '../shared/StudentUI.jsx'

export default function NotificationsPage({
  items = [],
  onMarkAllRead,
  onMarkRead,
  onOpen,
}) {
  const unread = items.filter((n) => !n.read)

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{unread.length}</span> unread notifications
        </p>
        <PrimaryButton onClick={onMarkAllRead} disabled={unread.length === 0}>
          <CheckCheck size={14} />
          Mark All Read
        </PrimaryButton>
      </div>

      <Panel title="Unread Notifications">
        {unread.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">You&apos;re all caught up.</p>
        ) : (
          <ul className="space-y-2">
            {unread.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => (onOpen ? onOpen(n) : onMarkRead?.(n.id))}
                  className="flex w-full gap-3 rounded-lg border border-[#FF5E14]/15 bg-[#FFF0E6]/40 px-3 py-3 text-left transition hover:border-[#FF5E14]/35"
                >
                  <Bell size={16} className="mt-0.5 shrink-0 text-[#FF5E14]" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    {n.body ? (
                      <p className="mt-0.5 text-xs text-slate-600">{n.body}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-slate-400">{n.time}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Recent Notifications">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No notifications yet. Admission updates from TNS ITI & Computer will appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpen) onOpen(n)
                    else if (!n.read) onMarkRead?.(n.id)
                  }}
                  className={`flex w-full gap-3 rounded-lg border px-3 py-3 text-left transition ${
                    n.read
                      ? 'border-slate-100 bg-slate-50'
                      : 'border-[#00A896]/20 bg-white hover:border-[#00A896]/40'
                  }`}
                >
                  <Bell
                    size={16}
                    className={`mt-0.5 shrink-0 ${n.read ? 'text-slate-300' : 'text-[#008C95]'}`}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm ${
                        n.read ? 'text-slate-600' : 'font-medium text-slate-800'
                      }`}
                    >
                      {n.title}
                    </p>
                    {n.body ? (
                      <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-slate-400">{n.time}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </section>
  )
}
