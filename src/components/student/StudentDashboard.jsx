import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Moon,
  NotebookPen,
  Search,
  Settings,
  Sun,
  User,
  Video,
  Film,
  X,
  CheckCircle2,
  ClipboardPen,
  Lock,
  Clock,
  History,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import logo from '../../assets/tnslogo.png'
import LoadingScreen from '../LoadingScreen.jsx'
import {
  clearStudentSession,
  getStudentSession,
  getStudentToken,
  persistStudentSession,
} from '../../utils/studentAuth.js'
import {
  logoGlow,
  logoBox,
  navActive,
} from '../../utils/masterAdminTheme.js'
import {
  getStudentNotifications,
  markAllStudentNotificationsRead,
  markStudentNotificationRead,
} from '../../services/studentNotificationService.js'
import { getStudentMe } from '../../services/studentAuthService.js'
import { studentMediaUrl } from '../../services/studentClient.js'
import { getMyAdmissionAccess } from '../../services/admissionService.js'
import { subscribeStudentNotifications } from '../../utils/socket.js'
import { StudentThemeProvider, useStudentTheme, getStudentShell } from './StudentTheme.jsx'
import { slugToSection, studentPath } from '../../utils/studentRoutes.js'
import AdmissionAccessGate, {
  isAdmissionSectionOpen,
} from './AdmissionAccessGate.jsx'

import DashboardHome from './pages/DashboardHome.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import AttendancePage from './pages/AttendancePage.jsx'
import CoursesPage from './pages/CoursesPage.jsx'
import AssignmentsPage from './pages/AssignmentsPage.jsx'
import HomeworkPage from './pages/HomeworkPage.jsx'
import NotesPage from './pages/NotesPage.jsx'
import StudyMaterialsPage from './pages/StudyMaterialsPage.jsx'
import RecordedLecturesPage from './pages/RecordedLecturesPage.jsx'
import LiveClassesPage from './pages/LiveClassesPage.jsx'
import FeeManagementPage from './pages/FeeManagementPage.jsx'
import ExamResultsPage from './pages/ExamResultsPage.jsx'
import StudentExamsPage from './pages/StudentExamsPage.jsx'
import CertificatesPage from './pages/CertificatesPage.jsx'
import PerformanceAnalyticsPage from './pages/PerformanceAnalyticsPage.jsx'
import TimeTablePage from './pages/TimeTablePage.jsx'
import AnnouncementsPage from './pages/AnnouncementsPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import MessagesPage from './pages/MessagesPage.jsx'
import SupportPage from './pages/SupportPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import OnlineAdmissionPage from './pages/OnlineAdmissionPage.jsx'

const ACCESS_CACHE_KEY = 'tns_student_access'

function readAccessCache(email) {
  try {
    const raw = JSON.parse(sessionStorage.getItem(ACCESS_CACHE_KEY) || 'null')
    if (raw && raw.email === email) return raw
  } catch {
    // ignore
  }
  return null
}

function writeAccessCache(email, payload) {
  try {
    sessionStorage.setItem(
      ACCESS_CACHE_KEY,
      JSON.stringify({ email, ...payload }),
    )
  } catch {
    // ignore
  }
}

const sideMenu = [
  {
    group: 'MAIN',
    items: ['Dashboard', 'My Profile', 'Online Admission', 'Attendance', 'Courses'],
  },
  {
    group: 'LEARNING',
    items: [
      'Assignments',
      'Homework',
      'Notes',
      'Study Materials',
      'Recorded Lectures',
      'Live Classes',
    ],
  },
  {
    group: 'ACADEMICS',
    items: [
      'Fee Management',
      'Certificates',
      'Performance Analytics',
      'Time Table',
    ],
  },
  {
    group: 'ONLINE EXAM',
    items: ['Upcoming Exams', 'Live Exams', 'My Results', 'Exam History'],
  },
  {
    group: 'COMMUNICATION',
    items: ['Announcements', 'Notifications', 'Messages'],
  },
  {
    group: 'ACCOUNT',
    items: ['Support', 'Settings'],
  },
]

const itemIcon = {
  Dashboard: LayoutDashboard,
  'My Profile': User,
  'Online Admission': ClipboardPen,
  Attendance: CheckCircle2,
  Courses: BookOpen,
  Assignments: ClipboardList,
  Homework: NotebookPen,
  Notes: FileText,
  'Study Materials': FolderOpen,
  'Recorded Lectures': Film,
  'Live Classes': Video,
  'Fee Management': IndianRupee,
  'Exam & Results': GraduationCap,
  'Upcoming Exams': Clock,
  'Live Exams': GraduationCap,
  'My Results': Award,
  'Exam History': History,
  Certificates: Award,
  'Performance Analytics': BarChart3,
  'Time Table': CalendarDays,
  Announcements: Megaphone,
  Notifications: Bell,
  Messages: MessageSquare,
  Support: HelpCircle,
  Settings: Settings,
}

const sectionDescriptions = {
  Dashboard: 'Your learning overview — progress, attendance, fees, classes and quick actions.',
  'My Profile': 'Personal details, contacts, education, skills and achievements.',
  'Online Admission':
    'Apply online with full admission form, payment options and send application for review.',
  Attendance: 'Monthly calendar, subject-wise attendance and downloadable reports.',
  Courses: 'Current and completed courses with progress and continue learning.',
  Assignments: 'Pending, completed and late assignments with upload and marks.',
  Homework: 'Daily homework cards with priority, due dates and status.',
  Notes: 'Subject-wise notes with pin, bookmark and download.',
  'Study Materials': 'PDFs, videos, PPTs, ZIPs and external links for your courses.',
  'Recorded Lectures': 'Watch past sessions and continue from where you left off.',
  'Live Classes': "Today's and upcoming live sessions with join links.",
  'Fee Management': 'Installments, payment history, invoices and receipts.',
  'Exam & Results': 'Upcoming exams, marks, rank, GPA and marksheet download.',
  'Upcoming Exams': 'Scheduled online exams assigned to you.',
  'Live Exams': 'Exams that are open now. Start or resume before the timer ends.',
  'My Results': 'Instant and released results for your submitted exams.',
  'Exam History': 'Completed and expired online exam attempts.',
  Certificates: 'Issued certificates with preview and download.',
  'Performance Analytics': 'Charts for learning hours, quizzes, assignments and attendance.',
  'Time Table': "Weekly timetable, today's schedule and upcoming holidays.",
  Announcements: 'College and trainer announcements with pinned updates.',
  Notifications: 'Unread alerts and recent portal notifications.',
  Messages: 'Inbox and trainer chat (UI demo).',
  Support: 'Raise tickets, FAQs and contact the institute.',
  Settings: 'Theme, language, notification preferences and password.',
}

function ThemeToggleButton({ isDark, onToggle, className = '' }) {
  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={onToggle}
      className={className}
    >
      {isDark ? <Sun size={16} className="text-[#FF5E14]" /> : <Moon size={16} className="text-[#008C95]" />}
    </button>
  )
}

function StudentsDashboardInner() {
  const navigate = useNavigate()
  const { sectionSlug } = useParams()
  const [searchParams] = useSearchParams()
  const session = getStudentSession()
  const { isDark, toggleTheme } = useStudentTheme()
  const shell = getStudentShell(isDark)

  const routeSlug = sectionSlug

  const activeSection = useMemo(() => {
    const fromUrl = slugToSection(routeSlug)
    if (routeSlug && !fromUrl) return 'Dashboard'
    return fromUrl || 'Dashboard'
  }, [routeSlug])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [notifications, setNotifications] = useState([])
  const [headerProfile, setHeaderProfile] = useState(null)
  const [profileRefreshKey, setProfileRefreshKey] = useState(0)
  const cachedAccess = readAccessCache(session?.email)
  const [admissionApproved, setAdmissionApproved] = useState(() => Boolean(cachedAccess?.approved))
  const [admissionStatus, setAdmissionStatus] = useState(() => cachedAccess?.status || '')
  const [admissionCheckLoading, setAdmissionCheckLoading] = useState(() => cachedAccess == null)

  const displayName = headerProfile?.name || session?.name || 'Student'
  const displayEmail = headerProfile?.email || session?.email || ''
  const displayAvatar =
    studentMediaUrl(headerProfile?.avatar) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FF5E14&color=fff&size=128`
  const unreadCount = notifications.filter((n) => !n.read).length
  const sectionLocked = !admissionApproved && !isAdmissionSectionOpen(activeSection)

  const reloadAdmissionAccess = useCallback(async () => {
    const token = getStudentToken()
    const current = getStudentSession()
    if (!token) {
      if (current?.isDemo) {
        setAdmissionApproved(true)
        setAdmissionStatus('Approved')
      } else {
        setAdmissionApproved(false)
        setAdmissionStatus('')
      }
      setAdmissionCheckLoading(false)
      return
    }
    try {
      const access = await getMyAdmissionAccess(token)
      setAdmissionApproved(access.approved)
      setAdmissionStatus(access.status)
      writeAccessCache(current?.email, {
        approved: access.approved,
        status: access.status,
      })
    } catch {
      // keep cached gate so the dashboard does not go blank on a slow retry
    } finally {
      setAdmissionCheckLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = getStudentToken()
    if (!token) return undefined
    getStudentMe(token)
      .then((data) => {
        if (data?.user) {
          setHeaderProfile(data.user)
          persistStudentSession({ user: data.user })
        }
      })
      .catch(() => {})
    return undefined
  }, [])

  useEffect(() => {
    reloadAdmissionAccess()
  }, [reloadAdmissionAccess])

  useEffect(() => {
    if (activeSection === 'Online Admission') {
      reloadAdmissionAccess()
    }
  }, [activeSection, reloadAdmissionAccess])

  useEffect(() => {
    if (admissionApproved) return undefined
    const intervalId = window.setInterval(() => {
      reloadAdmissionAccess()
    }, 15000)
    return () => window.clearInterval(intervalId)
  }, [admissionApproved, reloadAdmissionAccess])

  const reloadNotifications = useCallback(async () => {
    try {
      const data = await getStudentNotifications()
      setNotifications(data.notifications)
    } catch {
      // keep existing list on transient failures
    }
  }, [])

  useEffect(() => {
    reloadNotifications()
  }, [reloadNotifications])

  useEffect(() => {
    const id = window.setInterval(reloadNotifications, 15000)
    return () => window.clearInterval(id)
  }, [reloadNotifications])

  useEffect(() => {
    if (!displayEmail) return undefined
    return subscribeStudentNotifications({ email: displayEmail, userId: session?.id }, (incoming) => {
      if (!incoming?.id) return
      setNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) return prev
        return [incoming, ...prev]
      })

      const type = String(incoming?.type || '').toLowerCase()
      const metaStatus = String(incoming?.meta?.status || '').toLowerCase()
      const text = `${incoming?.title || ''} ${incoming?.body || ''}`.toLowerCase()
      const looksLikeAdmissionUpdate =
        type === 'admission' ||
        ((metaStatus === 'approved' || metaStatus === 'rejected') && text.includes('admission')) ||
        text.includes('admission')

      if (looksLikeAdmissionUpdate && type !== 'profile') {
        reloadAdmissionAccess()
      }
      if (type === 'profile' || text.includes('profile update')) {
        const token = getStudentToken()
        if (!token) return
        getStudentMe(token)
          .then((data) => {
            if (data?.user) {
              setHeaderProfile(data.user)
              persistStudentSession({ token: data.token || token, user: data.user })
              setProfileRefreshKey((n) => n + 1)
            }
          })
          .catch(() => {})
      }
    })
  }, [displayEmail, reloadAdmissionAccess, session?.id])

  useEffect(() => {
    if (routeSlug && !slugToSection(routeSlug)) {
      navigate(studentPath('Dashboard'), { replace: true })
    }
  }, [routeSlug, navigate])

  useEffect(() => {
    setSidebarOpen(false)
    setNotifOpen(false)
    setProfileOpen(false)
  }, [activeSection])

  useEffect(() => {
    if (activeSection === 'Notifications') {
      reloadNotifications()
    }
  }, [activeSection, reloadNotifications])

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await markAllStudentNotificationsRead()
    } catch {
      reloadNotifications()
    }
  }

  const handleMarkRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    try {
      await markStudentNotificationRead(id)
    } catch {
      reloadNotifications()
    }
  }

  const openNotification = (n) => {
    handleMarkRead(n.id)
    const actionUrl = n.meta?.actionUrl || n.actionUrl
    if (actionUrl) {
      navigate(actionUrl)
      return
    }
    if (n.type === 'exam' && n.meta?.examId) {
      navigate(`${studentPath('Live Exams')}?exam=${n.meta.examId}&view=instructions`)
      return
    }
    if (String(n.type || '').toLowerCase() === 'profile' || /profile/i.test(n.title || '')) {
      goToSection('My Profile')
    }
  }

  const handleSignOut = () => {
    try {
      sessionStorage.removeItem(ACCESS_CACHE_KEY)
    } catch {
      // ignore
    }
    clearStudentSession()
    navigate('/signin', { replace: true })
  }

  const goToSection = (section) => {
    navigate(studentPath(section))
  }

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sideMenu
    return sideMenu
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.toLowerCase().includes(q)),
      }))
      .filter((group) => group.items.length > 0)
  }, [search])

  const sectionComponentMap = {
    Dashboard: (
      <DashboardHome
        onNavigate={goToSection}
        liveProfile={headerProfile}
        unreadCount={unreadCount}
      />
    ),
    'My Profile': <ProfilePage key={profileRefreshKey} />,
    'Online Admission': <OnlineAdmissionPage />,
    Attendance: <AttendancePage />,
    Courses: <CoursesPage />,
    Assignments: <AssignmentsPage />,
    Homework: <HomeworkPage />,
    Notes: <NotesPage />,
    'Study Materials': <StudyMaterialsPage />,
    'Recorded Lectures': <RecordedLecturesPage />,
    'Live Classes': <LiveClassesPage />,
    'Fee Management': <FeeManagementPage />,
    'Exam & Results': <ExamResultsPage />,
    'Upcoming Exams': <StudentExamsPage variant="upcoming" />,
    'Live Exams': <StudentExamsPage variant="live" />,
    'My Results': <StudentExamsPage variant="results" />,
    'Exam History': <StudentExamsPage variant="history" />,
    Certificates: <CertificatesPage />,
    'Performance Analytics': <PerformanceAnalyticsPage />,
    'Time Table': <TimeTablePage />,
    Announcements: <AnnouncementsPage />,
    Notifications: (
      <NotificationsPage
        items={notifications}
        onMarkAllRead={handleMarkAllRead}
        onMarkRead={handleMarkRead}
        onOpen={openNotification}
      />
    ),
    Messages: <MessagesPage />,
    Support: <SupportPage />,
    Settings: <SettingsPage />,
  }

  if (!session) return <Navigate to="/signin" replace />

  const takingExam = searchParams.get('view') === 'exam'

  if (takingExam) {
    if (sectionLocked) {
      return (
        <section className={`relative min-h-screen w-full ${shell.root}`}>
          <main className="min-h-screen w-full px-3 py-6">
            <AdmissionAccessGate
              status={admissionStatus}
              onGoAdmission={() => goToSection('Online Admission')}
              onGoProfile={() => goToSection('My Profile')}
            />
          </main>
        </section>
      )
    }
    return (
      <section className={`relative min-h-screen w-full ${shell.root}`}>
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className={`absolute inset-0 ${shell.glow}`} />
        </div>
        <main className="min-h-screen w-full px-2 py-3 sm:px-4">
          {sectionComponentMap[activeSection] || <StudentExamsPage variant="live" />}
        </main>
      </section>
    )
  }

  return (
    <section className={`relative min-h-screen w-full ${shell.root}`}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className={`absolute inset-0 ${shell.glow}`} />
        <div className={`absolute inset-0 bg-[size:120px_120px] ${shell.grid}`} />
      </div>
      <div className="relative grid min-h-screen w-full grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] lg:h-screen">
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
            className={`fixed inset-0 z-40 backdrop-blur-sm lg:hidden ${shell.overlay}`}
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-[320px] flex-col overflow-hidden border-r transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:min-h-0 lg:w-72 lg:max-w-none lg:shrink-0 lg:translate-x-0 ${shell.sidebar} ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex shrink-0 items-start gap-2 border-b border-[#00A896]/20 px-4 pb-3 pt-4 lg:px-5 lg:pt-5">
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <div className="relative shrink-0">
                <div className={`${logoGlow} opacity-70`} />
                <div className={logoBox}>
                  <img src={logo} alt="TNS ITI & Computer" className="h-6 w-6 object-contain" />
                </div>
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className={`truncate text-[15px] font-bold uppercase leading-snug tracking-[0.06em] ${shell.brandTitle}`}>
                    TNS ITI & Computer
                </p>
                <p className={`mt-0.5 truncate text-[11px] font-medium uppercase leading-tight tracking-[0.12em] ${shell.brandSub}`}>
                  Student Portal
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border lg:hidden ${shell.iconBtn}`}
            >
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,94,20,0.35)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#FF5E14]/25 hover:[&::-webkit-scrollbar-thumb]:bg-[#FF5E14]/45 lg:px-5 lg:pb-5">
            {filteredMenu.map((menu) => (
              <div key={menu.group}>
                <p className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${shell.groupLabel}`}>
                  {menu.group}
                </p>
                <div className="space-y-1">
                  {menu.items.map((item) => {
                    const Icon = itemIcon[item] || LayoutDashboard
                    const active = item === activeSection
                    const locked =
                      !admissionApproved && !isAdmissionSectionOpen(item)
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => goToSection(item)}
                        className={`flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                          active ? navActive : shell.navInactive
                        } ${locked && !active ? 'opacity-70' : ''}`}
                      >
                        <Icon size={15} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{item}</span>
                        {locked ? (
                          <Lock size={12} className="shrink-0 opacity-70" />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleSignOut}
              className={`flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${shell.navInactive}`}
            >
              <LogOut size={15} className="shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="min-h-screen w-full min-w-0 px-2 pb-2 pt-0 sm:px-3 sm:pb-3 lg:h-screen lg:overflow-y-auto lg:px-3 lg:pb-3">
          <div
            className={`sticky top-0 z-30 -mx-2 mb-3 flex items-center gap-2 border-b px-2 py-2 backdrop-blur-xl sm:-mx-3 sm:gap-2 sm:px-3 sm:py-2.5 lg:-mx-3 lg:px-3 ${shell.mobileBar}`}
          >
              <button
                type="button"
                aria-label="Open sidebar"
                onClick={() => setSidebarOpen(true)}
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border lg:hidden ${shell.iconBtn}`}
              >
                <Menu size={18} />
              </button>

              <div className={`flex min-w-0 flex-1 items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm sm:px-3 sm:py-2 ${shell.search}`}>
                <Search size={16} className="shrink-0 text-[#FF5E14]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className={`w-full min-w-0 bg-transparent text-sm outline-none ${shell.searchInput}`}
                />
              </div>

              <div className="relative flex shrink-0 items-center gap-1 sm:gap-1.5">
                <ThemeToggleButton
                  isDark={isDark}
                  onToggle={toggleTheme}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition sm:h-10 sm:w-10 sm:rounded-full ${shell.iconBtn}`}
                />

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen((v) => !v)
                      setProfileOpen(false)
                    }}
                    className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border sm:h-10 sm:w-10 sm:rounded-full ${shell.iconBtn}`}
                  >
                    <Bell size={16} />
                    {unreadCount > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF5E14] px-1 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                  </button>
                  {notifOpen ? (
                    <div className={`absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border p-3 ${shell.dropdown}`}>
                      <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${shell.dropdownMuted}`}>Notifications</p>
                      <ul className="max-h-64 space-y-2 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <li className={`rounded-lg border px-3 py-2 ${shell.dropdownItem}`}>
                            <p className={`text-xs ${shell.dropdownMuted}`}>No notifications yet</p>
                          </li>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <li key={n.id} className={`rounded-lg border px-3 py-2 ${shell.dropdownItem}`}>
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => {
                          setNotifOpen(false)
                          openNotification(n)
                        }}
                      >
                              <p className={`text-xs font-medium ${shell.dropdownText}`}>{n.title}</p>
                              {n.body ? (
                                <p className={`mt-0.5 line-clamp-2 text-[10px] ${shell.dropdownMeta}`}>
                                  {n.body}
                                </p>
                              ) : null}
                              <p className={`text-[10px] ${shell.dropdownMeta}`}>{n.time}</p>
                      </button>
                            </li>
                          ))
                        )}
                      </ul>
                      <button
                        type="button"
                        onClick={() => goToSection('Notifications')}
                        className="mt-2 w-full text-center text-xs font-semibold text-[#00E5CC] hover:text-[#FF5E14]"
                      >
                        View all
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen((v) => !v)
                      setNotifOpen(false)
                    }}
                    className={`flex items-center gap-2 rounded-lg border p-1 text-sm sm:rounded-full sm:p-1.5 lg:py-1.5 lg:pl-1.5 lg:pr-3 ${shell.iconBtn}`}
                  >
                    <img
                      src={displayAvatar}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <span className="hidden max-w-[120px] truncate lg:inline">{displayName}</span>
                  </button>
                  {profileOpen ? (
                    <div className={`absolute right-0 z-50 mt-2 w-56 rounded-lg border p-2 ${shell.dropdown}`}>
                      <p className={`px-2 py-1.5 text-[11px] ${shell.dropdownMuted}`}>{displayEmail}</p>
                      <button
                        type="button"
                        onClick={() => goToSection('My Profile')}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${shell.menuItem}`}
                      >
                        <User size={14} /> My Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => goToSection('Settings')}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${shell.menuItem}`}
                      >
                        <Settings size={14} /> Settings
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${shell.menuItem}`}
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
          </div>

          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h1 className={`text-xl font-semibold sm:text-2xl ${shell.pageTitle}`}>{activeSection}</h1>
              <p className={`mt-0.5 text-xs sm:text-sm ${shell.pageDesc}`}>
                {sectionDescriptions[activeSection] || `${activeSection} module`}
              </p>
            </div>
          </div>

          {admissionCheckLoading && !admissionApproved ? (
            <LoadingScreen fullPage={false} />
          ) : sectionLocked ? (
            <AdmissionAccessGate
              status={admissionStatus}
              onGoAdmission={() => goToSection('Online Admission')}
              onGoProfile={() => goToSection('My Profile')}
            />
          ) : (
            sectionComponentMap[activeSection]
          )}
        </main>
      </div>
    </section>
  )
}

export default function StudentDashboard() {
  return (
    <StudentThemeProvider>
      <StudentsDashboardInner />
    </StudentThemeProvider>
  )
}
