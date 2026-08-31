import { Link, NavLink } from 'react-router-dom'
import { SITE } from '../data/site'
import logo from '../assets/tnslogo.png'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <header className="border-b border-navy-900/10 bg-navy-900">
        <div className="container-page flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="TNS logo" className="h-11 w-11 rounded-full bg-white object-contain p-0.5" />
            <span>
              <span className="block text-sm font-extrabold text-white">{SITE.shortName}</span>
              <span className="block text-[11px] text-white/60">Student Portal</span>
            </span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-white/80 hover:text-white">
            Back to website
          </Link>
        </div>
      </header>

      <main className="container-page grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
        <div className="hidden lg:block">
          <img src={logo} alt="" className="w-40 drop-shadow-xl" />
          <h1 className="mt-6 text-4xl font-extrabold text-navy-900">Student Account</h1>
          <p className="mt-3 max-w-md text-slate-600">
            Sign in or create your TNS student account to enquire, track admission interest, and stay
            connected with Thakur Niranjan Singh I.T.I. &amp; Computer, Narsinghpur.
          </p>
          <p className="mt-6 text-sm font-semibold text-navy-800">{SITE.taglineHi}</p>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="card-surface p-6 sm:p-8">
            <div className="mb-6 grid grid-cols-2 rounded-full bg-slate-100 p-1">
              <NavLink
                to="/signin"
                className={({ isActive }) =>
                  `rounded-full py-2 text-center text-sm font-bold transition ${
                    isActive ? 'bg-navy-900 text-white shadow' : 'text-navy-700'
                  }`
                }
              >
                Sign In
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  `rounded-full py-2 text-center text-sm font-bold transition ${
                    isActive ? 'bg-navy-900 text-white shadow' : 'text-navy-700'
                  }`
                }
              >
                Sign Up
              </NavLink>
            </div>
            <h2 className="text-xl font-extrabold text-navy-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
