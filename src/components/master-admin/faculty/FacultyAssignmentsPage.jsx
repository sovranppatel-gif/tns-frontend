import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllFacultyAssignments } from '../../../services/facultyService.js'
import {
  DataTable,
  PageToolbar,
  Pagination,
  StatusBadge,
} from '../shared/MasterAdminUI.jsx'
import { facultyProfilePath } from './facultyFormUtils.js'

export default function FacultyAssignmentsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await getAllFacultyAssignments({ page, limit: 10, search, status })
      setRows(data.rows)
      setPagination(data.pagination)
    } catch (err) {
      setError(err?.message || 'Unable to load assignments')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    reload(1)
  }, [reload])

  return (
    <section className="space-y-3">
      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{error}</article>
      ) : null}
      <PageToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search faculty, course, subject, batch…"
        filters={['Active', 'Inactive']}
        filterValue={status}
        onFilter={setStatus}
      />
      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading assignments…</p>
      ) : (
        <DataTable
          columns={[
            { key: 'facultyId', label: 'Faculty ID' },
            { key: 'facultyName', label: 'Faculty' },
            { key: 'universityName', label: 'University' },
            { key: 'courseName', label: 'Course' },
            { key: 'subjectName', label: 'Subject' },
            { key: 'batchName', label: 'Batch' },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            {
              key: '_actions',
              label: 'Actions',
              render: (row) => (
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-red"
                  onClick={() => navigate(facultyProfilePath(row.facultyMongoId))}
                >
                  Open profile
                </button>
              ),
            },
          ]}
          rows={rows}
          emptyTitle="No faculty assignments yet"
        />
      )}
      <Pagination
        page={pagination.page}
        pageSize={pagination.limit}
        total={pagination.total}
        onPageChange={(p) => reload(p)}
      />
    </section>
  )
}
