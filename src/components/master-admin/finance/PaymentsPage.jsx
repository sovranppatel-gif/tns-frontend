import { useCallback, useEffect, useState } from 'react'
import {
  getCashFlow,
  getPayment,
  getPayments,
  getPaymentsDashboard,
  refundPayment,
  syncFeePayments,
} from '../../../services/financeService.js'
import { printPaymentReceipt } from '../../../utils/printFinance.js'
import {
  DataTable,
  Modal,
  PageToolbar,
  Pagination,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SkeletonBlock,
  StatCard,
  StatusBadge,
  Tabs,
  downloadCsv,
  formatINR,
} from '../shared/MasterAdminUI.jsx'
import { DonutChart, GroupedBarChart } from '../shared/MasterAdminCharts.jsx'
import { ActionBtn, DateRangeFilters, ErrorBanner, Field, PAYMENT_METHODS, Toast, inputClass, useToast } from './financeUi.jsx'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'list', label: 'Transactions' },
  { id: 'cash', label: 'Cash Flow' },
]

export default function PaymentsPage() {
  const [tab, setTab] = useState('list')
  const [stats, setStats] = useState({})
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [cash, setCash] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useToast()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [method, setMethod] = useState('')
  const [status, setStatus] = useState('')
  const [direction, setDirection] = useState('')
  const [preset, setPreset] = useState('month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [detail, setDetail] = useState(null)
  const [refundOpen, setRefundOpen] = useState(null)
  const [refundForm, setRefundForm] = useState({ amount: '', method: 'Cash', reason: '' })

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const reload = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const [dash, list, flow] = await Promise.all([
        getPaymentsDashboard({ preset, from, to }),
        getPayments({
          page,
          limit: 10,
          search: debounced,
          sourceType,
          method,
          status,
          direction,
          preset: from || to ? '' : preset,
          from,
          to,
        }),
        getCashFlow({ preset, from, to }),
      ])
      setStats(dash)
      setRows(list.rows)
      setPagination(list.pagination)
      setCash(flow)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [debounced, sourceType, method, status, direction, preset, from, to])

  useEffect(() => { reload(1) }, [reload])

  const columns = [
    { key: 'paymentId', label: 'Txn ID' },
    { key: 'dateLabel', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'sourceType', label: 'Source' },
    { key: 'partyName', label: 'Party' },
    { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
    { key: 'method', label: 'Method' },
    { key: 'account', label: 'Account' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'referenceNumber', label: 'Reference' },
    {
      key: '_actions',
      label: '',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <ActionBtn onClick={async () => setDetail(await getPayment(row.paymentId))}>View</ActionBtn>
          <ActionBtn onClick={() => printPaymentReceipt(row)}>Receipt</ActionBtn>
          {row.direction === 'IN' && row.status === 'Completed' ? (
            <ActionBtn tone="danger" onClick={() => { setRefundOpen(row); setRefundForm({ amount: String(row.amount), method: row.method, reason: '' }) }}>Refund</ActionBtn>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <section className="space-y-3">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <ErrorBanner error={error} />
      <Toast text={toast} />

      {tab === 'dashboard' ? (
        <>
          {loading ? <SkeletonBlock className="h-28" /> : (
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
              <StatCard label="Received" value={formatINR(stats.totalReceived)} />
              <StatCard label="Paid out" value={formatINR(stats.totalPaid)} />
              <StatCard label="Cash" value={formatINR(stats.cashTransactions)} />
              <StatCard label="Bank" value={formatINR(stats.bankTransactions)} />
              <StatCard label="UPI" value={formatINR(stats.upiTransactions)} />
              <StatCard label="Pending" value={stats.pendingPayments || 0} />
              <StatCard label="Failed / Cancelled" value={stats.failedCancelled || 0} />
            </div>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Payment method"><DonutChart data={stats.methodDistribution || []} /></Panel>
            <Panel title="Monthly cash flow">
              <GroupedBarChart
                data={stats.monthlyCashFlow || []}
                series={[{ key: 'inflow', label: 'In' }, { key: 'outflow', label: 'Out' }]}
                formatter={(v) => formatINR(v)}
              />
            </Panel>
          </div>
        </>
      ) : null}

      {tab === 'list' ? (
        <>
          <PageToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search txn ID, student, employee, reference…"
            onExportCsv={() => downloadCsv('payments.csv', [
              { key: 'paymentId', label: 'ID' }, { key: 'dateLabel', label: 'Date' }, { key: 'type', label: 'Type' },
              { key: 'sourceType', label: 'Source' }, { key: 'partyName', label: 'Party' }, { key: 'amount', label: 'Amount' },
              { key: 'method', label: 'Method' }, { key: 'status', label: 'Status' },
            ], rows)}
            extraActions={
              <>
                <select value={direction} onChange={(e) => setDirection(e.target.value)} className={`${inputClass} sm:w-32`}>
                  <option value="">In & Out</option>
                  <option value="IN">Incoming</option>
                  <option value="OUT">Outgoing</option>
                </select>
                <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className={`${inputClass} sm:w-36`}>
                  <option value="">All sources</option>
                  {['FEE', 'INCOME', 'EXPENSE', 'PAYROLL', 'REFUND', 'ADVANCE', 'LOAN'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${inputClass} sm:w-36`}>
                  <option value="">All methods</option>
                  {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} sm:w-36`}>
                  <option value="">All statuses</option>
                  {['Completed', 'Pending', 'Partial', 'Failed', 'Cancelled', 'Refunded'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <DateRangeFilters preset={preset} from={from} to={to} onPreset={setPreset} onFrom={setFrom} onTo={setTo} />
                <SecondaryButton onClick={() => syncFeePayments().then((d) => { setToast(`Synced ${d.created || 0} fee payments`); reload(1) })}>Sync fees</SecondaryButton>
              </>
            }
          />
          {loading ? <SkeletonBlock className="h-64" /> : (
            <Panel>
              <DataTable columns={columns} rows={rows} emptyTitle="No payment transactions" />
              <Pagination page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPageChange={reload} />
            </Panel>
          )}
        </>
      ) : null}

      {tab === 'cash' && cash ? (
        <Panel title="Cash flow">
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <StatCard label="Opening" value={formatINR(cash.totals?.openingBalance)} />
            <StatCard label="Cash in" value={formatINR(cash.totals?.cashIn)} />
            <StatCard label="Cash out" value={formatINR(cash.totals?.cashOut)} />
            <StatCard label="Closing" value={formatINR(cash.totals?.closingBalance)} />
          </div>
          <DataTable
            columns={[
              { key: 'name', label: 'Account' },
              { key: 'type', label: 'Type' },
              { key: 'openingBalance', label: 'Opening', render: (r) => formatINR(r.openingBalance) },
              { key: 'cashIn', label: 'In', render: (r) => formatINR(r.cashIn) },
              { key: 'cashOut', label: 'Out', render: (r) => formatINR(r.cashOut) },
              { key: 'closingBalance', label: 'Closing', render: (r) => formatINR(r.closingBalance) },
            ]}
            rows={cash.rows || []}
          />
        </Panel>
      ) : null}

      <Modal open={Boolean(detail)} title={detail ? `Payment ${detail.paymentId}` : ''} onClose={() => setDetail(null)}>
        {detail ? (
          <div className="space-y-2 text-sm">
            <p>{detail.partyName} · {formatINR(detail.amount)}</p>
            <p className="text-slate-500">{detail.sourceType} / {detail.sourceId}</p>
            <p>{detail.method} · {detail.financialAccountCode} · <StatusBadge status={detail.status} /></p>
            <p className="text-slate-500">{detail.notes}</p>
            <PrimaryButton onClick={() => printPaymentReceipt(detail)}>Print receipt</PrimaryButton>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(refundOpen)} title="Refund payment" onClose={() => setRefundOpen(null)} footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => setRefundOpen(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={async () => {
            try {
              await refundPayment(refundOpen.paymentId, refundForm)
              setRefundOpen(null)
              setToast('Refund recorded')
              reload(pagination.page)
            } catch (err) { setError(err.message) }
          }}>Refund</PrimaryButton>
        </div>
      }>
        <div className="grid gap-3">
          <Field label="Amount"><input type="number" min="0" value={refundForm.amount} onChange={(e) => setRefundForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} /></Field>
          <Field label="Method">
            <select value={refundForm.method} onChange={(e) => setRefundForm((f) => ({ ...f, method: e.target.value }))} className={inputClass}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Reason"><input value={refundForm.reason} onChange={(e) => setRefundForm((f) => ({ ...f, reason: e.target.value }))} className={inputClass} /></Field>
        </div>
      </Modal>
    </section>
  )
}
