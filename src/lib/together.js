// Together AI FLUX.1 Integration for ultra-realistic fashion studio photography

export function getTogetherKey() {
  return (
    localStorage.getItem('styleai_together_key') ||
    import.meta.env.VITE_TOGETHER_API_KEY ||
    ''
  )
}

export function setTogetherKey(key) {
  if (key) {
    // Sanitize: strip whitespace, quotes, and any leading 'Bearer '
    const sanitized = key.replace(/^Bearer\s+/i, '').replace(/["']/g, '').trim()
    localStorage.setItem('styleai_together_key', sanitized)
  } else {
    localStorage.removeItem('styleai_together_key')
  }
}

/**
 * Generate a high-resolution fashion photo using Together AI FLUX.1
 *
 * @param {object} outfit - { top, bottom, shoes }
 * @param {'front'|'back'|'left'|'right'} view - camera angle
 * @param {string} userName - user's name
 * @param {object} avatarConfig - { gender, skinTone, hairColor, hasBeard }
 * @returns {Promise<string>} - generated image URL or base64 data URL
 */
export async function generateFluxFashionPhoto(
  outfit,
  view = 'front',
  userName = 'the person',
  avatarConfig = {}
) {
  const rawKey = getTogetherKey()
  if (!rawKey) {
    throw new Error('Together AI API anahtarı eksik. Lütfen geçerli bir anahtar girin.')
  }

  // Clean key in case user pasted quotes or Bearer prefix
  const apiKey = rawKey.replace(/^Bearer\s+/i, '').replace(/["']/g, '').trim()

  const topDesc    = outfit?.top    ? `${outfit.top.color || ''} ${outfit.top.name || ''}`.trim()    : ''
  const bottomDesc = outfit?.bottom ? `${outfit.bottom.color || ''} ${outfit.bottom.name || ''}`.trim() : ''
  const shoeDesc   = outfit?.shoes  ? `${outfit.shoes.color || ''} ${outfit.shoes.name || ''}`.trim()  : ''

  const outfitText = [topDesc, bottomDesc, shoeDesc].filter(Boolean).join(', ')

  const viewAngleDescriptions = {
    front: 'full body straight front view, looking directly into the camera with an elegant, confident fashion model pose',
    back:  'full body rear view, completely turned away from camera, showcasing the back silhouette and design of the outfit',
    left:  'full body left side profile view, standing elegantly facing sideways to the left, showing the side drape and profile',
    right: 'full body right side profile view, standing elegantly facing sideways to the right, showing the side drape and profile',
  }

  const genderTerm = avatarConfig?.gender === 'female' ? 'fashion model woman' : 'fashion model man'
  const beardDetail = avatarConfig?.gender === 'male' && avatarConfig?.hasBeard ? ', well-groomed modern beard' : ''

  const prompt = `8K high-resolution fashion editorial magazine photograph of an attractive ${genderTerm}${beardDetail}.
Camera angle: ${viewAngleDescriptions[view] || viewAngleDescriptions.front}.
Wearing this exact outfit: ${outfitText || 'a luxury tailored designer outfit'}.
Environment: minimalist dark grey luxury architectural studio, soft cinematic key light, clean bokeh background, sharp fabric textures, natural skin details.
Aesthetics: Vogue Paris magazine cover style, professional color grading, photorealistic, Hasselblad 100MP, 85mm lens.
No text, no watermarks, no split screens, no distorted limbs.`

  // Use proxy on dev to prevent CORS, direct URL in production
  const endpoint = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? '/api-together/v1/images/generations'
    : 'https://api.together.xyz/v1/images/generations'

  // Try FLUX.1-schnell first, then FLUX.1-schnell-Free as backup
  const models = [
    'black-forest-labs/FLUX.1-schnell',
    'black-forest-labs/FLUX.1-schnell-Free',
  ]

  let lastError = null

  for (const model of models) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          width: 1024,
          height: 1024,
          steps: 4,
          n: 1,
          response_format: 'base64',
        }),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        if (response.status === 401) {
          throw new Error('Together AI anahtarınız geçersiz (401). Lütfen api.together.ai/settings/api-keys adresinden doğru key’i kopyaladığınızdan emin olun.')
        }
        if (response.status === 429) {
          throw new Error('Together AI limit aşıldı (429 Rate Limit). Lütfen birkaç saniye bekleyin.')
        }
        lastError = new Error(errJson?.error?.message || `Together API hatası (${response.status})`)
        continue
      }

      const data = await response.json()
      const item = data?.data?.[0]

      if (item?.b64_json) {
        return `data:image/jpeg;base64,${item.b64_json}`
      }
      if (item?.url) {
        return item.url
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('429')) {
        throw err
      }
      lastError = err
    }
  }

  throw lastError || new Error('Görsel üretilemedi.')
}
