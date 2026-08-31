import { useEffect, useState } from 'react'
import { BookOpen, CalendarClock, ClipboardList, FileQuestion, GraduationCap } from 'lucide-react'
import { getExamOverview } from '../../../services/examResultService.js'
import { Panel, PrimaryButton, SecondaryButton, StatCard } from '../shared/MasterAdminUI.jsx'
import { masterAdminPath } from '../../../utils/masterAdminRoutes.js'
import { useNavigate } from 'react-router-dom'

export default function OnlineExamsPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    getExamOverview()
      .then(setStats)
      .catch((err) => setError(err.message || 'Unable to load exam overview'))
  }, [])

  const go = (section) => navigate(masterAdminPath(section))

  return (
    <section className="space-y-3">
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Question Bank" value={stats.questions || 0} />
        <StatCard label="Exam Papers" value={stats.papers || 0} />
        <StatCard label="Published" value={stats.published || 0} />
        <StatCard label="Schedules" value={stats.schedules || 0} />
        <StatCard label="Attempts" value={stats.attempts || 0} />
        <StatCard label="Submitted" value={stats.submitted || 0} />
        <StatCard label="Passed" value={stats.passed || 0} />
        <StatCard label="Average Score" value={`${stats.averageScore || 0}%`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Build an exam">
          <p className="text-sm text-slate-600">Create reusable questions, snapshot them into a paper, then publish.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton onClick={() => go('Question Bank')}><FileQuestion size={14} /> Question Bank</PrimaryButton>
            <SecondaryButton onClick={() => go('Exam Papers')}><ClipboardList size={14} /> Exam Papers</SecondaryButton>
          </div>
        </Panel>
        <Panel title="Conduct & review">
          <p className="text-sm text-slate-600">Schedule a published paper for a batch and review evaluated results.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton onClick={() => go('Exam Schedule')}><CalendarClock size={14} /> Exam Schedule</PrimaryButton>
            <SecondaryButton onClick={() => go('Exam Results')}><GraduationCap size={14} /> Exam Results</SecondaryButton>
          </div>
        </Panel>
      </div>

      <Panel title="Secure evaluation">
        <ul className="space-y-1 text-sm text-slate-600">
          <li className="flex items-center gap-2"><BookOpen size={14} className="text-[#FF5E14]" /> Correct answers stay on the server and are never sent to students.</li>
          <li>Timer start/expiry is stored by the backend. Late submissions are rejected or auto-submitted.</li>
          <li>Final marks, percentage and pass/fail are calculated only on the server.</li>
        </ul>
      </Panel>
    </section>
  )
}
