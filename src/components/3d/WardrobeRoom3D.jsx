import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useAppStore } from '../../store/useAppStore'

export default function WardrobeRoom3D({ onOpenUpload, selectedOutfit, onDressed }) {
  const mountRef = useRef(null)
  const { wardrobe, profile, avatarConfig } = useAppStore()

  const [doorsOpen, setDoorsOpen] = useState(false)
  const [isDressing, setIsDressing] = useState(false)
  const [activeLook, setActiveLook] = useState(null)
  const [modelLoading, setModelLoading] = useState(true)

  // Three.js references
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const leftDoorRef = useRef(null)
  const rightDoorRef = useRef(null)
  const avatarModelRef = useRef(null)
  const flyingItemRef = useRef(null)
  const wardrobeGroupRef = useRef(null)
  const doorAngleTarget = useRef(0)
  const doorAngleCurrent = useRef(0)
  const animFrameId = useRef(null)

  // Helper to load texture
  const loadTexture = (url) => {
    if (!url) return null
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    return loader.load(url, undefined, undefined, () => null)
  }

  // Initialize selected starter outfit
  useEffect(() => {
    if (selectedOutfit) {
      dressAvatar(selectedOutfit)
    } else if (wardrobe.length > 0) {
      const top = wardrobe.find((i) => i.category === 'tops' || i.category === 'outerwear') || wardrobe[0]
      const bottom = wardrobe.find((i) => i.category === 'bottoms') || wardrobe[1] || wardrobe[0]
      const shoes = wardrobe.find((i) => i.category === 'shoes') || wardrobe[2]
      setActiveLook({ top, bottom, shoes })
    }
  }, [selectedOutfit, wardrobe])

  // Dress the 3D avatar with clothes
  const dressAvatar = useCallback((outfit) => {
    if (!outfit) return
    setIsDressing(true)
    setDoorsOpen(true)
    doorAngleTarget.current = 2.1 // Open wardrobe doors

    const top = outfit.top || (outfit.items ? outfit.items.find(i => i.category === 'tops' || i.category === 'outerwear') : null)
    const bottom = outfit.bottom || (outfit.items ? outfit.items.find(i => i.category === 'bottoms') : null)
    const shoes = outfit.shoes || (outfit.items ? outfit.items.find(i => i.category === 'shoes') : null)

    // Trigger floating clothes animation
    if (flyingItemRef.current) {
      flyingItemRef.current.visible = true
      flyingItemRef.current.position.set(-1.8, 1.4, 0.4)
      flyingItemRef.current.scale.set(0.1, 0.1, 0.1)
    }

    let progress = 0
    const flightInterval = setInterval(() => {
      progress += 0.04
      if (flyingItemRef.current) {
        // Fly from wardrobe (-1.8, 1.4, 0.4) to avatar (1.6, 1.3, 0.3)
        const x = THREE.MathUtils.lerp(-1.8, 1.6, Math.min(progress, 1))
        const y = 1.4 + Math.sin(progress * Math.PI) * 0.7
        const z = THREE.MathUtils.lerp(0.4, 0.3, Math.min(progress, 1))
        flyingItemRef.current.position.set(x, y, z)
        flyingItemRef.current.rotation.y += 0.12
        const scale = THREE.MathUtils.lerp(0.2, 0.7, Math.min(progress * 1.5, 1))
        flyingItemRef.current.scale.set(scale, scale, scale)
      }

      if (progress >= 1) {
        clearInterval(flightInterval)
        if (flyingItemRef.current) flyingItemRef.current.visible = false
        setIsDressing(false)

        // Apply realistic outfit tint to the 3D model
        if (avatarModelRef.current) {
          let topTex = top?.imageUrl ? loadTexture(top.imageUrl) : null
          avatarModelRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
              // Tint clothing meshes gracefully
              if (topTex && (child.name.toLowerCase().includes('top') || child.name.toLowerCase().includes('shirt') || child.name.toLowerCase().includes('body'))) {
                child.material.map = topTex
                child.material.needsUpdate = true
              }
            }
          })
        }

        setActiveLook({ top, bottom, shoes })
        if (onDressed) onDressed({ top, bottom, shoes })
      }
    }, 20)
  }, [onDressed])

  // Toggle doors open/close
  const toggleDoors = () => {
    const nextState = !doorsOpen
    setDoorsOpen(nextState)
    doorAngleTarget.current = nextState ? 2.1 : 0
  }

  // Build the entire 3D Scene
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || 500

    // 1. Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x07070b)
    scene.fog = new THREE.FogExp2(0x07070b, 0.07)
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 1.8, 5.8)

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 - 0.02
    controls.minDistance = 3.2
    controls.maxDistance = 8.5
    controls.target.set(0, 1.2, 0)

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.8)
    scene.add(ambientLight)

    // Spot over wardrobe
    const wardrobeSpot = new THREE.SpotLight(0xffecd2, 4.5)
    wardrobeSpot.position.set(-1.8, 4.5, 1.8)
    wardrobeSpot.target.position.set(-1.8, 1.2, 0)
    wardrobeSpot.angle = Math.PI / 5
    wardrobeSpot.penumbra = 0.6
    wardrobeSpot.castShadow = true
    scene.add(wardrobeSpot)
    scene.add(wardrobeSpot.target)

    // Spot over avatar
    const avatarSpot = new THREE.SpotLight(0xffffff, 5.5)
    avatarSpot.position.set(1.6, 4.5, 2.2)
    avatarSpot.target.position.set(1.6, 1.1, 0)
    avatarSpot.angle = Math.PI / 4.5
    avatarSpot.penumbra = 0.5
    avatarSpot.castShadow = true
    scene.add(avatarSpot)
    scene.add(avatarSpot.target)

    // Violet & gold rim accents
    const rimLight = new THREE.PointLight(0x8b5cf6, 3.5, 10)
    rimLight.position.set(0, 3.5, -2)
    scene.add(rimLight)

    // 6. Floor (Dark polished marble)
    const floorGeo = new THREE.PlaneGeometry(16, 16)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c11,
      roughness: 0.2,
      metalness: 0.5,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    // Back wall with luxury panels
    const backWallGeo = new THREE.PlaneGeometry(16, 8)
    const backWallMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.8 })
    const backWall = new THREE.Mesh(backWallGeo, backWallMat)
    backWall.position.set(0, 4, -2.5)
    scene.add(backWall)

    // Brass trim line on back wall
    const brassTrimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.2 })
    const brassTrim = new THREE.Mesh(new THREE.BoxGeometry(16, 0.04, 0.02), brassTrimMat)
    brassTrim.position.set(0, 2.2, -2.48)
    scene.add(brassTrim)

    // ==========================================
    // 7. LUXURY 3D WARDROBE (Gardırop)
    // ==========================================
    const wardrobeGroup = new THREE.Group()
    wardrobeGroup.position.set(-1.6, 0, 0)
    scene.add(wardrobeGroup)
    wardrobeGroupRef.current = wardrobeGroup

    const wWidth = 1.9
    const wHeight = 2.8
    const wDepth = 0.95
    const wardrobeMat = new THREE.MeshStandardMaterial({ color: 0x18181f, roughness: 0.4, metalness: 0.2 })

    // Frame
    const wBack = new THREE.Mesh(new THREE.BoxGeometry(wWidth, wHeight, 0.06), wardrobeMat)
    wBack.position.set(0, wHeight / 2, -wDepth / 2)
    wBack.castShadow = true
    wardrobeGroup.add(wBack)

    const wLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, wHeight, wDepth), wardrobeMat)
    wLeft.position.set(-wWidth / 2, wHeight / 2, 0)
    wLeft.castShadow = true
    wardrobeGroup.add(wLeft)

    const wRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, wHeight, wDepth), wardrobeMat)
    wRight.position.set(wWidth / 2, wHeight / 2, 0)
    wRight.castShadow = true
    wardrobeGroup.add(wRight)

    const wTop = new THREE.Mesh(new THREE.BoxGeometry(wWidth, 0.06, wDepth), wardrobeMat)
    wTop.position.set(0, wHeight, 0)
    wardrobeGroup.add(wTop)

    const wBottom = new THREE.Mesh(new THREE.BoxGeometry(wWidth, 0.12, wDepth), wardrobeMat)
    wBottom.position.set(0, 0.06, 0)
    wardrobeGroup.add(wBottom)

    const wShelf = new THREE.Mesh(new THREE.BoxGeometry(wWidth - 0.08, 0.04, wDepth - 0.1), wardrobeMat)
    wShelf.position.set(0, 0.75, 0)
    wardrobeGroup.add(wShelf)

    // Rail
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 })
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, wWidth - 0.12, 16), railMat)
    rail.rotation.z = Math.PI / 2
    rail.position.set(0, wHeight - 0.35, 0)
    wardrobeGroup.add(rail)

    // Hanging clothes
    const clothesColors = [0xf8fafc, 0x18181b, 0x2563eb, 0x8b5cf6, 0xd4af37]
    clothesColors.forEach((col, idx) => {
      const clothGeo = new THREE.BoxGeometry(0.08, 1.0, 0.45)
      const clothMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 })
      const cloth = new THREE.Mesh(clothGeo, clothMat)
      cloth.position.set(-0.6 + idx * 0.3, wHeight - 0.95, 0)
      cloth.castShadow = true
      wardrobeGroup.add(cloth)
    })

    // Interior Warm LED
    const interiorLight = new THREE.PointLight(0xffdfa9, 2.8, 3.5)
    interiorLight.position.set(0, wHeight - 0.2, 0.1)
    wardrobeGroup.add(interiorLight)

    // Doors
    const doorWidth = wWidth / 2 - 0.02
    const doorHeight = wHeight - 0.14
    const doorThickness = 0.04

    const doorMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a24,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.65,
      transparent: true,
      opacity: 0.85,
      ior: 1.5,
    })

    // Left Door
    const leftDoorPivot = new THREE.Group()
    leftDoorPivot.position.set(-wWidth / 2, 0, wDepth / 2)
    wardrobeGroup.add(leftDoorPivot)
    leftDoorRef.current = leftDoorPivot

    const leftDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness), doorMat)
    leftDoorMesh.position.set(doorWidth / 2, doorHeight / 2 + 0.08, 0)
    leftDoorMesh.castShadow = true
    leftDoorPivot.add(leftDoorMesh)

    const leftHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 16), railMat)
    leftHandle.position.set(doorWidth - 0.06, doorHeight / 2 + 0.08, 0.05)
    leftDoorPivot.add(leftHandle)

    // Right Door
    const rightDoorPivot = new THREE.Group()
    rightDoorPivot.position.set(wWidth / 2, 0, wDepth / 2)
    wardrobeGroup.add(rightDoorPivot)
    rightDoorRef.current = rightDoorPivot

    const rightDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness), doorMat)
    rightDoorMesh.position.set(-doorWidth / 2, doorHeight / 2 + 0.08, 0)
    rightDoorMesh.castShadow = true
    rightDoorPivot.add(rightDoorMesh)

    const rightHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 16), railMat)
    rightHandle.position.set(-doorWidth + 0.06, doorHeight / 2 + 0.08, 0.05)
    rightDoorPivot.add(rightHandle)

    // ==========================================
    // 8. REALISTIC 3D GLTF MODEL & PEDESTAL
    // ==========================================
    const standMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.1, 36), standMat)
    stand.position.set(1.6, 0.05, 0.2)
    stand.receiveShadow = true
    scene.add(stand)

    // Load Realistic glTF Model
    const gltfLoader = new GLTFLoader()
    setModelLoading(true)

    gltfLoader.load(
      '/models/Michelle.glb',
      (gltf) => {
        const model = gltf.scene
        model.position.set(1.6, 0.1, 0.2)

        // Scale by avatarConfig
        const sw = avatarConfig?.shoulderWidth || 1.0
        const hr = avatarConfig?.heightRatio || 1.0
        model.scale.set(sw, hr, (sw + 1) / 2)

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        scene.add(model)
        avatarModelRef.current = model
        setModelLoading(false)
      },
      undefined,
      () => {
        // Fallback to Xbot if Michelle fails
        gltfLoader.load('/models/Xbot.glb', (xGltf) => {
          const xModel = xGltf.scene
          xModel.position.set(1.6, 0.1, 0.2)
          xModel.scale.set(0.011, 0.011, 0.011)
          scene.add(xModel)
          avatarModelRef.current = xModel
          setModelLoading(false)
        })
      }
    )

    // ==========================================
    // 9. FLYING CLOTHES MESH (Dolaptan süzülen efekt)
    // ==========================================
    const flyingGeo = new THREE.BoxGeometry(0.45, 0.65, 0.08)
    const flyingMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.6,
      metalness: 0.5,
      roughness: 0.3,
    })
    const flyingMesh = new THREE.Mesh(flyingGeo, flyingMat)
    flyingMesh.visible = false
    scene.add(flyingMesh)
    flyingItemRef.current = flyingMesh

    // ==========================================
    // 10. ANIMATION LOOP
    // ==========================================
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate)

      // Smooth door rotation
      doorAngleCurrent.current = THREE.MathUtils.lerp(
        doorAngleCurrent.current,
        doorAngleTarget.current,
        0.08
      )
      if (leftDoorRef.current) {
        leftDoorRef.current.rotation.y = -doorAngleCurrent.current
      }
      if (rightDoorRef.current) {
        rightDoorRef.current.rotation.y = doorAngleCurrent.current
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle Resize
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
      cancelAnimationFrame(animFrameId.current)
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [avatarConfig])

  const faceImg = avatarConfig?.facePhoto || profile?.facePhotoUrl

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 460, overflow: 'hidden' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Floating Modern Header Info */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: 'rgba(10, 10, 14, 0.75)',
          backdropFilter: 'blur(16px)',
          padding: '8px 14px',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'auto',
        }}>
          <span className="font-editorial" style={{ fontSize: 9, color: 'var(--accent-gold)', display: 'block', fontWeight: 700 }}>
            3D VIRTUAL ATELIER
          </span>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 1 }}>
            {doorsOpen ? '🚪 Gardırop Açık' : '🚪 Gardırop Kapalı'}
          </div>
        </div>

        {/* User Authentic Face Mirror Disc */}
        {faceImg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(10, 10, 14, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(230, 198, 135, 0.3)',
            borderRadius: 24,
            padding: '4px 12px 4px 6px',
            pointerEvents: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}>
            <img
              src={faceImg}
              alt="Yüz"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid var(--accent-gold)',
              }}
            />
            <div>
              <span style={{ fontSize: 9, color: 'var(--accent-gold)', fontWeight: 700, display: 'block' }}>
                SENİN YÜZÜN
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                {avatarConfig?.name || 'Stil Sahibi'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Model Loading State */}
      {modelLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(8, 8, 12, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          zIndex: 5,
        }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <span style={{ color: 'var(--accent-gold)', fontSize: 13, fontWeight: 600 }}>
            Gerçekçi 3D Model & Gardırop Yükleniyor...
          </span>
        </div>
      )}

      {/* Dressing Status Notification */}
      {isDressing && (
        <div style={{
          position: 'absolute',
          top: 76,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 15, 22, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(230, 198, 135, 0.4)',
          borderRadius: 20,
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          zIndex: 10,
        }}>
          <div className="spinner" style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: 12, color: 'var(--accent-gold)', fontWeight: 600 }}>
            Dolaptan parçalar uçarak giydiriliyor...
          </span>
        </div>
      )}

      {/* Floating 3D Action Controls */}
      <div style={{
        position: 'absolute',
        bottom: 18,
        left: 16,
        right: 16,
        display: 'flex',
        gap: 8,
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}>
        <button
          onClick={toggleDoors}
          className="btn btn-secondary"
          style={{
            flex: 1,
            padding: '12px 14px',
            fontSize: 12,
            borderRadius: 14,
            background: 'rgba(18, 18, 24, 0.85)',
          }}
        >
          {doorsOpen ? '🚪 Dolabı Kapat' : '🚪 Dolabı Aç'}
        </button>

        <button
          onClick={() => {
            if (wardrobe.length >= 2) {
              const randomTop = wardrobe.find(i => i.category === 'tops' || i.category === 'outerwear') || wardrobe[0]
              const randomBottom = wardrobe.find(i => i.category === 'bottoms') || wardrobe[1]
              dressAvatar({ top: randomTop, bottom: randomBottom, shoes: wardrobe[2] })
            } else {
              dressAvatar(activeLook)
            }
          }}
          disabled={isDressing}
          className="btn btn-primary"
          style={{
            flex: 1.3,
            padding: '12px 14px',
            fontSize: 12,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #d4af37 100%)',
          }}
        >
          ✨ Kombini Giydir
        </button>
      </div>
    </div>
  )
}
