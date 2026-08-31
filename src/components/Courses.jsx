import { FaDesktop, FaCertificate, FaUserGraduate, FaKeyboard, FaCalculator, FaDatabase } from 'react-icons/fa'
import CourseCard from './CourseCard'
import Reveal from './Reveal'

const courses = [
  {
    icon: FaDesktop,
    title: 'COPA',
    subtitle: 'Computer Operator & Programming Assistant',
    description:
      'NCVT approved ITI trade focused on computer operations, office applications, typing and programming basics — with 1 year duration.',
    topics: [
      'Computer Fundamentals',
      'MS Word',
      'MS Excel',
      'MS PowerPoint',
      'Internet & Email',
      'Operating System',
      'Programming Basics',
      'Database Basics',
      'Hindi Typing',
      'English Typing',
    ],
    meta: 'Duration: 1 Year · NCVT Approved Trade · After 10th',
  },
  {
    icon: FaCertificate,
    title: 'DCA',
    subtitle: 'Diploma in Computer Applications',
    description:
      'A computer diploma pathway after 12th covering office applications, internet, accounting software and design tools used in everyday computer work.',
    topics: ['Fundamentals', 'MS Office', 'Internet', 'Tally Prime', 'Photoshop', 'CorelDRAW', 'Practical Work'],
    meta: 'Eligibility: After 12th',
  },
  {
    icon: FaUserGraduate,
    title: 'PGDCA',
    subtitle: 'Post Graduate Diploma in Computer Applications',
    description:
      'A post-graduation computer diploma covering fundamentals, office tools, internet, Tally Prime, database concepts and project work.',
    topics: ['Computer Fundamentals', 'MS Office', 'Internet', 'Tally Prime', 'DBMS', 'Project Work'],
    meta: 'Eligibility: After Graduation',
  },
  {
    icon: FaCalculator,
    title: 'Tally',
    subtitle: 'Tally / Tally Prime',
    description: 'Computerised accounting practice with Tally Prime for students looking to build office and accounts skills.',
    topics: ['Tally Prime', 'Accounting Basics', 'Practical Work'],
    meta: 'Computer course',
  },
  {
    icon: FaDatabase,
    title: 'Data Entry',
    subtitle: 'Data Entry Training',
    description: 'Focused practice for accurate and efficient data entry using computer applications.',
    topics: ['Typing Practice', 'Office Applications', 'Accuracy & Speed'],
    meta: 'Computer course',
  },
  {
    icon: FaKeyboard,
    title: 'CPCT & Fundamentals',
    subtitle: 'CPCT · Computer Fundamentals · Office Automation',
    description:
      'Preparation-oriented computer skills including CPCT, computer fundamentals and office automation for students and working learners.',
    topics: ['CPCT', 'Computer Fundamentals', 'Office Automation', 'MS Office'],
    meta: 'Computer course',
  },
]

export default function Courses() {
  return (
    <section id="courses" className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="container-page">
        <Reveal>
          <p className="section-kicker">What you can study</p>
          <h2 className="section-title">Courses</h2>
          <p className="section-sub">
            ITI COPA plus computer diplomas and short skill courses at TNS, Narsinghpur.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course, i) => (
            <Reveal key={course.title} delay={i * 70}>
              <CourseCard {...course} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
