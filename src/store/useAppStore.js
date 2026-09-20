import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '../lib/idbStorage'

const DEFAULT_AVATAR = {
  name: 'Rabiş',
  facePhoto: '',
  skinTone: '#d4a373', // Natural warm skin tone
  bodyType: 'classic', // 'athletic' | 'slim' | 'classic' | 'curvy'
  shoulderWidth: 1.0,  // 0.8 to 1.3
  heightRatio: 1.0,    // 0.85 to 1.15
  hairColor: '#1c1917', // Deep espresso / black
  gender: 'female',    // 'male' | 'female'
  hasBeard: false,     // Show beard on male mannequin
}


const DEFAULT_WARDROBE = []


export const useAppStore = create(
  persist(
    (set, get) => ({
      // Auth
      user: {
        uid: 'user_master',
        displayName: 'Rabiş',
        email: 'user@styleai.app',
        isGuest: true,
      },
      setUser: (user) => set({ user }),

      // Customized 3D Avatar Configuration
      avatarConfig: DEFAULT_AVATAR,
      setAvatarConfig: (updates) =>
        set((state) => ({
          avatarConfig: { ...state.avatarConfig, ...updates },
        })),

      // Profile metadata (User's personal photo & body/face analysis)
      profile: {
        userPhotoUrl: '',
        bodyAnalysis: null,
        faceAnalysis: {
          faceShape: 'oval',
          skinTone: 'açık',
          styleRecommendations: ['Modern Chic', 'Zarif & Tatlı', 'Minimalist'],
          colorPalette: ['Kızıl', 'Siyah', 'Beyaz', 'Krem', 'Pastel Pembe'],
          summary: 'Kızıl saçlar ve açık ten için kontrast ve pastel renkler muhteşem bir ahenk sunar.'
        }
      },
      setProfile: (updates) => set((state) => ({ profile: { ...state.profile, ...updates } })),

      // Wardrobe items with 3D models
      wardrobe: DEFAULT_WARDROBE,
      setWardrobe: (wardrobe) => set({ wardrobe }),
      addWardrobeItem: (item) =>
        set((state) => ({ wardrobe: [item, ...state.wardrobe] })),
      removeWardrobeItem: (id) =>
        set((state) => ({
          wardrobe: state.wardrobe.filter((item) => item.id !== id),
        })),
      updateWardrobeItem: (id, updates) =>
        set((state) => ({
          wardrobe: state.wardrobe.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      // Weather (cached)
      weather: null,
      weatherFetchedAt: null,
      setWeather: (weather) =>
        set({ weather, weatherFetchedAt: Date.now() }),

      // Saved outfits
      savedOutfits: [],
      setSavedOutfits: (outfits) => set({ savedOutfits: outfits }),
      addSavedOutfit: (outfit) =>
        set((state) => ({ savedOutfits: [outfit, ...state.savedOutfits] })),
      removeSavedOutfit: (id) =>
        set((state) => ({
          savedOutfits: state.savedOutfits.filter((o) => o.id !== id),
        })),

      // Active chat session
      chatSession: null,
      setChatSession: (session) => set({ chatSession: session }),
      chatMessages: [],
      setChatMessages: (msgs) => set({ chatMessages: msgs }),
      addChatMessage: (msg) =>
        set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
      clearChat: () => set({ chatMessages: [], chatSession: null }),

      // Outfit selected for 4-angle studio
      selectedOutfitForStudio: null,
      setSelectedOutfitForStudio: (outfit) => set({ selectedOutfitForStudio: outfit }),

      // Onboarding State: Starts false so user experiences the complete grand setup
      onboardingComplete: false,
      setOnboardingComplete: (val) => set({ onboardingComplete: val }),
    }),
    {
      name: 'styleai-master-storage',
      version: 2,
      storage: createJSONStorage(() => idbStorage),
      migrate: (persistedState) => {
        if (persistedState?.wardrobe) {
          persistedState.wardrobe = persistedState.wardrobe.filter(
            (item) => !item.id?.startsWith('starter-')
          )
        }
        return persistedState
      },
      partialize: (state) => ({
        user: state.user,
        avatarConfig: state.avatarConfig,
        profile: state.profile,
        wardrobe: state.wardrobe,
        savedOutfits: state.savedOutfits,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
)

