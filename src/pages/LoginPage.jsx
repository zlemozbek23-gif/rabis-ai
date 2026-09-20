import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'

export default function LoginPage() {
  const { signInWithGoogle, loginAsGuest, isSupabaseConfigured } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message || 'Giriş yapılamadı. Lütfen tekrar dene.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = () => {
    loginAsGuest()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      background: 'linear-gradient(160deg, #0a0a0a 0%, #150d2e 100%)',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 36, textAlign: 'center' }}>
        <div style={{
          fontSize: 64,
          marginBottom: 14,
          filter: 'drop-shadow(0 0 30px rgba(124,58,237,0.5))'
        }}>👗</div>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8,
          letterSpacing: '-0.5px',
        }}>
          Rabiş AI
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.5 }}>
          Yapay zeka destekli kişisel<br />stil ve kombin asistanın
        </p>
      </div>

      {/* Features */}
      <div style={{ width: '100%', maxWidth: 320, marginBottom: 36 }}>
        {[
          { icon: '📸', text: 'Yüzünü ve dolabını ekle' },
          { icon: '🤖', text: 'Gemini AI ile anında kombin önerisi' },
          { icon: '🌤️', text: 'Canlı hava durumuna göre stil tavsiyesi' },
        ].map(({ icon, text }) => (
          <div key={text} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          className="btn btn-primary btn-full"
          onClick={handleGoogle}
          disabled={loading}
          style={{ padding: '15px', fontSize: 15 }}
        >
          {loading ? (
            <div className="spinner" style={{ width: 20, height: 20 }} />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google ile Giriş Yap
            </>
          )}
        </button>

        <button
          className="btn btn-secondary btn-full"
          onClick={handleGuest}
          style={{ padding: '14px', fontSize: 14 }}
        >
          ⚡ Hızlı Keşfet (Misafir Modu)
        </button>

        {error && (
          <p style={{
            color: 'var(--danger)', fontSize: 12, textAlign: 'center',
            marginTop: 4, lineHeight: 1.4
          }}>
            {error}
          </p>
        )}

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <span className="badge" style={{ fontSize: 11 }}>
            📱 iOS Safari: Paylaş ➔ Ana Ekrana Ekle
          </span>
        </div>
      </div>
    </div>
  )
}
