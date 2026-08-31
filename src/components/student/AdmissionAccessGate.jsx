import { ClipboardPen, Phone, UserRound } from 'lucide-react'
import { PrimaryButton } from './shared/StudentUI.jsx'

/**
 * Shown when student tries to open a section that requires Approved admission.
 */
export default function AdmissionAccessGate({
  status = '',
  onGoAdmission,
  onGoProfile,
}) {
  const normalized = String(status || '').trim()
  const isPending =
    normalized === 'Pending' || normalized === 'Verification'
  const isRejected = normalized === 'Rejected'

  let title = 'Admission required'
  let body =
    'Your admission is not approved yet. Please apply for Online Admission, or contact our team / office for help.'

  if (isPending) {
    title = 'Your admission is pending'
    body =
      'Your Online Admission application is under review. Please wait for approval, or contact our team / office if you need help.'
  } else if (isRejected) {
    title = 'Admission was rejected'
    body =
      'Your previous application was rejected. Please update and re-apply via Online Admission, or contact our team / office.'
  } else if (!normalized) {
    title = 'Admission not approved'
    body =
      'Please apply for Online Admission to unlock Dashboard, Attendance, Courses and other sections. You can also contact our team / office for assistance.'
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#00A896]/30 bg-gradient-to-br from-[#06151C] via-[#0a2530] to-[#005F6B] p-5 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)] sm:p-8">
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
          <UserRound size={14} />
          {isPending ? 'Pending approval' : isRejected ? 'Rejected' : 'Access limited'}
        </span>

        <div>
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{body}</p>
        </div>

        <ul className="w-full space-y-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          <li>
            • You can view & edit <strong className="text-white">My Profile</strong>
          </li>
          <li>
            • You can submit / track <strong className="text-white">Online Admission</strong>
          </li>
          <li>
            • Other portal sections unlock after admission is{' '}
            <strong className="text-white">Approved</strong>
          </li>
        </ul>

        <div className="flex flex-wrap gap-2">
          <PrimaryButton type="button" onClick={onGoAdmission}>
            <ClipboardPen size={14} />
            {isRejected ? 'Re-apply Online Admission' : 'Go to Online Admission'}
          </PrimaryButton>
          <button
            type="button"
            onClick={onGoProfile}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            My Profile
          </button>
        </div>

        <p className="inline-flex items-start gap-2 text-xs text-slate-400">
          <Phone size={14} className="mt-0.5 shrink-0 text-[#00E5CC]" />
          Need help? Contact TNS ITI & Computer office / support team.
        </p>
      </div>
    </section>
  )
}

/** Sections available before admission approval */
export const ADMISSION_OPEN_SECTIONS = new Set([
  'My Profile',
  'Online Admission',
  'Notifications',
])

export function isAdmissionSectionOpen(section) {
  return ADMISSION_OPEN_SECTIONS.has(section)
}
