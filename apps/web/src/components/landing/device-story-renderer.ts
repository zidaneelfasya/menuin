import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { getImageProps } from "next/image";
import { GALLERY_CARD_HEIGHT, GALLERY_CARD_WIDTH, GALLERY_RADIUS, WALL_CARD_COUNT, entranceWarp, galleryCardPose, galleryImageIndex, laptopNotchProgress, lerp, phase, phoneEntranceRotations, phoneFloat, phoneIslandRetraction, pickerPose, previewSize, screenTransition, type StoryFrame, type StoryLayout } from "./device-story-motion";
import { GALLERY_IMAGES, PREVIEW_DEVICES, STORY_PICTURES } from "./device-story-devices";

const PICTURES = STORY_PICTURES.map(src => getImageProps({ src, alt: "", width: 640, height: 906, quality: 75 }).props.src);
const VERTEX = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const SCREEN = `
uniform sampler2D base; uniform sampler2D panel; uniform float rise;
uniform vec2 baseCrop; uniform vec2 panelCrop; uniform float aspect;
uniform float useRing; uniform sampler2D ringImage; uniform vec2 ringScale;
varying vec2 vUv;
vec3 picture(sampler2D image,vec2 at,vec2 crop){return texture2D(image,.5+(vec2(at.x,1.-at.y)-.5)*crop).rgb;}
float rounded(vec2 p,vec2 halfSize,float radius){vec2 q=abs(p)-halfSize+radius;return length(max(q,0.))+min(max(q.x,q.y),0.)-radius;}
void main(){
  vec2 uv=vUv;
  vec3 color;
  if(useRing>.5){
    vec2 ringUv=vec2(.5)+(vec2(uv.x-.5,.5-uv.y))*ringScale;
    color=texture2D(ringImage,ringUv).rgb;
  }else{
    color=picture(base,uv,baseCrop);
    float edge=mix(1.002,-.002,rise);
    vec2 local=vec2(uv.x,uv.y-edge);
    float mask=smoothstep(-.001,.001,local.y);
    color=mix(color,picture(panel,local,panelCrop),mask);
  }
  // Dynamic Island: persistent OLED hardware pill cutout & camera lens reflection
  vec2 islandCoord=(uv-vec2(.5,.0444))*vec2(aspect,1.);
  float dIsland=rounded(islandCoord,vec2(.06323,.01773),.01773);
  float islandMask=1.-smoothstep(-.0015,.0015,dIsland);
  float dLens=length(islandCoord-vec2(.0427,0.))-.0068;
  float lensMask=1.-smoothstep(-.001,.001,dLens);
  vec3 islandColor=mix(vec3(.002),vec3(.012,.02,.035),lensMask);
  color=mix(color,islandColor,islandMask);
  gl_FragColor=vec4(color,1.);
  #include <colorspace_fragment>
}`;
const PREVIEW = `
uniform sampler2D image; uniform vec2 room; uniform vec2 screenSize; uniform vec2 frame; uniform float opacity; uniform float darken; uniform float bezel; uniform float corner; uniform float rim;
uniform float islandRetraction; uniform float notchGrowth; uniform float morphLight;
varying vec2 vUv;
float rounded(vec2 p,vec2 halfSize,float radius){vec2 q=abs(p)-halfSize+radius;return length(max(q,0.))+min(max(q.x,q.y),0.)-radius;}
void main(){
  vec2 p=(vUv-.5)*room;
  float rimWidth=rim;
  float outer=rounded(p,frame*.5+bezel,corner+bezel);
  float casing=rounded(p,frame*.5+bezel+rimWidth,corner+bezel+rimWidth);
  float inner=rounded(p,frame*.5,corner);
  float keep=1.-smoothstep(-.6,.6,casing);
  float body=1.-smoothstep(-.5,.5,outer);
  float screen=1.-smoothstep(-.6,.6,inner);
  float shadowDistance=rounded(p+vec2(0.,5.),frame*.5+bezel+rimWidth,corner+bezel+rimWidth);
  float shadow=.12*exp(-max(0.,shadowDistance)/8.);
  float alpha=max(keep,shadow);
  if(alpha<.001)discard;
  vec2 qNorm=abs(p)-frame*.5-bezel;
  vec2 norm=sign(p)*normalize(max(qNorm,vec2(0.001)));
  vec2 keyLightDir=normalize(vec2(-0.55,0.83));
  float diff=dot(norm,keyLightDir);
  float rimLit=clamp(0.68+0.16*diff+0.07*p.y/max(frame.y,1.),0.53,0.86);
  vec3 anodizedSilver=vec3(0.67,0.69,0.72)*(rimLit/0.69);
  float chamferMask=smoothstep(-.4,.4,outer)*(1.-smoothstep(0.7,1.8,outer));
  float chamferSpecular=pow(max(0.,diff*0.5+0.5),2.0);
  vec3 polishedSilver=mix(vec3(0.72,0.74,0.77),vec3(0.88,0.91,0.95),chamferSpecular*0.7);
  float edgeOcclusion=smoothstep(-1.2,0.,casing);
  vec3 silverEdge=mix(anodizedSilver,vec3(0.48,0.50,0.53),edgeOcclusion*0.45);
  vec3 silver=mix(silverEdge,polishedSilver,chamferMask);
  vec3 darkBezel=mix(vec3(.007,.008,.011),vec3(.016,.018,.023),smoothstep(-2.,0.,outer));
  vec3 shell=mix(silver,darkBezel,body);
  float glint=pow(max(0.,1.-abs(p.x/max(frame.x,1.)+p.y/max(frame.y,1.)-.1)*2.),4.);
  shell+=vec3(.12,.13,.16)*glint*morphLight*(1.-screen);
  vec2 imageUv=p/screenSize+.5;
  vec3 color=mix(shell,texture2D(image,imageUv).rgb,screen)*(1.-darken);
  vec2 islandCenter=vec2(0.,frame.y*(.5-.0444+.0622*islandRetraction));
  vec2 islandPoint=p-islandCenter;
  float islandWidth=mix(1.,.8,islandRetraction);
  float island=1.-smoothstep(-.7,.7,rounded(islandPoint,vec2(frame.y*.06323*islandWidth,frame.y*.01773),frame.y*.01773));
  float lens=1.-smoothstep(-.7,.7,length(islandPoint-vec2(frame.y*.0427*islandWidth,0.))-frame.y*.0068);
  vec3 islandColor=mix(mix(vec3(.002),vec3(.012,.02,.035),lens),shell,smoothstep(.5,.85,islandRetraction));
  color=mix(color,islandColor*(1.-darken),island*keep);
  float notchDepth=frame.y*.0286*notchGrowth;
  vec2 notchCenter=vec2(0.,frame.y*.5+(bezel-notchDepth)*.5);
  vec2 notchHalf=vec2(frame.x*.0535*mix(.65,1.,notchGrowth),(bezel+notchDepth)*.5);
  float notchRadius=min(frame.y*.008,notchDepth*.45+bezel*.25);
  float notch=(1.-smoothstep(-.7,.7,rounded(p-notchCenter,notchHalf,notchRadius)))*step(.001,notchGrowth);
  color=mix(color,shell*(1.-darken),notch*keep);
  gl_FragColor=vec4(color,alpha*opacity);
  #include <colorspace_fragment>
}`;
const PREVIEW_SIDE = `
uniform float opacity; uniform float darken;
varying vec2 vUv;
void main(){
  vec2 edge=abs(vUv-.5)*2.;
  float cover=1.-smoothstep(.96,1.,max(edge.x,edge.y));
  float light=mix(.29,.64,smoothstep(0.,.32,vUv.x))-.13*smoothstep(.7,1.,vUv.x);
  light*=mix(.76,1.,vUv.y);
  gl_FragColor=vec4(vec3(light)*(1.-darken),cover*opacity);
  #include <colorspace_fragment>
}`;
const COMPOSITE = `
uniform sampler2D image; uniform sampler2D entranceLogo;
uniform sampler2D halfRays; uniform float halfOn;
uniform vec2 viewport; uniform vec2 warp; uniform float sourceMix; uniform float opacity;
uniform vec2 logoSize;
varying vec2 vUv;
vec4 plate(vec2 uv){
  vec2 p=(uv-.5)/logoSize+.5;
  if(any(lessThan(p,vec2(0.)))||any(greaterThan(p,vec2(1.))))return vec4(0.);
  return texture2D(entranceLogo,p);
}
vec4 tap(vec2 uv){
  if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return vec4(0.);
  if(sourceMix<=0.)return plate(uv);
  vec4 c=texture2D(image,uv);
  if(sourceMix>=1.)return c;
  vec4 a=plate(uv);
  float alpha=mix(a.a,c.a,sourceMix);
  return vec4(mix(a.rgb*a.a,c.rgb*c.a,sourceMix)/max(alpha,.00001),alpha);
}
vec3 spectrum(float t){
  vec3 c=clamp(abs(mod(t*4.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
  return mix(vec3(1.),c,.85);
}
void main(){
  float aspect=viewport.x/viewport.y;
  vec2 b=(vUv-.5)*vec2(aspect,1.);
  float r=length(b),kr=warp.x*r;
  float len=r/sqrt(1.+kr*kr)/warp.y;
  vec2 dir=r>0. ? b/r : vec2(0.);
  vec2 at=.5+dir*len/vec2(aspect,1.);
  float reach=.3*(kr*kr/(1.+kr*kr))*len;
  vec3 color;
    if(warp.x<.05){
      vec4 c=tap(at); color=mix(vec3(1.),c.rgb,c.a);
    }else{
      float grain=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
      vec3 sum=vec3(0.),cover=vec3(0.),weights=vec3(0.);
      for(int i=0;i<TAPS;i++){
        float t=(float(i)+grain)/float(TAPS);
        vec4 c=tap(at+dir/vec2(aspect,1.)*reach*(t-.5));
        vec3 w=spectrum(t);
        sum+=c.rgb*c.a*w; cover+=c.a*w; weights+=w;
      }
      color=vec3(1.)-cover/weights+sum/weights;
    }
  #ifndef HALF
    if(halfOn>.5)color=mix(color,texture2D(halfRays,vUv).rgb,smoothstep(4.,10.,reach*viewport.y));
    color=mix(vec3(1.),color,opacity);
    float noise=fract(52.9829189*fract(dot(gl_FragCoord.xy+17.,vec2(.06711056,.00583715))));
    color+=(noise-.5)/255.*min(1.,warp.x)*opacity;
  #endif
  gl_FragColor=vec4(color,1.);
  #include <colorspace_fragment>
}`;
const CARD_VERTEX = `
uniform float bend; uniform float radius;
varying vec2 vUv; varying vec3 vCardNormal; varying float vDepth;
void main(){
  vUv=uv;
  float angle=position.x/radius;
  vec3 curved=vec3(radius*sin(angle),position.y,radius*(cos(angle)-1.));
  vec4 p=vec4(mix(position,curved,bend),1.);
  vec3 n=normalize(mix(normal,vec3(sin(angle),0.,cos(angle)),bend));
  #ifdef USE_INSTANCING
    p=instanceMatrix*p; n=mat3(instanceMatrix)*n;
  #endif
  vCardNormal=normalize(normalMatrix*n);
  vDepth=-(modelViewMatrix*p).z;
  gl_Position=projectionMatrix*modelViewMatrix*p;
}`;
const CARD_FRAGMENT = `
uniform sampler2D image; uniform vec2 crop; uniform float flatten; uniform float dim; uniform float field;
varying vec2 vUv; varying vec3 vCardNormal; varying float vDepth;
void main(){
  vec3 color=texture2D(image,.5+(vUv-.5)*crop).rgb;
  float light=abs(dot(normalize(vCardNormal),normalize(vec3(-.35,.5,.8))));
  float edge=1.-smoothstep(0.,.009,min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y)));
  color=mix(color,vec3(.4),edge*.18*field*(1.-flatten));
  color=mix(color,vec3(.96),smoothstep(5.5,9.,vDepth)*field*.65);
  gl_FragColor=vec4(color*mix(mix(.79,1.,light),1.,flatten)*(1.-dim),1.);
  #include <colorspace_fragment>
}`;
export type DeviceStoryRenderer = {
  resize: (layout: StoryLayout) => void;
  render: (frame: StoryFrame, galleryPosition: number, format: number, time: number, landing?: number) => void;
  dispose: () => void;
};

export async function createDeviceStoryRenderer(canvas: HTMLCanvasElement, signal: AbortSignal): Promise<DeviceStoryRenderer> {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: "default" });
  renderer.autoClear = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const background = new THREE.Color("#ffffff");
  const galleryBackground = new THREE.Color();
  renderer.setClearColor(background, 1); renderer.clear();
  const deviceScene = new THREE.Scene();
  const previewScene = new THREE.Scene();
  const ringScene = new THREE.Scene();
  const compositeScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
  camera.position.z = 8;
  const ringCamera = new THREE.PerspectiveCamera(36, 1, 0.1, 30);
  ringCamera.position.z = 5.5;
  const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  screenCamera.position.z = 1;
  const deviceTarget = new THREE.WebGLRenderTarget(1, 1, { samples: Math.min(4, renderer.capabilities.maxSamples) });
  const ringTarget = new THREE.WebGLRenderTarget(1, 1);
  const raysTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  const textures = new Set<THREE.Texture>();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const instances = new Set<THREE.InstancedMesh>();
  let disposed = false;
  let environment: THREE.WebGLRenderTarget | undefined;
  let layout: StoryLayout;
  let worldHeight = 1;

  const dispose = () => {
    for (const item of textures) item.dispose();
    for (const item of geometries) item.dispose();
    for (const item of materials) item.dispose();
    for (const item of instances) item.dispose();
    instances.clear();
    textures.clear(); geometries.clear(); materials.clear();
    if (disposed) return;
    disposed = true;
    deviceTarget.dispose(); ringTarget.dispose(); raysTarget.dispose(); environment?.dispose(); renderer.dispose();
  };
  const abort = () => dispose();
  signal.addEventListener("abort", abort, { once: true });
  const textureLoader = new THREE.TextureLoader();
  const loadTexture = async (url: string) => {
    const texture = await textureLoader.loadAsync(url);
    if (signal.aborted) { texture.dispose(); throw new DOMException("Aborted", "AbortError"); }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    textures.add(texture);
    return texture;
  };

  try {
    const [gltf, menu, cart, status, deviceScreens, pictures, entranceLogo] = await Promise.all([
      new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync("/hero/3d/iphone_17_pro_max_silver.glb"),
      loadTexture("/landing/features/storefront-menu-story.jpg"),
      loadTexture("/landing/features/storefront-cart-story.jpg"),
      loadTexture("/landing/features/storefront-status.jpg"),
      Promise.all(PREVIEW_DEVICES.slice(1).map(device => loadTexture(device.image))),
      Promise.all(PICTURES.map(loadTexture)),
      loadTexture("/img/landing/hero/menuin-wordmark.png"),
    ]);
    gltf.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        for (const mat of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(mat);
          for (const value of Object.values(mat)) if (value instanceof THREE.Texture) textures.add(value);
        }
      }
    });
    if (signal.aborted) { dispose(); throw new DOMException("Aborted", "AbortError"); }
    const pmrem = new THREE.PMREMGenerator(renderer);
    const studio = new THREE.Scene();
    studio.background = new THREE.Color("#777d87");
    const softboxGeometry = new THREE.PlaneGeometry();
    const softboxes: THREE.MeshBasicMaterial[] = [];
    for (const [x, y, z, width, height, intensity] of [
      [-3, 1.5, 3, 1, 5, 5], [3, 0.5, 1, 0.6, 4, 2.8],
      [0, 4, 0, 4, 2, 3], [-1, 1, -4, 2, 4, 2.4],
    ]) {
      const material = new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(intensity), toneMapped: false });
      const light = new THREE.Mesh(softboxGeometry, material);
      light.position.set(x, y, z); light.scale.set(width, height, 1); light.lookAt(0, 0, 0);
      studio.add(light); softboxes.push(material);
    }
    environment = pmrem.fromScene(studio, 0.015);
    softboxGeometry.dispose(); softboxes.forEach(material => material.dispose()); pmrem.dispose();
    deviceScene.environment = environment.texture;
    deviceScene.environmentIntensity = 0.8;
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-3, 4, 6);
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(4, 0, 3);
    deviceScene.add(key, fill, new THREE.AmbientLight(0xffffff, 0.2));

    const cropFor = (texture: THREE.Texture, target: number, inset: readonly [number, number] = [1, 1]) => {
      const image = texture.image as HTMLImageElement;
      const aspect = image.naturalWidth * inset[0] / (image.naturalHeight * inset[1]);
      return new THREE.Vector2(inset[0] * (aspect > target ? target / aspect : 1), inset[1] * (aspect > target ? 1 : aspect / target));
    };
    const display = gltf.scene.getObjectByName("OLED_Display");
    if (!(display instanceof THREE.Mesh) || !display.geometry.getAttribute("uv")) throw new Error("Device story model requires OLED_Display with UV coordinates");
    display.geometry.computeBoundingBox();
    const displaySize = display.geometry.boundingBox!.getSize(new THREE.Vector3());
    const screenAspect = displaySize.x / displaySize.y;
    const screenImages = [menu, cart, status];
    const screenCrops = screenImages.map(image => cropFor(image, screenAspect));
    const screenMaterial = new THREE.ShaderMaterial({
      uniforms: {
        base: { value: menu }, panel: { value: cart }, rise: { value: 0 },
        baseCrop: { value: screenCrops[0] }, panelCrop: { value: screenCrops[1] },
        aspect: { value: screenAspect },
        useRing: { value: 0 }, ringImage: { value: ringTarget.texture }, ringScale: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: VERTEX, fragmentShader: SCREEN, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });
    materials.add(screenMaterial);
    const phones: THREE.Group[] = [];
    const model = gltf.scene.clone(true);
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      // Three skips tone mapping in render targets; map the body before compositing, keeping screen whites intact.
      material.toneMapped = false;
      material.onBeforeCompile = shader => {
        shader.uniforms.deviceExposure = { value: 1.05 };
        shader.fragmentShader = THREE.ShaderChunk.tonemapping_pars_fragment.replaceAll("toneMappingExposure", "deviceExposure") + "\n" +
          shader.fragmentShader.replace("#include <tonemapping_fragment>", "gl_FragColor.rgb = ACESFilmicToneMapping(gl_FragColor.rgb);");
      };
      material.customProgramCacheKey = () => "device-story-body-aces-v1";
    }
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      if (object.name === "OLED_Display") object.material = screenMaterial;
    });
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const normalize = 1 / bounds.getSize(new THREE.Vector3()).y;
    model.scale.setScalar(normalize);
    model.position.copy(center).multiplyScalar(-normalize);
    for (let i = 0; i < 3; i++) {
      const phone = new THREE.Group();
      const handset = model.clone(true);
      if (i !== 1) handset.traverse(object => {
        if (!(object instanceof THREE.Mesh) || object.name !== "OLED_Display") return;
        const texture = pictures[i === 0 ? 0 : 1];
        const material = new THREE.ShaderMaterial({
          uniforms: {
            base: { value: texture }, panel: { value: texture }, rise: { value: 0 },
            baseCrop: { value: cropFor(texture, screenAspect) }, panelCrop: { value: cropFor(texture, screenAspect) },
            aspect: { value: screenAspect },
            useRing: { value: 0 }, ringImage: { value: ringTarget.texture }, ringScale: { value: new THREE.Vector2(1, 1) },
          },
          vertexShader: VERTEX, fragmentShader: SCREEN, toneMapped: false,
          polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
        });
        materials.add(material); object.material = material;
      });
      phone.add(handset); deviceScene.add(phone); phones.push(phone);
    }

    const radius = GALLERY_RADIUS;
    const cardWidth = GALLERY_CARD_WIDTH;
    const cardHeight = GALLERY_CARD_HEIGHT;
    const cardGeometry = new THREE.PlaneGeometry(cardWidth, cardHeight, 16, 1);
    geometries.add(cardGeometry);
    const deviceImages = [menu, ...deviceScreens];
    const imageLookup = new Map<string, THREE.Texture>(STORY_PICTURES.map((path, index) => [path, pictures[index]]));
    PREVIEW_DEVICES.forEach((device, index) => imageLookup.set(device.image, deviceImages[index]));
    imageLookup.set("/landing/features/storefront-status.jpg", status);
    imageLookup.set("/landing/features/storefront-cart-story.jpg", cart);
    const galleryImages = GALLERY_IMAGES.map(path => imageLookup.get(path)!);
    const ringMaterials = galleryImages.map((texture, index) => {
      const crop = cropFor(texture, 720 / 1019, PREVIEW_DEVICES[index]?.crop);
      const material = new THREE.ShaderMaterial({
        uniforms: { image: { value: texture }, crop: { value: crop }, flatten: { value: 0 }, dim: { value: 0 }, bend: { value: 0 }, radius: { value: radius }, field: { value: 1 } },
        vertexShader: CARD_VERTEX, fragmentShader: CARD_FRAGMENT,
        side: THREE.DoubleSide, toneMapped: false,
      });
      materials.add(material); return material;
    });
    const pose = new THREE.Object3D();
    const galleryBatches = ringMaterials.map((material, picture) => {
      const slots = Array.from({ length: WALL_CARD_COUNT }, (_, i) => i).filter(i => galleryImageIndex(i) === picture);
      const cards = new THREE.InstancedMesh(cardGeometry, material, slots.length);
      instances.add(cards);
      cards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      cards.frustumCulled = false;
      ringScene.add(cards);
      return { cards, slots };
    });

    const pickedGeometry = new THREE.PlaneGeometry(cardWidth, cardHeight, 16, 1);
    geometries.add(pickedGeometry);
    const pickedMaterial = new THREE.ShaderMaterial({
      uniforms: { image: { value: menu }, crop: { value: cropFor(menu, 720 / 1019) }, flatten: { value: 0 }, dim: { value: 0 }, radius: { value: radius }, bend: { value: 0 }, field: { value: 1 } },
      vertexShader: CARD_VERTEX, fragmentShader: CARD_FRAGMENT, side: THREE.DoubleSide,
      toneMapped: false, depthTest: false, depthWrite: false,
    });
    materials.add(pickedMaterial);
    const picked = new THREE.Mesh(pickedGeometry, pickedMaterial);
    picked.renderOrder = 1;
    ringScene.add(picked);
    const facingRotation = new THREE.Quaternion();

    const planeGeometry = new THREE.PlaneGeometry(1, 1); geometries.add(planeGeometry);
    const previewMaterial = new THREE.ShaderMaterial({
      uniforms: { image: { value: ringTarget.texture }, room: { value: new THREE.Vector2() }, screenSize: { value: new THREE.Vector2() }, frame: { value: new THREE.Vector2() }, islandRetraction: { value: 0 }, notchGrowth: { value: 0 }, morphLight: { value: 0 }, opacity: { value: 0 }, darken: { value: 0 }, bezel: { value: 4.8 }, corner: { value: 48 }, rim: { value: 3.8 } },
      vertexShader: VERTEX, fragmentShader: PREVIEW, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide,
    });
    materials.add(previewMaterial);
    const preview = new THREE.Mesh(planeGeometry, previewMaterial); previewScene.add(preview);
    const sideMaterial = new THREE.ShaderMaterial({
      uniforms: { opacity: { value: 0 }, darken: { value: 0 } },
      vertexShader: VERTEX, fragmentShader: PREVIEW_SIDE, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide,
    });
    materials.add(sideMaterial);
    const previewSide = new THREE.Mesh(planeGeometry, sideMaterial); previewScene.add(previewSide);
    const compositeUniforms = {
      image: { value: deviceTarget.texture }, entranceLogo: { value: entranceLogo },
      logoSize: { value: new THREE.Vector2(1, 1) },
      opacity: { value: 0 }, warp: { value: new THREE.Vector2(0, 1) }, sourceMix: { value: 1 },
      viewport: { value: new THREE.Vector2(1, 1) }, halfRays: { value: raysTarget.texture }, halfOn: { value: 0 },
    };
    const makeComposite = (half: boolean) => new THREE.ShaderMaterial({
      uniforms: compositeUniforms, defines: half ? { TAPS: 24, HALF: 1 } : { TAPS: 16 },
      vertexShader: VERTEX, fragmentShader: COMPOSITE, toneMapped: false, depthTest: false, depthWrite: false,
    });
    const compositeMaterial = makeComposite(false), raysMaterial = makeComposite(true);
    materials.add(compositeMaterial); materials.add(raysMaterial);
    const fullScreen = new THREE.Mesh(planeGeometry, compositeMaterial); fullScreen.scale.set(2, 2, 1); compositeScene.add(fullScreen);
    await renderer.compileAsync(deviceScene, camera);
    await renderer.compileAsync(ringScene, ringCamera);
    await renderer.compileAsync(previewScene, camera);
    await renderer.compileAsync(compositeScene, screenCamera);
    fullScreen.material = raysMaterial;
    await renderer.compileAsync(compositeScene, screenCamera);
    fullScreen.material = compositeMaterial;

    return {
      resize(nextLayout) {
        layout = nextLayout;
        const dpr = Math.min(devicePixelRatio || 1, matchMedia("(pointer: coarse)").matches ? 1.5 : 2);
        renderer.setPixelRatio(dpr); renderer.setSize(layout.width, layout.height, false);
        deviceTarget.setSize(Math.round(layout.width * dpr), Math.round(layout.height * dpr));
        raysTarget.setSize(Math.max(1, Math.ceil(layout.width * dpr / 2)), Math.max(1, Math.ceil(layout.height * dpr / 2)));
        compositeUniforms.viewport.value.set(layout.width * dpr, layout.height * dpr);
        const logoImage = entranceLogo.image as HTMLImageElement;
        const logoAspect = logoImage.naturalWidth / logoImage.naturalHeight;
        const logoWidth = Math.min(layout.width * 0.64, layout.height * 0.5 * logoAspect);
        // Contain the transparent wordmark without stretching or cropping its letters.
        compositeUniforms.logoSize.value.set(logoWidth / layout.width, logoWidth / logoAspect / layout.height);
        const factor = Math.min(dpr, 2048 / Math.max(layout.preview.width, layout.preview.height));
        ringTarget.setSize(Math.max(1, Math.round(layout.preview.width * factor)), Math.max(1, Math.round(layout.preview.height * factor)));
        camera.aspect = layout.width / layout.height; camera.updateProjectionMatrix();
        ringCamera.aspect = layout.preview.width / layout.preview.height; ringCamera.updateProjectionMatrix();
        worldHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
        const unit = worldHeight / layout.height;
        const phoneSize = previewSize(0, layout.preview.width, layout.preview.height);
        const phoneExtension = 14 * Math.min(1, Math.max(0.65, layout.preview.height / 720));
        const phoneTargetCasingHeight = phoneSize.height + phoneExtension + 2 * phoneSize.bezel + 2 * phoneSize.rim;
        const meshWidth = Math.max(layout.preview.width, phoneSize.width + 2 * phoneSize.bezel + 2 * phoneSize.rim + 40);
        const meshHeight = Math.max(layout.preview.height, phoneTargetCasingHeight + 60);
        preview.position.set((layout.preview.x - layout.width / 2) * unit, (layout.height / 2 - layout.preview.y) * unit, 0);
        preview.scale.set(meshWidth * unit, meshHeight * unit, 1);
        previewMaterial.uniforms.room.value.set(meshWidth, meshHeight);
        previewMaterial.uniforms.screenSize.value.set(layout.preview.width, layout.preview.height);
      },
      render(frame, galleryPosition, format, time, landing = 0) {
        if (disposed || !layout) return;
        renderer.setRenderTarget(null); renderer.setClearColor(background, 1); renderer.clear();
        const unit = worldHeight / layout.height;
        const phoneSize = previewSize(0, layout.preview.width, layout.preview.height);
        const phoneExtension = 14 * Math.min(1, Math.max(0.65, layout.preview.height / 720));
        const phoneTargetCasingHeight = phoneSize.height + phoneExtension + 2 * phoneSize.bezel + 2 * phoneSize.rim;
        // Perspective compensation: 3D model front surface is at z > 0, projecting ~2.6% larger than nominal plane.
        const exportTargetHeight = phoneTargetCasingHeight * unit / 1.026171;

        const needsRing = frame.handoff >= 0.45 || frame.exportAlpha > 0.001;
        const selection = needsRing ? pickerPose(frame.p, galleryPosition) : null;
        const size = needsRing ? previewSize(format, layout.preview.width, layout.preview.height, galleryPosition, landing) : null;

        if (needsRing && selection && size) {
          const bend = Math.max(0, selection.gallery - 1);
          const roomHeight = 2 * Math.tan(THREE.MathUtils.degToRad(ringCamera.fov / 2)) * ringCamera.position.z;
          const wallScale = roomHeight * phoneSize.width / layout.preview.height * 0.48 / cardWidth;
          galleryBatches.forEach(({ cards, slots }) => {
            slots.forEach((slot, instance) => {
              const card = galleryCardPose(slot, selection, wallScale);
              const visible = slot === selection.slot && Math.max(selection.focus, selection.anticipation) > 0.001 ? 0 : card.visibility;
              pose.position.set(card.x, card.y, card.z);
              pose.rotation.set(card.pitch, card.yaw, card.roll, "ZXY");
              pose.scale.setScalar(card.scale * visible);
              pose.updateMatrix(); cards.setMatrixAt(instance, pose.matrix);
            });
            cards.instanceMatrix.needsUpdate = true;
          });
          const origin = galleryCardPose(selection.slot, selection, wallScale);
          const focus = selection.focus;
          const depthFocus = phase(focus, 0, 0.82);
          const scaleFocus = phase(focus, 0.03, 1);
          const selectedZ = lerp(origin.z + selection.anticipation * 0.06, 3.2, depthFocus);
          picked.position.set(origin.x * (1 - depthFocus), origin.y * (1 - depthFocus), selectedZ);
          picked.rotation.set(origin.pitch, origin.yaw, origin.roll, "ZXY");
          picked.quaternion.slerp(facingRotation, depthFocus);
          const perspective = ringCamera.position.z / (ringCamera.position.z - origin.z);
          const atDepth = (ringCamera.position.z - selectedZ) / ringCamera.position.z;
          const phoneBlend = 1 - Math.min(1, Math.max(0, galleryPosition));
          const activePhoneExtension = phoneExtension * phoneBlend;
          // Interpolate projected size, then compensate for depth: a forward pull without overshoot.
          const selectedWidth = lerp(cardWidth * origin.scale * perspective * (1 + selection.anticipation * 0.04), roomHeight * size.width / layout.preview.height, scaleFocus) * atDepth;
          const selectedHeight = lerp(cardHeight * origin.scale * perspective * (1 + selection.anticipation * 0.04), roomHeight * (size.height + activePhoneExtension) / layout.preview.height, scaleFocus) * atDepth;
          picked.scale.set(selectedWidth / cardWidth, selectedHeight / cardHeight, 1);
          pickedMaterial.uniforms.image.value = deviceImages[selection.index];
          pickedMaterial.uniforms.crop.value.copy(cropFor(deviceImages[selection.index], selectedWidth / selectedHeight, PREVIEW_DEVICES[selection.index].crop));
          pickedMaterial.uniforms.flatten.value = lerp(1 - bend, 1, focus);
          pickedMaterial.uniforms.bend.value = bend * (1 - focus);
          pickedMaterial.uniforms.field.value = 0;
          picked.visible = Math.max(focus, selection.anticipation) > 0.001;
          ringMaterials.forEach(material => {
            material.uniforms.dim.value = Math.max(focus * 0.65, selection.anticipation * 0.16);
            material.uniforms.bend.value = bend;
            material.uniforms.flatten.value = 1 - bend;
            material.uniforms.field.value = 0;
          });
          renderer.setRenderTarget(ringTarget);
          renderer.setClearColor(galleryBackground.setScalar(0.0024), 1);
          renderer.clear(); renderer.render(ringScene, ringCamera);
        }

        if (frame.phoneAlpha > 0.001) {
          const targetHeight = exportTargetHeight;
          const rotations = phoneEntranceRotations(frame.p);
          const entrance = phase(frame.p, 0.10, 0.20);
          const startX = (layout.phone.x - layout.width / 2) * unit;
          const startY = (layout.height / 2 - layout.phone.y) * unit;
          const targetX = (layout.preview.x - layout.width / 2) * unit;
          const targetY = (layout.height / 2 - layout.preview.y) * unit;
          const tiltFactor = 1 - phase(frame.p, 0.625, 0.655);
          const targetYaw = -Math.atan2(targetX, camera.position.z) * tiltFactor;
          const targetPitch = Math.atan2(targetY, camera.position.z) * tiltFactor;
          phones.forEach((phone, index) => {
            const side = index - 1;
            const spread = Math.min(layout.width * 0.255 * unit, targetHeight * 0.82);
            phone.visible = side === 0 || frame.focus < 1;
            if (side === 0) {
              phone.position.set(
                lerp(startX, targetX, frame.handoff),
                lerp(startY, targetY, frame.handoff) + (1 - frame.handoff) * targetHeight * phoneFloat(frame.p, time),
                0,
              );
              const baseScale = targetHeight * lerp(1.2, 1, entrance) * lerp(0.8, 1, frame.focus);
              phone.scale.setScalar(lerp(baseScale, exportTargetHeight, frame.handoff));
              phone.rotation.set(
                lerp(rotations.centerPitch, targetPitch, frame.handoff),
                rotations.centerYaw + frame.handoff * (Math.PI * 2 + targetYaw),
                0,
              );
            } else {
              phone.position.set(
                startX + side * lerp(spread, layout.width * unit * 0.85, frame.focus),
                startY,
                lerp(-0.12, -1.1, frame.focus),
              );
              phone.scale.setScalar(targetHeight * lerp(1.2, 1, entrance) * 0.83);
              phone.rotation.set(-0.07, side < 0 ? rotations.leftYaw : rotations.rightYaw, side < 0 ? rotations.leftRoll : rotations.rightRoll);
            }
          });
          if (frame.handoff >= 0.5) {
            screenMaterial.uniforms.useRing.value = 1;
            screenMaterial.uniforms.ringImage.value = ringTarget.texture;
            screenMaterial.uniforms.ringScale.value.set(phoneSize.width / layout.preview.width, (phoneSize.height + phoneExtension) / layout.preview.height);
          } else {
            screenMaterial.uniforms.useRing.value = 0;
            const transition = screenTransition(frame.sheet);
            screenMaterial.uniforms.base.value = screenImages[transition.stage];
            screenMaterial.uniforms.panel.value = screenImages[transition.stage + 1];
            screenMaterial.uniforms.baseCrop.value = screenCrops[transition.stage];
            screenMaterial.uniforms.panelCrop.value = screenCrops[transition.stage + 1];
            screenMaterial.uniforms.rise.value = transition.rise;
          }
          renderer.setRenderTarget(deviceTarget); renderer.setClearColor(background, 0); renderer.clear(); renderer.render(deviceScene, camera);
          const warp = entranceWarp(frame.p);
          compositeUniforms.opacity.value = frame.p < 0.20 ? frame.phoneAlpha : 1;
          compositeUniforms.warp.value.set(warp.k, warp.zoom);
          compositeUniforms.sourceMix.value = warp.source;
          compositeUniforms.halfOn.value = Number(warp.k > 0.05);
          if (warp.k > 0.05) {
            fullScreen.material = raysMaterial;
            renderer.setRenderTarget(raysTarget); renderer.render(compositeScene, screenCamera);
            fullScreen.material = compositeMaterial;
          }
          renderer.setRenderTarget(null);
          renderer.render(compositeScene, screenCamera);
        }

        if (frame.exportAlpha > 0.001 && frame.deviceMix > 0.001 && size && selection) {
          const targetX = (layout.preview.x - layout.width / 2) * unit;
          const targetY = (layout.height / 2 - layout.preview.y) * unit;
          const tiltFactor = 1 - phase(frame.p, 0.625, 0.655);
          const targetYaw = -Math.atan2(targetX, camera.position.z) * tiltFactor;
          const targetPitch = Math.atan2(targetY, camera.position.z) * tiltFactor;
          renderer.setRenderTarget(null); renderer.clearDepth();
          const phoneBlend = 1 - Math.min(1, Math.max(0, galleryPosition));
          const activePhoneExtension = phoneExtension * phoneBlend;
          previewMaterial.uniforms.frame.value.set(size.width, size.height + activePhoneExtension);
          previewMaterial.uniforms.bezel.value = size.bezel;
          previewMaterial.uniforms.corner.value = size.radius;
          previewMaterial.uniforms.rim.value = size.rim;
          previewMaterial.uniforms.islandRetraction.value = phoneIslandRetraction(galleryPosition);
          previewMaterial.uniforms.notchGrowth.value = laptopNotchProgress(selection.index, selection.focus);
          const step = galleryPosition - Math.min(1, Math.floor(galleryPosition));
          const arrivalGlint = phase(frame.p, 0.606, 0.617) * (1 - phase(frame.p, 0.617, 0.630));
          previewMaterial.uniforms.morphLight.value = Math.max(
            arrivalGlint * 1.8,
            phase(step, 0.04, 0.14) * (1 - phase(step, 0.22, 0.32)),
            phase(step, 0.70, 0.78) * (1 - phase(step, 0.92, 1)),
          );
          previewMaterial.uniforms.opacity.value = frame.deviceMix * frame.exportAlpha;
          previewMaterial.uniforms.darken.value = frame.exportDarken;
          preview.rotation.set(targetPitch, targetYaw, 0);
          previewSide.visible = false;
          renderer.render(previewScene, camera);
        }
      },
      dispose() { signal.removeEventListener("abort", abort); dispose(); },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
