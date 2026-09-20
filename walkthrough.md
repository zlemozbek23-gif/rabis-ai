# StyleAI — Kurulum ve Uygulama Özeti (Walkthrough)

Kullanıcının yüz fotoğrafını ve kıyafetlerini yüklediği, **Google Gemini 2.0 Flash Multimodal AI** ile kıyafetleri tanıyan, doğal dilde kombin sohbeti sunan ve **OpenWeatherMap** ile canlı hava durumuna göre kombin öneren iOS uyumlu **Progressive Web App (PWA)** başarıyla geliştirildi.

---

## 🏗️ Neler Geliştirildi?

### 1. 📱 Proje Altyapısı ve iOS Uyumlu PWA
- **React 19 + Vite 8**: Yüksek performanslı, modern frontend mimarisi.
- **Vite PWA Plugin & Workbox**: Çevrimdışı önbellekleme ve servis işçisi desteği.
- **iOS Tam Uyum**: iPhone çentik / Dynamic Island desteği (`viewport-fit=cover`, `env(safe-area-inset-*)`), `apple-mobile-web-app-capable` ve 180x180 solid `apple-touch-icon`.

### 2. 🤖 Gemini Multimodal Entegrasyonu (`src/lib/gemini.js`)
- **Kıyafet Tanıma (`analyzeClothingItem`)**: Kullanıcının yüklediği fotoğrafı doğrudan Gemini 2.0 Flash modeline gönderip kıyafetin türünü (üst/alt/dış giyim vb.), rengini, stilini ve mevsimini otomatik sınıflandırır.
- **Kişisel Yüz & Stil Analizi (`analyzeFacePhoto`)**: Yüklenen yüz fotoğrafından ten rengi, yüz şekli ve kişiye en çok yakışan renk paletini çıkarır.
- **Doğal Dilde Kombin Sohbeti (`createOutfitChat`)**: Kullanıcının dolabındaki parçaları bağlam (context) olarak alıp, kullanıcının isteklerine göre dolabından kombin üretir.
- **Hava Durumu Kombin Motoru (`getWeatherOutfit`)**: Anlık sıcaklık, rüzgar ve hava durumuna göre dolaptaki parçalardan kombin tavsiyeleri verir.

### 3. 🌤️ Canlı Hava Durumu Entegrasyonu (`src/lib/weather.js` & `useWeather.js`)
- Cihazın tarayıcı Geolocation API'sini kullanarak enlem/boylam üzerinden sıcaklık, nem, rüzgar ve hava durumunu çeker.
- Gereksiz API isteklerini önlemek için 30 dakikalık yerel önbellek uygular.

### 4. 🗂️ Sayfalar ve Kullanıcı Akışı
- **Giriş / Hoş Geldin (`LoginPage.jsx`)**: Google ile Firebase girişi veya anında test etmek için tek tıkla **Misafir Modu**.
- **Onboarding (`OnboardingPage.jsx`)**: Yüz fotoğrafı yükleme ve yapay zeka stil profili oluşturma.
- **Dolap (`WardrobePage.jsx`)**: Kamera ile fotoğraf çekme veya galeriden sürükle-bırak yükleme, kategori filtreleme ve silme.
- **Kombin AI (`ChatPage.jsx`)**: Hızlı hazır sorular ("Bugün ne giyeyim?", "İş kombini yap") ve serbest sohbet.
- **Hava Durumu (`WeatherPage.jsx`)**: Canlı hava kartı, günün hava durumuna özel tek tıkla kombin isteme ve kaydetme.
- **Kayıtlı Kombinler & Profil (`SavedPage.jsx`)**: Beğenilen kombinlerin arşivi ve stil analizi.

---

## 🧪 Doğrulama & Test Sonuçları

- **Üretim Derlemesi (`npm run build`)**: 
  - `dist/index.html`, `dist/manifest.webmanifest`, `dist/registerSW.js` ve PWA servis işçileri başarıyla derlendi.
  - Hata veya eksik paket bulunmuyor.

---

## 📲 Nasıl Çalıştırılır?

Proje dizinine geçip geliştirme sunucusunu başlatabilirsiniz:

```bash
cd fashion-ai
npm run dev -- --host
```

- **Bilgisayarda test etmek için**: Tarayıcıda `http://localhost:5173` adresine gidin.
- **iPhone'da test etmek için**: iPhone'unuzu aynı Wi-Fi ağına bağlayıp konsolda görünen yerel IP adresini (örn: `http://192.168.1.xxx:5173`) Safari'de açın.
- **Ana Ekrana Eklemek için**: Safari'de **Paylaş ➔ Ana Ekrana Ekle** adımlarını izleyin.
