import { useEffect, useState } from 'react'
import { HelpCircle, LifeBuoy, Mail, MessageSquarePlus } from 'lucide-react'
import {
  createSupportTicket,
  getMySupportTickets,
} from '../../../services/studentSupportService.js'
import { PHONES, SITE } from '../../../data/site.js'
import { EmptyState, Panel, PrimaryButton, SkeletonBlock, StatusBadge } from '../shared/StudentUI.jsx'

const FAQS = [
  {
    q: 'How do I apply for admission?',
    a: 'Open Online Admission from the sidebar, fill the form, submit payment details if asked, and send the application for review.',
  },
  {
    q: 'When can I access attendance, fees and exams?',
    a: 'Those sections unlock after your admission is approved by the institute.',
  },
  {
    q: 'How do I pay fees?',
    a: 'Go to Fee Management, choose an installment, submit payment and wait for accounts to approve it.',
  },
  {
    q: 'Where are my online exam results?',
    a: 'Open Upcoming Exams / Live Exams to attempt papers, then My Results once the result is released.',
  },
  {
    q: 'I forgot my password.',
    a: 'Use Forgot password on the sign-in page. OTP is sent to your registered email.',
  },
]

export default function SupportPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [openFaq, setOpenFaq] = useState(0)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  const loadTickets = async () => {
    setLoading(true)
    setError('')
    try {
      setTickets(await getMySupportTickets())
    } catch (err) {
      setTickets([])
      setError(err?.message || 'Unable to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setOkMsg('')
    try {
      const entry = await createSupportTicket({ subject, message })
      setTickets((prev) => [entry, ...prev])
      setSubject('')
      setMessage('')
      setOkMsg('Ticket submitted. The institute will follow up.')
    } catch (err) {
      setError(err?.message || 'Unable to submit ticket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Raise a Ticket">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A896] focus:ring-2 focus:ring-[#FF5E14]/20"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue…"
              required
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A896] focus:ring-2 focus:ring-[#FF5E14]/20"
            />
            <PrimaryButton type="submit" disabled={saving}>
              <MessageSquarePlus size={14} />
              {saving ? 'Submitting…' : 'Submit Ticket'}
            </PrimaryButton>
            {okMsg ? <p className="text-xs font-medium text-[#008C95]">{okMsg}</p> : null}
            {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
          </form>
        </Panel>

        <Panel title="Your Tickets">
          {loading ? (
            <SkeletonBlock className="h-32" />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No tickets yet"
              description="Submitted support tickets will list here with status."
            />
          ) : (
            <ul className="space-y-2">
              {tickets.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">{t.subject}</p>
                    <p className="text-[11px] text-slate-400">
                      {t.ticketId} · {t.date}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="FAQs / Help Center">
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <div key={f.q} className="rounded-lg border border-slate-100">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-800"
              >
                <HelpCircle size={14} className="shrink-0 text-[#008C95]" />
                {f.q}
              </button>
              {openFaq === i ? (
                <p className="border-t border-slate-50 px-3 py-2.5 text-sm text-slate-600">{f.a}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Contact Institute">
        <div className="flex flex-wrap gap-4 text-sm text-slate-700">
          <p className="inline-flex items-center gap-2">
            <Mail size={14} className="text-[#FF5E14]" />
            {SITE.email}
          </p>
          <p className="inline-flex items-center gap-2">
            <LifeBuoy size={14} className="text-[#008C95]" />
            Helpline: +91 {PHONES.primary}
          </p>
        </div>
      </Panel>
    </section>
  )
}
