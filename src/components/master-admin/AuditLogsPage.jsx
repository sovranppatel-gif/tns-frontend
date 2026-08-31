import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { fetchActivityLogs } from '../../services/activityLogService.js'
import {
  DataTable,
  PageToolbar,
  Panel,
  StatCard,
  StatusBadge,
  downloadCsv,
} from './shared/MasterAdminUI.jsx'
import { card } from '../../utils/masterAdminTheme.js'

function formatTime(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

export default function AuditLogsPage() {
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({ total: 0, today: 0, sections: 0, uniqueActions: 0 })
  const [sections, setSections] = useState([])
  const [actions, setActions] = useState([])
  const [search, setSearch] = useState('')
  const [section, setSection] = useState('')
  const [action, setAction] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchActivityLogs({ page: 1, limit: 100, section, action, search })
      setRows(Array.isArray(data.rows) ? data.rows : [])
      setStats(data.stats || { total: 0, today: 0, sections: 0, uniqueActions: 0 })
      setSections(data.filters?.sections || [])
      setActions(data.filters?.actions || [])
    } catch (err) {
      setError(err.message || 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [section, action, search])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const columns = useMemo(
    () => [
      {
        key: 'createdAt',
        label: 'Time',
        render: (row) => <span className="whitespace-nowrap text-xs text-slate-600">{formatTime(row.createdAt)}</span>,
      },
      {
        key: 'section',
        label: 'Section',
        render: (row) => (
          <span className="rounded-md bg-navy-900/10 px-2 py-0.5 text-xs font-semibold text-navy-800">
            {row.section}
          </span>
        ),
      },
      {
        key: 'action',
        label: 'Action',
        render: (row) => <StatusBadge status={row.action} />,
      },
      {
        key: 'actor',
        label: 'Actor',
        render: (row) => <span className="text-sm text-slate-800">{row.actor || '—'}</span>,
      },
      {
        key: 'message',
        label: 'Message',
        render: (row) => <span className="text-sm text-slate-700">{row.message || '—'}</span>,
      },
      {
        key: 'ip',
        label: 'IP',
        render: (row) => <span className="font-mono text-xs text-slate-500">{row.ip || '—'}</span>,
      },
    ],
    [],
  )

  return (
    <section className="space-y-3">
      <div className={`${card} flex flex-wrap items-center justify-between gap-2 p-3`}>
        <p className="text-sm text-slate-600">Every login, logout, create, update and delete is stored on tns-server.</p>
        <button
          type="button"
          onClick={loadLogs}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total logs" value={String(stats.total || 0)} />
        <StatCard label="Today" value={String(stats.today || 0)} />
        <StatCard label="Sections" value={String(stats.sections || sections.length || 0)} />
        <StatCard label="Actions" value={String(stats.uniqueActions || actions.length || 0)} />
      </div>

      <PageToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search actor, message, section…"
        filters={sections}
        filterValue={section}
        onFilter={setSection}
        onExportCsv={() =>
          downloadCsv(
            'activity-logs.csv',
            [
              { key: 'time', label: 'Time' },
              { key: 'section', label: 'Section' },
              { key: 'action', label: 'Action' },
              { key: 'actor', label: 'Actor' },
              { key: 'message', label: 'Message' },
              { key: 'ip', label: 'IP' },
              { key: 'path', label: 'Path' },
            ],
            rows.map((r) => ({
              time: formatTime(r.createdAt),
              section: r.section,
              action: r.action,
              actor: r.actor,
              message: r.message,
              ip: r.ip,
              path: r.path,
            })),
          )
        }
      />

      <select
        value={action}
        onChange={(e) => setAction(e.target.value)}
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
      >
        <option value="">All actions</option>
        {actions.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {error ? (
        <Panel title="Error">
          <p className="text-sm text-rose-600">{error}</p>
        </Panel>
      ) : null}

      <Panel title="Admin activity">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading logs…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            emptyTitle="No activity yet"
            emptyDescription="Login, logout, create, update or delete — each action appears here."
          />
        )}
      </Panel>
    </section>
  )
}
