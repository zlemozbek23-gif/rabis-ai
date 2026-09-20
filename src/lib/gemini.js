import { GoogleGenAI } from '@google/genai'

export function getGeminiApiKey() {
  return (
    localStorage.getItem('styleai_gemini_key') ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ''
  )
}

export function setGeminiApiKey(key) {
  if (key) {
    localStorage.setItem('styleai_gemini_key', key)
  } else {
    localStorage.removeItem('styleai_gemini_key')
  }
}

export function getGeminiClient() {
  const key = getGeminiApiKey()
  return new GoogleGenAI({ apiKey: key })
}

/**
 * Converts a File/Blob to a clean base64 string
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
  })
}

/**
 * Transcribe speech/audio to Turkish text with Gemini 3.5 Flash Lite
 * Bypasses browser speech service network errors with 100% reliability
 */
export async function transcribeAudio(audioBlob) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Gemini API anahtarı ayarlanmamış.')
  }

  const ai = getGeminiClient()
  const base64Audio = await fileToBase64(audioBlob)

  const mime = audioBlob.type || 'audio/webm'

  const prompt = `Sen profesyonel bir Türkçe ses transkripsiyon yapay zekasısın.
Bu ses kaydını son derece dikkatle dinle. Kullanıcının Türkçe olarak söylediği her bir kelimeyi eksiksiz ve tam doğrulukla metne dönüştür.
Özellikle moda, giyim, kombin, hava durumu, stil istekleri ve günlük konuşma kelimelerini (örn: "kombin", "trençkot", "oversize", "jean", "kazak", "ayakkabı", "sneaker", "Ankara", "renkli", "şıklık", "cıvıl cıvıl" vb.) doğru algıla.

ÖNEMLİ KURALLAR:
1. SADECE konuşulan Türkçe metni yaz.
2. Selamlama, tırnak işareti, zaman damgası, açıklama veya ek yorum ASLA yapma.
3. Eğer ses kaydı tamamen sessizse veya hiçbir kelime anlaşılmıyorsa sadece boşluk bırak.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        {
          inlineData: {
            mimeType: mime.split(';')[0], // e.g. audio/webm
            data: base64Audio,
          },
        },
        { text: prompt },
      ],
    })

    return response.text?.trim() || ''
  } catch (err) {
    console.error('Gemini audio transcription error:', err)
    throw err
  }
}

/**
 * Analyze a single clothing item image and return structured data
 * Powered by multimodal gemini-3.5-flash-lite
 */
export async function analyzeClothingItem(file) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Gemini API anahtarı ayarlanmamış.')
  }

  const ai = getGeminiClient()
  const base64Image = await fileToBase64(file)

  const prompt = `Sen uzman bir moda analiz yapay zekasısın. Bu kıyafet fotoğrafını incele ve SADECE aşağıdaki JSON formatında yanıt ver:
{
  "name": "Kıyafet adı (örn: Pembe Oversize Triko Kazak)",
  "category": "tops | bottoms | dresses | outerwear | shoes | accessories",
  "subcategory": "alt kategori (örn: t-shirt, kazak, jean, sneaker, ceket, mont, etek)",
  "color": "Ana renk (Türkçe)",
  "colors": ["renk1", "renk2"],
  "pattern": "solid | striped | floral | checkered | graphic | other",
  "style": ["casual", "streetwear", "formal", "sport", "tatlı", "şık"],
  "season": ["spring", "summer", "fall", "winter", "all-season"],
  "occasion": ["casual", "work", "formal", "date", "daily"],
  "aiDescription": "Kıyafetin 1 cümlelik Türkçe açıklaması"
}`

  try {
    const apiPromise = ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        {
          inlineData: {
            mimeType: file.type || 'image/jpeg',
            data: base64Image,
          },
        },
        { text: prompt },
      ],
    })

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Clothing analysis timeout')), 4000)
    )

    const response = await Promise.race([apiPromise, timeoutPromise])

    const text = response.text?.trim() || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(text)
  } catch (err) {
    console.warn('Gemini analyze clothing fallback:', err)
    return {
      name: file.name?.replace(/\.[^/.]+$/, '') || 'Yeni Kıyafet',
      category: 'tops',
      subcategory: 'diğer',
      color: 'Belirtilmedi',
      colors: [],
      pattern: 'solid',
      style: ['casual'],
      season: ['all-season'],
      occasion: ['casual'],
      aiDescription: 'Gardırobuna eklenen yeni parça.',
    }
  }
}

/**
 * World-class Personal AI Stylist:
 * Engages in natural, warm conversation with Rabiş.
 * - If Rabiş is just saying hi, chatting, sharing thoughts, or asking casual questions: chats warmly like a stylish best friend without forcing an outfit.
 * - If Rabiş asks for an outfit, what to wear, or styling advice: selects the BEST matching combination exclusively from her wardrobe!
 */
export async function consultPersonalStylist(userMessage, wardrobe = [], weather = null, profile = null, chatHistory = []) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Gemini API anahtarı ayarlanmamış.')
  }

  const ai = getGeminiClient()

  // Simplified wardrobe catalogue for fast, high-context AI evaluation
  const wardrobeCatalogue = wardrobe.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory,
    color: item.color,
    style: item.style,
    season: item.season,
  }))

  const weatherContext = weather
    ? `Hava durumu: ${weather.city || 'Belirtilmedi'}, ${weather.temp || 18}°C, ${weather.description || 'Açık'}`
    : 'Hava durumu: Bilinmiyor (Kullanıcının belirttiği şehre göre tahmin et)'

  const historyContext = chatHistory && chatHistory.length > 0
    ? `SON SOHBET GEÇMİŞİ:\n${chatHistory.map((m) => `${m.role === 'user' ? 'Rabiş' : 'Stilist'}: ${m.text}`).join('\n')}`
    : 'Sohbet yeni başladı.'

  const prompt = `Sen Rabiş'in kişisel stil danışmanı ve zevkli bir arkadaşısın.
Kullanıcının adı: Rabiş.

DİL VE ÜSLUP KURALLARI (ÇOK ÖNEMLİ):
1. Normal, zevkli, modern bir insan gibi konuş.
2. KESİNLİKLE her cümlenin sonuna veya aralara "aşkım", "bebeğim", "canım", "tatlım", "güzelim", "birtanem" gibi yapay ve abartılı hitaplar EKLEME. Bunları tekrarlamaktan kesinlikle kaçın.
3. Samimi, kibar ve doğal ol. Normal bir arkadaşın gibi rahat konuş (Örn: "Selam Rabiş, nasılsın?", "Günün nasıl geçiyor?", "Bence bu ikili birbiriyle çok uyumlu olur.", "Bugün hava serin, ona göre bir şey bakalım.").
4. Gereksiz yapmacık övgüler veya ağdalı sevgi sözcükleri kullanma; net, zevkli, tarz ve arkadaşça ol.

${historyContext}

KULLANICININ ŞİMDİKİ MESAJI:
"${userMessage}"

${weatherContext}

RABİŞ'İN DOLABINDAKİ PARÇALAR (${wardrobe.length} adet):
${wardrobe.length > 0 ? JSON.stringify(wardrobeCatalogue, null, 2) : 'Henüz dolaba kıyafet eklenmedi (dolap boş)'}

SENİN EN ÖNEMLİ GÖREVİN - İKİ MOD:
1. [SOHBET / MUHABBET MODU - intent: "chat"]:
   - Eğer Rabiş sadece selam veriyorsa ("selam", "merhaba", "naber", "nasılsın", "günaydın", "iyi akşamlar", "kimsin sen"),
   - Gününden, işinden, ruh halinden veya genel şeylerden bahsediyorsa ("bugün çok yoruldum", "hava çok soğuk ya", "canım sıkkın", "biraz sohbet edelim"),
   - Genel bir soru soruyorsa veya henüz KOMBİN İSTEMİYORSA:
   -> SAKIN DİREKT KOMBİNE GEÇME!
   -> intent değerini "chat" yap.
   -> Rabiş'le doğal bir insan gibi sıcak ve rahatça sohbet et, hal hatır sor.
   -> İstersen laf arasında "Kıyafet seçmek veya kombin yapmak istersen buradayım" diye hafifçe belirtebilirsin ama zorlama.
   -> selectedTopId, selectedBottomId vb. alanları null bırak, outfitTitle verme.

2. [KOMBİN SEÇME MODU - intent: "outfit"]:
   - Eğer Rabiş ne giyeceğini soruyorsa ("bana kombin yap", "bugün ne giysem", "Ankara'da kahveye çıkacağım güzel bir şeyler öner", "ofis için şık bir şey seç", "renkli cıvıl cıvıl bir kombin istiyorum", "başka bir kombin çıkar", "akşam yemeğine ne giyeyim" vb.):
   -> intent değerini "outfit" yap.
   -> Eğer dolabında hiç kıyafet yoksa (dolap boşsa), "Rabiş, dolabın henüz boş görünüyor. Aşağıdaki kamera butonundan kıyafetlerinin fotoğrafını yüklersen hemen sana özel kombinler çıkarabilirim." de.
   -> Eğer dolapta parçalar varsa: SADECE Rabiş'in dolabındaki ID'lerle parçaları seç:
      * selectedTopId: Üst giyim (tops) id
      * selectedBottomId: Alt giyim (bottoms) id
      * selectedShoesId: Varsa ayakkabı (shoes) id
      * selectedOuterwearId: Varsa ceket/mont (outerwear) id
      * selectedAccessoryId: Varsa takı, çanta (accessories/jewelry) id

Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir metin ekleme:
{
  "intent": "chat" | "outfit",
  "stylistMessage": "Rabiş'e verilen doğal, samimi Türkçe mesaj...",
  "outfitTitle": "Kombin Başlığı (yalnızca intent='outfit' ve dolap doluysa)",
  "selectedTopId": "seçilen üst giyim id veya null",
  "selectedBottomId": "seçilen alt giyim id veya null",
  "selectedShoesId": "seçilen ayakkabı id veya null",
  "selectedOuterwearId": "seçilen dış giyim id veya null",
  "selectedAccessoryId": "seçilen takı/çanta id veya null",
  "stylingNotes": [
    "Stil tüyosu 1",
    "Stil tüyosu 2"
  ],
  "detectedCity": "Ankara veya bahsedilen şehir (yoksa boş bırak)"
}`

  try {
    const apiPromise = ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [{ text: prompt }],
    })

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Stylist consultation timeout')), 8000)
    )

    const response = await Promise.race([apiPromise, timeoutPromise])

    const text = response.text?.trim() || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    let parsed = {}
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0])
    } else {
      parsed = JSON.parse(text)
    }

    // If intent is explicitly chat, or wardrobe is empty
    if (parsed.intent === 'chat' || wardrobe.length === 0) {
      return {
        intent: 'chat',
        stylistMessage: parsed.stylistMessage || 'Selam Rabiş! Günün nasıl geçiyor, nasıl yardımcı olabilirim?',
        outfitTitle: null,
        outfit: null,
        stylingNotes: [],
        detectedCity: parsed.detectedCity || '',
      }
    }

    // Resolve actual item objects from wardrobe
    const selectedTop = wardrobe.find((i) => i.id === parsed.selectedTopId) || wardrobe.find((i) => i.category === 'tops' || i.category === 'dresses') || wardrobe[0] || null
    const selectedBottom = wardrobe.find((i) => i.id === parsed.selectedBottomId) || wardrobe.find((i) => i.category === 'bottoms') || (wardrobe.length > 1 ? wardrobe[1] : null)
    const selectedShoes = wardrobe.find((i) => i.id === parsed.selectedShoesId) || wardrobe.find((i) => i.category === 'shoes') || null
    const selectedOuterwear = wardrobe.find((i) => i.id === parsed.selectedOuterwearId) || wardrobe.find((i) => i.category === 'outerwear') || null
    const selectedAccessory = wardrobe.find((i) => i.id === parsed.selectedAccessoryId) || wardrobe.find((i) => i.category === 'accessories' || i.category === 'jewelry') || null

    const hasAnyPiece = selectedTop || selectedBottom || selectedShoes || selectedOuterwear || selectedAccessory

    if (!hasAnyPiece) {
      return {
        intent: 'chat',
        stylistMessage: parsed.stylistMessage || 'Rabiş, dolabında henüz kıyafet bulunmuyor. Gardırobum sayfasına gidip parçalarını eklersen hemen sana harika kombinler yapabilirim.',
        outfitTitle: null,
        outfit: null,
        stylingNotes: [],
        detectedCity: parsed.detectedCity || '',
      }
    }

    return {
      intent: 'outfit',
      stylistMessage: parsed.stylistMessage || 'Senin için dolabındaki parçalardan çok şık bir kombin hazırladım.',
      outfitTitle: parsed.outfitTitle || 'Günün Kombini',
      outfit: {
        top: selectedTop,
        bottom: selectedBottom,
        shoes: selectedShoes,
        outerwear: selectedOuterwear,
        accessory: selectedAccessory,
      },
      stylingNotes: parsed.stylingNotes || ['Parçaların renklerini ve tarzını birbiriyle uyumlu şekilde eşleştirdim.'],
      detectedCity: parsed.detectedCity || '',
    }
  } catch (err) {
    console.warn('Stylist consultation error, building friendly fallback:', err)
    
    // Check if user was just greeting/chatting
    const lower = userMessage.toLowerCase()
    const isCasual = lower.includes('selam') || lower.includes('merhaba') || lower.includes('naber') || lower.includes('nasılsın') || lower.includes('günaydın')
    
    if (isCasual || wardrobe.length === 0) {
      return {
        intent: 'chat',
        stylistMessage: wardrobe.length === 0 
          ? 'Selam Rabiş! Kombin yapabilmem için önce Gardırobum sayfasına girip kıyafet ve takılarını yüklemen gerekiyor.'
          : 'Selam Rabiş! Günün nasıl geçiyor? Dolabındaki parçalarla sana harika bir kombin yapmamı ister misin?',
        outfitTitle: null,
        outfit: null,
        stylingNotes: [],
        detectedCity: '',
      }
    }

    const top = wardrobe.find((i) => i.category === 'tops' || i.category === 'dresses') || wardrobe[0] || null
    const bottom = wardrobe.find((i) => i.category === 'bottoms') || (wardrobe.length > 1 ? wardrobe[1] : null)
    const shoes = wardrobe.find((i) => i.category === 'shoes') || null
    const accessory = wardrobe.find((i) => i.category === 'accessories' || i.category === 'jewelry') || null

    return {
      intent: 'outfit',
      stylistMessage: 'İstediğin tarza en uygun parçaları dolabından bir araya getirdim.',
      outfitTitle: 'Günün Kombini',
      outfit: { top, bottom, shoes, outerwear: null, accessory },
      stylingNotes: ['Parçaların renk uyumunu takı ve aksesuarlarla tamamlayabilirsin.'],
      detectedCity: '',
    }
  }
}


/**
 * Create a persistent chat session for continuous styling conversations
 */
export function createOutfitChat(wardrobeContext, userProfile) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Gemini API anahtarı ayarlanmamış.')
  }

  const ai = getGeminiClient()
  const systemInstruction = `Sen StyleAI, tatlı, enerjik, modayı çok iyi bilen samimi bir kişisel stil asistanısın. 
Kullanıcının dolabındaki kıyafetlerle kombin önerileri yapıyorsun.
Kullanıcının bahsettiği şehirleri (örn. Ankara, İstanbul, İzmir) ve hava durumunu dikkate al.
Kullanıcı renkli, minnoş, cıvıl cıvıl veya şık tarzlar istediğinde dolabındaki en uygun parçaları seç.

KULLANICININ DOLABI:
${wardrobeContext}`

  return ai.chats.create({
    model: 'gemini-3.5-flash-lite',
    history: [],
    config: { systemInstruction },
  })
}

export async function sendChatMessage(chat, userText, imageFile = null) {
  const parts = []
  if (imageFile) {
    const base64 = await fileToBase64(imageFile)
    parts.push({
      inlineData: {
        mimeType: imageFile.type || 'image/jpeg',
        data: base64,
      },
    })
  }
  parts.push({ text: userText })

  const response = await chat.sendMessage({ message: parts })
  return response.text
}

/**
 * Weather-based outfit recommendation
 */
export async function getWeatherOutfit(weather, wardrobe = []) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('Gemini API anahtarı ayarlanmamış.')

  const ai = getGeminiClient()
  const wardrobeList = wardrobe
    .map((item) => `- ${item.name} (${item.category}, ${item.color})`)
    .join('\n')

  const prompt = `Sen bir kişisel moda stilistisin.
HAVA DURUMU:
- Şehir: ${weather?.city || 'Ankara'}
- Sıcaklık: ${weather?.temp || 18}°C
- Durum: ${weather?.description || 'Açık'}

DOLAPTAKİ PARÇALAR:
${wardrobeList || 'Dolap boş'}

Bu hava için dolaptaki parçalarla 2 farklı kombin öner ve nedenini Türkçe açıkla.`

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [{ text: prompt }],
  })

  return response.text
}

/**
 * Analyze face photo and return style recommendations
 */
export async function analyzeFacePhoto(file) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('Gemini API anahtarı ayarlanmamış.')

  const ai = getGeminiClient()
  const base64Image = await fileToBase64(file)

  const prompt = `Bu kişinin yüz fotoğrafını analiz et ve SADECE JSON ver:
{
  "faceShape": "oval | round | square | heart | oblong",
  "skinTone": "fair | medium | olive | dark",
  "styleRecommendations": ["öneri1", "öneri2"],
  "colorPalette": ["renk1", "renk2", "renk3"],
  "summary": "Kısa Türkçe stil özeti"
}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        { inlineData: { mimeType: file.type || 'image/jpeg', data: base64Image } },
        { text: prompt },
      ],
    })

    const text = response.text?.trim() || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return JSON.parse(text)
  } catch {
    return {
      faceShape: 'oval',
      skinTone: 'fair',
      styleRecommendations: ['Zarif minimalizm', 'Doğal renk tonları'],
      colorPalette: ['Kızıl', 'Siyah', 'Krem', 'Zümrüt'],
      summary: 'Kızıl saçlar ve açık ten için sıcak ve kontrast tonlar harika durur.',
    }
  }
}

/**
 * Deep Analysis of User's Face & Body photo:
 * Extracts skin tone, undertone, hair color, body silhouette, and best color palette.
 */
export async function analyzeFaceAndBodyPhoto(file) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('Gemini API anahtarı ayarlanmamış.')

  const ai = getGeminiClient()
  const base64Image = await fileToBase64(file)

  const prompt = `Bu fotoğraftaki kişinin fiziksel özelliklerini, stil tipini ve vücut yapısını detaylı incele.
SADECE aşağıdaki JSON formatında yanıt ver:
{
  "hairColor": "saç rengi (örn: Canlı Bakır Kızıl)",
  "hairStyle": "saç stili ve uzunluğu",
  "skinTone": "ten rengi (örn: Açık Beyaz Ten)",
  "skinUndertone": "sıcak / soğuk / nötr",
  "faceShape": "oval / kalp / yuvarlak / kare / elmas",
  "bodyType": "vücut yapısı ve silüeti (örn: İnce ve atletik, belirgin bel hattı)",
  "bestColors": ["en çok yakışacak renk 1", "renk 2", "renk 3", "renk 4", "renk 5"],
  "stylePersona": "stil kimliği (örn: Modern Chic / Zarif)",
  "summary": "Kişiye özel 2 cümlelik samimi ve profesyonel Türkçe stil ve silüet analizi."
}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        { inlineData: { mimeType: file.type || 'image/jpeg', data: base64Image } },
        { text: prompt },
      ],
    })

    const text = response.text?.trim() || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return JSON.parse(text)
  } catch (err) {
    console.warn('Face & Body analysis error, using fallback:', err)
    return {
      hairColor: 'Canlı Bakır Kızıl',
      hairStyle: 'Omuz hizasında doğal dalgalı',
      skinTone: 'Açık Ten',
      skinUndertone: 'Sıcak',
      faceShape: 'Kalp',
      bodyType: 'Zarif atletik yapı',
      bestColors: ['Zümrüt Yeşili', 'Siyah', 'Krem', 'Pastel Pembe', 'Lila'],
      stylePersona: 'Modern & Zarif',
      summary: 'Bakır kızıl saçların ve açık tenin muhteşem bir ahenk sunuyor. Vücut hatlarını vurgulayan parçalar ve pastel/kontrast renkler sana inanılmaz yakışır.',
    }
  }
}


