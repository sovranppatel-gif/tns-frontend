/** Realistic dummy data for the Student Dashboard */

export const studentProfile = {
  id: 'GST-STU-2024-0847',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@growskillstech.edu',
  phone: '+91 98765 43210',
  dob: '2003-08-14',
  gender: 'Male',
  bloodGroup: 'B+',
  batch: 'Full Stack 2025-A',
  course: 'Full Stack Web Development',
  semester: 'Semester 3',
  trainer: 'Priya Mehta',
  trainerEmail: 'priya.mehta@growskillstech.edu',
  enrollmentDate: '2024-09-01',
  rollNo: 'FS-847',
  avatar:
    'https://ui-avatars.com/api/?name=Aarav+Sharma&background=FF5E14&color=fff&size=128',
  address: {
    line1: '42, Green Park Extension',
    line2: 'Near Metro Station',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110016',
  },
  parent: {
    name: 'Rajesh Sharma',
    relation: 'Father',
    phone: '+91 98100 11223',
    email: 'rajesh.sharma@email.com',
  },
  emergency: {
    name: 'Sunita Sharma',
    relation: 'Mother',
    phone: '+91 98100 44556',
  },
  education: [
    { level: 'Class 12', institute: 'DPS RK Puram', year: '2021', percentage: '91.2%' },
    { level: 'Graduation', institute: 'Delhi University', year: '2024', percentage: '78.5%' },
  ],
  skills: ['React', 'Node.js', 'MongoDB', 'Tailwind CSS', 'TypeScript', 'Git'],
  achievements: [
    'Top Performer — Semester 2',
    'Hackathon Winner — GST CodeFest 2025',
    'Perfect Attendance — Jan 2026',
  ],
}

export const dashboardStats = {
  overallCompletion: 72,
  attendancePercent: 91,
  currentGpa: 8.6,
  presentDays: 86,
  absentDays: 8,
  assignmentsPending: 3,
  assignmentsCompleted: 24,
  totalCourses: 6,
  completedCourses: 2,
  certificatesEarned: 3,
  feePending: 18500,
  feePaid: 46500,
  todaysClasses: 2,
  unreadNotifications: 5,
  learningStreak: 12,
  studyHoursWeek: 18.5,
  weeklyGoal: 20,
  monthlyGoal: 80,
  leaderboardPosition: 7,
}

export const quickActions = [
  { id: 'notes', label: 'Download Notes', section: 'Notes' },
  { id: 'live', label: 'Join Live Class', section: 'Live Classes' },
  { id: 'attendance', label: 'View Attendance', section: 'Attendance' },
  { id: 'fees', label: 'Pay Fees', section: 'Fee Management' },
  { id: 'assignment', label: 'Submit Assignment', section: 'Assignments' },
  { id: 'result', label: 'View Result', section: 'Exam & Results' },
]

export const upcomingHighlights = {
  nextClass: {
    subject: 'React Advanced Patterns',
    time: 'Today, 4:00 PM',
    trainer: 'Priya Mehta',
    room: 'Lab-3 / Zoom',
  },
  nextAssignment: {
    title: 'Build a REST API with Express',
    due: 'Jul 16, 2026',
    subject: 'Backend Development',
  },
  feeDue: {
    amount: 18500,
    dueDate: 'Jul 25, 2026',
    installment: 'Installment 3 of 4',
  },
}

export const attendanceTrend = [
  { month: 'Jan', percent: 94, present: 20, absent: 1, late: 1 },
  { month: 'Feb', percent: 88, present: 17, absent: 2, late: 1 },
  { month: 'Mar', percent: 92, present: 19, absent: 1, late: 2 },
  { month: 'Apr', percent: 90, present: 18, absent: 2, late: 0 },
  { month: 'May', percent: 95, present: 21, absent: 1, late: 0 },
  { month: 'Jun', percent: 91, present: 19, absent: 1, late: 1 },
  { month: 'Jul', percent: 89, present: 12, absent: 1, late: 1 },
]

export const subjectAttendance = [
  { subject: 'React & Frontend', percent: 94, present: 32, absent: 2, late: 1 },
  { subject: 'Node.js Backend', percent: 88, present: 28, absent: 3, late: 2 },
  { subject: 'Database Design', percent: 91, present: 30, absent: 2, late: 1 },
  { subject: 'UI/UX Fundamentals', percent: 96, present: 24, absent: 1, late: 0 },
  { subject: 'DevOps Basics', percent: 85, present: 17, absent: 3, late: 1 },
]

/** Calendar dots for July 2026 — status: present | absent | leave | late | holiday */
export const attendanceCalendar = {
  month: 'July 2026',
  year: 2026,
  monthIndex: 6,
  days: {
    1: 'present',
    2: 'present',
    3: 'late',
    4: 'present',
    7: 'present',
    8: 'absent',
    9: 'present',
    10: 'present',
    11: 'present',
    14: 'present',
    15: 'leave',
    16: 'present',
    17: 'present',
    18: 'present',
    21: 'present',
    22: 'present',
    23: 'late',
    24: 'present',
    25: 'present',
    28: 'present',
    29: 'present',
    30: 'holiday',
  },
}

export const feeSummary = {
  totalFees: 65000,
  paidFees: 46500,
  remainingFees: 18500,
  nextDueDate: 'Jul 25, 2026',
  status: 'Partial',
}

export const feeInstallments = [
  { id: 'INS-1', label: 'Admission Fee', amount: 15000, dueDate: 'Sep 01, 2024', paidDate: 'Sep 01, 2024', status: 'Paid' },
  { id: 'INS-2', label: 'Installment 1', amount: 15500, dueDate: 'Dec 15, 2024', paidDate: 'Dec 12, 2024', status: 'Paid' },
  { id: 'INS-3', label: 'Installment 2', amount: 16000, dueDate: 'Mar 15, 2025', paidDate: 'Mar 14, 2025', status: 'Paid' },
  { id: 'INS-4', label: 'Installment 3', amount: 18500, dueDate: 'Jul 25, 2026', paidDate: null, status: 'Due' },
]

export const paymentHistory = [
  { id: 'PAY-4412', invoice: 'INV-STU-0847-01', method: 'UPI', amount: 15000, date: 'Sep 01, 2024', status: 'Success' },
  { id: 'PAY-4588', invoice: 'INV-STU-0847-02', method: 'NEFT', amount: 15500, date: 'Dec 12, 2024', status: 'Success' },
  { id: 'PAY-4721', invoice: 'INV-STU-0847-03', method: 'Card', amount: 16000, date: 'Mar 14, 2025', status: 'Success' },
]

export const feePaymentAnalytics = [
  { name: 'Paid', value: 46500 },
  { name: 'Pending', value: 18500 },
]

export const assignments = [
  {
    id: 'ASN-101',
    title: 'Responsive Landing Page',
    subject: 'Frontend',
    faculty: 'Priya Mehta',
    dueDate: 'Jun 20, 2026',
    submittedDate: 'Jun 18, 2026',
    status: 'Completed',
    marks: '18/20',
    progress: 100,
  },
  {
    id: 'ASN-108',
    title: 'MongoDB Schema Design',
    subject: 'Database',
    faculty: 'Rahul Verma',
    dueDate: 'Jul 02, 2026',
    submittedDate: 'Jul 01, 2026',
    status: 'Completed',
    marks: '16/20',
    progress: 100,
  },
  {
    id: 'ASN-112',
    title: 'Build a REST API with Express',
    subject: 'Backend',
    faculty: 'Priya Mehta',
    dueDate: 'Jul 16, 2026',
    submittedDate: null,
    status: 'Pending',
    marks: '—',
    progress: 45,
  },
  {
    id: 'ASN-115',
    title: 'Authentication with JWT',
    subject: 'Backend',
    faculty: 'Rahul Verma',
    dueDate: 'Jul 22, 2026',
    submittedDate: null,
    status: 'Pending',
    marks: '—',
    progress: 10,
  },
  {
    id: 'ASN-098',
    title: 'CSS Grid Portfolio',
    subject: 'Frontend',
    faculty: 'Priya Mehta',
    dueDate: 'May 10, 2026',
    submittedDate: 'May 14, 2026',
    status: 'Late',
    marks: '12/20',
    progress: 100,
  },
  {
    id: 'ASN-118',
    title: 'Unit Testing with Jest',
    subject: 'QA',
    faculty: 'Ananya Kapoor',
    dueDate: 'Jul 28, 2026',
    submittedDate: null,
    status: 'Pending',
    marks: '—',
    progress: 0,
  },
]

export const homeworkList = [
  {
    id: 'HW-41',
    title: 'Practice React Hooks exercises',
    subject: 'React',
    description: 'Complete useState, useEffect and custom hooks practice set from Module 4.',
    dueDate: 'Jul 15, 2026',
    priority: 'High',
    completed: false,
  },
  {
    id: 'HW-42',
    title: 'Write SQL join queries',
    subject: 'Database',
    description: 'Solve 10 join problems covering INNER, LEFT and CROSS joins.',
    dueDate: 'Jul 17, 2026',
    priority: 'Medium',
    completed: false,
  },
  {
    id: 'HW-38',
    title: 'Read MDN async/await guide',
    subject: 'JavaScript',
    description: 'Summarize key points in your notes notebook.',
    dueDate: 'Jul 10, 2026',
    priority: 'Low',
    completed: true,
  },
  {
    id: 'HW-43',
    title: 'Deploy Node app on Render',
    subject: 'DevOps',
    description: 'Deploy the sample Express API and share the live URL.',
    dueDate: 'Jul 20, 2026',
    priority: 'High',
    completed: false,
  },
]

export const studyMaterials = [
  {
    id: 'MAT-01',
    title: 'React Hooks Cheat Sheet',
    type: 'PDF',
    subject: 'React',
    size: '2.4 MB',
    added: 'Jul 08, 2026',
    category: 'Notes',
  },
  {
    id: 'MAT-02',
    title: 'Express Middleware Deep Dive',
    type: 'Video',
    subject: 'Backend',
    size: '48 min',
    added: 'Jul 05, 2026',
    category: 'Video',
  },
  {
    id: 'MAT-03',
    title: 'MongoDB Indexing Slides',
    type: 'PPT',
    subject: 'Database',
    size: '8.1 MB',
    added: 'Jun 28, 2026',
    category: 'Slides',
  },
  {
    id: 'MAT-04',
    title: 'Starter Project Templates',
    type: 'ZIP',
    subject: 'Full Stack',
    size: '12 MB',
    added: 'Jun 20, 2026',
    category: 'Resources',
  },
  {
    id: 'MAT-05',
    title: 'MDN Web Docs — Fetch API',
    type: 'Link',
    subject: 'JavaScript',
    size: 'External',
    added: 'Jun 15, 2026',
    category: 'Link',
  },
  {
    id: 'MAT-06',
    title: 'UI Component Library Guide',
    type: 'PDF',
    subject: 'Frontend',
    size: '5.6 MB',
    added: 'Jul 12, 2026',
    category: 'Notes',
  },
]

export const notesList = [
  {
    id: 'NOTE-01',
    title: 'React Context vs Redux',
    subject: 'React',
    updated: 'Jul 12, 2026',
    pinned: true,
    bookmarked: true,
  },
  {
    id: 'NOTE-02',
    title: 'REST API Best Practices',
    subject: 'Backend',
    updated: 'Jul 10, 2026',
    pinned: true,
    bookmarked: false,
  },
  {
    id: 'NOTE-03',
    title: 'Normalization in Databases',
    subject: 'Database',
    updated: 'Jul 06, 2026',
    pinned: false,
    bookmarked: true,
  },
  {
    id: 'NOTE-04',
    title: 'CSS Flexbox Patterns',
    subject: 'Frontend',
    updated: 'Jun 30, 2026',
    pinned: false,
    bookmarked: false,
  },
  {
    id: 'NOTE-05',
    title: 'Git Branching Strategies',
    subject: 'DevOps',
    updated: 'Jun 22, 2026',
    pinned: false,
    bookmarked: true,
  },
]

export const courses = [
  {
    id: 'CRS-01',
    title: 'Full Stack Web Development',
    faculty: 'Priya Mehta',
    duration: '12 months',
    progress: 72,
    status: 'Current',
    rating: 4.8,
    modules: 18,
    completedModules: 13,
  },
  {
    id: 'CRS-02',
    title: 'UI/UX Design Fundamentals',
    faculty: 'Ananya Kapoor',
    duration: '3 months',
    progress: 100,
    status: 'Completed',
    rating: 4.9,
    modules: 8,
    completedModules: 8,
  },
  {
    id: 'CRS-03',
    title: 'Cloud & DevOps Essentials',
    faculty: 'Rahul Verma',
    duration: '4 months',
    progress: 35,
    status: 'Current',
    rating: 4.6,
    modules: 10,
    completedModules: 3,
  },
  {
    id: 'CRS-04',
    title: 'Soft Skills & Interview Prep',
    faculty: 'Neha Singh',
    duration: '2 months',
    progress: 100,
    status: 'Completed',
    rating: 4.7,
    modules: 6,
    completedModules: 6,
  },
]

export const liveClasses = [
  {
    id: 'LIVE-01',
    title: 'React Advanced Patterns',
    trainer: 'Priya Mehta',
    time: 'Today, 4:00 PM – 5:30 PM',
    status: 'Live Soon',
    when: 'today',
  },
  {
    id: 'LIVE-02',
    title: 'Database Indexing Workshop',
    trainer: 'Rahul Verma',
    time: 'Today, 6:00 PM – 7:00 PM',
    status: 'Upcoming',
    when: 'today',
  },
  {
    id: 'LIVE-03',
    title: 'System Design Intro',
    trainer: 'Priya Mehta',
    time: 'Jul 16, 11:00 AM – 12:30 PM',
    status: 'Scheduled',
    when: 'upcoming',
  },
  {
    id: 'LIVE-04',
    title: 'Git & Collaboration',
    trainer: 'Ananya Kapoor',
    time: 'Jul 10, 4:00 PM',
    status: 'Completed',
    when: 'previous',
  },
]

export const recordedLectures = [
  {
    id: 'REC-01',
    title: 'Introduction to React Router',
    subject: 'React',
    duration: '42:18',
    progress: 80,
    thumbnail: 'react',
  },
  {
    id: 'REC-02',
    title: 'Express Routing & Middleware',
    subject: 'Backend',
    duration: '55:02',
    progress: 45,
    thumbnail: 'node',
  },
  {
    id: 'REC-03',
    title: 'MongoDB Aggregation Pipeline',
    subject: 'Database',
    duration: '38:40',
    progress: 100,
    thumbnail: 'db',
  },
  {
    id: 'REC-04',
    title: 'Deploying with Docker Basics',
    subject: 'DevOps',
    duration: '49:15',
    progress: 12,
    thumbnail: 'devops',
  },
  {
    id: 'REC-05',
    title: 'Responsive Design Masterclass',
    subject: 'Frontend',
    duration: '61:00',
    progress: 0,
    thumbnail: 'ui',
  },
]

export const exams = [
  {
    id: 'EX-01',
    title: 'Mid-Term: Frontend',
    subject: 'React & CSS',
    date: 'Jul 30, 2026',
    status: 'Upcoming',
    marks: null,
    percentage: null,
    rank: null,
  },
  {
    id: 'EX-02',
    title: 'Quiz: JavaScript ES6+',
    subject: 'JavaScript',
    date: 'Jul 20, 2026',
    status: 'Upcoming',
    marks: null,
    percentage: null,
    rank: null,
  },
  {
    id: 'EX-03',
    title: 'Semester 2 Final',
    subject: 'Full Stack',
    date: 'Mar 15, 2026',
    status: 'Completed',
    marks: '86/100',
    percentage: 86,
    rank: 5,
  },
  {
    id: 'EX-04',
    title: 'Database Module Test',
    subject: 'Database',
    date: 'Feb 10, 2026',
    status: 'Completed',
    marks: '78/100',
    percentage: 78,
    rank: 9,
  },
]

export const subjectMarks = [
  { subject: 'React', marks: 88 },
  { subject: 'Node.js', marks: 82 },
  { subject: 'MongoDB', marks: 78 },
  { subject: 'UI/UX', marks: 91 },
  { subject: 'DevOps', marks: 74 },
  { subject: 'Soft Skills', marks: 90 },
]

export const certificates = [
  {
    id: 'CERT-01',
    title: 'UI/UX Design Fundamentals',
    issueDate: 'Apr 12, 2026',
    issuer: 'Grow Skills Tech',
    credentialId: 'GST-UX-2026-221',
  },
  {
    id: 'CERT-02',
    title: 'Soft Skills & Interview Prep',
    issueDate: 'May 28, 2026',
    issuer: 'Grow Skills Tech',
    credentialId: 'GST-SS-2026-118',
  },
  {
    id: 'CERT-03',
    title: 'Hackathon Participation — CodeFest 2025',
    issueDate: 'Nov 20, 2025',
    issuer: 'Grow Skills Tech',
    credentialId: 'GST-HF-2025-047',
  },
]

export const performanceData = {
  weeklyProgress: [
    { day: 'Mon', hours: 2.5, score: 72 },
    { day: 'Tue', hours: 3.0, score: 78 },
    { day: 'Wed', hours: 1.5, score: 70 },
    { day: 'Thu', hours: 4.0, score: 85 },
    { day: 'Fri', hours: 3.5, score: 88 },
    { day: 'Sat', hours: 2.0, score: 80 },
    { day: 'Sun', hours: 2.0, score: 76 },
  ],
  monthlyProgress: [
    { month: 'Jan', completion: 55, attendance: 94 },
    { month: 'Feb', completion: 58, attendance: 88 },
    { month: 'Mar', completion: 62, attendance: 92 },
    { month: 'Apr', completion: 65, attendance: 90 },
    { month: 'May', completion: 68, attendance: 95 },
    { month: 'Jun', completion: 70, attendance: 91 },
    { month: 'Jul', completion: 72, attendance: 89 },
  ],
  quizPerformance: [
    { name: 'Quiz 1', score: 80 },
    { name: 'Quiz 2', score: 72 },
    { name: 'Quiz 3', score: 88 },
    { name: 'Quiz 4', score: 85 },
    { name: 'Quiz 5', score: 90 },
  ],
  assignmentPerformance: [
    { name: 'Completed', value: 24 },
    { name: 'Pending', value: 3 },
    { name: 'Late', value: 1 },
  ],
  overallScore: 84,
}

export const timetable = [
  { day: 'Monday', slots: [
    { time: '10:00 – 11:30', subject: 'React Advanced', faculty: 'Priya Mehta', room: 'Lab-3', status: 'Upcoming' },
    { time: '12:00 – 13:00', subject: 'Soft Skills', faculty: 'Neha Singh', room: 'Hall-A', status: 'Upcoming' },
  ]},
  { day: 'Tuesday', slots: [
    { time: '10:00 – 11:30', subject: 'Node.js Backend', faculty: 'Rahul Verma', room: 'Lab-2', status: 'Upcoming' },
    { time: '14:00 – 15:30', subject: 'Database Design', faculty: 'Rahul Verma', room: 'Lab-1', status: 'Upcoming' },
  ]},
  { day: 'Wednesday', slots: [
    { time: '11:00 – 12:30', subject: 'UI/UX Workshop', faculty: 'Ananya Kapoor', room: 'Studio', status: 'Upcoming' },
  ]},
  { day: 'Thursday', slots: [
    { time: '10:00 – 11:30', subject: 'DevOps Basics', faculty: 'Rahul Verma', room: 'Lab-4', status: 'Upcoming' },
    { time: '16:00 – 17:30', subject: 'Project Mentoring', faculty: 'Priya Mehta', room: 'Zoom', status: 'Upcoming' },
  ]},
  { day: 'Friday', slots: [
    { time: '10:00 – 12:00', subject: 'Full Stack Lab', faculty: 'Priya Mehta', room: 'Lab-3', status: 'Upcoming' },
  ]},
  { day: 'Saturday', slots: [
    { time: '11:00 – 13:00', subject: 'Doubt Clearing', faculty: 'Priya Mehta', room: 'Hall-B', status: 'Upcoming' },
  ]},
]

export const todaysSchedule = [
  { time: '4:00 PM', subject: 'React Advanced Patterns', faculty: 'Priya Mehta', room: 'Lab-3 / Zoom', status: 'Next' },
  { time: '6:00 PM', subject: 'Database Indexing Workshop', faculty: 'Rahul Verma', room: 'Lab-1', status: 'Later' },
]

export const announcements = [
  {
    id: 'ANN-01',
    title: 'Mid-Term Exam Schedule Released',
    type: 'College',
    date: 'Jul 12, 2026',
    pinned: true,
    body: 'Mid-term examinations begin from July 30. Check Exam & Results for subject-wise slots.',
  },
  {
    id: 'ANN-02',
    title: 'Live Workshop: System Design',
    type: 'Trainer',
    date: 'Jul 11, 2026',
    pinned: true,
    body: 'Mandatory attendance for Batch Full Stack 2025-A on July 16, 11:00 AM.',
  },
  {
    id: 'ANN-03',
    title: 'Fee Payment Reminder',
    type: 'Important',
    date: 'Jul 08, 2026',
    pinned: false,
    body: 'Installment 3 is due on July 25. Pay early to avoid late charges.',
  },
  {
    id: 'ANN-04',
    title: 'Library Access Extended Hours',
    type: 'College',
    date: 'Jul 05, 2026',
    pinned: false,
    body: 'Digital library will remain open till 10 PM during exam preparation week.',
  },
]

export const notifications = [
  { id: 'N-01', title: 'Assignment ASN-112 due in 2 days', time: '2 hours ago', read: false, type: 'assignment' },
  { id: 'N-02', title: 'Live class starts at 4:00 PM today', time: '4 hours ago', read: false, type: 'class' },
  { id: 'N-03', title: 'Fee reminder: ₹18,500 due Jul 25', time: 'Yesterday', read: false, type: 'fee' },
  { id: 'N-04', title: 'New notes uploaded: React Context', time: 'Yesterday', read: false, type: 'notes' },
  { id: 'N-05', title: 'Certificate ready for download', time: '2 days ago', read: false, type: 'certificate' },
  { id: 'N-06', title: 'Attendance marked for Jul 13', time: '3 days ago', read: true, type: 'attendance' },
  { id: 'N-07', title: 'Homework HW-38 marked complete', time: '5 days ago', read: true, type: 'homework' },
]

export const messages = [
  {
    id: 'MSG-01',
    from: 'Priya Mehta',
    role: 'Trainer',
    preview: 'Great progress on your REST API assignment. Let’s review tomorrow.',
    time: '10:24 AM',
    unread: true,
  },
  {
    id: 'MSG-02',
    from: 'Rahul Verma',
    role: 'Trainer',
    preview: 'Please revise indexing notes before today’s workshop.',
    time: 'Yesterday',
    unread: true,
  },
  {
    id: 'MSG-03',
    from: 'Admin Office',
    role: 'Institute',
    preview: 'Your fee receipt for Installment 2 is available.',
    time: 'Jul 08',
    unread: false,
  },
  {
    id: 'MSG-04',
    from: 'Ananya Kapoor',
    role: 'Trainer',
    preview: 'UI project feedback shared in Study Materials.',
    time: 'Jul 05',
    unread: false,
  },
]

export const chatThread = [
  { id: 1, from: 'trainer', text: 'Hi Aarav, how is the Express assignment going?', time: '10:10 AM' },
  { id: 2, from: 'student', text: 'Hi ma’am, I’ve completed the routes and middleware. Working on validation now.', time: '10:14 AM' },
  { id: 3, from: 'trainer', text: 'Perfect. Share a screen recording if you get stuck on error handling.', time: '10:18 AM' },
  { id: 4, from: 'student', text: 'Will do. Thank you!', time: '10:20 AM' },
  { id: 5, from: 'trainer', text: 'Great progress on your REST API assignment. Let’s review tomorrow.', time: '10:24 AM' },
]

export const activities = [
  { id: 'ACT-01', type: 'assignment', title: 'Assignment Submitted', detail: 'MongoDB Schema Design', time: 'Jul 01, 2026 · 6:42 PM' },
  { id: 'ACT-02', type: 'fee', title: 'Fee Paid', detail: 'Installment 2 — ₹16,000', time: 'Mar 14, 2025 · 11:05 AM' },
  { id: 'ACT-03', type: 'exam', title: 'Exam Result Published', detail: 'Semester 2 Final — 86%', time: 'Mar 20, 2026 · 9:00 AM' },
  { id: 'ACT-04', type: 'certificate', title: 'Certificate Earned', detail: 'UI/UX Design Fundamentals', time: 'Apr 12, 2026 · 3:15 PM' },
  { id: 'ACT-05', type: 'attendance', title: 'Attendance Updated', detail: 'Present — React Advanced', time: 'Jul 13, 2026 · 5:30 PM' },
  { id: 'ACT-06', type: 'homework', title: 'Homework Completed', detail: 'Read MDN async/await guide', time: 'Jul 10, 2026 · 8:20 PM' },
]

export const badges = [
  { id: 'B-01', label: '12-Day Streak', icon: 'flame' },
  { id: 'B-02', label: 'Top 10 Leaderboard', icon: 'trophy' },
  { id: 'B-03', label: 'Assignment Ace', icon: 'star' },
  { id: 'B-04', label: 'Perfect Week', icon: 'medal' },
]

export const upcomingEvents = [
  { id: 'EV-01', title: 'System Design Workshop', date: 'Jul 16, 2026', time: '11:00 AM' },
  { id: 'EV-02', title: 'Mid-Term Exams Begin', date: 'Jul 30, 2026', time: 'All Day' },
  { id: 'EV-03', title: 'Industry Guest Lecture', date: 'Aug 05, 2026', time: '4:00 PM' },
]

export const holidays = [
  { id: 'H-01', title: 'Independence Day', date: 'Aug 15, 2026' },
  { id: 'H-02', title: 'Institute Foundation Day', date: 'Sep 01, 2026' },
]

export const motivationalQuote = {
  text: 'Consistency beats intensity. Show up every day and the results will follow.',
  author: 'Grow Skills Tech',
}

export const faqs = [
  {
    q: 'How do I pay my pending fees?',
    a: 'Go to Fee Management → Pay Now. You can pay via UPI, card or net banking. Receipts appear instantly after success.',
  },
  {
    q: 'Where can I download my certificates?',
    a: 'Open Certificates from the sidebar and click Download on any issued certificate.',
  },
  {
    q: 'How is attendance calculated?',
    a: 'Attendance % = (Present + Late) / Total sessions × 100. Leaves are excluded from the denominator when approved.',
  },
  {
    q: 'Can I change my registered email?',
    a: 'Update personal details from Profile → Edit Profile, or raise a Support ticket for verification changes.',
  },
]

export const supportTickets = [
  { id: 'TKT-8821', subject: 'Unable to download receipt', status: 'Resolved', date: 'Jun 18, 2026' },
  { id: 'TKT-8910', subject: 'Live class link not opening', status: 'Open', date: 'Jul 12, 2026' },
]
