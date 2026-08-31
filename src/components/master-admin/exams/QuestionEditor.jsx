import { Plus, Trash2 } from 'lucide-react'
import {
  DIFFICULTIES,
  QUESTION_STATUSES,
  QUESTION_TYPES,
  defaultOptions,
  inputClass,
  isCorrect,
  textareaClass,
  toggleCorrect,
} from './examFormUtils.js'

export default function QuestionEditor({
  value,
  onChange,
  courses = [],
  subjects = [],
  showStatus = true,
  compact = false,
}) {
  const set = (patch) => onChange({ ...value, ...patch })

  const changeType = (type) => {
    const options = defaultOptions(type)
    set({
      type,
      options,
      correctAnswer: type === 'Multiple Choice' ? [] : '',
    })
  }

  const setOption = (index, text) => {
    const options = value.options.map((opt, i) => (i === index ? { ...opt, text } : opt))
    set({ options })
  }

  const addOption = () => {
    if (value.type === 'True / False' || value.type === 'Yes / No') return
    const nextKey = String.fromCharCode(65 + value.options.length)
    set({ options: [...value.options, { key: nextKey, text: '' }] })
  }

  const removeOption = (index) => {
    if (value.options.length <= 2) return
    const removed = value.options[index]
    const options = value.options.filter((_, i) => i !== index)
    let correctAnswer = value.correctAnswer
    if (value.type === 'Multiple Choice') {
      correctAnswer = (correctAnswer || []).filter((key) => key !== removed.key)
    } else if (correctAnswer === removed.key) {
      correctAnswer = ''
    }
    set({ options, correctAnswer })
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        Question
        <textarea
          value={value.text}
          onChange={(e) => set({ text: e.target.value })}
          className={textareaClass}
          placeholder="Enter question text"
        />
      </label>

      <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        <label className="text-sm font-medium text-slate-700">
          Type
          <select value={value.type} onChange={(e) => changeType(e.target.value)} className={inputClass}>
            {QUESTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Marks
          <input
            type="number"
            min="0"
            step="0.25"
            value={value.marks}
            onChange={(e) => set({ marks: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Negative marks
          <input
            type="number"
            min="0"
            step="0.25"
            value={value.negativeMarks}
            onChange={(e) => set({ negativeMarks: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Difficulty
          <select
            value={value.difficulty}
            onChange={(e) => set({ difficulty: e.target.value })}
            className={inputClass}
          >
            {DIFFICULTIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Course
          <select
            value={value.courseId || ''}
            onChange={(e) => set({ courseId: e.target.value })}
            className={inputClass}
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id || course._id} value={course.id || course._id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Subject
          <input
            list="exam-subject-options"
            value={value.subject || ''}
            onChange={(e) => set({ subject: e.target.value })}
            className={inputClass}
            placeholder="Subject"
          />
          <datalist id="exam-subject-options">
            {subjects.map((subject) => (
              <option key={subject} value={subject} />
            ))}
          </datalist>
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Options & correct answer</p>
        <div className="space-y-2">
          {value.options.map((opt, index) => {
            const checked = isCorrect(value.type, opt.key, value.correctAnswer)
            const multi = value.type === 'Multiple Choice'
            return (
              <div key={opt.key} className="flex items-center gap-2">
                <label className="inline-flex h-10 w-16 shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    name="correct-answer"
                    checked={checked}
                    onChange={() => set({ correctAnswer: toggleCorrect(value.type, opt.key, value.correctAnswer) })}
                  />
                  {opt.key}
                </label>
                <input
                  value={opt.text}
                  onChange={(e) => setOption(index, e.target.value)}
                  className={`${inputClass} mt-0`}
                  placeholder={`Option ${opt.key}`}
                  readOnly={value.type === 'True / False' || value.type === 'Yes / No'}
                />
                {value.type !== 'True / False' && value.type !== 'Yes / No' ? (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
        {value.type !== 'True / False' && value.type !== 'Yes / No' ? (
          <button
            type="button"
            onClick={addOption}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#008C95]"
          >
            <Plus size={12} /> Add option
          </button>
        ) : null}
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Explanation
        <textarea
          value={value.explanation || ''}
          onChange={(e) => set({ explanation: e.target.value })}
          className={textareaClass}
          placeholder="Shown to master admin / evaluation only"
        />
      </label>

      {showStatus ? (
        <label className="text-sm font-medium text-slate-700">
          Status
          <select value={value.status} onChange={(e) => set({ status: e.target.value })} className={inputClass}>
            {QUESTION_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  )
}
