import { useState } from 'react'
import { Bell, KeyRound, Languages, Moon, Sun } from 'lucide-react'
import { Panel, PrimaryButton } from '../shared/StudentUI.jsx'
import { useStudentTheme } from '../StudentTheme.jsx'
import { changeStudentPassword } from '../../../services/studentAuthService.js'
import { getStudentToken } from '../../../utils/studentAuth.js'

const PREF_KEY = 'tns_student_notify_prefs'

function loadPrefs() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREF_KEY) || 'null')
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    // ignore
  }
  return {
    email: true,
    push: true,
    sms: false,
    assignments: true,
    fees: true,
    classes: true,
  }
}

export default function SettingsPage() {
  const { isDark, toggleTheme } = useStudentTheme()
  const [language, setLanguage] = useState(
    () => localStorage.getItem('tns_student_language') || 'English',
  )
  const [prefs, setPrefs] = useState(loadPrefs)
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [saving, setSaving] = useState(false)

  const togglePref = (key) => {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] }
      localStorage.setItem(PREF_KEY, JSON.stringify(next))
      return next
    })
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    setPwdMsg('')
    setPwdError('')
    if (pwd.next !== pwd.confirm) {
      setPwdError('New passwords do not match.')
      return
    }
    if (pwd.next.length < 6) {
      setPwdError('Password must be at least 6 characters.')
      return
    }
    const token = getStudentToken()
    if (!token) {
      setPwdError('Please log in again to change password.')
      return
    }
    setSaving(true)
    try {
      await changeStudentPassword(token, {
        currentPassword: pwd.current,
        newPassword: pwd.next,
      })
      setPwdMsg('Password updated.')
      setPwd({ current: '', next: '', confirm: '' })
    } catch (err) {
      setPwdError(err?.message || 'Unable to update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-3">
      <Panel title="Appearance">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isDark ? <Moon size={18} className="text-[#008C95]" /> : <Sun size={18} className="text-[#FF5E14]" />}
            <div>
              <p className="text-sm font-semibold text-slate-900">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
              <p className="text-xs text-slate-500">Preference saved locally for this portal.</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={toggleTheme}
            className={`relative h-8 w-14 rounded-full transition ${isDark ? 'bg-[#008C95]' : 'bg-slate-300'}`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                isDark ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>
      </Panel>

      <Panel title="Language">
        <div className="flex items-center gap-3">
          <Languages size={18} className="text-[#FF5E14]" />
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value)
              localStorage.setItem('tns_student_language', e.target.value)
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#00A896]"
          >
            {['English', 'Hindi'].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      <Panel title="Notification Preferences">
        <ul className="space-y-3">
          {[
            ['email', 'Email notifications'],
            ['push', 'Push notifications'],
            ['sms', 'SMS alerts'],
            ['assignments', 'Assignment reminders'],
            ['fees', 'Fee reminders'],
            ['classes', 'Live class reminders'],
          ].map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-700">
                <Bell size={14} className="text-[#008C95]" />
                {label}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[key]}
                onClick={() => togglePref(key)}
                className={`relative h-7 w-12 rounded-full transition ${prefs[key] ? 'bg-[#008C95]' : 'bg-slate-300'}`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    prefs[key] ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Change Password">
        <form onSubmit={handlePassword} className="max-w-md space-y-3">
          {[
            ['current', 'Current password'],
            ['next', 'New password'],
            ['confirm', 'Confirm new password'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
              <input
                type="password"
                value={pwd[key]}
                onChange={(e) => setPwd((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A896] focus:ring-2 focus:ring-[#FF5E14]/20"
              />
            </div>
          ))}
          <PrimaryButton type="submit" disabled={saving}>
            <KeyRound size={14} />
            {saving ? 'Updating…' : 'Update Password'}
          </PrimaryButton>
          {pwdMsg ? <p className="text-xs font-medium text-[#008C95]">{pwdMsg}</p> : null}
          {pwdError ? <p className="text-xs font-medium text-rose-600">{pwdError}</p> : null}
        </form>
      </Panel>
    </section>
  )
}
