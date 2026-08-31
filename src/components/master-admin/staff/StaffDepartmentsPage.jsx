import {
  archiveDepartment,
  createDepartment,
  getDepartments,
  updateDepartment,
  updateDepartmentStatus,
} from '../../../services/staffService.js'
import StaffLookupManager from './StaffLookupManager.jsx'

export default function StaffDepartmentsPage() {
  return (
    <StaffLookupManager
      title="Departments"
      addLabel="Add Department"
      description="Manage non-teaching office departments. These are independent from academic departments."
      emptyForm={{ name: '', code: '', description: '', status: 'Active' }}
      columns={[
        { key: 'name', label: 'Department' },
        { key: 'code', label: 'Code' },
        { key: 'description', label: 'Description' },
      ]}
      loadRows={getDepartments}
      createRow={createDepartment}
      updateRow={updateDepartment}
      setStatus={updateDepartmentStatus}
      archiveRow={archiveDepartment}
      fields={({ form, setForm, inputClass }) => (
        <>
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Department name
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={`${inputClass} mt-1`} />
          </label>
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Department code
            <input value={form.code || ''} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} className={`${inputClass} mt-1`} />
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
