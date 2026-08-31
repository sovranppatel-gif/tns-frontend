import { studentMediaUrl, studentRequest } from './studentClient.js'
import { getStudentToken } from '../utils/studentAuth.js'

const emptyStats = {
  overallCompletion: 0,
  attendancePercent: 0,
  currentGpa: '',
  lastExamPercent: 0,
  presentDays: 0,
  absentDays: 0,
  lateDays: 0,
  assignmentsPending: 0,
  assignmentsCompleted: 0,
  totalCourses: 0,
  completedCourses: 0,
  certificatesEarned: 0,
  feePending: 0,
  feePaid: 0,
  todaysClasses: 0,
  liveExams: 0,
  upcomingExams: 0,
  unreadNotifications: 0,
}

export function emptyDashboard(session) {
  const name = session?.name || 'Student'
  return {
    profile: {
      name,
      email: session?.email || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF5E14&color=fff&size=128`,
      enrollmentId: session?.enrollmentId || '',
      batch: session?.batch || '',
      course: session?.course || '',
      semester: '',
      trainer: '',
      rollNo: session?.enrollmentId || '',
    },
    stats: { ...emptyStats },
    highlights: {
      nextClass: null,
      nextAssignment: null,
      nextExam: null,
      feeDue: null,
    },
    activities: [],
    upcomingEvents: [],
    capabilities: {},
  }
}

export async function getStudentDashboard() {
  if (!getStudentToken()) {
    throw new Error('Please log in again to view your dashboard')
  }
  const data = await studentRequest('/api/students/dashboard', { timeoutMs: 8000 })
  const profile = data.profile || {}
  return {
    profile: {
      ...profile,
      avatar: studentMediaUrl(profile.avatar) || profile.avatar,
    },
    stats: { ...emptyStats, ...(data.stats || {}) },
    highlights: data.highlights || emptyDashboard().highlights,
    activities: Array.isArray(data.activities) ? data.activities : [],
    upcomingEvents: Array.isArray(data.upcomingEvents) ? data.upcomingEvents : [],
    capabilities: data.capabilities || {},
  }
}
