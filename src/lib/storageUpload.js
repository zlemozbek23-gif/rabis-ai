/**
 * Upload photos to Supabase Storage.
 * Falls back to base64 data URL when Supabase is not configured.
 */
import { supabase, isSupabaseConfigured } from './supabase'
import { fileToBase64 } from './gemini'

const BUCKET = 'user-photos'

/**
 * Upload a file to Supabase Storage and return a public URL.
 * Path example: "userId/profile/photo.jpg"
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
    const ext = file.name?.split('.').pop() || 'jpg'
    const path = `${userId}/profile/photo.${ext}`
    return await uploadToStorage(path, file)
  }
  // Offline fallback: base64
  const b64 = await fileToBase64(file)
  return `data:${file.type || 'image/jpeg'};base64,${b64}`
}

/**
 * Upload a wardrobe item photo.
 * Returns URL (Supabase or base64 fallback).
 */
export async function uploadWardrobePhoto(userId, itemId, file) {
  if (isSupabaseConfigured && supabase) {
    const ext = file.name?.split('.').pop() || 'jpg'
    const path = `${userId}/wardrobe/${itemId}.${ext}`
    return await uploadToStorage(path, file)
  }
  // Offline fallback: base64
  const b64 = await fileToBase64(file)
  return `data:${file.type || 'image/jpeg'};base64,${b64}`
}

/**
 * Delete a wardrobe item photo from storage.
 */
export async function deleteWardrobePhoto(userId, itemId) {
  if (!isSupabaseConfigured || !supabase) return
  // Try common extensions
  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'heic']) {
    await supabase.storage
      .from(BUCKET)
      .remove([`${userId}/wardrobe/${itemId}.${ext}`])
      .catch(() => {})
  }
}
