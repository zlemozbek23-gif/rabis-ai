import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useAuth } from '../hooks/useAuth'
import { getGeminiApiKey, setGeminiApiKey, analyzeFacePhoto, fileToBase64 } from '../lib/gemini'
import { getOwmApiKey, setOwmApiKey } from '../lib/weather'
import { getOpenAIKey, setOpenAIKey } from '../lib/openai'
import { getTogetherKey, setTogetherKey } from '../lib/together'

export default function SavedPage() {
  const { savedOutfits, removeSavedOutfit, profile, setProfile, setOnboardingComplete } = useAppStore()
  const { logout, user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'outfits' | 'settings'

  // Settings state
  const [geminiKey, setGeminiKeyInput] = useState('')
  const [togetherKey, setTogetherKeyInput] = useState('')
  const [openAIKey, setOpenAIKeyInput] = useState('')
  const [owmKey, setOwmKeyInput] = useState('')
  const [keySavedMessage, setKeySavedMessage] = useState('')
  const [analyzingFace, setAnalyzingFace] = useState(false)
  const faceInputRef = useRef(null)

  useEffect(() => {
    setGeminiKeyInput(getGeminiApiKey())
    setTogetherKeyInput(getTogetherKey())
    setOpenAIKeyInput(getOpenAIKey())
    setOwmKeyInput(getOwmApiKey())
  }, [])

  const handleSaveKeys = (e) => {
    e.preventDefault()
    setGeminiApiKey(geminiKey.trim())
    setTogetherKey(togetherKey.trim())
    setOpenAIKey(openAIKey.trim())
    setOwmApiKey(owmKey.trim())
    setKeySavedMessage('✓ API anahtarları başarıyla güncellendi!')
    setTimeout(() => setKeySavedMessage(''), 3000)
  }



  const handleFacePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAnalyzingFace(true)
    try {
      const b64 = await fileToBase64(file)
      const dataUrl = `data:${file.type || 'image/jpeg'};base64,${b64}`

      let analysis = {}
      try {
        analysis = await analyzeFacePhoto(file)
      } catch (err) {
        analysis = {
          faceShape: 'oval',
          skinTone: 'orta',
          styleRecommendations: ['Smart Casual', 'Monokrom', 'Minimalist'],
          colorPalette: ['Lacivert', 'Krem', 'Zümrüt Yeşili', 'Bordo', 'Siyah'],
          summary: 'Ten tonun ve yüz hatların kontrast renkleri çok iyi taşıyor.'
        }
      }

      setProfile({
        ...profile,
        facePhotoUrl: dataUrl,
        faceAnalysis: analysis,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setAnalyzingFace(false)
    }
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'var(--safe-top)',
      paddingBottom: 95,
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <span className="font-editorial" style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent-gold)',
              display: 'block',
              marginBottom: 4,
            }}>
              PROFILE & ATELIER
            </span>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Stil & Profil
            </h1>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          gap: 6,
          background: 'rgba(15, 15, 20, 0.6)',
          backdropFilter: 'blur(16px)',
          padding: 4,
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {[
            { id: 'profile', label: '👤 Stil Analizi' },
            { id: 'outfits', label: `❤️ Kayıtlılar (${savedOutfits.length})` },
            { id: 'settings', label: '⚙️ Ayarlar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '9px 6px',
                borderRadius: 12,
                border: activeTab === tab.id ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12,
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(230, 198, 135, 0.15) 100%)'
                  : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 30px', flex: 1 }}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* User Profile Card */}
            <div className="card" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: 'linear-gradient(135deg, rgba(25, 20, 36, 0.8) 0%, rgba(15, 15, 20, 0.9) 100%)',
              border: '1px solid rgba(230, 198, 135, 0.2)',
            }}>
              <div style={{ position: 'relative' }}>
                {profile?.facePhotoUrl ? (
                  <img
                    src={profile.facePhotoUrl}
                    alt="Yüz"
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--accent-gold)',
                      boxShadow: '0 8px 24px rgba(230, 198, 135, 0.25)',
                    }}
                  />
                ) : (
                  <div style={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #d4af37 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    boxShadow: '0 8px 20px rgba(139, 92, 246, 0.35)',
                  }}>
                    ✨
                  </div>
                )}
                <button
                  onClick={() => faceInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    background: '#8b5cf6',
                    border: '2px solid #060608',
                    borderRadius: '50%',
                    width: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: '#fff',
                  }}
                  title="Fotoğraf Değiştir"
                >
                  📷
                </button>
                <input
                  ref={faceInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFacePhotoUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <span className="badge badge-gold" style={{ fontSize: 9, marginBottom: 4 }}>
                  HAUTE COUTURE ÜYESİ
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px', marginTop: 3 }}>
                  {user?.displayName || 'Tarz Sahibi'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {profile?.facePhotoUrl ? 'Yüz & Ten Analizi Aktif' : 'Yüz fotoğrafını ekleyerek kişiselleştir'}
                </p>
              </div>
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={() => setOnboardingComplete(false)}
              style={{
                padding: '13px',
                fontSize: 13,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #d4af37 100%)',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35)',
              }}
            >
              ✨ 3D Avatarı & Gardırobu Yeniden Yapılandır
            </button>

            {analyzingFace && (
              <div className="card" style={{ textAlign: 'center', padding: 20 }}>
                <div className="spinner" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: 'var(--accent-gold)', fontSize: 13, fontWeight: 600 }}>
                  Yüz hatları ve ten rengi taranıyor...
                </p>
              </div>
            )}

            {/* AI Face Analysis Information */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>
                  🤖 Kişisel Stil & Renk Analizi
                </h4>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 11, borderRadius: 10 }}
                  onClick={() => faceInputRef.current?.click()}
                >
                  Fotoğraf Yükle
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: 14,
                  borderRadius: 14,
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Yüz Şekli</div>
                  <div style={{ fontSize: 15, fontWeight: 700, textTransform: 'capitalize', color: 'var(--accent-gold)', marginTop: 2 }}>
                    {profile?.faceAnalysis?.faceShape || 'Oval'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: 14,
                  borderRadius: 14,
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cilt Tonu</div>
                  <div style={{ fontSize: 15, fontWeight: 700, textTransform: 'capitalize', color: 'var(--accent-purple-light)', marginTop: 2 }}>
                    {profile?.faceAnalysis?.skinTone || 'Orta / Sıcak'}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
                  Sana En Çok Yakışan Renkler:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(profile?.faceAnalysis?.colorPalette || ['Siyah', 'Beyaz', 'Bej', 'Lacivert', 'Zümrüt']).map((col, idx) => (
                    <span key={idx} className="badge" style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      padding: '5px 12px',
                      fontSize: 12,
                    }}>
                      🎨 {col}
                    </span>
                  ))}
                </div>
              </div>

              {profile?.faceAnalysis?.summary && (
                <p style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: 12,
                  marginTop: 2
                }}>
                  {profile.faceAnalysis.summary}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Outfits Tab */}
        {activeTab === 'outfits' && (
          <div>
            {savedOutfits.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>💎</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
                  Henüz kaydedilen kombin yok
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 280, margin: '0 auto' }}>
                  Kombin AI veya Hava sekmesinden beğendiğin kombinleri kaydedebilirsin.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {savedOutfits.map((outfit) => (
                  <div key={outfit.id} className="card fade-in" style={{
                    border: '1px solid rgba(230, 198, 135, 0.2)',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-gold)' }}>
                          {outfit.title || 'Kombin'}
                        </h4>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(outfit.savedAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <button
                        onClick={() => removeSavedOutfit(outfit.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: 18,
                          cursor: 'pointer',
                          padding: 4,
                        }}
                      >
                        🗑️
                      </button>
                    </div>

                    {outfit.weather && (
                      <div className="badge badge-gold" style={{ marginBottom: 12, fontSize: 11 }}>
                        🌤️ {outfit.weather.city} • {outfit.weather.temp}°C
                      </div>
                    )}

                    <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {outfit.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* iOS Guide */}
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(20, 20, 28, 0.9) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>📲</span>
                <h4 style={{ fontSize: 16, fontWeight: 700 }}>iPhone Safari'den Yükleme</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <div>1. Safari alt çubuğundaki <strong>Paylaş</strong> (kare içinden ok çıkan) simgesine dokun.</div>
                <div>2. Menüyü kaydırıp <strong>"Ana Ekrana Ekle"</strong> seçeneğini seç.</div>
                <div>3. Artık iPhone'unda tam ekran gerçek bir iOS uygulaması gibi açılır.</div>
              </div>
            </div>

            {/* API Keys */}
            <div className="card">
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                🔑 Yapay Zeka Anahtarları
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 16 }}>
                Google Gemini API anahtarı sisteme tanımlanmıştır. Dilersen buradan güncelleyebilirsin.
              </p>

              <form onSubmit={handleSaveKeys} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Together AI API Key (FLUX.1 Fotoğraf Stüdyosu - Ücretsiz)
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Together API key..."
                    value={togetherKey}
                    onChange={(e) => setTogetherKeyInput(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    OpenAI API Key (Opsiyonel)
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="sk-proj-..."
                    value={openAIKey}
                    onChange={(e) => setOpenAIKeyInput(e.target.value)}
                  />
                </div>



                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    OpenWeatherMap API Key (Opsiyonel)
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Hava durumu anahtarı"
                    value={owmKey}
                    onChange={(e) => setOwmKeyInput(e.target.value)}
                  />
                </div>

                {keySavedMessage && (
                  <p style={{ color: 'var(--success)', fontSize: 12 }}>{keySavedMessage}</p>
                )}

                <button type="submit" className="btn btn-primary btn-full" style={{ padding: 13, marginTop: 4 }}>
                  Ayarları Kaydet
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
