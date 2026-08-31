import { useState } from 'react'
import {
  ArrowLeft,
  CreditCard,
  IdCard,
  Pencil,
  Printer,
  UserCog,
} from 'lucide-react'
import {
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  Tabs,
  formatINR,
} from '../shared/MasterAdminUI.jsx'
import { API_URL } from '../../../utils/api.js'

function photoSrc(photo) {
  const value = String(photo || '').trim()
  if (!value) return ''
  if (/^(data:|https?:|blob:)/i.test(value)) return value
  return `${API_URL}${value}`
}

function initials(name) {
  return String(name || 'ST')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  )
}

function StudentPhoto({ student, size = 'lg' }) {
  const src = photoSrc(student?.photo)
  const cls = size === 'sm' ? 'h-10 w-10 text-[10px]' : 'h-20 w-16 text-sm sm:h-24 sm:w-20'
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${cls} shrink-0 rounded-lg border border-slate-200 object-cover`}
      />
    )
  }
  return (
    <div
      className={`${cls} grid shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 font-bold text-[#008C95]`}
    >
      {initials(student?.nameEnglish)}
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'academic', label: 'Academic' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'fees', label: 'Fees' },
  { id: 'results', label: 'Results' },
  { id: 'documents', label: 'Documents' },
  { id: 'history', label: 'History' },
]

export default function StudentProfilePage({
  student,
  loading = false,
  onBack,
  onEdit,
  onAssignBatch,
  onPrint,
  onIdCard,
  onViewFees,
  onViewAttendance,
  onViewResults,
}) {
  const [tab, setTab] = useState('overview')
  if (loading || !student) {
    return (
      <Panel title="Student profile">
        <p className="py-8 text-center text-sm text-slate-500">Loading student…</p>
      </Panel>
    )
  }

  const contact = student.contact || {}
  const address = student.address || {}
  const guardian = student.guardian || {}
  const fees = student.feesSummary
  const attendance = student.attendanceSummary
  const results = student.resultsSummary
  const subjects = Array.isArray(student.currentSubjects) ? student.currentSubjects : []
  const history = Array.isArray(student.batchHistory) ? student.batchHistory : []
  const documents = Array.isArray(student.documents) ? student.documents : []

  return (
    <section className="w-full min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SecondaryButton onClick={onBack}>
          <ArrowLeft size={14} /> Back to list
        </SecondaryButton>
      </div>

      <Panel className="p-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <StudentPhoto student={student} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{student.nameEnglish}</h2>
                <p className="text-xs text-slate-500">{student.studentId}</p>
                <p className="text-xs text-slate-500">Admission: {student.admissionId || '—'}</p>
              </div>
              <StatusBadge status={student.status} />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="University" value={student.universityLabel} />
              <Info label="Course" value={student.courseLabel} />
              <Info label="Batch" value={student.batchLabel} />
              <Info label="Current Term" value={student.currentTermLabel} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <PrimaryButton onClick={onEdit}>
                <Pencil size={14} /> Edit
              </PrimaryButton>
              <SecondaryButton onClick={onAssignBatch}>
                <UserCog size={14} /> Assign Batch
              </SecondaryButton>
              <SecondaryButton onClick={onPrint}>
                <Printer size={14} /> Print Profile
              </SecondaryButton>
              <SecondaryButton onClick={onIdCard}>
                <IdCard size={14} /> Generate ID Card
              </SecondaryButton>
            </div>
          </div>
        </div>
      </Panel>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Personal Information" className="p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Student ID" value={student.studentId} />
              <Info label="Admission Number" value={student.admissionId} />
              <Info label="Name English" value={student.nameEnglish} />
              <Info label="Name Hindi" value={student.nameHindi} />
              <Info label="Date of Birth" value={student.dateOfBirth} />
              <Info label="Gender" value={student.gender} />
              <Info label="Category" value={student.category} />
              <Info label="Samagra ID" value={student.samagraId} />
              <Info label="Caste Certificate No." value={student.casteCertificateNo} />
              <Info label="Marital Status" value={student.maritalStatus} />
            </div>
          </Panel>
          <Panel title="Parent / Guardian" className="p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Father Name" value={student.fatherName} />
              <Info label="Mother Name" value={student.motherName} />
              <Info label="Guardian Name" value={guardian.name} />
              <Info label="Relation" value={guardian.relation} />
              <Info label="Guardian Mobile" value={guardian.mobile} />
              <Info label="Guardian Address" value={guardian.address} />
            </div>
          </Panel>
          <Panel title="Contact" className="p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Student Mobile" value={contact.mobile} />
              <Info label="Alternate Mobile" value={contact.alternateMobile} />
              <Info label="Email" value={contact.email} />
            </div>
            <p className="mt-3 rounded-lg border border-[#008C95]/20 bg-[#008C95]/5 px-3 py-2 text-xs leading-relaxed text-slate-600">
              Student portal login uses this <strong>email or mobile</strong>. There is no default password.
              Ask the student to open Student Sign In → <strong>Forgot password</strong>. OTP is sent to this email only (not SMS), then they set a new password.
            </p>
          </Panel>
          <Panel title="Address" className="p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Permanent Address" value={address.permanent} />
              <Info label="Correspondence Address" value={address.correspondence} />
              <Info label="Village" value={address.village} />
              <Info label="Post" value={address.post} />
              <Info label="Tehsil" value={address.tehsil} />
              <Info label="District" value={address.district} />
              <Info label="State" value={address.state} />
              <Info label="PIN Code" value={address.pinCode} />
            </div>
          </Panel>
        </div>
      ) : null}

      {tab === 'academic' ? (
        <div className="space-y-3">
          <Panel title="Academic Mapping" className="p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="University" value={student.universityLabel} />
              <Info label="Course" value={student.courseName || student.courseLabel} />
              <Info label="Course Code" value={student.courseCode} />
              <Info label="Category" value={student.courseCategory} />
              <Info label="Session" value={student.session} />
              <Info label="Batch" value={student.batchLabel} />
              <Info label="Current Term" value={student.currentTermLabel} />
              <Info label="Admission Date" value={student.admissionDateLabel} />
              <Info label="Student Status" value={student.status} />
            </div>
          </Panel>
          <Panel title={`Current Subjects${student.currentTermLabel ? ` · ${student.currentTermLabel}` : ''}`} className="p-3">
            <p className="mb-2 text-xs text-slate-500">Resolved from Course Master. Subjects cannot be edited here.</p>
            {subjects.length ? (
              <ol className="space-y-1.5">
                {subjects.map((sub) => (
                  <li key={`${sub.number}-${sub.name}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-semibold text-slate-500">{sub.number}.</span>{' '}
                    <span className="font-medium text-slate-800">{sub.name}</span>
                    {sub.code ? <span className="ml-2 text-xs text-slate-500">{sub.code}</span> : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500">No subjects found for this term in Course Master.</p>
            )}
          </Panel>
        </div>
      ) : null}

      {tab === 'attendance' ? (
        <Panel title="Attendance Summary" className="p-3">
          {attendance?.available ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Info label="Overall Attendance" value={`${attendance.overall || 0}%`} />
              <Info label="Present" value={String(attendance.present ?? 0)} />
              <Info label="Absent" value={String(attendance.absent ?? 0)} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">No attendance records yet for this student.</p>
          )}
          <div className="mt-4">
            <SecondaryButton onClick={onViewAttendance}>
              View Attendance
            </SecondaryButton>
          </div>
        </Panel>
      ) : null}

      {tab === 'fees' ? (
        <Panel title="Fees Summary" className="p-3">
          {fees?.available ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Info label="Course Fee" value={fees.courseFeeLabel || formatINR(fees.courseFee)} />
              <Info label="Paid" value={fees.paidLabel || formatINR(fees.paid)} />
              <Info label="Due" value={fees.dueLabel || formatINR(fees.due)} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">No fee ledger found. Open Fees to review the existing module.</p>
          )}
          <div className="mt-4">
            <SecondaryButton onClick={onViewFees}>
              <CreditCard size={14} /> View Fees
            </SecondaryButton>
          </div>
        </Panel>
      ) : null}

      {tab === 'results' ? (
        <Panel title="Results Summary" className="p-3">
          {results?.terms?.length ? (
            <div className="space-y-2">
              {results.terms.map((term) => (
                <article key={term.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-800">{term.label}</p>
                  <p className="text-xs text-slate-500">
                    Subjects: {term.subjects} · Passed: {term.passed} · Backlog: {term.backlog} · {term.percentage}%
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {results?.message || 'Results are managed in the Results module. No result entry is available here.'}
            </p>
          )}
          <div className="mt-4">
            <SecondaryButton onClick={onViewResults}>View Results</SecondaryButton>
          </div>
        </Panel>
      ) : null}

      {tab === 'documents' ? (
        <Panel title="Documents" className="p-3">
          {documents.length ? (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc._id || doc.documentUrl} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-slate-800">{doc.documentType || 'Document'}</p>
                  <p className="text-xs text-slate-500">{doc.documentName || doc.documentNumber || '—'}</p>
                  {doc.verified ? (
                    <p className="mt-1 text-[11px] font-semibold text-emerald-700">Verified</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">Pending verification</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No documents attached yet. Add them from Edit Student.</p>
          )}
        </Panel>
      ) : null}

      {tab === 'history' ? (
        <Panel title="Batch History" className="p-3">
          {history.length ? (
            <ul className="space-y-2">
              {history.map((row) => (
                <li key={row._id || `${row.batchName}-${row.joiningLabel}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-800">{row.batchName || row.batchCode || 'Batch'}</p>
                  <p className="text-xs text-slate-500">
                    {row.joiningLabel || '—'} → {row.leavingLabel || 'Current'}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No batch history yet.</p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="Created" value={student.createdAt ? new Date(student.createdAt).toLocaleString('en-IN') : '—'} />
            <Info label="Updated" value={student.updatedAt ? new Date(student.updatedAt).toLocaleString('en-IN') : '—'} />
          </div>
        </Panel>
      ) : null}
    </section>
  )
}

export { StudentPhoto, photoSrc, initials }
