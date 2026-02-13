/**
 * 深海場景 - THE ABYSS 主題
 * @module components/three/AbyssScene
 *
 * @description
 * 包含呼吸脈動的水母球體和互動浮游生物粒子效果
 * 滑鼠移動會驅離粒子，攝影機會輕微晃動
 */

import React, { useEffect, useRef } from "react";

interface AbyssSceneProps {
  className?: string;
}

/**
 * AbyssScene 元件 - 深海 Three.js 場景
 * Three.js 透過動態 import 延遲載入，確保 SSR 安全
 *
 * @param {AbyssSceneProps} props - 元件屬性
 * @returns {JSX.Element} 深海場景
 */
const AbyssScene: React.FC<AbyssSceneProps> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<unknown>(null);
  const rendererRef = useRef<unknown>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false; // StrictMode 防重複掛載旗標

    // 動態載入 Three.js + 後處理（僅在客戶端執行）
    Promise.all([
      import("three"),
      import("three/addons/postprocessing/EffectComposer.js"),
      import("three/addons/postprocessing/RenderPass.js"),
      import("three/addons/postprocessing/UnrealBloomPass.js"),
    ]).then(([THREE, { EffectComposer }, { RenderPass }, { UnrealBloomPass }]) => {
      // StrictMode 清理後不再繼續
      if (cancelled || !containerRef.current) return;

      // Scene Setup
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000205, 0.015);
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
      );
      camera.position.z = 20;

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // === Bloom 後處理 - 微量眩光 ===
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.65,  // strength - 適度光暈
        0.5,   // radius - 柔和擴散
        0.25,  // threshold - 只讓亮部發光
      );
      composer.addPass(bloomPass);

      // Jellyfish Sphere with Shader - 金色呼吸燈
      const jellyfishGeo = new THREE.SphereGeometry(8, 64, 64);
      const jellyfishMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0xffd700) }, // 金色
        },
        wireframe: true,
        transparent: true,
        vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          // Pulse breathing
          float pulse = sin(uTime * 0.5) * 0.5 + 1.0;
          // Surface ripple
          float ripple = sin(pos.x * 2.0 + uTime) * sin(pos.y * 2.0 + uTime) * 0.5;
          pos += normal * (ripple + pulse * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
        fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        void main() {
          // 呼吸燈：亮度 1.0~1.8 脈動 + bloom feed，alpha 0.55~0.9 脈動
          float breath = sin(uTime * 1.2) * 0.5 + 0.5;
          float glow = mix(1.0, 1.8, breath);
          float alpha = mix(0.55, 0.9, breath);
          gl_FragColor = vec4(uColor * glow, alpha);
        }
      `,
      });
      const jellyfish = new THREE.Mesh(jellyfishGeo, jellyfishMat);
      scene.add(jellyfish);

      // 手機版球體依螢幕寬度分級縮小
      const SMALL_MOBILE = 480;
      const MOBILE_BREAKPOINT = 768;

      const getJellyfishScale = () => {
        const w = window.innerWidth;
        if (w < SMALL_MOBILE) return 0.45; // iPhone SE 等極小螢幕
        if (w < MOBILE_BREAKPOINT) return 0.6; // 一般手機
        return 1.0; // 平板及桌面
      };

      const updateJellyfishScale = () => {
        jellyfish.scale.setScalar(getJellyfishScale());
      };
      updateJellyfishScale();

      // === 圓形粒子紋理 ===
      const particleCanvas = document.createElement("canvas");
      particleCanvas.width = 64;
      particleCanvas.height = 64;
      const pCtx = particleCanvas.getContext("2d")!;
      const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.75, "rgba(255,255,255,0.95)");
      grad.addColorStop(0.9, "rgba(255,255,255,0.4)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 64, 64);
      const circleTexture = new THREE.CanvasTexture(particleCanvas);

      // === 粒子顏色組：深藍/深紫/靛藍/淺藍/深棕/淺棕 ===
      const colorPalette = [
        new THREE.Color(0x1a3a8a), // 深藍
        new THREE.Color(0x4b2d99), // 深紫
        new THREE.Color(0x2940ae), // 靛藍
        new THREE.Color(0x5bc0f7), // 淺藍
        new THREE.Color(0x6e4a3a), // 深棕
        new THREE.Color(0xb08e78), // 淺棕
      ];

      // Plankton Particles - 5000 顆隨機大小圓形粒子
      const particleCount = 5000;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const basePositions = new Float32Array(particleCount * 3);
      const pColors = new Float32Array(particleCount * 3);
      const pSizes = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 80;
        positions[i3 + 1] = (Math.random() - 0.5) * 80;
        positions[i3 + 2] = (Math.random() - 0.5) * 50;
        basePositions[i3] = positions[i3];
        basePositions[i3 + 1] = positions[i3 + 1];
        basePositions[i3 + 2] = positions[i3 + 2];

        // 隨機顏色
        const col =
          colorPalette[Math.floor(Math.random() * colorPalette.length)];
        pColors[i3] = col.r;
        pColors[i3 + 1] = col.g;
        pColors[i3 + 2] = col.b;

        // 隨機大小：30% 大顆 (0.3~0.9)、70% 小顆 (0.05~0.2)
        pSizes[i] =
          Math.random() < 0.3
            ? Math.random() * 0.6 + 0.3
            : Math.random() * 0.15 + 0.05;
      }

      particleGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      particleGeo.setAttribute("aColor", new THREE.BufferAttribute(pColors, 3));
      particleGeo.setAttribute("aSize", new THREE.BufferAttribute(pSizes, 1));

      const particleMat = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: circleTexture },
          uPixelRatio: { value: renderer.getPixelRatio() },
        },
        vertexShader: `
        uniform float uPixelRatio;
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(aSize * uPixelRatio * (250.0 / -mvPosition.z), 1.0, 64.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
        fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        void main() {
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          if (texColor.a < 0.05) discard;
          gl_FragColor = vec4(vColor * 2.0, texColor.a * 0.85);
        }
      `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      // Mouse Tracking
      const mouse = new THREE.Vector2();
      const target = new THREE.Vector2();

      const handleMouseMove = (e: MouseEvent) => {
        target.x = (e.clientX / window.innerWidth) * 2 - 1;
        target.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };

      document.addEventListener("mousemove", handleMouseMove);

      // Animation
      const clock = new THREE.Clock();

      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Update jellyfish
        jellyfishMat.uniforms.uTime.value = t;
        jellyfish.rotation.y += 0.0005;
        jellyfish.rotation.z += 0.00025;

        // Smooth mouse
        mouse.lerp(target, 0.1);
        const mouse3D = new THREE.Vector3(mouse.x * 30, mouse.y * 20, 10);

        // Update particles
        const pos = particleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const ix = i * 3;
          const iy = i * 3 + 1;
          const iz = i * 3 + 2;

          // Drift
          const dx = Math.sin(t * 0.5 + iy) * 0.05;
          const dy = Math.cos(t * 0.3 + ix) * 0.05;

          let cx = basePositions[ix] + dx;
          let cy = basePositions[iy] + dy;
          const cz = basePositions[iz];

          // Repel from mouse
          const dist = Math.sqrt(
            Math.pow(cx - mouse3D.x, 2) + Math.pow(cy - mouse3D.y, 2),
          );
          if (dist < 8) {
            const angle = Math.atan2(cy - mouse3D.y, cx - mouse3D.x);
            const force = (8 - dist) * 0.25;
            cx += Math.cos(angle) * force;
            cy += Math.sin(angle) * force;
          }

          pos[ix] = cx;
          pos[iy] = cy;
          pos[iz] = cz;
        }
        particleGeo.attributes.position.needsUpdate = true;

        // Camera sway - 手機上減少晃動幅度
        const swayAmp = window.innerWidth < 768 ? 0.5 : 2;
        camera.position.x = Math.sin(t * 0.1) * swayAmp;
        camera.position.y = Math.cos(t * 0.1) * swayAmp;
        camera.lookAt(0, 0, 0);

        composer.render();
      };

      animate();

      // Resize Handler
      const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        composer.setSize(w, h);
        bloomPass.resolution.set(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        updateJellyfishScale();
      };

      window.addEventListener("resize", handleResize);

      // 設定清理函式
      cleanup = () => {
        cancelAnimationFrame(animationRef.current);
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("mousemove", handleMouseMove);
        composer.dispose();
        circleTexture.dispose();
        particleMat.dispose();
        particleGeo.dispose();
        jellyfishMat.dispose();
        jellyfishGeo.dispose();
        renderer.dispose();
        if (containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
      };
    }); // end import("three").then

    // Cleanup
    return () => {
      cancelled = true; // 標記已清理，阻止 pending Promise 繼續
      cleanup?.();
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className={`fixed inset-0 -z-10 ${className}`} />
      {/* Marine Snow Overlay */}
      <div className="marine-snow" />
    </>
  );
};

export default AbyssScene;
