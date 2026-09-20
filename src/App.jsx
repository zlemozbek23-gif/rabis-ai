import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import OnboardingPage from './pages/OnboardingPage'
import ChatPage from './pages/ChatPage'
import WardrobePage from './pages/WardrobePage'
import SavedPage from './pages/SavedPage'
import WeatherPage from './pages/WeatherPage'
import LoginPage from './pages/LoginPage'
import BottomNav from './components/BottomNav'
import { useAppStore } from './store/useAppStore'
import { isSupabaseConfigured } from './lib/supabase'

function AppRoutes() {
  const { user, loading } = useAuth()
  const { onboardingComplete } = useAppStore()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#09090d', flexDirection: 'column', gap: 16,
      }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Yükleniyor...</p>
      </div>
    )
  }

  // If Supabase is configured and user is not logged in → show login
  if (isSupabaseConfigured && !user) {
    return <LoginPage />
  }

  // First-time user: show onboarding
  if (!onboardingComplete) {
    return <OnboardingPage />
  }

  // Main app
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#09090d', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/wardrobe" element={<WardrobePage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
