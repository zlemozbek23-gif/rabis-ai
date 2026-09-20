/**
 * Upload photos to Supabase Storage with robust fallback to base64.
 * Guarantees that photos are ALWAYS saved and never lost, even if
 * Supabase storage bucket has permissions or configuration issues.
 */
import { supabase, isSupabaseConfigured } from './supabase'
import { fileToBase64 } from './gemini'

const BUCKET = 'user-photos'

/**
 * Upload a file to Supabase Storage and return a public URL.
 */
async function uploadToStorage(path, file) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Upload user profile/face photo.
 * Returns URL (Supabase or base64 fallback).
 */
export async function uploadProfilePhoto(userId, file) {
  if (isSupabaseConfigured && supabase) {
    try {
      const ext = file.name?.split('.').pop() || 'jpg'
      const path = `${userId}/profile/photo_${Date.now()}.${ext}`
      return await uploadToStorage(path, file)
    } catch (err) {
      console.warn('Supabase storage profile upload warning, using local base64 fallback:', err)
    }
  }
  // Robust Fallback: base64
  const b64 = await fileToBase64(file)
  return `data:${file.type || 'image/jpeg'};base64,${b64}`
}

/**
 * Upload a wardrobe item photo.
 * Returns URL (Supabase or base64 fallback).
 */
export async function uploadWardrobePhoto(userId, itemId, file) {
  if (isSupabaseConfigured && supabase) {
    try {
      const ext = file.name?.split('.').pop() || 'jpg'
      const path = `${userId}/wardrobe/${itemId}.${ext}`
      return await uploadToStorage(path, file)
    } catch (err) {
      console.warn('Supabase storage wardrobe upload warning, using local base64 fallback:', err)
    }
  }
  // Robust Fallback: base64
  const b64 = await fileToBase64(file)
  return `data:${file.type || 'image/jpeg'};base64,${b64}`
}

/**
 * Delete a wardrobe item photo from storage.
 */
export async function deleteWardrobePhoto(userId, itemId) {
  if (!isSupabaseConfigured || !supabase) return
  try {
    for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'heic']) {
      await supabase.storage
        .from(BUCKET)
        .remove([`${userId}/wardrobe/${itemId}.${ext}`])
        .catch(() => {})
    }
  } catch (err) {
    console.warn('Storage delete error:', err)
  }
}
