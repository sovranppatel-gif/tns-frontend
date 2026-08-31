function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const STUDENT_SECTIONS = [
  'Dashboard',
  'My Profile',
  'Online Admission',
  'Attendance',
  'Courses',
  'Assignments',
  'Homework',
  'Notes',
  'Study Materials',
  'Recorded Lectures',
  'Live Classes',
  'Fee Management',
  'Exam & Results',
  'Upcoming Exams',
  'Live Exams',
  'My Results',
  'Exam History',
  'Certificates',
  'Performance Analytics',
  'Time Table',
  'Announcements',
  'Notifications',
  'Messages',
  'Support',
  'Settings',
]

const SECTION_BY_SLUG = new Map()
const SLUG_BY_SECTION = new Map()

for (const section of STUDENT_SECTIONS) {
  const slug = normalizeSlug(section)
  SLUG_BY_SECTION.set(section, slug)
  SECTION_BY_SLUG.set(slug, section)
}

SECTION_BY_SLUG.set('home', 'Dashboard')
SECTION_BY_SLUG.set('profile', 'My Profile')
SECTION_BY_SLUG.set('admission', 'Online Admission')
SLUG_BY_SECTION.set('Dashboard', 'dashboard')

export function sectionToSlug(section) {
  if (!section || section === 'Dashboard') return 'dashboard'
  return SLUG_BY_SECTION.get(section) || normalizeSlug(section)
}

export function slugToSection(slug) {
  if (!slug) return 'Dashboard'
  return SECTION_BY_SLUG.get(normalizeSlug(slug)) || null
}

export function studentPath(section = 'Dashboard') {
  return `/student/${sectionToSlug(section)}`
}
