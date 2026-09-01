import { useCallback, useEffect, useState } from 'react'
import {
  adjustPayroll,
  approvePayroll,
  generatePayroll,
  getFinancialBooks,
  getPayrollDashboard,
  getPayrollItems,
  getPayslip,
  payPayroll,
  setPayrollUnits,
} from '../../../services/financeService.js'
import { printPayslip } from '../../../utils/printFinance.js'
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
import { ActionBtn, ErrorBanner, Field, PAYMENT_METHODS, Toast, inputClass, useToast } from './financeUi.jsx'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'items', label: 'Payroll' },
  { id: 'generate', label: 'Generate' },
]

const ADJUST_TYPES = ['Bonus', 'Incentive', 'Overtime', 'Reimbursement', 'Other Earnings', 'Other Deductions', 'Leave Deduction']
const UNIT_TYPES = new Set(['Per Class', 'Per Lecture', 'Per Hour', 'Per Day', 'Daily Wage', 'Hourly Wage'])

export default function PayrollPage() {
  const now = new Date()
  const [tab, setTab] = useState('items')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [employeeType, setEmployeeType] = useState('ALL')
  const [stats, setStats] = useState({})
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useToast()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('')
  const [generating, setGenerating] = useState(false)
  const [skipped, setSkipped] = useState([])
  const [payOpen, setPayOpen] = useState(null)
  const [books, setBooks] = useState([])
  const [payForm, setPayForm] = useState({ amount: '', method: 'Bank Transfer', financialAccountCode: 'BANK' })
  const [adjOpen, setAdjOpen] = useState(null)
  const [adjForm, setAdjForm] = useState({ type: 'Bonus', amount: '', reason: '' })
  const [unitsOpen, setUnitsOpen] = useState(null)
  const [unitsWorked, setUnitsWorked] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    getFinancialBooks().then(setBooks).catch(() => {})
  }, [])

  const reload = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const [dash, list] = await Promise.all([
        getPayrollDashboard({ month, year, employeeType }),
        getPayrollItems({ page, limit: 10, month, year, employeeType: employeeType === 'ALL' ? '' : employeeType, search: debounced, status }),
      ])
      setStats(dash)
      setRows(list.rows)
      setPagination(list.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [month, year, employeeType, debounced, status])

  useEffect(() => { reload(1) }, [reload])

  const runGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const data = await generatePayroll({ month, year, employeeType })
      setSkipped(data.skipped || [])
      setToast(`Generated ${data.createdCount || 0} payroll items`)
      setTab('items')
      reload(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const columns = [
    { key: 'employee', label: 'Employee' },
    { key: 'employeeType', label: 'Type' },
    { key: 'period', label: 'Month' },
    { key: 'basicSalary', label: 'Basic', render: (r) => formatINR(r.basicSalary) },
    { key: 'allowances', label: 'Allowances', render: (r) => formatINR(r.allowances) },
    { key: 'incentives', label: 'Incentives', render: (r) => formatINR(r.incentives) },
    { key: 'deductions', label: 'Deductions', render: (r) => formatINR(r.deductions) },
    { key: 'advanceRecovery', label: 'Advance', render: (r) => formatINR(r.advanceRecovery) },
    { key: 'netPayable', label: 'Net', render: (r) => formatINR(r.netPayable) },
    { key: 'paidAmount', label: 'Paid', render: (r) => formatINR(r.paidAmount) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: '_actions',
      label: '',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <ActionBtn onClick={async () => printPayslip(await getPayslip(row.itemId))}>Payslip</ActionBtn>
          {['Generated', 'Reviewed', 'Draft'].includes(row.status) ? (
            <ActionBtn tone="success" onClick={() => approvePayroll(row.itemId).then(() => { setToast('Approved'); reload(pagination.page) })}>Approve</ActionBtn>
          ) : null}
          {row.outstanding > 0 && row.status !== 'Cancelled' ? (
            <ActionBtn onClick={() => { setPayOpen(row); setPayForm({ amount: String(row.outstanding), method: 'Bank Transfer', financialAccountCode: 'BANK' }) }}>Pay</ActionBtn>
          ) : null}
          {row.status !== 'Paid' && row.status !== 'Cancelled' ? (
            <ActionBtn onClick={() => { setAdjOpen(row); setAdjForm({ type: 'Bonus', amount: '', reason: '' }) }}>Adjust</ActionBtn>
          ) : null}
          {UNIT_TYPES.has(row.salaryType) && row.status !== 'Paid' ? (
            <ActionBtn onClick={() => { setUnitsOpen(row); setUnitsWorked(String(row.unitsWorked || '')) }}>Units</ActionBtn>
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

      <div className="flex flex-wrap gap-2">
        <Field label="Month">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={`${inputClass} w-36`}>
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('en-IN', { month: 'long' })}</option>)}
          </select>
        </Field>
        <Field label="Year">
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={`${inputClass} w-28`} />
        </Field>
        <Field label="Employees">
          <select value={employeeType} onChange={(e) => setEmployeeType(e.target.value)} className={`${inputClass} w-36`}>
            <option value="ALL">All</option>
            <option value="FACULTY">Faculty</option>
            <option value="STAFF">Staff</option>
          </select>
        </Field>
      </div>

      {tab === 'dashboard' ? (
        loading ? <SkeletonBlock className="h-28" /> : (
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Payroll Month" value={stats.currentPayrollMonth || '—'} />
            <StatCard label="Employees" value={stats.totalEmployees || 0} />
            <StatCard label="Processed" value={stats.processedEmployees || 0} />
            <StatCard label="Pending" value={stats.pendingEmployees || 0} />
            <StatCard label="Gross" value={formatINR(stats.totalGrossSalary)} />
            <StatCard label="Deductions" value={formatINR(stats.totalDeductions)} />
            <StatCard label="Net Payable" value={formatINR(stats.totalNetPayable)} />
            <StatCard label="Paid" value={formatINR(stats.totalPaid)} />
            <StatCard label="Pending Payments" value={formatINR(stats.pendingSalaryPayments)} />
          </div>
        )
      ) : null}

      {tab === 'items' ? (
        <>
          <PageToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search employee, ID…"
            onExportCsv={() => downloadCsv('payroll.csv', [
              { key: 'employee', label: 'Employee' }, { key: 'employeeType', label: 'Type' }, { key: 'period', label: 'Month' },
              { key: 'netPayable', label: 'Net' }, { key: 'paidAmount', label: 'Paid' }, { key: 'status', label: 'Status' },
            ], rows)}
            extraActions={
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} sm:w-40`}>
                <option value="">All statuses</option>
                {['Generated', 'Approved', 'Partially Paid', 'Paid', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
              </select>
            }
          />
          {loading ? <SkeletonBlock className="h-64" /> : (
            <Panel>
              <DataTable columns={columns} rows={rows} emptyTitle="No payroll for this month" emptyDescription="Generate payroll from the Generate tab." />
              <Pagination page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPageChange={reload} />
            </Panel>
          )}
        </>
      ) : null}

      {tab === 'generate' ? (
        <Panel title="Generate payroll">
          <p className="mb-3 text-sm text-slate-600">
            Uses active salary structures, outstanding advances/loans, and faculty attendance present-days for daily pay.
            Per-class / hourly faculty without class data stay at 0 until you enter units.
          </p>
          <PrimaryButton disabled={generating} onClick={runGenerate}>{generating ? 'Generating…' : 'Generate Payroll'}</PrimaryButton>
          {skipped.length ? (
            <ul className="mt-4 space-y-1 text-xs text-slate-500">
              {skipped.map((s, i) => <li key={i}>{s.employeeCode}: {s.reason}</li>)}
            </ul>
          ) : null}
        </Panel>
      ) : null}

      <Modal open={Boolean(payOpen)} title={payOpen ? `Pay ${payOpen.employee}` : ''} onClose={() => setPayOpen(null)} footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => setPayOpen(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={async () => {
            try {
              await payPayroll(payOpen.itemId, payForm)
              setPayOpen(null)
              setToast('Salary payment recorded')
              reload(pagination.page)
            } catch (err) { setError(err.message) }
          }}>Record payment</PrimaryButton>
        </div>
      }>
        <div className="grid gap-3">
          <p className="text-sm text-slate-600">Outstanding {formatINR(payOpen?.outstanding)}</p>
          <Field label="Amount"><input type="number" min="0" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} /></Field>
          <Field label="Method">
            <select value={payForm.method} onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))} className={inputClass}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Account">
            <select value={payForm.financialAccountCode} onChange={(e) => setPayForm((f) => ({ ...f, financialAccountCode: e.target.value }))} className={inputClass}>
              {books.map((b) => <option key={b.accountCode} value={b.accountCode}>{b.name}</option>)}
            </select>
          </Field>
        </div>
      </Modal>

      <Modal open={Boolean(adjOpen)} title="Payroll adjustment" onClose={() => setAdjOpen(null)} footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => setAdjOpen(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={async () => {
            try {
              await adjustPayroll(adjOpen.itemId, adjForm)
              setAdjOpen(null)
              setToast('Adjustment added')
              reload(pagination.page)
            } catch (err) { setError(err.message) }
          }}>Add</PrimaryButton>
        </div>
      }>
        <div className="grid gap-3">
          <Field label="Type">
            <select value={adjForm.type} onChange={(e) => setAdjForm((f) => ({ ...f, type: e.target.value }))} className={inputClass}>
              {ADJUST_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Amount"><input type="number" min="0" value={adjForm.amount} onChange={(e) => setAdjForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} /></Field>
          <Field label="Reason"><input value={adjForm.reason} onChange={(e) => setAdjForm((f) => ({ ...f, reason: e.target.value }))} className={inputClass} /></Field>
        </div>
      </Modal>

      <Modal open={Boolean(unitsOpen)} title="Units worked" onClose={() => setUnitsOpen(null)} footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => setUnitsOpen(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={async () => {
            try {
              await setPayrollUnits(unitsOpen.itemId, { unitsWorked })
              setUnitsOpen(null)
              reload(pagination.page)
            } catch (err) { setError(err.message) }
          }}>Save</PrimaryButton>
        </div>
      }>
        <p className="mb-2 text-xs text-slate-500">{unitsOpen?.attendanceSummary?.note || 'Enter approved classes, lectures, hours or days.'}</p>
        <Field label="Units"><input type="number" min="0" value={unitsWorked} onChange={(e) => setUnitsWorked(e.target.value)} className={inputClass} /></Field>
      </Modal>
    </section>
  )
}
