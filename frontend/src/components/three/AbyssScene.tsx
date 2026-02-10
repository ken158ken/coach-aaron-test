/**
 * 深海場景 - THE ABYSS 主題
 * @module components/three/AbyssScene
 *
 * @description
 * 包含呼吸脈動的水母球體和互動浮游生物粒子效果
 * 滑鼠移動會驅離粒子，攝影機會輕微晃動
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface AbyssSceneProps {
  className?: string;
}

/**
 * AbyssScene 元件 - 深海 Three.js 場景
 *
 * @param {AbyssSceneProps} props - 元件屬性
 * @returns {JSX.Element} 深海場景
 */
const AbyssScene: React.FC<AbyssSceneProps> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

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
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Jellyfish Sphere with Shader
    const jellyfishGeo = new THREE.SphereGeometry(8, 64, 64);
    const jellyfishMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x00ffff) },
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
        void main() {
          gl_FragColor = vec4(uColor, 0.3);
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

    // Plankton Particles
    const particleCount = 2000;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = (Math.random() - 0.5) * 80;
      positions[i + 2] = (Math.random() - 0.5) * 50;
      basePositions[i] = positions[i];
      basePositions[i + 1] = positions[i + 1];
      basePositions[i + 2] = positions[i + 2];
    }

    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    const particleMat = new THREE.PointsMaterial({
      color: 0x7b00ff,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
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
      jellyfish.rotation.y += 0.002;
      jellyfish.rotation.z += 0.001;

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
          const force = (8 - dist) * 0.5;
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

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      updateJellyfishScale();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
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
