export const institute = {
  name: 'Thakur Niranjan Singh I.T.I. & Computer',
  short: 'TNS ITI & Computer',
  branch: 'Narsinghpur',
  academicYear: '2026–27',
  session: 'Admission Open 2026–27',
  address: 'Ram Colony, Belapurkar Ward, Narsinghpur, M.P. 487001',
  phone: '9479962103 / 7566903103',
  email: 'masteradmin@tns.com',
}

export const dashboardStats = [
  { label: 'Active Students', value: '86', hint: 'COPA + computer batches' },
  { label: 'New Enquiries', value: '18', hint: 'This month' },
  { label: 'Pending Admissions', value: '9', hint: 'Documents pending' },
  { label: 'Faculty / Trainers', value: '6', hint: 'ITI + computer' },
  { label: 'Courses', value: '7', hint: 'COPA, DCA, PGDCA, Tally…' },
  { label: 'Batches', value: '4', hint: 'Running' },
  { label: "Today's Attendance", value: '91%', hint: 'Lab + theory' },
  { label: 'Fee Pending', value: '₹1.2L', hint: 'Due this month' },
  { label: 'Fee Collected', value: '₹3.4L', hint: 'This session' },
  { label: 'Open Tickets', value: '5', hint: 'Help desk' },
  { label: 'Certificates', value: '12', hint: 'In process' },
  { label: 'Unread Alerts', value: '7', hint: 'Admin inbox' },
]

export const activities = [
  { id: 1, text: 'COPA enquiry from Ram Colony — WhatsApp follow-up', time: '15 min ago' },
  { id: 2, text: 'DCA admission form submitted — documents pending', time: '1 hr ago' },
  { id: 3, text: 'Lab attendance marked for COPA 2026–27', time: '2 hr ago' },
  { id: 4, text: 'Fee reminder sent for 2nd installment', time: 'Yesterday' },
]

export const notifications = [
  { id: 1, title: 'New website enquiry', body: 'PGDCA interest — call 94799…', time: '10 min ago', status: 'Unread', section: 'Enquiry Management' },
  { id: 2, title: 'Admission pending', body: '3 students awaiting document check', time: '1 hr ago', status: 'Unread', section: 'Admissions' },
  { id: 3, title: 'Fee due', body: '2nd installment reminder window', time: 'Yesterday', status: 'Read', section: 'Fees' },
]

const statusCycle = ['Active', 'Pending', 'Completed']

function rows(prefix, count, extra = () => ({})) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${String(i + 1).padStart(3, '0')}`,
    name: `${prefix} ${i + 1}`,
    status: statusCycle[i % 3],
    date: `2026-08-${String((i % 27) + 1).padStart(2, '0')}`,
    ...extra(i),
  }))
}

export function getModuleConfig(section) {
  const table = {
    Students: {
      stats: [
        { label: 'Total', value: '86' },
        { label: 'COPA', value: '42' },
        { label: 'Computer diplomas', value: '44' },
      ],
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'course', label: 'Course' },
        { key: 'batch', label: 'Batch' },
        { key: 'status', label: 'Status' },
      ],
      rows: rows('STU', 12, (i) => ({
        name: ['Rahul Patel', 'Anjali Verma', 'Demo Student', 'Suresh Yadav', 'Pooja Singh', 'Amit Tiwari'][i % 6],
        course: ['COPA', 'DCA', 'PGDCA', 'Tally'][i % 4],
        batch: '2026–27',
      })),
    },
    Admissions: {
      stats: [
        { label: 'This month', value: '18' },
        { label: 'Pending', value: '9' },
        { label: 'Confirmed', value: '9' },
      ],
      columns: [
        { key: 'id', label: 'Form' },
        { key: 'name', label: 'Applicant' },
        { key: 'course', label: 'Course' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'status', label: 'Status' },
      ],
      rows: rows('ADM', 10, (i) => ({
        name: ['Kiran Sahu', 'Mohit Jain', 'Neha Sharma', 'Ravi Kumar'][i % 4],
        course: ['COPA', 'DCA', 'PGDCA'][i % 3],
        mobile: '9479962103',
        status: i % 2 ? 'Pending' : 'Confirmed',
      })),
    },
    'Enquiry Management': {
      stats: [
        { label: 'Open', value: '11' },
        { label: 'Closed', value: '7' },
      ],
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'course', label: 'Interest' },
        { key: 'source', label: 'Source' },
        { key: 'status', label: 'Status' },
      ],
      rows: rows('ENQ', 8, (i) => ({
        course: ['COPA', 'DCA', 'Tally', 'CPCT'][i % 4],
        source: ['Website', 'WhatsApp', 'Walk-in'][i % 3],
        status: i % 3 ? 'Open' : 'Closed',
      })),
    },
    Leads: {
      stats: [{ label: 'Pipeline', value: '14' }],
      columns: [
        { key: 'id', label: 'Lead' },
        { key: 'name', label: 'Name' },
        { key: 'course', label: 'Course' },
        { key: 'status', label: 'Stage' },
      ],
      rows: rows('LEAD', 8, (i) => ({
        course: ['COPA', 'PGDCA'][i % 2],
        status: ['New', 'Follow-up', 'Converted'][i % 3],
      })),
    },
    Courses: {
      stats: [{ label: 'Listed', value: '7' }],
      columns: [
        { key: 'id', label: 'Code' },
        { key: 'name', label: 'Course' },
        { key: 'duration', label: 'Duration' },
        { key: 'status', label: 'Status' },
      ],
      rows: [
        { id: 'COPA', name: 'Computer Operator & Programming Assistant', duration: '1 Year', status: 'Active' },
        { id: 'DCA', name: 'Diploma in Computer Applications', duration: 'After 12th', status: 'Active' },
        { id: 'PGDCA', name: 'Post Graduate Diploma in Computer Applications', duration: 'After Graduation', status: 'Active' },
        { id: 'TLY', name: 'Tally Prime', duration: 'Short', status: 'Active' },
        { id: 'DE', name: 'Data Entry', duration: 'Short', status: 'Active' },
        { id: 'CPCT', name: 'CPCT Preparation', duration: 'Short', status: 'Active' },
        { id: 'FND', name: 'Computer Fundamentals', duration: 'Short', status: 'Active' },
      ],
    },
    Batches: {
      stats: [{ label: 'Running', value: '4' }],
      columns: [
        { key: 'id', label: 'Batch' },
        { key: 'name', label: 'Name' },
        { key: 'course', label: 'Course' },
        { key: 'timing', label: 'Timing' },
        { key: 'status', label: 'Status' },
      ],
      rows: [
        { id: 'B1', name: 'COPA Morning', course: 'COPA', timing: '10:00–12:00', status: 'Active' },
        { id: 'B2', name: 'DCA Evening', course: 'DCA', timing: '02:00–04:00', status: 'Active' },
        { id: 'B3', name: 'Ladies batch', course: 'MS Office', timing: '12:00–02:00', status: 'Active' },
        { id: 'B4', name: 'PGDCA Weekend', course: 'PGDCA', timing: 'Sat–Sun', status: 'Pending' },
      ],
    },
    Faculty: {
      stats: [{ label: 'Trainers', value: '6' }],
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'area', label: 'Area' },
        { key: 'status', label: 'Status' },
      ],
      rows: rows('FAC', 6, (i) => ({
        name: `Trainer ${i + 1}`,
        area: ['COPA / Computer', 'Tally', 'Typing Lab'][i % 3],
        status: 'Active',
      })),
    },
    Fees: {
      stats: [
        { label: 'Collected', value: '₹3.4L' },
        { label: 'Pending', value: '₹1.2L' },
      ],
      columns: [
        { key: 'id', label: 'Receipt' },
        { key: 'name', label: 'Student' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
      ],
      rows: rows('FEE', 8, (i) => ({
        amount: ['₹6,500', '₹3,500', '₹8,000'][i % 3],
        status: i % 3 ? 'Paid' : 'Due',
      })),
    },
    Attendance: {
      stats: [{ label: 'Today', value: '91%' }],
      columns: [
        { key: 'id', label: 'Record' },
        { key: 'name', label: 'Batch' },
        { key: 'present', label: 'Present' },
        { key: 'status', label: 'Status' },
      ],
      rows: rows('ATT', 6, (i) => ({
        name: ['COPA Morning', 'DCA Evening'][i % 2],
        present: `${18 + (i % 5)}/22`,
        status: 'Completed',
      })),
    },
  }

  if (table[section]) return { title: section, ...table[section] }

  return {
    title: section,
    stats: [{ label: 'Records', value: '8' }],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Title' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
    ],
    rows: rows(section.slice(0, 3).toUpperCase(), 8),
  }
}
