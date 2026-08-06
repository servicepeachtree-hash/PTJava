'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function ModelViewer({
  load, height = 420,
}: { load: () => Promise<THREE.Object3D>; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let renderer: THREE.WebGLRenderer | null = null;
    let animationId: number;
    let disposed = false;

    async function init() {
      const container = containerRef.current;
      if (!container) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x141416);

      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / height, 0.1, 1000);
      camera.position.set(3, 3, 5);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const dir = new THREE.DirectionalLight(0xffffff, 0.9);
      dir.position.set(5, 8, 6);
      scene.add(dir);
      const grid = new THREE.GridHelper(20, 20, 0x333333, 0x222222);
      scene.add(grid);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      try {
        const object = await load();
        if (disposed) return;
        scene.add(object);

        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3()).length() || 4;
        camera.position.set(size * 0.6, size * 0.5, size * 0.9);
        controls.target.set(0, 0, 0);
        controls.update();
        setLoading(false);
      } catch (err: any) {
        console.error('[ModelViewer] failed to render preview:', err);
        setError(err.message || 'Could not render a preview of this file.');
        setLoading(false);
      }

      function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer!.render(scene, camera);
      }
      animate();
    }

    init();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      renderer?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {loading && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dim)', fontSize: 13, zIndex: 1 }}>
          Loading preview…
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pink)', fontSize: 13, padding: 20, textAlign: 'center', zIndex: 1 }}>
          {error}
        </div>
      )}
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
