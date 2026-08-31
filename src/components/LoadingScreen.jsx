import logo from '../assets/tnslogo.png'

export default function LoadingScreen({ fullPage = true }) {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-brand-red/25 blur-md" />
        <div className="relative rounded-2xl border border-white/80 bg-white p-3 shadow-lg">
          <img
            src={logo}
            alt="TNS ITI & Computer"
            className="h-20 w-20 object-contain sm:h-24 sm:w-24"
          />
        </div>
      </div>
      <div
        className="mt-7 h-9 w-9 animate-spin rounded-full border-[3px] border-gold/25 border-t-gold"
        aria-hidden
      />
      <span className="sr-only">Loading</span>
    </div>
  )

  if (!fullPage) {
    return (
      <div className="flex min-h-[280px] items-center justify-center py-16">
        {content}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(196,30,58,0.16),transparent_55%)]" />
      <div className="relative">{content}</div>
    </div>
  )
}
