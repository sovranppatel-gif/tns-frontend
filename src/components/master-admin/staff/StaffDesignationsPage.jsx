import { useEffect, useState } from 'react'
import {
  archiveDesignation,
  createDesignation,
  getDepartments,
  getDesignations,
  updateDesignation,
  updateDesignationStatus,
} from '../../../services/staffService.js'
import StaffLookupManager from './StaffLookupManager.jsx'

export default function StaffDesignationsPage() {
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch(() => {})
  }, [])

  return (
    <StaffLookupManager
      title="Designations"
      addLabel="Add Designation"
      description="Job titles for non-teaching staff. Not used for faculty or teachers."
      emptyForm={{ name: '', department: '', description: '', status: 'Active' }}
      columns={[
        { key: 'name', label: 'Designation' },
        { key: 'department', label: 'Department' },
        { key: 'description', label: 'Description' },
      ]}
      loadRows={getDesignations}
      createRow={createDesignation}
      updateRow={updateDesignation}
      setStatus={updateDesignationStatus}
      archiveRow={archiveDesignation}
      fields={({ form, setForm, inputClass }) => (
        <>
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Designation name
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={`${inputClass} mt-1`} />
          </label>
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Department
            <select value={form.department || ''} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} className={`${inputClass} mt-1`}>
              <option value="">Any / unassigned</option>
              {departments.map((d) => (
                <option key={d._id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Description
            <textarea value={form.description || ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={`${inputClass} mt-1 min-h-[72px]`} />
          </label>
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Status
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={`${inputClass} mt-1`}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
        </>
      )}
    />
  )
}
