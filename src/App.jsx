import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import StudentSignIn from './pages/StudentSignIn'
import StudentSignUp from './pages/StudentSignUp'
import StudentDashboard from './components/student/StudentDashboard'
import MasterAdminLogin from './components/master-admin/MasterAdminLogin'
import MasterDashboard from './components/master-admin/MasterDashboard'
import { getSession } from './utils/studentAuth'

function GuestOnly({ children }) {
  return getSession() ? <Navigate to="/student/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/signin"
          element={
            <GuestOnly>
              <StudentSignIn />
            </GuestOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnly>
              <StudentSignUp />
            </GuestOnly>
          }
        />
        <Route path="/login" element={<Navigate to="/signin" replace />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/:sectionSlug" element={<StudentDashboard />} />
        <Route path="/master-admin" element={<MasterAdminLogin />} />
        <Route path="/master-admin/fees/:feeStudentSlug" element={<MasterDashboard />} />
        <Route path="/master-admin/faculty/:facultyId" element={<MasterDashboard />} />
        <Route path="/master-admin/staff/:staffId" element={<MasterDashboard />} />
        <Route path="/master-admin/:sectionSlug" element={<MasterDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
