import { useState, useCallback } from 'react'
import { analyzeClothingItem } from '../lib/gemini'
import { uploadWardrobePhoto, deleteWardrobePhoto } from '../lib/storageUpload'
import { insertWardrobeItem, deleteWardrobeItemDB } from '../lib/supabaseSync'
import { compressImage } from '../lib/imageCompressor'
import { useAppStore } from '../store/useAppStore'

export function useWardrobe() {
  const [loading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null) // { current, total, percent, currentName }
  const [error, setError] = useState(null)
  const { wardrobe, setWardrobe, addWardrobeItem, removeWardrobeItem, user } = useAppStore()

  // Add a single clothing item with automatic compression and timeout protection
  const addClothingItem = useCallback(async (file) => {
    const uid = user?.uid
    const itemId = 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)

    // 1. Instant client-side compression (converts 10MB to ~80KB)
    const compressed = await compressImage(file, 700, 700, 0.75)

    // 2. Upload photo (instant ~80KB base64 or Supabase Storage)
    const imageUrl = await uploadWardrobePhoto(uid || 'guest', itemId, compressed)

    // 3. AI analysis (with smart fallback so it never hangs)
    let analysis = {}
    try {
      analysis = await analyzeClothingItem(compressed)
    } catch {
      analysis = {
        name: file.name?.replace(/\.[^/.]+$/, '') || 'Yeni Kıyafet',
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

    // 4. Update local store & IndexedDB immediately
    addWardrobeItem(newItem)

    // 5. Save to Supabase DB in background (safe, no blocking)
    if (uid && !user?.isGuest) {
      insertWardrobeItem(uid, newItem).catch((e) => console.warn('Supabase DB save warning:', e))
    }

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

    setUploadProgress({ current: 0, total, percent: 0, currentName: 'Başlatılıyor...' })

    // Process with concurrency limit (3 at a time for optimal speed and reliability)
    const concurrency = 3
    for (let i = 0; i < total; i += concurrency) {
      const batch = fileList.slice(i, i + concurrency)
      const results = await Promise.allSettled(
        batch.map(async (file) => {
          try {
            const item = await addClothingItem(file)
            completed++
            const percent = Math.round((completed / total) * 100)
            setUploadProgress({ current: completed, total, percent, currentName: file.name })
            if (onProgressCallback) onProgressCallback(completed, total, file.name)
            return item
          } catch (itemErr) {
            completed++
            const percent = Math.round((completed / total) * 100)
            setUploadProgress({ current: completed, total, percent, currentName: file.name })
            console.warn('Item upload warning:', itemErr)
            return null
          }
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

    // 1. Immediately remove from local state and IndexedDB so UI updates instantly
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
        console.warn('Background delete error (ignored):', err)
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
