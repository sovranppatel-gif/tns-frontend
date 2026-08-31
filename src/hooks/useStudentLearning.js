import { useEffect, useState } from 'react'
import { getStudentLearning } from '../services/studentLearningService.js'

export function useStudentLearning(kind) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getStudentLearning(kind)
      .then((data) => {
        if (cancelled) return
        setRows(data.rows)
      })
      .catch((err) => {
        if (cancelled) return
        setRows([])
        setError(err?.message || 'Unable to load data')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [kind])

  return { rows, loading, error }
}
