import { useState, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { analyzeFaceAndBodyPhoto, analyzeClothingItem } from '../lib/gemini'
import { uploadProfilePhoto, uploadWardrobePhoto } from '../lib/storageUpload'
import { upsertProfile, insertWardrobeItem } from '../lib/supabaseSync'

export default function OnboardingPage() {
  const {
    profile, setProfile,
    wardrobe, addWardrobeItem,
    setOnboardingComplete,
    user,
  } = useAppStore()

  const [step, setStep] = useState(1)
  const [photoPreview, setPhotoPreview] = useState(profile?.userPhotoUrl || '')
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(profile?.bodyAnalysis || null)
  const photoInputRef = useRef(null)
  const [uploadingCloth, setUploadingCloth] = useState(false)
  const [addedClothesCount, setAddedClothesCount] = useState(0)
  const clothInputRef = useRef(null)

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAnalyzingPhoto(true)
    try {
      const imageUrl = await uploadProfilePhoto(user?.uid || 'guest', file)
      setPhotoPreview(imageUrl)
      const analysis = await analyzeFaceAndBodyPhoto(file)
      setAnalysisResult(analysis)
      const profileUpdate = {
        userPhotoUrl: imageUrl,
        bodyAnalysis: analysis,
        faceAnalysis: {
          faceShape: analysis.faceShape || 'oval',
          skinTone: analysis.skinTone || 'açık',
          styleRecommendations: analysis.bestColors || [],
          colorPalette: analysis.bestColors || [],
          summary: analysis.summary || '',
        },
      }
      setProfile(profileUpdate)
      if (user?.uid && !user?.isGuest) {
        await upsertProfile(user.uid, {
          user_photo_url: imageUrl,
          body_analysis: analysis,
          face_analysis: profileUpdate.faceAnalysis,
        }).catch(console.warn)
      }
    } catch (err) {
      console.error('Photo analysis error:', err)
    } finally {
      setAnalyzingPhoto(false)
    }
  }

  const handleClothUpload = async (e) => {
    const rawFiles = e.target.files
    if (!rawFiles || rawFiles.length === 0) return
    const files = Array.from(rawFiles).slice(0, 100)
    setUploadingCloth(true)

    try {
      const concurrency = 2
      for (let i = 0; i < files.length; i += concurrency) {
        const batch = files.slice(i, i + concurrency)
        await Promise.allSettled(
          batch.map(async (file) => {
            const itemId = 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
            const imageUrl = await uploadWardrobePhoto(user?.uid || 'guest', itemId, file)
            let itemAnalysis = {}
            try {
              itemAnalysis = await analyzeClothingItem(file)
            } catch {
              itemAnalysis = {
                name: file.name?.replace(/\.[^/.]+$/, '') || 'Yeni Kıyafet',
                category: 'tops',
                color: 'Özel',
              }
            }
            const newItem = {
              id: itemId,
              ...itemAnalysis,
              imageUrl,
              createdAt: new Date().toISOString(),
            }
            if (user?.uid && !user?.isGuest) {
              await insertWardrobeItem(user.uid, newItem).catch(console.warn)
            }
            addWardrobeItem(newItem)
            setAddedClothesCount((c) => c + 1)
          })
        )
      }
    } catch (err) {
      console.error('Clothing upload error:', err)
    } finally {
      setUploadingCloth(false)
      if (clothInputRef.current) clothInputRef.current.value = ''
    }
  }


  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'var(--bg, #06060a)',
        color: '#fff',
        padding: '28px 20px',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 350,
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124, 58, 237, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        className="fade-in"
        style={{
          width: '100%',
          maxWidth: 440,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, marginTop: 8 }}>
          <div
            style={{
              width: step === 1 ? 28 : 10,
              height: 6,
              borderRadius: 3,
              background: step === 1 ? 'linear-gradient(90deg, #a78bfa, #d9b478)' : 'rgba(255, 255, 255, 0.15)',
              transition: 'all 0.3s ease',
            }}
          />
          <div
            style={{
              width: step === 2 ? 28 : 10,
              height: 6,
              borderRadius: 3,
              background: step === 2 ? 'linear-gradient(90deg, #a78bfa, #d9b478)' : 'rgba(255, 255, 255, 0.15)',
              transition: 'all 0.3s ease',
            }}
          />
        </div>

        {/* ═══════════ STEP 1: USER PHOTO & BODY ANALYSIS ═══════════ */}
        {step === 1 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Title & Subtitle */}
            <div style={{ textAlign: 'center', marginBottom: 26 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: 'var(--accent-violet-light, #c4b5fd)',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                KİŞİSEL STİLİSTİN HAZIR
              </span>
              <h1
                className="font-editorial"
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #fff 30%, #d9b478 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Hoş geldin, Rabiş! ✨
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary, #8b8a97)', marginTop: 8, lineHeight: 1.5, maxWidth: 320 }}>
                Yapay zeka yüz tipini, ten alt tonunu ve vücut silüetini analiz edip sana özel kombinler üretsin.
              </p>
            </div>

            {/* Circular Photo Upload Frame */}
            <div
              onClick={() => !analyzingPhoto && photoInputRef.current?.click()}
              style={{
                width: 200,
                height: 200,
                borderRadius: '50%',
                border: photoPreview ? '2px solid rgba(167, 139, 250, 0.5)' : '2px dashed rgba(167, 139, 250, 0.35)',
                background: photoPreview ? '#000' : 'rgba(255, 255, 255, 0.02)',
                position: 'relative',
                overflow: 'hidden',
                cursor: analyzingPhoto ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 26,
                boxShadow: photoPreview
                  ? '0 12px 40px -10px rgba(124, 58, 237, 0.35)'
                  : '0 8px 30px rgba(0,0,0,0.5)',
                transition: 'all 0.3s ease',
              }}
            >
              {photoPreview ? (
                <>
                  <img
                    src={photoPreview}
                    alt="Rabiş"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: analyzingPhoto
                        ? 'rgba(6, 6, 10, 0.82)'
                        : 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: analyzingPhoto ? 'center' : 'flex-end',
                      padding: 14,
                    }}
                  >
                    {analyzingPhoto ? (
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="spinner" style={{ width: 32, height: 32, marginBottom: 10 }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-violet-light, #c4b5fd)' }}>
                          Tarz Analizi Yapılıyor...
                        </span>
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#fff',
                          background: 'rgba(0,0,0,0.65)',
                          padding: '4px 10px',
                          borderRadius: 12,
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        📸 Değiştir
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'block' }}>
                    Fotoğrafını Seç
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted, #5c5b6b)', marginTop: 4, display: 'block' }}>
                    Yüz veya boydan
                  </span>
                </div>
              )}
            </div>

            {/* Hidden Native File Input */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
            />

            {/* Analysis Results Card */}
            {analysisResult && (
              <div
                className="slide-up"
                style={{
                  width: '100%',
                  background: 'rgba(22, 20, 38, 0.75)',
                  border: '1px solid rgba(167, 139, 250, 0.20)',
                  borderRadius: 22,
                  padding: '18px 20px',
                  marginBottom: 24,
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>✨</span>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--accent-gold, #d9b478)' }}>
                    Rabiş'in Stil Analizi
                  </h4>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {analysisResult.hairColor && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 10,
                        background: 'rgba(167, 139, 250, 0.12)',
                        border: '1px solid rgba(167, 139, 250, 0.25)',
                        color: 'var(--accent-violet-light, #c4b5fd)',
                      }}
                    >
                      💇‍♀️ {analysisResult.hairColor}
                    </span>
                  )}
                  {analysisResult.skinTone && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 10,
                        background: 'rgba(217, 180, 120, 0.12)',
                        border: '1px solid rgba(217, 180, 120, 0.25)',
                        color: 'var(--accent-gold, #d9b478)',
                      }}
                    >
                      ✨ {analysisResult.skinTone}
                    </span>
                  )}
                  {analysisResult.bodyType && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 10,
                        background: 'rgba(52, 211, 153, 0.12)',
                        border: '1px solid rgba(52, 211, 153, 0.25)',
                        color: '#34d399',
                      }}
                    >
                      🧍‍♀️ {analysisResult.bodyType}
                    </span>
                  )}
                </div>

                {analysisResult.bestColors && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted, #5c5b6b)', display: 'block', marginBottom: 6 }}>
                      En Çok Yakışan Renkler:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {analysisResult.bestColors.map((color, cIdx) => (
                        <span
                          key={cIdx}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#fff',
                            padding: '3px 8px',
                            borderRadius: 8,
                            background: 'rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.summary && (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0, fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{analysisResult.summary}"
                  </p>
                )}
              </div>
            )}

            {/* Next Button */}
            <button
              onClick={() => setStep(2)}
              disabled={analyzingPhoto}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: 18,
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #d9b478 100%)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 28px rgba(124, 58, 237, 0.4)',
                transition: 'all 0.25s',
              }}
            >
              {photoPreview ? 'Harika! Dolabıma Geçelim →' : 'Şimdilik Atla ve Dolaba Geç →'}
            </button>
          </div>
        )}

        {/* ═══════════ STEP 2: CLOTHING UPLOAD ═══════════ */}
        {step === 2 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: 'var(--accent-violet-light, #c4b5fd)',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                GARDIROP KURULUMU
              </span>
              <h1
                className="font-editorial"
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #fff 30%, #d9b478 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Rabiş'in Dolabı 👗
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary, #8b8a97)', marginTop: 8, lineHeight: 1.5, maxWidth: 320 }}>
                Kıyafet, ayakkabı veya takılarının fotoğraflarını çekip at. Yapay zeka bu parçalarla kombin yapacak.
              </p>
            </div>

            {/* Upload Area Card */}
            <div
              style={{
                width: '100%',
                borderRadius: 24,
                background: 'rgba(22, 20, 38, 0.70)',
                border: '1px solid rgba(167, 139, 250, 0.15)',
                padding: '24px 20px',
                textAlign: 'center',
                marginBottom: 20,
                backdropFilter: 'blur(16px)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>👗👚👟💍</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>
                Kıyafet Fotoğrafı Yükle
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted, #5c5b6b)', margin: '0 0 16px', lineHeight: 1.4 }}>
                Yapay zeka parçaları tek saniyede tanır
              </p>

              <button
                onClick={() => clothInputRef.current?.click()}
                disabled={uploadingCloth}
                style={{
                  padding: '13px 24px',
                  borderRadius: 16,
                  border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #d9b478 100%)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 6px 20px rgba(124, 58, 237, 0.35)',
                }}
              >
                <span>📸</span>
                <span>📸 Çoklu Fotoğraf Çek / Yükle (100'e kadar)</span>
              </button>

              <input
                ref={clothInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleClothUpload}
                style={{ display: 'none' }}
              />

              {uploadingCloth && (
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                  <span style={{ fontSize: 12, color: 'var(--accent-violet-light, #c4b5fd)', fontWeight: 600 }}>
                    Kıyafet analiz ediliyor...
                  </span>
                </div>
              )}
            </div>

            {/* Wardrobe Grid Display */}
            <div style={{ width: '100%', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-violet-light, #c4b5fd)', letterSpacing: 0.5 }}>
                  EKLENEN PARÇALAR ({wardrobe.length})
                </span>
                {addedClothesCount > 0 && (
                  <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                    +{addedClothesCount} yeni eklendi
                  </span>
                )}
              </div>

              {wardrobe.length === 0 ? (
                <div
                  style={{
                    padding: '24px 16px',
                    borderRadius: 18,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                    color: 'var(--text-muted, #5c5b6b)',
                    fontSize: 12,
                  }}
                >
                  Henüz parça eklemedin. İstersen direkt sohbette de ekleyebilirsin!
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 10,
                    maxHeight: 220,
                    overflowY: 'auto',
                    padding: 2,
                  }}
                >
                  {wardrobe.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.025)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 16,
                        padding: 6,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', marginBottom: 4, background: '#12111e' }}>
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Start Chatting Button */}
            <button
              onClick={async () => {
                if (user?.uid && !user?.isGuest) {
                  await upsertProfile(user.uid, { onboarding_complete: true }).catch(console.warn)
                }
                setOnboardingComplete(true)
              }}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: 18,
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #d9b478 100%)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 28px rgba(124, 58, 237, 0.4)',
                transition: 'all 0.25s',
              }}
            >
              🚀 Stilistimle Konuşmaya Başla →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
