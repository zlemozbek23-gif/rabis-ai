import { useState, useEffect, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useWardrobe } from '../hooks/useWardrobe'
import { useAuth } from '../hooks/useAuth'
import { useAppStore } from '../store/useAppStore'
import AIPhotoStudio from '../components/AIPhotoStudio'


const CATEGORIES = ['Tümü', 'tops', 'bottoms', 'outerwear', 'shoes', 'dresses', 'accessories']
const CATEGORY_LABELS = {
  tops: 'Üst Giyim',
  bottoms: 'Alt Giyim',
  outerwear: 'Dış Giyim',
  shoes: 'Ayakkabı',
  dresses: 'Elbise',
  accessories: 'Aksesuar',
}

function ClothingCard({ item, onDelete, onTryOn }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      className="card fade-in"
      style={{
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(18, 18, 24, 0.65)',
        boxShadow: '0 12px 28px -8px rgba(0,0,0,0.7)',
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', overflow: 'hidden' }}>
        <img
          src={item.imageUrl}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(8, 8, 12, 0.95) 0%, rgba(8, 8, 12, 0.2) 45%, transparent 100%)',
        }} />

        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <span className="badge" style={{
            fontSize: 9,
            padding: '3px 8px',
            background: 'rgba(10, 10, 15, 0.75)',
            backdropFilter: 'blur(8px)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            color: '#f1f5f9',
          }}>
            {CATEGORY_LABELS[item.category] || item.category}
          </span>
        </div>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(10, 10, 15, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '50%',
              width: 26,
              height: 26,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(6, 6, 10, 0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            gap: 10,
            zIndex: 10,
          }}>
            <p style={{ fontSize: 12, color: '#f8fafc', fontWeight: 600 }}>Parçayı kaldır?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-danger"
                style={{ padding: '6px 12px', fontSize: 11, borderRadius: 10 }}
                onClick={() => onDelete(item)}
              >
                Sil
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: 11, borderRadius: 10 }}
                onClick={() => setConfirmDelete(false)}
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}

        {/* Item Info overlayed at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 14px',
        }}>
          <h4 style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {item.name || 'Kıyafet'}
          </h4>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--text-secondary)'
          }}>
            <span>{item.color}</span>
            {onTryOn && (
              <button
                onClick={() => onTryOn(item)}
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(230, 198, 135, 0.2) 100%)',
                  border: '1px solid rgba(230, 198, 135, 0.3)',
                  color: 'var(--accent-gold)',
                  borderRadius: 8,
                  padding: '3px 8px',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Giy ✨
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function UploadOverlay({ onClose, onUploadFiles, uploading, uploadProgress }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) onUploadFiles(acceptedFiles)
  }, [onUploadFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxFiles: 100,
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  })

  const cameraRef = useRef(null)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}
      onClick={(e) => e.target === e.currentTarget && !uploading && onClose()}
    >
      <div className="card fade-in" style={{
        width: '100%',
        maxWidth: 500,
        borderRadius: '28px 28px 0 0',
        padding: '24px 20px',
        paddingBottom: 'calc(var(--safe-bottom) + 30px)',
        background: 'rgba(15, 15, 20, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 -20px 40px rgba(0,0,0,0.8)',
      }}>
        <div style={{ width: 44, height: 4, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span className="badge badge-gold" style={{ marginBottom: 8 }}>
            TOPLU KIYAFET YÜKLEME
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', marginTop: 4 }}>
            Gardırobuna Parçalar Ekle
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Galeriden veya kameradan <strong>100 parçaya kadar</strong> tek seferde seçebilirsin
          </p>
        </div>

        <button
          className="btn btn-primary btn-full"
          style={{
            marginBottom: 12,
            padding: 16,
            fontSize: 15,
            background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #d9b478 100%)',
          }}
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
        >
          📸 Kameradan / Galeriden Çoklu Seç
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onUploadFiles(Array.from(e.target.files))
            }
          }}
          style={{ display: 'none' }}
        />

        <div
          {...getRootProps()}
          style={{
            border: `1.5px dashed ${isDragActive ? 'var(--accent-purple)' : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: 18,
            padding: '24px 16px',
            textAlign: 'center',
            cursor: uploading ? 'default' : 'pointer',
            background: isDragActive ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            transition: 'all 0.2s',
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>
            {isDragActive ? 'Bırakın...' : 'Fotoğrafları Buraya Sürükle veya Çoklu Seç'}
          </p>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
            Maksimum 100 fotoğraf
          </span>
        </div>

        {uploading && (
          <div style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 16,
            background: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(167, 139, 250, 0.25)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                ✨ Yapay Zeka Parçaları İnceliyor...
              </span>
              <span style={{ color: 'var(--accent-gold)', fontSize: 13, fontWeight: 800 }}>
                {uploadProgress ? `${uploadProgress.current} / ${uploadProgress.total}` : 'Hazırlanıyor...'}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: 6,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${uploadProgress?.percent || 15}%`,
                background: 'linear-gradient(90deg, #7c3aed 0%, #d9b478 100%)',
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }} />
            </div>

            {uploadProgress?.currentName && (
              <p style={{
                fontSize: 11, color: 'var(--text-muted)',
                margin: '8px 0 0', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                İncelenen: {uploadProgress.currentName}
              </p>
            )}
          </div>
        )}

        <button
          className="btn btn-secondary btn-full"
          style={{ marginTop: 14 }}
          onClick={onClose}
          disabled={uploading}
        >
          {uploading ? 'Lütfen Bekleyin...' : 'Kapat'}
        </button>
      </div>
    </div>
  )
}

export default function WardrobePage() {
  const { wardrobe, loading, uploading, uploadProgress, addClothingItems, deleteClothingItem } = useWardrobe()
  const { user } = useAuth()
  const { avatarConfig, profile, selectedOutfitForStudio, setSelectedOutfitForStudio } = useAppStore()
  const [viewMode, setViewMode] = useState('studio') // 'studio' | 'catalog'
  const [activeCategory, setActiveCategory] = useState('Tümü')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Current Outfit
  const [currentOutfit, setCurrentOutfit] = useState(() => {
    if (selectedOutfitForStudio) return selectedOutfitForStudio
    const top    = wardrobe.find((i) => i.category === 'tops' || i.category === 'outerwear') || wardrobe[0]
    const bottom = wardrobe.find((i) => i.category === 'bottoms') || wardrobe[1] || wardrobe[0]
    const shoes  = wardrobe.find((i) => i.category === 'shoes')   || wardrobe[2]
    return { top, bottom, shoes }
  })

  // When user clicks "Bu Kombini Üzerimde Gör" from Chat, automatically switch to studio with that outfit
  useEffect(() => {
    if (selectedOutfitForStudio) {
      setCurrentOutfit(selectedOutfitForStudio)
      setViewMode('studio')
      setSelectedOutfitForStudio(null)
    }
  }, [selectedOutfitForStudio, setSelectedOutfitForStudio])

  const filtered = activeCategory === 'Tümü'
    ? wardrobe
    : wardrobe.filter((item) => item.category === activeCategory)

  const handleUploadFiles = async (files) => {
    setUploadError('')
    try {
      await addClothingItems(files)
      setShowUpload(false)
    } catch (err) {
      setUploadError('Yükleme sırasında hata: ' + err.message)
    }
  }

  const handleShuffleOutfit = () => {
    if (wardrobe.length >= 2) {
      const tops      = wardrobe.filter((i) => i.category === 'tops' || i.category === 'outerwear')
      const bottoms   = wardrobe.filter((i) => i.category === 'bottoms')
      const shoesList = wardrobe.filter((i) => i.category === 'shoes')
      setCurrentOutfit({
        top:    tops[Math.floor(Math.random() * tops.length)]           || wardrobe[0],
        bottom: bottoms[Math.floor(Math.random() * bottoms.length)]     || wardrobe[1],
        shoes:  shoesList[Math.floor(Math.random() * shoesList.length)] || wardrobe[2],
      })
    }
  }

  const handleTryOnSingle = (item) => {
    setViewMode('studio')
    if      (item.category === 'tops' || item.category === 'outerwear') setCurrentOutfit((prev) => ({ ...prev, top: item }))
    else if (item.category === 'bottoms')                                setCurrentOutfit((prev) => ({ ...prev, bottom: item }))
    else if (item.category === 'shoes')                                  setCurrentOutfit((prev) => ({ ...prev, shoes: item }))
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'var(--safe-top)',
      paddingBottom: 85,
      overflow: 'hidden',
    }}>
      {/* Top Header */}
      <div style={{
        padding: '14px 20px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 20,
      }}>
        <div>
          <span className="font-editorial" style={{
            fontSize: 10, fontWeight: 700, color: 'var(--accent-gold)', display: 'block',
          }}>
            AI PHOTO STUDIO
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>
            {viewMode === 'studio' ? 'Fotoğraf Stüdyosu' : 'Gardırop Kataloğu'}
          </h1>
        </div>

        {/* View Switcher */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'rgba(20,20,28,0.8)', backdropFilter: 'blur(16px)',
          padding: 3, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {[
            { key: 'studio',  label: '✨ Stüdyo' },
            { key: 'catalog', label: `📋 Liste (${wardrobe.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              style={{
                padding: '6px 11px', borderRadius: 11, border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: 11,
                background: viewMode === key
                  ? 'linear-gradient(135deg,rgba(139,92,246,0.4) 0%,rgba(230,198,135,0.2) 100%)'
                  : 'transparent',
                color: viewMode === key ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Outfit Quick Selector (visible in studio mode) */}
      {viewMode === 'studio' && (
        <div style={{
          flexShrink: 0,
          padding: '0 16px 8px',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          {/* Outfit thumbnails */}
          <div style={{ display: 'flex', gap: 6, flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[currentOutfit?.top, currentOutfit?.bottom, currentOutfit?.shoes].filter(Boolean).map((item, i) => (
              <div key={i} style={{
                flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    width: 44, height: 44, borderRadius: 10, objectFit: 'cover',
                    border: '1px solid rgba(212,175,55,0.3)',
                  }}
                />
                <span style={{ fontSize: 8, color: 'var(--text-secondary)', maxWidth: 44, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
          {/* Shuffle + Add */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={handleShuffleOutfit} title="Kombin Karıştır"
              style={{
                padding: '8px 10px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, cursor: 'pointer',
              }}>🔀</button>
            <button onClick={() => setShowUpload(true)}
              className="btn btn-primary"
              style={{ padding: '8px 12px', fontSize: 11, borderRadius: 11 }}>
              + Ekle
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      {viewMode === 'studio' ? (
        <AIPhotoStudio outfit={currentOutfit} />
      ) : (
        /* Catalog 2D Grid Mode */
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 20px' }}>
          {/* Category Filter */}
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 12,
            scrollbarWidth: 'none',
          }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  flexShrink: 0,
                  padding: '7px 14px',
                  borderRadius: 9999,
                  border: activeCategory === cat ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  background: activeCategory === cat
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(230, 198, 135, 0.15) 100%)'
                    : 'rgba(255, 255, 255, 0.04)',
                  color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowUpload(true)}
              style={{ padding: '8px 14px', fontSize: 12, borderRadius: 12 }}
            >
              + Yeni Kıyafet Ekle
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
              <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Bu kategoride kıyafet yok.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
            }}>
              {filtered.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  onDelete={deleteClothingItem}
                  onTryOn={handleTryOnSingle}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <p style={{ color: 'var(--danger)', fontSize: 12, textAlign: 'center', margin: '4px 0' }}>
          {uploadError}
        </p>
      )}

      {showUpload && (
        <UploadOverlay
          onClose={() => { if (!uploading) setShowUpload(false) }}
          onUploadFiles={handleUploadFiles}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />
      )}
    </div>
  )
}
