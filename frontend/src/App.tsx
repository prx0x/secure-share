import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/hooks/useToast'
import { DashboardPage } from '@/pages/Dashboard'
import { FilesPage } from '@/pages/Files'
import { GroupsPage } from '@/pages/Groups'
import { LoginPage } from '@/pages/Login'
import { RegisterPage } from '@/pages/Register'
import { SharedPage } from '@/pages/Shared'
import { ProtectedRoute, PublicOnlyRoute } from '@/routes/ProtectedRoute'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/shared" element={<SharedPage />} />
              <Route path="/groups" element={<GroupsPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  )
}
