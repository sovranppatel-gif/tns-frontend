import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet, FileText, Plus, Search, X } from 'lucide-react'
import { primaryBtn, secondaryBtn, card } from '../../../utils/masterAdminTheme.js'

export {
  StatCard,
  Panel,
  ProgressBar,
  StatusBadge,
  EmptyState,
  SkeletonBlock,
  PrimaryButton,
  SecondaryButton,
  SearchInput,
  formatINR,
} from '../../students/shared/StudentUI.jsx'

export function PageToolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  filters = [],
  filterValue,
  onFilter,
  onAdd,
  addLabel = 'Add New',
  onExportCsv,
  onExportExcel,
  onExportPdf,
  extraActions = null,
}) {
  return (
    <div className={`${card} finance-toolbar flex flex-col gap-2 p-2.5`}>
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex h-10 w-full min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 sm:max-w-xs">
          <Search size={15} className="shrink-0 text-[#FF5E14]" />
          <input
            value={search}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full min-w-0 bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>
        {filters.length > 0 ? (
          <select
            value={filterValue || ''}
            onChange={(e) => onFilter?.(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#00A896] sm:w-auto"
          >
            <option value="">All</option>
            {filters.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2">
        {extraActions}
        {onExportCsv ? (
          <button type="button" onClick={onExportCsv} className={`${secondaryBtn} flex-1 sm:flex-none`}>
            <Download size={14} /> <span className="sm:inline">CSV</span>
          </button>
        ) : null}
        {onExportExcel ? (
          <button type="button" onClick={onExportExcel} className={`${secondaryBtn} flex-1 sm:flex-none`}>
            <FileSpreadsheet size={14} /> <span className="sm:inline">Excel</span>
          </button>
        ) : null}
        {onExportPdf ? (
          <button type="button" onClick={onExportPdf} className={`${secondaryBtn} flex-1 sm:flex-none`}>
            <FileText size={14} /> <span className="sm:inline">PDF</span>
          </button>
        ) : null}
        {onAdd ? (
          <button type="button" onClick={onAdd} className={`${primaryBtn} w-full sm:w-auto`}>
            <Plus size={15} /> {addLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function DataTable({
  columns,
  rows,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting search or filters.',
  onRowClick,
  selectedRowId,
  wrap = false,
}) {
  if (!rows?.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center">
        <p className="text-sm font-semibold text-slate-800">{emptyTitle}</p>
        <p className="mt-1 text-xs text-slate-500">{emptyDescription}</p>
      </div>
    )
  }

  const dataColumns = columns.filter((col) => col.key !== '_actions')
  const actionsCol = columns.find((col) => col.key === '_actions')
  const clickable = typeof onRowClick === 'function'
  const cellWrap = wrap
    ? 'min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] align-top'
    : 'whitespace-nowrap'
  const headWrap = wrap
    ? 'min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]'
    : 'whitespace-nowrap'

  const isSelected = (row) => {
    if (selectedRowId == null || selectedRowId === '') return false
    return String(row.id || row._id || row.feeId || '') === String(selectedRowId)
  }

  return (
    <>
      {/* Mobile / tablet card list */}
      <div className="space-y-3 lg:hidden">
        {rows.map((row, idx) => (
          <article
            key={row.id || row._id || idx}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? () => onRowClick(row) : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick(row)
                    }
                  }
                : undefined
            }
            className={`min-w-0 overflow-hidden rounded-lg border p-3 transition ${
              isSelected(row)
                ? 'border-[#008C95] bg-[#008C95]/5 ring-1 ring-[#008C95]/30'
                : 'border-slate-200 bg-slate-50/60'
            } ${clickable ? 'cursor-pointer hover:border-[#008C95]/40' : ''}`}
          >
            <div className="space-y-3">
              {dataColumns.map((col) => (
                <div key={col.key} className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {col.label}
                  </p>
                  <div className="mt-1 min-w-0 w-full overflow-hidden text-sm font-medium text-slate-800">
                    {col.render ? col.render(row) : row[col.key] || '—'}
                  </div>
                </div>
              ))}
            </div>
            {actionsCol?.render ? (
              <div
                className="mt-3 flex min-w-0 flex-wrap items-center gap-2 border-t border-slate-200 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                {actionsCol.render(row)}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden min-w-0 overflow-x-auto lg:block">
        <table className={`w-full text-left text-sm ${wrap ? 'table-fixed' : 'min-w-[1080px]'}`}>
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${headWrap} px-3 py-3 font-medium ${col.widthClass || ''}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id || row._id || idx}
                onClick={clickable ? () => onRowClick(row) : undefined}
                className={`border-b border-slate-100 transition ${
                  clickable ? 'cursor-pointer' : ''
                } ${
                  isSelected(row)
                    ? 'bg-[#008C95]/8 hover:bg-[#008C95]/12'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${cellWrap} px-3 py-3 text-slate-700 ${col.widthClass || ''}`}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={col.key === '_actions' ? (e) => e.stopPropagation() : undefined}
                  >
                    {col.render ? (
                      col.render(row)
                    ) : (
                      <span className={wrap ? 'block min-w-0 break-words [overflow-wrap:anywhere]' : undefined}>
                        {row[col.key]}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function Pagination({ page, pageSize, total, onPageChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
      <p>
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium disabled:opacity-40"
        >
          Prev
        </button>
        <span className="font-semibold text-slate-700">
          {page} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function Modal({ open, title, onClose, children, footer, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
      <button type="button" aria-label="Close modal" className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-lg bg-white shadow-2xl sm:rounded-lg ${
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-[#FF5E14]"
          >
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto px-3 py-3">{children}</div>
        {footer ? <div className="border-t border-slate-100 px-3 py-2.5">{footer}</div> : null}
      </div>
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
      {tabs.map((tab) => {
        const id = typeof tab === 'string' ? tab : tab.id
        const label = typeof tab === 'string' ? tab : tab.label
        const isActive = active === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
              isActive
                ? 'bg-gradient-to-r from-[#FF5E14] to-[#008C95] text-white shadow'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function useClientTable(rows, { searchKeys = [], pageSize = 8, filterKey = 'status' } = {}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState('asc')

  const filtered = useMemo(() => {
    let list = Array.isArray(rows) ? [...rows] : []
    const q = search.trim().toLowerCase()
    if (q && searchKeys.length) {
      list = list.filter((row) =>
        searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q)),
      )
    }
    if (filter) {
      list = list.filter((row) => String(row[filterKey] ?? '') === filter)
    }
    if (sortKey) {
      list.sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        if (av === bv) return 0
        if (av == null) return 1
        if (bv == null) return -1
        const cmp = av > bv ? 1 : -1
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return list
  }, [rows, search, searchKeys, filter, filterKey, sortKey, sortDir])

  const total = filtered.length
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  return {
    search,
    setSearch: (v) => {
      setSearch(v)
      setPage(1)
    },
    filter,
    setFilter: (v) => {
      setFilter(v)
      setPage(1)
    },
    page,
    setPage,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    pageRows,
    total,
    filtered,
    pageSize,
  }
}

export function downloadCsv(filename, columns, rows) {
  const header = columns.map((c) => c.label).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = row[c.key] ?? ''
          const str = String(val).replaceAll('"', '""')
          return `"${str}"`
        })
        .join(','),
    )
    .join('\n')
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function GlassStat({ label, value, icon: Icon, tone = 'orange' }) {
  const toneClass =
    tone === 'teal'
      ? 'from-[#008C95]/20 to-[#00A896]/5 ring-[#00A896]/30'
      : tone === 'green'
        ? 'from-emerald-500/20 to-teal-500/5 ring-emerald-400/30'
        : 'from-[#FF5E14]/20 to-[#FF7A00]/5 ring-[#FF5E14]/30'

  return (
    <article className={`rounded-lg bg-gradient-to-br p-3 ring-1 backdrop-blur ${toneClass}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {Icon ? <Icon size={15} className="text-[#FF5E14]" /> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
    </article>
  )
}
