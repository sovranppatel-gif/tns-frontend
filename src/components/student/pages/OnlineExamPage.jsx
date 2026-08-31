import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flag, Timer } from 'lucide-react'
import {
  saveMyExamAnswer,
  startMyExam,
  submitMyExam,
} from '../../../services/studentExamService.js'
import { PrimaryButton, SecondaryButton } from '../shared/StudentUI.jsx'
import { studentPath } from '../../../utils/studentRoutes.js'

const NAV_COLORS = {
  'Not Visited': 'border-slate-200 bg-white text-slate-500',
  Visited: 'border-slate-300 bg-slate-100 text-slate-700',
  Answered: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  'Marked for Review': 'border-violet-300 bg-violet-50 text-violet-800',
  'Answered + Review': 'border-amber-300 bg-amber-50 text-amber-800',
}

function formatRemaining(ms) {
  const total = Math.max(0, Math.floor(Number(ms) / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function navigatorStatus(question) {
  const answered = question.type === 'Multiple Choice'
    ? Array.isArray(question.selectedAnswer) && question.selectedAnswer.length > 0
    : Boolean(question.selectedAnswer)
  if (answered && question.markedForReview) return 'Answered + Review'
  if (question.markedForReview) return 'Marked for Review'
  if (answered) return 'Answered'
  if (question.visited) return 'Visited'
  return 'Not Visited'
}

export default function OnlineExamPage({ examId }) {
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(null)
  const [index, setIndex] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const saveTimer = useRef(null)
  const submittedRef = useRef(false)
  const attemptRef = useRef(null)
  const finishRef = useRef(null)

  const questions = attempt?.paper?.questions || []
  const current = questions[index] || null

  const finish = useCallback(
    (payload) => {
      if (submittedRef.current) return
      submittedRef.current = true
      if (payload?.pendingRelease) {
        navigate(`${studentPath('Exam History')}?exam=${examId}&view=details`)
        return
      }
      navigate(`${studentPath('My Results')}?exam=${examId}&view=result`)
    },
    [examId, navigate],
  )
  finishRef.current = finish

  useEffect(() => {
    let cancelled = false
    attemptRef.current = null
    setAttempt(null)
    setError('')

    ;(async () => {
      try {
        const data = await startMyExam(examId)
        if (cancelled) return
        if (data.submitted) {
          finishRef.current?.(data)
          return
        }
        attemptRef.current = data
        setError('')
        setAttempt(data)
        setIndex(data.currentIndex || 0)
        setRemainingMs(data.remainingMs || 0)
      } catch (err) {
        if (cancelled || attemptRef.current) return
        setError(err.message || 'Unable to start exam')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [examId])

  useEffect(() => {
    if (!attempt?.expiresAt) return undefined
    const tick = () => {
      const left = new Date(attempt.expiresAt).getTime() - Date.now()
      setRemainingMs(left)
      if (left <= 0 && !submittedRef.current) {
        submittedRef.current = true
        submitMyExam(examId)
          .then(finish)
          .catch((err) => setError(err.message || 'Auto-submit failed'))
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [attempt?.expiresAt, examId, finish])

  const persist = useCallback(
    async (payload) => {
      if (!attempt || submittedRef.current) return
      setSaving(true)
      try {
        const data = await saveMyExamAnswer(examId, payload)
        if (data.submitted) {
          finish(data)
          return
        }
        if (data.expiresAt) {
          setAttempt((prev) => prev ? { ...prev, expiresAt: data.expiresAt } : prev)
        }
      } catch (err) {
        setError(err.message || 'Auto-save failed')
      } finally {
        setSaving(false)
      }
    },
    [attempt, examId, finish],
  )

  const updateQuestion = (questionId, patch, extra = {}) => {
    setAttempt((prev) => {
      if (!prev) return prev
      const nextQuestions = prev.paper.questions.map((q) =>
        q.questionId === questionId ? { ...q, visited: true, ...patch } : q,
      )
      return { ...prev, paper: { ...prev.paper, questions: nextQuestions } }
    })
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      persist({ questionId, ...patch, ...extra, currentIndex: index })
    }, 400)
  }

  useEffect(() => {
    if (!attempt) return undefined
    const id = window.setInterval(() => {
      const q = (attempt.paper?.questions || [])[index]
      if (!q) return
      persist({
        answers: (attempt.paper.questions || []).map((item) => ({
          questionId: item.questionId,
          selectedAnswer: item.selectedAnswer,
          markedForReview: item.markedForReview,
          visited: item.visited,
        })),
        currentIndex: index,
      })
    }, 20000)
    return () => window.clearInterval(id)
  }, [attempt, index, persist])

  const goTo = (nextIndex) => {
    if (!current) {
      setIndex(nextIndex)
      return
    }
    persist({
      questionId: current.questionId,
      selectedAnswer: current.selectedAnswer,
      markedForReview: current.markedForReview,
      visited: true,
      currentIndex: nextIndex,
    })
    setIndex(nextIndex)
  }

  const clearAnswer = () => {
    if (!current) return
    const empty = current.type === 'Multiple Choice' ? [] : ''
    updateQuestion(current.questionId, { selectedAnswer: empty, visited: true })
  }

  const submit = async () => {
    if (!window.confirm('Submit this exam? You cannot change answers after submit.')) return
    setSubmitting(true)
    try {
      const data = await submitMyExam(examId)
      finish(data)
    } catch (err) {
      setError(err.message || 'Unable to submit exam')
      submittedRef.current = false
    } finally {
      setSubmitting(false)
    }
  }

  const progress = useMemo(() => {
    if (!questions.length) return 0
    const answered = questions.filter((q) =>
      q.type === 'Multiple Choice' ? q.selectedAnswer?.length : q.selectedAnswer,
    ).length
    return Math.round((answered / questions.length) * 100)
  }, [questions])

  if (error && !attempt) {
    return <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
  }
  if (!attempt || !current) {
    return <p className="py-10 text-center text-sm text-slate-500">Preparing exam…</p>
  }

  const multi = current.type === 'Multiple Choice'
  const selected = current.selectedAnswer

  return (
    <section className="space-y-3 text-slate-900">
      {error && !/start exam/i.test(error) ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{attempt.paper.title}</p>
          <p className="text-xs text-slate-500">
            Question {index + 1} of {questions.length} · Progress {progress}% {saving ? '· Saving…' : ''}
          </p>
        </div>
        <p className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${remainingMs < 60000 ? 'bg-rose-100 text-rose-700' : 'bg-[#00A896]/15 text-[#005F6B]'}`}>
          <Timer size={14} /> {formatRemaining(remainingMs)}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Question {index + 1} of {questions.length} · {current.marks} mark{Number(current.marks) === 1 ? '' : 's'}
          </p>
          <p className="mt-2 text-base font-medium text-slate-900">{current.text}</p>
          <div className="mt-4 space-y-2">
            {(current.options || []).map((opt) => {
              const checked = multi
                ? Array.isArray(selected) && selected.includes(opt.key)
                : selected === opt.key
              return (
                <label key={opt.key} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm text-slate-900 ${checked ? 'border-[#008C95] bg-[#008C95]/5' : 'border-slate-200'}`}>
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    checked={checked}
                    onChange={() => {
                      if (multi) {
                        const currentSelected = Array.isArray(selected) ? selected : []
                        const next = currentSelected.includes(opt.key)
                          ? currentSelected.filter((key) => key !== opt.key)
                          : [...currentSelected, opt.key]
                        updateQuestion(current.questionId, { selectedAnswer: next, visited: true })
                      } else {
                        updateQuestion(current.questionId, { selectedAnswer: opt.key, visited: true })
                      }
                    }}
                  />
                  <span className="text-slate-900">
                    <span className="font-semibold text-slate-900">{opt.key}.</span> {opt.text}
                  </span>
                </label>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <SecondaryButton disabled={index === 0} onClick={() => goTo(index - 1)}>Previous</SecondaryButton>
            <SecondaryButton disabled={index >= questions.length - 1} onClick={() => goTo(index + 1)}>Next</SecondaryButton>
            <SecondaryButton onClick={() => updateQuestion(current.questionId, { markedForReview: !current.markedForReview, visited: true, selectedAnswer: current.selectedAnswer })}>
              <Flag size={13} /> Mark for Review
            </SecondaryButton>
            <SecondaryButton onClick={clearAnswer}>Clear Answer</SecondaryButton>
            <PrimaryButton disabled={submitting} onClick={submit}>{submitting ? 'Submitting…' : 'Submit Exam'}</PrimaryButton>
          </div>
        </article>

        <aside className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Question navigator</p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              const status = navigatorStatus(q)
              return (
                <button
                  key={q.questionId}
                  type="button"
                  title={status}
                  onClick={() => goTo(i)}
                  className={`h-9 rounded-lg border text-xs font-semibold ${NAV_COLORS[status]} ${i === index ? 'ring-2 ring-[#FF5E14]' : ''}`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <ul className="mt-3 space-y-1 text-[11px] text-slate-500">
            <li>Not visited · Visited · Answered</li>
            <li>Marked for review · Answered + review</li>
          </ul>
        </aside>
      </div>
    </section>
  )
}
