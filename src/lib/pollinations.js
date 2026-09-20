// Ultra-fast, 100% Free AI Fashion Photography Engine
// Powered by FLUX.1-schnell with HuggingFace ZeroGPU Token

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN || ''

// Clean Turkish characters to safe English
function cleanToSafeEnglish(text) {
  if (!text) return ''
  return text
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/[^a-zA-Z0-9 ,.-]/g, ' ')
    .trim()
}

// Translate clothing terms to English
function translateClothingTerm(term) {
  const t = (term || '').toLowerCase()
  if (t.includes('jean') || t.includes('kot') || t.includes('pantolon')) return 'denim jeans'
  if (t.includes('tisort') || t.includes('t-shirt') || t.includes('atlet') || t.includes('top')) return 'fitted tank top'
  if (t.includes('ceket') || t.includes('blazer')) return 'tailored blazer jacket'
  if (t.includes('gomlek') || t.includes('gömlek')) return 'button-up shirt'
  if (t.includes('elbise')) return 'elegant dress'
  if (t.includes('ayakkabi') || t.includes('sneaker') || t.includes('bot')) return 'sneakers'
  if (t.includes('siyah')) return 'black'
  if (t.includes('beyaz')) return 'white'
  if (t.includes('mavi')) return 'blue'
  if (t.includes('kirmizi') || t.includes('kırmızı')) return 'red'
  if (t.includes('bej') || t.includes('krem')) return 'beige'
  return cleanToSafeEnglish(term)
}

const VIEW_DESCRIPTIONS = {
  front: 'full body front view, looking directly at camera, confident standing pose, feet visible',
  back:  'full body rear view, turned away from camera showing back silhouette of outfit, feet visible',
  left:  'full body left side profile, standing gracefully facing left, feet visible',
  right: 'full body right side profile, standing gracefully facing right, feet visible',
}

// Lazy-load Gradio Client for direct browser fallback
let _gradioClientPromise = null
function getGradioClient() {
  if (!_gradioClientPromise) {
    _gradioClientPromise = import('@gradio/client').then(m => m.Client)
  }
  return _gradioClientPromise
}

/**
 * 1. Primary: Local Vite Proxy endpoint `/api/flux-generate`
 * Uses Node-side Gradio client with authenticated HF token, streams webp directly
 */
async function generateViaViteProxy(prompt) {
  const res = await fetch('/api/flux-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, width: 768, height: 1024 }),
    signal: AbortSignal.timeout(45000),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Vite proxy error: ${res.status} ${txt}`)
  }

  const blob = await res.blob()
  if (blob.size < 5000) throw new Error('Proxy returned invalid image size')
  return URL.createObjectURL(blob)
}

/**
 * 2. Secondary: Direct Browser Client with authenticated HF token
 */
async function generateViaBrowserFLUX(prompt) {
  const Client = await getGradioClient()
  const client = await Client.connect('black-forest-labs/FLUX.1-schnell', {
    token: HF_TOKEN,
  })
  const result = await client.predict('/infer', {
    prompt,
    seed: Math.floor(Math.random() * 999999),
    randomize_seed: true,
    width: 768,
    height: 1024,
    num_inference_steps: 4,
  })

  const imgUrl = result?.data?.[0]?.url
  if (!imgUrl) throw new Error('No image URL from browser FLUX')

  const res = await fetch(imgUrl)
  if (!res.ok) throw new Error('Failed to fetch browser FLUX image')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

/**
 * Main export — generates high fashion editorial photo
 */
export async function generateFreeFashionPhoto(
  outfit,
  view = 'front',
  userName = 'the person',
  avatarConfig = {}
) {
  const topText    = translateClothingTerm(outfit?.top?.name    || outfit?.top?.color    || 'black top')
  const bottomText = translateClothingTerm(outfit?.bottom?.name || outfit?.bottom?.color || 'black jeans')
  const shoesText  = translateClothingTerm(outfit?.shoes?.name  || outfit?.shoes?.color  || 'designer sneakers')

  const outfitDescription = `${topText}, ${bottomText}, ${shoesText}`
  const genderStr = avatarConfig?.gender === 'female'
    ? 'attractive 22-year-old woman with vivid copper red hair, tattoo on left arm, natural beautiful face'
    : 'handsome 25-year-old man with stylish hair'

  const prompt = [
    'editorial fashion magazine photography',
    VIEW_DESCRIPTIONS[view] || VIEW_DESCRIPTIONS.front,
    genderStr,
    `wearing ${outfitDescription}`,
    'luxury minimal grey studio backdrop, soft cinematic rim lighting',
    'professional fashion shoot, perfect anatomy, sharp focus, photorealistic, 8k',
  ].join(', ')

  // 1. Try Vite Proxy with HF Token (Fastest, zero CORS)
  try {
    return await generateViaViteProxy(prompt)
  } catch (err) {
    console.warn('[FLUX Proxy] failed, trying browser direct:', err?.message)
  }

  // 2. Try Direct Browser Gradio with HF Token
  try {
    return await generateViaBrowserFLUX(prompt)
  } catch (err2) {
    console.warn('[Browser FLUX] failed:', err2?.message)
  }

  // 3. Fallback: direct external pollinations URL if all else fails
  const encodedPrompt = encodeURIComponent(prompt)
  const seed = Math.floor(Math.random() * 899999) + 100000
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=1024&nologo=true&seed=${seed}`
}
