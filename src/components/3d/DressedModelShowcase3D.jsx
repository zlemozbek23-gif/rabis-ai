import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useAppStore } from '../../store/useAppStore'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: parse hex color → THREE.Color safely
// ─────────────────────────────────────────────────────────────────────────────
function hexToColor(hex) {
  try { return new THREE.Color(hex) } catch { return new THREE.Color(0xd4a373) }
}

export default function DressedModelShowcase3D({ currentOutfit }) {
  const mountRef = useRef(null)
  const modelRef = useRef(null)
  const mixerRef = useRef(null)
  const clockRef = useRef(new THREE.Clock())
  const [modelLoading, setModelLoading] = useState(true)
  const [showAvatarSettings, setShowAvatarSettings] = useState(false)
  const { avatarConfig, setAvatarConfig, profile } = useAppStore()

  const facePhoto = avatarConfig?.facePhoto || profile?.facePhotoUrl
  const skinTone = avatarConfig?.skinTone || '#d4a373'
  const gender = avatarConfig?.gender || 'male'
  const hasBeard = avatarConfig?.hasBeard ?? false

  // ─────────────────────────────────────────────────────────────────────────
  // Apply appearance to already-loaded model (runs on config change too)
  // ─────────────────────────────────────────────────────────────────────────
  const applyAppearance = (model) => {
    if (!model) return

    // Outfit color lookup
    const topColor    = currentOutfit?.top?.modelColor    ? new THREE.Color(currentOutfit.top.modelColor)    : null
    const bottomColor = currentOutfit?.bottom?.modelColor ? new THREE.Color(currentOutfit.bottom.modelColor) : null
    const shoeColor   = currentOutfit?.shoes?.modelColor  ? new THREE.Color(currentOutfit.shoes.modelColor)  : null

    model.traverse((child) => {
      if (!child.isMesh || !child.material) return

      switch (child.name) {

        // ── Head: keep original texture, just push skin tone as a subtle emissive tint
        case 'Wolf3D_Head': {
          child.material = child.material.clone()
          // Don't replace the UV map – just subtly shift skin colour
          child.material.emissive = hexToColor(skinTone).multiplyScalar(0.06)
          child.material.roughness = 0.52
          child.material.metalness = 0.0
          child.material.needsUpdate = true
          break
        }

        // ── Body / Neck / Hands skin
        case 'Wolf3D_Body': {
          child.material = child.material.clone()
          child.material.color = hexToColor(skinTone)
          child.material.roughness = 0.65
          child.material.needsUpdate = true
          break
        }

        // ── Eyes: stay as is, just make sure they render sharp
        case 'EyeLeft':
        case 'EyeRight': {
          child.material = child.material.clone()
          child.material.roughness = 0.1
          child.material.metalness = 0.35
          child.material.needsUpdate = true
          break
        }

        // ── Beard
        case 'Wolf3D_Beard': {
          child.visible = gender === 'male' && hasBeard
          if (child.material) {
            child.material = child.material.clone()
            child.material.color = hexToColor('#2d1e18')
          }
          break
        }

        // ── Headwear (hair) – always visible so the head isn't bald
        case 'Wolf3D_Headwear': {
          child.visible = true
          break
        }

        // ── Outfit Top
        case 'Wolf3D_Outfit_Top': {
          child.material = child.material.clone()
          if (topColor) child.material.color = topColor
          child.material.roughness = 0.72
          child.material.metalness = 0.0
          child.material.map = null   // remove original UV texture so colour is clean
          child.material.needsUpdate = true
          break
        }

        // ── Outfit Bottom
        case 'Wolf3D_Outfit_Bottom': {
          child.material = child.material.clone()
          if (bottomColor) child.material.color = bottomColor
          child.material.roughness = 0.75
          child.material.metalness = 0.0
          child.material.map = null
          child.material.needsUpdate = true
          break
        }

        // ── Footwear
        case 'Wolf3D_Outfit_Footwear': {
          child.material = child.material.clone()
          if (shoeColor) child.material.color = shoeColor
          child.material.roughness = 0.45
          child.material.metalness = 0.15
          child.material.map = null
          child.material.needsUpdate = true
          break
        }

        default: break
      }

      child.castShadow = true
      child.receiveShadow = true
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Convert T-pose → relaxed A-pose by rotating shoulder/arm bones
  // ─────────────────────────────────────────────────────────────────────────
  const applyAPose = (model) => {
    model.traverse((bone) => {
      if (!bone.isObject3D) return
      const n = bone.name

      // Bring both arms down ~45° (rotate Z axis: positive for left, negative for right)
      if (n === 'LeftArm')  bone.rotation.z = -0.52   // ~-30°
      if (n === 'RightArm') bone.rotation.z =  0.52

      // Slightly close the shoulders inward
      if (n === 'LeftShoulder')  bone.rotation.z = -0.12
      if (n === 'RightShoulder') bone.rotation.z =  0.12

      // Slight elbow bend so it looks natural
      if (n === 'LeftForeArm')  bone.rotation.z = -0.18
      if (n === 'RightForeArm') bone.rotation.z =  0.18
    })
  }

  // Re-apply appearance when outfit / skin / gender changes (without re-mounting scene)
  useEffect(() => {
    if (modelRef.current) applyAppearance(modelRef.current)
  }, [currentOutfit, skinTone, gender, hasBeard])

  // ─────────────────────────────────────────────────────────────────────────
  // Mount Three.js scene once
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const W = container.clientWidth  || window.innerWidth
    const H = container.clientHeight || 560

    // ── Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x09090e)
    scene.fog = new THREE.FogExp2(0x09090e, 0.07)

    // ── Camera
    const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 50)
    camera.position.set(0, 1.2, 3.0)

    // ── Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    container.appendChild(renderer.domElement)

    // ── Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping    = true
    controls.dampingFactor    = 0.06
    controls.maxPolarAngle    = Math.PI / 2 - 0.02
    controls.minDistance      = 1.4
    controls.maxDistance      = 5.0
    controls.target.set(0, 1.1, 0)

    // ── Lighting (luxury studio setup)
    scene.add(new THREE.AmbientLight(0xfff8f0, 0.9))

    const key = new THREE.SpotLight(0xfff5e8, 6.0)
    key.position.set(1.8, 4.5, 2.8)
    key.angle = Math.PI / 5
    key.penumbra = 0.7
    key.castShadow = true
    scene.add(key)

    const fill = new THREE.DirectionalLight(0xd0d8e8, 1.8)
    fill.position.set(-2.5, 2, 1.5)
    scene.add(fill)

    const rim = new THREE.PointLight(0xa78bfa, 4, 9)
    rim.position.set(-1.8, 2.8, -2.2)
    scene.add(rim)

    const ground = new THREE.PointLight(0xd4af37, 2.2, 4.5)
    ground.position.set(0, 0.2, 1)
    scene.add(ground)

    // ── Pedestal
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x15151e, metalness: 0.88, roughness: 0.22 })
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.98, 0.08, 56), pedestalMat)
    pedestal.position.set(0, 0.04, 0)
    pedestal.receiveShadow = true
    scene.add(pedestal)

    const ringMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.92, roughness: 0.18 })
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.016, 16, 72), ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.set(0, 0.085, 0)
    scene.add(ring)

    // ── Load model
    const loader = new GLTFLoader()
    setModelLoading(true)

    loader.load(
      '/models/readyplayer.me.glb',
      (gltf) => {
        const model = gltf.scene
        model.position.set(0, 0.08, 0)
        model.scale.set(0.95, 0.95, 0.95)

        // Apply relaxed A-pose first
        applyAPose(model)

        // Apply colours / materials
        applyAppearance(model)

        scene.add(model)
        modelRef.current = model
        setModelLoading(false)
      },
      undefined,
      (err) => {
        console.error('Model load error:', err)
        setModelLoading(false)
      }
    )

    // ── Render loop
    let animId
    const clock = clockRef.current
    const tick = () => {
      animId = requestAnimationFrame(tick)
      if (mixerRef.current) mixerRef.current.update(clock.getDelta())
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    // ── Resize
    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(animId)
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // Skin tone palette
  // ─────────────────────────────────────────────────────────────────────────
  const TONES = [
    { name: 'Porselen',   hex: '#f9d8c4' },
    { name: 'Açık Bej',   hex: '#e8c49a' },
    { name: 'Sıcak Bej',  hex: '#d4a373' },
    { name: 'Bronz',      hex: '#b07740' },
    { name: 'Esmer',      hex: '#7d4520' },
    { name: 'Abanoz',     hex: '#4a2010' },
  ]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 520, overflow: 'hidden' }}>
      {/* WebGL Canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Loading */}
      {modelLoading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(9,9,14,0.88)', backdropFilter: 'blur(14px)', zIndex: 10, gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '3px solid rgba(212,175,55,0.18)', borderTopColor: '#d4af37',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            Manken hazırlanıyor…
          </p>
        </div>
      )}

      {/* Top-left: hint */}
      <div style={{
        position: 'absolute', top: 14, left: 14,
        display: 'flex', alignItems: 'center', gap: 7,
        background: 'rgba(10,10,16,0.72)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20,
        padding: '5px 13px', fontSize: 11, fontWeight: 600,
        color: 'var(--text-secondary)', pointerEvents: 'none',
      }}>
        <span style={{ color: '#d4af37' }}>🔄</span> 360° Döndür
      </div>

      {/* Top-right: profile badge + settings */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, zIndex: 6,
      }}>
        {/* Badge */}
        <div
          onClick={() => setShowAvatarSettings(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: 'rgba(10,10,16,0.86)', backdropFilter: 'blur(18px)',
            border: '1px solid rgba(212,175,55,0.38)', borderRadius: 30,
            padding: '4px 13px 4px 5px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.55)', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {facePhoto ? (
            <img
              src={facePhoto} alt="Profil"
              style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid #d4af37' }}
            />
          ) : (
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg,#8b5cf6,#d4af37)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>👤</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {avatarConfig?.name || 'Senin Stilin'}
            </span>
            <span style={{ fontSize: 10, color: '#d4af37', fontWeight: 600 }}>
              ⚙️ Özelleştir
            </span>
          </div>
        </div>

        {/* Quick Settings Panel */}
        {showAvatarSettings && (
          <div className="fade-in" style={{
            background: 'rgba(14,14,22,0.97)', backdropFilter: 'blur(22px)',
            border: '1px solid rgba(255,255,255,0.14)', borderRadius: 18,
            padding: 16, width: 220,
            boxShadow: '0 18px 40px rgba(0,0,0,0.7)',
            display: 'flex', flexDirection: 'column', gap: 13,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#d4af37' }}>
              Manken Kişiselleştirme
            </div>

            {/* Gender */}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Manken Tarzı
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[['male','👨 Erkek'],['female','👩 Kadın']].map(([val, label]) => (
                  <button key={val} type="button"
                    onClick={() => setAvatarConfig({ gender: val, ...(val === 'female' ? { hasBeard: false } : {}) })}
                    style={{
                      padding: '6px 8px', borderRadius: 8, border: '1px solid',
                      borderColor: gender === val ? '#d4af37' : 'rgba(255,255,255,0.1)',
                      background: gender === val ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                      color: gender === val ? '#d4af37' : '#fff',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Beard (male only) */}
            {gender === 'male' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#fff' }}>Sakal</span>
                <button type="button"
                  onClick={() => setAvatarConfig({ hasBeard: !hasBeard })}
                  style={{
                    padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)',
                    background: hasBeard ? 'rgba(212,175,55,0.2)' : 'transparent',
                    color: hasBeard ? '#d4af37' : 'var(--text-secondary)',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}
                >{hasBeard ? 'Açık' : 'Kapalı'}</button>
              </div>
            )}

            {/* Skin tones */}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 7 }}>
                Ten Tonu
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {TONES.map(t => (
                  <button key={t.hex} type="button" title={t.name}
                    onClick={() => setAvatarConfig({ skinTone: t.hex })}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', background: t.hex,
                      border: skinTone === t.hex ? '2.5px solid #fff' : '1px solid rgba(0,0,0,0.5)',
                      boxShadow: skinTone === t.hex ? '0 0 0 2px #d4af37' : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <button type="button"
              onClick={() => setShowAvatarSettings(false)}
              style={{
                padding: '6px', borderRadius: 8,
                background: 'rgba(255,255,255,0.07)', border: 'none',
                color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
              }}
            >Kapat</button>
          </div>
        )}
      </div>
    </div>
  )
}
