import {
  archiveStaffCategory,
  createStaffCategory,
  getStaffCategories,
  updateStaffCategory,
  updateStaffCategoryStatus,
} from '../../../services/staffService.js'
import StaffLookupManager from './StaffLookupManager.jsx'

export default function StaffCategoriesPage() {
  return (
    <StaffLookupManager
      title="Staff Categories"
      addLabel="Add Category"
      description="Group non-teaching staff by function. Independent from courses and batches."
      emptyForm={{ name: '', description: '', status: 'Active' }}
      columns={[
        { key: 'name', label: 'Category' },
        { key: 'description', label: 'Description' },
      ]}
      loadRows={getStaffCategories}
      createRow={createStaffCategory}
      updateRow={updateStaffCategory}
      setStatus={updateStaffCategoryStatus}
      archiveRow={archiveStaffCategory}
      fields={({ form, setForm, inputClass }) => (
        <>
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Category name
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={`${inputClass} mt-1`} />
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
