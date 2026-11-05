import * as THREE from "three";

export function addMacBookTrackingPivot(scene: THREE.Object3D) {
  const hinge = scene.getObjectByName("Display_Hinge_Pivot");
  if (!hinge?.parent) return null;

  const body = hinge.parent;
  const parts = [...body.children];
  const tracking = new THREE.Group();
  tracking.name = "MacBook_Rigid_Tracking";
  tracking.position.copy(hinge.position);
  body.add(tracking);

  // Track around the same hinge, but keep the keyboard and display rigidly aligned.
  for (const part of parts) tracking.attach(part);
  return tracking;
}
