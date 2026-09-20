// Hugging Face Inference API (100% Free, NO credit card required)

export function getHFKey() {
  return (
    localStorage.getItem('styleai_hf_key') ||
    import.meta.env.VITE_HF_API_KEY ||
    ''
  )
}

export function setHFKey(key) {
  if (key) {
    const sanitized = key.replace(/^Bearer\s+/i, '').replace(/["']/g, '').trim()
    localStorage.setItem('styleai_hf_key', sanitized)
  } else {
    localStorage.removeItem('styleai_hf_key')
  }
}

/**
 * Generate a high-resolution fashion photo using Hugging Face FLUX.1
 *
 * @param {object} outfit - { top, bottom, shoes }
 * @param {'front'|'back'|'left'|'right'} view - camera angle
 * @param {string} userName - user's name
 * @param {object} avatarConfig - { gender, skinTone, hairColor, hasBeard }
 * @returns {Promise<string>} - generated image URL (blob or data url)
 */
export async function generateHFFashionPhoto(
  outfit,
  view = 'front',
  userName = 'the person',
  avatarConfig = {}
) {
  const rawKey = getHFKey()
  if (!rawKey) {
    throw new Error('Hugging Face Access Token eksik. Lütfen ücretsiz token girin.')
  }

  const token = rawKey.replace(/^Bearer\s+/i, '').replace(/["']/g, '').trim()

  const topDesc    = outfit?.top    ? `${outfit.top.color || ''} ${outfit.top.name || ''}`.trim()    : ''
  const bottomDesc = outfit?.bottom ? `${outfit.bottom.color || ''} ${outfit.bottom.name || ''}`.trim() : ''
  const shoeDesc   = outfit?.shoes  ? `${outfit.shoes.color || ''} ${outfit.shoes.name || ''}`.trim()  : ''

  const outfitText = [topDesc, bottomDesc, shoeDesc].filter(Boolean).join(', ')

  const viewAngleDescriptions = {
    front: 'full body straight front view, looking directly into camera with confident natural fashion model pose, complete outfit head to toe',
    back:  'full body rear view, completely turned away from camera, showing the back silhouette of the outfit',
    left:  'full body left side profile view, standing elegantly facing sideways to the left',
    right: 'full body right side profile view, standing elegantly facing sideways to the right',
  }

  const genderTerm = avatarConfig?.gender === 'female' ? 'fashion model woman' : 'fashion model man'
  const beardDetail = avatarConfig?.gender === 'male' && avatarConfig?.hasBeard ? ', well-groomed modern beard' : ''

  const prompt = `8K high-resolution fashion editorial magazine photograph of a ${genderTerm}${beardDetail}. ${viewAngleDescriptions[view] || viewAngleDescriptions.front}. Wearing: ${outfitText || 'a tailored modern luxury outfit'}. Minimalist dark luxury architectural studio, soft cinematic key light, sharp fabric textures, natural skin details, vogue cover photo, Hasselblad 100MP, sharp focus. No text, no watermarks, no split screens`

  // Models to try in order of quality
  const models = [
    'black-forest-labs/FLUX.1-schnell',
    'stabilityai/stable-diffusion-xl-base-1.0',
  ]

  let lastError = null

  for (const model of models) {
    try {
      const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        if (response.status === 401) {
          throw new Error('Hugging Face tokenınız geçersiz (401). Lütfen hf_... ile başlayan geçerli bir token girin.')
        }
        if (response.status === 503) {
          // Model loading, wait or try next
          lastError = new Error('Model şu an yükleniyor, lütfen birkaç saniye sonra tekrar deneyin.')
          continue
        }
        lastError = new Error(`HF Hatası (${response.status}): ${errText.slice(0, 150)}`)
        continue
      }

      const blob = await response.blob()
      return URL.createObjectURL(blob)
    } catch (err) {
      if (err.message.includes('401')) throw err
      lastError = err
    }
  }

  throw lastError || new Error('Görsel üretilemedi.')
}
