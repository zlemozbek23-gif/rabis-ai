/**
 * Upload photos to Supabase Storage with robust fallback to base64.
 * Integrates image compression so uploads are ultra-fast and storage quota is never exceeded.
 */
import { supabase, isSupabaseConfigured } from './supabase'
import { fileToBase64 } from './gemini'
import { compressImage } from './imageCompressor'

const BUCKET = 'user-photos'

/**
 * Upload a file to Supabase Storage and return a public URL.
 */
async function uploadToStorage(path, file) {
  // 5-second timeout for storage upload so it never hangs
  const uploadPromise = supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: 'image/jpeg' })

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Storage upload timeout')), 5000)
  )

  const { error } = await Promise.race([uploadPromise, timeoutPromise])
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Upload user profile/face photo with automatic compression.
 */
export async function uploadProfilePhoto(userId, file) {
  const compressed = await compressImage(file, 600, 600, 0.8)

  if (isSupabaseConfigured && supabase) {
    try {
      const path = `${userId}/profile/photo_${Date.now()}.jpg`
      return await uploadToStorage(path, compressed)
    } catch (err) {
      console.warn('Supabase storage profile upload warning, using local base64 fallback:', err)
    }
  }

  // Fast Fallback: compressed base64 (~60KB)
  const b64 = await fileToBase64(compressed)
  return `data:image/jpeg;base64,${b64}`
}

/**
 * Upload a wardrobe item photo with automatic compression.
 */
export async function uploadWardrobePhoto(userId, itemId, file) {
  const compressed = await compressImage(file, 700, 700, 0.75)

  if (isSupabaseConfigured && supabase) {
    try {
      const path = `${userId}/wardrobe/${itemId}.jpg`
      return await uploadToStorage(path, compressed)
    } catch (err) {
      console.warn('Supabase storage wardrobe upload warning, using local base64 fallback:', err)
    }
  }

  // Fast Fallback: compressed base64 (~60-80KB)
  const b64 = await fileToBase64(compressed)
  return `data:image/jpeg;base64,${b64}`
}

/**
 * Delete a wardrobe item photo from storage.
 */
export async function deleteWardrobePhoto(userId, itemId) {
  if (!isSupabaseConfigured || !supabase) return
  try {
    for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
      await supabase.storage
        .from(BUCKET)
        .remove([`${userId}/wardrobe/${itemId}.${ext}`])
        .catch(() => {})
    }
  } catch (err) {
    console.warn('Storage delete error:', err)
  }
}
