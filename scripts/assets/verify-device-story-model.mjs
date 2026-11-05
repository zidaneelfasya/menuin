// Offline GLTFLoader/meshopt integration check; this does not run or replace browser QA.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

globalThis.self = globalThis;
globalThis.ProgressEvent = class ProgressEvent {
  constructor(type, init) { this.type = type; Object.assign(this, init); }
};
// GLTFLoader needs image dimensions; no DOM, GPU, network origin or browser is accessed.
globalThis.createImageBitmap = async blob => {
  const { width, height } = await sharp(Buffer.from(await blob.arrayBuffer())).metadata();
  return { width, height, close() {} };
};

const bytes = await readFile(new URL("../../apps/web/public/hero/3d/iphone_17_pro_max_silver.glb", import.meta.url));
const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
assert(json.extensionsRequired.includes("EXT_meshopt_compression"));
assert(bytes.length < 500_000, "Keep the website model below 500 KB");
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "",
);
gltf.scene.updateMatrixWorld(true);
const display = gltf.scene.getObjectByName("OLED_Display");
assert(display instanceof THREE.Mesh);
display.geometry.computeBoundingBox();
const bounds = display.geometry.boundingBox;
const size = bounds.getSize(new THREE.Vector3());
assert(Math.abs(size.x - .07335) < 1e-6, `Unexpected decoded screen dimensions: ${size.toArray()}`);
assert(Math.abs(size.y - .15935) < 1e-6);
const position = display.geometry.getAttribute("position"), uv = display.geometry.getAttribute("uv");
for (let i = 0; i < position.count; i++) {
  assert(Math.abs(uv.getX(i) - (position.getX(i) - bounds.min.x) / size.x) < .0001);
  assert(Math.abs(uv.getY(i) - (bounds.max.y - position.getY(i)) / size.y) < .0001, "Screen V=0 must be the top edge");
}
const modelSize = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
assert(Math.abs(modelSize.y - .1634) < .0002, `Unexpected handset dimensions: ${modelSize.toArray()}`);
let triangles = 0, draws = 0;
const materials = new Map();
gltf.scene.traverse(object => {
  if (!(object instanceof THREE.Mesh)) return;
  draws++;
  const p = object.geometry.getAttribute("position"), n = object.geometry.getAttribute("normal");
  triangles += (object.geometry.index?.count ?? p.count) / 3;
  for (let i = 0; i < p.count; i++) {
    assert(Number.isFinite(p.getX(i)) && Number.isFinite(p.getY(i)) && Number.isFinite(p.getZ(i)));
    assert(Math.abs(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) - 1) < .002);
  }
  for (const mat of Array.isArray(object.material) ? object.material : [object.material]) materials.set(mat.name, mat);
});
assert(draws <= 16 && triangles < 65_000);
assert(materials.get("Silver_AnodizedAluminum").normalMap, "Packed metal microbrush map must load");
assert(materials.get("Optical_CoatedLensGlass").metalness < .2, "Glass must not become chrome");
assert.equal(materials.get("Optical_CoatedLensGlass").transmission, 0, "No extra transmission render pass");
assert.equal(gltf.animations.length, 0);
console.log(JSON.stringify({ passed: true, bytes: bytes.length, triangles, drawsPerHandset: draws,
  meshoptDecoded: true, screenUv: "top-left", dimensionsMeters: modelSize.toArray(),
  scope: "Offline real GLTFLoader decode and geometry/material contract; no browser or GPU integration." }, null, 2));
