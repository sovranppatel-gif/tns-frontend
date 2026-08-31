function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const MASTER_ADMIN_SECTIONS = [
  'Dashboard',
  'Hero CMS',
  'About CMS',
  'Courses CMS',
  'Gallery CMS',
  'Contact CMS',
  'Enquiry Management',
  'Leads',
  'CCTV Cameras',
  'Institute Overview',
  'Admissions',
  'New Admission',
  'Universities',
  'Students',
  'ID Card Generate',
  'Faculty',
  'Add Faculty',
  'Faculty Assignments',
  'Staff',
  'Add Staff',
  'Staff Departments',
  'Staff Designations',
  'Staff Categories',
  'Staff Shifts',
  'Archived Staff',
  'Parents',
  'Departments',
  'Courses',
  'Programs',
  'Batches',
  'Subjects',
  'Classes',
  'Attendance',
  'Time Table',
  'Assignments',
  'Homework',
  'Study Materials',
  'Notes',
  'Question Bank',
  'Exams',
  'Results',
  'Certificates',
  'Online Exams',
  'Exam Papers',
  'Exam Schedule',
  'Exam Results',
  'Fees',
  'Accounting',
  'Expenses',
  'Income',
  'Salary Management',
  'Payroll',
  'Payments',
  'Library',
  'Hostel',
  'Transport',
  'Inventory',
  'Assets',
  'Placement Cell',
  'Training Management',
  'Internships',
  'Events',
  'Calendar',
  'Announcements',
  'Messages',
  'Notifications',
  'Help Desk',
  'Support Tickets',
  'Reports',
  'Analytics',
  'Downloads',
  'Backup',
  'Audit Logs',
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
]

const SECTION_BY_SLUG = new Map()
const SLUG_BY_SECTION = new Map()

for (const section of MASTER_ADMIN_SECTIONS) {
  const slug = normalizeSlug(section)
  SLUG_BY_SECTION.set(section, slug)
  SECTION_BY_SLUG.set(slug, section)
}

SECTION_BY_SLUG.set('dashboard', 'Dashboard')
SECTION_BY_SLUG.set('home', 'Dashboard')
SLUG_BY_SECTION.set('Dashboard', 'dashboard')
SECTION_BY_SLUG.set('timetable', 'Time Table')
SLUG_BY_SECTION.set('Time Table', 'timetable')

export function sectionToSlug(section) {
  if (!section || section === 'Dashboard') return 'dashboard'
  return SLUG_BY_SECTION.get(section) || normalizeSlug(section)
}

export function slugToSection(slug) {
  if (!slug) return 'Dashboard'
  return SECTION_BY_SLUG.get(normalizeSlug(slug)) || null
}

export const STAFF_STATIC_SEGMENTS = {
  add: 'Add Staff',
  departments: 'Staff Departments',
  designations: 'Staff Designations',
  categories: 'Staff Categories',
  shifts: 'Staff Shifts',
  archive: 'Archived Staff',
}

export function staffSegmentToSection(staffId) {
  if (!staffId) return null
  return STAFF_STATIC_SEGMENTS[staffId] || null
}

export function isStaffProfileId(staffId) {
  return Boolean(staffId) && !STAFF_STATIC_SEGMENTS[staffId]
}

export function masterAdminPath(section = 'Dashboard') {
  if (section === 'Faculty Assignments') return '/master-admin/faculty/assignments'
  if (section === 'Add Faculty') return '/master-admin/faculty/new'
  if (section === 'Staff') return '/master-admin/staff'
  if (section === 'Add Staff') return '/master-admin/staff/add'
  if (section === 'Staff Departments') return '/master-admin/staff/departments'
  if (section === 'Staff Designations') return '/master-admin/staff/designations'
  if (section === 'Staff Categories') return '/master-admin/staff/categories'
  if (section === 'Staff Shifts') return '/master-admin/staff/shifts'
  if (section === 'Archived Staff') return '/master-admin/staff/archive'
  return `/master-admin/${sectionToSlug(section)}`
}

export function masterAdminDashboardPath(section = 'Dashboard') {
  return masterAdminPath(section)
}
