"use client";

import React, { useRef, useMemo, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { useGLTF, useTexture, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import { HERO_DEVICE_MODELS, HeroDeviceReflections, useHeroDeviceModel } from "./hero-device-materials";

export type CameraMode = "A" | "B" | "C";

export interface Hero3DSceneProps {
  progress: number;
  cameraMode?: CameraMode;
  active?: boolean;
}

// -----------------------------------------------------------------------------
// HELPER: Interpolate between keyframe tuples [time, val]
// -----------------------------------------------------------------------------
function interpolateKeys(progress: number, keys: [number, number][]): number {
  if (keys.length === 0) return 0;
  if (progress <= keys[0][0]) return keys[0][1];
  if (progress >= keys[keys.length - 1][0]) return keys[keys.length - 1][1];

  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (progress >= t0 && progress <= t1) {
      const frac = (progress - t0) / (t1 - t0);
      // Smooth hermite step
      const smooth = frac * frac * (3 - 2 * frac);
      return v0 + (v1 - v0) * smooth;
    }
  }
  return keys[keys.length - 1][1];
}

// -----------------------------------------------------------------------------
// HELPER: C1-Continuous Non-Linear Cubic Hermite Spline Track Evaluator
// Emulates Bersus/Blender physical camera crane & dolly arcs without linear kinks
// -----------------------------------------------------------------------------
function createSplineTrack(
  keys: [number, [number, number, number]][],
  zeroEnds = true
): (t: number, out: THREE.Vector3) => THREE.Vector3 {
  const n = keys.length;
  const times = keys.map((k) => k[0]);
  const points = keys.map((k) => new THREE.Vector3(...k[1]));
  const tangents: THREE.Vector3[] = [];

  for (let i = 0; i < n; i++) {
    if (i === 0) {
      if (zeroEnds) {
        tangents.push(new THREE.Vector3(0, 0, 0));
      } else {
        const dt = times[1] - times[0];
        tangents.push(points[1].clone().sub(points[0]).divideScalar(dt));
      }
    } else if (i === n - 1) {
      if (zeroEnds) {
        tangents.push(new THREE.Vector3(0, 0, 0));
      } else {
        const dt = times[n - 1] - times[n - 2];
        tangents.push(points[n - 1].clone().sub(points[n - 2]).divideScalar(dt));
      }
    } else {
      const dt = times[i + 1] - times[i - 1];
      tangents.push(points[i + 1].clone().sub(points[i - 1]).divideScalar(dt));
    }
  }

  return function evaluate(t: number, out: THREE.Vector3): THREE.Vector3 {
    if (t <= times[0]) return out.copy(points[0]);
    if (t >= times[n - 1]) return out.copy(points[n - 1]);

    let idx = 0;
    for (let i = 0; i < n - 1; i++) {
      if (t >= times[i] && t <= times[i + 1]) {
        idx = i;
        break;
      }
    }

    const t0 = times[idx];
    const t1 = times[idx + 1];
    const dt = t1 - t0;
    const tau = (t - t0) / dt;

    // Cubic Hermite basis functions
    const h00 = 2 * tau * tau * tau - 3 * tau * tau + 1;
    const h10 = (tau * tau * tau - 2 * tau * tau + tau) * dt;
    const h01 = -2 * tau * tau * tau + 3 * tau * tau;
    const h11 = (tau * tau * tau - tau * tau) * dt;

    const p0 = points[idx];
    const p1 = points[idx + 1];
    const m0 = tangents[idx];
    const m1 = tangents[idx + 1];

    out.set(
      h00 * p0.x + h10 * m0.x + h01 * p1.x + h11 * m1.x,
      h00 * p0.y + h10 * m0.y + h01 * p1.y + h11 * m1.y,
      h00 * p0.z + h10 * m0.z + h01 * p1.z + h11 * m1.z
    );
    return out;
  };
}

function createScalarSplineTrack(
  keys: [number, number][],
  zeroEnds = true
): (t: number) => number {
  const n = keys.length;
  const times = keys.map((k) => k[0]);
  const values = keys.map((k) => k[1]);
  const tangents: number[] = [];

  for (let i = 0; i < n; i++) {
    if (i === 0) {
      tangents.push(
        zeroEnds ? 0 : (values[1] - values[0]) / (times[1] - times[0])
      );
    } else if (i === n - 1) {
      tangents.push(
        zeroEnds
          ? 0
          : (values[n - 1] - values[n - 2]) / (times[n - 1] - times[n - 2])
      );
    } else {
      tangents.push(
        (values[i + 1] - values[i - 1]) / (times[i + 1] - times[i - 1])
      );
    }
  }

  return function evaluate(t: number): number {
    if (t <= times[0]) return values[0];
    if (t >= times[n - 1]) return values[n - 1];

    let idx = 0;
    for (let i = 0; i < n - 1; i++) {
      if (t >= times[i] && t <= times[i + 1]) {
        idx = i;
        break;
      }
    }

    const t0 = times[idx];
    const t1 = times[idx + 1];
    const dt = t1 - t0;
    const tau = (t - t0) / dt;

    const h00 = 2 * tau * tau * tau - 3 * tau * tau + 1;
    const h10 = (tau * tau * tau - 2 * tau * tau + tau) * dt;
    const h01 = -2 * tau * tau * tau + 3 * tau * tau;
    const h11 = (tau * tau * tau - tau * tau) * dt;

    return (
      h00 * values[idx] +
      h10 * tangents[idx] +
      h01 * values[idx + 1] +
      h11 * tangents[idx + 1]
    );
  };
}

// -----------------------------------------------------------------------------
// CANONICAL CAMERA TRAJECTORY PROFILE: Mode A (Controlled Sideways Orbit Arc)
// -----------------------------------------------------------------------------
const ORBIT_ARC_CAMERA_PROFILE = {
  // Stage 4: Controlled sideways orbit arc toward MacBook & logo (Z: 2.75 -> 2.30, X: 0.0 -> -0.65)
  // Stage 5: Stationary world position [-0.65, 0.28, 2.30] with yaw pan to iPhone + optical telephoto zoom (FOV 30° -> 26.5°)
  posKeys: [
    [0.0, [0.0, 0.34, 3.85]],
    [0.22, [0.0, 0.72, 2.75]],
    [0.44, [0.0, 0.46, 2.75]],
    [0.56, [-0.34, 0.22, 2.52]],
    [0.68, [-0.65, 0.28, 2.30]],
    [0.79, [-0.65, 0.28, 2.30]],
    [0.90, [-0.65, 0.28, 2.30]],
    [1.0, [0.0, 0.54, 2.82]],
  ] as [number, [number, number, number]][],
  lookKeys: [
    [0.0, [0.0, 0.08, 0.0]],
    [0.22, [0.0, 0.02, 0.0]],
    [0.44, [0.0, 0.06, 0.10]],
    [0.56, [-0.14, 0.13, 0.18]],
    [0.68, [-0.25, 0.13, 0.18]],
    [0.79, [0.18, 0.23, 0.18]],
    [0.90, [0.60, 0.28, 0.15]],
    [1.0, [0.0, 0.08, 0.0]],
  ] as [number, [number, number, number]][],
  fovKeys: [
    [0.0, 35.0],
    [0.22, 33.0],
    [0.44, 31.5],
    [0.56, 30.8],
    [0.68, 30.0],
    [0.79, 28.5],
    [0.90, 26.5],
    [1.0, 31.0],
  ] as [number, number][],
  tiltZKeys: [
    [0.0, 0.0],
    [0.22, 0.0],
    [0.44, 0.0],
    [0.56, -0.06],
    [0.68, -0.12], // -6.9°
    [0.79, 0.0],
    [0.90, 0.10],  // +5.7°
    [1.0, 0.0],
  ] as [number, number][],
};

// -----------------------------------------------------------------------------
// CAMERA RIG: Handles Non-Linear Organic Spline Trajectory, FOV & Dutch Tilt
// Standardized on canonical Mode A (Sideways Orbit Arc)
// -----------------------------------------------------------------------------
function CameraRig({
  progress,
}: {
  progress: number;
  cameraMode?: CameraMode;
}) {
  const { camera, pointer } = useThree();
  const currentPos = useRef(new THREE.Vector3(0, 0.34, 3.85));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.08, 0));
  const currentTilt = useRef(0);
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  const profile = ORBIT_ARC_CAMERA_PROFILE;

  const evalPos = useMemo(() => createSplineTrack(profile.posKeys, true), [profile.posKeys]);
  const evalLook = useMemo(() => createSplineTrack(profile.lookKeys, true), [profile.lookKeys]);
  const evalFov = useMemo(() => createScalarSplineTrack(profile.fovKeys, true), [profile.fovKeys]);
  const evalTilt = useMemo(() => createScalarSplineTrack(profile.tiltZKeys, true), [profile.tiltZKeys]);

  useFrame((state, delta) => {
    // Weighted cinema camera inertia (stable, fluid, snappier follow, zero jitter)
    const lerpFactor = 1 - Math.pow(1 - 0.16, Math.min(delta, 0.1) * 60);

    // Compute continuous non-linear targets from progress
    evalPos(progress, targetPos.current);
    evalLook(progress, targetLookAt.current);
    const targetFov = evalFov(progress);
    const targetTilt = evalTilt(progress);

    // Subtle natural mouse pointer parallax (without synthetic shaking)
    const pX = pointer.x * 0.06;
    const pY = pointer.y * 0.04;

    targetPos.current.x += pX;
    targetPos.current.y += pY;

    // Smoothly interpolate position, lookAt, and Dutch roll
    currentPos.current.lerp(targetPos.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    currentTilt.current += (targetTilt - currentTilt.current) * lerpFactor;

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);

    // Apply true Dutch roll around viewing axis after lookAt
    camera.rotateZ(currentTilt.current);

    // Apply continuous optical zoom
    const perspCam = camera as THREE.PerspectiveCamera;
    if (perspCam.fov) {
      perspCam.fov += (targetFov - perspCam.fov) * lerpFactor;
      perspCam.updateProjectionMatrix();
    }
  });

  return null;
}

// -----------------------------------------------------------------------------
// LIGHTING RIG: Studio Lights with Silhouette-to-Lit Intensity Control
// -----------------------------------------------------------------------------
// One key light drives both 3D highlights and height-aware floor shadows.
// Positioned high above (Y = 5.0) and slightly left of center (X = -0.40) so
// shadows cast with a subtle, realistic rightward slant without skewing too far right.
const KEY_LIGHT_POSITION: [number, number, number] = [-0.40, 5.0, 1.8];
const FLOOR_Y = -0.45;

function StudioLighting({ progress }: { progress: number }) {
  // Reveal factor: 0.0 (Stage 1 Silhouette) -> 1.0 (Stage 2 Lit PBR)
  const reveal = useMemo(() => {
    if (progress <= 0.02) return 0;
    if (progress >= 0.2) return 1;
    const t = (progress - 0.02) / 0.18;
    return t * t * (3 - 2 * t);
  }, [progress]);

  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (dirLightRef.current) {
      // Directional Key Light: 0.65 (casts directional floor shadow in Stage 1) -> 3.2 (full studio key)
      dirLightRef.current.intensity = THREE.MathUtils.lerp(0.65, 3.2, reveal);
    }
    if (ambientRef.current) {
      // Ambient Fill Light: 0.05 -> 0.75
      ambientRef.current.intensity = THREE.MathUtils.lerp(0.05, 0.75, reveal);
    }
    if (rimLightRef.current) {
      // Rim accent light stays active to define silhouettes in Stage 1
      rimLightRef.current.intensity = THREE.MathUtils.lerp(1.4, 1.2, reveal);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} color="#ffffff" intensity={0.05} />
      {/* Studio Key Softbox */}
      <directionalLight
        ref={dirLightRef}
        position={KEY_LIGHT_POSITION}
        intensity={0.65}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-camera-left={-2.5}
        shadow-camera-right={2.5}
        shadow-camera-top={2.5}
        shadow-camera-bottom={-2.5}
        shadow-bias={-0.0003}
      />
      {/* Silhouette Rim / Back Light */}
      <pointLight
        ref={rimLightRef}
        position={[0, 1.5, -1.8]}
        color="#8ab4f8"
        intensity={1.4}
      />
      {/* Left Cool Fill */}
      <directionalLight position={[-3.0, 2.0, 1.5]} color="#d0e0ff" intensity={0.35} />
      {/* Right Warm Accent */}
      <directionalLight position={[3.0, 1.2, -0.5]} color="#ffffff" intensity={0.3} />
    </>
  );
}

// -----------------------------------------------------------------------------
// HEIGHT-AWARE SOFT CAST SHADOW (single key light, contact-hardening behaviour)
// -----------------------------------------------------------------------------

const shadowVertexShader = /* glsl */ `
  uniform vec2 uExtent;
  varying vec2 vLocal;
  void main() {
    vLocal = position.xy * 2.0 * uExtent;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const shadowFragmentShader = /* glsl */ `
  uniform vec2 uHalf;
  uniform float uRadius;
  uniform float uSigma;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying vec2 vLocal;

  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  // Logistic approximation of a Gaussian-blurred edge
  float blurredEdge(float d, float s) {
    return 1.0 / (1.0 + exp(1.702 * d / s));
  }

  void main() {
    float s = max(uSigma, 0.0005);
    float d = sdRoundBox(vLocal, uHalf, uRadius);
    float dCenter = -min(uHalf.x, uHalf.y);
    // Normalise so the umbra centre always reaches uOpacity, regardless of blur
    float a = blurredEdge(d, s) / blurredEdge(dCenter, s);
    a = clamp(a, 0.0, 1.0) * uOpacity;
    // Static dither kills 8-bit banding of the soft falloff on the white backdrop
    float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    a += (n - 0.5) / 255.0;
    if (a <= 0.0005) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

interface HeightAwareShadowProps {
  /** Name of the Object3D in the scene that casts this shadow */
  targetName: string;
  /** Peak umbra opacity when touching the floor */
  nearOpacity: number;
  /** Peak umbra opacity at full float height */
  farOpacity: number;
  /** Blur growth per world unit of height (bigger = spreads faster) */
  spread: number;
  /** Height at which the shadow reaches its softest / faintest state */
  fadeHeight?: number;
}

const _corners = Array.from({ length: 8 }, () => new THREE.Vector3());
const _axisX = new THREE.Vector3();
const _axisZ = new THREE.Vector3();

function HeightAwareShadow({
  targetName,
  nearOpacity,
  farOpacity,
  spread,
  fadeHeight = 0.9,
}: HeightAwareShadowProps) {
  const scene = useThree((s) => s.scene);
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRef = useRef<THREE.Object3D | null>(null);
  const localBoxRef = useRef<THREE.Box3 | null>(null);
  const framesRef = useRef(0);

  // Unit vector pointing from the floor towards the key light
  const lightDir = useMemo(
    () => new THREE.Vector3(...KEY_LIGHT_POSITION).normalize(),
    []
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shadowVertexShader,
        fragmentShader: shadowFragmentShader,
        uniforms: {
          uExtent: { value: new THREE.Vector2(0.5, 0.5) },
          uHalf: { value: new THREE.Vector2(0.1, 0.1) },
          uRadius: { value: 0.01 },
          uSigma: { value: 0.01 },
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color("#0a1222") },
        },
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -4,
      }),
    []
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!targetRef.current) {
      targetRef.current = scene.getObjectByName(targetName) ?? null;
      if (!targetRef.current) {
        mesh.visible = false;
        return;
      }
    }
    const target = targetRef.current;

    // Measure the object's local bounds once its meshes and first pose exist
    if (!localBoxRef.current) {
      framesRef.current += 1;
      if (framesRef.current < 3) {
        mesh.visible = false;
        return;
      }
      target.updateWorldMatrix(true, true);
      const inv = new THREE.Matrix4().copy(target.matrixWorld).invert();
      const rel = new THREE.Matrix4();
      const tmp = new THREE.Box3();
      const box = new THREE.Box3();
      target.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || !m.geometry) return;
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        rel.multiplyMatrices(inv, m.matrixWorld);
        tmp.copy(m.geometry.boundingBox!).applyMatrix4(rel);
        box.union(tmp);
      });
      if (box.isEmpty()) return;
      localBoxRef.current = box;
    }

    const box = localBoxRef.current;
    target.updateWorldMatrix(true, false);
    const mw = target.matrixWorld;

    // 8 world-space corners of the object's oriented bounding box
    let i = 0;
    for (let xi = 0; xi < 2; xi++)
      for (let yi = 0; yi < 2; yi++)
        for (let zi = 0; zi < 2; zi++) {
          _corners[i++]
            .set(
              xi ? box.max.x : box.min.x,
              yi ? box.max.y : box.min.y,
              zi ? box.max.z : box.min.z
            )
            .applyMatrix4(mw);
        }

    // Shadow orientation follows the object's yaw on the floor plane
    _axisX.setFromMatrixColumn(mw, 0).setY(0);
    if (_axisX.lengthSq() < 1e-4) _axisX.setFromMatrixColumn(mw, 2).setY(0);
    _axisX.normalize();
    _axisZ.set(-_axisX.z, 0, _axisX.x);

    // Project every corner along the light ray onto the floor
    const kx = lightDir.x / lightDir.y;
    const kz = lightDir.z / lightDir.y;
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    let hMin = Infinity, hSum = 0;
    for (const c of _corners) {
      const h = Math.max(0, c.y - FLOOR_Y);
      hMin = Math.min(hMin, h);
      hSum += h;
      const px = c.x - kx * h;
      const pz = c.z - kz * h;
      const u = px * _axisX.x + pz * _axisX.z;
      const v = px * _axisZ.x + pz * _axisZ.z;
      minU = Math.min(minU, u); maxU = Math.max(maxU, u);
      minV = Math.min(minV, v); maxV = Math.max(maxV, v);
    }
    const hMid = hSum / 8;

    // Blur grows with height: crisp near the floor, wide and shapeless when floating
    const halfU = (maxU - minU) / 2;
    const halfV = (maxV - minV) / 2;
    const sigma = 0.006 + spread * (0.35 * hMin + 0.65 * hMid);
    const radius = Math.min(Math.min(halfU, halfV), sigma * 1.6);

    // Intensity falls off with height
    const t = THREE.MathUtils.clamp(hMid / fadeHeight, 0, 1);
    const ease = t * t * (3 - 2 * t);
    const opacity = THREE.MathUtils.lerp(nearOpacity, farOpacity, ease);

    const extentU = halfU + sigma * 3.5;
    const extentV = halfV + sigma * 3.5;
    const cu = (minU + maxU) / 2;
    const cv = (minV + maxV) / 2;

    mesh.visible = true;
    mesh.position.set(
      _axisX.x * cu + _axisZ.x * cv,
      FLOOR_Y + 0.0002,
      _axisX.z * cu + _axisZ.z * cv
    );
    mesh.rotation.set(-Math.PI / 2, Math.atan2(-_axisX.z, _axisX.x), 0, "YXZ");
    mesh.scale.set(extentU * 2, extentV * 2, 1);

    const u = material.uniforms;
    (u.uExtent.value as THREE.Vector2).set(extentU, extentV);
    (u.uHalf.value as THREE.Vector2).set(halfU, halfV);
    u.uRadius.value = radius;
    u.uSigma.value = sigma;
    u.uOpacity.value = opacity;
  });

  return (
    <mesh ref={meshRef} material={material} visible={false} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// 3D WORDMARK: Midground Floating Mesh (menuin_3d_text.glb) at Z = -0.05
// -----------------------------------------------------------------------------
function BackgroundWordmark({ progress }: { progress: number }) {
  const gltf = useGLTF("/hero/3d/menuin_3d_text.glb");

  const meshRef = useRef<THREE.Mesh>(null);

  // Compute silhouette blend factor
  const reveal = useMemo(() => {
    if (progress <= 0.02) return 0;
    if (progress >= 0.2) return 1;
    const t = (progress - 0.02) / 0.18;
    return t * t * (3 - 2 * t);
  }, [progress]);

  // Clone material to avoid shared mutation
  const mat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#0854f8"),
      roughness: 0.25,
      metalness: 0.05,
      clearcoat: 0.3,
    });
  }, []);

  useFrame(() => {
    if (mat) {
      // Interpolate from deep Bersus silhouette black to Menuin Blue
      const silColor = new THREE.Color("#050505");
      const brandColor = new THREE.Color("#0854f8");
      mat.color.lerpColors(silColor, brandColor, reveal);
      mat.roughness = THREE.MathUtils.lerp(0.95, 0.25, reveal);
      mat.metalness = THREE.MathUtils.lerp(0.0, 0.08, reveal);
      mat.clearcoat = THREE.MathUtils.lerp(0.0, 0.3, reveal);
    }
  });

  // Extract geometries from gltf (disable castShadow so floating text never casts a bar across the floor)
  const sceneCloned = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.material = mat;
        m.castShadow = false;
        m.receiveShadow = false;
      }
    });
    return cloned;
  }, [gltf, mat]);

  return (
    <primitive
      ref={meshRef}
      name="shadow-target-logo"
      object={sceneCloned}
      position={[0, 0.25, -0.05]}
      scale={[1.08, 1.08, 1.08]}
    />
  );
}

// -----------------------------------------------------------------------------
// HELPER: Stage 3 Clockwise Expansive Cinematic Orbit & Flyby Trajectory
// Bersus-grade: Wide horizontal sweep (edge-to-edge), deep foreground approach
// close to camera, inclined 3D plane, and dynamic centripetal banking & pitch.
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// HELPER: Stage 3 Clockwise Expansive Cinematic Orbit & Flyby Trajectory
// 3-Pose Kinematics:
//   1. Flat Floor Pose (p = 0.00): Silhouette lying flat on the studio floor
//   2. Stand Floor Pose (p = 0.22): Bottom edge remains pinned to floor (Y = -0.450),
//      while screen tilts up ~55° to follow and face the approaching camera!
//   3. Float Pose (p >= 0.44): Orbit flyby smoothly takes off from stand pose
//      into wide cinematic edge-to-edge sweep and settles into steady float pose.
// -----------------------------------------------------------------------------
interface OrbitDeviceConfig {
  name: string;
  flatPos: THREE.Vector3;
  flatQuat: THREE.Quaternion;
  standPos: THREE.Vector3;
  standQuat: THREE.Quaternion;
  floatPos: THREE.Vector3;
  floatQuat: THREE.Quaternion;
  th0: number;
  th1: number;
  d0_x: number;
  d0_z: number;
  dF_x: number;
  dF_z: number;
}

const ORBIT_CENTER_X = 0.0;
const ORBIT_CENTER_Z = 0.10;
const ORBIT_PEAK_RADIUS_X = 1.22; // Tight orbit hugging logo closely (~14cm outside logo ends) without touching
const ORBIT_PEAK_RADIUS_Z = 0.78; // Balanced foreground approach (+0.88) and back sweep (-0.68)
const ORBIT_PEAK_LIFT = 0.23;     // Vertical arc lift in mid-orbit
const ORBIT_INCLINE_AMP = 0.11;   // Incline: elevated in back/sides, dipping in front for clear logo view

const TOTAL_ORBIT_SWEEP = (600 * Math.PI) / 180; // Exactly 600° (1.67 turns) for all 3 devices
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);

function createOrbitConfig(
  name: string,
  flatPosArr: [number, number, number],
  flatEulerArr: [number, number, number, string],
  standPosArr: [number, number, number],
  standEulerArr: [number, number, number, string],
  floatPosArr: [number, number, number],
  floatEulerArr: [number, number, number, string],
  sweepAngleRad: number = TOTAL_ORBIT_SWEEP
): OrbitDeviceConfig {
  const flatPos = new THREE.Vector3(...flatPosArr);
  const standPos = new THREE.Vector3(...standPosArr);
  const floatPos = new THREE.Vector3(...floatPosArr);

  const flatQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      flatEulerArr[0],
      flatEulerArr[1],
      flatEulerArr[2],
      flatEulerArr[3] as THREE.EulerOrder
    )
  );
  const standQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      standEulerArr[0],
      standEulerArr[1],
      standEulerArr[2],
      standEulerArr[3] as THREE.EulerOrder
    )
  );
  const floatQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      floatEulerArr[0],
      floatEulerArr[1],
      floatEulerArr[2],
      floatEulerArr[3] as THREE.EulerOrder
    )
  );

  // Orbit takes off seamlessly from standPos at p = 0.22
  const th0 = Math.atan2(
    (standPos.z - ORBIT_CENTER_Z) / ORBIT_PEAK_RADIUS_Z,
    (standPos.x - ORBIT_CENTER_X) / ORBIT_PEAK_RADIUS_X
  );
  // Default sweep is TOTAL_ORBIT_SWEEP (600° = 1.67 turns)
  // Customizable per device so each device lands tangentially without reverse hook
  const th1 = th0 + sweepAngleRad;

  const e0_x = ORBIT_CENTER_X + ORBIT_PEAK_RADIUS_X * Math.cos(th0);
  const e0_z = ORBIT_CENTER_Z + ORBIT_PEAK_RADIUS_Z * Math.sin(th0);
  const eF_x = ORBIT_CENTER_X + ORBIT_PEAK_RADIUS_X * Math.cos(th1);
  const eF_z = ORBIT_CENTER_Z + ORBIT_PEAK_RADIUS_Z * Math.sin(th1);

  const d0_x = standPos.x - e0_x;
  const d0_z = standPos.z - e0_z;
  const dF_x = floatPos.x - eF_x;
  const dF_z = floatPos.z - eF_z;

  return {
    name,
    flatPos,
    flatQuat,
    standPos,
    standQuat,
    floatPos,
    floatQuat,
    th0,
    th1,
    d0_x,
    d0_z,
    dF_x,
    dF_z,
  };
}

const _tmpUpAxis = new THREE.Vector3(0, 1, 0);
const _tmpSpinQuat = new THREE.Quaternion();

function evaluateOrbitTransform(
  cfg: OrbitDeviceConfig,
  progress: number,
  _elapsed: number,
  outPos: THREE.Vector3,
  outQuat: THREE.Quaternion
) {
  // ---------------------------------------------------------------------------
  // STAGE 1 -> STAGE 2 (p in [0.00, 0.22]): Tilting up on bottom edge on floor
  // While camera zooms in & textures reveal, iPhone & iPad stand up on one edge
  // with bottom edge touching the floor at Y = -0.450, facing camera!
  // ---------------------------------------------------------------------------
  if (progress <= 0.22) {
    const t = Math.max(0, Math.min(1, progress / 0.22));
    const k = t * t * (3 - 2 * t); // Smooth cubic ease-in-out
    outPos.lerpVectors(cfg.flatPos, cfg.standPos, k);
    outQuat.slerpQuaternions(cfg.flatQuat, cfg.standQuat, k);
    return;
  }

  // ---------------------------------------------------------------------------
  // STAGE 3+ (p >= 0.44): Completely steady floating pose
  // ---------------------------------------------------------------------------
  if (progress >= 0.44) {
    outPos.copy(cfg.floatPos);
    outQuat.copy(cfg.floatQuat);
    return;
  }

  // ---------------------------------------------------------------------------
  // STAGE 2 -> STAGE 3 (p in [0.22, 0.44]): Expansive Clockwise Orbit Flyby
  // Takes off from standPos/standQuat, expands wide & deep, lands on floatPos
  // ---------------------------------------------------------------------------
  const u = (progress - 0.22) / 0.22;
  const s = u * u * (3 - 2 * u);
  const w = Math.sin(Math.PI * u); // Radial expansion bell curve (0 at start, 1 at mid-orbit, 0 at end)

  // Clockwise orbit angle on the wide ellipse
  const theta = cfg.th0 + (cfg.th1 - cfg.th0) * s;

  // Pure expansive ellipse in mid-orbit, blending seamlessly into ground/float points at edges
  const ex = ORBIT_CENTER_X + ORBIT_PEAK_RADIUS_X * Math.cos(theta);
  const ez = ORBIT_CENTER_Z + ORBIT_PEAK_RADIUS_Z * Math.sin(theta);

  const offX = (1 - w) * (cfg.d0_x + (cfg.dF_x - cfg.d0_x) * s);
  const offZ = (1 - w) * (cfg.d0_z + (cfg.dF_z - cfg.d0_z) * s);

  // Incline 3D wave: high on the sides/back (+0.36), swooping into foreground
  const baseY = THREE.MathUtils.lerp(cfg.standPos.y, cfg.floatPos.y, s);

  let x = ex + offX;
  // iPhone maintains a natural, level orbit trajectory directly transitioning from floor to float pose
  // without artificial upward arc lift or incline elevation that makes it look like it's lifting up unnaturally.
  let y =
    cfg.name === "iPhone"
      ? baseY
      : baseY + w * ORBIT_PEAK_LIFT - Math.sin(theta) * (w * ORBIT_INCLINE_AMP);
  let z = ez + offZ;

  // ---------------------------------------------------------------------------
  // DYNAMIC 3D CENTRIPETAL BANKING & CAMERA TILT (Bersus-style Cinematic Flight)
  // ---------------------------------------------------------------------------
  let roll = -Math.cos(theta) * 0.40;
  let pitch = Math.sin(theta) * 0.33;
  let yaw = Math.cos(theta) * 0.24;

  // MACBOOK LOGO AVOIDANCE & CROOK ALIGNMENT (Stage 3 mid-orbit, left flank crossing)
  // Specific to MacBook due to its large open clamshell geometry:
  // As it rounds the left flank (u ~ 0.50), dynamically rotates clockwise so the letter 'm'
  // threads gracefully through the V-shaped crook between screen and keyboard base without colliding.
  // Smoothly returns to canonical neutral pose on the right flank (u >= 0.65).
  if (cfg.name === "MacBook" && u >= 0.35 && u <= 0.65) {
    const tau = Math.abs(u - 0.50) / 0.15;
    const kAvoid = (1 - tau) * (1 - tau) * (1 + 2 * tau); // C1 smooth bell curve
    roll += ((50 * Math.PI) / 180) * kAvoid;   // Clockwise roll tilts keyboard base down
    pitch += ((12 * Math.PI) / 180) * kAvoid;  // Gentle pitch adjustments to embrace curve
    yaw += ((-12 * Math.PI) / 180) * kAvoid;   // Yaw aligns hinge along logo contour
    x += -0.035 * kAvoid;                      // Micro outward clearance (3.5 cm)
    y += 0.015 * kAvoid;                       // Subtle vertical lift (1.5 cm)
  }

  // IPAD LOGO AVOIDANCE & REVERSE YAW ROTATION (Stage 3 approach, u in [0.72, 1.00])
  // 1. Menuju samping luar logo (u in [0.72, 0.84]):
  //    iPad berputar Yaw ke kiri secara mulus mencapai tepat -90° di samping huruf 'm'.
  //    Pada posisi -90°, orientasi bodi berada tegak lurus sempurna (knife-edge profile, ~3.6 cm tipis)
  //    sehingga dari perspektif kamera depan profil bodi iPad setipis silet dan menghindari tabrakan
  //    dengan lengkungan huruf 'm'.
  // 2. Melintasi celah samping logo (u in [0.84, 0.86]):
  //    Mempertahankan orientasi pisau -90° saat meluncur melewati celah samping 'm'.
  // 3. REVERSE YAW meluncur ke balik logo menuju slot parkir (u in [0.86, 0.98]):
  //    Transformasi rotasi sumbu Y (Yaw) di-reverse secara mulus dari -90° kembali ke 0°.
  //    iPad perlahan membuka kembali bidang layarnya saat meluncur ke balik logo hingga
  //    mendarat rapi dan presisi di posisi akhirnya (floatPos & floatQuat).
  let ipadSpinAngle = 0;
  if (cfg.name === "iPad") {
    if (u >= 0.72 && u <= 0.84) {
      const t = (u - 0.72) / (0.84 - 0.72);
      const sCurve = t * t * (3 - 2 * t);
      ipadSpinAngle = -(Math.PI / 2) * sCurve; // 0° -> -90° (knife-edge avoidance)
    } else if (u > 0.84 && u <= 0.86) {
      ipadSpinAngle = -(Math.PI / 2); // Tahan -90° di samping huruf 'm'
    } else if (u > 0.86 && u <= 0.98) {
      const t = (u - 0.86) / (0.98 - 0.86);
      const sCurve = t * t * (3 - 2 * t);
      ipadSpinAngle = -(Math.PI / 2) * (1 - sCurve); // REVERSE: -90° kembali ke 0°
    } else {
      ipadSpinAngle = 0;
    }

    if (u >= 0.72 && u <= 0.96) {
      const uStart = 0.72;
      const uPeak = 0.84;
      const uEnd = 0.96;
      const tau = u < uPeak ? (uPeak - u) / (uPeak - uStart) : (u - uPeak) / (uEnd - uPeak);
      const kAvoid = (1 - tau) * (1 - tau) * (1 + 2 * tau);
      x -= 0.20 * kAvoid;                          // Posisi rapat di samping luar huruf 'm'
      y += 0.02 * kAvoid;                          // Lift halus vertikal (+2 cm)
      z -= 0.22 * kAvoid;                          // Kedalaman aman di balik huruf 'm'
      roll += ((-15 * Math.PI) / 180) * kAvoid;   // Kemiringan banking aerodinamis (-15°)
      pitch += ((10 * Math.PI) / 180) * kAvoid;   // Pitch penyesuaian (+10°)
    }
  }

  // IPHONE LOGO AVOIDANCE, 360° CONTINUOUS YAW SPIN & X-AXIS (PITCH) UPRIGHT ROTATION
  // Sesuai 3 referensi tangkapan layar pengguna:
  // - Gambar 1 (u ~ 0.74 - 0.75): Titik lanjut spin (tahan pisau -90°). Di titik ini iPhone mulai ditegakkan pada sumbu X.
  // - Gambar 2 (u ~ 0.82): iPhone berada di atas antara 'm' & 'e' (punggung/kamera menghadap depan).
  //                        Di titik ini iPhone sudah dalam keadaan 100% tegak lurus sempurna (X-axis upright).
  // - Gambar 3 (u ~ 0.88): iPhone berada di atas antara 'u' & 'i'.
  //                        Di titik ini animasi spin 360° berakhir (-360° = 0°),
  //                        dan posisi miring rotate sumbu X dikembalikan seperti semula menuju floating/landing pose.
  let iphoneSpinAngle = 0;
  let iphonePitchOffset = 0;
  if (cfg.name === "iPhone") {
    // 1. Spin 360° Kinematics
    // Mulai rotasi pisau silet lebih awal (u: 0.60 -> 0.68) agar saat berada di samping kiri logo ('m'),
    // iPhone sudah dalam profil pisau setipis 1.6 cm sehingga dapat meluncur sangat dekat dengan logo.
    if (u >= 0.60 && u <= 0.68) {
      const t = (u - 0.60) / (0.68 - 0.60);
      const sCurve = t * t * (3 - 2 * t);
      iphoneSpinAngle = -(Math.PI / 2) * sCurve; // 0° -> -90° (knife-edge avoidance awal)
    } else if (u > 0.68 && u <= 0.75) {
      iphoneSpinAngle = -(Math.PI / 2); // Tahan pisau -90° meluncur rapat di samping luar 'm' hingga Gambar 1
    } else if (u > 0.75 && u <= 0.88) {
      const t = (u - 0.75) / (0.88 - 0.75);
      const sCurve = t * t * (3 - 2 * t);
      iphoneSpinAngle = -(Math.PI / 2) - ((3 * Math.PI) / 2) * sCurve; // -90° -> -360° (berakhir di Gambar 3)
    } else if (u > 0.88) {
      iphoneSpinAngle = -2 * Math.PI; // Spin 360° selesai sepenuhnya di Gambar 3!
    }

    // 2. X-Axis (Pitch) Upright Rotation
    // Ditegakkan mulai dari Gambar 1 (u = 0.74), tegak 100% di Gambar 2 (u = 0.82),
    // lalu kemiringan sumbu X dikembalikan seperti semula tepat di Gambar 3 (u = 0.88).
    if (u >= 0.74 && u <= 0.82) {
      const t = (u - 0.74) / (0.82 - 0.74);
      const kUpright = t * t * (3 - 2 * t);
      iphonePitchOffset = ((20 * Math.PI) / 180) * kUpright; // Mulai ditegakkan -> 100% tegak lurus sempurna
    } else if (u > 0.82 && u <= 0.88) {
      const t = (u - 0.82) / (0.88 - 0.82);
      const kUpright = 1 - t * t * (3 - 2 * t);
      iphonePitchOffset = ((20 * Math.PI) / 180) * kUpright; // Kembalikan posisi miring rotate sumbu X seperti sebelumnya
    }

    // 3. Snug Contour Hug on the Left Flank of Logo (u in [0.62, 0.72])
    // Mendekatkan lintasan iPhone ke sisi kiri logo 'm' (jarak rapat ~3.5 cm)
    if (u >= 0.62 && u <= 0.72) {
      const uMid = 0.67;
      const tau = Math.abs(u - uMid) / 0.05;
      if (tau < 1) {
        const kHug = (1 - tau) * (1 - tau) * (1 + 2 * tau);
        x += 0.05 * kHug;                           // Tarik iPhone mendekati logo ke arah dalam
        roll += ((-12 * Math.PI) / 180) * kHug;     // Banking aerodinamis memeluk kontur samping 'm'
      }
    }

    // 4. Smooth Diagonal Forward-Right Glide into Float Pose (u in [0.86, 1.00])
    // Sesuai umpan balik pengguna:
    // Alih-alih berhenti di satu titik di sebelah kanan dan langsung menusuk ke depan,
    // iPhone meluncur anggun dan realistis secara kontinu dari kiri ke kanan (monotonic X, zero freezing)
    // sambil secara bertahap dan simultan bergerak maju ke depan pada sumbu Z (monotonic Z).
    // - Titik start mulai bergerak maju ke depan di dekat 'u' (u ~ 0.86, Gambar 2 pengguna).
    // - Meluncur di balik huruf 'n' (u ~ 0.94, Gambar 1 pengguna) dengan kedalaman Z yang aman.
    // - Mendarat mulus dan presisi di floatPos depan (u = 1.00, [0.84, 0.28, 0.08]).
    if (u >= 0.86 && u <= 1.00) {
      const t = (u - 0.86) / (1.00 - 0.86);
      const kZ = Math.sin(t * Math.PI);
      z -= 0.035 * kZ;
    }
  }

  outPos.set(x, y, z);

  const pitchOffset = cfg.name === "iPhone" ? iphonePitchOffset : 0;
  const qDynamic = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(pitch * w + pitchOffset, yaw * w, roll * w, "YXZ")
  );
  const qBase = new THREE.Quaternion().slerpQuaternions(
    cfg.standQuat,
    cfg.floatQuat,
    s
  );

  const spinAngle = cfg.name === "iPad" ? ipadSpinAngle : cfg.name === "iPhone" ? iphoneSpinAngle : 0;
  if (spinAngle !== 0) {
    _tmpSpinQuat.setFromAxisAngle(_tmpUpAxis, spinAngle);
    outQuat.copy(_tmpSpinQuat).multiply(qDynamic).multiply(qBase);
    if (outQuat.dot(cfg.floatQuat) < 0) {
      outQuat.set(-outQuat.x, -outQuat.y, -outQuat.z, -outQuat.w);
    }
  } else {
    outQuat.copy(qDynamic).multiply(qBase);
  }
}

// -----------------------------------------------------------------------------
// 3D MAGNETIC CURSOR ATTRACTION & PARALLAX DEPTH (GSAP)
// Active starting from Stage 3 when devices lift into the air (p >= 0.22).
// When hovered, the 3D device magnetically pulls towards the pointer,
// lifts closer to camera, tilts dynamically into the pointer vector,
// and snaps back with elastic spring physics on mouse leave.
// -----------------------------------------------------------------------------
interface Magnetic3DState {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
}

function useMagneticDevice3D(progress: number, enabledMinProgress: number = 0.22) {
  const magneticRef = useRef<Magnetic3DState>({
    x: 0,
    y: 0,
    z: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scale: 1,
  });
  const isHoveredRef = useRef(false);

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (progress < enabledMinProgress) return;
      e.stopPropagation();
      isHoveredRef.current = true;
      if (typeof document !== "undefined") {
        document.body.style.cursor = "grab";
      }
    },
    [progress, enabledMinProgress]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>, currentWorldPos: THREE.Vector3) => {
      if (progress < enabledMinProgress) {
        if (isHoveredRef.current) {
          isHoveredRef.current = false;
          if (typeof document !== "undefined") {
            document.body.style.cursor = "auto";
          }
          gsap.killTweensOf(magneticRef.current);
          magneticRef.current.x = 0;
          magneticRef.current.y = 0;
          magneticRef.current.z = 0;
          magneticRef.current.rotX = 0;
          magneticRef.current.rotY = 0;
          magneticRef.current.rotZ = 0;
          magneticRef.current.scale = 1;
        }
        return;
      }
      e.stopPropagation();
      isHoveredRef.current = true;

      // Project 3D object center to Normalized Device Coordinates (NDC [-1, 1])
      const screenPos = currentWorldPos.clone().project(e.camera);
      const dx = THREE.MathUtils.clamp(e.pointer.x - screenPos.x, -0.65, 0.65);
      const dy = THREE.MathUtils.clamp(e.pointer.y - screenPos.y, -0.65, 0.65);

      // 3D Magnetic Attraction: draws device towards cursor with parallax tilt & forward lift
      gsap.to(magneticRef.current, {
        x: dx * 0.24,
        y: dy * 0.24,
        z: 0.08,
        rotX: -dy * 0.30,
        rotY: dx * 0.30,
        rotZ: -dx * 0.15,
        scale: 1.045,
        duration: 0.28,
        ease: "power2.out",
        overwrite: "auto",
      });
    },
    [progress, enabledMinProgress]
  );

  const handlePointerOut = useCallback(
    (e?: ThreeEvent<PointerEvent>) => {
      if (e) e.stopPropagation();
      isHoveredRef.current = false;
      if (typeof document !== "undefined") {
        document.body.style.cursor = "auto";
      }

      // Elastic Snap-Back Rebound to exact orbital trajectory
      gsap.to(magneticRef.current, {
        x: 0,
        y: 0,
        z: 0,
        rotX: 0,
        rotY: 0,
        rotZ: 0,
        scale: 1.0,
        duration: 0.72,
        ease: "elastic.out(1.15, 0.42)",
        overwrite: "auto",
      });
    },
    []
  );

  // If progress drops below enabled threshold (e.g. user scrolls back to floor in Stage 1/2),
  // smoothly reset to zero immediately so device sits completely flush on the floor
  useEffect(() => {
    if (progress < enabledMinProgress && isHoveredRef.current) {
      handlePointerOut();
    }
  }, [progress, enabledMinProgress, handlePointerOut]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.cursor = "auto";
      }
      gsap.killTweensOf(magneticRef.current);
    };
  }, []);

  return {
    magneticRef,
    isHoveredRef,
    handlePointerOver,
    handlePointerMove,
    handlePointerOut,
  };
}

// -----------------------------------------------------------------------------
// CENTER BACKGROUND PIECE: MacBook Pro (macbook_pro_silver.glb)
// Stage 1 & 2: Resting on floor at [0.0, -0.450, -0.45] behind menuin. logo with screen open
// Stage 3: Clockwise orbit & clockwise tumble into float pose [0.0, 0.18, -0.35]
// -----------------------------------------------------------------------------
function MacBookProMonument({
  progress,
  screenTexture,
}: {
  progress: number;
  screenTexture: THREE.Texture;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const {
    magneticRef,
    handlePointerOver,
    handlePointerMove,
    handlePointerOut,
  } = useMagneticDevice3D(progress);

  const config = useMemo(
    () =>
      createOrbitConfig(
        "MacBook",
        [0.0, -0.45, -0.45],
        [0, -0.12, 0, "YXZ"],
        [0.0, -0.45, -0.45],
        [0, -0.12, 0, "YXZ"],
        [-0.53, 0.020, 0.54],
        [-0.017, 0.320, 0.080, "YXZ"],
        (565 * Math.PI) / 180
      ),
    []
  );

  const reveal = useMemo(() => {
    if (progress <= 0.02) return 0;
    if (progress >= 0.2) return 1;
    const t = (progress - 0.02) / 0.18;
    return t * t * (3 - 2 * t);
  }, [progress]);

  const sceneCloned = useHeroDeviceModel("macbook", screenTexture, reveal);

  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const pivotRef = useRef<THREE.Object3D | null>(null);
  const trackingRef = useRef<THREE.Object3D | null>(null);
  useEffect(() => {
    pivotRef.current = sceneCloned.getObjectByName("Display_Hinge_Pivot") || null;
    trackingRef.current = sceneCloned.getObjectByName("MacBook_Rigid_Tracking") || null;
  }, [sceneCloned]);
  const qInitialPitch = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.8849555, 0, 0, "XYZ")),
    []
  );
  const toCamVec = useMemo(() => new THREE.Vector3(), []);
  const toCamLocal = useMemo(() => new THREE.Vector3(), []);
  const invBaseQuat = useMemo(() => new THREE.Quaternion(), []);
  const qYaw = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state) => {
    if (groupRef.current) {
      evaluateOrbitTransform(config, progress, state.clock.elapsedTime, tempPos, tempQuat);

      // Keep the existing screen tracking path while the chassis follows as one rigid laptop.
      if (pivotRef.current && trackingRef.current) {
        let wLaptop = 0;
        if (progress > 0.44 && progress < 0.85) {
          if (progress < 0.68) {
            const t = (progress - 0.44) / (0.68 - 0.44);
            wLaptop = t * t * (3 - 2 * t);
          } else {
            const t = (progress - 0.68) / (0.85 - 0.68);
            wLaptop = 1 - t * t * (3 - 2 * t);
          }
        }

        if (wLaptop > 0) {
          toCamVec.subVectors(state.camera.position, tempPos);
          invBaseQuat.copy(tempQuat).invert();
          toCamLocal.copy(toCamVec).applyQuaternion(invBaseQuat);
          const targetYaw = Math.atan2(toCamLocal.x, toCamLocal.z);
          // Resting horizontal angle to camera in local space at p = 0.44
          const baseRestingYaw = -0.070;
          const deltaYaw = targetYaw - baseRestingYaw;

          qYaw.setFromAxisAngle(Y_AXIS, wLaptop * deltaYaw);
          trackingRef.current.quaternion.copy(qYaw);
          pivotRef.current.quaternion.copy(qInitialPitch);
        } else {
          trackingRef.current.quaternion.identity();
          pivotRef.current.quaternion.copy(qInitialPitch);
        }
      }

      // Apply 3D Magnetic Cursor Attraction & Parallax Depth (Stage 3+)
      const mag = magneticRef.current;
      tempPos.x += mag.x;
      tempPos.y += mag.y;
      tempPos.z += mag.z;

      if (mag.rotX !== 0 || mag.rotY !== 0 || mag.rotZ !== 0) {
        const qMag = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(mag.rotX, mag.rotY, mag.rotZ, "YXZ")
        );
        tempQuat.multiply(qMag);
      }

      groupRef.current.position.copy(tempPos);
      groupRef.current.quaternion.copy(tempQuat);
      groupRef.current.scale.set(mag.scale, mag.scale, mag.scale);
    }
  });

  return (
    <group
      ref={groupRef}
      name="shadow-target-macbook"
      onPointerOver={handlePointerOver}
      onPointerMove={(e) => handlePointerMove(e, groupRef.current ? groupRef.current.position : tempPos)}
      onPointerOut={handlePointerOut}
    >
      <primitive object={sceneCloned} scale={[1.15, 1.15, 1.15]} />
    </group>
  );
}

// -----------------------------------------------------------------------------
// LEFT FOREGROUND PIECE: iPhone 17 Pro Max (adapted to the original hero envelope)
// Stage 1 & 2: Resting flat on floor at [-0.72, -0.4447, 0.45] with screen facing UP (+Y)
// Stage 3: Clockwise orbit & clockwise tumble into float pose [-0.58, 0.14, 0.20] (Stage 4 Zoom focus)
// -----------------------------------------------------------------------------
function IPhoneSatellite({
  progress,
  screenTexture,
}: {
  progress: number;
  screenTexture: THREE.Texture;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const {
    magneticRef,
    handlePointerOver,
    handlePointerMove,
    handlePointerOut,
  } = useMagneticDevice3D(progress);

  const config = useMemo(
    () =>
      createOrbitConfig(
        "iPhone",
        [-0.72, -0.4447, 0.45],
        [0, 0.38, 0, "YXZ"],
        [-0.72, -0.3613, 0.415],
        [0.907, 0.32, -0.06, "YXZ"],
        [0.84, 0.28, 0.08],
        [1.484, -0.314, -0.105, "ZYX"],
        (510 * Math.PI) / 180
      ),
    []
  );

  const reveal = useMemo(() => {
    if (progress <= 0.02) return 0;
    if (progress >= 0.2) return 1;
    const t = (progress - 0.02) / 0.18;
    return t * t * (3 - 2 * t);
  }, [progress]);

  const sceneCloned = useHeroDeviceModel("iphone", screenTexture, reveal);

  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const toCamVec = useMemo(() => new THREE.Vector3(), []);
  const camUpWorld = useMemo(() => new THREE.Vector3(), []);
  const targetTop = useMemo(() => new THREE.Vector3(), []);
  const targetRight = useMemo(() => new THREE.Vector3(), []);
  const negTop = useMemo(() => new THREE.Vector3(), []);
  const basisMatrix = useMemo(() => new THREE.Matrix4(), []);
  const qUpright = useMemo(() => new THREE.Quaternion(), []);
  const qRoll = useMemo(() => new THREE.Quaternion(), []);
  const qTarget = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state) => {
    if (groupRef.current) {
      evaluateOrbitTransform(config, progress, state.clock.elapsedTime, tempPos, tempQuat);

      // Camera-Aware Tracking:
      // Stage 3 (p <= 0.44): Neutral resting pose (casual clockwise tilt against logo).
      // Stage 4 (p -> 0.68): Tilts subtly counter-clockwise (-6.5° CCW on screen) facing camera.
      // Stage 5 (p -> 0.90): Straightens out to 100% vertical and upright on screen facing lens.
      if (progress > 0.44) {
        toCamVec.subVectors(state.camera.position, tempPos).normalize();
        camUpWorld.set(0, 1, 0).transformDirection(state.camera.matrixWorld).normalize();
        targetTop.copy(camUpWorld).addScaledVector(toCamVec, -camUpWorld.dot(toCamVec)).normalize();
        targetRight.crossVectors(targetTop, toCamVec).normalize();
        // iPhone raw mesh: normal along +Y, top along -Z, right along +X
        negTop.copy(targetTop).negate();
        basisMatrix.makeBasis(targetRight, toCamVec, negTop);
        qUpright.setFromRotationMatrix(basisMatrix);

        if (progress < 0.68) {
          const t = (progress - 0.44) / (0.68 - 0.44);
          const k = t * t * (3 - 2 * t);
          // Stage 4: CCW tilt on screen (+10.5 deg around toCam gives -6.5 deg CCW tilt on screen)
          qRoll.setFromAxisAngle(toCamVec, (10.5 * Math.PI) / 180);
          qTarget.copy(qRoll).multiply(qUpright);
          tempQuat.slerp(qTarget, k);
        } else if (progress <= 0.90) {
          // Stage 4 -> Stage 5: transitions smoothly from CCW tilt into perfectly vertical (0.0 deg roll)
          const t = (progress - 0.68) / (0.90 - 0.68);
          const k = t * t * (3 - 2 * t);
          const currentRollAngle = THREE.MathUtils.lerp((10.5 * Math.PI) / 180, 0.0, k);
          qRoll.setFromAxisAngle(toCamVec, currentRollAngle);
          qTarget.copy(qRoll).multiply(qUpright);
          tempQuat.copy(qTarget);
        } else {
          // Post-Stage 5 (p in [0.90, 0.99]): Smoothly return to exact Stage 3 neutral resting pose
          const tExit = Math.min(1, (progress - 0.90) / 0.09);
          const kExit = tExit * tExit * (3 - 2 * tExit);
          qTarget.copy(qUpright);
          tempQuat.copy(qTarget).slerp(config.floatQuat, kExit);
        }
      }

      // Apply 3D Magnetic Cursor Attraction & Parallax Depth (Stage 3+)
      const mag = magneticRef.current;
      tempPos.x += mag.x;
      tempPos.y += mag.y;
      tempPos.z += mag.z;

      if (mag.rotX !== 0 || mag.rotY !== 0 || mag.rotZ !== 0) {
        const qMag = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(mag.rotX, mag.rotY, mag.rotZ, "YXZ")
        );
        tempQuat.multiply(qMag);
      }

      groupRef.current.position.copy(tempPos);
      groupRef.current.quaternion.copy(tempQuat);
      groupRef.current.scale.set(mag.scale, mag.scale, mag.scale);
    }
  });

  return (
    <group
      ref={groupRef}
      name="shadow-target-iphone"
      onPointerOver={handlePointerOver}
      onPointerMove={(e) => handlePointerMove(e, groupRef.current ? groupRef.current.position : tempPos)}
      onPointerOut={handlePointerOut}
    >
      <primitive object={sceneCloned} scale={[1.35, 1.35, 1.35]} />
    </group>
  );
}

// -----------------------------------------------------------------------------
// RIGHT FOREGROUND PIECE: iPad Pro (ipad_pro_space_black_blue.glb)
// Stage 1 & 2: Resting flat on floor at [0.72, -0.4429, 0.45] with screen facing UP (+Y)
// Stage 3: Clockwise orbit & clockwise tumble into float pose [0.65, 0.10, 0.18] (Stage 5 Focus)
// -----------------------------------------------------------------------------
function IPadSatellite({
  progress,
  screenTexture,
}: {
  progress: number;
  screenTexture: THREE.Texture;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const {
    magneticRef,
    handlePointerOver,
    handlePointerMove,
    handlePointerOut,
  } = useMagneticDevice3D(progress);

  const config = useMemo(
    () =>
      createOrbitConfig(
        "iPad",
        [0.72, -0.4429, 0.45],
        [-Math.PI / 2, -0.28, 0, "YXZ"],
        [0.72, -0.3592, 0.410],
        [-0.628, -0.26, 0.05, "YXZ"],
        [-0.22, 0.13, -0.20],
        [-0.10, 0.32, 0.07, "YXZ"],
        (560 * Math.PI) / 180
      ),
    []
  );

  const reveal = useMemo(() => {
    if (progress <= 0.02) return 0;
    if (progress >= 0.2) return 1;
    const t = (progress - 0.02) / 0.18;
    return t * t * (3 - 2 * t);
  }, [progress]);

  const sceneCloned = useHeroDeviceModel("ipad", screenTexture, reveal);

  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const toCamVec = useMemo(() => new THREE.Vector3(), []);
  const camUpWorld = useMemo(() => new THREE.Vector3(), []);
  const targetTop = useMemo(() => new THREE.Vector3(), []);
  const targetRight = useMemo(() => new THREE.Vector3(), []);
  const basisMatrix = useMemo(() => new THREE.Matrix4(), []);
  const qUpright = useMemo(() => new THREE.Quaternion(), []);
  const qRoll = useMemo(() => new THREE.Quaternion(), []);
  const qTarget = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state) => {
    if (groupRef.current) {
      evaluateOrbitTransform(config, progress, state.clock.elapsedTime, tempPos, tempQuat);

      // Camera-Aware Tracking for iPad:
      // Stage 3 (p <= 0.44): Neutral resting pose behind logo between 'e' and 'n'.
      // Stage 4 (p -> 0.68): Swivels smoothly facing camera on the left with subtle dynamic banking.
      // Stage 5 (p -> 0.90): Straightens out vertically facing camera.
      if (progress > 0.44) {
        toCamVec.subVectors(state.camera.position, tempPos).normalize();
        camUpWorld.set(0, 1, 0).transformDirection(state.camera.matrixWorld).normalize();
        targetTop.copy(camUpWorld).addScaledVector(toCamVec, -camUpWorld.dot(toCamVec)).normalize();
        targetRight.crossVectors(targetTop, toCamVec).normalize();
        // iPad raw mesh: normal along +Z, top along +Y, right along +X
        basisMatrix.makeBasis(targetRight, targetTop, toCamVec);
        qUpright.setFromRotationMatrix(basisMatrix);

        if (progress < 0.68) {
          const t = (progress - 0.44) / (0.68 - 0.44);
          const k = t * t * (3 - 2 * t);
          qRoll.setFromAxisAngle(toCamVec, (7.0 * Math.PI) / 180);
          qTarget.copy(qRoll).multiply(qUpright);
          tempQuat.slerp(qTarget, k);
        } else if (progress <= 0.90) {
          const t = (progress - 0.68) / (0.90 - 0.68);
          const k = t * t * (3 - 2 * t);
          const currentRollAngle = THREE.MathUtils.lerp((7.0 * Math.PI) / 180, 0.0, k);
          qRoll.setFromAxisAngle(toCamVec, currentRollAngle);
          qTarget.copy(qRoll).multiply(qUpright);
          tempQuat.copy(qTarget);
        } else {
          // Post-Stage 5 (p in [0.90, 0.99]): Smoothly return to exact Stage 3 neutral resting pose
          const tExit = Math.min(1, (progress - 0.90) / 0.09);
          const kExit = tExit * tExit * (3 - 2 * tExit);
          qTarget.copy(qUpright);
          tempQuat.copy(qTarget).slerp(config.floatQuat, kExit);
        }
      }

      // Apply 3D Magnetic Cursor Attraction & Parallax Depth (Stage 3+)
      const mag = magneticRef.current;
      tempPos.x += mag.x;
      tempPos.y += mag.y;
      tempPos.z += mag.z;

      if (mag.rotX !== 0 || mag.rotY !== 0 || mag.rotZ !== 0) {
        const qMag = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(mag.rotX, mag.rotY, mag.rotZ, "YXZ")
        );
        tempQuat.multiply(qMag);
      }

      groupRef.current.position.copy(tempPos);
      groupRef.current.quaternion.copy(tempQuat);
      groupRef.current.scale.set(mag.scale, mag.scale, mag.scale);
    }
  });

  return (
    <group
      ref={groupRef}
      name="shadow-target-ipad"
      onPointerOver={handlePointerOver}
      onPointerMove={(e) => handlePointerMove(e, groupRef.current ? groupRef.current.position : tempPos)}
      onPointerOut={handlePointerOut}
    >
      <primitive object={sceneCloned} scale={[1.2, 1.2, 1.2]} />
    </group>
  );
}

// -----------------------------------------------------------------------------
// MAIN SCENE CONTAINER
// -----------------------------------------------------------------------------
function SceneContent({
  progress,
  cameraMode = "A",
}: {
  progress: number;
  cameraMode?: CameraMode;
}) {
  // Load official Menuin wallpapers (ultra-lightweight ~15-24KB, smooth 60fps)
  const horiWhiteTex = useTexture("/menuin-hori-white.png");
  const horiBlueTex = useTexture("/menuin-hori-blue.png");
  const phoneContentTex = useTexture("/content-hp.png");

  // MacBook Pro Screen: Horizontal Menuin White Wallpaper (Flip V to be upright without mirroring horizontally)
  const macbookTex = useMemo(() => {
    const tex = horiWhiteTex.clone();
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, -1);
    tex.offset.set(0, 1);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
  }, [horiWhiteTex]);

  // iPhone screen: keep the existing wallpaper and upright UV convention.
  const iphoneTex = useMemo(() => {
    const tex = phoneContentTex.clone();
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, -1);
    tex.offset.set(0, 1);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
  }, [phoneContentTex]);

  // Right iPad Pro Screen: Horizontal Menuin Blue Wallpaper (Flip V to be upright without mirroring horizontally)
  const ipadRightTex = useMemo(() => {
    const tex = horiBlueTex.clone();
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, -1);
    tex.offset.set(0, 1);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
  }, [horiBlueTex]);

  // Ground contact shadows fade smoothly as devices lift off (progress 0.22 -> 0.38)
  const groundShadowFade = useMemo(() => {
    if (progress <= 0.22) return 1;
    if (progress >= 0.38) return 0;
    const t = (progress - 0.22) / 0.16;
    return 1 - t * t * (3 - 2 * t);
  }, [progress]);

  return (
    <>
      <CameraRig progress={progress} cameraMode={cameraMode} />
      <StudioLighting progress={progress} />

      {/* Midground 3D Wordmark floating at Z = -0.05 */}
      <BackgroundWordmark progress={progress} />

      {/* 3-Piece Depth Ecosystem resting on Y_FLOOR = -0.450:
          - Background (Z = -0.45, behind menuin.): MacBook Pro with open screen
          - Foreground Left (Z = +0.45, in front): iPhone 17 Pro Max flat on floor
          - Foreground Right (Z = +0.45, in front): iPad Pro flat on floor */}
      <HeroDeviceReflections>
        <MacBookProMonument progress={progress} screenTexture={macbookTex} />
        <IPhoneSatellite progress={progress} screenTexture={iphoneTex} />
        <IPadSatellite progress={progress} screenTexture={ipadRightTex} />
      </HeroDeviceReflections>

      {/* Soft cast shadows driven by the single key light.
          Each object gets its own footprint, blur and intensity based on its
          real-time height above the floor (crisp near contact, diffuse when floating).
          Mounted after the objects so they read the same-frame transforms. */}
      <HeightAwareShadow targetName="shadow-target-logo" nearOpacity={0.14} farOpacity={0.06} spread={0.22} fadeHeight={1.0} />
      <HeightAwareShadow targetName="shadow-target-macbook" nearOpacity={0.26} farOpacity={0.14} spread={0.28} />
      <HeightAwareShadow targetName="shadow-target-ipad" nearOpacity={0.22} farOpacity={0.11} spread={0.30} />
      <HeightAwareShadow targetName="shadow-target-iphone" nearOpacity={0.20} farOpacity={0.10} spread={0.32} />

      {/* Crisp ContactShadow directly under MacBook base (resting at [0.0, -0.4502, -0.45]) */}
      {groundShadowFade > 0.001 && (
        <ContactShadows
          position={[0.0, -0.4502, -0.45]}
          opacity={0.80 * groundShadowFade}
          scale={0.95}
          blur={0.42}
          far={0.04}
          color="#050811"
        />
      )}
      {/* Crisp ContactShadow directly under resting iPhone */}
      {groundShadowFade > 0.001 && (
        <ContactShadows
          position={[-0.72, -0.4502, 0.435]}
          opacity={0.85 * groundShadowFade}
          scale={0.58}
          blur={0.45}
          far={0.08}
          color="#050811"
        />
      )}
      {/* Crisp ContactShadow directly under resting iPad */}
      {groundShadowFade > 0.001 && (
        <ContactShadows
          position={[0.72, -0.4502, 0.435]}
          opacity={0.85 * groundShadowFade}
          scale={0.78}
          blur={0.45}
          far={0.08}
          color="#050811"
        />
      )}
    </>
  );
}

// -----------------------------------------------------------------------------
// HERO 3D SCENE ROOT COMPONENT
// -----------------------------------------------------------------------------
export default function Hero3DScene({
  progress,
  cameraMode = "A",
  active = true,
}: Hero3DSceneProps) {
  return (
    <div className="absolute inset-0 h-full w-full pointer-events-none">
      <Canvas
        frameloop={active ? "always" : "demand"}
        shadows
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        camera={{
          fov: 35,
          near: 0.1,
          far: 50,
          position: [0, 0.34, 3.85],
        }}
        className="h-full w-full pointer-events-auto"
        onPointerLeave={() => {
          if (typeof document !== "undefined") {
            document.body.style.cursor = "auto";
          }
        }}
      >
        <React.Suspense fallback={null}>
          <SceneContent progress={progress} cameraMode={cameraMode} />
        </React.Suspense>
      </Canvas>
    </div>
  );
}

// Preload 3D Models and Textures
useGLTF.preload("/hero/3d/menuin_3d_text.glb");
useGLTF.preload(HERO_DEVICE_MODELS.macbook);
useGLTF.preload(HERO_DEVICE_MODELS.iphone);
useGLTF.preload(HERO_DEVICE_MODELS.ipad);
useTexture.preload("/menuin-hori-white.png");
useTexture.preload("/menuin-hori-blue.png");
useTexture.preload("/content-hp.png");

