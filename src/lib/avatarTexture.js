import * as THREE from 'three'

/**
 * Creates a personalized face texture by compositing the user's face photo
 * onto the ReadyPlayerMe head UV map with feathered elliptical edge blending.
 */
export function createPersonalizedFaceTexture(userFaceUrl, baseSkinUrl = '/models/skin_sample.jpg', skinToneHex = '#d4a373') {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')

    // Fallback solid skin tone
    ctx.fillStyle = skinToneHex
    ctx.fillRect(0, 0, 1024, 1024)

    const baseImg = new Image()
    baseImg.crossOrigin = 'anonymous'

    const renderFaceOverlay = () => {
      if (!userFaceUrl) {
        const texture = new THREE.CanvasTexture(canvas)
        texture.flipY = false
        resolve(texture)
        return
      }

      const userImg = new Image()
      userImg.crossOrigin = 'anonymous'

      userImg.onload = () => {
        try {
          // Offscreen canvas for feathered radial face mask
          const maskCanvas = document.createElement('canvas')
          maskCanvas.width = 1024
          maskCanvas.height = 1024
          const mCtx = maskCanvas.getContext('2d')

          // In ReadyPlayerMe UV:
          // The face center is approximately at X: 512, Y: 490
          // Width: ~340, Height: ~450
          const cx = 512
          const cy = 490
          const rx = 165
          const ry = 220

          // Calculate aspect-ratio fitted bounds
          const aspect = (userImg.width || 1) / (userImg.height || 1)
          let drawW = rx * 2.1
          let drawH = drawW / aspect
          if (drawH < ry * 2.1) {
            drawH = ry * 2.1
            drawW = drawH * aspect
          }

          const drawX = cx - drawW / 2
          const drawY = cy - drawH / 2

          // Draw user photo
          mCtx.drawImage(userImg, drawX, drawY, drawW, drawH)

          // Apply soft feathered oval gradient mask
          mCtx.globalCompositeOperation = 'destination-in'
          const grad = mCtx.createRadialGradient(cx, cy, rx * 0.4, cx, cy, rx)
          grad.addColorStop(0, 'rgba(0, 0, 0, 1)')
          grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)')
          grad.addColorStop(0.95, 'rgba(0, 0, 0, 0.2)')
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

          mCtx.fillStyle = grad
          mCtx.beginPath()
          mCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
          mCtx.fill()

          // Draw the feathered face onto the base skin
          ctx.drawImage(maskCanvas, 0, 0)
        } catch (e) {
          console.warn('Face compositing error:', e)
        }

        const texture = new THREE.CanvasTexture(canvas)
        texture.flipY = false
        resolve(texture)
      }

      userImg.onerror = () => {
        const texture = new THREE.CanvasTexture(canvas)
        texture.flipY = false
        resolve(texture)
      }

      userImg.src = userFaceUrl
    }

    baseImg.onload = () => {
      ctx.drawImage(baseImg, 0, 0, 1024, 1024)

      // Tint base skin with user's skin tone
      if (skinToneHex) {
        ctx.save()
        ctx.globalCompositeOperation = 'multiply'
        ctx.fillStyle = skinToneHex
        ctx.fillRect(0, 0, 1024, 1024)
        ctx.restore()
      }

      renderFaceOverlay()
    }

    baseImg.onerror = () => {
      renderFaceOverlay()
    }

    baseImg.src = baseSkinUrl
  })
}

/**
 * Creates fabric clothing texture from image or solid color
 */
export function createClothingTexture(clothImageUrl) {
  return new Promise((resolve) => {
    if (!clothImageUrl) {
      resolve(null)
      return
    }

    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      clothImageUrl,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(1.2, 1.2)
        resolve(tex)
      },
      undefined,
      () => resolve(null)
    )
  })
}
