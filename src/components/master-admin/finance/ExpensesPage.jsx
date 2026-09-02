import { useCallback, useEffect, useState } from 'react'
import { Check, RefreshCw, Wallet, X } from 'lucide-react'
import {
  approveExpense,
  createExpense,
  generateRecurringExpenses,
  getExpenseCategories,
  getExpenses,
  getExpensesDashboard,
  getFinancialBooks,
  payExpense,
  rejectExpense,
  saveExpenseCategory,
  setExpenseCategoryStatus,
  submitExpense,
  updateExpense,
  uploadFinanceAttachment,
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
import { BarMetricChart } from '../shared/MasterAdminCharts.jsx'
import { DateInput } from '../../shared/DateInput.jsx'
import { ActionBtn, DateRangeFilters, ErrorBanner, Field, PAYMENT_METHODS, Toast, inputClass, useToast } from './financeUi.jsx'
import { getUniversities } from '../../../services/universityService.js'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'list', label: 'Expenses' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'categories', label: 'Categories' },
]

const emptyForm = {
  date: '',
  categoryId: '',
  description: '',
  amount: '',
  taxAmount: '',
  vendor: '',
  paymentMethod: 'Cash',
  financialAccountCode: 'CASH',
  invoiceNumber: '',
  referenceNumber: '',
  notes: '',
  universityId: '',
  reimbursable: false,
  payNow: false,
  submit: true,
  recurringEnabled: false,
  frequency: 'Monthly',
  startDate: '',
  endDate: '',
}

export default function ExpensesPage() {
  const [tab, setTab] = useState('list')
  const [stats, setStats] = useState({})
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [categories, setCategories] = useState([])
  const [books, setBooks] = useState([])
  const [universities, setUniversities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useToast()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [category, setCategory] = useState('')
  const [preset, setPreset] = useState('month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState(null)
  const [payOpen, setPayOpen] = useState(null)
  const [payForm, setPayForm] = useState({ amount: '', method: 'Cash', financialAccountCode: 'CASH', referenceNumber: '', notes: '' })
  const [catName, setCatName] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const loadMeta = useCallback(async () => {
    const [cats, accs, unis] = await Promise.all([
      getExpenseCategories(),
      getFinancialBooks(),
      getUniversities().catch(() => ({ rows: [] })),
    ])
    setCategories(cats)
    setBooks(accs)
    setUniversities(Array.isArray(unis.rows) ? unis.rows : Array.isArray(unis) ? unis : [])
  }, [])

  const reload = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const [dash, list] = await Promise.all([
        getExpensesDashboard({ preset, from, to }),
        getExpenses({
          page,
          limit: 10,
          search: debounced,
          paymentStatus,
          category,
          preset: from || to ? '' : preset,
          from,
          to,
          workflowStatus: tab === 'approvals' ? 'Submitted' : '',
        }),
      ])
      setStats(dash)
      setRows(list.rows)
      setPagination(list.pagination)
    } catch (err) {
      setError(err.message || 'Unable to load expenses')
    } finally {
      setLoading(false)
    }
  }, [debounced, paymentStatus, category, preset, from, to, tab])

  useEffect(() => {
    loadMeta().catch(() => {})
  }, [loadMeta])

  useEffect(() => {
    reload(1)
  }, [reload])

  const openCreate = () => {
    setEditingId('')
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) })
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.expenseId)
    setForm({
      date: row.date,
      categoryId: row.categoryId,
      description: row.description,
      amount: String(row.amount || ''),
      taxAmount: String(row.taxAmount || ''),
      vendor: row.vendor,
      paymentMethod: row.paymentMethod || 'Cash',
      financialAccountCode: row.financialAccountCode || 'CASH',
      invoiceNumber: row.invoiceNumber,
      referenceNumber: row.referenceNumber,
      notes: row.notes,
      universityId: row.universityId,
      reimbursable: Boolean(row.reimbursable),
      payNow: false,
      submit: row.workflowStatus === 'Submitted',
      recurringEnabled: Boolean(row.recurring?.enabled),
      frequency: row.recurring?.frequency || 'Monthly',
      startDate: row.recurring?.startDate ? String(row.recurring.startDate).slice(0, 10) : '',
      endDate: row.recurring?.endDate ? String(row.recurring.endDate).slice(0, 10) : '',
    })
    setFormOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, amount: Number(form.amount) || 0, taxAmount: Number(form.taxAmount) || 0 }
      if (editingId) await updateExpense(editingId, payload)
      else await createExpense(payload)
      setFormOpen(false)
      setToast(editingId ? 'Expense updated' : 'Expense created')
      await reload(pagination.page)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const onAttach = async (file) => {
    if (!file) return
    try {
      const data = await uploadFinanceAttachment(file)
      setForm((f) => ({ ...f, attachmentUrl: data.url, attachmentName: data.name }))
      setToast('Attachment uploaded')
    } catch (err) {
      setError(err.message)
    }
  }

  const columns = [
    { key: 'expenseId', label: 'Expense ID' },
    { key: 'dateLabel', label: 'Date' },
    { key: 'categoryName', label: 'Category' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'totalAmount', label: 'Amount', render: (r) => formatINR(r.totalAmount) },
    { key: 'paidAmount', label: 'Paid', render: (r) => formatINR(r.paidAmount) },
    { key: 'paymentStatus', label: 'Payment', render: (r) => <StatusBadge status={r.paymentStatus} /> },
    { key: 'workflowStatus', label: 'Workflow', render: (r) => <StatusBadge status={r.workflowStatus} /> },
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <ActionBtn onClick={() => setDetail(row)}>View</ActionBtn>
          {row.workflowStatus === 'Draft' || row.workflowStatus === 'Rejected' ? (
            <ActionBtn onClick={() => submitExpense(row.expenseId).then(() => reload(pagination.page)).then(() => setToast('Submitted'))}>Submit</ActionBtn>
          ) : null}
          {row.workflowStatus === 'Submitted' ? (
            <>
              <ActionBtn tone="success" onClick={() => approveExpense(row.expenseId).then(() => reload(pagination.page)).then(() => setToast('Approved'))}><Check size={12} /> Approve</ActionBtn>
              <ActionBtn tone="danger" onClick={() => { const remarks = window.prompt('Rejection remarks'); if (remarks != null) rejectExpense(row.expenseId, remarks).then(() => reload(pagination.page)) }}><X size={12} /> Reject</ActionBtn>
            </>
          ) : null}
          {row.outstanding > 0 && !['Cancelled', 'Rejected'].includes(row.workflowStatus) ? (
            <ActionBtn onClick={() => { setPayOpen(row); setPayForm({ amount: String(row.outstanding), method: row.paymentMethod || 'Cash', financialAccountCode: row.financialAccountCode || 'CASH', referenceNumber: '', notes: '' }) }}>Pay</ActionBtn>
          ) : null}
          {row.workflowStatus !== 'Paid' ? <ActionBtn onClick={() => openEdit(row)}>Edit</ActionBtn> : null}
        </div>
      ),
    },
  ]

  return (
    <section className="finance-section space-y-3">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <ErrorBanner error={error} />
      <Toast text={toast} />

      {tab === 'dashboard' ? (
        <>
          {loading ? <SkeletonBlock className="h-28" /> : (
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <StatCard label="Total Expenses" value={formatINR(stats.totalExpenses)} />
              <StatCard label="This Month" value={formatINR(stats.thisMonthExpenses)} />
              <StatCard label="Pending Approval" value={stats.pendingApproval || 0} />
              <StatCard label="Paid" value={formatINR(stats.paidExpenses)} />
              <StatCard label="Unpaid" value={formatINR(stats.unpaidExpenses)} />
              <StatCard label="Reimbursable" value={stats.reimbursableExpenses || 0} />
            </div>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Expense by Category">
              <BarMetricChart data={stats.byCategory || []} formatter={(v) => formatINR(v)} />
            </Panel>
            <Panel title="Monthly Expense Trend">
              <BarMetricChart data={stats.monthlyTrend || []} formatter={(v) => formatINR(v)} />
            </Panel>
          </div>
          {(stats.recurringDueSoon || []).length ? (
            <Panel title="Recurring due soon">
              <ul className="space-y-2 text-sm">
                {stats.recurringDueSoon.map((r) => (
                  <li key={r.expenseId} className="flex justify-between gap-2">
                    <span>{r.categoryName} · {r.vendor || '—'}</span>
                    <span className="text-slate-500">{r.nextDueDate} · {formatINR(r.amount)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </>
      ) : null}

      {tab === 'list' || tab === 'approvals' ? (
        <>
          <PageToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search ID, vendor, invoice…"
            onAdd={tab === 'list' ? openCreate : undefined}
            addLabel="Add Expense"
            onExportCsv={() => downloadCsv('expenses.csv', [
              { key: 'expenseId', label: 'ID' },
              { key: 'dateLabel', label: 'Date' },
              { key: 'categoryName', label: 'Category' },
              { key: 'vendor', label: 'Vendor' },
              { key: 'totalAmount', label: 'Amount' },
              { key: 'paidAmount', label: 'Paid' },
              { key: 'paymentStatus', label: 'Payment' },
              { key: 'workflowStatus', label: 'Workflow' },
            ], rows)}
            extraActions={
              <>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={`${inputClass} sm:w-40`}>
                  <option value="">All payments</option>
                  {['Paid', 'Pending', 'Partially Paid', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} sm:w-44`}>
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <DateRangeFilters preset={preset} from={from} to={to} onPreset={setPreset} onFrom={setFrom} onTo={setTo} />
                <SecondaryButton onClick={() => generateRecurringExpenses().then((d) => { setToast(`${d.created || 0} recurring drafts created`); reload(1) })}>
                  <RefreshCw size={14} /> Generate recurring
                </SecondaryButton>
              </>
            }
          />
          {loading ? <SkeletonBlock className="h-64" /> : (
            <Panel>
              <DataTable columns={columns} rows={rows} emptyTitle="No expenses found" emptyDescription="Create an expense or adjust filters." />
              <Pagination page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPageChange={reload} />
            </Panel>
          )}
        </>
      ) : null}

      {tab === 'categories' ? (
        <Panel
          title="Expense categories"
          action={
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                saveExpenseCategory({ name: catName }).then(() => { setCatName(''); loadMeta(); setToast('Category saved') }).catch((err) => setError(err.message))
              }}
            >
              <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="New category" className={inputClass} />
              <PrimaryButton type="submit">Add</PrimaryButton>
            </form>
          }
        >
          <DataTable
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'accountCode', label: 'Account' },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              {
                key: '_actions',
                label: '',
                render: (r) => (
                  <ActionBtn onClick={() => setExpenseCategoryStatus(r.id, r.status === 'Active' ? 'Inactive' : 'Active').then(loadMeta)}>
                    {r.status === 'Active' ? 'Disable' : 'Enable'}
                  </ActionBtn>
                ),
              },
            ]}
            rows={categories}
          />
        </Panel>
      ) : null}

      <Modal open={formOpen} title={editingId ? 'Edit expense' : 'Add expense'} onClose={() => setFormOpen(false)} wide footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => setFormOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</PrimaryButton>
        </div>
      }>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date"><DateInput value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={inputClass} /></Field>
          <Field label="Category">
            <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className={inputClass}>
              <option value="">Select</option>
              {categories.filter((c) => c.status === 'Active').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Vendor / Payee"><input value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} className={inputClass} /></Field>
          <Field label="Amount"><input type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} /></Field>
          <Field label="Tax"><input type="number" min="0" value={form.taxAmount} onChange={(e) => setForm((f) => ({ ...f, taxAmount: e.target.value }))} className={inputClass} /></Field>
          <Field label="Payment method">
            <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))} className={inputClass}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Payment account">
            <select value={form.financialAccountCode} onChange={(e) => setForm((f) => ({ ...f, financialAccountCode: e.target.value }))} className={inputClass}>
              {books.map((b) => <option key={b.accountCode} value={b.accountCode}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Invoice no."><input value={form.invoiceNumber} onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))} className={inputClass} /></Field>
          <Field label="Reference"><input value={form.referenceNumber} onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))} className={inputClass} /></Field>
          <Field label="Institute">
            <select value={form.universityId} onChange={(e) => setForm((f) => ({ ...f, universityId: e.target.value }))} className={inputClass}>
              <option value="">All / none</option>
              {universities.map((u) => <option key={u._id || u.id} value={u._id || u.id}>{u.shortName || u.name}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Description"><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputClass} /></Field></div>
          <Field label="Bill / attachment">
            <input type="file" accept=".pdf,image/*" onChange={(e) => onAttach(e.target.files?.[0])} className="text-sm" />
            {form.attachmentName ? <p className="text-xs text-slate-500">{form.attachmentName}</p> : null}
          </Field>
          <Field label="Notes"><input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputClass} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.reimbursable} onChange={(e) => setForm((f) => ({ ...f, reimbursable: e.target.checked }))} /> Reimbursable</label>
          {!editingId ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.payNow} onChange={(e) => setForm((f) => ({ ...f, payNow: e.target.checked }))} /> Mark as paid now</label> : null}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.submit} onChange={(e) => setForm((f) => ({ ...f, submit: e.target.checked }))} /> Submit for approval</label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.recurringEnabled} onChange={(e) => setForm((f) => ({ ...f, recurringEnabled: e.target.checked }))} /> Recurring expense</label>
          {form.recurringEnabled ? (
            <>
              <Field label="Frequency">
                <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))} className={inputClass}>
                  <option>Monthly</option><option>Quarterly</option><option>Yearly</option>
                </select>
              </Field>
              <Field label="Start"><DateInput value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className={inputClass} /></Field>
              <Field label="End (optional)"><DateInput value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className={inputClass} /></Field>
            </>
          ) : null}
        </div>
      </Modal>

      <Modal open={Boolean(detail)} title={detail ? `Expense ${detail.expenseId}` : ''} onClose={() => setDetail(null)} wide>
        {detail ? (
          <div className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p><span className="text-slate-500">Category:</span> {detail.categoryName}</p>
              <p><span className="text-slate-500">Vendor:</span> {detail.vendor || '—'}</p>
              <p><span className="text-slate-500">Total:</span> {formatINR(detail.totalAmount)}</p>
              <p><span className="text-slate-500">Outstanding:</span> {formatINR(detail.outstanding)}</p>
              <p><span className="text-slate-500">Workflow:</span> <StatusBadge status={detail.workflowStatus} /></p>
              <p><span className="text-slate-500">Payment:</span> <StatusBadge status={detail.paymentStatus} /></p>
            </div>
            <p className="text-slate-600">{detail.description || 'No description'}</p>
            {(detail.approvalHistory || []).length ? (
              <ul className="space-y-1 text-xs text-slate-500">
                {detail.approvalHistory.map((h, i) => (
                  <li key={i}>{h.action} · {h.by} · {h.remarks || ''}</li>
                ))}
              </ul>
            ) : null}
            {detail.attachmentUrl ? <a href={detail.attachmentUrl} className="text-brand-red text-xs font-semibold" target="_blank" rel="noreferrer">View attachment</a> : null}
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(payOpen)} title={payOpen ? `Pay ${payOpen.expenseId}` : ''} onClose={() => setPayOpen(null)} footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => setPayOpen(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={async () => {
            try {
              await payExpense(payOpen.expenseId, payForm)
              setPayOpen(null)
              setToast('Payment recorded')
              reload(pagination.page)
            } catch (err) { setError(err.message) }
          }}><Wallet size={14} /> Record payment</PrimaryButton>
        </div>
      }>
        <div className="grid gap-3">
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
          <Field label="Reference"><input value={payForm.referenceNumber} onChange={(e) => setPayForm((f) => ({ ...f, referenceNumber: e.target.value }))} className={inputClass} /></Field>
        </div>
      </Modal>
    </section>
  )
}
