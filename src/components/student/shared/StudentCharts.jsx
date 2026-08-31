import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const ORANGE = '#FF5E14'
const TEAL = '#008C95'
const TEAL_LIGHT = '#00A896'
const AMBER = '#F59E0B'
const ROSE = '#F43F5E'
const SLATE = '#94A3B8'

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  fontSize: 12,
}

export function AttendanceTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="attFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ORANGE} stopOpacity={0.35} />
            <stop offset="100%" stopColor={TEAL} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="percent" stroke={ORANGE} fill="url(#attFill)" strokeWidth={2} name="Attendance %" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function MarksComparisonChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="marks" radius={[8, 8, 0, 0]} name="Marks">
          {data.map((_, i) => (
            <Cell key={i} fill={i % 2 === 0 ? ORANGE : TEAL} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function LearningHoursChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="hours" stroke={TEAL} strokeWidth={2.5} dot={{ r: 4, fill: ORANGE }} name="Hours" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function AssignmentCompletionChart({ data }) {
  const colors = [TEAL, AMBER, ROSE]
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function FeePaymentChart({ data }) {
  const colors = [TEAL_LIGHT, ORANGE]
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v) =>
            new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
          }
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function PerformanceOverviewChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        <Line type="monotone" dataKey="completion" stroke={TEAL} strokeWidth={2.5} dot={{ r: 3 }} name="Completion %" />
        <Line type="monotone" dataKey="attendance" stroke={ORANGE} strokeWidth={2.5} dot={{ r: 3 }} name="Attendance %" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function QuizBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="score" fill={ORANGE} radius={[8, 8, 0, 0]} name="Score" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ProgressCircle({ value, size = 120, label = 'Score', tone = 'light' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  const stroke = size < 90 ? 8 : 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  const isDark = tone === 'dark'
  const gradId = `circleGrad-${isDark ? 'dark' : 'light'}-${size}`

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={ORANGE} />
            <stop offset="100%" stopColor={TEAL_LIGHT} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0'}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
        <span className={`font-bold leading-none ${size < 90 ? 'text-lg' : 'text-2xl'} ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {pct}
        </span>
        <span className={`mt-0.5 text-center leading-tight ${size < 90 ? 'text-[9px]' : 'text-[11px]'} ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
          {label}
        </span>
      </div>
    </div>
  )
}

export { ORANGE, TEAL, TEAL_LIGHT, AMBER, ROSE, SLATE }
