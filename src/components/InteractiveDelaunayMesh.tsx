import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { cypherAudio } from '../utils/cypherAudioEngine';

export interface InteractiveDelaunayMeshProps {
  /** Visual density profile */
  density?: 'compact' | 'normal' | 'cinematic';
  /** Base opacity factor for the polygonal faces (0.0 to 1.0) */
  faceOpacity?: number;
  /** Edge line opacity factor (0.0 to 1.0) */
  wireframeOpacity?: number;
  /** Whether to show glowing vertex nodes */
  showNodes?: boolean;
  /** Mode: 'background' (subtle ambient) or 'hero' (high energy tactile) */
  mode?: 'background' | 'hero';
  /** Optional custom CSS class for positioning */
  className?: string;
  /** Direct Web Audio AnalyserNode instance, if available */
  externalAnalyser?: AnalyserNode | null;
}

// ---------------------------------------------------------------------------
// 2D Delaunay Triangulation (Bowyer-Watson Algorithm) - Pure TypeScript, Zero-dep
// ---------------------------------------------------------------------------
interface Point2D {
  x: number;
  y: number;
}

interface Triangle {
  a: number;
  b: number;
  c: number;
}

interface Circle {
  x: number;
  y: number;
  rSq: number;
}

function circumcircle(p1: Point2D, p2: Point2D, p3: Point2D): Circle {
  const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  if (Math.abs(d) < 1e-9) {
    return { x: 0, y: 0, rSq: Infinity };
  }
  const p1Sq = p1.x * p1.x + p1.y * p1.y;
  const p2Sq = p2.x * p2.x + p2.y * p2.y;
  const p3Sq = p3.x * p3.x + p3.y * p3.y;

  const ux = (p1Sq * (p2.y - p3.y) + p2Sq * (p3.y - p1.y) + p3Sq * (p1.y - p2.y)) / d;
  const uy = (p1Sq * (p3.x - p2.x) + p2Sq * (p1.x - p3.x) + p3Sq * (p2.x - p1.x)) / d;
  const dx = p1.x - ux;
  const dy = p1.y - uy;

  return { x: ux, y: uy, rSq: dx * dx + dy * dy };
}

function computeDelaunayTriangles(points: Point2D[], width: number, height: number): number[] {
  const n = points.length;
  if (n < 3) return [];

  // 1. Super-triangle enclosing all points with generous margin
  const margin = Math.max(width, height) * 3;
  const pts: Point2D[] = [
    ...points,
    { x: 0, y: margin },
    { x: -margin, y: -margin },
    { x: margin, y: -margin },
  ];

  const stA = n;
  const stB = n + 1;
  const stC = n + 2;

  let triangles: Triangle[] = [{ a: stA, b: stB, c: stC }];

  // 2. Incremental point insertion
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const polygonEdges: Array<[number, number]> = [];
    const validTriangles: Triangle[] = [];

    for (let t = 0; t < triangles.length; t++) {
      const tri = triangles[t];
      const cc = circumcircle(pts[tri.a], pts[tri.b], pts[tri.c]);
      const dx = p.x - cc.x;
      const dy = p.y - cc.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= cc.rSq) {
        // Point is inside circumcircle -> edge buffer
        polygonEdges.push([tri.a, tri.b], [tri.b, tri.c], [tri.c, tri.a]);
      } else {
        validTriangles.push(tri);
      }
    }

    // Filter out shared edges (only keep outer boundary of the polygonal cavity)
    const uniqueEdges: Array<[number, number]> = [];
    for (let e1 = 0; e1 < polygonEdges.length; e1++) {
      let isShared = false;
      const [u1, v1] = polygonEdges[e1];
      for (let e2 = 0; e2 < polygonEdges.length; e2++) {
        if (e1 === e2) continue;
        const [u2, v2] = polygonEdges[e2];
        if ((u1 === u2 && v1 === v2) || (u1 === v2 && v1 === u2)) {
          isShared = true;
          break;
        }
      }
      if (!isShared) {
        uniqueEdges.push([u1, v1]);
      }
    }

    // Re-triangulate cavity with point i
    for (const [u, v] of uniqueEdges) {
      validTriangles.push({ a: u, b: v, c: i });
    }

    triangles = validTriangles;
  }

  // 3. Remove triangles connected to the super-triangle
  const indices: number[] = [];
  for (const tri of triangles) {
    if (tri.a < n && tri.b < n && tri.c < n) {
      indices.push(tri.a, tri.b, tri.c);
    }
  }

  return indices;
}

/** Extract unique wireframe line segment pairs from triangle index buffer */
function extractUniqueEdges(indices: number[]): number[] {
  const edgeSet = new Set<string>();
  const lineIndices: number[] = [];

  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i];
    const b = indices[i + 1];
    const c = indices[i + 2];

    const pairs: Array<[number, number]> = [
      [a, b],
      [b, c],
      [c, a],
    ];

    for (const [u, v] of pairs) {
      const min = Math.min(u, v);
      const max = Math.max(u, v);
      const key = `${min}_${max}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        lineIndices.push(min, max);
      }
    }
  }

  return lineIndices;
}

/** Create circular soft glow texture for vertex point cloud */
function createNodeGlowTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const center = size / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0.0, 'rgba(255, 235, 170, 1.0)'); // Radiant gold core
    gradient.addColorStop(0.25, 'rgba(245, 158, 11, 0.85)'); // Warm amber
    gradient.addColorStop(0.6, 'rgba(180, 83, 9, 0.3)');     // Deep bronze
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// ---------------------------------------------------------------------------
// Interactive Delaunay Mesh Component
// ---------------------------------------------------------------------------
export const InteractiveDelaunayMesh: React.FC<InteractiveDelaunayMeshProps> = ({
  density = 'normal',
  faceOpacity,
  wireframeOpacity,
  showNodes = true,
  mode = 'background',
  className = '',
  externalAnalyser = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Default opacity based on active mode
  const resolvedFaceOpacity = faceOpacity ?? (mode === 'hero' ? 0.08 : 0.04);
  const resolvedWireframeOpacity = wireframeOpacity ?? (mode === 'hero' ? 0.45 : 0.22);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08080a, 0.0012);

    const camera = new THREE.PerspectiveCamera(48, width / height, 1, 3000);
    camera.position.set(0, 0, 520);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'mediump',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    const canvasElement = renderer.domElement;
    canvasElement.style.width = '100%';
    canvasElement.style.height = '100%';
    canvasElement.style.pointerEvents = 'none';
    container.appendChild(canvasElement);

    // Dynamic Amber PointLight that follows the cursor
    const mouseLight = new THREE.PointLight(0xf59e0b, mode === 'hero' ? 3.0 : 1.8, 650);
    mouseLight.position.set(0, 0, 120);
    scene.add(mouseLight);

    const ambientLight = new THREE.AmbientLight(0xffb703, mode === 'hero' ? 0.35 : 0.18);
    scene.add(ambientLight);

    // 2. Vertex Lattice & Physics State Buffers
    let cols = 14;
    let rows = 9;
    if (density === 'compact') {
      cols = width < 768 ? 9 : 12;
      rows = width < 768 ? 6 : 8;
    } else if (density === 'cinematic') {
      cols = width < 768 ? 14 : 20;
      rows = width < 768 ? 10 : 13;
    } else {
      // normal
      cols = width < 768 ? 11 : 16;
      rows = width < 768 ? 7 : 10;
    }

    const vertexCount = cols * rows;
    const homePositions = new Float32Array(vertexCount * 3);
    const currentPositions = new Float32Array(vertexCount * 3);
    const velocities = new Float32Array(vertexCount * 3);
    const audioPhases = new Float32Array(vertexCount);

    const marginX = width * 0.15;
    const marginY = height * 0.15;
    const usableW = width + marginX * 2;
    const usableH = height + marginY * 2;
    const stepX = usableW / (cols - 1);
    const stepY = usableH / (rows - 1);

    const rawPoints2D: Point2D[] = [];

    // Jittered grid generation for organic Delaunay distribution
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Keep borders relatively anchored while inner nodes jitter freely
        const isBorder = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
        const jitterStrength = isBorder ? 0.12 : 0.38;

        const jx = (Math.random() - 0.5) * stepX * jitterStrength;
        const jy = (Math.random() - 0.5) * stepY * jitterStrength;

        const x = -usableW / 2 + c * stepX + jx;
        const y = usableH / 2 - r * stepY + jy;
        const z = (Math.random() - 0.5) * 15;

        homePositions[idx * 3] = x;
        homePositions[idx * 3 + 1] = y;
        homePositions[idx * 3 + 2] = z;

        currentPositions[idx * 3] = x;
        currentPositions[idx * 3 + 1] = y;
        currentPositions[idx * 3 + 2] = z;

        velocities[idx * 3] = 0;
        velocities[idx * 3 + 1] = 0;
        velocities[idx * 3 + 2] = 0;

        audioPhases[idx] = Math.sqrt(x * x + y * y) * 0.008 + Math.random() * 0.5;

        rawPoints2D.push({ x, y });
        idx++;
      }
    }

    // 3. Delaunay Triangulation & Geometries
    const triangleIndices = computeDelaunayTriangles(rawPoints2D, usableW, usableH);
    const wireframeIndices = extractUniqueEdges(triangleIndices);

    // Shared Position Attribute for all three visual layers
    const positionAttribute = new THREE.BufferAttribute(currentPositions, 3);
    positionAttribute.setUsage(THREE.DynamicDrawUsage);

    // Layer A: Translucent Triangular Facets
    const facetGeometry = new THREE.BufferGeometry();
    facetGeometry.setAttribute('position', positionAttribute);
    facetGeometry.setIndex(triangleIndices);
    facetGeometry.computeVertexNormals();

    const facetMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Studio Amber Gold
      roughness: 0.25,
      metalness: 0.85,
      transparent: true,
      opacity: resolvedFaceOpacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const facetMesh = new THREE.Mesh(facetGeometry, facetMaterial);
    scene.add(facetMesh);

    // Layer B: Wireframe Metallic Gold Line Segments
    const wireframeGeometry = new THREE.BufferGeometry();
    wireframeGeometry.setAttribute('position', positionAttribute);
    wireframeGeometry.setIndex(wireframeIndices);

    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0xf59e0b, // 24k Gold Hue
      transparent: true,
      opacity: resolvedWireframeOpacity,
      blending: THREE.AdditiveBlending,
      linewidth: 1,
    });
    const wireframeLines = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    scene.add(wireframeLines);

    // Layer C: Glowing Amber Vertex Nodes (Point Cloud)
    let pointCloud: THREE.Points | null = null;
    let nodeTexture: THREE.Texture | null = null;
    if (showNodes) {
      nodeTexture = createNodeGlowTexture();
      const nodeGeometry = new THREE.BufferGeometry();
      nodeGeometry.setAttribute('position', positionAttribute);

      const nodeMaterial = new THREE.PointsMaterial({
        size: mode === 'hero' ? 8 : 6,
        map: nodeTexture,
        transparent: true,
        opacity: mode === 'hero' ? 0.75 : 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      pointCloud = new THREE.Points(nodeGeometry, nodeMaterial);
      scene.add(pointCloud);
    }

    // 4. Interaction State & Mouse Physics
    const mouseWorld = new THREE.Vector3(0, 0, 0);
    const targetMouseWorld = new THREE.Vector3(0, 0, 0);
    const tempRayOrigin = new THREE.Vector3();
    const tempRayDir = new THREE.Vector3();
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let isMouseActive = false;
    let mouseTimeout: number | null = null;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return;
      }

      const rect = container.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / width) * 2 - 1;
      const ndcY = -(((clientY - rect.top) / height) * 2 - 1);

      // Unproject 2D screen coordinates onto Z=0 plane in 3D world space
      tempRayOrigin.set(ndcX, ndcY, -1).unproject(camera);
      tempRayDir.set(ndcX, ndcY, 1).unproject(camera).sub(tempRayOrigin).normalize();

      const ray = new THREE.Ray(tempRayOrigin, tempRayDir);
      const intersectionPoint = new THREE.Vector3();
      if (ray.intersectPlane(planeZ, intersectionPoint)) {
        targetMouseWorld.copy(intersectionPoint);
        isMouseActive = true;

        if (mouseTimeout) window.clearTimeout(mouseTimeout);
        mouseTimeout = window.setTimeout(() => {
          isMouseActive = false;
        }, 3200);
      }
    };

    const onPointerLeave = () => {
      isMouseActive = false;
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mouseleave', onPointerLeave);

    // 5. Visibility and Viewport Intersection Control (Zero wasted GPU cycles)
    let isVisible = true;
    let isInViewport = true;
    let animationFrameId = 0;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && isInViewport) {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isInViewport = entry.isIntersecting;
        if (isInViewport && isVisible) {
          lastTime = performance.now();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // 6. Audio Analysis Envelope Followers
    let bassEnergySmoothed = 0.0;
    let midEnergySmoothed = 0.0;
    let trebleEnergySmoothed = 0.0;
    const internalAudioBuffer = new Uint8Array(32);

    const sampleAudioSpectrum = () => {
      let bass = 0;
      let mid = 0;
      let treble = 0;

      // Check external AnalyserNode first
      if (externalAnalyser) {
        try {
          const binCount = Math.min(externalAnalyser.frequencyBinCount, 64);
          externalAnalyser.getByteFrequencyData(internalAudioBuffer);
          let sumBass = 0;
          let sumMid = 0;
          let sumTreble = 0;
          for (let i = 0; i < 4; i++) sumBass += internalAudioBuffer[i] || 0;
          for (let i = 4; i < 16; i++) sumMid += internalAudioBuffer[i] || 0;
          for (let i = 16; i < 32; i++) sumTreble += internalAudioBuffer[i] || 0;

          bass = sumBass / (4 * 255);
          mid = sumMid / (12 * 255);
          treble = sumTreble / (16 * 255);
        } catch {
          // ignore error
        }
      } else {
        // Check studio Cypher engine
        const spectrum = cypherAudio.getSpectrumData();
        if (spectrum.length >= 16) {
          const sumBass = (spectrum[0] + spectrum[1] + spectrum[2]) / 3;
          const sumMid = (spectrum[3] + spectrum[4] + spectrum[5] + spectrum[6]) / 4;
          const sumTreble = (spectrum[12] + spectrum[13] + spectrum[14] + spectrum[15]) / 4;

          bass = sumBass / 100;
          mid = sumMid / 100;
          treble = sumTreble / 100;
        }
      }

      // Smooth attack/decay for musical response (VU needle ballistics)
      const attack = 0.35;
      const decay = 0.08;

      bassEnergySmoothed += (bass - bassEnergySmoothed) * (bass > bassEnergySmoothed ? attack : decay);
      midEnergySmoothed += (mid - midEnergySmoothed) * (mid > midEnergySmoothed ? attack : decay);
      trebleEnergySmoothed += (treble - trebleEnergySmoothed) * (treble > trebleEnergySmoothed ? attack : decay);
    };

    // 7. High-Performance Render Loop (Zero allocations inside loop)
    let lastTime = performance.now();
    let clock = 0;

    const renderLoop = (now: number) => {
      animationFrameId = requestAnimationFrame(renderLoop);

      if (!isVisible || !isInViewport) return;

      const delta = Math.min((now - lastTime) / 1000, 0.05); // Clamp dt to prevent physics tunneling
      lastTime = now;
      clock += delta;

      // Smooth mouse follow
      mouseWorld.lerp(targetMouseWorld, 0.08);
      mouseLight.position.set(mouseWorld.x, mouseWorld.y, 80);

      // Audio polling & smoothing
      sampleAudioSpectrum();

      // Ambient breathing amplitude when no audio is present
      const ambientBreathing = Math.sin(clock * 1.2) * 6 + Math.cos(clock * 0.7) * 4;
      const audioPulse = bassEnergySmoothed * 48; // Punchy Z displacement on kick drum
      const interactionRadius = mode === 'hero' ? 240 : 190;
      const radiusSq = interactionRadius * interactionRadius;

      // Spring-Damper Parameters
      const kSpring = 0.045; // Spring restoring tension
      const friction = 0.88;  // Viscous damping
      const mass = 1.0;

      // Dynamic vertex physics update
      for (let i = 0; i < vertexCount; i++) {
        const i3 = i * 3;
        const hx = homePositions[i3];
        const hy = homePositions[i3 + 1];
        const hz = homePositions[i3 + 2];

        let cx = currentPositions[i3];
        let cy = currentPositions[i3 + 1];
        let cz = currentPositions[i3 + 2];

        let vx = velocities[i3];
        let vy = velocities[i3 + 1];
        let vz = velocities[i3 + 2];

        // 1. Hooke's Law Spring Force towards Home anchor
        let fx = -kSpring * (cx - hx);
        let fy = -kSpring * (cy - hy);
        let fz = -kSpring * (cz - hz);

        // 2. Mouse Elastic Interaction
        if (isMouseActive) {
          const dx = cx - mouseWorld.x;
          const dy = cy - mouseWorld.y;
          const dSq = dx * dx + dy * dy;

          if (dSq < radiusSq && dSq > 0.01) {
            const dist = Math.sqrt(dSq);
            const factor = 1.0 - dist / interactionRadius;
            const push = factor * factor * (mode === 'hero' ? 18.0 : 11.0);

            // Repel outwards in 2D
            fx += (dx / dist) * push * 2.2;
            fy += (dy / dist) * push * 2.2;

            // Depress downwards in Z (tactile physical membrane effect)
            fz += Math.sin(factor * Math.PI) * (mode === 'hero' ? -42.0 : -24.0);
          }
        }

        // 3. Audio Acoustic Wave Modulation
        const phase = audioPhases[i];
        const acousticWave = Math.sin(phase - clock * 3.5) * (audioPulse + ambientBreathing);
        const harmonicWave = Math.cos(hx * 0.005 + clock * 2.0) * midEnergySmoothed * 14;

        fz += (acousticWave + harmonicWave) * 0.15;

        // Semi-implicit Euler integration
        vx = (vx + (fx / mass)) * friction;
        vy = (vy + (fy / mass)) * friction;
        vz = (vz + (fz / mass)) * friction;

        cx += vx;
        cy += vy;
        cz += vz;

        currentPositions[i3] = cx;
        currentPositions[i3 + 1] = cy;
        currentPositions[i3 + 2] = cz;

        velocities[i3] = vx;
        velocities[i3 + 1] = vy;
        velocities[i3 + 2] = vz;
      }

      // Mark buffer as dirty for single GPU upload per frame
      positionAttribute.needsUpdate = true;

      // Subtle dynamic opacity flare based on music intensity
      facetMaterial.opacity = resolvedFaceOpacity + midEnergySmoothed * 0.12;
      wireframeMaterial.opacity = resolvedWireframeOpacity + trebleEnergySmoothed * 0.35;

      // Gentle camera parallax tilt
      camera.position.x += (mouseWorld.x * 0.05 - camera.position.x) * 0.04;
      camera.position.y += (mouseWorld.y * 0.05 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    // Kick off animation loop
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(renderLoop);

    // 8. Responsive Resize Handler (Debounced)
    let resizeTimer: number | null = null;
    const handleResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!container) return;
        width = container.clientWidth || window.innerWidth;
        height = container.clientHeight || window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }, 120);
    };
    window.addEventListener('resize', handleResize);

    // 9. Thorough Memory Disposal Lifecycle (Zero Memory Leak)
    return () => {
      cancelAnimationFrame(animationFrameId);

      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();

      if (mouseTimeout) window.clearTimeout(mouseTimeout);
      if (resizeTimer) window.clearTimeout(resizeTimer);

      // Dispose Geometries
      facetGeometry.dispose();
      wireframeGeometry.dispose();

      // Dispose Materials
      facetMaterial.dispose();
      wireframeMaterial.dispose();

      // Dispose PointCloud
      if (pointCloud) {
        pointCloud.geometry.dispose();
        (pointCloud.material as THREE.Material).dispose();
      }
      if (nodeTexture) {
        nodeTexture.dispose();
      }

      // Clear Scene & Force WebGL Context Loss
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();

      if (canvasElement && canvasElement.parentNode) {
        canvasElement.parentNode.removeChild(canvasElement);
      }
    };
  }, [density, resolvedFaceOpacity, resolvedWireframeOpacity, showNodes, mode, externalAnalyser]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
};
