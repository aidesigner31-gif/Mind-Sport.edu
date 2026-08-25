import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Send, Delete } from 'lucide-react';
import { LEDTheme, FlashCardToken } from '../types';
import { soundEngine } from '../utils/audio';

interface ThreeBoxingMachineProps {
  theme?: LEDTheme;
  activeToken?: FlashCardToken | null;
  userInputDigits?: string;
  comboCount?: number;
  timeRemaining?: number;
  timeMax?: number;
  onPunchDigit?: (digit: number) => void;
  onSubmitAnswer?: () => void;
  onToggleMinus?: () => void;
  onClear?: () => void;
  highlightDigits?: number[];
  flashStatus?: 'idle' | 'correct' | 'wrong';
  cameraAngle?: 'broadcast' | 'frontal' | 'close-up';
  labelTitle?: string;
  interactive?: boolean;
  isSubmitted?: boolean;
}

export const ThreeBoxingMachine: React.FC<ThreeBoxingMachineProps> = ({
  theme = 'cyber-neon',
  activeToken = null,
  userInputDigits = '',
  comboCount = 0,
  timeRemaining = 10,
  timeMax = 10,
  onPunchDigit,
  onSubmitAnswer,
  onToggleMinus,
  onClear,
  highlightDigits = [],
  flashStatus = 'idle',
  cameraAngle = 'frontal',
  labelTitle = 'Mind Sport',
  interactive = true,
  isSubmitted = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredPad, setHoveredPad] = useState<number | null>(null);
  const [webglFailed, setWebglFailed] = useState<boolean>(false);

  // References to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const padMeshesRef = useRef<{ [key: number]: THREE.Group }>({});
  const padLightMapRef = useRef<{ [key: number]: THREE.PointLight }>({});
  const padMaterialsRef = useRef<{ [key: number]: THREE.MeshStandardMaterial }>({});
  const ledRingMaterialsRef = useRef<{ [key: number]: THREE.MeshBasicMaterial }>({});
  const chassisLedRingRef = useRef<THREE.Mesh | null>(null);
  const particlesGroupRef = useRef<THREE.Points | null>(null);

  // LED Colors based on Theme
  const getThemeColors = (t: LEDTheme | string) => {
    switch (t) {
      case 'olympic-gold':
        return { primary: 0xffd700, secondary: 0xff8c00, ambient: 0x221a00 };
      case 'laser-purple':
        return { primary: 0x9d4edd, secondary: 0xf72585, ambient: 0x190028 };
      case 'emerald-boost':
        return { primary: 0x00f5d4, secondary: 0x52b788, ambient: 0x00281b };
      case 'fire-red':
        return { primary: 0xff0055, secondary: 0xff5400, ambient: 0x280005 };
      case 'cyber-neon':
      default:
        return { primary: 0x00f0ff, secondary: 0x7000ff, ambient: 0x001020 };
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07090e); // Dark futuristic arena fog
    scene.fog = new THREE.FogExp2(0x07090e, 0.035);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    const initialAspect = width / height;
    const initialZ = initialAspect < 1.2 ? 8.6 * (1.2 / Math.max(0.6, initialAspect)) : 8.0;
    camera.position.set(0, 0, initialZ);

    // 3. Check WebGL support safely before creating renderer
    const checkWebGLSupport = () => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
        return !!(window.WebGLRenderingContext && gl);
      } catch (e) {
        return false;
      }
    };

    if (!checkWebGLSupport()) {
      setWebglFailed(true);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      setWebglFailed(true);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const themeCols = getThemeColors(theme);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backRimLight = new THREE.DirectionalLight(themeCols.primary, 1.5);
    backRimLight.position.set(-5, -3, -4);
    scene.add(backRimLight);

    // 5. Build Hardware Chassis
    const machineGroup = new THREE.Group();
    scene.add(machineGroup);

    // Main Octagonal/Circular Body Backplate (Heavy duty dark composite plastic)
    const chassisGeo = new THREE.CylinderGeometry(2.85, 3.0, 0.35, 32);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x12151c,
      roughness: 0.25,
      metalness: 0.8,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.rotation.x = Math.PI / 2;
    chassisMesh.receiveShadow = true;
    chassisGroupAdd(machineGroup, chassisMesh);

    // Outer Chrome Bezel
    const bezelGeo = new THREE.TorusGeometry(3.02, 0.07, 16, 64);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x556070, metalness: 0.9, roughness: 0.1 });
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    machineGroup.add(bezelMesh);

    // RGB Outer Ring Accent
    const ledOuterRingGeo = new THREE.TorusGeometry(2.92, 0.05, 16, 64);
    const ledOuterRingMat = new THREE.MeshBasicMaterial({ color: themeCols.primary });
    const ledOuterRingMesh = new THREE.Mesh(ledOuterRingGeo, ledOuterRingMat);
    chassisLedRingRef.current = ledOuterRingMesh;
    machineGroup.add(ledOuterRingMesh);

    // Center Display Panel Screen Box
    const screenBoxGeo = new THREE.CylinderGeometry(1.0, 1.05, 0.18, 32);
    const screenBoxMat = new THREE.MeshStandardMaterial({ color: 0x05070a, metalness: 0.9, roughness: 0.1 });
    const screenBoxMesh = new THREE.Mesh(screenBoxGeo, screenBoxMat);
    screenBoxMesh.rotation.x = Math.PI / 2;
    screenBoxMesh.position.z = 0.15;
    machineGroup.add(screenBoxMesh);

    // 6. 10 Number Target Silicone Pads (0 - 9)
    // Arranged strictly in a perfect circle around center display
    const radius = 1.92;
    const numberPads = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    const totalPads = numberPads.length;

    numberPads.forEach((num, index) => {
      const padGroup = new THREE.Group();

      // 1..9, 0 spread radially clockwise in a perfect 360° circle starting at 12 o'clock (top)
      const angle = Math.PI / 2 - (index * 2 * Math.PI) / totalPads;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      padGroup.position.set(x, y, 0.2);

      // Pad Silicone Cushion
      const padGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.16, 32);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x1f2430,
        roughness: 0.3,
        metalness: 0.2,
      });
      const padMesh = new THREE.Mesh(padGeo, padMat);
      padMesh.rotation.x = Math.PI / 2;
      padMesh.castShadow = true;
      padGroup.add(padMesh);

      // Pad RGB LED Ring Surrounding Pad
      const ringGeo = new THREE.TorusGeometry(0.46, 0.035, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x334455 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      padGroup.add(ringMesh);

      // Pad Number Label Text (Canvas Texture mapping)
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // High contrast circular background
        ctx.beginPath();
        ctx.arc(128, 128, 116, 0, Math.PI * 2);
        ctx.fillStyle = '#080c16';
        ctx.fill();
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#00f0ff';
        ctx.stroke();

        // Inner glowing ring
        ctx.beginPath();
        ctx.arc(128, 128, 96, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.stroke();

        // Bold Crisp Number Text with High Contrast Fill
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 130px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.fillText(String(num), 128, 128);
      }

      const numTexture = new THREE.CanvasTexture(canvas);
      numTexture.needsUpdate = true;
      const numGeo = new THREE.PlaneGeometry(0.66, 0.66);
      const numMat = new THREE.MeshBasicMaterial({ map: numTexture, transparent: true });
      const numMesh = new THREE.Mesh(numGeo, numMat);
      numMesh.position.z = 0.11;
      padGroup.add(numMesh);

      // Dedicated Point Light for pad activation
      const padLight = new THREE.PointLight(themeCols.primary, 0, 2.5);
      padLight.position.set(0, 0, 0.3);
      padGroup.add(padLight);

      // Register references for interactivity and animations
      padGroup.userData = { digit: num };
      machineGroup.add(padGroup);

      padMeshesRef.current[num] = padGroup;
      padLightMapRef.current[num] = padLight;
      padMaterialsRef.current[num] = padMat;
      ledRingMaterialsRef.current[num] = ringMat;
    });

    // 7. Background Particles (Sports Arena Sparkles)
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 15;
      particlePositions[i + 1] = (Math.random() - 0.5) * 15;
      particlePositions[i + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      color: themeCols.primary,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesGroupRef.current = particles;

    // Helper to safely add to machine group
    function chassisGroupAdd(parent: THREE.Group, child: THREE.Mesh) {
      parent.add(child);
    }

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating/breathing machine sway
      machineGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.04;
      machineGroup.rotation.x = Math.cos(elapsedTime * 0.6) * 0.02;

      // Rotate background particle field
      if (particlesGroupRef.current) {
        particlesGroupRef.current.rotation.y = elapsedTime * 0.03;
      }

      // RGB Ring Color Cycling
      if (chassisLedRingRef.current) {
        const ringMat = chassisLedRingRef.current.material as THREE.MeshBasicMaterial;
        ringMat.color.setHSL((elapsedTime * 0.1) % 1, 0.9, 0.5);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler with ResizeObserver
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth || 800;
      const h = mountRef.current.clientHeight || 500;
      const aspect = w / h;
      cameraRef.current.aspect = aspect;

      if (cameraAngle === 'frontal') {
        const targetZ = aspect < 1.2 ? 8.6 * (1.2 / Math.max(0.6, aspect)) : 8.0;
        cameraRef.current.position.set(0, 0, targetZ);
        cameraRef.current.lookAt(0, 0, 0);
      }

      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [theme]);

  // Handle Raycasting & Punch Click Interaction
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !mountRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    for (let hit of intersects) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr && curr.parent && curr.parent.type !== 'Scene') {
        if (curr.userData && typeof curr.userData.digit === 'number') {
          const digit = curr.userData.digit;
          triggerPunchAnimation(digit);
          if (onPunchDigit) {
            onPunchDigit(digit);
          }
          return;
        }
        curr = curr.parent;
      }
    }
  };

  // Physical 3D Punch Compression Animation & Light Burst Effect
  const triggerPunchAnimation = (digit: number) => {
    const padGroup = padMeshesRef.current[digit];
    const padLight = padLightMapRef.current[digit];
    const ringMat = ledRingMaterialsRef.current[digit];

    soundEngine.playPunchImpact(1.0);

    if (padGroup) {
      // Depress pad backwards in Z axis
      const originalZ = 0.2;
      padGroup.position.z = -0.05;

      if (padLight) padLight.intensity = 4.0;
      if (ringMat) ringMat.color.setHex(0xffffff);

      setTimeout(() => {
        padGroup.position.z = originalZ;
        if (padLight) padLight.intensity = 0;
        if (ringMat) ringMat.color.setHex(0x334455);
      }, 140);
    }
  };

  // Update LED Lights when activeToken or highlightDigits change
  useEffect(() => {
    Object.keys(padLightMapRef.current).forEach((key) => {
      const d = Number(key);
      const light = padLightMapRef.current[d];
      const ringMat = ledRingMaterialsRef.current[d];

      const isHighlighted = highlightDigits.includes(d);

      if (flashStatus === 'correct') {
        if (light) light.color.setHex(0x00ff66);
        if (light) light.intensity = 3.5;
        if (ringMat) ringMat.color.setHex(0x00ff66);
      } else if (flashStatus === 'wrong') {
        if (light) light.color.setHex(0xff0044);
        if (light) light.intensity = 3.5;
        if (ringMat) ringMat.color.setHex(0xff0044);
      } else if (isHighlighted) {
        if (light) light.color.setHex(0x00f0ff);
        if (light) light.intensity = 2.5;
        if (ringMat) ringMat.color.setHex(0x00f0ff);
      } else {
        if (light) light.intensity = 0;
        if (ringMat) ringMat.color.setHex(0x334455);
      }
    });
  }, [highlightDigits, flashStatus]);

  // Adjust Camera Position based on cameraAngle
  useEffect(() => {
    if (!cameraRef.current || !mountRef.current) return;
    const cam = cameraRef.current;
    const w = mountRef.current.clientWidth || 800;
    const h = mountRef.current.clientHeight || 500;
    const aspect = w / h;

    if (cameraAngle === 'broadcast') {
      cam.position.set(2.0, 1.2, 8.8);
      cam.lookAt(0, 0, 0);
    } else if (cameraAngle === 'close-up') {
      cam.position.set(0, 0, 5.8);
      cam.lookAt(0, 0, 0);
    } else {
      // Frontal
      const targetZ = aspect < 1.2 ? 8.6 * (1.2 / Math.max(0.6, aspect)) : 8.0;
      cam.position.set(0, 0, targetZ);
      cam.lookAt(0, 0, 0);
    }
  }, [cameraAngle]);

  return (
    <div className="relative w-full h-full min-h-[360px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col items-center justify-center select-none">
      {/* Top Floating Machine Status Overlay */}
      <div className="absolute top-4 left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/30">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_#00f0ff]" />
          <span className="text-xs font-bold tracking-widest text-cyan-300 uppercase">{labelTitle}</span>
        </div>

        {comboCount > 1 && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-4 py-1.5 rounded-full text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-bounce">
            🔥 {comboCount}x COMBO MULTIPLIER!
          </div>
        )}
      </div>

      {/* Center 3D WebGL Canvas or 2D Radial Fallback */}
      {webglFailed ? (
        <div className="relative w-full h-full min-h-[360px] flex items-center justify-center p-4">
          {/* Radial Circular Machine Layout for 2D Fallback */}
          <div className="relative w-[310px] h-[310px] sm:w-[380px] sm:h-[380px] rounded-full border-4 border-cyan-500/40 bg-slate-900/90 shadow-[0_0_50px_rgba(0,240,255,0.2)] flex items-center justify-center">
            {/* Outer LED Glow Ring */}
            <div className="absolute inset-2 rounded-full border-2 border-purple-500/30 animate-pulse pointer-events-none" />

            {/* Circular Punch Pads 1..9, 0 */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num, idx) => {
              const total = 10;
              const angleDeg = 90 - (idx * 360) / total;
              const rad = (angleDeg * Math.PI) / 180;
              const distancePercent = 38; // Distance from center percentage
              const leftPercent = 50 + distancePercent * Math.cos(rad);
              const topPercent = 50 - distancePercent * Math.sin(rad);

              const isHighlighted = highlightDigits.includes(num);

              return (
                <button
                  key={num}
                  type="button"
                  disabled={!interactive}
                  onClick={() => {
                    soundEngine.playPunchImpact(1.0);
                    if (onPunchDigit) onPunchDigit(num);
                  }}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center font-black text-lg sm:text-2xl transition-all duration-150 active:scale-90 shadow-lg ${
                    flashStatus === 'correct'
                      ? 'border-emerald-400 bg-emerald-500/30 text-white shadow-[0_0_20px_#10b981]'
                      : flashStatus === 'wrong'
                      ? 'border-rose-400 bg-rose-500/30 text-white shadow-[0_0_20px_#f43f5e]'
                      : isHighlighted
                      ? 'border-cyan-400 bg-cyan-500/30 text-cyan-200 shadow-[0_0_20px_#00f0ff]'
                      : 'border-cyan-500/50 bg-slate-950 text-white hover:border-cyan-300 hover:bg-slate-900 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          ref={mountRef}
          onPointerDown={handlePointerDown}
          className="w-full h-full cursor-pointer touch-none"
        />
      )}

      {/* Holographic Center Screen HUD Overlay (Overlaid in middle of machine) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center text-center z-10">
        {(() => {
          // Token formatting
          const rawTokenVal = (activeToken && activeToken.value !== '+' ? activeToken.value : '').trim();
          let displayTokenVal = rawTokenVal.replace(/^\+/, '');
          if (displayTokenVal.startsWith('_')) {
            displayTokenVal = `-${displayTokenVal.slice(1)}`;
          }
          const isTokenNegative = displayTokenVal.startsWith('-');

          // Header Title
          const headerTitle = activeToken && activeToken.value !== '+'
            ? 'SPEED DIGIT'
            : isSubmitted
            ? 'STATUS'
            : 'SPEED DIGIT';

          // Color & Styling Scheme
          let boxBorder = 'border-cyan-400 text-cyan-200 shadow-[0_0_18px_rgba(0,240,255,0.4)]';
          if (flashStatus === 'correct') {
            boxBorder = 'border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]';
          } else if (flashStatus === 'wrong') {
            boxBorder = 'border-rose-400 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.5)]';
          } else if (isSubmitted) {
            boxBorder = 'border-emerald-400 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.4)]';
          } else if (activeToken && isTokenNegative) {
            boxBorder = 'border-rose-400 text-rose-300 shadow-[0_0_18px_rgba(244,63,94,0.4)]';
          }

          // Value inside rectangle
          let displayedValue = '';
          if (activeToken && activeToken.value !== '+') {
            displayedValue = displayTokenVal;
          } else if (isSubmitted) {
            displayedValue = `✓ ${userInputDigits || ''}`;
          } else {
            displayedValue = userInputDigits || '';
          }

          return (
            <div className="flex flex-col items-center">
              {/* Header Label with compact height matching Speed Digit */}
              <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.18em] text-cyan-400 font-black mb-1 drop-shadow-[0_0_6px_#00f0ff] h-3 flex items-center justify-center whitespace-nowrap">
                {headerTitle}
              </div>

              {/* Exact Fixed Shape & Compact Size Speed Digit Rectangle Screen */}
              <div
                className={`relative w-[78px] sm:w-[92px] h-[34px] sm:h-[40px] rounded-lg bg-slate-950/95 border-[1.5px] ${boxBorder} backdrop-blur-2xl font-black text-lg sm:text-2xl tracking-tight flex items-center justify-center select-none transition-colors duration-150`}
              >
                {displayedValue ? (
                  <span className="truncate px-1 drop-shadow-[0_0_8px_currentColor]">
                    {displayedValue}
                  </span>
                ) : (
                  <span className="text-cyan-400/40 text-base sm:text-lg font-black animate-pulse">
                    _
                  </span>
                )}

                {/* Optional Clear Button anchored in corner without changing rectangle size */}
                {!activeToken && !isSubmitted && userInputDigits && onClear && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-rose-400 transition-all pointer-events-auto shadow"
                    title="مسح / Clear"
                  >
                    <Delete className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {/* Quick HUD SUBMIT action control below the fixed rectangle */}
              {interactive && !isSubmitted && onSubmitAnswer && !activeToken && (
                <div className="flex items-center justify-center mt-1 pointer-events-auto h-5">
                  <button
                    type="button"
                    disabled={!userInputDigits}
                    onClick={onSubmitAnswer}
                    className={`px-3 py-0.5 rounded-md border font-black text-[9px] uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 shadow-sm ${
                      !userInputDigits
                        ? 'border-slate-700 text-slate-400 bg-slate-900/80 opacity-50 cursor-not-allowed'
                        : 'border-cyan-400 text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.5)]'
                    }`}
                  >
                    <Send className="w-2 h-2" />
                    SUBMIT
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Circular Countdown Ring Gauge with exact matching width */}
        {timeMax > 0 && (
          <div className="mt-1 w-[78px] sm:w-[92px] bg-slate-950/90 h-1 rounded-full overflow-hidden border border-slate-700/80 shadow-inner">
            <div
              className={`h-full transition-all duration-300 ${
                timeRemaining / timeMax < 0.3 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
              }`}
              style={{ width: `${Math.max(0, (timeRemaining / timeMax) * 100)}%` }}
            />
          </div>
        )}
      </div>

    </div>
  );
};
