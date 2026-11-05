// Decode the real exported assets and protect the hero's model/animation contract.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import ts from "typescript";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { addMacBookTrackingPivot } from "../../apps/web/src/components/landing/hero-laptop-rig.ts";

globalThis.self = globalThis;
globalThis.ProgressEvent = class {
  constructor(type, init) { this.type = type; Object.assign(this, init); }
};
globalThis.createImageBitmap = async (blob) => {
  const { width, height } = await sharp(Buffer.from(await blob.arrayBuffer())).metadata();
  return { width, height, close() {} };
};
const root = path.resolve(import.meta.dirname, "../..");
const assetPath = path.join(root, "apps/web/public/hero/3d");
async function load(name) {
  const bytes = await readFile(path.join(assetPath, name + ".glb"));
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "",
  );
  gltf.scene.children[0].quaternion.identity();
  gltf.scene.updateMatrixWorld(true);
  return { ...gltf, bytes: bytes.length };
}
function stats(gltf) {
  let triangles = 0, draws = 0;
  gltf.scene.traverse((obj) => {
    if (!obj.isMesh) return;
    draws++;
    const positions = obj.geometry.attributes.position;
    const normals = obj.geometry.attributes.normal;
    triangles += (obj.geometry.index?.count ?? positions.count) / 3;
    for (let i = 0; i < positions.count; i++) {
      assert(Number.isFinite(positions.getX(i) + positions.getY(i) + positions.getZ(i)));
      assert(Math.abs(Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i)) - 1) < .003);
    }
    for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material]) {
      assert(!(mat.transmission > 0), "Avoid an extra lens transmission pass");
    }
  });
  return { bytes: gltf.bytes, triangles, draws };
}
function screenVertices(scene, name) {
  const screen = scene.getObjectByName(name);
  assert(screen?.isMesh, "Missing independently replaceable screen: " + name);
  const { position, uv } = screen.geometry.attributes;
  return Array.from({ length: position.count }, (_, i) => {
    const p = new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(screen.matrixWorld);
    return [...p.toArray(), uv.getX(i), uv.getY(i)];
  }).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}
function near(a, b, message, tolerance = 2e-6) {
  assert.equal(a.length, b.length, message);
  a.forEach((v, i) => assert(Math.abs(v - b[i]) < tolerance, message + ` (${v} vs ${b[i]})`));
}

function verifyMacBookTracking(source) {
  const original = source.clone(true), corrected = source.clone(true);
  const tracking = addMacBookTrackingPivot(corrected);
  assert(tracking, "Missing rigid laptop tracking pivot");
  original.updateMatrixWorld(true);
  corrected.updateMatrixWorld(true);
  original.traverse((part) => {
    if (part.isMesh) near(corrected.getObjectByName(part.name).matrixWorld.elements,
      part.matrixWorld.elements, "Rig setup moved " + part.name);
  });

  const oldHinge = original.getObjectByName("Display_Hinge_Pivot");
  const hinge = corrected.getObjectByName("Display_Hinge_Pivot");
  const pitch = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.8849555, 0, 0));
  hinge.quaternion.copy(pitch);
  // Include the hero's actual outer pose and scale, not only an identity scene.
  for (const scene of [original, corrected]) {
    scene.position.set(-.53, .02, .54);
    scene.rotation.set(-.017, .32, .08, "YXZ");
    scene.scale.setScalar(1.15);
    scene.updateMatrixWorld(true);
  }
  const rigidParts = new Map();
  corrected.traverse((part) => {
    if (part.isMesh) rigidParts.set(part.name,
      hinge.matrixWorld.clone().invert().multiply(part.matrixWorld));
  });
  // Forward and reverse yaw, including zero: the display keeps its old path,
  // while every keyboard/chassis part keeps the same transform relative to it.
  for (const yaw of [0, -.15, -.32, -.6, .25, -.32, 0]) {
    const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    oldHinge.quaternion.copy(turn).multiply(pitch);
    tracking.quaternion.copy(turn);
    original.updateMatrixWorld(true);
    corrected.updateMatrixWorld(true);
    near(corrected.getObjectByName("MacBook_Display_Screen").matrixWorld.elements,
      original.getObjectByName("MacBook_Display_Screen").matrixWorld.elements,
      "Screen tracking trajectory changed");
    for (const [name, relative] of rigidParts) {
      const actual = hinge.matrixWorld.clone().invert().multiply(corrected.getObjectByName(name).matrixWorld);
      near(actual.elements, relative.elements, "Laptop assembly twisted: " + name);
    }
  }
}

const report = [];
for (const [original, refined, screenName] of [
  ["macbook_pro_silver", "macbook_pro_silver_hero", "MacBook_Display_Screen"],
  ["ipad_pro_space_black_blue", "ipad_pro_space_black_hero", "iPad_Pro_DisplayScreen"],
]) {
  const [before, after] = await Promise.all([load(original), load(refined)]);
  const oldScreen = screenVertices(before.scene, screenName);
  const newScreen = screenVertices(after.scene, screenName);
  // Re-export can reorder vertices; compare position + UV against the nearest original vertex.
  for (const vertex of newScreen) {
    const match = oldScreen.find((other) => vertex.every((v, i) => Math.abs(v - other[i]) < 2e-6));
    assert(match, "The screen must retain world positions and UV orientation");
  }
  const oldBounds = new THREE.Box3().setFromObject(before.scene);
  const newBounds = new THREE.Box3().setFromObject(after.scene);
  near(newBounds.min.toArray(), oldBounds.min.toArray(), "Minimum silhouette changed");
  near(newBounds.max.toArray(), oldBounds.max.toArray(), "Maximum silhouette changed");
  if (original.startsWith("macbook")) {
    const oldHinge = before.scene.getObjectByName("Display_Hinge_Pivot");
    const newHinge = after.scene.getObjectByName("Display_Hinge_Pivot");
    assert(newHinge);
    near(newHinge.position.toArray(), oldHinge.position.toArray(), "Hinge moved");
    near(newHinge.quaternion.toArray(), oldHinge.quaternion.toArray(), "Hinge angle changed");
    assert(after.scene.getObjectByName("MacBook_Pro_M_KeyLegend"));
    verifyMacBookTracking(after.scene);
  }
  const oldStats = stats(before), newStats = stats(after);
  assert(newStats.draws < oldStats.draws / 3);
  assert(newStats.bytes < oldStats.bytes);
  assert(newStats.triangles <= oldStats.triangles);
  assert.equal(after.animations.length, 0);
  report.push({ model: refined, before: oldStats, after: newStats });
}

// Optional baseline captures make the user's no-animation-change constraint reviewable.
if (process.argv[2]) {
  const baseline = await readFile(path.join(process.argv[2], "hero-3d-scene.tsx"), "utf8");
  const current = await readFile(path.join(root, "apps/web/src/components/landing/hero-3d-scene.tsx"), "utf8");
  const parse = (source) => ts.createSourceFile("hero.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const oldAst = parse(baseline), newAst = parse(current);
  const func = (ast, name) => ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === name);
  for (const name of ["CameraRig", "StudioLighting", "HeightAwareShadow", "BackgroundWordmark",
    "createOrbitConfig", "evaluateOrbitTransform", "useMagneticDevice3D"]) {
    assert.equal(func(newAst, name).getText(newAst), func(oldAst, name).getText(oldAst), name + " changed");
  }
  const find = (node, predicate) => {
    if (predicate(node)) return node;
    return ts.forEachChild(node, (child) => find(child, predicate));
  };
  for (const name of ["MacBookProMonument", "IPhoneSatellite", "IPadSatellite"]) {
    const motion = (ast) => find(func(ast, name), (node) => ts.isIfStatement(node)
      && node.expression.getText(ast) === "groupRef.current").getText(ast);
    let actual = motion(newAst);
    if (name === "MacBookProMonument") {
      // Permit only the rigid tracking correction; keep all yaw math and timing identical.
      actual = actual.replace("pivotRef.current && trackingRef.current", "pivotRef.current")
        .replace("trackingRef.current.quaternion.copy(qYaw);\n          pivotRef.current.quaternion.copy(qInitialPitch);",
          "pivotRef.current.quaternion.copy(qYaw.multiply(qInitialPitch));")
        .replace("trackingRef.current.quaternion.identity();\n          ", "");
    }
    const withoutComments = (source) => ts.createPrinter({ removeComments: true }).printFile(parse(source));
    assert.equal(withoutComments(actual), withoutComments(motion(oldAst)), name + " animation changed");
    const config = (ast) => find(func(ast, name), (node) => ts.isCallExpression(node)
      && node.expression.getText(ast) === "createOrbitConfig").getText(ast);
    assert.equal(config(newAst), config(oldAst), name + " orbit config changed");
  }
  const scrollFile = "hero-scroll-showcase.tsx";
  assert.equal(await readFile(path.join(root, "apps/web/src/components/landing", scrollFile), "utf8"),
    await readFile(path.join(process.argv[2], scrollFile), "utf8"));
  report.push({ cameraOrbitAndScrollUnchanged: true, laptopRigidTrackingCorrection: true });
}
console.log(JSON.stringify(report, null, 2));
