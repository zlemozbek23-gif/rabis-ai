import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY

export const isFirebaseConfigured = Boolean(
  apiKey && apiKey !== 'your_firebase_api_key_here'
)

let app = null
let authInstance = null
let dbInstance = null
let storageInstance = null

if (isFirebaseConfigured) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  app = initializeApp(firebaseConfig)
  authInstance = getAuth(app)
  dbInstance = getFirestore(app)
  storageInstance = getStorage(app)
}

export const auth = authInstance
export const db = dbInstance
export const storage = storageInstance
export const googleProvider = new GoogleAuthProvider()
