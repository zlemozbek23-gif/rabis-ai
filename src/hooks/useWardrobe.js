import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { db, storage, auth, isFirebaseConfigured } from '../lib/firebase'
import { analyzeClothingItem, fileToBase64 } from '../lib/gemini'
import { useAppStore } from '../store/useAppStore'

export function useWardrobe() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const { wardrobe, setWardrobe, addWardrobeItem, removeWardrobeItem, user } =
    useAppStore()

  // Fetch all wardrobe items from Firestore if Firebase is active
  const fetchWardrobe = useCallback(async () => {
    const uid = auth?.currentUser?.uid || user?.uid
    if (!uid || !isFirebaseConfigured || user?.isGuest) return

    setLoading(true)
    try {
      const q = query(
        collection(db, 'users', uid, 'wardrobe'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setWardrobe(items)
    } catch (err) {
      console.warn('Firestore fetch wardrobe error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [setWardrobe, user])

  useEffect(() => {
    fetchWardrobe()
  }, [fetchWardrobe])

  // Upload a clothing item
  const addClothingItem = useCallback(
    async (file) => {
      const uid = auth?.currentUser?.uid || user?.uid
      if (!uid) throw new Error('Giriş yapılmamış')

      setUploading(true)
      setError(null)
      try {
        let imageUrl = ''
        let storagePath = ''

        if (isFirebaseConfigured && !user?.isGuest && storage) {
          // 1. Upload to Firebase Storage
          const ext = file.name.split('.').pop() || 'jpg'
          storagePath = `wardrobe/${uid}/${Date.now()}.${ext}`
          const storageRef = ref(storage, storagePath)
          const snapshot = await uploadBytes(storageRef, file)
          imageUrl = await getDownloadURL(snapshot.ref)
        } else {
          // Local base64 data URL for guest/offline mode
          const base64 = await fileToBase64(file)
          imageUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`
        }

        // 2. Analyze with Gemini
        let analysis = {}
        try {
          analysis = await analyzeClothingItem(file)
        } catch (aiErr) {
          console.warn('AI analiz uyarısı:', aiErr)
          analysis = {
            name: file.name.replace(/\.[^/.]+$/, "") || 'Kıyafet',
            category: 'tops',
            color: 'Belirtilmedi',
            style: ['casual'],
            season: ['all-season'],
            occasion: ['casual'],
            aiDescription: 'Kıyafet parçası'
          }
        }

        const itemData = {
          ...analysis,
          imageUrl,
          storagePath,
          timesWorn: 0,
          lastWorn: null,
          tags: [],
          createdAt: new Date().toISOString(),
        }

        let id = Date.now().toString()

        if (isFirebaseConfigured && !user?.isGuest && db) {
          const docRef = await addDoc(
            collection(db, 'users', uid, 'wardrobe'),
            { ...itemData, createdAt: serverTimestamp() }
          )
          id = docRef.id
        }

        const newItem = { id, ...itemData }
        addWardrobeItem(newItem)
        return newItem
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setUploading(false)
      }
    },
    [addWardrobeItem, user]
  )

  // Delete a clothing item
  const deleteClothingItem = useCallback(
    async (item) => {
      const uid = auth?.currentUser?.uid || user?.uid
      if (!uid) return

      try {
        if (isFirebaseConfigured && !user?.isGuest) {
          if (item.storagePath && storage) {
            const storageRef = ref(storage, item.storagePath)
            await deleteObject(storageRef).catch(() => {})
          }
          if (db) {
            await deleteDoc(doc(db, 'users', uid, 'wardrobe', item.id))
          }
        }
        removeWardrobeItem(item.id)
      } catch (err) {
        setError(err.message)
        throw err
      }
    },
    [removeWardrobeItem, user]
  )

  return {
    wardrobe,
    loading,
    uploading,
    error,
    fetchWardrobe,
    addClothingItem,
    deleteClothingItem,
  }
}
