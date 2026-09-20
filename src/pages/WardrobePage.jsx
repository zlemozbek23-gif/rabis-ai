import { useState, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useWardrobe } from '../hooks/useWardrobe'
import { useAuth } from '../hooks/useAuth'

const CATEGORIES = ['Tümü', 'tops', 'bottoms', 'outerwear', 'shoes', 'dresses', 'accessories']
const CATEGORY_LABELS = {
  tops: '👚 Üst Giyim',
  bottoms: '👖 Alt Giyim',
  outerwear: '🧥 Dış Giyim',
  shoes: '👟 Ayakkabı',
  dresses: '👗 Elbise',
  accessories: '💍 Takı & Aksesuar',
}

function ClothingCard({ item, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      className="card fade-in"
      style={{
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 22,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(16, 15, 22, 0.75)',
        boxShadow: '0 12px 28px -8px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#0a0a10' }}>
        <img
          src={item.imageUrl}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(8, 8, 12, 0.92) 0%, rgba(8, 8, 12, 0.1) 50%, transparent 100%)',
        }} />

        {/* Category badge */}
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <span className="badge" style={{
            fontSize: 9,
            padding: '4px 8px',
            background: 'rgba(10, 10, 15, 0.85)',
            backdropFilter: 'blur(8px)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            color: '#f1f5f9',
            fontWeight: 600,
          }}>
            {CATEGORY_LABELS[item.category] || item.category}
          </span>
        </div>

        {/* Delete button */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            title="Parçayı Sil"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(10, 10, 15, 0.75)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.65)',
              borderRadius: '50%',
              width: 28,
              height: 28,
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            ×
          </button>
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(6, 6, 10, 0.94)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
            gap: 8,
            zIndex: 10,
          }}>
            <p style={{ fontSize: 11, color: '#f8fafc', fontWeight: 600, margin: 0 }}>Silinsin mi?</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-danger"
                style={{ padding: '5px 10px', fontSize: 11, borderRadius: 10 }}
                onClick={() => onDelete(item)}
              >
                Sil
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '5px 10px', fontSize: 11, borderRadius: 10 }}
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
          padding: '10px 12px',
        }}>
          <h4 style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 2px',
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
            <span>{item.color || 'Özel'}</span>
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
            TOPLU DOLAP YÜKLEME
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', marginTop: 4 }}>
            Gardırobuna Parçalar Ekle
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Kıyafet, takı, çanta ve ayakkabılarından <strong>100 parçaya kadar</strong> tek seferde seç
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
            Maksimum 100 fotoğraf (Kıyafet, Ayakkabı, Takı, Çanta)
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
  const [activeCategory, setActiveCategory] = useState('Tümü')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadError, setUploadError] = useState('')

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

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'var(--safe-top)',
      paddingBottom: 95,
      overflow: 'hidden',
    }}>
      {/* Top Header */}
      <div style={{
        padding: '16px 20px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 20,
      }}>
        <div>
          <span className="font-editorial" style={{
            fontSize: 11, fontWeight: 700, color: 'var(--accent-gold)', display: 'block', letterSpacing: 1,
          }}>
            RABİŞ'İN DOLABI
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.4px', margin: 0 }}>
            Gardırobum
          </h1>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowUpload(true)}
          style={{
            padding: '10px 16px',
            fontSize: 12,
            borderRadius: 14,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #d9b478 100%)',
            boxShadow: '0 6px 20px rgba(124, 58, 237, 0.3)',
          }}
        >
          + Parça Ekle
        </button>
      </div>

      {/* Category Filter Pills */}
      <div style={{
        padding: '0 20px 12px',
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        flexShrink: 0,
      }}>
        {CATEGORIES.map((cat) => {
          const count = cat === 'Tümü'
            ? wardrobe.length
            : wardrobe.filter((i) => i.category === cat).length

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                borderRadius: 9999,
                border: activeCategory === cat ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                background: activeCategory === cat
                  ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.35) 0%, rgba(217, 180, 120, 0.2) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              {cat === 'Tümü' ? `Tümü (${count})` : `${CATEGORY_LABELS[cat] || cat} (${count})`}
            </button>
          )
        })}
      </div>

      {/* Main Wardrobe Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '50px 20px', marginTop: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👗</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              {activeCategory === 'Tümü' ? 'Dolabın henüz boş' : 'Bu kategoride parça yok'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 300, margin: '0 auto 20px' }}>
              Kıyafet, takı, çanta ve ayakkabılarının fotoğrafını çekip ekle; yapay zeka senin için bunlardan günlük kombinler yapsın.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowUpload(true)}
              style={{
                padding: '12px 24px',
                fontSize: 13,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #d9b478 100%)',
              }}
            >
              + Parça Ekle (100'e kadar)
            </button>
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
              />
            ))}
          </div>
        )}
      </div>

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
