import { useCallback, useEffect, useMemo, useState } from 'react'
import { CreditCard, IndianRupee, Receipt, X } from 'lucide-react'
import {
  getMyFees,
  submitMyFeePayment,
} from '../../../services/studentFeeService.js'
import { getStudentSession } from '../../../utils/studentAuth.js'
import { subscribeStudentNotifications } from '../../../utils/socket.js'
import {
  Panel,
  PrimaryButton,
  ProgressBar,
  SecondaryButton,
  StatCard,
  StatusBadge,
  formatINR,
} from '../shared/StudentUI.jsx'

const PAY_METHODS = ['UPI', 'Card', 'Net Banking', 'Wallet']

const emptyPayForm = () => ({
  amount: '',
  method: 'UPI',
  installmentId: '',
  note: '',
})

export default function FeeManagementPage() {
  const [details, setDetails] = useState([])
  const [stats, setStats] = useState({})
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [payForm, setPayForm] = useState(emptyPayForm)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getMyFees()
      const list = Array.isArray(data.details) && data.details.length
        ? data.details
        : Array.isArray(data.rows)
          ? data.rows
          : []
      setDetails(list)
      setStats(data.stats || {})
      setSelectedId((prev) => {
        if (prev && list.some((d) => d._id === prev || d.feeId === prev)) return prev
        return list[0]?._id || list[0]?.feeId || ''
      })
    } catch (err) {
      setError(err?.message || 'Unable to load fees')
      setDetails([])
      setStats({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    const session = getStudentSession()
    const email = session?.email
    if (!email) return undefined
    return subscribeStudentNotifications({ email }, (incoming) => {
      const type = String(incoming?.type || '').toLowerCase()
      if (type === 'fee') {
        reload()
        setToast(incoming?.title || 'Fee payment approved successfully')
      }
    })
  }, [reload])

  const selected = useMemo(
    () =>
      details.find((d) => d._id === selectedId || d.feeId === selectedId) || null,
    [details, selectedId],
  )

  const aggregate = useMemo(() => {
    const total = details.reduce((s, d) => s + (Number(d.totalAmount) || 0), 0)
    const paid = details.reduce((s, d) => s + (Number(d.paidAmount) || 0), 0)
    const due = details.reduce((s, d) => s + (Number(d.dueAmount) || 0), 0)
    const pendingPays = details.reduce(
      (s, d) => s + (Number(d.pendingPayments) || 0),
      0,
    )
    const nextDue =
      details
        .map((d) => d.nextDueDate)
        .filter(Boolean)
        .sort()[0] || null
    return { total, paid, due, pendingPays, nextDue }
  }, [details])

  const paidPct = aggregate.total
    ? Math.round((aggregate.paid / aggregate.total) * 100)
    : 0

  const openPay = () => {
    if (!selected) return
    const nextOpen = (selected.installments || []).find((i) => i.status !== 'Paid')
    const pendingSum = (selected.payments || [])
      .filter((p) => String(p.status).toLowerCase() === 'pending')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0)
    const available = Math.max(0, (Number(selected.dueAmount) || 0) - pendingSum)
    const suggested = nextOpen?.due
      ? Math.min(Number(nextOpen.due) || 0, available)
      : available
    setPayForm({
      ...emptyPayForm(),
      amount: suggested > 0 ? String(suggested) : '',
      installmentId: nextOpen?.id || '',
    })
    setPayOpen(true)
    setError('')
  }

  const handleSubmitPay = async (e) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      const entry = await submitMyFeePayment(selected.feeId || selected._id, {
        amount: payForm.amount,
        method: payForm.method,
        mode: 'Online',
        installmentId: payForm.installmentId || undefined,
        note: payForm.note || 'Student online fee submission',
      })
      setDetails((prev) =>
        prev.map((d) =>
          d._id === entry._id || d.feeId === entry.feeId ? entry : d,
        ),
      )
      setPayOpen(false)
      setToast('Payment submitted — status Pending until admin approval')
      await reload()
    } catch (err) {
      setError(err?.message || 'Unable to submit payment')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="space-y-3">
        <p className="rounded-lg border border-slate-200 bg-white px-3 py-8 text-center text-sm text-slate-500">
          Loading fee details…
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      {toast ? (
        <div className="fixed right-3 top-3 z-[90] max-w-[calc(100vw-1.5rem)] rounded-lg bg-[#008C95] px-4 py-2 text-sm font-medium text-white shadow-lg sm:right-4 sm:top-4">
          {toast}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Fees" value={formatINR(aggregate.total)} icon={IndianRupee} />
        <StatCard label="Paid Fees" value={formatINR(aggregate.paid)} icon={CreditCard} />
        <StatCard label="Remaining Fees" value={formatINR(aggregate.due)} icon={Receipt} />
        <StatCard
          label="Pending Approvals"
          value={String(aggregate.pendingPays)}
          hint={
            aggregate.nextDue
              ? `Next due ${new Date(aggregate.nextDue).toLocaleDateString('en-IN')}`
              : stats.pending || undefined
          }
        />
      </div>

      {!details.length ? (
        <Panel title="No fee records">
          <p className="text-sm text-slate-500">
            Fee details appear after your admission is approved for a course. If you
            already have an approved course, ask the institute to sync fees.
          </p>
        </Panel>
      ) : (
        <>
          <Panel title="Your courses">
            <div className="flex flex-wrap gap-2">
              {details.map((d) => {
                const active = d._id === selectedId || d.feeId === selectedId
                return (
                  <button
                    key={d._id || d.feeId}
                    type="button"
                    onClick={() => setSelectedId(d._id || d.feeId)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'border-[#008C95] bg-[#008C95]/15 text-[#005F6B]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#008C95]/40'
                    }`}
                  >
                    {d.course || d.feeId}
                    {d.hasPendingPayments || d.pendingPayments > 0 ? (
                      <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                        Pending
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </Panel>

          {selected ? (
            <div className="grid gap-3 lg:grid-cols-3">
              <Panel
                title={`${selected.course || 'Course'} · Fee progress`}
                className="lg:col-span-2"
                action={<StatusBadge status={selected.status} />}
              >
                <ProgressBar
                  value={
                    selected.totalAmount
                      ? Math.round(
                          ((Number(selected.paidAmount) || 0) / selected.totalAmount) * 100,
                        )
                      : paidPct
                  }
                  label="Course fee completion"
                  color="teal"
                />
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <p>
                    <span className="text-xs uppercase text-slate-400">Total</span>
                    <br />
                    <span className="font-semibold text-slate-800">
                      {selected.amount || formatINR(selected.totalAmount)}
                    </span>
                  </p>
                  <p>
                    <span className="text-xs uppercase text-slate-400">Paid</span>
                    <br />
                    <span className="font-semibold text-slate-800">
                      {selected.paid || formatINR(selected.paidAmount)}
                    </span>
                  </p>
                  <p>
                    <span className="text-xs uppercase text-slate-400">Due</span>
                    <br />
                    <span className="font-semibold text-slate-800">
                      {selected.due || formatINR(selected.dueAmount)}
                    </span>
                  </p>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500">
                        <th className="px-3 py-3 font-medium">Installment</th>
                        <th className="px-3 py-3 font-medium">Amount</th>
                        <th className="px-3 py-3 font-medium">Due Date</th>
                        <th className="px-3 py-3 font-medium">Paid Date</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.installments || []).map((row) => (
                        <tr key={row.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-medium text-slate-800">{row.label}</td>
                          <td className="px-3 py-3">{row.amountLabel || formatINR(row.amount)}</td>
                          <td className="px-3 py-3">{row.dueDate || '—'}</td>
                          <td className="px-3 py-3">{row.paidDate || '—'}</td>
                          <td className="px-3 py-3">
                            <StatusBadge status={row.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <PrimaryButton
                    onClick={openPay}
                    disabled={!selected.dueAmount || selected.dueAmount <= 0}
                  >
                    <IndianRupee size={14} />
                    Pay Online
                  </PrimaryButton>
                </div>
              </Panel>

              <Panel title="Summary">
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>
                    <span className="font-semibold text-slate-800">Fee ID:</span> {selected.feeId}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Admission:</span>{' '}
                    {selected.admissionId || '—'}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Installment:</span>{' '}
                    {selected.installment}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Next due:</span>{' '}
                    {selected.date || '—'}
                  </li>
                </ul>
                <p className="mt-4 text-xs text-slate-500">
                  Online payments stay <strong>Pending</strong> until the institute admin
                  approves them. You will get a notification when approved.
                </p>
              </Panel>
            </div>
          ) : null}

          {selected ? (
            <Panel title="Payment History & Invoices">
              {(selected.payments || []).length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500">
                        <th className="px-3 py-3 font-medium">Payment ID</th>
                        <th className="px-3 py-3 font-medium">Invoice</th>
                        <th className="px-3 py-3 font-medium">Method</th>
                        <th className="px-3 py-3 font-medium">Amount</th>
                        <th className="px-3 py-3 font-medium">Date</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.payments.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100">
                          <td className="px-3 py-3">{row.id}</td>
                          <td className="px-3 py-3">{row.invoice || '—'}</td>
                          <td className="px-3 py-3">{row.method}</td>
                          <td className="px-3 py-3 font-medium">
                            {row.amountLabel || formatINR(row.amount)}
                          </td>
                          <td className="px-3 py-3">{row.date}</td>
                          <td className="px-3 py-3">
                            <StatusBadge status={row.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No payments yet for this course.</p>
              )}
            </Panel>
          ) : null}
        </>
      )}

      {payOpen && selected ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Submit online fee</h3>
                <p className="text-xs text-slate-500">{selected.course}</p>
              </div>
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleSubmitPay}>
              <label className="block text-xs font-medium text-slate-600">
                Amount (₹)
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={payForm.amount}
                  onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A896]"
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Installment (optional)
                <select
                  value={payForm.installmentId}
                  onChange={(e) =>
                    setPayForm((p) => ({ ...p, installmentId: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A896]"
                >
                  <option value="">Auto (next due)</option>
                  {(selected.installments || [])
                    .filter((i) => i.status !== 'Paid')
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.label} · {i.dueLabel || formatINR(i.due)}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Payment method
                <select
                  value={payForm.method}
                  onChange={(e) => setPayForm((p) => ({ ...p, method: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A896]"
                >
                  {PAY_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Note
                <input
                  value={payForm.note}
                  onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A896]"
                  placeholder="Optional reference / UPI txn id"
                />
              </label>
              <p className="text-xs text-amber-700">
                After submit, status will show as <strong>Pending</strong> until admin
                approval.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <SecondaryButton onClick={() => setPayOpen(false)} disabled={saving}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton onClick={handleSubmitPay} disabled={saving}>
                  {saving ? 'Submitting…' : 'Submit payment'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
