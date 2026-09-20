import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export default function AvatarStudio3D({ config, facePhotoUrl }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const modelRef = useRef(null)
  const [loadingModel, setLoadingModel] = useState(true)

  // Update model scale and skin/color when config changes
  useEffect(() => {
    if (!modelRef.current) return
    const { shoulderWidth, heightRatio, skinTone } = config || {}

    const hr = heightRatio || 1.0
    const sw = shoulderWidth || 1.0
    modelRef.current.scale.set(sw, hr, (sw + 1) / 2)

    // Traverse meshes to tint skin/materials if appropriate
    modelRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [config])

  // Mount 3D Scene with GLTFLoader
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 320
    const height = container.clientHeight || 420

    // 1. Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0f)
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50)
    camera.position.set(0, 1.3, 2.6)

    // 3. Renderer with high-end tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    container.appendChild(renderer.domElement)

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 - 0.05
    controls.minDistance = 1.4
    controls.maxDistance = 4.5
    controls.target.set(0, 1.0, 0)

    // 5. Studio Lighting
    const ambient = new THREE.AmbientLight(0xfff7ed, 1.2)
    scene.add(ambient)

    // Key Light (Warm soft studio spotlight)
    const keySpot = new THREE.SpotLight(0xfff1e0, 6.0)
    keySpot.position.set(2.0, 3.5, 2.5)
    keySpot.angle = Math.PI / 4
    keySpot.penumbra = 0.6
    keySpot.castShadow = true
    scene.add(keySpot)

    // Fill Light (Cool blue/purple backlight)
    const rimLight = new THREE.PointLight(0x8b5cf6, 4.0, 8)
    rimLight.position.set(-2.0, 2.2, -1.8)
    scene.add(rimLight)

    // Under-glow Accent Light
    const floorGlow = new THREE.PointLight(0xd4af37, 2.5, 5)
    floorGlow.position.set(0, 0.2, 1.2)
    scene.add(floorGlow)

    // 6. Luxury Circular Stand / Pedestal
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a24,
      metalness: 0.8,
      roughness: 0.2,
    })
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.78, 0.08, 36), pedestalMat)
    pedestal.position.set(0, 0.04, 0)
    pedestal.receiveShadow = true
    scene.add(pedestal)

    // Gold Beveled Ring on Pedestal
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 })
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.015, 16, 48), ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.set(0, 0.08, 0)
    scene.add(ring)

    // 7. Load High-Quality Realistic GLB Model
    const loader = new GLTFLoader()
    setLoadingModel(true)

    loader.load(
      '/models/Michelle.glb',
      (gltf) => {
        const model = gltf.scene
        model.position.set(0, 0.08, 0)
        model.scale.set(1, 1, 1)

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            if (child.material) {
              child.material.roughness = Math.min(child.material.roughness || 0.6, 0.7)
            }
          }
        })

        scene.add(model)
        modelRef.current = model
        setLoadingModel(false)
      },
      undefined,
      (err) => {
        console.warn('Could not load Michelle.glb, trying Xbot.glb:', err)
        loader.load('/models/Xbot.glb', (xGltf) => {
          const xModel = xGltf.scene
          xModel.position.set(0, 0.08, 0)
          xModel.scale.set(0.011, 0.011, 0.011) // Xbot is scaled differently in units
          scene.add(xModel)
          modelRef.current = xModel
          setLoadingModel(false)
        })
      }
    )

    // 8. Animation Loop
    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // 9. Resize
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animId)
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 340 }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Realistic User Portrait Picture-in-Picture Mirror */}
      {facePhotoUrl && (
        <div style={{
          position: 'absolute',
          top: 14,
          right: 14,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid var(--accent-gold)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.8), 0 0 15px rgba(230,198,135,0.4)',
            background: '#0a0a0f',
          }}>
            <img
              src={facePhotoUrl}
              alt="Profil"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: 0.5 }}>
            SENİN YÜZÜN
          </span>
        </div>
      )}

      {/* Loading Indicator */}
      {loadingModel && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10, 10, 15, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <span style={{ color: 'var(--accent-gold)', fontSize: 13, fontWeight: 600 }}>
            Gerçekçi 3D Model Yükleniyor...
          </span>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 14,
        background: 'rgba(10, 10, 14, 0.75)',
        backdropFilter: 'blur(10px)',
        padding: '5px 12px',
        borderRadius: 12,
        fontSize: 10,
        color: 'var(--accent-gold)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        pointerEvents: 'none',
      }}>
        🔄 360° Sürükleyerek İncele
      </div>
    </div>
  )
}
