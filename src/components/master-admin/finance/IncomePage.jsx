import { useCallback, useEffect, useState } from 'react'
import {
  createIncome,
  getFinancialBooks,
  getIncomeCategories,
  getIncomeDashboard,
  getIncomeList,
  receiveIncomePayment,
  saveIncomeCategory,
  setIncomeCategoryStatus,
  updateIncome,
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
  { id: 'list', label: 'Other Income' },
  { id: 'categories', label: 'Categories' },
]

const emptyForm = {
  date: '',
  categoryId: '',
  source: '',
  description: '',
  amount: '',
  taxAmount: '',
  receivedFrom: '',
  paymentMethod: 'UPI',
  financialAccountCode: 'UPI',
  referenceNumber: '',
  notes: '',
  universityId: '',
  receiveNow: true,
}

export default function IncomePage() {
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
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [preset, setPreset] = useState('month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [payOpen, setPayOpen] = useState(null)
  const [payForm, setPayForm] = useState({ amount: '', method: 'UPI', financialAccountCode: 'UPI' })
  const [catName, setCatName] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const loadMeta = useCallback(async () => {
    const [cats, accs, unis] = await Promise.all([
      getIncomeCategories(),
      getFinancialBooks(),
      getUniversities().catch(() => ({ rows: [] })),
    ])
    setCategories(cats)
    setBooks(accs)
    setUniversities(unis.rows || [])
  }, [])

  const reload = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const [dash, list] = await Promise.all([
        getIncomeDashboard({ preset, from, to }),
        getIncomeList({
          page,
          limit: 10,
          search: debounced,
          status,
          category,
          preset: from || to ? '' : preset,
          from,
          to,
        }),
      ])
      setStats(dash)
      setRows(list.rows)
      setPagination(list.pagination)
    } catch (err) {
      setError(err.message || 'Unable to load income')
    } finally {
      setLoading(false)
    }
  }, [debounced, status, category, preset, from, to])

  useEffect(() => { loadMeta().catch(() => {}) }, [loadMeta])
  useEffect(() => { reload(1) }, [reload])

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, amount: Number(form.amount) || 0, taxAmount: Number(form.taxAmount) || 0 }
      if (editingId) await updateIncome(editingId, payload)
      else await createIncome(payload)
      setFormOpen(false)
      setToast(editingId ? 'Income updated' : 'Income recorded')
      reload(pagination.page)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'incomeId', label: 'Income ID' },
    { key: 'dateLabel', label: 'Date' },
    { key: 'categoryName', label: 'Category' },
    { key: 'receivedFrom', label: 'Received from' },
    { key: 'totalAmount', label: 'Amount', render: (r) => formatINR(r.totalAmount) },
    { key: 'receivedAmount', label: 'Received', render: (r) => formatINR(r.receivedAmount) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.outstanding > 0 && row.status !== 'Cancelled' ? (
            <ActionBtn tone="success" onClick={() => { setPayOpen(row); setPayForm({ amount: String(row.outstanding), method: row.paymentMethod || 'UPI', financialAccountCode: row.financialAccountCode || 'UPI' }) }}>Receive</ActionBtn>
          ) : null}
          {row.status !== 'Received' ? (
            <ActionBtn onClick={() => {
              setEditingId(row.incomeId)
              setForm({
                date: row.date,
                categoryId: row.categoryId,
                source: row.source,
                description: row.description,
                amount: String(row.amount || ''),
                taxAmount: String(row.taxAmount || ''),
                receivedFrom: row.receivedFrom,
                paymentMethod: row.paymentMethod || 'UPI',
                financialAccountCode: row.financialAccountCode || 'UPI',
                referenceNumber: row.referenceNumber,
                notes: row.notes,
                universityId: row.universityId,
                receiveNow: false,
              })
              setFormOpen(true)
            }}>Edit</ActionBtn>
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
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
              <StatCard label="Total Income" value={formatINR(stats.totalIncome)} hint="Fees + other income received" />
              <StatCard label="This Month" value={formatINR(stats.thisMonthIncome)} />
              <StatCard label="Student Fees" value={formatINR(stats.feeIncome)} hint="From fee collection, not duplicated here" />
              <StatCard label="Other Income" value={formatINR(stats.otherIncome)} />
              <StatCard label="Outstanding" value={formatINR(stats.outstandingReceivables)} />
            </div>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Income by Category"><BarMetricChart data={stats.byCategory || []} formatter={(v) => formatINR(v)} /></Panel>
            <Panel title="Monthly Income Trend"><BarMetricChart data={(stats.monthlyTrend || []).map((r) => ({ name: r.name, value: r.value }))} formatter={(v) => formatINR(v)} /></Panel>
          </div>
        </>
      ) : null}

      {tab === 'list' ? (
        <>
          <PageToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search income ID, source, person…"
            onAdd={() => { setEditingId(''); setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) }); setFormOpen(true) }}
            addLabel="Add Income"
            onExportCsv={() => downloadCsv('income.csv', [
              { key: 'incomeId', label: 'ID' }, { key: 'dateLabel', label: 'Date' }, { key: 'categoryName', label: 'Category' },
              { key: 'receivedFrom', label: 'From' }, { key: 'totalAmount', label: 'Amount' }, { key: 'status', label: 'Status' },
            ], rows)}
            extraActions={
              <>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} sm:w-40`}>
                  <option value="">All statuses</option>
                  {['Received', 'Pending', 'Partial', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} sm:w-44`}>
                  <option value="">All categories</option>
                  {categories.filter((c) => !/student fees/i.test(c.name)).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <DateRangeFilters preset={preset} from={from} to={to} onPreset={setPreset} onFrom={setFrom} onTo={setTo} />
              </>
            }
          />
          {loading ? <SkeletonBlock className="h-64" /> : (
            <Panel>
              <p className="mb-3 text-xs text-slate-500">Student fee collections appear in Payments and Accounting automatically. This list is for non-fee income only.</p>
              <DataTable columns={columns} rows={rows} emptyTitle="No other income yet" />
              <Pagination page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPageChange={reload} />
            </Panel>
          )}
        </>
      ) : null}

      {tab === 'categories' ? (
        <Panel title="Income categories" action={
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); saveIncomeCategory({ name: catName }).then(() => { setCatName(''); loadMeta(); setToast('Category saved') }) }}>
            <input value={catName} onChange={(e) => setCatName(e.target.value)} className={inputClass} placeholder="New category" />
            <PrimaryButton type="submit">Add</PrimaryButton>
          </form>
        }>
          <DataTable
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'accountCode', label: 'Account' },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              {
                key: '_actions',
                label: '',
                render: (r) => r.system ? <span className="text-xs text-slate-400">System</span> : (
                  <ActionBtn onClick={() => setIncomeCategoryStatus(r.id, r.status === 'Active' ? 'Inactive' : 'Active').then(loadMeta)}>
                    {r.status === 'Active' ? 'Disable' : 'Enable'}
                  </ActionBtn>
                ),
              },
            ]}
            rows={categories}
          />
        </Panel>
      ) : null}

      <Modal open={formOpen} title={editingId ? 'Edit income' : 'Add other income'} onClose={() => setFormOpen(false)} wide footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => setFormOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</PrimaryButton>
        </div>
      }>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date"><DateInput value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={inputClass} /></Field>
          <Field label="Category">
            <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className={inputClass}>
              <option value="">Select</option>
              {categories.filter((c) => c.status === 'Active' && !/student fees/i.test(c.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Source"><input value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} className={inputClass} /></Field>
          <Field label="Received from"><input value={form.receivedFrom} onChange={(e) => setForm((f) => ({ ...f, receivedFrom: e.target.value }))} className={inputClass} /></Field>
          <Field label="Amount"><input type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} /></Field>
          <Field label="Tax"><input type="number" min="0" value={form.taxAmount} onChange={(e) => setForm((f) => ({ ...f, taxAmount: e.target.value }))} className={inputClass} /></Field>
          <Field label="Method">
            <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))} className={inputClass}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Account">
            <select value={form.financialAccountCode} onChange={(e) => setForm((f) => ({ ...f, financialAccountCode: e.target.value }))} className={inputClass}>
              {books.map((b) => <option key={b.accountCode} value={b.accountCode}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Reference"><input value={form.referenceNumber} onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))} className={inputClass} /></Field>
          <Field label="Institute">
            <select value={form.universityId} onChange={(e) => setForm((f) => ({ ...f, universityId: e.target.value }))} className={inputClass}>
              <option value="">None</option>
              {universities.map((u) => <option key={u._id || u.id} value={u._id || u.id}>{u.shortName || u.name}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Description"><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputClass} /></Field></div>
          <Field label="Attachment"><input type="file" accept=".pdf,image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const data = await uploadFinanceAttachment(file); setForm((f) => ({ ...f, attachmentUrl: data.url, attachmentName: data.name })) }} /></Field>
          {!editingId ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.receiveNow} onChange={(e) => setForm((f) => ({ ...f, receiveNow: e.target.checked }))} /> Mark as received now</label> : null}
        </div>
      </Modal>

      <Modal open={Boolean(payOpen)} title="Receive payment" onClose={() => setPayOpen(null)} footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => setPayOpen(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={async () => {
            try {
              await receiveIncomePayment(payOpen.incomeId, payForm)
              setPayOpen(null)
              setToast('Payment received')
              reload(pagination.page)
            } catch (err) { setError(err.message) }
          }}>Receive</PrimaryButton>
        </div>
      }>
        <div className="grid gap-3">
          <Field label="Amount"><input type="number" min="0" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} /></Field>
          <Field label="Method">
            <select value={payForm.method} onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))} className={inputClass}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
        </div>
      </Modal>
    </section>
  )
}
