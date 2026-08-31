import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, GraduationCap } from 'lucide-react'
import { getMyExam, getMyExams } from '../../../services/studentExamService.js'
import { Panel, PrimaryButton, SecondaryButton, StatCard, StatusBadge } from '../shared/StudentUI.jsx'
import { studentPath } from '../../../utils/studentRoutes.js'
import ExamResultPage from './ExamResultPage.jsx'
import OnlineExamPage from './OnlineExamPage.jsx'

function ExamCard({ exam, actions }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{exam.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {exam.course || 'Course'} · {exam.batch || 'Batch'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {exam.date} · {exam.time} · {exam.durationMinutes} min
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {exam.totalQuestions} questions · {exam.totalMarks} marks
          </p>
        </div>
        <StatusBadge status={exam.scheduleStatus || exam.assignmentStatus} />
      </div>
      {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
    </article>
  )
}

function InstructionsView({ exam, onStart, starting }) {
  const instructions = exam.instructions?.length
    ? exam.instructions
    : [
        'Do not refresh the page unnecessarily.',
        'Submit before the timer expires.',
        'Once submitted, the exam cannot be restarted unless allowed.',
        'Each question may have different marks.',
        'Negative marking may apply.',
      ]
  return (
    <section className="space-y-3">
      <Panel title={exam.title || 'Exam instructions'}>
        <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <p><span className="font-semibold">Duration:</span> {exam.durationMinutes} min</p>
          <p><span className="font-semibold">Questions:</span> {exam.totalQuestions}</p>
          <p><span className="font-semibold">Total marks:</span> {exam.totalMarks}</p>
          <p><span className="font-semibold">Passing:</span> {exam.passingPercentage}%</p>
          <p><span className="font-semibold">Negative marking:</span> {exam.negativeMarkingEnabled ? 'Yes' : 'No'}</p>
          <p><span className="font-semibold">Window:</span> {exam.time}</p>
        </div>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {instructions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <div className="mt-4">
          <PrimaryButton disabled={starting || (!exam.canStart && !exam.canResume)} onClick={onStart}>
            {starting ? 'Starting…' : exam.canResume ? 'Resume Exam' : 'Start Exam'}
          </PrimaryButton>
        </div>
      </Panel>
    </section>
  )
}

export default function StudentExamsPage({ variant = 'upcoming' }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const examId = params.get('exam') || ''
  const view = params.get('view') || ''
  const [data, setData] = useState({ upcoming: [], live: [], completed: [], results: [] })
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await getMyExams())
    } catch (err) {
      setError(err.message || 'Unable to load exams')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!examId) {
      setDetail(null)
      return
    }
    getMyExam(examId)
      .then(setDetail)
      .catch((err) => setError(err.message || 'Unable to load exam'))
  }, [examId])

  const open = (exam, nextView) => {
    setParams({ exam: exam.examId || exam.id, view: nextView })
  }

  const startExam = () => {
    if (!examId) return
    setStarting(true)
    setParams({ exam: examId, view: 'exam' })
    setStarting(false)
  }

  const list = useMemo(() => {
    if (variant === 'live') return data.live
    if (variant === 'results') return data.results
    if (variant === 'history') return data.completed
    return data.upcoming
  }, [variant, data])

  if (view === 'exam' && examId) {
    return <OnlineExamPage examId={examId} />
  }

  if (view === 'result' && examId) {
    return <ExamResultPage examId={examId} />
  }

  if ((view === 'instructions' || view === 'details') && detail) {
    return (
      <InstructionsView
        exam={detail}
        starting={starting}
        onStart={startExam}
      />
    )
  }

  return (
    <section className="space-y-3">
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming" value={data.upcoming.length} icon={Clock} />
        <StatCard label="Live" value={data.live.length} icon={GraduationCap} />
        <StatCard label="Completed" value={data.completed.length} />
        <StatCard label="Results" value={data.results.length} />
      </div>
      <Panel title={variant === 'live' ? 'Live Exams' : variant === 'results' ? 'My Results' : variant === 'history' ? 'Exam History' : 'Upcoming Exams'}>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading exams…</p>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No exams in this list yet.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {list.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                actions={
                  variant === 'live' ? (
                    <PrimaryButton onClick={() => open(exam, exam.canResume ? 'exam' : 'instructions')}>
                      {exam.canResume ? 'Resume Exam' : 'Start Exam'}
                    </PrimaryButton>
                  ) : variant === 'results' || (variant === 'history' && exam.resultAvailable) ? (
                    <PrimaryButton onClick={() => navigate(`${studentPath('My Results')}?exam=${exam.id}&view=result`)}>
                      View Result
                    </PrimaryButton>
                  ) : (
                    <SecondaryButton onClick={() => open(exam, 'details')}>View Details</SecondaryButton>
                  )
                }
              />
            ))}
          </div>
        )}
      </Panel>
    </section>
  )
}
