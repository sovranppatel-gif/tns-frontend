import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Database,
  Download,
  HardDrive,
  Layers,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import {
  createBackup,
  deleteBackup,
  downloadBackup,
  getBackupStatus,
  listBackups,
  restoreBackup,
} from '../../../services/backupService.js'
import { formatDisplayDate } from '../../shared/DateInput.jsx'
import { DataTable, Modal, Panel, StatCard, StatusBadge } from '../shared/MasterAdminUI.jsx'
import { card, primaryBtn, secondaryBtn } from '../../../utils/masterAdminTheme.js'

const inputClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00A896]'

const SCOPE_COPY = {
  all: { title: 'Full database', hint: 'Every collection except OTPs. Use this before a major change.' },
  erp: { title: 'ERP core', hint: 'Students, admissions, fees, attendance, courses, faculty and staff.' },
  exams: { title: 'Exams', hint: 'Question bank, papers, schedules, attempts and results.' },
  cms: { title: 'Website CMS', hint: 'Public site content and settings only.' },
  crm: { title: 'Enquiries & leads', hint: 'CRM pipeline — does not touch student records.' },
}

function formatBytes(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatWhen(value) {
  if (!value) return '—'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return '—'
  return `${formatDisplayDate(dt)} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

function formatCount(n) {
  return Number(n || 0).toLocaleString('en-IN')
}

export default function BackupPage({ onNavigate }) {
  const [status, setStatus] = useState(null)
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [restoreRow, setRestoreRow] = useState(null)
  const [restoreText, setRestoreText] = useState('')
  const [includeUsers, setIncludeUsers] = useState(false)
  const [deleteRow, setDeleteRow] = useState(null)

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const [nextStatus, nextList] = await Promise.all([getBackupStatus(), listBackups()])
      setStatus(nextStatus)
      setBackups(nextList)
    } catch (err) {
      setError(err.message || 'Unable to load backups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const scopes = useMemo(() => {
    const fromApi = status?.scopes || []
    const ids = fromApi.length ? fromApi.map((s) => s.id) : Object.keys(SCOPE_COPY)
    return ids.map((id) => {
      const api = fromApi.find((s) => s.id === id)
      const copy = SCOPE_COPY[id] || {}
      return {
        id,
        title: copy.title || api?.label || id,
        hint: copy.hint || api?.hint || '',
      }
    })
  }, [status])

  const groupedCollections = useMemo(() => {
    const groups = new Map()
    for (const col of status?.collections || []) {
      const key = col.groupLabel || 'Other'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(col)
    }
    return [...groups.entries()]
  }, [status])

  const runCreate = async (scope) => {
    setBusy(`create:${scope}`)
    setError('')
    setNotice('')
    try {
      const backup = await createBackup(scope)
      setNotice(
        `${backup.scopeLabel || 'Backup'} ${backup.backupId} is ready — ${formatCount(backup.documentCount)} documents, ${formatBytes(backup.bytes)}.`,
      )
      await load({ silent: true })
    } catch (err) {
      setError(err.message || 'Unable to create backup')
    } finally {
      setBusy('')
    }
  }

  const runDownload = async (row) => {
    setBusy(`download:${row.backupId}`)
    setError('')
    setNotice('')
    try {
      const filename = await downloadBackup(row.backupId)
      setNotice(`Downloaded ${filename}`)
    } catch (err) {
      setError(err.message || 'Unable to download backup')
    } finally {
      setBusy('')
    }
  }

  const runDelete = async () => {
    if (!deleteRow) return
    setBusy(`delete:${deleteRow.backupId}`)
    setError('')
    setNotice('')
    try {
      await deleteBackup(deleteRow.backupId)
      setNotice(`Deleted ${deleteRow.backupId}`)
      setDeleteRow(null)
      await load({ silent: true })
    } catch (err) {
      setError(err.message || 'Unable to delete backup')
    } finally {
      setBusy('')
    }
  }

  const runRestore = async () => {
    if (!restoreRow) return
    setBusy(`restore:${restoreRow.backupId}`)
    setError('')
    setNotice('')
    try {
      const result = await restoreBackup(restoreRow.backupId, {
        confirm: restoreText.trim(),
        includeUsers,
      })
      setNotice(
        `Restored ${formatCount(result.documentCount)} documents across ${result.collectionCount} collections from ${result.backupId}.`,
      )
      setRestoreRow(null)
      setRestoreText('')
      setIncludeUsers(false)
      await load({ silent: true })
    } catch (err) {
      setError(err.message || 'Restore failed')
    } finally {
      setBusy('')
    }
  }

  const last = status?.lastBackup
  const creating = busy.startsWith('create:')

  const historyColumns = [
    { key: 'backupId', label: 'Backup' },
    { key: 'scopeLabel', label: 'Scope', render: (row) => row.scopeLabel || row.scope },
    { key: 'when', label: 'Created', render: (row) => formatWhen(row.createdAt) },
    { key: 'size', label: 'Size', render: (row) => formatBytes(row.bytes) },
    {
      key: 'docs',
      label: 'Documents',
      render: (row) => `${formatCount(row.documentCount)} / ${row.collectionCount} col.`,
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          <button
            type="button"
            className={secondaryBtn}
            disabled={Boolean(busy) || !row.fileExists}
            onClick={() => runDownload(row)}
          >
            <Download size={13} />
            {busy === `download:${row.backupId}` ? 'Saving…' : 'Download'}
          </button>
          <button
            type="button"
            className={secondaryBtn}
            disabled={Boolean(busy) || !row.fileExists}
            onClick={() => {
              setRestoreRow(row)
              setRestoreText('')
              setIncludeUsers(false)
              setError('')
            }}
          >
            <RotateCcw size={13} /> Restore
          </button>
          <button
            type="button"
            className={secondaryBtn}
            disabled={Boolean(busy)}
            onClick={() => setDeleteRow(row)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ]

  const historyRows = backups.map((row) => ({
    ...row,
    id: row.backupId,
  }))

  return (
    <section className="space-y-3">
      <div className={`${card} space-y-3 p-3`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-navy-900">Backup</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              MongoDB snapshots for disaster recovery — not CSV packs. Use Downloads when you need Excel or print files for
              office use.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondaryBtn} onClick={() => onNavigate?.('Downloads')}>
              Open downloads
            </button>
            <button type="button" className={secondaryBtn} onClick={() => load()} disabled={loading || Boolean(busy)}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          {status?.storageHint || 'Snapshots are stored on the server.'}
          {status?.database ? ` Database: ${status.database}.` : ''}
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Collections"
          value={loading ? '…' : formatCount(status?.totals?.collections)}
          hint="Live collections in Mongo (OTPs excluded from dumps)"
        />
        <StatCard
          label="Documents"
          value={loading ? '…' : formatCount(status?.totals?.documents)}
          hint="Current database size"
        />
        <StatCard
          label="Last backup"
          value={last ? last.backupId : loading ? '…' : 'None yet'}
          hint={last ? `${formatWhen(last.createdAt)} · ${formatBytes(last.bytes)}` : 'Create a full snapshot below'}
        />
        <StatCard
          label="Kept on disk"
          value={loading ? '…' : formatCount(backups.filter((b) => b.fileExists).length)}
          hint={`${formatCount(backups.length)} in history`}
        />
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
        <p>
          Restore replaces live data in the collections that are inside that file. Login accounts are skipped unless you
          tick the extra box. Type <span className="font-semibold">RESTORE</span> to confirm — this cannot be undone except
          by another backup.
        </p>
      </div>

      <Panel
        title="Create snapshot"
        action={<p className="max-w-md text-right text-xs text-slate-500">Pick a scope. Full backup is safest before a restore test or a big import.</p>}
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {scopes.map((scope) => {
            const active = busy === `create:${scope.id}`
            return (
              <button
                key={scope.id}
                type="button"
                disabled={Boolean(busy)}
                onClick={() => runCreate(scope.id)}
                className={`${card} flex h-full flex-col items-start gap-2 p-3 text-left transition hover:border-[#00A896] disabled:opacity-60`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#00A896]/10 text-[#008C95]">
                  {scope.id === 'all' ? <Database size={16} /> : <HardDrive size={16} />}
                </span>
                <span className="text-sm font-semibold text-navy-900">{scope.title}</span>
                <span className="text-[11px] leading-4 text-slate-500">{scope.hint}</span>
                <span className="mt-auto text-xs font-semibold text-[#008C95]">
                  {active ? 'Writing snapshot…' : creating ? 'Waiting…' : 'Create backup'}
                </span>
              </button>
            )
          })}
        </div>
      </Panel>

      <Panel
        title="Live collections"
        action={<p className="max-w-md text-right text-xs text-slate-500">What a full backup would capture right now.</p>}
      >
        {loading ? (
          <p className="text-sm text-slate-500">Loading collection counts…</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {groupedCollections.map(([group, rows]) => (
              <div key={group} className="overflow-hidden rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <Layers size={14} className="text-[#008C95]" />
                  <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">{group}</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {rows.map((col) => (
                    <li key={col.name} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                      <span className="min-w-0 truncate text-slate-700">
                        {col.label}
                        {col.skipped ? <span className="ml-1 text-[11px] text-slate-400">(not dumped)</span> : null}
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-500">{formatCount(col.count)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Backup history"
        action={<p className="max-w-md text-right text-xs text-slate-500">Download the JSON file, restore it, or delete it from the server.</p>}
      >
        <DataTable
          columns={historyColumns}
          rows={historyRows}
          emptyTitle={loading ? 'Loading backups…' : 'No backups yet'}
          emptyDescription="Create a full database snapshot above. Files stay on this server, not in the browser."
        />
      </Panel>

      <Modal
        open={Boolean(restoreRow)}
        title="Restore live database"
        onClose={() => {
          if (!busy) {
            setRestoreRow(null)
            setRestoreText('')
            setIncludeUsers(false)
          }
        }}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className={secondaryBtn} disabled={Boolean(busy)} onClick={() => setRestoreRow(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={primaryBtn}
              disabled={Boolean(busy) || restoreText.trim() !== 'RESTORE'}
              onClick={runRestore}
            >
              <RotateCcw size={14} />
              {busy.startsWith('restore:') ? 'Restoring…' : 'Restore now'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            This will overwrite live Mongo collections that are inside{' '}
            <span className="font-semibold">{restoreRow?.backupId}</span> ({restoreRow?.scopeLabel},{' '}
            {formatCount(restoreRow?.documentCount)} documents). Collections not in that file are left alone.
          </p>
          <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={includeUsers}
              onChange={(e) => setIncludeUsers(e.target.checked)}
            />
            Also restore login accounts (users). Leave this off unless you are recovering from a total loss.
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Type RESTORE to confirm</span>
            <input
              value={restoreText}
              onChange={(e) => setRestoreText(e.target.value)}
              className={inputClass}
              placeholder="RESTORE"
              autoComplete="off"
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteRow)}
        title="Delete backup"
        onClose={() => {
          if (!busy) setDeleteRow(null)
        }}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className={secondaryBtn} disabled={Boolean(busy)} onClick={() => setDeleteRow(null)}>
              Cancel
            </button>
            <button type="button" className={primaryBtn} disabled={Boolean(busy)} onClick={runDelete}>
              <Trash2 size={14} />
              {busy.startsWith('delete:') ? 'Deleting…' : 'Delete file'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          Remove <span className="font-semibold">{deleteRow?.backupId}</span> from the server disk. You will not be able to
          restore it after this.
        </p>
      </Modal>
    </section>
  )
}
