# 👗 StyleAI — AI Destekli Kişisel Stil & Kombin Asistanı (PWA)

Kullanıcının kendi yüz fotoğrafını ve gardırobundaki kıyafet parçalarını yüklediği, **Google Gemini 2.0 Flash Multimodal AI** ile kıyafetleri otomatik tanıyan, akıllı kombin sohbeti yapan ve anlık **Hava Durumu** verisine göre kombin öneren iOS uyumlu Progressive Web App (PWA).

---

## 📱 iOS Cihaza Uygulama Olarak Yükleme (PWA)

1. iPhone veya iPad'inizde **Safari** tarayıcısını açın.
2. Uygulama adresine gidin (yerel ağda test ederken `http://<bilgisayar-ip>:5173`).
3. Alt kısımdaki **Paylaş (Share)** simgesine (içinden yukarı ok çıkan kare) dokunun.
4. Menüden **"Ana Ekrana Ekle" (Add to Home Screen)** seçeneğini seçin.
5. Sağ üstteki **"Ekle"** butonuna basın.
6. Artık ana ekranınızda gerçek bir iOS uygulaması gibi tam ekran (adres çubuğu olmadan) açılır!

---

## ✨ Özellikler

1. **Giriş & Onboarding (Yüz Analizi)**:
   - Google ile tek tıkla giriş veya hızlı Keşif/Misafir Modu.
   - İsteğe bağlı yüz fotoğrafı yükleme: Gemini AI yüz şeklini, cilt tonunu analiz eder ve en çok yakışacak renk paletini çıkarır.
2. **Dolap (Wardrobe)**:
   - iPhone kamerasıyla direkt kıyafet çekme veya galeriden yükleme.
   - Yapay zeka kıyafetin kategorisini (üst, alt, ayakkabı, dış giyim vb.), rengini, stilini ve mevsimini otomatik etiketler.
   - Kategori filtreleme ve kolay yönetim.
3. **Kombin AI Sohbeti (Chat)**:
   - Kullanıcı dilediği kombini doğal dille ister: *"Bu akşam romantik bir akşam yemeği için ne giyeyim?"*, *"Yarın iş görüşmem var, dolabımdan kombin yap"*.
   - Gemini dolabındaki gerçek parçaları kullanarak stil tavsiyesi verir.
4. **Hava Durumu Kombin Sekmesi**:
   - Cihazın konumuna göre anlık sıcaklık, nem, rüzgar ve hava durumu bilgisi.
   - Tek tıkla havaya en uygun kombinleri oluşturma ve kaydetme.
5. **Kayıtlı Kombinler & Stil Profili**:
   - Beğenilen kombinlerin arşivlenmesi.
   - AI stil analizi ve renk kartelasının görüntülenmesi.

---

## 🚀 Başlatma (Geliştirici)

### 1. Bağımlılıkları Kurma & Çalıştırma
```bash
cd fashion-ai
npm run dev
```

Mobil cihazdan test etmek için:
```bash
npm run dev -- --host
```
Konsolda çıkan `http://192.168.x.x:5173` adresini iPhone Safari'de açabilirsiniz.

---

## 🔑 API Anahtarlarını Ayarlama (.env)

`fashion-ai` klasöründe `.env` dosyasını oluşturun veya düzenleyin:

```env
# Google Gemini API Key (Zorunlu - Görsel ve Kombin AI için)
# https://aistudio.google.com/ adresinden ücretsiz alabilirsiniz
VITE_GEMINI_API_KEY=AIzaSy...

# OpenWeatherMap API Key (Hava Durumu İçin)
# https://openweathermap.org/api adresinden ücretsiz alabilirsiniz
VITE_OWM_API_KEY=your_openweathermap_api_key

# Firebase (Kullanıcı hesapları ve bulut depolama için opsiyonel)
# Eklenmezse uygulama yerel/misafir modunda sorunsuz çalışır
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## 🛠️ Teknoloji Yığını

- **Frontend**: React 19 + Vite 8
- **PWA & Offline**: `vite-plugin-pwa` (Workbox caching, Service Worker, Web Manifest)
- **AI**: `@google/genai` (Gemini 2.0 Flash Multimodal)
- **Hava Durumu**: OpenWeatherMap Geolocation API
- **Durum Yönetimi**: Zustand (LocalStorage persistence)
- **Görsel Yükleme**: `react-dropzone` + iOS native camera capture
- **Tasarım**: Modern Dark Glassmorphism, iOS Safe Area (çentik/Dynamic Island) uyumlu
