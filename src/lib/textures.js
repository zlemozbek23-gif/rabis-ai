import * as THREE from 'three'

/**
 * Procedurally generates a high-resolution dark smoked oak / walnut wood texture
 */
export function createLuxuryWoodTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  // Base dark charcoal / warm walnut
  ctx.fillStyle = '#181513'
  ctx.fillRect(0, 0, 1024, 1024)

  // Wood grain vertical streaks
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 1024
    const width = 1 + Math.random() * 3
    const alpha = 0.03 + Math.random() * 0.08
    const shade = Math.random() > 0.5 ? 255 : 0
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`
    ctx.fillRect(x, 0, width, 1024)
  }

  // Wavy wood rings
  ctx.lineWidth = 1.5
  for (let i = 0; i < 40; i++) {
    const yCenter = Math.random() * 1024
    ctx.beginPath()
    ctx.moveTo(0, yCenter)
    for (let x = 0; x <= 1024; x += 64) {
      const yOffset = Math.sin((x / 1024) * Math.PI * 4 + i) * (15 + Math.random() * 10)
      ctx.lineTo(x, yCenter + yOffset)
    }
    ctx.strokeStyle = `rgba(212, 175, 55, ${0.015 + Math.random() * 0.03})`
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 2)
  return texture
}

/**
 * Procedurally generates deep Nero Marquina black marble with gold/white veins
 */
export function createMarbleFloorTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  // Base rich dark slate
  ctx.fillStyle = '#0a0a0d'
  ctx.fillRect(0, 0, 1024, 1024)

  // Subtle cloudiness
  for (let i = 0; i < 60; i++) {
    const rad = 80 + Math.random() * 200
    const x = Math.random() * 1024
    const y = Math.random() * 1024
    const grad = ctx.createRadialGradient(x, y, 0, x, y, rad)
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.03)')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, rad, 0, Math.PI * 2)
    ctx.fill()
  }

  // Fine marble veins
  const drawVein = (color, width, count) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    for (let i = 0; i < count; i++) {
      let x = Math.random() * 1024
      let y = Math.random() * 1024
      ctx.beginPath()
      ctx.moveTo(x, y)
      for (let j = 0; j < 6; j++) {
        x += (Math.random() - 0.4) * 200
        y += (Math.random() - 0.4) * 200
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  }

  drawVein('rgba(255, 255, 255, 0.08)', 1.5, 12)
  drawVein('rgba(230, 198, 135, 0.12)', 2.0, 8)
  drawVein('rgba(255, 255, 255, 0.04)', 4.0, 6)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  return texture
}

/**
 * Creates an ultra-realistic face texture projection on canvas
 */
export function blendFaceOntoTexture(faceDataUrl, baseSkinColor = '#d4a373') {
  return new Promise((resolve) => {
    if (!faceDataUrl) {
      resolve(null)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')

      // Fill base skin color
      ctx.fillStyle = baseSkinColor
      ctx.fillRect(0, 0, 512, 512)

      // Draw user face in center with soft feathered circular mask
      ctx.save()
      ctx.beginPath()
      ctx.arc(256, 256, 180, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(img, 76, 76, 360, 360)
      ctx.restore()

      // Radial gradient vignette around face edges to blend seamlessly into 3D head
      const grad = ctx.createRadialGradient(256, 256, 120, 256, 256, 220)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(1, baseSkinColor)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 512, 512)

      const texture = new THREE.CanvasTexture(canvas)
      resolve(texture)
    }
    img.onerror = () => resolve(null)
    img.src = faceDataUrl
  })
}
