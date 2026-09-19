import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CreatePollPage from './pages/CreatePollPage'
import VotePage from './pages/VotePage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col" style={{ background: '#5A3A2E' }}>
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"          element={<HomePage />} />
              <Route path="/login"     element={<LoginPage />} />
              <Route path="/signup"    element={<SignupPage />} />
              <Route path="/poll/:id"  element={<VotePage />} />
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreatePollPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Toast notifications — styled to match the brown/green theme */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#745041',
              color: '#F5F1E8',
              border: '1px solid #9A705B',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 16px rgba(58,35,25,0.5)',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#8FD17A', secondary: '#3A2319' },
              style: {
                background: '#745041',
                color: '#F5F1E8',
                border: '1px solid rgba(143,209,122,0.4)',
              },
            },
            error: {
              iconTheme: { primary: '#E98B82', secondary: '#3A2319' },
              style: {
                background: '#745041',
                color: '#F5F1E8',
                border: '1px solid rgba(233,139,130,0.4)',
              },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
