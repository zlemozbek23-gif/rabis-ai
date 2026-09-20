import { useState, useEffect } from 'react'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from 'firebase/auth'
import { useAppStore } from '../store/useAppStore'

export function useAuth() {
  const [loading, setLoading] = useState(true)
  const { user, setUser } = useAppStore()

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // If user was signed in via guest mode, keep it unless firebaseUser exists
      if (firebaseUser) {
        setUser(firebaseUser)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [setUser])

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase anahtarları henüz .env dosyasına eklenmemiş. Lütfen "Misafir Olarak Devam Et" seçeneğini kullanın veya Firebase ayarlarınızı tamamlayın.')
    }
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('Google sign-in error:', err)
      throw err
    }
  }

  const loginAsGuest = () => {
    const guestUser = {
      uid: 'guest_' + Math.random().toString(36).substring(2, 9),
      displayName: 'Stil Sahibi (Misafir)',
      email: 'misafir@styleai.app',
      isGuest: true,
    }
    setUser(guestUser)
  }

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth)
      } catch {
        // ignore
      }
    }
    setUser(null)
  }

  return {
    user,
    loading,
    signInWithGoogle,
    loginAsGuest,
    logout,
    isFirebaseConfigured,
  }
}
