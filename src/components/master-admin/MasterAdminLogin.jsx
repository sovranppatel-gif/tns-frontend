import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import logo from '../../assets/tnslogo.png'
import LoadingScreen from '../LoadingScreen.jsx'
import { persistMasterAdminSession, verifyMasterAdminWithServer } from '../../utils/masterAdminAuth'
import { API_URL } from '../../utils/api.js'

export default function MasterAdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    verifyMasterAdminWithServer()
      .then((user) => {
        if (!cancelled && user) navigate('/master-admin/dashboard', { replace: true })
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  if (checking) {
    return <LoadingScreen />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const response = await fetch(`${API_URL}/api/master-admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success || !data.token) {
        throw new Error(data.message || 'Invalid email or password.')
      }
      persistMasterAdminSession({ token: data.token, user: data.user })
      navigate('/master-admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-4 py-16 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(196,30,58,0.22),transparent_50%),radial-gradient(circle_at_bottom,_rgba(30,79,215,0.2),transparent_55%)]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <img src={logo} alt="" className="h-12 w-12 rounded-full bg-white object-contain p-0.5" />
          <div>
            <p className="text-sm font-bold tracking-[0.12em] uppercase">TNS ITI &amp; Computer</p>
            <p className="text-[11px] font-medium tracking-[0.14em] text-gold uppercase">Master Admin</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md" noValidate>
          <h1 className="text-xl font-extrabold">Sign in</h1>
          <p className="mt-1 text-sm text-white/60">Institute control panel for Narsinghpur campus.</p>
          {error ? <p className="mt-3 rounded-lg bg-brand-red/20 px-3 py-2 text-sm text-red-100">{error}</p> : null}
          <label className="mt-5 block text-sm font-semibold">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-navy-950/50 px-4 py-3 text-sm text-white outline-none focus:border-gold"
              placeholder="masteradmin@tns.com"
              autoComplete="username"
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Password
            <span className="relative mt-1.5 block">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-navy-950/50 px-4 py-3 pr-11 text-sm text-white outline-none focus:border-gold"
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button type="button" className="absolute top-1/2 right-3 -translate-y-1/2 text-white/60" onClick={() => setShow((v) => !v)}>
                {show ? <FiEyeOff /> : <FiEye />}
              </button>
            </span>
          </label>
          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full disabled:opacity-70">
            {busy ? 'Signing in…' : 'Sign in to dashboard'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-white/50">
          <Link to="/" className="hover:text-gold">Back to website</Link>
        </p>
      </div>
    </section>
  )
}
