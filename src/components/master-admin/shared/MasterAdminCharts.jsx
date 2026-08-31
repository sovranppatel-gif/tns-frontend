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

export const RED = '#c41e3a'
export const NAVY = '#0b1d3a'
export const GOLD = '#d4a017'
export const EMERALD = '#10B981'
export const AMBER = '#F59E0B'
export const SKY = '#0EA5E9'
export const ROSE = '#F43F5E'

const COLORS = [RED, NAVY, GOLD, EMERALD, AMBER, SKY, ROSE]

function chartTheme(isDark) {
  return {
    tick: isDark ? '#94a3b8' : '#64748b',
    grid: isDark ? '#1e3a5f' : '#e2e8f0',
    tooltip: {
      borderRadius: 12,
      border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
      background: isDark ? '#0b1d3a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0b1d3a',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      fontSize: 12,
    },
  }
}

function EmptyChart({ height = 240, isDark = false }) {
  return (
    <div
      className={`grid place-items-center rounded-lg text-xs ${isDark ? 'bg-white/5 text-white/40' : 'bg-slate-50 text-slate-400'}`}
      style={{ height }}
    >
      No chart data yet
    </div>
  )
}

export function LineTrendChart({ data, xKey = 'name', yKey = 'value', yLabel = 'Value', height = 240, isDark = false }) {
  if (!data?.length) return <EmptyChart height={height} isDark={isDark} />
  const theme = chartTheme(isDark)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
        <XAxis dataKey={xKey} tick={{ fill: theme.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: theme.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={theme.tooltip} />
        <Line type="monotone" dataKey={yKey} stroke={RED} strokeWidth={2.5} dot={{ r: 3, fill: GOLD }} name={yLabel} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function AreaTrendChart({
  data,
  xKey = 'name',
  yKey = 'value',
  yLabel = 'Value',
  height = 240,
  isDark = false,
  fillId = 'tnsAreaFill',
}) {
  if (!data?.length) return <EmptyChart height={height} isDark={isDark} />
  const theme = chartTheme(isDark)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={RED} stopOpacity={0.35} />
            <stop offset="100%" stopColor={NAVY} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
        <XAxis dataKey={xKey} tick={{ fill: theme.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: theme.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={theme.tooltip} />
        <Area type="monotone" dataKey={yKey} stroke={RED} fill={`url(#${fillId})`} strokeWidth={2} name={yLabel} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function BarMetricChart({
  data,
  xKey = 'name',
  yKey = 'value',
  yLabel = 'Value',
  height = 240,
  isDark = false,
  formatter,
}) {
  if (!data?.length) return <EmptyChart height={height} isDark={isDark} />
  const theme = chartTheme(isDark)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
        <XAxis dataKey={xKey} tick={{ fill: theme.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: theme.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={theme.tooltip} formatter={formatter} />
        <Bar dataKey={yKey} radius={[8, 8, 0, 0]} name={yLabel}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DonutChart({ data, height = 240, isDark = false }) {
  const rows = (data || []).filter((d) => Number(d.value) > 0)
  if (!rows.length) return <EmptyChart height={height} isDark={isDark} />
  const theme = chartTheme(isDark)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
          {rows.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={theme.tooltip} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function MultiLineChart({ data, xKey = 'name', series = [], height = 240, isDark = false, formatter }) {
  if (!data?.length || !series.length) return <EmptyChart height={height} isDark={isDark} />
  const theme = chartTheme(isDark)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
        <XAxis dataKey={xKey} tick={{ fill: theme.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: theme.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={theme.tooltip} formatter={formatter} />
        <Legend />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label || s.key}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2.2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
