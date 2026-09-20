import { useState, useCallback } from 'react'
import { analyzeClothingItem } from '../lib/gemini'
import { uploadWardrobePhoto, deleteWardrobePhoto } from '../lib/storageUpload'
import { insertWardrobeItem, deleteWardrobeItemDB } from '../lib/supabaseSync'
import { useAppStore } from '../store/useAppStore'

export function useWardrobe() {
  const [loading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null) // { current, total, percent }
  const [error, setError] = useState(null)
  const { wardrobe, setWardrobe, addWardrobeItem, removeWardrobeItem, user } = useAppStore()

  // Add a single clothing item
  const addClothingItem = useCallback(async (file) => {
    const uid = user?.uid
    const itemId = 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)

    // 1. Upload photo (Supabase Storage or base64 fallback)
    const imageUrl = await uploadWardrobePhoto(uid || 'guest', itemId, file)

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

    // 3. Save to Supabase DB (safe, no throw if error)
    if (uid && !user?.isGuest) {
      await insertWardrobeItem(uid, newItem).catch(console.warn)
    }

    // 4. Update local store
    addWardrobeItem(newItem)
    return newItem
  }, [addWardrobeItem, user])

  // Bulk add clothing items (up to 100 files, batch processing)
  const addClothingItems = useCallback(async (files, onProgressCallback) => {
    const fileList = Array.from(files || []).slice(0, 100)
    if (fileList.length === 0) return []

    setUploading(true)
    setError(null)
    const total = fileList.length
    let completed = 0
    const addedItems = []

    setUploadProgress({ current: 0, total, percent: 0 })

    // Process with concurrency limit (2 at a time for API stability & speed)
    const concurrency = 2
    for (let i = 0; i < total; i += concurrency) {
      const batch = fileList.slice(i, i + concurrency)
      const results = await Promise.allSettled(
        batch.map(async (file) => {
          const item = await addClothingItem(file)
          completed++
          const percent = Math.round((completed / total) * 100)
          setUploadProgress({ current: completed, total, percent, currentName: file.name })
          if (onProgressCallback) onProgressCallback(completed, total, file.name)
          return item
        })
      )

      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          addedItems.push(res.value)
        }
      }
    }

    setUploading(false)
    setUploadProgress(null)
    return addedItems
  }, [addClothingItem])

  // Delete a clothing item (accepts object or string ID)
  const deleteClothingItem = useCallback(async (itemOrId) => {
    const itemId = typeof itemOrId === 'object' ? itemOrId?.id : itemOrId
    if (!itemId) return

    // 1. Immediately remove from local state so UI updates instantly!
    removeWardrobeItem(itemId)

    // 2. Safely remove from Supabase DB & Storage in background
    const uid = user?.uid
    if (uid && !user?.isGuest) {
      try {
        await Promise.allSettled([
          deleteWardrobeItemDB(itemId),
          deleteWardrobePhoto(uid, itemId),
        ])
      } catch (err) {
        console.warn('Background delete error (ignored for smooth UX):', err)
      }
    }
  }, [removeWardrobeItem, user])

  return {
    wardrobe,
    loading,
    uploading,
    uploadProgress,
    error,
    addClothingItem,
    addClothingItems,
    deleteClothingItem,
    fetchWardrobe: () => {},
  }
}
