import { useState, useCallback } from 'react'
import { analyzeClothingItem } from '../lib/gemini'
import { uploadWardrobePhoto, deleteWardrobePhoto } from '../lib/storageUpload'
import { insertWardrobeItem, deleteWardrobeItemDB } from '../lib/supabaseSync'
import { useAppStore } from '../store/useAppStore'

export function useWardrobe() {
  const [loading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const { wardrobe, setWardrobe, addWardrobeItem, removeWardrobeItem, user } = useAppStore()

  // Add a clothing item: upload photo → analyze → save to DB → add to store
  const addClothingItem = useCallback(async (file) => {
    const uid = user?.uid
    if (!uid) throw new Error('Giriş yapılmamış')

    setUploading(true)
    setError(null)
    try {
      const itemId = 'item_' + Date.now()

      // 1. Upload photo (Supabase Storage or base64 fallback)
      const imageUrl = await uploadWardrobePhoto(uid, itemId, file)

      // 2. AI analysis
      let analysis = {}
      try {
        analysis = await analyzeClothingItem(file)
      } catch {
        analysis = {
          name: file.name?.replace(/\.[^/.]+$/, '') || 'Kıyafet',
          category: 'tops',
          color: 'Belirtilmedi',
          style: ['casual'],
          season: ['all-season'],
        }
      }

      const newItem = {
        id: itemId,
        ...analysis,
        imageUrl,
        createdAt: new Date().toISOString(),
      }

      // 3. Save to Supabase DB (no-op if guest/not configured)
      if (!user?.isGuest) {
        await insertWardrobeItem(uid, newItem)
      }

      // 4. Update local store
      addWardrobeItem(newItem)
      return newItem
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setUploading(false)
    }
  }, [addWardrobeItem, user])

  // Delete a clothing item: remove from DB + storage + store
  const deleteClothingItem = useCallback(async (item) => {
    const uid = user?.uid
    if (!uid) return
    try {
      if (!user?.isGuest) {
        await Promise.all([
          deleteWardrobeItemDB(item.id),
          deleteWardrobePhoto(uid, item.id),
        ])
      }
      removeWardrobeItem(item.id)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [removeWardrobeItem, user])

  return {
    wardrobe,
    loading,
    uploading,
    error,
    addClothingItem,
    deleteClothingItem,
    // fetchWardrobe is handled by useAuth on login, expose as no-op
    fetchWardrobe: () => {},
  }
}
