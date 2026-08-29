/**
 * 水晶場景 - VOID PRISM 主題
 * @module components/three/PrismScene
 *
 * @description
 * 包含物理材質水晶和飄浮碎片效果
 * 滑鼠移動會影響攝影機位置，光源會動態移動
 */

import React, { useEffect, useRef } from "react";

interface PrismSceneProps {
  className?: string;
}

/**
 * PrismScene 元件 - 水晶 Three.js 場景
 * Three.js 透過動態 import 延遲載入，確保 SSR 安全
 *
 * @param {PrismSceneProps} props - 元件屬性
 * @returns {JSX.Element} 水晶場景
 */
const PrismScene: React.FC<PrismSceneProps> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;

    // 動態載入 Three.js（僅在客戶端執行）
    import("three").then((THREE) => {
      if (!containerRef.current) return;

      // Scene
      const scene = new THREE.Scene();

      // Camera
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
      );
      camera.position.z = 8;

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const pointLight1 = new THREE.PointLight(0x82b1ff, 2, 20);
      pointLight1.position.set(5, 5, 5);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xb388ff, 2, 20);
      pointLight2.position.set(-5, -5, 5);
      scene.add(pointLight2);

      // Main Crystal
      const crystalGeo = new THREE.IcosahedronGeometry(2, 0);
      const crystalMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 2.0,
        envMapIntensity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });
      const mainCrystal = new THREE.Mesh(crystalGeo, crystalMat);
      scene.add(mainCrystal);

      // 手機版水晶依螢幕寬度縮小
      const SMALL_MOBILE = 480;
      const MOBILE_BREAKPOINT = 768;

      const getCrystalScale = () => {
        const w = window.innerWidth;
        if (w < SMALL_MOBILE) return 0.55;
        if (w < MOBILE_BREAKPOINT) return 0.7;
        return 1.0;
      };

      const updateCrystalScale = () => {
        const s = getCrystalScale();
        mainCrystal.scale.setScalar(s);
      };
      updateCrystalScale();

      // Floating Shards
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shards: { mesh: any; axis: any; speed: number }[] = [];
      const shardGeo = new THREE.OctahedronGeometry(0.3, 0);
      const shardMat = new THREE.MeshPhysicalMaterial({
        color: 0x82b1ff,
        metalness: 0.5,
        roughness: 0.2,
        transmission: 0.6,
        thickness: 0.5,
      });

      for (let i = 0; i < 30; i++) {
        const shard = new THREE.Mesh(shardGeo, shardMat);
        // 手機上縮小碎片分佈半徑
        const shardScale = getCrystalScale();
        const r = (4 + Math.random() * 3) * shardScale;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 2;

        shard.position.set(
          r * Math.sin(theta) * Math.cos(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(theta),
        );

        shard.rotation.set(
          Math.random() * 3,
          Math.random() * 3,
          Math.random() * 3,
        );

        scene.add(shard);
        shards.push({
          mesh: shard,
          axis: new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5,
          ).normalize(),
          speed: 0.005 + Math.random() * 0.01,
        });
      }

      // Mouse Tracking
      let mouseX = 0;
      let mouseY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.001;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.001;
      };

      document.addEventListener("mousemove", handleMouseMove);

      // Animation
      const clock = new THREE.Clock();

      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Rotate main crystal
        mainCrystal.rotation.x = Math.sin(t * 0.2) * 0.5;
        mainCrystal.rotation.y += 0.005;

        // Rotate shards
        shards.forEach((s) => {
          s.mesh.rotation.x += 0.01;
          s.mesh.rotation.y += 0.01;
          // Orbit
          s.mesh.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.002);
        });

        // Move lights
        pointLight1.position.x = Math.sin(t) * 5;
        pointLight1.position.z = Math.cos(t) * 5;

        // Camera follow mouse - 手機上減少位移幅度
        const followAmp = window.innerWidth < 768 ? 2 : 5;
        camera.position.x += (mouseX * followAmp - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * followAmp - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };

      animate();

      // Resize Handler
      const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        updateCrystalScale();
      };

      window.addEventListener("resize", handleResize);

      // 設定清理函式
      cleanup = () => {
        cancelAnimationFrame(animationRef.current);
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("mousemove", handleMouseMove);
        renderer.dispose();
        if (containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
      };
    }); // end import("three").then

    // Cleanup
    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <div ref={containerRef} className={`fixed inset-0 -z-10 ${className}`} />
  );
};

export default PrismScene;
