import { useState, useEffect, useRef } from 'react'
import { consultPersonalStylist, analyzeFaceAndBodyPhoto, analyzeClothingItem, fileToBase64 } from '../lib/gemini'
import { useAppStore } from '../store/useAppStore'
import { useWardrobe } from '../hooks/useWardrobe'
import { useWeather } from '../hooks/useWeather'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

const QUICK_PROMPTS = [
  { emoji: '🌸', text: 'Ankara\'dayım, bugün renkli, cıvıl cıvıl, tatlı, minnoş bir kombin istiyorum' },
  { emoji: '☕', text: 'Hafta sonu kahve buluşması için rahat ve sevimli bir tarz' },
  { emoji: '💼', text: 'Ankara ayazına uygun şık bir günlük ofis kombini' },
  { emoji: '🖤', text: 'Akşam yemeği için havalı, modern ve şık bir görünüm' },
  { emoji: '👟', text: 'Sneaker odaklı rahat bir sokak stili' },
]

/* ═══════════════════════════════════════════════════════
   OUTFIT CARD — Premium Glass Bubble
   ═══════════════════════════════════════════════════════ */
function OutfitCardBubble({ outfitData, onAskAlternative, onSaveOutfit, isSaved }) {
  const { outfit, outfitTitle, stylingNotes, detectedCity } = outfitData
  if (!outfit) return null

  const items = [
    { label: 'ÜST', item: outfit.top, icon: '👚' },
    { label: 'DIŞ GİYİM', item: outfit.outerwear, icon: '🧥' },
    { label: 'ALT', item: outfit.bottom, icon: '👖' },
    { label: 'AYAKKABI', item: outfit.shoes, icon: '👟' },
    { label: 'AKSESUAR', item: outfit.accessory, icon: '💍' },
  ].filter((p) => p.item)

  return (
    <div
      className="slide-up"
      style={{
        marginTop: 14,
        borderRadius: 28,
        background: 'linear-gradient(160deg, rgba(22, 20, 38, 0.96) 0%, rgba(10, 9, 16, 0.98) 100%)',
        border: '1px solid rgba(167, 139, 250, 0.20)',
        padding: '22px 20px',
        boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.8), inset 0 0.5px 0 rgba(255, 255, 255, 0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 120, height: 120,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, color: 'var(--accent-violet-light)', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 1.5,
              fontFamily: 'var(--font-sans)',
            }}>
              ✨ Rabiş'in Kombini
            </span>
            {detectedCity && (
              <span style={{
                fontSize: 9, padding: '3px 10px', borderRadius: 20,
                background: 'rgba(167, 139, 250, 0.12)', border: '1px solid rgba(167, 139, 250, 0.25)',
                color: 'var(--accent-violet-light)', fontWeight: 600,
              }}>
                📍 {detectedCity}
              </span>
            )}
          </div>
          <h3 className="font-editorial" style={{
            fontSize: 20, fontWeight: 700, margin: 0,
            background: 'linear-gradient(135deg, #fff 30%, #d9b478 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {outfitTitle || 'Özel Kombin'}
          </h3>
        </div>

        <button
          onClick={() => onSaveOutfit(outfitData)}
          style={{
            padding: '8px 16px',
            borderRadius: 14,
            background: isSaved ? 'rgba(251, 113, 133, 0.12)' : 'rgba(255, 255, 255, 0.04)',
            border: isSaved ? '1px solid rgba(251, 113, 133, 0.30)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: isSaved ? '#fb7185' : 'var(--text-secondary)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.25s',
          }}
        >
          <span style={{ fontSize: 14 }}>{isSaved ? '❤️' : '🤍'}</span>
          <span>{isSaved ? 'Kaydedildi' : 'Kaydet'}</span>
        </button>
      </div>

      {/* Outfit Items Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: items.length <= 3 ? `repeat(${items.length}, 1fr)` : 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 18,
      }}>
        {items.map(({ label, item, icon }, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 20,
              padding: 10,
              textAlign: 'center',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: '100%', aspectRatio: '1', borderRadius: 16,
              overflow: 'hidden', marginBottom: 10,
              background: 'linear-gradient(135deg, #0a0a12 0%, #12111e 100%)',
              boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.5)',
            }}>
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 12 }}>{icon}</span>
              <span style={{
                fontSize: 9, color: 'var(--accent-violet-light)', fontWeight: 700,
                letterSpacing: 1, textTransform: 'uppercase',
              }}>
                {label}
              </span>
            </div>

            <p style={{
              fontSize: 12, fontWeight: 700, color: '#fff',
              margin: '2px 0 0', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.name}
            </p>

            {item.color && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                {item.color}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Styling Tips */}
      {stylingNotes && stylingNotes.length > 0 && (
        <div style={{
          background: 'rgba(167, 139, 250, 0.06)',
          border: '1px solid rgba(167, 139, 250, 0.15)',
          borderRadius: 18,
          padding: '14px 16px',
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>💡</span>
            <span style={{
              fontSize: 11, fontWeight: 800, color: 'var(--accent-violet-light)',
              textTransform: 'uppercase', letterSpacing: 0.8,
            }}>
              Stil Tüyoları
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.7 }}>
            {stylingNotes.map((note, nIdx) => (
              <li key={nIdx} style={{ marginBottom: 4 }}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternative Button */}
      <button
        onClick={() => onAskAlternative(outfitTitle)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: 'var(--accent-gold)',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.25s',
        }}
      >
        <span>🔄</span>
        <span>Farklı Parçalarla Yeni Kombin</span>
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   CHAT BUBBLE — Premium Message
   ═══════════════════════════════════════════════════════ */
function ChatBubble({ message, onAskAlternative, onSaveOutfit, savedOutfitTitles }) {
  const isUser = message.role === 'user'

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 20,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 40, height: 40, borderRadius: 14,
            background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #d9b478 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0, marginRight: 12, alignSelf: 'flex-start',
            boxShadow: '0 6px 20px rgba(124, 58, 237, 0.35)',
          }}
        >
          ✨
        </div>
      )}

      <div style={{ maxWidth: '85%' }}>
        <div
          style={{
            padding: '16px 20px',
            borderRadius: isUser ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
            background: isUser
              ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
              : 'rgba(18, 17, 28, 0.92)',
            border: isUser
              ? '1px solid rgba(167, 139, 250, 0.30)'
              : '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(20px)',
            fontSize: 14,
            lineHeight: 1.7,
            color: '#fff',
            whiteSpace: 'pre-wrap',
            boxShadow: isUser
              ? '0 8px 28px -4px rgba(124, 58, 237, 0.35)'
              : '0 8px 28px -6px rgba(0, 0, 0, 0.5)',
            fontWeight: isUser ? 500 : 400,
            letterSpacing: isUser ? '0.1px' : '0',
          }}
        >
          {message.text}
        </div>

        {message.outfitData && (
          <OutfitCardBubble
            outfitData={message.outfitData}
            onAskAlternative={onAskAlternative}
            onSaveOutfit={onSaveOutfit}
            isSaved={savedOutfitTitles?.includes(message.outfitData.outfitTitle)}
          />
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN CHAT PAGE
   ═══════════════════════════════════════════════════════ */
export default function ChatPage() {
  const { wardrobe, addClothingItem, deleteClothingItem } = useWardrobe()
  const { weather } = useWeather()
  const {
    chatMessages, addChatMessage, clearChat,
    profile, setProfile,
    savedOutfits, addSavedOutfit,
  } = useAppStore()

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [showWardrobeDrawer, setShowWardrobeDrawer] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const messagesEndRef = useRef(null)
  const photoInputRef = useRef(null)
  const userPhotoInputRef = useRef(null)
  const drawerPhotoInputRef = useRef(null)

  const {
    isListening,
    isTranscribing,
    toggleListening,
    error: speechError,
    isSupported: isSpeechSupported,
  } = useSpeechRecognition({
    lang: 'tr-TR',
    onTranscript: (liveText) => {
      if (liveText) {
        setInput(liveText)
      }
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, loading, photoUploading])

  const sendMessage = async (text) => {
    if (!text?.trim() || loading) return
    const queryText = text.trim()
    setInput('')

    addChatMessage({ role: 'user', text: queryText })
    setLoading(true)

    try {
      const recentHistory = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }))
      const response = await consultPersonalStylist(queryText, wardrobe, weather, profile, recentHistory)
      addChatMessage({
        role: 'model',
        text: response.stylistMessage,
        outfitData: response.outfit ? response : null,
      })
    } catch (err) {
      console.error('Stylist error:', err)
      addChatMessage({
        role: 'model',
        text: 'Bağlantıda ufak bir aksaklık oldu, tekrar dener misin?',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAskAlternative = (currentTitle) => {
    sendMessage(`"${currentTitle}" kombinini çok beğendim ama dolabımdaki diğer alternatif parçalarla farklı bir versiyonunu daha çıkarır mısın?`)
  }

  const handleSaveOutfit = (outfitData) => {
    if (savedOutfits?.some((o) => o.outfitTitle === outfitData.outfitTitle)) return
    addSavedOutfit({
      id: 'saved-' + Date.now(),
      ...outfitData,
      createdAt: new Date().toISOString(),
    })
  }

  const handleClothingPhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoUploading(true)
    addChatMessage({
      role: 'user',
      text: '📸 Yeni bir kıyafetimin fotoğrafını çektim!',
    })

    try {
      const newItem = await addClothingItem(file)
      addChatMessage({
        role: 'model',
        text: `Harika bir parça! "${newItem?.name || 'Yeni parça'}" dolabına eklendi 🛍️\nKategori: ${newItem?.category || 'Kıyafet'} • Renk: ${newItem?.color || 'Özel'}\n\nŞimdi bu yeni parçanla sana bir kombin yapmamı ister misin?`,
      })
    } catch (err) {
      console.error('Upload error:', err)
      addChatMessage({
        role: 'model',
        text: 'Fotoğrafı analiz ederken bir sorun oluştu, lütfen tekrar dener misin?',
      })
    } finally {
      setPhotoUploading(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
      if (drawerPhotoInputRef.current) drawerPhotoInputRef.current.value = ''
    }
  }

  const handleUserPhotoUpdate = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoUploading(true)
    try {
      const b64 = await fileToBase64(file)
      const dataUrl = `data:${file.type || 'image/jpeg'};base64,${b64}`
      const analysis = await analyzeFaceAndBodyPhoto(file)

      setProfile({
        userPhotoUrl: dataUrl,
        bodyAnalysis: analysis,
        faceAnalysis: {
          faceShape: analysis.faceShape || 'oval',
          skinTone: analysis.skinTone || 'açık',
          styleRecommendations: analysis.bestColors || [],
          colorPalette: analysis.bestColors || [],
          summary: analysis.summary || '',
        },
      })
      setShowProfileModal(false)
      addChatMessage({
        role: 'model',
        text: `Yeni fotoğrafını inceledim! 🌟\n${analysis.summary || 'Yeni tarzın ve silüetin harika görünüyor! Artık tüm kombinlerini buna göre uyarlayacağım.'}`,
      })
    } catch (err) {
      console.error('User photo update error:', err)
    } finally {
      setPhotoUploading(false)
    }
  }

  const analysis = profile?.bodyAnalysis
  const savedOutfitTitles = savedOutfits?.map((o) => o.outfitTitle) || []

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'var(--safe-top)',
        overflow: 'hidden',
        background: 'var(--bg)',
        position: 'relative',
      }}
    >
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 300,
        background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124, 58, 237, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ═══════ TOP HEADER ═══════ */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(6, 6, 10, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          zIndex: 10,
          position: 'relative',
        }}
      >
        {/* Profile Pill */}
        <div
          onClick={() => setShowProfileModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            padding: '5px 14px 5px 5px',
            borderRadius: 24,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(167, 139, 250, 0.15)',
            transition: 'all 0.25s',
          }}
        >
          <div
            style={{
              width: 40, height: 40, borderRadius: '50%',
              overflow: 'hidden', background: '#12111e',
              border: '2px solid rgba(167, 139, 250, 0.40)',
              flexShrink: 0,
            }}
          >
            {profile?.userPhotoUrl ? (
              <img src={profile.userPhotoUrl} alt="Rabiş" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--accent-violet-light)' }}>
                R
              </div>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="font-editorial" style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                Rabiş
              </span>
              <span style={{ fontSize: 10, color: 'var(--accent-violet-light)', opacity: 0.6 }}>›</span>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
              {analysis?.stylePersona || 'Kişisel profil'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowWardrobeDrawer(true)}
            style={{
              padding: '9px 16px',
              borderRadius: 14,
              background: 'rgba(167, 139, 250, 0.08)',
              border: '1px solid rgba(167, 139, 250, 0.20)',
              color: 'var(--accent-violet-light)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
              letterSpacing: '0.2px',
            }}
          >
            <span>👗</span>
            <span>Dolabım</span>
            <span style={{
              background: 'rgba(167, 139, 250, 0.20)',
              padding: '2px 7px', borderRadius: 8,
              fontSize: 10, fontWeight: 800, color: 'var(--accent-violet-light)',
            }}>
              {wardrobe.length}
            </span>
          </button>

          {chatMessages.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                padding: '9px 12px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: 'var(--text-muted)',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ═══════ MESSAGES FEED ═══════ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 10px', position: 'relative', zIndex: 1 }}>
        {chatMessages.length === 0 ? (
          <div className="fade-in">
            {/* Welcome Hero */}
            <div
              style={{
                textAlign: 'center',
                padding: '36px 22px 28px',
                borderRadius: 28,
                background: 'linear-gradient(160deg, rgba(22, 20, 38, 0.6) 0%, rgba(14, 13, 22, 0.4) 100%)',
                border: '1px solid rgba(167, 139, 250, 0.10)',
                marginBottom: 24,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative gradient orbs */}
              <div style={{
                position: 'absolute', top: -30, left: -30, width: 100, height: 100,
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.10) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', bottom: -20, right: -20, width: 80, height: 80,
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(217, 180, 120, 0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div className="float" style={{ fontSize: 48, marginBottom: 16, position: 'relative' }}>
                ✨
              </div>

              <h2 className="font-editorial" style={{
                fontSize: 24, fontWeight: 700, margin: 0, position: 'relative',
                background: 'linear-gradient(135deg, #fff 20%, #d9b478 80%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Merhaba Rabiş!
              </h2>
              <p style={{
                fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)',
                margin: '10px auto 0', maxWidth: 300, lineHeight: 1.6,
                position: 'relative',
              }}>
                Ben senin kişisel AI stilistinim.
                <br />
                <span style={{ color: 'var(--accent-violet-light)', fontWeight: 600 }}>
                  Bana ne istediğini anlat veya mikrofona konuş
                </span>
                , dolabından en güzel kombini seçeyim!
              </p>
            </div>

            {/* Quick Prompts */}
            <div style={{ marginBottom: 20 }}>
              <p style={{
                fontSize: 10, fontWeight: 700, color: 'var(--accent-violet-light)',
                marginBottom: 10, letterSpacing: 1.5, textTransform: 'uppercase',
              }}>
                Hızlı Başla
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(`${prompt.emoji} ${prompt.text}`)}
                    style={{
                      textAlign: 'left',
                      padding: '14px 18px',
                      borderRadius: 18,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                  >
                    <span>{prompt.emoji} {prompt.text}</span>
                    <span style={{ color: 'var(--accent-gold)', fontSize: 14, opacity: 0.5 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {chatMessages.map((msg, i) => (
              <ChatBubble
                key={i}
                message={msg}
                onAskAlternative={handleAskAlternative}
                onSaveOutfit={handleSaveOutfit}
                savedOutfitTitles={savedOutfitTitles}
              />
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 14,
                background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #d9b478 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                boxShadow: '0 6px 20px rgba(124, 58, 237, 0.3)',
              }}
            >
              ✨
            </div>
            <div
              className="shimmer"
              style={{
                padding: '14px 20px', borderRadius: '22px 22px 22px 6px',
                background: 'rgba(18, 17, 28, 0.90)', border: '1px solid rgba(167, 139, 250, 0.10)',
                color: 'var(--accent-violet-light)', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <div className="spinner" style={{ width: 16, height: 16 }} />
              Stilistin düşünüyor...
            </div>
          </div>
        )}

        {photoUploading && (
          <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 14,
                background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #d9b478 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}
            >
              📸
            </div>
            <div
              className="shimmer"
              style={{
                padding: '14px 20px', borderRadius: '22px 22px 22px 6px',
                background: 'rgba(18, 17, 28, 0.90)', border: '1px solid rgba(167, 139, 250, 0.10)',
                color: 'var(--accent-gold)', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <div className="spinner" style={{ width: 16, height: 16 }} />
              Kıyafet analiz ediliyor...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ═══════ VOICE ERROR BANNER ═══════ */}
      {speechError && (
        <div
          className="fade-in"
          style={{
            margin: '0 18px 8px',
            padding: '10px 16px',
            borderRadius: 16,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠️ {speechError}</span>
        </div>
      )}

      {/* ═══════ VOICE LISTENING BANNER ═══════ */}
      {isListening && (
        <div
          className="slide-up"
          style={{
            margin: '0 18px 10px',
            padding: '12px 18px',
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(251, 113, 133, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%)',
            border: '1px solid rgba(251, 113, 133, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="glow-pulse" style={{
              width: 10, height: 10, borderRadius: '50%',
              background: '#fb7185',
            }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fb7185' }}>
              Seni dinliyorum, Rabiş...
            </span>
          </div>
          <button
            onClick={toggleListening}
            style={{
              padding: '6px 14px', borderRadius: 10,
              background: 'rgba(251, 113, 133, 0.20)',
              color: '#fb7185', border: '1px solid rgba(251, 113, 133, 0.30)',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Bitir
          </button>
        </div>
      )}

      {/* ═══════ TRANSCRIBING BANNER ═══════ */}
      {isTranscribing && (
        <div
          className="fade-in"
          style={{
            margin: '0 18px 10px',
            padding: '12px 18px',
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(217, 180, 120, 0.15) 100%)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div className="spinner" style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-violet-light)' }}>
            ✨ Yapay zeka sesini yazıya döküyor...
          </span>
        </div>
      )}

      {/* ═══════ INPUT BAR ═══════ */}
      <div
        style={{
          padding: '12px 16px calc(14px + var(--safe-bottom))',
          background: 'rgba(6, 6, 10, 0.80)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Mic Button */}
          <button
            type="button"
            title={isListening ? 'Dinlemeyi Durdur' : 'Mikrofonla Konuş'}
            onClick={toggleListening}
            disabled={loading || photoUploading}
            className={isListening ? 'glow-pulse' : ''}
            style={{
              width: 46, height: 46, borderRadius: 16,
              background: isListening
                ? 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)'
                : 'rgba(167, 139, 250, 0.10)',
              border: isListening
                ? '1.5px solid rgba(251, 113, 133, 0.5)'
                : '1px solid rgba(167, 139, 250, 0.25)',
              color: isListening ? '#fff' : 'var(--accent-violet-light)',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.25s',
            }}
          >
            🎙️
          </button>

          {/* Camera Button */}
          <button
            type="button"
            title="Kıyafet Fotoğrafı Çek"
            onClick={() => photoInputRef.current?.click()}
            disabled={photoUploading || loading}
            style={{
              width: 46, height: 46, borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            📸
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleClothingPhotoUpload}
            style={{ display: 'none' }}
          />

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder={isListening ? 'Dinleniyor...' : 'Nasıl bir kombin istiyorsun?'}
            disabled={loading || photoUploading}
            style={{
              flex: 1,
              borderRadius: 18,
              background: 'rgba(14, 13, 22, 0.80)',
              border: isListening
                ? '1.5px solid rgba(251, 113, 133, 0.30)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              padding: '13px 18px',
              fontSize: 14,
              color: '#fff',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              fontWeight: 400,
              transition: 'all 0.25s',
            }}
          />

          {/* Send Button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || photoUploading}
            style={{
              width: 46, height: 46, borderRadius: 16,
              padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0, border: 'none', cursor: 'pointer',
              background: input.trim()
                ? 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #d9b478 100%)'
                : 'rgba(255, 255, 255, 0.04)',
              color: input.trim() ? '#fff' : 'var(--text-muted)',
              boxShadow: input.trim() ? '0 6px 24px rgba(124, 58, 237, 0.35)' : 'none',
              transition: 'all 0.25s',
            }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* ═══════ WARDROBE DRAWER ═══════ */}
      {showWardrobeDrawer && (
        <div
          className="fade-in"
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 150,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowWardrobeDrawer(false)}
        >
          <div
            className="slide-up"
            style={{
              width: '100%', maxWidth: 500, maxHeight: '82vh',
              background: 'rgba(12, 11, 20, 0.98)',
              borderTop: '1px solid rgba(167, 139, 250, 0.15)',
              borderRadius: '32px 32px 0 0',
              padding: '22px 20px 36px',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 -24px 60px rgba(0,0,0,0.8)',
            }}
          >
            {/* Drawer Handle */}
            <div style={{
              width: 36, height: 4, background: 'rgba(167, 139, 250, 0.25)',
              borderRadius: 2, margin: '0 auto 18px',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 className="font-editorial" style={{
                  fontSize: 20, fontWeight: 700, margin: 0,
                  background: 'linear-gradient(135deg, #fff 30%, #d9b478 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Rabiş'in Dolabı
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0', fontWeight: 500 }}>
                  {wardrobe.length} parça • Yapay zeka bu parçalardan kombin yapar
                </p>
              </div>

              <button
                onClick={() => drawerPhotoInputRef.current?.click()}
                disabled={photoUploading}
                style={{
                  padding: '10px 18px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #d9b478 100%)',
                  color: '#fff', border: 'none',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 6px 20px rgba(124, 58, 237, 0.3)',
                }}
              >
                <span>+</span>
                <span>Parça Ekle</span>
              </button>
              <input
                ref={drawerPhotoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleClothingPhotoUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* Wardrobe Grid */}
            <div style={{
              flex: 1, overflowY: 'auto',
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12, padding: 4,
            }}>
              {wardrobe.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px',
                  color: 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>👗</div>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                    Dolabın henüz boş
                  </p>
                  <p style={{ fontSize: 12 }}>
                    + Parça Ekle butonuna dokunarak kıyafetlerinin fotoğrafını çek
                  </p>
                </div>
              ) : (
                wardrobe.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 20,
                      padding: 8,
                      textAlign: 'center',
                      position: 'relative',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: '100%', aspectRatio: '1', borderRadius: 14,
                      overflow: 'hidden', marginBottom: 8,
                      background: 'linear-gradient(135deg, #0a0a12, #12111e)',
                    }}>
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    {/* Category badge */}
                    <span style={{
                      position: 'absolute', top: 6, right: 6,
                      fontSize: 8, fontWeight: 700, padding: '3px 7px',
                      borderRadius: 8, background: 'rgba(167, 139, 250, 0.20)',
                      color: 'var(--accent-violet-light)', letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}>
                      {item.category}
                    </span>

                    <p style={{
                      fontSize: 11, fontWeight: 700, color: '#fff',
                      margin: '0 0 2px', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.name}
                    </p>
                    {item.color && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {item.color}
                      </span>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => deleteClothingItem(item.id)}
                      style={{
                        position: 'absolute', top: 6, left: 6,
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowWardrobeDrawer(false)}
              style={{
                marginTop: 16, width: '100%', padding: 14,
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: 'var(--text-secondary)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* ═══════ PROFILE MODAL ═══════ */}
      {showProfileModal && (
        <div
          className="fade-in"
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 180,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={(e) => e.target === e.currentTarget && setShowProfileModal(false)}
        >
          <div
            className="slide-up"
            style={{
              width: '100%', maxWidth: 420,
              background: 'rgba(14, 13, 22, 0.98)',
              border: '1px solid rgba(167, 139, 250, 0.20)',
              borderRadius: 28,
              padding: 26,
              boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative glow */}
            <div style={{
              position: 'absolute', top: -40, right: -40, width: 120, height: 120,
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.10) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative' }}>
              <div
                style={{
                  width: 100, height: 100, borderRadius: '50%',
                  overflow: 'hidden', margin: '0 auto 14px',
                  border: '3px solid rgba(167, 139, 250, 0.35)',
                  background: '#12111e',
                  boxShadow: '0 8px 32px rgba(124, 58, 237, 0.2)',
                }}
              >
                {profile?.userPhotoUrl ? (
                  <img src={profile.userPhotoUrl} alt="Rabiş" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'var(--accent-violet-light)' }}>
                    R
                  </div>
                )}
              </div>
              <h3 className="font-editorial" style={{
                fontSize: 22, fontWeight: 700, margin: 0,
                background: 'linear-gradient(135deg, #fff 30%, #d9b478 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Rabiş
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                {analysis?.stylePersona || 'Kişisel stil profili'}
              </p>
            </div>

            {analysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, fontSize: 13 }}>
                {[
                  { label: 'Saç', value: `${analysis.hairColor || '—'} • ${analysis.hairStyle || '—'}`, icon: '💇‍♀️' },
                  { label: 'Ten Tonu', value: `${analysis.skinTone || '—'} (${analysis.skinUndertone || '—'})`, icon: '✨' },
                  { label: 'Vücut', value: analysis.bodyType || '—', icon: '🧍‍♀️' },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.025)',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{row.icon}</span> {row.label}
                    </span>
                    <span style={{ fontWeight: 700, color: '#fff', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.value}
                    </span>
                  </div>
                ))}

                {/* Best Colors */}
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(167, 139, 250, 0.06)',
                  borderRadius: 14,
                  border: '1px solid rgba(167, 139, 250, 0.12)',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--accent-violet-light)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                    🎨 En İyi Renklerin
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {analysis.bestColors?.map((color, ci) => (
                      <span key={ci} style={{
                        fontSize: 11, fontWeight: 600, color: '#fff',
                        padding: '4px 10px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                        {color}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                {analysis.summary && (
                  <p style={{
                    fontSize: 12, color: 'rgba(255,255,255,0.7)',
                    margin: '4px 0 0', fontStyle: 'italic', lineHeight: 1.6,
                    textAlign: 'center', padding: '0 8px',
                  }}>
                    "{analysis.summary}"
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => userPhotoInputRef.current?.click()}
              disabled={photoUploading}
              style={{
                width: '100%', padding: 14, borderRadius: 16,
                border: 'none', cursor: 'pointer', marginBottom: 10,
                background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #d9b478 100%)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                boxShadow: '0 8px 28px rgba(124, 58, 237, 0.3)',
              }}
            >
              📸 Yeni Fotoğraf Çek / Yükle
            </button>
            <input
              ref={userPhotoInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleUserPhotoUpdate}
              style={{ display: 'none' }}
            />

            <button
              onClick={() => setShowProfileModal(false)}
              style={{
                width: '100%', padding: 12, borderRadius: 16,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-muted)', fontSize: 12,
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
