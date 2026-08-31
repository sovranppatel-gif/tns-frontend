import {
  archiveShift,
  createShift,
  getShifts,
  updateShift,
  updateShiftStatus,
} from '../../../services/staffService.js'
import { dutyDurationLabel } from './staffConstants.js'
import StaffLookupManager from './StaffLookupManager.jsx'

export default function StaffShiftsPage() {
  return (
    <StaffLookupManager
      title="Shifts & Duty Hours"
      addLabel="Add Shift"
      description="Predefined shifts. Individual staff can still use custom duty timings."
      emptyForm={{ name: '', startTime: '09:30', endTime: '17:30', breakMinutes: 0, description: '', status: 'Active' }}
      columns={[
        { key: 'name', label: 'Shift' },
        { key: 'timingLabel', label: 'Timing' },
        {
          key: 'workingHours',
          label: 'Working hours',
          render: (row) => row.workingHours || dutyDurationLabel(row.startTime, row.endTime, row.breakMinutes) || '—',
        },
        { key: 'description', label: 'Description' },
      ]}
      loadRows={getShifts}
      createRow={createShift}
      updateRow={updateShift}
      setStatus={updateShiftStatus}
      archiveRow={archiveShift}
      fields={({ form, setForm, inputClass }) => (
        <>
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Shift name
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={`${inputClass} mt-1`} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Start time
              <input type="time" value={form.startTime || ''} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} className={`${inputClass} mt-1`} />
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              End time
              <input type="time" value={form.endTime || ''} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} className={`${inputClass} mt-1`} />
            </label>
          </div>
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Break duration (minutes)
            <input type="number" min="0" value={form.breakMinutes ?? 0} onChange={(e) => setForm((p) => ({ ...p, breakMinutes: e.target.value }))} className={`${inputClass} mt-1`} />
          </label>
          <p className="text-xs text-slate-500">
            Working hours: {dutyDurationLabel(form.startTime, form.endTime, form.breakMinutes) || '—'}
          </p>
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
