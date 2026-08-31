import { Panel } from './MasterAdminUI'
import logo from '../../assets/tnslogo.png'
import { studentProfile } from '../../data/studentData'
import { useLocation } from 'react-router-dom'
import { API_URL } from '../../utils/api.js'

export function CctvPage() {
  const cams = ['Reception', 'Computer Lab 1', 'Computer Lab 2', 'Corridor', 'Gate', 'Office']
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cams.map((cam) => (
        <Panel key={cam} title={cam}>
          <div className="flex aspect-video items-center justify-center rounded-lg bg-navy-950 text-xs font-semibold text-white/50">
            Demo feed · {cam}
          </div>
        </Panel>
      ))}
    </div>
  )
}

export function IdCardPage() {
  const location = useLocation()
  const student = location.state?.student
  const photo = student?.photo
    ? /^(data:|https?:|blob:)/i.test(student.photo)
      ? student.photo
      : `${API_URL}${student.photo}`
    : studentProfile.avatar
  const name = student?.nameEnglish || studentProfile.name
  const id = student?.studentId || studentProfile.id
  const course = student?.courseLabel || student?.courseName || studentProfile.course

  return (
    <Panel title="ID card preview">
      <div className="mx-auto w-full max-w-xs rounded-2xl border border-navy-900/20 bg-gradient-to-b from-navy-900 to-navy-800 p-5 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-10 w-10 rounded-full bg-white object-contain p-0.5" />
          <div>
            <p className="text-[10px] tracking-wider text-gold uppercase">TNS ITI & Computer</p>
            <p className="text-xs font-bold">Narsinghpur</p>
          </div>
        </div>
        <img src={photo} alt="" className="mx-auto mt-4 h-24 w-24 rounded-lg object-cover" />
        <p className="mt-3 text-center text-sm font-bold">{name}</p>
        <p className="text-center text-xs text-white/70">{id}</p>
        <p className="mt-1 text-center text-[11px] text-gold">{course}</p>
        {student?.admissionId ? (
          <p className="mt-1 text-center text-[10px] text-white/60">Admission {student.admissionId}</p>
        ) : null}
      </div>
    </Panel>
  )
}

export function CmsPage({ title }) {
  return (
    <Panel title={title}>
      <p className="text-sm text-slate-600">
        Website content for this block can be managed here. This is a frontend workspace for TNS landing sections — not connected to a CMS server yet.
      </p>
      <textarea className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-sm" rows={6} defaultValue={`${title} draft content for TNS ITI & Computer, Narsinghpur.`} />
      <button type="button" className="btn-primary mt-3">Save draft</button>
    </Panel>
  )
}
