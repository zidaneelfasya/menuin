"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { addMacBookTrackingPivot } from "./hero-laptop-rig";

export const HERO_DEVICE_MODELS = {
  macbook: "/hero/3d/macbook_pro_silver_hero.glb",
  iphone: "/hero/3d/iphone_17_pro_max_silver.glb",
  ipad: "/hero/3d/ipad_pro_space_black_hero.glb",
} as const;

const DeviceReflections = createContext<THREE.Texture | null>(null);

// Model-only reflection map: the existing stage lights, logo and backdrop stay intact.
export function HeroDeviceReflections({ children }: { children: ReactNode }) {
  const gl = useThree((state) => state.gl);
  const [environment, setEnvironment] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const studio = new THREE.Scene();
    studio.background = new THREE.Color("#777d87");
    const geometry = new THREE.PlaneGeometry();
    const materials: THREE.MeshBasicMaterial[] = [];
    for (const [x, y, z, width, height, intensity] of [
      [-3, 1.5, 3, 1, 5, 4], [3, 0.5, 1, 0.6, 4, 2.4],
      [0, 4, 0, 4, 2, 2.5], [-1, 1, -4, 2, 4, 2],
    ]) {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setScalar(intensity), toneMapped: false,
      });
      const panel = new THREE.Mesh(geometry, material);
      panel.position.set(x, y, z);
      panel.scale.set(width, height, 1);
      panel.lookAt(0, 0, 0);
      studio.add(panel);
      materials.push(material);
    }
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(studio, 0.03, 0.1, 10, { size: 128 });
    setEnvironment(target.texture);
    geometry.dispose();
    materials.forEach((material) => material.dispose());
    pmrem.dispose();
    return () => target.dispose();
  }, [gl]);

  return <DeviceReflections.Provider value={environment}>{children}</DeviceReflections.Provider>;
}

type Device = keyof typeof HERO_DEVICE_MODELS;

// Retain each authored material, with the hero's original silhouette-to-lit timing.
export function useHeroDeviceModel(device: Device, screenTexture: THREE.Texture, reveal: number) {
  const { scene } = useGLTF(HERO_DEVICE_MODELS[device]);
  const environment = useContext(DeviceReflections);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const materialClones = new Map<THREE.Material, THREE.MeshStandardMaterial>();
    const screen = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
    const targets: {
      material: THREE.MeshStandardMaterial;
      color: THREE.Color;
      metalness: number;
      roughness: number;
    }[] = [];

    clone.traverse((child) => {
      if (child.name.includes("Root") || child === clone.children[0]) {
        child.rotation.set(0, 0, 0);
        child.quaternion.identity();
        child.position.set(0, 0, 0);
      }
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (/^(OLED_Display|MacBook_Display_Screen|iPad_Pro_DisplayScreen)$/.test(child.name)) {
        child.material = screen;
        return;
      }
      const cloneMaterial = (source: THREE.MeshStandardMaterial) => {
        let material = materialClones.get(source);
        if (!material) {
          material = source.clone();
          // Low-cost opaque lens coatings retain dark optics without transmission passes.
          if (material instanceof THREE.MeshPhysicalMaterial) {
            material.transmission = 0;
            material.specularIntensity = Math.min(1, material.specularIntensity);
          }
          materialClones.set(source, material);
          targets.push({ material, color: material.color.clone(),
            metalness: material.metalness, roughness: material.roughness });
        }
        return material;
      };
      child.material = Array.isArray(child.material)
        ? child.material.map(cloneMaterial) : cloneMaterial(child.material);
    });

    if (device === "macbook") {
      addMacBookTrackingPivot(clone);
    } else if (device === "iphone") {
      // Match the old handset's +Y screen / -Z top and 160.7 × 77.6 mm hero envelope.
      // Bake adaptation inside the model; orbit, floor pose and camera tracking use the same axes.
      const handset = clone.children[0];
      handset.rotation.x = -Math.PI / 2;
      handset.scale.set(77.6 / 78, 160.7 / 163.4, 7.85 / 8.75);
    }
    return { scene: clone, screen, targets, dark: new THREE.Color("#050505"),
      black: new THREE.Color(0), white: new THREE.Color(1, 1, 1) };
  }, [device, scene, screenTexture]);

  useEffect(() => {
    for (const { material } of model.targets) {
      material.envMap = environment;
      material.needsUpdate = true;
    }
  }, [model, environment]);

  useFrame(() => {
    model.screen.color.copy(model.white);
    for (const { material, color, metalness, roughness } of model.targets) {
      material.color.copy(color);
      material.metalness = metalness;
      material.roughness = roughness;
      material.envMapIntensity = 0.65;
    }
  });

  useEffect(() => () => {
    model.screen.dispose();
    model.targets.forEach(({ material }) => material.dispose());
  }, [model]);

  return model.scene;
}
