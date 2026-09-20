import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import {
  loadProfile,
  loadWardrobe,
  loadSavedOutfits,
  upsertProfile,
} from '../lib/supabaseSync'

export function useAuth() {
  const [loading, setLoading] = useState(true)
  const { user, setUser, setProfile, setWardrobe, setSavedOutfits, setOnboardingComplete } = useAppStore()

  // Load all cloud data after login
  const syncFromCloud = async (supabaseUser) => {
    try {
      const [profileData, wardrobeData, outfitsData] = await Promise.all([
        loadProfile(supabaseUser.id),
        loadWardrobe(supabaseUser.id),
        loadSavedOutfits(supabaseUser.id),
      ])

      if (profileData) {
        setProfile({
          userPhotoUrl: profileData.user_photo_url || '',
          bodyAnalysis: profileData.body_analysis || null,
          facePhotoUrl: profileData.face_photo_url || '',
          faceAnalysis: profileData.face_analysis || null,
        })
        if (profileData.onboarding_complete) {
          setOnboardingComplete(true)
        }
      }

      if (wardrobeData.length > 0) {
        setWardrobe(wardrobeData)
      }

      if (outfitsData.length > 0) {
        setSavedOutfits(outfitsData)
      }
    } catch (err) {
      console.warn('Cloud sync error:', err)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // No Supabase: use localStorage persist (guest mode)
      setLoading(false)
      return
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user
        setUser({ uid: u.id, displayName: u.user_metadata?.full_name || 'Kullanıcı', email: u.email, isGuest: false })
        syncFromCloud(u).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user
        setUser({ uid: u.id, displayName: u.user_metadata?.full_name || 'Kullanıcı', email: u.email, isGuest: false })
        if (event === 'SIGNED_IN') {
          await syncFromCloud(u)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setOnboardingComplete(false)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase henüz yapılandırılmamış.')
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }

  const loginAsGuest = () => {
    setUser({
      uid: 'guest_' + Math.random().toString(36).substring(2, 9),
      displayName: 'Misafir',
      email: '',
      isGuest: true,
    })
  }

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {})
    }
    setUser(null)
    setOnboardingComplete(false)
  }

  return {
    user,
    loading,
    signInWithGoogle,
    loginAsGuest,
    logout,
    isSupabaseConfigured,
    // Keep legacy name for compatibility
    isFirebaseConfigured: isSupabaseConfigured,
  }
}
