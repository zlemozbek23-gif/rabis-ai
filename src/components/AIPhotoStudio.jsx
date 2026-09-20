import { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { generateHFFashionPhoto, getHFKey } from '../lib/huggingface'
import { generateFashionPhoto, getOpenAIKey } from '../lib/openai'
import { generateFreeFashionPhoto } from '../lib/pollinations'

const VIEWS = [
  { key: 'front', label: 'Önden Görünüm', icon: '👤', angle: 'Önden' },
  { key: 'back',  label: 'Arkadan Görünüm', icon: '🔄', angle: 'Arkadan' },
]


function PhotoCard({ view, label, icon, angle, imageUrl, status, error, onEnlarge, onRetry }) {
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setImgFailed(false)
  }, [imageUrl])

  return (
    <div
      onClick={() => imageUrl && !imgFailed && onEnlarge(imageUrl, label)}
      style={{
        position: 'relative',
        borderRadius: 22,
        overflow: 'hidden',
        background: 'rgba(16, 16, 26, 0.95)',
        border: imageUrl && !imgFailed ? '1.5px solid rgba(212, 175, 55, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
        aspectRatio: '3/4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: imageUrl && !imgFailed ? '0 16px 36px rgba(0,0,0,0.7)' : 'none',
        cursor: imageUrl && !imgFailed ? 'zoom-in' : 'default',
        transition: 'all 0.25s ease',
      }}
    >
      {imageUrl && !imgFailed ? (
        <>
          <img
            src={imageUrl}
            alt={label}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Badge */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '28px 14px 12px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
              {icon} {angle}
            </span>
            <span style={{ fontSize: 11, color: '#d4af37', fontWeight: 700 }}>
              Büyüt 🔍
            </span>
          </div>

          {/* Download button */}
          <a
            href={imageUrl}
            download={`kombin-${view}.jpg`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              borderRadius: 12,
              padding: '6px 11px',
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            💾 İndir
          </a>
        </>
      ) : status === 'loading' ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            margin: '0 auto 12px',
            border: '3px solid rgba(212,175,55,0.2)',
            borderTopColor: '#d4af37',
            animation: 'spin 0.9s linear infinite',
          }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: '#d4af37', margin: 0 }}>
            {angle} fotoğrafı hazırlanıyor…
          </p>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
            Stüdyo ışığı ve kombin giydiriliyor
          </span>
        </div>
      ) : (status === 'error' || imgFailed) ? (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
          <p style={{ fontSize: 11, color: '#f87171', margin: '0 0 10px', fontWeight: 600 }}>
            {error || 'Görsel yüklenemedi'}
          </p>
          {onRetry && (
            <button
              onClick={e => { e.stopPropagation(); onRetry() }}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff',
                fontSize: 11,
                padding: '6px 12px',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🔄 Tekrar Dene
            </button>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 38, marginBottom: 10, opacity: 0.3 }}>{icon}</div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            {label}
          </p>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, display: 'block' }}>
            Butona basıldığında hazırlanacak
          </span>
        </div>
      )}
    </div>
  )
}

export default function AIPhotoStudio({ outfit }) {
  const { avatarConfig, profile } = useAppStore()

  const facePhoto = avatarConfig?.facePhoto || profile?.facePhotoUrl
  const userName  = avatarConfig?.name || profile?.name || 'Sen'

  const [viewStatus, setViewStatus] = useState({})
  const [viewImages, setViewImages] = useState({})
  const [viewErrors, setViewErrors] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  // Always use the free, fast, zero-key FLUX studio engine
  const executeGeneration = async (view) => {
    return await generateFreeFashionPhoto(outfit, view, userName, avatarConfig)
  }


  const generateSingleView = async (view) => {
    setViewStatus(prev => ({ ...prev, [view]: 'loading' }))
    setViewErrors(prev => ({ ...prev, [view]: '' }))

    try {
      const url = await executeGeneration(view)
      setViewImages(prev => ({ ...prev, [view]: url }))
      setViewStatus(prev => ({ ...prev, [view]: 'done' }))
    } catch (err) {
      console.error(`Error generating ${view}:`, err)
      setViewStatus(prev => ({ ...prev, [view]: 'error' }))
      setViewErrors(prev => ({ ...prev, [view]: err.message || 'Üretim hatası' }))
    }
  }

  const handleGenerateAll = useCallback(async () => {
    setIsGenerating(true)
    setViewImages({})
    setViewErrors({})

    const initialStatus = {}
    VIEWS.forEach(v => { initialStatus[v.key] = 'loading' })
    setViewStatus(initialStatus)

    const views = VIEWS.map(v => v.key)

    // Sequential generation with small pause to protect rate limits
    for (let i = 0; i < views.length; i++) {
      const view = views[i]
      try {
        const url = await executeGeneration(view)
        setViewImages(prev => ({ ...prev, [view]: url }))
        setViewStatus(prev => ({ ...prev, [view]: 'done' }))
      } catch (err) {
        console.error(`Error generating ${view}:`, err)
        setViewStatus(prev => ({ ...prev, [view]: 'error' }))
        setViewErrors(prev => ({ ...prev, [view]: err.message || 'Üretim hatası' }))
      }
      if (i < views.length - 1) {
        await new Promise(r => setTimeout(r, 600))
      }
    }

    setIsGenerating(false)
  }, [outfit, userName, avatarConfig, facePhoto])

  const hasResults = Object.values(viewImages).some(Boolean)
  const completedCount = VIEWS.filter(v => viewStatus[v.key] === 'done' || viewStatus[v.key] === 'error').length

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '0 16px 30px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Selected Outfit Card */}
      <div style={{
        background: 'rgba(16, 16, 26, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 22,
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        {facePhoto ? (
          <img
            src={facePhoto}
            alt="Profil"
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              objectFit: 'cover',
              border: '2px solid #d4af37',
              boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div style={{
            width: 58,
            height: 58,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #8b5cf6, #d4af37)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            flexShrink: 0,
          }}>
            👤
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#d4af37', letterSpacing: 1.2 }}>
            HAZIRLANACAK KOMBİN
          </span>
          <p style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#ffffff',
            margin: '3px 0 2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {[outfit?.top?.name, outfit?.bottom?.name].filter(Boolean).join(' + ') || 'Dolaptan Kombin Seç'}
          </p>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {[outfit?.top?.color, outfit?.bottom?.color, outfit?.shoes?.color].filter(Boolean).join(' • ')}
          </span>
        </div>
      </div>

      {/* Action Button: Generate 4 views */}
      <button
        onClick={handleGenerateAll}
        disabled={isGenerating}
        style={{
          width: '100%',
          padding: '17px',
          borderRadius: 22,
          border: '1px solid rgba(212,175,55,0.5)',
          background: isGenerating
            ? 'rgba(212,175,55,0.12)'
            : 'linear-gradient(135deg, #8b5cf6 0%, #d4af37 100%)',
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 800,
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: isGenerating ? 'none' : '0 10px 28px rgba(139,92,246,0.4)',
          transition: 'all 0.25s ease',
        }}
      >
        {isGenerating ? (
          <>
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: '2.5px solid rgba(255,255,255,0.2)',
              borderTopColor: '#fff',
              animation: 'spin 0.8s linear infinite',
            }} />
            Fotoğraflar Çekiliyor… ({completedCount}/2)
          </>
        ) : hasResults ? (
          <>🔄 Yeniden Ön & Arka Fotoğraf Üret</>
        ) : (
          <>📸 Ön & Arka Fotoğrafımı Oluştur</>
        )}
      </button>

      {/* Progress Line */}
      {isGenerating && (
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 6,
          height: 5,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${(completedCount / 2) * 100}%`,
            background: 'linear-gradient(90deg, #8b5cf6, #d4af37)',
            borderRadius: 6,
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}


      {/* 4 Views Grid (2x2) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        {VIEWS.map(v => (
          <PhotoCard
            key={v.key}
            view={v.key}
            label={v.label}
            icon={v.icon}
            angle={v.angle}
            imageUrl={viewImages[v.key]}
            status={viewStatus[v.key]}
            error={viewErrors[v.key]}
            onEnlarge={(url, title) => setSelectedImage({ url, title })}
            onRetry={() => generateSingleView(v.key)}
          />
        ))}
      </div>

      {/* Save All Button */}
      {hasResults && (
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={() => {
              VIEWS.forEach(v => {
                if (viewImages[v.key]) {
                  const a = document.createElement('a')
                  a.href = viewImages[v.key]
                  a.download = `kombin-${v.key}.jpg`
                  a.target = '_blank'
                  a.click()
                }
              })
            }}
            className="btn btn-primary"
            style={{
              flex: 1,
              padding: '13px',
              fontSize: 13,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #8b5cf6, #d4af37)',
            }}
          >
            💾 Tüm Açıları İndir
          </button>
        </div>
      )}

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: 460,
              width: '100%',
              borderRadius: 24,
              overflow: 'hidden',
              background: '#0d0d14',
              border: '1px solid rgba(212,175,55,0.4)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.95)',
            }}
          >
            <div style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {selectedImage.title}
              </span>
              <button
                onClick={() => setSelectedImage(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 10,
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block', background: '#07070b' }}
            />
            <div style={{ padding: '12px 18px', display: 'flex', gap: 10 }}>
              <a
                href={selectedImage.url}
                download="kombin-foto.jpg"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '11px',
                  borderRadius: 14,
                  textDecoration: 'none',
                  fontSize: 13,
                }}
              >
                💾 Yüksek Çözünürlükte İndir
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
