import { useState, useEffect } from 'react'
import { useWeather } from '../hooks/useWeather'
import { useWardrobe } from '../hooks/useWardrobe'
import { getWeatherOutfit } from '../lib/gemini'
import { getWeatherLabel } from '../lib/weather'
import { useAppStore } from '../store/useAppStore'

export default function WeatherPage() {
  const { weather, loading: weatherLoading, error: weatherError, loadWeather } = useWeather()
  const { wardrobe } = useWardrobe()
  const { addSavedOutfit } = useAppStore()

  const [generating, setGenerating] = useState(false)
  const [recommendation, setRecommendation] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [genError, setGenError] = useState('')

  useEffect(() => {
    loadWeather()
  }, [loadWeather])

  const handleGenerateOutfit = async () => {
    if (!weather) return
    setGenerating(true)
    setGenError('')
    setSavedSuccess(false)
    try {
      const result = await getWeatherOutfit(weather, wardrobe)
      setRecommendation(result)
    } catch (err) {
      setGenError('Öneri oluşturulurken hata oluştu: ' + (err.message || ''))
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveOutfit = () => {
    if (!recommendation) return
    addSavedOutfit({
      id: Date.now().toString(),
      title: `${weather?.city || 'Şehir'} Hava Kombini (${weather?.temp}°C)`,
      description: recommendation,
      weather: weather ? { temp: weather.temp, condition: weather.description, city: weather.city } : null,
      savedAt: new Date().toISOString(),
    })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
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
        <span className="font-editorial" style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--accent-gold)',
          display: 'block',
          marginBottom: 4,
        }}>
          CLIMATE & ATMOSPHERE
        </span>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Hava Durumu & Kombin
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
          Günün hava koşullarına uygun, dolabından seçilen zarif kombinler
        </p>
      </div>

      <div style={{ padding: '0 20px 30px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Atmospheric Luxury Weather Card */}
        {weatherLoading ? (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 50 }}>
            <div className="spinner" style={{ width: 30, height: 30 }} />
          </div>
        ) : weatherError ? (
          <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(244,63,94,0.3)' }}>
            <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{weatherError}</p>
            <button className="btn btn-secondary" onClick={() => loadWeather(true)}>
              Tekrar Dene
            </button>
          </div>
        ) : weather ? (
          <div className="card" style={{
            background: 'linear-gradient(145deg, rgba(28, 24, 44, 0.8) 0%, rgba(14, 14, 20, 0.95) 100%)',
            border: '1px solid rgba(230, 198, 135, 0.25)',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(139, 92, 246, 0.15)',
            padding: '24px 22px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Ambient Background Aura */}
            <div style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(230, 198, 135, 0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: 10 }}>
                  📍 {weather.city || 'Konumun'}
                </span>
                <div style={{
                  fontSize: 52,
                  fontWeight: 800,
                  letterSpacing: '-1.5px',
                  lineHeight: 1,
                  fontFamily: 'var(--font-sans)',
                  background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {weather.temp}°C
                </div>
                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 500,
                  marginTop: 6,
                  textTransform: 'capitalize'
                }}>
                  {weather.description} • Hissedilen {weather.feelsLike}°C
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                {weather.iconUrl && (
                  <img
                    src={weather.iconUrl}
                    alt={weather.description}
                    style={{
                      width: 72,
                      height: 72,
                      filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.5))'
                    }}
                  />
                )}
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--accent-gold)',
                  letterSpacing: 0.5,
                  marginTop: -4
                }}>
                  {getWeatherLabel(weather.temp)}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 13,
              color: 'var(--text-secondary)'
            }}>
              <div>💧 Nem: <strong style={{ color: '#fff' }}>%{weather.humidity}</strong></div>
              <div>💨 Rüzgar: <strong style={{ color: '#fff' }}>{weather.windSpeed} m/s</strong></div>
              <button
                onClick={() => loadWeather(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  color: 'var(--accent-gold)',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                🔄 Yenile
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 28 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 14 }}>
              Hava durumu analizi için konum servisi kullanılabilir.
            </p>
            <button className="btn btn-primary" onClick={() => loadWeather(true)}>
              Konum Al & Kombin Getir
            </button>
          </div>
        )}

        {/* Generate Button */}
        <div>
          <button
            className="btn btn-primary btn-full"
            onClick={handleGenerateOutfit}
            disabled={generating || !weather}
            style={{
              padding: '18px 24px',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.3px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #d4af37 100%)',
              boxShadow: '0 12px 32px -6px rgba(139, 92, 246, 0.5)',
              borderRadius: 16,
            }}
          >
            {generating ? (
              <>
                <div className="spinner" style={{ width: 20, height: 20 }} />
                <span>Havaya Özel Kombin Oluşturuluyor...</span>
              </>
            ) : (
              <>✨ Bugünün Havasına Özel Kombin Yarat</>
            )}
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 10 }}>
            Dolabındaki {wardrobe.length} parça kıyafet sıcaklık ve rüzgarla eşleştirilir
          </p>
        </div>

        {genError && (
          <div className="card" style={{ borderColor: 'rgba(244,63,94,0.3)', color: 'var(--danger)', fontSize: 13 }}>
            {genError}
          </div>
        )}

        {/* Outfit Result Card */}
        {recommendation && (
          <div className="card fade-in" style={{
            background: 'rgba(20, 20, 28, 0.85)',
            border: '1px solid rgba(230, 198, 135, 0.3)',
            boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.7)',
            padding: 22,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>💎</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.2px' }}>
                  Stil Danışmanının Önerisi
                </h3>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleSaveOutfit}
                style={{ padding: '7px 14px', fontSize: 12, borderRadius: 10 }}
              >
                {savedSuccess ? '✓ Kaydedildi' : '❤️ Kaydet'}
              </button>
            </div>

            <div style={{
              fontSize: 14,
              lineHeight: 1.75,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}>
              {recommendation}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
