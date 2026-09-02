import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  FiGrid,
  FiUser,
  FiClipboard,
  FiCheckCircle,
  FiBookOpen,
  FiFileText,
  FiCalendar,
  FiBell,
  FiMessageSquare,
  FiHelpCircle,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiSearch,
  FiMoon,
  FiSun,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiHome,
  FiLayers,
  FiDollarSign,
  FiShield,
  FiDatabase,
  FiGlobe,
  FiMonitor,
  FiEdit3,
  FiBriefcase,
  FiClock,
  FiTag,
  FiArchive,
  FiTrendingUp,
  FiDownload,
} from 'react-icons/fi'
import { FaIdCard, FaVideo, FaBullhorn, FaTicketAlt } from 'react-icons/fa'
import logo from '../../assets/tnslogo.png'
import LoadingScreen from '../LoadingScreen.jsx'
import { clearMasterAdminSession, getMasterAdminSession, verifyMasterAdminWithServer } from '../../utils/masterAdminAuth'
import { isStaffProfileId, masterAdminPath, slugToSection, staffSegmentToSection } from '../../utils/masterAdminRoutes'
import { getMasterShell, readMasterTheme, writeMasterTheme } from '../../utils/masterAdminTheme'
import { getModuleConfig, notifications as notifSeed } from '../../data/masterAdminData'
import { ModulePage } from './MasterAdminUI'
import MasterHome from './MasterHome'
import { CctvPage, CmsPage, IdCardPage } from './SpecialPages'
import PrintCardsPage from './id-card/PrintCardsPage.jsx'
import AdmissionsPage from './erp/AdmissionsPage.jsx'
import AdmissionFormPage from './erp/AdmissionFormPage.jsx'
import UniversitiesPage from './erp/UniversitiesPage.jsx'
import CoursesPage from './erp/CoursesPage.jsx'
import FeesPage from './erp/FeesPage.jsx'
import AccountingPage from './finance/AccountingPage.jsx'
import ExpensesPage from './finance/ExpensesPage.jsx'
import IncomePage from './finance/IncomePage.jsx'
import SalaryManagementPage from './finance/SalaryManagementPage.jsx'
import PayrollPage from './finance/PayrollPage.jsx'
import PaymentsPage from './finance/PaymentsPage.jsx'
import AttendancePage from './erp/AttendancePage.jsx'
import BatchesPage from './erp/BatchesPage.jsx'
import StudentsPage from './erp/StudentsPage.jsx'
import ProfileRequestsPage from './erp/ProfileRequestsPage.jsx'
import AuditLogsPage from './AuditLogsPage.jsx'
import ReportsPage from './reports/ReportsPage.jsx'
import AnalyticsPage from './analytics/AnalyticsPage.jsx'
import DownloadsPage from './downloads/DownloadsPage.jsx'
import BackupPage from './backup/BackupPage.jsx'
import FacultyPage from './faculty/FacultyPage.jsx'
import FacultyFormPage from './faculty/FacultyFormPage.jsx'
import FacultyAssignmentsPage from './faculty/FacultyAssignmentsPage.jsx'
import FacultyProfilePage from './faculty/FacultyProfilePage.jsx'
import FacultyTimetablePage from './faculty/FacultyTimetablePage.jsx'
import StaffPage from './staff/StaffPage.jsx'
import AddStaffPage from './staff/AddStaffPage.jsx'
import StaffProfilePage from './staff/StaffProfilePage.jsx'
import StaffDepartmentsPage from './staff/StaffDepartmentsPage.jsx'
import StaffDesignationsPage from './staff/StaffDesignationsPage.jsx'
import StaffCategoriesPage from './staff/StaffCategoriesPage.jsx'
import StaffShiftsPage from './staff/StaffShiftsPage.jsx'
import ArchivedStaffPage from './staff/ArchivedStaffPage.jsx'
import OnlineExamsPage from './exams/OnlineExamsPage.jsx'
import QuestionBankPage from './exams/QuestionBankPage.jsx'
import ExamPapersPage from './exams/ExamPapersPage.jsx'
import ExamSchedulePage from './exams/ExamSchedulePage.jsx'
import ExamResultsPage from './exams/ExamResultsPage.jsx'
import AssignmentsPage from './assignments/AssignmentsPage.jsx'
import AssignmentDetailPage from './assignments/AssignmentDetailPage.jsx'
import { logoutMasterAdmin } from '../../services/activityLogService.js'

const LANDING_CMS = ['Hero CMS', 'About CMS', 'Courses CMS', 'Gallery CMS', 'Contact CMS']

const sideMenu = [
  {
    group: 'MAIN MENU',
    items: [
      'Dashboard',
      { label: 'Manage Landing Page', children: LANDING_CMS },
      {
        label: 'Enquiry Management',
        children: ['Enquiry Management', 'Leads'],
        displayLabels: { 'Enquiry Management': 'Enquiry' },
      },
      'CCTV Cameras',
      'Institute Overview',
    ],
  },
  {
    group: 'ADMISSIONS & PEOPLE',
    items: [
      'Admissions',
      'New Admission',
      'Universities',
      'Students',
      'Profile Requests',
      'ID Card Generate',
      'Print Cards',
      {
        label: 'Faculty Management',
        children: ['Faculty', 'Add Faculty', 'Faculty Assignments', 'Time Table'],
        displayLabels: {
          Faculty: 'Faculty',
          'Add Faculty': 'Add Faculty',
          'Faculty Assignments': 'Assignments',
          'Time Table': 'Timetable',
        },
      },
      {
        label: 'Staff Management',
        children: [
          'Staff',
          'Add Staff',
          'Staff Departments',
          'Staff Designations',
          'Staff Categories',
          'Staff Shifts',
          'Archived Staff',
        ],
        displayLabels: {
          Staff: 'Staff Directory',
          'Add Staff': 'Add Staff',
          'Staff Departments': 'Departments',
          'Staff Designations': 'Designations',
          'Staff Categories': 'Staff Categories',
          'Staff Shifts': 'Shifts & Duty Hours',
          'Archived Staff': 'Archived Staff',
        },
      },
      'Parents',
    ],
  },
  {
    group: 'ACADEMICS',
    items: [
      'Departments',
      'Courses',
      'Programs',
      'Batches',
      'Subjects',
      'Classes',
      'Attendance',
      'Time Table',
      {
        label: 'Assignment Management',
        children: ['Assignments', 'Create Assignment', 'Assignment Analytics'],
      },
      'Homework',
      'Study Materials',
      'Notes',
      'Certificates',
    ],
  },
  {
    group: 'ONLINE EXAM',
    items: ['Online Exams', 'Question Bank', 'Exam Papers', 'Exam Schedule', 'Exam Results'],
  },
  {
    group: 'FINANCE & HR',
    items: ['Fees', 'Accounting', 'Expenses', 'Income', 'Salary Management', 'Payroll', 'Payments'],
  },
  {
    group: 'FACILITIES',
    items: ['Library', 'Hostel', 'Transport', 'Inventory', 'Assets'],
  },
  {
    group: 'CAREER & EVENTS',
    items: ['Placement Cell', 'Training Management', 'Internships', 'Events', 'Calendar'],
  },
  {
    group: 'COMMUNICATION',
    items: ['Announcements', 'Messages', 'Notifications', 'Help Desk', 'Support Tickets'],
  },
  {
    group: 'INSIGHTS',
    items: ['Reports', 'Analytics', 'Downloads', 'Backup', 'Audit Logs'],
  },
  {
    group: 'ADMINISTRATION',
    items: [
      'Roles & Permissions',
      'Branches',
      'Users',
      'System Settings',
      'Website CMS',
      'Email Templates',
      'SMS Templates',
      'WhatsApp Templates',
      'API Management',
      'Integrations',
      'Security',
      'Settings',
      'Profile',
    ],
  },
]

const itemIcon = {
  Dashboard: FiGrid,
  'Manage Landing Page': FiMonitor,
  'Enquiry Management': FiMessageSquare,
  Leads: FiUsers,
  'CCTV Cameras': FaVideo,
  'Institute Overview': FiHome,
  Admissions: FiClipboard,
  'New Admission': FiClipboard,
  Universities: FiGlobe,
  Students: FiUsers,
  'Profile Requests': FiUserCheck,
  'ID Card Generate': FaIdCard,
  'Print Cards': FaIdCard,
  Faculty: FiUser,
  'Add Faculty': FiUserPlus,
  'Faculty Management': FiUsers,
  'Faculty Assignments': FiLayers,
  'Time Table': FiCalendar,
  'Staff Management': FiUsers,
  Staff: FiUsers,
  'Add Staff': FiUserPlus,
  'Staff Departments': FiHome,
  'Staff Designations': FiBriefcase,
  'Staff Categories': FiTag,
  'Staff Shifts': FiClock,
  'Archived Staff': FiArchive,
  Parents: FiUsers,
  Courses: FiBookOpen,
  Batches: FiLayers,
  Attendance: FiCheckCircle,
  Fees: FiDollarSign,
  Accounting: FiDollarSign,
  Expenses: FiDollarSign,
  Income: FiTrendingUp,
  'Salary Management': FiBriefcase,
  Payroll: FiUsers,
  Payments: FiDollarSign,
  Settings: FiSettings,
  Profile: FiUser,
  Notifications: FiBell,
  'Help Desk': FaTicketAlt,
  'Audit Logs': FiShield,
  Backup: FiDatabase,
  'Website CMS': FiGlobe,
  Announcements: FaBullhorn,
  Calendar: FiCalendar,
  Reports: FiFileText,
  Analytics: FiTrendingUp,
  Downloads: FiDownload,
  'Online Exams': FiEdit3,
  'Assignment Management': FiClipboard,
  Assignments: FiClipboard,
  'Create Assignment': FiEdit3,
  'Assignment Analytics': FiTrendingUp,
  'Question Bank': FiHelpCircle,
  'Exam Papers': FiFileText,
  'Exam Schedule': FiCalendar,
  'Exam Results': FiCheckCircle,
}

function SidebarIcon({ icon: Icon, size = 16 }) {
  return (
    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
      <Icon size={size} />
    </span>
  )
}

function SidebarMenuButton({
  collapsed = false,
  className = '',
  title,
  onClick,
  icon: Icon,
  label,
  showChevron = false,
  chevronOpen = false,
}) {
  if (collapsed) {
    return (
      <button
        type="button"
        title={title || label}
        onClick={onClick}
        className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg p-0 text-sm font-medium transition ${className}`}
      >
        <SidebarIcon icon={Icon} />
      </button>
    )
  }

  return (
    <button
      type="button"
      title={title || label}
      onClick={onClick}
      className={`flex min-h-10 w-full min-w-0 items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
        showChevron ? 'justify-between gap-2' : 'gap-2.5'
      } ${className}`}
    >
      {showChevron ? (
        <>
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <SidebarIcon icon={Icon} />
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </span>
          <FiChevronDown size={14} className={`shrink-0 transition ${chevronOpen ? 'rotate-180' : ''}`} />
        </>
      ) : (
        <>
          <SidebarIcon icon={Icon} />
          <span className="min-w-0 flex-1 truncate">{label}</span>
        </>
      )}
    </button>
  )
}

function SidebarChildButton({ className = '', onClick, children, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-9 w-full min-w-0 items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs font-medium ${className}`}
    >
      {Icon ? <SidebarIcon icon={Icon} size={13} /> : null}
      <span className="truncate">{children}</span>
    </button>
  )
}

function SidebarGroup({ children }) {
  return <div className="min-w-0 space-y-1">{children}</div>
}

function SidebarGroupLabel({ collapsed, dividerClass, labelClass, group, isOpen, onToggle }) {
  if (collapsed) {
    return <div className={`hidden h-px lg:block ${dividerClass}`} />
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex min-h-7 w-full min-w-0 items-center justify-between gap-2 px-3 text-left text-[11px] font-semibold tracking-[0.12em] uppercase ${labelClass}`}
    >
      <span className="min-w-0 truncate">{group}</span>
      <FiChevronDown size={12} className={`shrink-0 transition ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  )
}

export default function MasterDashboard() {
  const navigate = useNavigate()
  const { sectionSlug, feeStudentSlug, facultyId, staffId, assignmentAction } = useParams()
  const session = getMasterAdminSession()

  const activeSection = useMemo(() => {
    if (feeStudentSlug) return 'Fees'
    if (assignmentAction === 'create') return 'Create Assignment'
    if (assignmentAction === 'analytics') return 'Assignment Analytics'
    if (assignmentAction) return 'Assignment Details'
    if (facultyId === 'assignments') return 'Faculty Assignments'
    if (facultyId === 'new') return 'Add Faculty'
    if (facultyId) return 'Faculty'
    if (staffSegmentToSection(staffId)) return staffSegmentToSection(staffId)
    if (staffId) return 'Staff'
    const fromUrl = slugToSection(sectionSlug)
    if (sectionSlug && !fromUrl) return 'Dashboard'
    return fromUrl || 'Dashboard'
  }, [sectionSlug, feeStudentSlug, facultyId, staffId, assignmentAction])

  const pageTitle = useMemo(() => {
    if (facultyId && facultyId !== 'assignments' && facultyId !== 'new') return 'Faculty Profile'
    if (isStaffProfileId(staffId)) return 'Staff Profile'
    if (activeSection === 'Faculty') return 'Faculty Management'
    if (activeSection === 'Add Faculty') return 'Add Faculty'
    if (activeSection === 'Faculty Assignments') return 'Faculty Assignments'
    if (activeSection === 'Create Assignment') return 'Create Assignment'
    if (activeSection === 'Assignment Analytics') return 'Assignment Analytics'
    if (activeSection === 'Time Table') return 'Timetable'
    if (activeSection === 'Staff') return 'Staff Directory'
    if (activeSection === 'Add Staff') return 'Add Staff'
    if (activeSection === 'Staff Departments') return 'Staff Departments'
    if (activeSection === 'Staff Designations') return 'Staff Designations'
    if (activeSection === 'Staff Categories') return 'Staff Categories'
    if (activeSection === 'Staff Shifts') return 'Shifts & Duty Hours'
    if (activeSection === 'Archived Staff') return 'Archived Staff'
    return activeSection
  }, [activeSection, facultyId, staffId])

  const [theme, setTheme] = useState(readMasterTheme)
  const isDark = theme === 'dark'
  const shell = getMasterShell(isDark)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState(() => new Set())
  const [openGroups, setOpenGroups] = useState(() => new Set(['MAIN MENU', 'ADMISSIONS & PEOPLE', 'ACADEMICS', 'ONLINE EXAM']))
  const [navQuery, setNavQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState(notifSeed)
  const [authReady, setAuthReady] = useState(false)

  const unreadCount = notifications.filter((n) => n.status === 'Unread').length
  const displayName = session?.name || 'Master Admin'
  const displayEmail = session?.email || ''

  useEffect(() => writeMasterTheme(theme), [theme])

  useEffect(() => {
    let cancelled = false
    verifyMasterAdminWithServer().then((user) => {
      if (cancelled) return
      if (!user) {
        navigate('/master-admin', { replace: true })
        return
      }
      setAuthReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    if (facultyId || staffId) return
    if (sectionSlug && !slugToSection(sectionSlug)) {
      navigate(masterAdminPath('Dashboard'), { replace: true })
    }
  }, [sectionSlug, facultyId, staffId, navigate])

  useEffect(() => {
    setSidebarOpen(false)
    setNotifOpen(false)
    setProfileOpen(false)
  }, [activeSection])

  useEffect(() => {
    if (LANDING_CMS.includes(activeSection)) {
      setOpenSubmenus((prev) => new Set([...prev, 'Manage Landing Page']))
      setOpenGroups((prev) => new Set([...prev, 'MAIN MENU']))
    }
    if (activeSection === 'Enquiry Management' || activeSection === 'Leads') {
      setOpenSubmenus((prev) => new Set([...prev, 'Enquiry Management']))
      setOpenGroups((prev) => new Set([...prev, 'MAIN MENU']))
    }
    if (
      activeSection === 'Faculty' ||
      activeSection === 'Add Faculty' ||
      activeSection === 'Faculty Assignments' ||
      activeSection === 'Time Table'
    ) {
      setOpenSubmenus((prev) => new Set([...prev, 'Faculty Management']))
      setOpenGroups((prev) => new Set([...prev, 'ADMISSIONS & PEOPLE']))
    }
    if (
      activeSection === 'Staff' ||
      activeSection === 'Add Staff' ||
      activeSection === 'Staff Departments' ||
      activeSection === 'Staff Designations' ||
      activeSection === 'Staff Categories' ||
      activeSection === 'Staff Shifts' ||
      activeSection === 'Archived Staff'
    ) {
      setOpenSubmenus((prev) => new Set([...prev, 'Staff Management']))
      setOpenGroups((prev) => new Set([...prev, 'ADMISSIONS & PEOPLE']))
    }
    if (activeSection === 'Assignments' || activeSection === 'Create Assignment' || activeSection === 'Assignment Analytics') {
      setOpenSubmenus((prev) => new Set([...prev, 'Assignment Management']))
      setOpenGroups((prev) => new Set([...prev, 'ACADEMICS']))
    }
    if (activeSection === 'Reports' || activeSection === 'Analytics' || activeSection === 'Downloads' || activeSection === 'Backup' || activeSection === 'Audit Logs') {
      setOpenGroups((prev) => new Set([...prev, 'INSIGHTS']))
    }
    if (
      activeSection === 'Fees' ||
      activeSection === 'Accounting' ||
      activeSection === 'Expenses' ||
      activeSection === 'Income' ||
      activeSection === 'Salary Management' ||
      activeSection === 'Payroll' ||
      activeSection === 'Payments'
    ) {
      setOpenGroups((prev) => new Set([...prev, 'FINANCE & HR']))
    }
  }, [activeSection])

  const filteredMenu = useMemo(() => {
    const q = navQuery.trim().toLowerCase()
    if (!q) return sideMenu
    return sideMenu
      .map((menu) => {
        const items = menu.items
          .map((item) => {
            if (typeof item === 'string') return item.toLowerCase().includes(q) ? item : null
            const children = item.children.filter((c) => {
              const display = item.displayLabels?.[c] || c
              return c.toLowerCase().includes(q) || display.toLowerCase().includes(q)
            })
            if (item.label.toLowerCase().includes(q) || children.length) {
              return { ...item, children: children.length ? children : item.children }
            }
            return null
          })
          .filter(Boolean)
        return items.length ? { ...menu, items } : null
      })
      .filter(Boolean)
  }, [navQuery])

  if (!authReady) {
    return <LoadingScreen />
  }

  if (!session) return <Navigate to="/master-admin" replace />

  const goTo = (section) => navigate(masterAdminPath(section))
  const signOut = async () => {
    await logoutMasterAdmin()
    clearMasterAdminSession()
    navigate('/master-admin', { replace: true })
  }

  const toggleGroup = (group) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const toggleSubmenu = (label) => {
    setOpenSubmenus((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const renderSection = () => {
    if (activeSection === 'Dashboard' || activeSection === 'Institute Overview') {
      return <MasterHome onNavigate={goTo} isDark={isDark} />
    }
    if (activeSection === 'CCTV Cameras') return <CctvPage />
    if (activeSection === 'ID Card Generate') return <IdCardPage />
    if (activeSection === 'Print Cards') return <PrintCardsPage />
    if (activeSection === 'Admissions') return <AdmissionsPage />
    if (activeSection === 'New Admission') return <AdmissionFormPage />
    if (activeSection === 'Universities') return <UniversitiesPage />
    if (activeSection === 'Courses') return <CoursesPage />
    if (activeSection === 'Fees') return <FeesPage />
    if (activeSection === 'Accounting') return <AccountingPage />
    if (activeSection === 'Expenses') return <ExpensesPage />
    if (activeSection === 'Income') return <IncomePage />
    if (activeSection === 'Salary Management') return <SalaryManagementPage />
    if (activeSection === 'Payroll') return <PayrollPage />
    if (activeSection === 'Payments') return <PaymentsPage />
    if (activeSection === 'Attendance') return <AttendancePage />
    if (activeSection === 'Assignments') return <AssignmentsPage />
    if (activeSection === 'Create Assignment') return <AssignmentsPage create />
    if (activeSection === 'Assignment Analytics') return <AssignmentsPage />
    if (activeSection === 'Assignment Details') return <AssignmentDetailPage assignmentId={assignmentAction} />
    if (activeSection === 'Batches') return <BatchesPage />
    if (activeSection === 'Students') return <StudentsPage />
    if (activeSection === 'Profile Requests') return <ProfileRequestsPage />
    if (activeSection === 'Faculty Assignments' || facultyId === 'assignments') return <FacultyAssignmentsPage />
    if (activeSection === 'Add Faculty' || facultyId === 'new') return <FacultyFormPage />
    if (activeSection === 'Faculty' && facultyId) return <FacultyProfilePage facultyId={facultyId} />
    if (activeSection === 'Faculty') return <FacultyPage />
    if (activeSection === 'Add Staff' || staffId === 'add') return <AddStaffPage />
    if (activeSection === 'Staff Departments' || staffId === 'departments') return <StaffDepartmentsPage />
    if (activeSection === 'Staff Designations' || staffId === 'designations') return <StaffDesignationsPage />
    if (activeSection === 'Staff Categories' || staffId === 'categories') return <StaffCategoriesPage />
    if (activeSection === 'Staff Shifts' || staffId === 'shifts') return <StaffShiftsPage />
    if (activeSection === 'Archived Staff' || staffId === 'archive') return <ArchivedStaffPage />
    if (activeSection === 'Staff' && staffId) return <StaffProfilePage staffId={staffId} />
    if (activeSection === 'Staff') return <StaffPage />
    if (activeSection === 'Time Table') return <FacultyTimetablePage />
    if (activeSection === 'Reports') return <ReportsPage />
    if (activeSection === 'Analytics') return <AnalyticsPage onNavigate={goTo} />
    if (activeSection === 'Downloads') return <DownloadsPage onNavigate={goTo} />
    if (activeSection === 'Backup') return <BackupPage onNavigate={goTo} />
    if (activeSection === 'Audit Logs') return <AuditLogsPage />
    if (activeSection === 'Online Exams') return <OnlineExamsPage />
    if (activeSection === 'Question Bank') return <QuestionBankPage />
    if (activeSection === 'Exam Papers') return <ExamPapersPage />
    if (activeSection === 'Exam Schedule') return <ExamSchedulePage />
    if (activeSection === 'Exam Results') return <ExamResultsPage />
    if (LANDING_CMS.includes(activeSection) || activeSection === 'Website CMS') {
      return <CmsPage title={activeSection} />
    }
    return <ModulePage config={getModuleConfig(activeSection)} />
  }

  return (
    <section className={`relative min-h-screen w-full ${shell.main}`}>
      <div className={`relative grid min-h-screen w-full grid-cols-1 lg:h-screen ${sidebarCollapsed ? 'lg:grid-cols-[4.5rem_minmax(0,1fr)]' : 'lg:grid-cols-[18rem_minmax(0,1fr)]'}`}>
        {sidebarOpen ? (
          <button type="button" aria-label="Close menu" onClick={() => setSidebarOpen(false)} className={`fixed inset-0 z-40 backdrop-blur-sm lg:hidden ${shell.overlay}`} />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[82%] min-w-0 max-w-[320px] flex-col overflow-hidden overflow-x-hidden border-r transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:min-h-0 lg:max-w-none lg:shrink-0 lg:translate-x-0 ${
            sidebarCollapsed ? 'lg:w-[4.5rem]' : 'lg:w-72'
          } ${shell.sidebar} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          <div className="relative flex shrink-0 items-center gap-2 overflow-x-hidden border-b border-brand-red/20 px-3 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <img src={logo} alt="" className="h-10 w-10 shrink-0 rounded-full bg-white object-contain p-0.5" />
              {!sidebarCollapsed ? (
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[15px] font-bold tracking-[0.06em] uppercase ${shell.brandTitle}`}>TNS ITI</p>
                  <p className={`truncate text-[11px] font-medium tracking-[0.12em] uppercase ${shell.brandSub}`}>Master Admin</p>
                </div>
              ) : null}
            </div>
            <button type="button" className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border lg:hidden ${shell.iconBtn}`} onClick={() => setSidebarOpen(false)}>
              <FiX />
            </button>
            <button
              type="button"
              className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border lg:inline-flex ${shell.iconBtn} ${sidebarCollapsed ? 'absolute top-1.5 right-1.5 h-7 w-7' : ''}`}
              onClick={() => setSidebarCollapsed((v) => !v)}
            >
              {sidebarCollapsed ? <FiChevronRight size={15} /> : <FiChevronLeft size={16} />}
            </button>
          </div>

          <div className={`thin-scroll min-h-0 min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto py-4 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
            {filteredMenu.map((menu) => {
              const isOpen = sidebarCollapsed || navQuery.trim() ? true : openGroups.has(menu.group)
              return (
                <SidebarGroup key={menu.group}>
                  <SidebarGroupLabel
                    collapsed={sidebarCollapsed}
                    dividerClass={shell.divider}
                    labelClass={shell.groupLabel}
                    group={menu.group}
                    isOpen={isOpen}
                    onToggle={() => toggleGroup(menu.group)}
                  />
                  {isOpen
                    ? menu.items.map((item) => {
                        if (typeof item === 'string') {
                          const Icon = itemIcon[item] || FiGrid
                          const active = item === activeSection
                          return (
                            <SidebarMenuButton
                              key={item}
                              collapsed={sidebarCollapsed}
                              title={item}
                              onClick={() => goTo(item)}
                              icon={Icon}
                              label={item}
                              className={active ? shell.navActive : shell.navInactive}
                            />
                          )
                        }

                        const parentActive = item.children.includes(activeSection)
                        const ParentIcon = itemIcon[item.label] || FiGrid
                        const submenuOpen = Boolean(navQuery.trim()) || openSubmenus.has(item.label)
                        return (
                          <div key={item.label} className="min-w-0">
                            <SidebarMenuButton
                              collapsed={sidebarCollapsed}
                              title={item.label}
                              onClick={() => {
                                if (sidebarCollapsed) {
                                  setSidebarCollapsed(false)
                                  toggleSubmenu(item.label)
                                  return
                                }
                                toggleSubmenu(item.label)
                              }}
                              icon={ParentIcon}
                              label={item.label}
                              showChevron
                              chevronOpen={submenuOpen}
                              className={parentActive ? shell.navActive : shell.navInactive}
                            />
                            {submenuOpen && !sidebarCollapsed ? (
                              <div className="mt-1 min-w-0 space-y-1 overflow-x-hidden pl-[2.5rem]">
                                {item.children.map((child) => {
                                  const childActive = child === activeSection
                                  const childLabel = item.displayLabels?.[child] || child
                                  return (
                                    <SidebarChildButton
                                      key={child}
                                      icon={itemIcon[child]}
                                      onClick={() => goTo(child)}
                                      className={childActive ? shell.navChildActive : shell.navChildInactive}
                                    >
                                      {childLabel}
                                    </SidebarChildButton>
                                  )
                                })}
                              </div>
                            ) : null}
                          </div>
                        )
                      })
                    : null}
                </SidebarGroup>
              )
            })}
            <SidebarMenuButton
              collapsed={sidebarCollapsed}
              title="Logout"
              onClick={signOut}
              icon={FiLogOut}
              label="Logout"
              className={shell.navInactive}
            />
          </div>
        </aside>

        <main data-theme={theme} className="min-h-screen w-full min-w-0 px-2 pt-0 pb-2 sm:px-3 sm:pb-3 lg:h-screen lg:overflow-y-auto lg:px-3 lg:pb-3">
          <div className={`sticky top-0 z-30 -mx-2 mb-3 flex items-center gap-2 border-b px-2 py-2 backdrop-blur-xl sm:-mx-3 sm:px-3 lg:-mx-3 lg:px-3 ${shell.mobileBar}`}>
            <button type="button" className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border lg:hidden ${shell.iconBtn}`} onClick={() => setSidebarOpen(true)}>
              <FiMenu />
            </button>
            <div className={`flex min-w-0 flex-1 items-center gap-2 rounded-full border px-3 py-2 ${shell.search}`}>
              <FiSearch className="text-brand-red" />
              <input value={navQuery} onChange={(e) => setNavQuery(e.target.value)} placeholder="Search modules…" className={`w-full bg-transparent text-sm outline-none ${shell.searchInput}`} />
            </div>
            <button type="button" className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border sm:rounded-full ${shell.iconBtn}`} onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
              {isDark ? <FiSun className="text-gold" /> : <FiMoon />}
            </button>
            <div className="relative">
              <button
                type="button"
                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border sm:rounded-full ${shell.iconBtn}`}
                onClick={() => {
                  setNotifOpen((v) => !v)
                  setProfileOpen(false)
                }}
              >
                <FiBell />
                {unreadCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">{unreadCount}</span>
                ) : null}
              </button>
              {notifOpen ? (
                <div className={`absolute right-0 z-50 mt-2 w-80 rounded-lg border p-3 ${shell.dropdown}`}>
                  <p className={`mb-2 text-xs font-semibold uppercase ${shell.dropdownMuted}`}>Notifications</p>
                  <ul className="max-h-72 space-y-2 overflow-y-auto">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          className={`w-full rounded-lg border px-3 py-2 text-left ${shell.dropdownItem}`}
                          onClick={() => {
                            setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, status: 'Read' } : x)))
                            setNotifOpen(false)
                            goTo(n.section || 'Enquiry Management')
                          }}
                        >
                          <p className={`text-xs font-medium ${shell.dropdownText}`}>{n.title}</p>
                          <p className={`text-[10px] ${shell.dropdownMeta}`}>{n.time}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <div className="relative">
              <button
                type="button"
                className={`flex items-center gap-2 rounded-lg border p-1 text-sm sm:rounded-full lg:pr-3 ${shell.iconBtn}`}
                onClick={() => {
                  setProfileOpen((v) => !v)
                  setNotifOpen(false)
                }}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-navy-900 text-[10px] font-bold text-gold">MA</span>
                <span className="hidden max-w-[140px] truncate lg:inline">{displayName}</span>
              </button>
              {profileOpen ? (
                <div className={`absolute right-0 z-50 mt-2 w-56 rounded-lg border p-2 ${shell.dropdown}`}>
                  <p className={`px-2 py-1.5 text-[11px] ${shell.dropdownMuted}`}>{displayEmail}</p>
                  <button type="button" onClick={() => goTo('Profile')} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${shell.menuItem}`}>
                    <FiUser size={14} /> Profile
                  </button>
                  <button type="button" onClick={() => goTo('Settings')} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${shell.menuItem}`}>
                    <FiSettings size={14} /> Settings
                  </button>
                  <button type="button" onClick={signOut} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${shell.menuItem}`}>
                    <FiLogOut size={14} /> Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mb-3">
            <h1 className={`text-xl font-semibold sm:text-2xl ${shell.pageTitle}`}>{pageTitle}</h1>
            <p className={`mt-0.5 text-xs sm:text-sm ${shell.pageDesc}`}>
              TNS ITI & Computer · Narsinghpur master admin module
            </p>
          </div>

          {renderSection()}
        </main>
      </div>
    </section>
  )
}
