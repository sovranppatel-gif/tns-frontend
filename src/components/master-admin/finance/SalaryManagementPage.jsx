import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createAdvance,
  createLoan,
  createSalaryStructure,
  getAdvances,
  getFinanceEmployees,
  getLoans,
  getSalaryOverview,
  getSalaryStructure,
  getSalaryStructures,
  reviseSalaryStructure,
} from '../../../services/financeService.js'
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
import { ActionBtn, ErrorBanner, Field, Toast, inputClass, useToast } from './financeUi.jsx'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'structures', label: 'Salary Structures' },
  { id: 'advances', label: 'Advances' },
  { id: 'loans', label: 'Loans' },
]

const SALARY_TYPES = ['Monthly Fixed', 'Per Class', 'Per Lecture', 'Per Hour', 'Per Day', 'Contract', 'Daily Wage', 'Hourly Wage']
const EARNING_NAMES = ['Basic Salary', 'House Allowance', 'Travel Allowance', 'Medical Allowance', 'Food Allowance', 'Special Allowance', 'Bonus', 'Incentive', 'Other Allowance']
const DEDUCTION_NAMES = ['Advance Recovery', 'Loan Recovery', 'Unpaid Leave Deduction', 'Late Attendance Deduction', 'Tax', 'Other Deduction']

const emptyComponent = (name) => ({ name, calcType: 'Fixed', amount: '' })

function emptyStructure() {
  return {
    employeeType: 'FACULTY',
    employeeId: '',
    salaryType: 'Monthly Fixed',
    paymentFrequency: 'Monthly',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: '',
    basicSalary: '',
    unitRate: '',
    earnings: [emptyComponent('Basic Salary')],
    deductions: [],
    notes: '',
    disburse: false,
  }
}

export default function SalaryManagementPage() {
  const [tab, setTab] = useState('structures')
  const [stats, setStats] = useState({})
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useToast()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [employeeType, setEmployeeType] = useState('')
  const [salaryType, setSalaryType] = useState('')
  const [status, setStatus] = useState('Active')
  const [formOpen, setFormOpen] = useState(false)
  const [reviseId, setReviseId] = useState('')
  const [form, setForm] = useState(emptyStructure)
  const [employees, setEmployees] = useState([])
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState(null)
  const [advRows, setAdvRows] = useState([])
  const [loanRows, setLoanRows] = useState([])
  const [advForm, setAdvForm] = useState({ employeeType: 'STAFF', employeeId: '', amount: '', date: '', reason: '', recoveryMethod: 'Installments', monthlyRecoveryAmount: '', disburse: true })
  const [loanForm, setLoanForm] = useState({ employeeType: 'STAFF', employeeId: '', amount: '', issueDate: '', emiAmount: '', notes: '', disburse: true })
  const [advOpen, setAdvOpen] = useState(false)
  const [loanOpen, setLoanOpen] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const reload = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const [overview, list, advances, loans] = await Promise.all([
        getSalaryOverview(),
        getSalaryStructures({ page, limit: 10, search: debounced, employeeType, salaryType, status }),
        getAdvances({ limit: 20 }),
        getLoans({ limit: 20 }),
      ])
      setStats(overview)
      setRows(list.rows)
      setPagination(list.pagination)
      setAdvRows(advances.rows)
      setLoanRows(loans.rows)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [debounced, employeeType, salaryType, status])

  useEffect(() => { reload(1) }, [reload])

  useEffect(() => {
    if (!formOpen && !advOpen && !loanOpen) return
    const type = formOpen ? form.employeeType : advOpen ? advForm.employeeType : loanForm.employeeType
    getFinanceEmployees({ type, limit: 200 }).then(setEmployees).catch(() => setEmployees([]))
  }, [formOpen, advOpen, loanOpen, form.employeeType, advForm.employeeType, loanForm.employeeType])

  const preview = useMemo(() => {
    const basic = Number(form.basicSalary) || 0
    const earnings = (form.earnings || []).map((e) => {
      const amt = e.calcType === 'Percentage' ? Math.round((basic * (Number(e.amount) || 0)) / 100) : Number(e.amount) || 0
      return { ...e, resolvedAmount: amt }
    })
    const allow = earnings.filter((e) => !/^basic/i.test(e.name)).reduce((s, e) => s + e.resolvedAmount, 0)
    const gross = (earnings.find((e) => /^basic/i.test(e.name))?.resolvedAmount || basic) + allow
    const deductions = (form.deductions || []).map((d) => {
      const amt = d.calcType === 'Percentage' ? Math.round((gross * (Number(d.amount) || 0)) / 100) : Number(d.amount) || 0
      return { ...d, resolvedAmount: amt }
    })
    const ded = deductions.reduce((s, d) => s + d.resolvedAmount, 0)
    return { gross, deductions: ded, net: Math.max(0, gross - ded) }
  }, [form])

  const saveStructure = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        basicSalary: Number(form.basicSalary) || 0,
        unitRate: Number(form.unitRate) || Number(form.basicSalary) || 0,
        earnings: form.earnings.map((e) => ({ ...e, amount: Number(e.amount) || 0 })),
        deductions: form.deductions.map((d) => ({ ...d, amount: Number(d.amount) || 0 })),
      }
      if (reviseId) await reviseSalaryStructure(reviseId, payload)
      else await createSalaryStructure(payload)
      setFormOpen(false)
      setReviseId('')
      setToast(reviseId ? 'Salary revised' : 'Salary structure saved')
      reload(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'employeeName', label: 'Employee' },
    { key: 'employeeType', label: 'Type' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'salaryType', label: 'Salary Type' },
    { key: 'basicSalary', label: 'Basic', render: (r) => formatINR(r.basicSalary) },
    { key: 'totalAllowances', label: 'Allowances', render: (r) => formatINR(r.totalAllowances) },
    { key: 'totalDeductions', label: 'Deductions', render: (r) => formatINR(r.totalDeductions) },
    { key: 'netSalary', label: 'Net', render: (r) => formatINR(r.netSalary) },
    { key: 'effectiveFromLabel', label: 'From' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: '_actions',
      label: '',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <ActionBtn onClick={async () => setHistory(await getSalaryStructure(row.structureId))}>History</ActionBtn>
          {row.status === 'Active' ? (
            <ActionBtn onClick={() => {
              setReviseId(row.structureId)
              setForm({
                employeeType: row.employeeType,
                employeeId: row.employeeMongoId,
                salaryType: row.salaryType,
                paymentFrequency: row.paymentFrequency,
                effectiveFrom: new Date().toISOString().slice(0, 10),
                effectiveTo: '',
                basicSalary: String(row.basicSalary || ''),
                unitRate: String(row.unitRate || ''),
                earnings: (row.earnings || []).map((e) => ({ ...e, amount: String(e.amount ?? e.resolvedAmount ?? '') })),
                deductions: (row.deductions || []).map((d) => ({ ...d, amount: String(d.amount ?? d.resolvedAmount ?? '') })),
                notes: '',
              })
              setFormOpen(true)
            }}>Revise</ActionBtn>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <section className="finance-section space-y-3">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <ErrorBanner error={error} />
      <Toast text={toast} />

      {tab === 'overview' || tab === 'structures' ? (
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Active Employees" value={stats.totalActiveEmployees || 0} />
          <StatCard label="Faculty" value={stats.faculty || 0} />
          <StatCard label="Staff" value={stats.staff || 0} />
          <StatCard label="Monthly Liability" value={formatINR(stats.monthlySalaryLiability)} hint="Active monthly structures only" />
          <StatCard label="Pending Structures" value={stats.pendingSalaryStructures || 0} />
          <StatCard label="Active Structures" value={stats.activeStructures || 0} />
        </div>
      ) : null}

      {tab === 'structures' ? (
        <>
          <PageToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search employee, ID…"
            onAdd={() => { setReviseId(''); setForm(emptyStructure()); setFormOpen(true) }}
            addLabel="Add Structure"
            onExportCsv={() => downloadCsv('salary-structures.csv', [
              { key: 'employeeName', label: 'Employee' }, { key: 'employeeType', label: 'Type' }, { key: 'salaryType', label: 'Salary Type' },
              { key: 'netSalary', label: 'Net' }, { key: 'status', label: 'Status' },
            ], rows)}
            extraActions={
              <>
                <select value={employeeType} onChange={(e) => setEmployeeType(e.target.value)} className={`${inputClass} sm:w-36`}>
                  <option value="">Faculty & Staff</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="STAFF">Staff</option>
                </select>
                <select value={salaryType} onChange={(e) => setSalaryType(e.target.value)} className={`${inputClass} sm:w-40`}>
                  <option value="">All salary types</option>
                  {SALARY_TYPES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} sm:w-36`}>
                  <option value="">All statuses</option>
                  <option>Active</option><option>Superseded</option><option>Draft</option>
                </select>
              </>
            }
          />
          {loading ? <SkeletonBlock className="h-64" /> : (
            <Panel>
              <DataTable columns={columns} rows={rows} emptyTitle="No salary structures" emptyDescription="Add a structure for faculty or staff from existing employee records." />
              <Pagination page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPageChange={reload} />
            </Panel>
          )}
        </>
      ) : null}

      {tab === 'advances' ? (
        <Panel title="Employee advances" action={<PrimaryButton onClick={() => setAdvOpen(true)}>Add Advance</PrimaryButton>}>
          <DataTable
            columns={[
              { key: 'advanceId', label: 'ID' },
              { key: 'employeeName', label: 'Employee' },
              { key: 'employeeType', label: 'Type' },
              { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
              { key: 'remainingAmount', label: 'Remaining', render: (r) => formatINR(r.remainingAmount) },
              { key: 'recoveryMethod', label: 'Recovery' },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={advRows}
          />
        </Panel>
      ) : null}

      {tab === 'loans' ? (
        <Panel title="Employee loans" action={<PrimaryButton onClick={() => setLoanOpen(true)}>Add Loan</PrimaryButton>}>
          <DataTable
            columns={[
              { key: 'loanId', label: 'ID' },
              { key: 'employeeName', label: 'Employee' },
              { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
              { key: 'emiAmount', label: 'EMI', render: (r) => formatINR(r.emiAmount) },
              { key: 'remainingAmount', label: 'Remaining', render: (r) => formatINR(r.remainingAmount) },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={loanRows}
          />
        </Panel>
      ) : null}

      <Modal open={formOpen} title={reviseId ? 'Revise salary' : 'Add salary structure'} onClose={() => setFormOpen(false)} wide footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">Gross {formatINR(preview.gross)} · Deductions {formatINR(preview.deductions)} · Net {formatINR(preview.net)}</p>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setFormOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving} onClick={saveStructure}>{saving ? 'Saving…' : 'Save'}</PrimaryButton>
          </div>
        </div>
      }>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Employee type">
            <select value={form.employeeType} disabled={Boolean(reviseId)} onChange={(e) => setForm((f) => ({ ...f, employeeType: e.target.value, employeeId: '' }))} className={inputClass}>
              <option value="FACULTY">Faculty</option>
              <option value="STAFF">Staff</option>
            </select>
          </Field>
          <Field label="Employee">
            <select value={form.employeeId} disabled={Boolean(reviseId)} onChange={(e) => {
              const emp = employees.find((x) => x.employeeMongoId === e.target.value || x.employeeCode === e.target.value)
              setForm((f) => ({ ...f, employeeId: e.target.value, basicSalary: emp?.suggestedSalary ? String(emp.suggestedSalary) : f.basicSalary }))
            }} className={inputClass}>
              <option value="">Select from {form.employeeType === 'STAFF' ? 'Staff' : 'Faculty'}</option>
              {employees.map((e) => (
                <option key={e.employeeMongoId} value={e.employeeMongoId}>
                  {e.fullName} ({e.employeeCode}) {e.hasSalaryStructure ? '· has structure' : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Salary type">
            <select value={form.salaryType} onChange={(e) => setForm((f) => ({ ...f, salaryType: e.target.value }))} className={inputClass}>
              {SALARY_TYPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Payment frequency">
            <select value={form.paymentFrequency} onChange={(e) => setForm((f) => ({ ...f, paymentFrequency: e.target.value }))} className={inputClass}>
              {['Monthly', 'Weekly', 'Daily', 'Hourly', 'Per Class', 'Per Lecture'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Effective from"><input type="date" value={form.effectiveFrom} onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))} className={inputClass} /></Field>
          <Field label="Basic / rate"><input type="number" min="0" value={form.basicSalary} onChange={(e) => setForm((f) => ({ ...f, basicSalary: e.target.value }))} className={inputClass} /></Field>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Earnings</p>
            <ActionBtn onClick={() => setForm((f) => ({ ...f, earnings: [...f.earnings, emptyComponent('Other Allowance')] }))}>Add earning</ActionBtn>
          </div>
          {(form.earnings || []).map((row, idx) => (
            <div key={idx} className="mb-2 grid grid-cols-12 gap-2">
              <select className={`${inputClass} col-span-5`} value={row.name} onChange={(e) => setForm((f) => { const n = [...f.earnings]; n[idx] = { ...n[idx], name: e.target.value }; return { ...f, earnings: n } })}>
                {EARNING_NAMES.map((n) => <option key={n}>{n}</option>)}
              </select>
              <select className={`${inputClass} col-span-3`} value={row.calcType} onChange={(e) => setForm((f) => { const n = [...f.earnings]; n[idx] = { ...n[idx], calcType: e.target.value }; return { ...f, earnings: n } })}>
                <option>Fixed</option><option>Percentage</option>
              </select>
              <input className={`${inputClass} col-span-3`} type="number" min="0" value={row.amount} onChange={(e) => setForm((f) => { const n = [...f.earnings]; n[idx] = { ...n[idx], amount: e.target.value }; return { ...f, earnings: n } })} />
              <button type="button" className="col-span-1 text-xs text-rose-600" onClick={() => setForm((f) => ({ ...f, earnings: f.earnings.filter((_, i) => i !== idx) }))}>✕</button>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Deductions</p>
            <ActionBtn onClick={() => setForm((f) => ({ ...f, deductions: [...f.deductions, emptyComponent('Other Deduction')] }))}>Add deduction</ActionBtn>
          </div>
          {(form.deductions || []).map((row, idx) => (
            <div key={idx} className="mb-2 grid grid-cols-12 gap-2">
              <select className={`${inputClass} col-span-5`} value={row.name} onChange={(e) => setForm((f) => { const n = [...f.deductions]; n[idx] = { ...n[idx], name: e.target.value }; return { ...f, deductions: n } })}>
                {DEDUCTION_NAMES.map((n) => <option key={n}>{n}</option>)}
              </select>
              <select className={`${inputClass} col-span-3`} value={row.calcType} onChange={(e) => setForm((f) => { const n = [...f.deductions]; n[idx] = { ...n[idx], calcType: e.target.value }; return { ...f, deductions: n } })}>
                <option>Fixed</option><option>Percentage</option>
              </select>
              <input className={`${inputClass} col-span-3`} type="number" min="0" value={row.amount} onChange={(e) => setForm((f) => { const n = [...f.deductions]; n[idx] = { ...n[idx], amount: e.target.value }; return { ...f, deductions: n } })} />
              <button type="button" className="col-span-1 text-xs text-rose-600" onClick={() => setForm((f) => ({ ...f, deductions: f.deductions.filter((_, i) => i !== idx) }))}>✕</button>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={Boolean(history)} title="Salary history" onClose={() => setHistory(null)} wide>
        {history ? (
          <DataTable
            columns={[
              { key: 'structureId', label: 'ID' },
              { key: 'effectiveFromLabel', label: 'From' },
              { key: 'effectiveToLabel', label: 'To' },
              { key: 'netSalary', label: 'Net', render: (r) => formatINR(r.netSalary) },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={history.history || [history]}
          />
        ) : null}
      </Modal>

      <Modal open={advOpen} title="Salary advance" onClose={() => setAdvOpen(false)} footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => setAdvOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={async () => {
            try {
              await createAdvance(advForm)
              setAdvOpen(false)
              setToast('Advance recorded')
              reload(1)
            } catch (err) { setError(err.message) }
          }}>Save</PrimaryButton>
        </div>
      }>
        <div className="grid gap-3">
          <Field label="Type">
            <select value={advForm.employeeType} onChange={(e) => setAdvForm((f) => ({ ...f, employeeType: e.target.value, employeeId: '' }))} className={inputClass}>
              <option value="FACULTY">Faculty</option><option value="STAFF">Staff</option>
            </select>
          </Field>
          <Field label="Employee">
            <select value={advForm.employeeId} onChange={(e) => setAdvForm((f) => ({ ...f, employeeId: e.target.value }))} className={inputClass}>
              <option value="">Select</option>
              {employees.map((e) => <option key={e.employeeMongoId} value={e.employeeMongoId}>{e.fullName} ({e.employeeCode})</option>)}
            </select>
          </Field>
          <Field label="Amount"><input type="number" min="0" value={advForm.amount} onChange={(e) => setAdvForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} /></Field>
          <Field label="Recovery">
            <select value={advForm.recoveryMethod} onChange={(e) => setAdvForm((f) => ({ ...f, recoveryMethod: e.target.value }))} className={inputClass}>
              <option>Installments</option><option>Full</option>
            </select>
          </Field>
          {advForm.recoveryMethod === 'Installments' ? (
            <Field label="Monthly recovery"><input type="number" min="0" value={advForm.monthlyRecoveryAmount} onChange={(e) => setAdvForm((f) => ({ ...f, monthlyRecoveryAmount: e.target.value }))} className={inputClass} /></Field>
          ) : null}
          <Field label="Reason"><input value={advForm.reason} onChange={(e) => setAdvForm((f) => ({ ...f, reason: e.target.value }))} className={inputClass} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={advForm.disburse} onChange={(e) => setAdvForm((f) => ({ ...f, disburse: e.target.checked }))} /> Disburse from cash/bank now</label>
        </div>
      </Modal>

      <Modal open={loanOpen} title="Employee loan" onClose={() => setLoanOpen(false)} footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => setLoanOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={async () => {
            try {
              await createLoan(loanForm)
              setLoanOpen(false)
              setToast('Loan recorded')
              reload(1)
            } catch (err) { setError(err.message) }
          }}>Save</PrimaryButton>
        </div>
      }>
        <div className="grid gap-3">
          <Field label="Type">
            <select value={loanForm.employeeType} onChange={(e) => setLoanForm((f) => ({ ...f, employeeType: e.target.value, employeeId: '' }))} className={inputClass}>
              <option value="FACULTY">Faculty</option><option value="STAFF">Staff</option>
            </select>
          </Field>
          <Field label="Employee">
            <select value={loanForm.employeeId} onChange={(e) => setLoanForm((f) => ({ ...f, employeeId: e.target.value }))} className={inputClass}>
              <option value="">Select</option>
              {employees.map((e) => <option key={e.employeeMongoId} value={e.employeeMongoId}>{e.fullName} ({e.employeeCode})</option>)}
            </select>
          </Field>
          <Field label="Amount"><input type="number" min="0" value={loanForm.amount} onChange={(e) => setLoanForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} /></Field>
          <Field label="EMI"><input type="number" min="0" value={loanForm.emiAmount} onChange={(e) => setLoanForm((f) => ({ ...f, emiAmount: e.target.value }))} className={inputClass} /></Field>
        </div>
      </Modal>
    </section>
  )
}
