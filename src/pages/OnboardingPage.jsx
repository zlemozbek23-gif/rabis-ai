import { useState, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { analyzeFaceAndBodyPhoto, analyzeClothingItem, fileToBase64 } from '../lib/gemini'

export default function OnboardingPage() {
  const {
    profile, setProfile,
    wardrobe, addWardrobeItem,
    setOnboardingComplete,
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
      const b64 = await fileToBase64(file)
      const dataUrl = `data:${file.type || 'image/jpeg'};base64,${b64}`
      setPhotoPreview(dataUrl)
      const analysis = await analyzeFaceAndBodyPhoto(file)
      setAnalysisResult(analysis)
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
    } catch (err) {
      console.error('Photo analysis error:', err)
    } finally {
      setAnalyzingPhoto(false)
    }
  }

  const handleClothUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCloth(true)
    try {
      const b64 = await fileToBase64(file)
      const imageUrl = `data:${file.type || 'image/jpeg'};base64,${b64}`
      let itemAnalysis = {}
      try {
        itemAnalysis = await analyzeClothingItem(file)
      } catch {
        itemAnalysis = {
          name: file.name?.replace(/\\.[^/.]+$/, '') || 'Yeni Kıyafet',
          category: 'tops',
          color: 'Özel',
        }
      }
      const newItem = {
        id: 'user-item-' + Date.now(),
        ...itemAnalysis,
        imageUrl,
        createdAt: new Date().toISOString(),
      }
      addWardrobeItem(newItem)
      setAddedClothesCount((c) => c + 1)
    } catch (err) {
      console.error('Clothing upload error:', err)
    } finally {
      setUploadingCloth(false)
      if (clothInputRef.current) clothInputRef.current.value = ''
    }
  }

  return (
    <div 
      className="min-h-screen w-full flex justify-center items-center relative overflow-y-auto"
      style={{
        backgroundColor: '#06060a',
        background: 'radial-gradient(circle at 20% 30%, rgba(88, 28, 135, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(225, 112, 85, 0.1) 0%, transparent 50%), #06060a'
      }}
    >
      {/* Floating particles background effect */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-[440px] min-h-screen flex flex-col p-6 relative z-10 fade-in">
        
        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-3 mt-8 mb-12">
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${step === 1 ? 'bg-gradient-to-r from-rose-400 to-purple-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] scale-125' : 'bg-gray-700'}`} />
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${step === 2 ? 'bg-gradient-to-r from-rose-400 to-purple-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] scale-125' : 'bg-gray-700'}`} />
        </div>

        {step === 1 && (
          <div className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-editorial text-center text-white mb-2 tracking-wide font-light">
              Hoş geldin, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-purple-300 to-rose-200">Rabiş! ✨</span>
            </h1>
            <p className="text-gray-400 text-center mb-10 font-light tracking-wide text-sm">
              Yapay zeka stilistin seni tanımaya hazır
            </p>

            <div className="relative mb-10 flex flex-col items-center">
              <input
                type="file"
                accept="image/*"
                ref={photoInputRef}
                onChange={handlePhotoSelect}
                className="hidden"
              />
              
              <div 
                onClick={() => !analyzingPhoto && photoInputRef.current?.click()}
                className={`relative w-[200px] h-[200px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-500
                  ${photoPreview ? 'border-2 border-rose-300/50 shadow-[0_0_30px_rgba(253,164,175,0.15)]' : 'border-2 border-dashed border-gray-600 hover:border-rose-400/50 hover:shadow-[0_0_20px_rgba(253,164,175,0.1)]'}`}
              >
                {/* Pulsing ring */}
                {!photoPreview && (
                  <div className="absolute inset-[-10px] rounded-full border border-rose-400/20 animate-ping opacity-50" style={{ animationDuration: '3s' }} />
                )}

                {photoPreview ? (
                  <img src={photoPreview} alt="Profil" className="w-full h-full object-cover rounded-full p-1" />
                ) : (
                  <div className="text-gray-500 flex flex-col items-center">
                    <span className="text-3xl mb-2">📸</span>
                    <span className="text-xs uppercase tracking-widest">Fotoğraf Seç</span>
                  </div>
                )}

                {analyzingPhoto && (
                  <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" style={{ transform: 'translateX(-100%)' }} />
                    <div className="spinner w-8 h-8 border-2 border-rose-300 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <span className="text-xs text-rose-100 tracking-wider text-center px-4 leading-relaxed font-light">✨ Rabiş'in tarz profili çıkarılıyor...</span>
                  </div>
                )}
              </div>
            </div>

            {analysisResult && !analyzingPhoto && (
              <div className="w-full card bg-white/[0.03] border border-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 shadow-xl shadow-black/50">
                <h3 className="text-rose-200/90 text-xs uppercase tracking-[0.2em] mb-4 text-center font-medium">Stil Analizin</h3>
                <div className="space-y-4 text-sm text-gray-300">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="font-light">Vücut Tipi</span>
                    <span className="text-white capitalize">{analysisResult.bodyShape || 'Belirtilmedi'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="font-light">Yüz Şekli</span>
                    <span className="text-white capitalize">{profile?.faceAnalysis?.faceShape || 'Belirtilmedi'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="font-light">Cilt Alt Tonu</span>
                    <span className="text-white capitalize">{profile?.faceAnalysis?.skinTone || 'Belirtilmedi'}</span>
                  </div>
                  <div className="pt-2">
                    <span className="font-light block mb-3">En İyi Renklerin</span>
                    <div className="flex gap-3 flex-wrap">
                      {(profile?.faceAnalysis?.colorPalette || ['#ff9999', '#99ccff', '#ffcc99']).slice(0,5).map((color, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1.5">
                          <div 
                            className="w-6 h-6 rounded-full shadow-inner ring-1 ring-white/20"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!photoPreview || analyzingPhoto}
              className={`w-full py-4 rounded-xl font-medium tracking-wide transition-all duration-300 mt-auto shadow-lg
                ${(photoPreview && !analyzingPhoto) 
                  ? 'bg-gradient-to-r from-rose-400 via-purple-500 to-indigo-500 text-white shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5' 
                  : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'}`}
            >
              Harika! Dolabıma Geçelim →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
            <h1 className="text-3xl font-editorial text-center text-white mb-2 tracking-wide font-light">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-purple-300">Rabiş'in</span> Dolabı 👗
            </h1>
            <p className="text-gray-400 text-center mb-8 font-light tracking-wide text-sm">
              Fotoğrafını çek, yapay zeka anında tanısın
            </p>

            <div className="mb-8">
              <input
                type="file"
                accept="image/*"
                ref={clothInputRef}
                onChange={handleClothUpload}
                className="hidden"
              />
              <div 
                onClick={() => !uploadingCloth && clothInputRef.current?.click()}
                className={`relative w-full h-32 rounded-2xl border-2 border-dashed bg-white/[0.02] backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group overflow-hidden
                  ${uploadingCloth ? 'border-rose-400/50' : 'border-white/10 hover:border-rose-400/40 hover:bg-white/[0.04]'}`}
              >
                {uploadingCloth ? (
                  <div className="flex flex-col items-center gap-3 z-10">
                    <div className="spinner w-6 h-6 border-2 border-rose-300 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-rose-200 tracking-widest font-light uppercase">İnceleniyor...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-rose-200 transition-colors z-10">
                    <span className="text-2xl mb-2 drop-shadow-md">✨</span>
                    <span className="text-sm font-light tracking-wide">Kıyafet Ekle</span>
                  </div>
                )}
                
                {uploadingCloth && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-400/10 to-transparent animate-shimmer" style={{ transform: 'translateX(-100%)', animationDuration: '2s' }} />
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 px-1 custom-scrollbar">
              <div className="grid grid-cols-3 gap-3">
                {wardrobe.map((item) => (
                  <div key={item.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10 group shadow-lg">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-1.5 right-1.5">
                      <span className="badge text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-black/60 text-rose-200 backdrop-blur-md border border-white/10">
                        {item.category || 'Diğer'}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-[10px] truncate font-light tracking-wide">{item.name}</p>
                    </div>
                  </div>
                ))}
              </div>
              {wardrobe.length === 0 && !uploadingCloth && (
                <div className="h-full flex items-center justify-center text-center px-8">
                  <p className="text-gray-500/80 font-light text-sm tracking-wide leading-relaxed">
                    Henüz kıyafet eklemedin.<br/>Dolabını oluşturmak için yukarıdan fotoğraf yükle.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setOnboardingComplete(true)}
              className="w-full py-4 mt-auto rounded-xl font-medium tracking-wide transition-all duration-300 shadow-lg shadow-purple-500/25 bg-gradient-to-r from-rose-400 via-purple-500 to-indigo-500 text-white hover:shadow-purple-500/40 hover:-translate-y-0.5"
            >
              🚀 Stilistimle Konuşmaya Başla
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .font-editorial {
          font-family: 'Playfair Display', serif;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}} />
    </div>
  )
}
