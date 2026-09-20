// OpenAI integration for AI Photo Studio (supporting current gpt-image-1 and dall-e-2 fallback)

export function getOpenAIKey() {
  return (
    localStorage.getItem('styleai_openai_key') ||
    import.meta.env.VITE_OPENAI_API_KEY ||
    ''
  )
}

export function setOpenAIKey(key) {
  if (key) {
    localStorage.setItem('styleai_openai_key', key.trim())
  } else {
    localStorage.removeItem('styleai_openai_key')
  }
}

/**
 * Execute image generation request against OpenAI API
 */
async function requestOpenAIImage(apiKey, prompt, model) {
  const body = {
    prompt,
    n: 1,
    size: '1024x1024',
  }
  if (model) body.model = model

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('OpenAI API anahtarınız geçersiz veya yetkisiz (401 Unauthorized). Lütfen anahtarınızı kontrol edin.')
    }
    if (response.status === 429) {
      throw new Error('OpenAI kullanım kotanız veya bakiyeniz yetersiz (429 Rate Limit / Quota Exceeded). Lütfen OpenAI hesabınızdaki bakiyeyi kontrol edin.')
    }
    throw new Error(data?.error?.message || `OpenAI API Hatası (${response.status})`)
  }

  // gpt-image-1 returns b64_json, dall-e-2 returns url
  if (data?.data?.[0]?.b64_json) {
    return `data:image/png;base64,${data.data[0].b64_json}`
  }
  if (data?.data?.[0]?.url) {
    return data.data[0].url
  }

  throw new Error('Görsel verisi boş döndü.')
}

/**
 * Generate a single fashion photo using current OpenAI image generation models.
 * Automatically tries gpt-image-1 first, then dall-e-2 fallback.
 *
 * @param {string} facePhotoDataUrl - User's face photo (used for prompt context)
 * @param {object} outfit - { top, bottom, shoes } wardrobe items
 * @param {'front'|'back'|'left'|'right'} view - camera angle
 * @param {string} userName - user's name
 * @param {object} avatarConfig - avatar physical traits { gender, skinTone, hairColor, hasBeard }
 * @returns {Promise<string>} - generated image URL or base64 data URL
 */
export async function generateFashionPhoto(
  facePhotoDataUrl,
  outfit,
  view = 'front',
  userName = 'the person',
  avatarConfig = {}
) {
  const apiKey = getOpenAIKey()
  if (!apiKey) {
    throw new Error('OpenAI API anahtarı eksik. Lütfen geçerli bir API anahtarı girin.')
  }

  const topDesc    = outfit?.top    ? `${outfit.top.color || ''} ${outfit.top.name || ''}`.trim()    : ''
  const bottomDesc = outfit?.bottom ? `${outfit.bottom.color || ''} ${outfit.bottom.name || ''}`.trim() : ''
  const shoeDesc   = outfit?.shoes  ? `${outfit.shoes.color || ''} ${outfit.shoes.name || ''}`.trim()  : ''

  const outfitText = [topDesc, bottomDesc, shoeDesc].filter(Boolean).join(', ')

  const viewAngleDescriptions = {
    front: 'Full body front view, looking directly at camera with confident natural fashion model pose',
    back:  'Full body rear view, completely turned away from camera showing back of the outfit',
    left:  'Full body side view, elegant fashion profile facing left',
    right: 'Full body side view, elegant fashion profile facing right',
  }

  const genderTerm = avatarConfig?.gender === 'female' ? 'stylish elegant woman' : 'stylish elegant man'
  const beardDetail = avatarConfig?.gender === 'male' && avatarConfig?.hasBeard ? 'with a neat modern beard, ' : ''

  const prompt = `8K high-resolution fashion editorial magazine photograph of a ${genderTerm}, ${beardDetail}shot in a luxury fashion studio.
Camera angle: ${viewAngleDescriptions[view] || viewAngleDescriptions.front}.
Wearing: ${outfitText || 'a luxury tailored outfit'}.
Setting: minimalist dark architectural studio, soft cinematic key light, clean bokeh.
Aesthetics: Vogue photoshoot style, realistic fabric textures, natural skin.
No text, no watermarks, no collage.`

  // 1. Try modern gpt-image-1 first
  try {
    return await requestOpenAIImage(apiKey, prompt, 'gpt-image-1')
  } catch (err1) {
    if (err1.message.includes('401') || err1.message.includes('429')) {
      throw err1
    }
    console.warn('gpt-image-1 not accessible, trying dall-e-2 fallback:', err1.message)
    
    // 2. Fallback to dall-e-2 (max 1000 chars)
    try {
      return await requestOpenAIImage(apiKey, prompt.slice(0, 950), 'dall-e-2')
    } catch (err2) {
      if (err2.message.includes('401') || err2.message.includes('429')) {
        throw err2
      }
      console.warn('dall-e-2 fallback failed, trying default model:', err2.message)
      
      // 3. Fallback without explicit model param
      return await requestOpenAIImage(apiKey, prompt.slice(0, 950), null)
    }
  }
}
