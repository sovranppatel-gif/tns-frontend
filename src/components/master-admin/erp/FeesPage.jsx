import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  Download,
  Eye,
  IndianRupee,
  Pencil,
  Printer,
  RefreshCw,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Check,
  X,
  Percent,
} from 'lucide-react'
import {
  getFeeById,
  getFees,
  recordFeePayment,
  updateFeePayment,
} from '../../../services/feeService.js'
import { printFeeReceipt, downloadFeeReceipt, buildFeeReceiptFileName, printFeeSchedule } from '../../../utils/printFeeReceipt.js'
import {
  StatCard,
  Panel,
  PageToolbar,
  DataTable,
  Pagination,
  StatusBadge,
  ProgressBar,
  Modal,
  useClientTable,
  downloadCsv,
  formatINR,
} from '../shared/MasterAdminUI.jsx'
import { DateInput } from '../../shared/DateInput.jsx'
import { primaryBtn, secondaryBtn } from '../../../utils/masterAdminTheme.js'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'student', label: 'Student' },
  { key: 'course', label: 'Course' },
  { key: 'category', label: 'Category' },
  { key: 'installment', label: 'Installment' },
  { key: 'amount', label: 'Amount' },
  { key: 'paid', label: 'Paid' },
  { key: 'due', label: 'Due' },
  { key: 'status', label: 'Status' },
]

const emptyPaymentForm = {
  amount: '',
  method: 'UPI',
  note: '',
  installmentId: '',
}

const FEE_TYPE_OPTIONS = [
  { id: 'INS-REG', label: 'Registration Fee' },
  { id: 'INS-BAL', label: 'Tuition Fee' },
  { id: 'INS-EXAM', label: 'Exam Fee' },
  { id: 'INS-LIB', label: 'Library Fee' },
  { id: 'INS-APP', label: 'Apps Fee' },
  { id: 'INS-LAB', label: 'Lab Fee' },
  { id: 'INS-HOST', label: 'Hostel Fee' },
  { id: 'INS-TRANS', label: 'Transport Fee' },
  { id: 'INS-OTHER', label: 'Other Fee' },
]

const emptyEditForm = {
  amount: '',
  method: 'UPI',
  status: 'Success',
  date: '',
  invoice: '',
  note: '',
  installmentId: '',
}

function toDateInputValue(raw) {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatDateTime(raw, fallback = '—') {
  const d = raw ? new Date(raw) : null
  if (!d || Number.isNaN(d.getTime())) return fallback
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function isUtcMidnight(raw) {
  const d = raw ? new Date(raw) : null
  if (!d || Number.isNaN(d.getTime())) return false
  return d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0
}

function paymentTimestamp(raw, fallback = 0) {
  const d = raw ? new Date(raw) : null
  if (!d || Number.isNaN(d.getTime())) return fallback
  return d.getTime()
}

function paymentIdNum(id) {
  const m = String(id || '').match(/(\d+)/)
  return m ? Number(m[1]) : 0
}

function isLegacyRefund(p) {
  return String(p.status || '').toLowerCase() === 'refunded' && !p.refundedAt && isUtcMidnight(p.dateRaw || p.date)
}

function paymentTimelineItems(detail) {
  const payments = [...(detail?.payments || [])]

  const realPaidAt = (p) => (isLegacyRefund(p) ? 0 : paymentTimestamp(p.dateRaw || p.date))

  const interpolateAfterEarlierPayments = (p) => {
    const myId = paymentIdNum(p.id)
    const earlier = payments
      .map((q) => (paymentIdNum(q.id) < myId ? realPaidAt(q) : 0))
      .filter(Boolean)
    const base = earlier.length ? Math.max(...earlier) : paymentTimestamp(p.dateRaw || p.date)
    return base + myId
  }

  const refundEventTime = (p) => {
    // Date-only midnight (05:30 IST) lost the real clock time. Don't let a
    // later refundedAt stamp jump this row past newer payments like PAY-4326.
    if (isUtcMidnight(p.dateRaw || p.date)) return interpolateAfterEarlierPayments(p)
    const refundAt = paymentTimestamp(p.refundedAt)
    if (refundAt) return refundAt
    return interpolateAfterEarlierPayments(p)
  }

  const events = []
  for (const p of payments) {
    const status = String(p.status || 'Success').toLowerCase()
    const refunded = status === 'refunded'
    const paidAt = paymentTimestamp(p.dateRaw || p.date)
    const refundAt = paymentTimestamp(p.refundedAt)

    if (refunded) {
      const keepPaidEvent = Boolean(paidAt && !isUtcMidnight(p.dateRaw || p.date))
      if (keepPaidEvent) {
        events.push({
          ...p,
          kind: 'paid',
          statusKey: 'success',
          at: paidAt,
          hadPaidEvent: true,
        })
      }
      events.push({
        ...p,
        kind: 'refund',
        statusKey: 'refunded',
        at: refundEventTime(p),
        hadPaidEvent: keepPaidEvent,
      })
    } else {
      events.push({
        ...p,
        kind: 'paid',
        statusKey: status,
        at: paidAt,
      })
    }
  }

  events.sort((a, b) => {
    const minuteA = Math.floor(a.at / 60000)
    const minuteB = Math.floor(b.at / 60000)
    if (minuteA !== minuteB) return a.at - b.at
    return (
      paymentIdNum(a.id) - paymentIdNum(b.id) ||
      (a.kind === 'paid' ? 0 : 1) - (b.kind === 'paid' ? 0 : 1)
    )
  })

  let remaining = Number(detail?.totalAmount) || 0
  return events.map((p) => {
    const ok = p.kind === 'paid' && /^(success|paid|completed)$/i.test(p.statusKey)
    if (ok) remaining = Math.max(0, remaining - (Number(p.amount) || 0))
    if (p.kind === 'refund' && p.hadPaidEvent) remaining += Number(p.amount) || 0
    const whenRaw =
      p.kind === 'refund'
        ? isUtcMidnight(p.dateRaw || p.date)
          ? null
          : p.refundedAt || p.dateRaw
        : p.dateRaw
    return {
      ...p,
      when: whenRaw
        ? formatDateTime(whenRaw, p.date)
        : formatDateTime(new Date(p.at).toISOString(), p.date),
      remainingAfter: remaining,
    }
  })
}

function slugifyStudentName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function studentFeeSlug(row, allRows = []) {
  const base = slugifyStudentName(row?.student) || slugifyStudentName(row?.feeId || row?.id)
  if (!base) return String(row?.feeId || row?.id || row?._id || '')
  const sameName = allRows.filter(
    (item) => slugifyStudentName(item.student) === slugifyStudentName(row.student),
  )
  if (sameName.length <= 1) return base
  const idPart = slugifyStudentName(row.feeId || row.id || row._id)
  return idPart ? `${base}--${idPart}` : base
}

function isRegistrationInstallment(ins) {
  return (
    String(ins?.id || '') === 'INS-REG' ||
    /registration\s*fee/i.test(String(ins?.label || ''))
  )
}

function nextOpenInstallment(installments = []) {
  return (
    installments.find((i) => isRegistrationInstallment(i) && i.status !== 'Paid') ||
    installments.find((i) => i.status !== 'Paid') ||
    null
  )
}

function matchFeeRow(rows, slug) {
  if (!slug || !rows?.length) return null
  let key = String(slug)
  try {
    key = decodeURIComponent(key)
  } catch {
    /* keep raw */
  }
  return (
    rows.find((row) => studentFeeSlug(row, rows) === key) ||
    rows.find((row) => slugifyStudentName(row.student) === key) ||
    rows.find(
      (row) =>
        String(row.feeId) === key ||
        String(row.id) === key ||
        String(row._id) === key ||
        String(row.admissionId) === key,
    ) ||
    null
  )
}

export default function FeesPage() {
  const navigate = useNavigate()
  const { feeStudentSlug } = useParams()
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)
  const [recordMode, setRecordMode] = useState('payment')
  const [paymentBusy, setPaymentBusy] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [editForm, setEditForm] = useState(emptyEditForm)
  const [editBusy, setEditBusy] = useState(false)

  const reload = useCallback(async () => {
    try {
      setError('')
      setLoading(true)
      const data = await getFees()
      setRows(data.rows)
      setStats(data.stats || {})
    } catch (err) {
      setError(err?.message || 'Unable to load fees')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const loadDetail = useCallback(async (rowOrId) => {
    const id = typeof rowOrId === 'string' ? rowOrId : rowOrId?.feeId || rowOrId?.id || rowOrId?._id
    if (!id) return
    setSelectedId(id)
    setError('')

    // Instant shell from list row so the page feels responsive
    if (rowOrId && typeof rowOrId === 'object') {
      setDetail((prev) => {
        if (prev && (prev.feeId === id || prev.id === id || prev._id === id) && prev.installments?.length) {
          return prev
        }
        return {
          ...rowOrId,
          feeId: rowOrId.feeId || rowOrId.id,
          installments: [],
          payments: [],
          courseFees: rowOrId.courseFees || {},
          totalAmount: rowOrId.totalAmount ?? 0,
          paidAmount: rowOrId.paidAmount ?? 0,
          dueAmount: rowOrId.dueAmount ?? 0,
        }
      })
    }

    setDetailLoading(true)
    try {
      const entry = await getFeeById(id)
      setDetail(entry)
      const nextOpen = nextOpenInstallment(entry.installments)
      setPaymentForm({
        ...emptyPaymentForm,
        amount: nextOpen?.due ? String(nextOpen.due) : entry.dueAmount ? String(entry.dueAmount) : '',
        installmentId: nextOpen?.id || '',
      })
    } catch (err) {
      setError(err?.message || 'Unable to load fee details')
      // Keep shell if we already have list data
      setDetail((prev) => (prev && (prev.feeId === id || prev.id === id) ? prev : null))
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const closeDetail = () => {
    navigate('/master-admin/fees')
  }

  const openStudent = useCallback(
    (row) => {
      const slug = studentFeeSlug(row, rows)
      if (!slug) return
      navigate(`/master-admin/fees/${encodeURIComponent(slug)}`)
    },
    [navigate, rows],
  )

  useEffect(() => {
    if (!feeStudentSlug) {
      setSelectedId('')
      setDetail(null)
      setPaymentForm(emptyPaymentForm)
      setEditingPayment(null)
      setEditForm(emptyEditForm)
      return
    }
    if (!rows.length) return
    const row = matchFeeRow(rows, feeStudentSlug)
    if (!row) {
      setError('Fee record not found for this student')
      setSelectedId('')
      setDetail(null)
      return
    }
    const id = String(row.feeId || row.id || row._id || '')
    if (selectedId === id) return
    loadDetail(row)
  }, [feeStudentSlug, rows, selectedId, loadDetail])

  const table = useClientTable(rows, {
    searchKeys: ['id', 'student', 'course', 'category', 'email', 'admissionId'],
    pageSize: 8,
    filterKey: 'status',
  })

  const filterOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.status).filter(Boolean))
    return [...set]
  }, [rows])

  const paidPct = useMemo(() => {
    if (!detail?.totalAmount) return 0
    return Math.min(100, Math.round((detail.paidAmount / detail.totalAmount) * 100))
  }, [detail])

  const registrationIns = useMemo(
    () => (detail?.installments || []).find((i) => isRegistrationInstallment(i)) || null,
    [detail],
  )

  const feeTypeOptions = useMemo(() => {
    const installments = detail?.installments || []
    return FEE_TYPE_OPTIONS.map((opt) => {
      const ins =
        installments.find((i) => i.id === opt.id) ||
        (opt.id === 'INS-BAL'
          ? installments.find((i) =>
              /tuition|remaining|course fee/i.test(`${i.label || ''} ${i.category || ''}`),
            )
          : null)
      return {
        ...opt,
        installmentId: ins?.id || opt.id,
        due: ins?.due || 0,
        dueLabel: ins?.dueLabel || '',
        status: ins?.status || '',
      }
    })
  }, [detail])

  const selectFeeType = (insOrId) => {
    const id = typeof insOrId === 'string' ? insOrId : insOrId?.id
    if (!id) return
    const opt = feeTypeOptions.find((o) => o.id === id || o.installmentId === id)
    const due = opt?.due || (typeof insOrId === 'object' ? insOrId?.due : 0)
    setRecordMode('payment')
    setPaymentForm((prev) => ({
      ...prev,
      installmentId: opt?.id || id,
      amount: due ? String(due) : prev.amount,
    }))
  }

  const selectedFeeType = feeTypeOptions.find((o) => o.id === paymentForm.installmentId)

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!detail?._id && !detail?.feeId) return
    setPaymentBusy(true)
    setError('')
    try {
      const isDiscount = recordMode === 'discount'
      const entry = await recordFeePayment(detail.feeId || detail._id, {
        amount: paymentForm.amount,
        method: isDiscount ? 'Discount' : paymentForm.method,
        type: isDiscount ? 'discount' : 'payment',
        note: paymentForm.note,
        installmentId: paymentForm.installmentId || undefined,
        feeType: paymentForm.installmentId || undefined,
      })
      setDetail(entry)
      setToast(isDiscount ? `Discount applied on ${entry.feeId}` : `Payment recorded for ${entry.feeId}`)
      await reload()
      const nextOpen = nextOpenInstallment(entry.installments)
      setPaymentForm({
        ...emptyPaymentForm,
        amount: nextOpen?.due ? String(nextOpen.due) : entry.dueAmount ? String(entry.dueAmount) : '',
        installmentId: nextOpen?.id || '',
      })
    } catch (err) {
      setError(err?.message || (recordMode === 'discount' ? 'Unable to apply discount' : 'Unable to record payment'))
    } finally {
      setPaymentBusy(false)
    }
  }

  const handlePrintSchedule = () => {
    try {
      setError('')
      const fileName = printFeeSchedule(detail)
      setToast(`Print ready · Save as “${fileName}”`)
    } catch (err) {
      setError(err?.message || 'Unable to print fee schedule')
    }
  }

  const handlePrintReceipt = (payment) => {
    try {
      setError('')
      const fileName = buildFeeReceiptFileName(detail, payment, 'pdf')
      printFeeReceipt(detail, payment)
      setToast(`Print ready · Save as “${fileName}”`)
    } catch (err) {
      setError(err?.message || 'Unable to print receipt')
    }
  }

  const handleDownloadReceipt = (payment) => {
    try {
      setError('')
      const fileName = downloadFeeReceipt(detail, payment)
      setToast(`Downloaded · ${fileName}`)
    } catch (err) {
      setError(err?.message || 'Unable to download receipt')
    }
  }

  const openEditPayment = (payment) => {
    setEditingPayment(payment)
    setEditForm({
      amount: String(payment.amount ?? ''),
      method: payment.method || 'UPI',
      status: payment.status || 'Success',
      date: toDateInputValue(payment.dateRaw || payment.date),
      invoice: payment.invoice || '',
      note: payment.note || '',
      installmentId: payment.installmentId || '',
    })
  }

  const closeEditPayment = () => {
    setEditingPayment(null)
    setEditForm(emptyEditForm)
  }

  const handleSaveEditPayment = async (e) => {
    e.preventDefault()
    if (!detail || !editingPayment?.id) return
    setEditBusy(true)
    setError('')
    try {
      const originalDay = toDateInputValue(editingPayment.dateRaw || editingPayment.date)
      const entry = await updateFeePayment(detail.feeId || detail._id, editingPayment.id, {
        amount: editForm.amount,
        method: editForm.method,
        status: editForm.status,
        date:
          !editForm.date
            ? undefined
            : editForm.date === originalDay && editingPayment.dateRaw
              ? editingPayment.dateRaw
              : editForm.date,
        invoice: editForm.invoice,
        note: editForm.note,
        installmentId: editForm.installmentId,
      })
      setDetail(entry)
      setToast(`Payment ${editingPayment.id} updated`)
      closeEditPayment()
      await reload()
      const nextOpen = nextOpenInstallment(entry.installments)
      setPaymentForm({
        ...emptyPaymentForm,
        amount: nextOpen?.due ? String(nextOpen.due) : entry.dueAmount ? String(entry.dueAmount) : '',
        installmentId: nextOpen?.id || '',
      })
    } catch (err) {
      setError(err?.message || 'Unable to update payment')
    } finally {
      setEditBusy(false)
    }
  }

  const handleApprovePayment = async (payment) => {
    if (!detail || !payment?.id) return
    const ok = window.confirm(
      `Approve payment ${payment.id} (${payment.amountLabel || payment.amount})?\n\nStudent will get a success notification and fee totals will update.`,
    )
    if (!ok) return
    setEditBusy(true)
    setError('')
    try {
      const entry = await updateFeePayment(detail.feeId || detail._id, payment.id, {
        status: 'Success',
      })
      setDetail(entry)
      setToast(`Payment ${payment.id} approved — student notified`)
      await reload()
    } catch (err) {
      setError(err?.message || 'Unable to approve payment')
    } finally {
      setEditBusy(false)
    }
  }

  const handleRejectPayment = async (payment) => {
    if (!detail || !payment?.id) return
    const ok = window.confirm(`Reject / fail payment ${payment.id}?`)
    if (!ok) return
    setEditBusy(true)
    setError('')
    try {
      const entry = await updateFeePayment(detail.feeId || detail._id, payment.id, {
        status: 'Failed',
      })
      setDetail(entry)
      setToast(`Payment ${payment.id} marked Failed`)
      await reload()
    } catch (err) {
      setError(err?.message || 'Unable to reject payment')
    } finally {
      setEditBusy(false)
    }
  }

  const actionBtn =
    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition'

  const tableColumns = [
    ...columns.map((c) =>
      c.key === 'status'
        ? {
            ...c,
            render: (row) => (
              <div className="flex flex-wrap items-center gap-1">
                <StatusBadge status={row.status} />
                {row.hasPendingPayments || row.pendingPayments > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    {row.pendingPayments} pending
                  </span>
                ) : null}
              </div>
            ),
          }
        : c.key === 'course'
          ? {
              ...c,
              render: (row) => (
                <span
                  className="block max-w-[10rem] truncate sm:max-w-[14rem] md:max-w-[220px]"
                  title={row.course}
                >
                  {row.course || '—'}
                </span>
              ),
            }
          : c,
    ),
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            openStudent(row)
          }}
          className={`${actionBtn} border-[#008C95]/30 bg-[#008C95]/10 text-[#008C95] hover:bg-[#008C95]/15`}
        >
          <Eye size={12} /> View
        </button>
      ),
    },
  ]

  const editModal = (
    <Modal
      open={Boolean(editingPayment)}
      title={editingPayment ? `Edit payment · ${editingPayment.id}` : 'Edit payment'}
      onClose={closeEditPayment}
      wide
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={closeEditPayment} className={secondaryBtn} disabled={editBusy}>
            Cancel
          </button>
          <button type="submit" form="edit-payment-form" className={primaryBtn} disabled={editBusy}>
            {editBusy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      }
    >
      {editingPayment ? (
        <form id="edit-payment-form" className="space-y-3" onSubmit={handleSaveEditPayment}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-600">
              Amount (₹)
              <input
                required
                type="number"
                min="0"
                step="1"
                value={editForm.amount}
                onChange={(e) => setEditForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A896]"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Payment date
              <DateInput
                value={editForm.date}
                onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A896]"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Method
              <select
                value={editForm.method}
                onChange={(e) => setEditForm((prev) => ({ ...prev, method: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#00A896]"
              >
                {['UPI', 'Cash', 'NEFT', 'Card', 'Cheque', 'Discount', 'Other'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Status
              <select
                value={editForm.status}
                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#00A896]"
              >
                {['Success', 'Pending', 'Failed', 'Cancelled', 'Refunded'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Invoice no.
              <input
                type="text"
                value={editForm.invoice}
                onChange={(e) => setEditForm((prev) => ({ ...prev, invoice: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A896]"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Apply to installment
              <select
                value={editForm.installmentId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, installmentId: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#00A896]"
              >
                <option value="">Auto (next due)</option>
                {FEE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-xs font-medium text-slate-600">
            Note
            <textarea
              rows={3}
              value={editForm.note}
              onChange={(e) => setEditForm((prev) => ({ ...prev, note: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A896]"
              placeholder="Optional remark"
            />
          </label>
          <p className="text-[11px] text-slate-500">
            Saving recalculates installment paid/due from all successful payments. Mark as
            Cancelled/Failed/Refunded to exclude this payment from dues.
          </p>
        </form>
      ) : null}
    </Modal>
  )

  if (feeStudentSlug || selectedId || detail) {
    return (
      <section className="w-full min-w-0 space-y-3 overflow-x-hidden">
        {toast ? (
          <div className="fixed right-3 top-3 z-[90] max-w-[calc(100vw-1.5rem)] rounded-lg bg-[#008C95] px-4 py-2 text-sm font-medium text-white shadow-lg sm:right-4 sm:top-4">
            {toast}
          </div>
        ) : null}

        {editModal}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={closeDetail} className={secondaryBtn}>
            <ArrowLeft size={14} /> Back to fee list
          </button>
          <button
            type="button"
            onClick={() => loadDetail(selectedId)}
            className={secondaryBtn}
            disabled={detailLoading}
          >
            <RefreshCw size={14} className={detailLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading || (detailLoading && !detail) ? (
          <Panel title="Fee details">
            <p className="py-8 text-center text-sm text-slate-500">Loading fee details…</p>
          </Panel>
        ) : detail ? (
          <>
            {detailLoading ? (
              <p className="text-xs text-slate-500">Refreshing installment & payment details…</p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Fees" value={formatINR(detail.totalAmount)} icon={IndianRupee} />
              <StatCard label="Paid" value={formatINR(detail.paidAmount)} icon={CheckCircle2} />
              <StatCard label="Due" value={formatINR(detail.dueAmount)} icon={Wallet} />
              <StatCard
                label="Next Due"
                value={
                  detail.installments?.find((i) => i.status !== 'Paid')?.dueDate ||
                  (detail.status === 'Paid' ? 'Cleared' : '—')
                }
                icon={AlertTriangle}
              />
            </div>

            <Panel
              title={`${detail.feeId} · ${detail.student}`}
              action={<StatusBadge status={detail.status} />}
            >
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Course</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{detail.course}</p>
                  {detail.courseCode ? (
                    <p className="text-xs text-slate-500">{detail.courseCode}</p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Admission</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{detail.admissionId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Contact</p>
                  <p className="mt-0.5 font-medium text-slate-800">{detail.email || '—'}</p>
                  <p className="text-xs text-slate-500">{detail.phone || ''}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Installments</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{detail.installment}</p>
                  <p className="text-xs text-slate-500">Pay any amount anytime — ₹1,000, ₹2,000 or full</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Course fee structure
                  </p>
                  <p className="mt-0.5 text-slate-700">
                    Total: {detail.courseFees?.total || detail.amount}
                  </p>
                  <p className="text-xs text-slate-600">
                    Registration:{' '}
                    <span className="font-semibold text-slate-800">
                      {registrationIns
                        ? `${registrationIns.amountLabel} · ${
                            registrationIns.status === 'Paid'
                              ? 'Paid'
                              : `Due ${registrationIns.dueLabel}`
                          }`
                        : detail.courseFees?.registration || 'Set from course'}
                    </span>
                  </p>
                  {detail.courseFees?.exam ? (
                    <p className="text-xs text-slate-500">Exam: {detail.courseFees.exam}</p>
                  ) : null}
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    Remaining: {formatINR(detail.dueAmount)}
                  </p>
                  {Number(detail.discountAmount) > 0 ? (
                    <p className="text-xs font-medium text-[#008C95]">
                      Discount: {formatINR(detail.discountAmount)}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Category</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{detail.category}</p>
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar value={paidPct} label="Overall fee completion" color="teal" />
              </div>
            </Panel>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <Panel title="Payment history & invoices" className="min-w-0 overflow-hidden">
                {(detail.payments || []).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center">
                    <p className="text-sm font-semibold text-slate-800">No payments yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Record registration fee or remaining course fee from this page. Entries will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="max-w-full overflow-x-auto">
                    <table className="w-max min-w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500">
                          <th className="whitespace-nowrap px-2 py-2 font-medium">Payment ID</th>
                          <th className="whitespace-nowrap px-2 py-2 font-medium">Invoice</th>
                          <th className="whitespace-nowrap px-2 py-2 font-medium">Method</th>
                          <th className="whitespace-nowrap px-2 py-2 font-medium">Amount</th>
                          <th className="whitespace-nowrap px-2 py-2 font-medium">Date</th>
                          <th className="whitespace-nowrap px-2 py-2 font-medium">Status</th>
                          <th className="whitespace-nowrap px-2 py-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.payments.map((p) => (
                          <tr key={p.id} className="border-b border-slate-100">
                            <td className="whitespace-nowrap px-2 py-2">{p.id}</td>
                            <td className="whitespace-nowrap px-2 py-2">{p.invoice || '—'}</td>
                            <td className="whitespace-nowrap px-2 py-2">{p.method}</td>
                            <td className="whitespace-nowrap px-2 py-2 font-medium">{p.amountLabel}</td>
                            <td className="whitespace-nowrap px-2 py-2">{formatDateTime(p.dateRaw, p.date)}</td>
                            <td className="whitespace-nowrap px-2 py-2">
                              <StatusBadge status={p.status} />
                            </td>
                            <td className="whitespace-nowrap px-2 py-2">
                              <div className="flex flex-nowrap items-center gap-1">
                                {String(p.status || '').toLowerCase() === 'pending' ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={editBusy}
                                      onClick={() => handleApprovePayment(p)}
                                      className={`${actionBtn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50`}
                                      title="Approve student payment"
                                    >
                                      <Check size={12} /> Approve
                                    </button>
                                    <button
                                      type="button"
                                      disabled={editBusy}
                                      onClick={() => handleRejectPayment(p)}
                                      className={`${actionBtn} border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50`}
                                      title="Reject payment"
                                    >
                                      <X size={12} /> Reject
                                    </button>
                                  </>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => handlePrintReceipt(p)}
                                  className={`${actionBtn} border-[#FF5E14]/30 bg-[#FF5E14]/10 text-[#FF5E14] hover:bg-[#FF5E14]/15`}
                                  title={`Print · ${buildFeeReceiptFileName(detail, p, 'pdf')}`}
                                >
                                  <Printer size={12} /> Print
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadReceipt(p)}
                                  className={`${actionBtn} border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100`}
                                  title={`Download · ${buildFeeReceiptFileName(detail, p, 'html')}`}
                                >
                                  <Download size={12} /> Download
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditPayment(p)}
                                  className={`${actionBtn} border-[#008C95]/30 bg-[#008C95]/10 text-[#008C95] hover:bg-[#008C95]/15`}
                                  title="Edit payment"
                                >
                                  <Pencil size={12} /> Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>

              <Panel title={recordMode === 'discount' ? 'Apply discount' : 'Record payment'}>
                {detail.dueAmount <= 0 ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-4 text-center text-sm text-emerald-800">
                    All dues cleared for this student.
                  </div>
                ) : (
                  <form className="space-y-3" onSubmit={handleRecordPayment}>
                    <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setRecordMode('payment')}
                        className={`rounded-md px-2 py-1.5 text-xs font-semibold ${
                          recordMode === 'payment'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecordMode('discount')}
                        className={`rounded-md px-2 py-1.5 text-xs font-semibold ${
                          recordMode === 'discount'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Discount
                      </button>
                    </div>
                    <label className="block text-xs font-medium text-slate-600">
                      Amount (₹)
                      <input
                        required
                        type="number"
                        min="1"
                        max={detail.dueAmount || undefined}
                        value={paymentForm.amount}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A896]"
                        placeholder={
                          recordMode === 'discount'
                            ? 'Discount amount — up to remaining due'
                            : 'Any amount — 1000, 2000 or full due'
                        }
                      />
                    </label>
                    {recordMode === 'payment' ? (
                      <label className="block text-xs font-medium text-slate-600">
                        Method
                        <select
                          value={paymentForm.method}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({ ...prev, method: e.target.value }))
                          }
                          className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#00A896]"
                        >
                          {['UPI', 'Cash', 'NEFT', 'Card', 'Cheque', 'Other'].map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <p className="rounded-lg border border-[#008C95]/20 bg-[#008C95]/5 px-3 py-2 text-[11px] text-slate-600">
                        Discount remaining fee se minus hoga. Cash collect nahi hota.
                      </p>
                    )}
                    <label className="block text-xs font-medium text-slate-600">
                      Fee type
                      <select
                        required
                        value={paymentForm.installmentId}
                        onChange={(e) => selectFeeType(e.target.value)}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#00A896]"
                      >
                        <option value="">Select fee type</option>
                        {feeTypeOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                            {opt.status === 'Paid'
                              ? ' · Paid'
                              : opt.due
                                ? ` · due ${opt.dueLabel}`
                                : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-slate-600">
                      {recordMode === 'discount' ? 'Reason' : 'Note'}
                      <textarea
                        rows={2}
                        value={paymentForm.note}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({ ...prev, note: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A896]"
                        placeholder={
                          recordMode === 'discount'
                            ? 'Scholarship, early bird, waiver…'
                            : 'Optional remark'
                        }
                      />
                    </label>
                    <button type="submit" disabled={paymentBusy} className={`${primaryBtn} w-full`}>
                      {recordMode === 'discount' ? <Percent size={14} /> : <CreditCard size={14} />}
                      {paymentBusy
                        ? 'Saving…'
                        : recordMode === 'discount'
                          ? 'Apply discount'
                          : selectedFeeType
                            ? `Record ${selectedFeeType.label}`
                            : 'Record payment'}
                    </button>
                  </form>
                )}
              </Panel>
            </div>

            <Panel
              title="Fee schedule"
              className="min-w-0"
              action={
                <button
                  type="button"
                  onClick={handlePrintSchedule}
                  className={secondaryBtn}
                  title="Print student details and installments"
                >
                  <Printer size={14} /> Print
                </button>
              }
            >
              <div className="space-y-2">
                {(detail.installments || []).map((ins) => {
                  const isReg = isRegistrationInstallment(ins)
                  const unpaid = ins.status !== 'Paid' && Number(ins.due) > 0
                  return (
                    <div
                      key={ins.id}
                      className={`flex flex-wrap items-start justify-between gap-x-4 gap-y-2 rounded-lg border px-3 py-2.5 ${
                        isReg
                          ? 'border-[#008C95]/30 bg-[#008C95]/5'
                          : 'border-slate-100 bg-slate-50/80'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{ins.label}</p>
                          <StatusBadge status={ins.status} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">{ins.category}</p>
                        <p className="mt-1.5 text-sm tabular-nums text-slate-700">
                          <span className="font-semibold text-slate-900">{ins.paidLabel}</span>
                          <span className="text-slate-400"> / {ins.amountLabel}</span>
                          {ins.due > 0 ? (
                            <span className="font-medium text-slate-600"> · Due {ins.dueLabel}</span>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2 text-right text-[12px] leading-5 text-slate-600">
                        <div>
                          <p>
                            <span className="text-slate-400">Due </span>
                            <span className="font-semibold text-slate-900">{ins.dueDate}</span>
                          </p>
                          <p>
                            <span className="text-slate-400">Paid </span>
                            <span className="font-medium text-slate-800">{ins.paidDate}</span>
                          </p>
                        </div>
                        {unpaid ? (
                          <button
                            type="button"
                            onClick={() => selectFeeType(ins)}
                            className={`${actionBtn} border-[#008C95]/30 bg-white text-[#008C95] hover:bg-[#008C95]/10`}
                          >
                            Collect
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-800">Payment timeline</h4>
                {(detail.payments || []).length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                    Registration fee aur course fee yahin se collect hogi. Payment record karte hi timeline update ho jayegi.
                  </p>
                ) : (
                  <ol className="relative ml-3 space-y-3 border-l border-slate-200 pl-5">
                    {paymentTimelineItems(detail).map((p) => {
                      const status = p.statusKey || String(p.status || 'Success').toLowerCase()
                      const ok = p.kind === 'paid' && (status === 'success' || status === 'paid' || status === 'completed')
                      const refunded = p.kind === 'refund' || status === 'refunded'
                      const discounted = ok && /^(discount|waiver|scholarship)$/i.test(String(p.method || ''))
                      return (
                        <li key={`tl-${p.id}-${p.kind || status}`} className="relative">
                          <span
                            className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full ${
                              refunded
                                ? 'bg-sky-500'
                                : discounted
                                  ? 'bg-violet-500'
                                  : ok
                                    ? 'bg-[#00A896]'
                                    : status === 'pending'
                                      ? 'bg-amber-400'
                                      : 'bg-[#FF5E14]'
                            }`}
                          />
                          <p className="text-sm font-semibold text-slate-900">
                            {p.id} · {p.amountLabel}
                            {refunded ? ' · Refunded' : discounted ? ' · Discount' : ''}
                          </p>
                          <p className="text-xs font-medium text-slate-800">{p.when}</p>
                          <p className="text-[11px] text-slate-500">
                            {refunded
                              ? `Refunded via ${p.method || '—'} · Remaining ${formatINR(p.remainingAfter)}`
                              : discounted
                                ? `Discount · Remaining ${formatINR(p.remainingAfter)}`
                                : ok
                                  ? `${p.method || 'Paid'} · Remaining ${formatINR(p.remainingAfter)}`
                                  : `${p.status || 'Recorded'} · ${p.method || ''}`}
                            {p.note ? ` · ${p.note}` : ''}
                          </p>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>
            </Panel>
          </>
        ) : (
          <Panel title="Fee details">
            <p className="py-8 text-center text-sm text-slate-500">Fee record not found.</p>
          </Panel>
        )}
      </section>
    )
  }

  return (
    <section className="w-full min-w-0 space-y-3 overflow-x-hidden">
      {toast ? (
        <div className="fixed right-3 top-3 z-[90] max-w-[calc(100vw-1.5rem)] rounded-lg bg-[#008C95] px-4 py-2 text-sm font-medium text-white shadow-lg sm:right-4 sm:top-4">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Collected" value={stats.collected || '₹0'} icon={Wallet} />
        <StatCard label="Pending" value={stats.pending || '₹0'} icon={IndianRupee} />
        <StatCard label="Overdue" value={stats.overdue || '₹0'} icon={AlertTriangle} />
        <StatCard label="Fully paid" value={String(stats.paidCount ?? 0)} icon={CheckCircle2} />
      </div>

      <PageToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search student, course, fee ID…"
        filters={filterOptions}
        filterValue={table.filter}
        onFilter={table.setFilter}
        onExportCsv={() => downloadCsv('fees.csv', columns, table.filtered)}
        onExportExcel={() => downloadCsv('fees.xls', columns, table.filtered)}
        onExportPdf={() => window.print()}
        extraActions={
          <button type="button" onClick={reload} className={`${secondaryBtn} flex-1 sm:flex-none`}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Panel title="Student fees (by course)">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading fees from admissions & courses…</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-slate-500">
              Click any row to open full installment schedule and payment history for that student.
            </p>
            <DataTable
              columns={tableColumns}
              rows={table.pageRows}
              emptyTitle="No fee records yet"
              emptyDescription="Approve or create admissions linked to courses — fee ledgers are built from course fee structure."
              onRowClick={openStudent}
              selectedRowId={selectedId}
            />
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
            />
          </>
        )}
      </Panel>
    </section>
  )
}
