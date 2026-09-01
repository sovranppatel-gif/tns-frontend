import { useCallback, useEffect, useState } from 'react'
import {
  getAccountingDashboard,
  getAccountingTransaction,
  getAccountingTransactions,
  getChartAccounts,
  getFinanceOverview,
  getFinancialBooks,
  getLedger,
  saveChartAccount,
  saveFinancialBook,
  setChartAccountStatus,
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
import { DonutChart, GroupedBarChart } from '../shared/MasterAdminCharts.jsx'
import { ActionBtn, DateRangeFilters, ErrorBanner, Field, Toast, inputClass, useToast } from './financeUi.jsx'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'dashboard', label: 'Accounting' },
  { id: 'accounts', label: 'Chart of Accounts' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'books', label: 'Cash & Bank' },
]

const ACCOUNT_TYPES = ['Asset', 'Liability', 'Income', 'Expense', 'Equity']

export default function AccountingPage() {
  const [tab, setTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [stats, setStats] = useState({})
  const [accounts, setAccounts] = useState([])
  const [books, setBooks] = useState([])
  const [txns, setTxns] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [ledger, setLedger] = useState(null)
  const [ledgerAccount, setLedgerAccount] = useState('1000')
  const [txnDetail, setTxnDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useToast()
  const [preset, setPreset] = useState('month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [accForm, setAccForm] = useState({ code: '', name: '', type: 'Expense', description: '' })
  const [bookForm, setBookForm] = useState({ accountCode: '', name: '', type: 'Bank', bankName: '', accountNumber: '', ifsc: '', openingBalance: '' })
  const [bookOpen, setBookOpen] = useState(false)

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const [ov, dash, accs, accBooks, list, led] = await Promise.all([
        getFinanceOverview(),
        getAccountingDashboard({ preset, from, to }),
        getChartAccounts(),
        getFinancialBooks(),
        getAccountingTransactions({ page, limit: 10, search, sourceType, preset: from || to ? '' : preset, from, to }),
        getLedger({ account: ledgerAccount, preset, from, to }).catch(() => null),
      ])
      setOverview(ov)
      setStats(dash)
      setAccounts(accs)
      setBooks(accBooks)
      setTxns(list.rows)
      setPagination(list.pagination)
      setLedger(led)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [preset, from, to, search, sourceType, ledgerAccount])

  useEffect(() => { load(1) }, [load])

  return (
    <section className="space-y-3">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <ErrorBanner error={error} />
      <Toast text={toast} />
      <div className="flex flex-wrap gap-2">
        <DateRangeFilters preset={preset} from={from} to={to} onPreset={setPreset} onFrom={setFrom} onTo={setTo} />
      </div>

      {tab === 'overview' && overview ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Fee Collected" value={formatINR(overview.finance?.totalFeeCollected)} />
            <StatCard label="Pending Fees" value={formatINR(overview.finance?.pendingFees)} />
            <StatCard label="Monthly Income" value={formatINR(overview.finance?.monthlyIncome)} />
            <StatCard label="Monthly Expenses" value={formatINR(overview.finance?.monthlyExpenses)} />
            <StatCard label="Net Surplus" value={formatINR(overview.finance?.netSurplus)} />
            <StatCard label="Pending Payments" value={overview.finance?.pendingPayments || 0} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Faculty" value={overview.hr?.totalFaculty || 0} />
            <StatCard label="Staff" value={overview.hr?.totalStaff || 0} />
            <StatCard label="Monthly Payroll" value={formatINR(overview.hr?.monthlyPayroll)} />
            <StatCard label="Paid Salary" value={formatINR(overview.hr?.paidSalary)} />
            <StatCard label="Pending Salary" value={formatINR(overview.hr?.pendingSalary)} />
            <StatCard label="Salary Structures" value={overview.hr?.activeSalaryStructures || 0} />
          </div>
          {(overview.alerts || []).length ? (
            <Panel title="Alerts">
              <ul className="space-y-2 text-sm">
                {overview.alerts.map((a, i) => (
                  <li key={i} className={a.tone === 'warn' ? 'text-amber-800' : 'text-slate-700'}>{a.text}</li>
                ))}
              </ul>
            </Panel>
          ) : null}
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Recent fee payments">
              <DataTable
                columns={[
                  { key: 'id', label: 'Txn' },
                  { key: 'party', label: 'Student' },
                  { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
                  { key: 'method', label: 'Method' },
                ]}
                rows={overview.recent?.feePayments || []}
                emptyTitle="No recent fee payments"
              />
            </Panel>
            <Panel title="Recent salary payments">
              <DataTable
                columns={[
                  { key: 'id', label: 'Txn' },
                  { key: 'party', label: 'Employee' },
                  { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
                ]}
                rows={overview.recent?.salaryPayments || []}
                emptyTitle="No recent salary payments"
              />
            </Panel>
          </div>
        </>
      ) : null}

      {tab === 'dashboard' ? (
        <>
          {loading ? <SkeletonBlock className="h-28" /> : (
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
              <StatCard label="Total Income" value={formatINR(stats.totalIncome)} />
              <StatCard label="Total Expenses" value={formatINR(stats.totalExpenses)} />
              <StatCard label="Net Surplus" value={formatINR(stats.netProfit)} />
              <StatCard label="Cash Balance" value={formatINR(stats.cashBalance)} />
              <StatCard label="Bank / UPI" value={formatINR(stats.bankBalance)} />
              <StatCard label="Receivables" value={formatINR(stats.pendingReceivables)} hint="Outstanding student fees" />
              <StatCard label="Payables" value={formatINR(stats.pendingPayables)} hint="Unpaid expenses + salary" />
              <StatCard label="This Month Income" value={formatINR(stats.thisMonthIncome)} />
              <StatCard label="This Month Expenses" value={formatINR(stats.thisMonthExpenses)} />
            </div>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Income vs Expenses">
              <GroupedBarChart
                data={stats.monthlyIncomeVsExpenses || []}
                series={[{ key: 'income', label: 'Income' }, { key: 'expenses', label: 'Expenses' }]}
                formatter={(v) => formatINR(v)}
              />
            </Panel>
            <Panel title="Income by category"><DonutChart data={stats.incomeByCategory || []} /></Panel>
            <Panel title="Expense by category"><DonutChart data={stats.expenseByCategory || []} /></Panel>
            <Panel title="Cash flow trend">
              <GroupedBarChart
                data={stats.cashFlowTrend || []}
                series={[{ key: 'inflow', label: 'In' }, { key: 'outflow', label: 'Out' }]}
                formatter={(v) => formatINR(v)}
              />
            </Panel>
          </div>
        </>
      ) : null}

      {tab === 'accounts' ? (
        <Panel
          title="Chart of accounts"
          action={
            <form className="flex flex-wrap gap-2" onSubmit={(e) => {
              e.preventDefault()
              saveChartAccount(accForm).then(() => { setAccForm({ code: '', name: '', type: 'Expense', description: '' }); setToast('Account saved'); load() }).catch((err) => setError(err.message))
            }}>
              <input placeholder="Code" value={accForm.code} onChange={(e) => setAccForm((f) => ({ ...f, code: e.target.value }))} className={`${inputClass} w-24`} />
              <input placeholder="Name" value={accForm.name} onChange={(e) => setAccForm((f) => ({ ...f, name: e.target.value }))} className={`${inputClass} w-40`} />
              <select value={accForm.type} onChange={(e) => setAccForm((f) => ({ ...f, type: e.target.value }))} className={`${inputClass} w-32`}>
                {ACCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <PrimaryButton type="submit">Add</PrimaryButton>
            </form>
          }
        >
          <DataTable
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'name', label: 'Name' },
              { key: 'type', label: 'Type' },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              {
                key: '_actions',
                label: '',
                render: (r) => (
                  <ActionBtn onClick={() => setChartAccountStatus(r.code, r.status === 'Active' ? 'Inactive' : 'Active').then(() => load())}>
                    {r.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </ActionBtn>
                ),
              },
            ]}
            rows={accounts}
          />
        </Panel>
      ) : null}

      {tab === 'ledger' ? (
        <Panel
          title="General ledger"
          action={
            <select value={ledgerAccount} onChange={(e) => setLedgerAccount(e.target.value)} className={`${inputClass} w-64`}>
              {accounts.map((a) => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
            </select>
          }
        >
          {ledger ? (
            <>
              <p className="mb-3 text-sm text-slate-500">
                Opening {formatINR(ledger.openingBalance)} · Closing {formatINR(ledger.closingBalance)}
              </p>
              <DataTable
                columns={[
                  { key: 'dateLabel', label: 'Date' },
                  { key: 'transactionId', label: 'Txn ID' },
                  { key: 'referenceNumber', label: 'Reference' },
                  { key: 'description', label: 'Description' },
                  { key: 'debit', label: 'Debit', render: (r) => r.debit ? formatINR(r.debit) : '—' },
                  { key: 'credit', label: 'Credit', render: (r) => r.credit ? formatINR(r.credit) : '—' },
                  { key: 'balance', label: 'Balance', render: (r) => formatINR(r.balance) },
                ]}
                rows={ledger.rows || []}
                emptyTitle="No ledger entries"
                onRowClick={(row) => getAccountingTransaction(row.transactionId).then(setTxnDetail)}
              />
            </>
          ) : <p className="text-sm text-slate-500">Select an account</p>}
        </Panel>
      ) : null}

      {tab === 'transactions' ? (
        <>
          <PageToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search txn, reference, source…"
            onExportCsv={() => downloadCsv('accounting-transactions.csv', [
              { key: 'transactionId', label: 'ID' }, { key: 'dateLabel', label: 'Date' }, { key: 'description', label: 'Description' },
              { key: 'debitTotal', label: 'Debit' }, { key: 'creditTotal', label: 'Credit' },
            ], txns)}
            extraActions={
              <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className={`${inputClass} sm:w-36`}>
                <option value="">All sources</option>
                {['FEE', 'INCOME', 'EXPENSE', 'PAYROLL', 'REFUND', 'ADVANCE', 'OTHER'].map((s) => <option key={s}>{s}</option>)}
              </select>
            }
          />
          {loading ? <SkeletonBlock className="h-64" /> : (
            <Panel>
              <DataTable
                columns={[
                  { key: 'transactionId', label: 'Txn ID' },
                  { key: 'dateLabel', label: 'Date' },
                  { key: 'referenceNumber', label: 'Reference' },
                  { key: 'description', label: 'Description' },
                  { key: 'sourceType', label: 'Source' },
                  { key: 'debitTotal', label: 'Debit', render: (r) => formatINR(r.debitTotal) },
                  { key: 'creditTotal', label: 'Credit', render: (r) => formatINR(r.creditTotal) },
                  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                ]}
                rows={txns}
                onRowClick={(row) => getAccountingTransaction(row.transactionId).then(setTxnDetail)}
              />
              <Pagination page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPageChange={load} />
            </Panel>
          )}
        </>
      ) : null}

      {tab === 'books' ? (
        <Panel title="Financial accounts" action={<PrimaryButton onClick={() => setBookOpen(true)}>Add account</PrimaryButton>}>
          <DataTable
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'type', label: 'Type' },
              { key: 'bankName', label: 'Bank' },
              { key: 'accountNumberMasked', label: 'Account' },
              { key: 'openingBalance', label: 'Opening', render: (r) => formatINR(r.openingBalance) },
              { key: 'currentBalance', label: 'Balance', render: (r) => formatINR(r.currentBalance) },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={books}
          />
        </Panel>
      ) : null}

      <Modal open={Boolean(txnDetail)} title={txnDetail ? txnDetail.transactionId : ''} onClose={() => setTxnDetail(null)} wide>
        {txnDetail ? (
          <div className="space-y-3 text-sm">
            <p>{txnDetail.description}</p>
            <p className="text-slate-500">{txnDetail.sourceType} / {txnDetail.sourceId} · {txnDetail.referenceNumber}</p>
            <DataTable
              columns={[
                { key: 'accountCode', label: 'Code' },
                { key: 'accountName', label: 'Account' },
                { key: 'debit', label: 'Debit', render: (r) => r.debit ? formatINR(r.debit) : '—' },
                { key: 'credit', label: 'Credit', render: (r) => r.credit ? formatINR(r.credit) : '—' },
              ]}
              rows={txnDetail.lines || []}
            />
          </div>
        ) : null}
      </Modal>

      <Modal open={bookOpen} title="Financial account" onClose={() => setBookOpen(false)} footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => setBookOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={async () => {
            try {
              await saveFinancialBook(bookForm)
              setBookOpen(false)
              setToast('Account saved')
              load()
            } catch (err) { setError(err.message) }
          }}>Save</PrimaryButton>
        </div>
      }>
        <div className="grid gap-3">
          <Field label="Code"><input value={bookForm.accountCode} onChange={(e) => setBookForm((f) => ({ ...f, accountCode: e.target.value }))} className={inputClass} /></Field>
          <Field label="Name"><input value={bookForm.name} onChange={(e) => setBookForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} /></Field>
          <Field label="Type">
            <select value={bookForm.type} onChange={(e) => setBookForm((f) => ({ ...f, type: e.target.value }))} className={inputClass}>
              <option>Cash</option><option>Bank</option><option>UPI</option><option>Petty Cash</option>
            </select>
          </Field>
          <Field label="Bank name"><input value={bookForm.bankName} onChange={(e) => setBookForm((f) => ({ ...f, bankName: e.target.value }))} className={inputClass} /></Field>
          <Field label="Account number"><input value={bookForm.accountNumber} onChange={(e) => setBookForm((f) => ({ ...f, accountNumber: e.target.value }))} className={inputClass} /></Field>
          <Field label="IFSC"><input value={bookForm.ifsc} onChange={(e) => setBookForm((f) => ({ ...f, ifsc: e.target.value }))} className={inputClass} /></Field>
          <Field label="Opening balance"><input type="number" min="0" value={bookForm.openingBalance} onChange={(e) => setBookForm((f) => ({ ...f, openingBalance: e.target.value }))} className={inputClass} /></Field>
        </div>
      </Modal>
    </section>
  )
}
