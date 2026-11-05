"""Build Menuin's original, web-ready silver handset in an isolated Blender process.

blender --background --factory-startup --python scripts/assets/build-iphone-17-pro-max.py
Coordinates are intentionally X right / Y up / Z front, including in the GLB.
"""
import bpy
import json
import math
import random
import sys
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "apps/web/public"
SOURCE = ROOT / "assets/3d"
EVIDENCE = ROOT / "docs/design/premotio-evidence/iphone-17-pro-max"
for directory in (SOURCE, EVIDENCE):
    directory.mkdir(parents=True, exist_ok=True)

# This script only runs in its own --factory-startup background process.
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
model_collection = bpy.data.collections.new("iPhone 17 Pro Max · Silver")
scene.collection.children.link(model_collection)
studio_collection = bpy.data.collections.new("Preview studio · not exported")
scene.collection.children.link(studio_collection)
root = bpy.data.objects.new("iPhone17ProMax_Silver", None)
model_collection.objects.link(root)
root["device_story_axes"] = "x-right_y-up_z-front"
root["body_mm"] = [78.0, 163.4, 8.75]
root["screen_mm"] = [73.35, 159.35]
root["author"] = "Menuin · procedurally authored in Blender"
root["reference"] = "https://support.apple.com/en-us/125091"
root["version"] = 1


def material(name, rgb, metal=0.0, rough=0.3, coat=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*rgb, 1)
    node.inputs['Metallic'].default_value = metal
    node.inputs['Roughness'].default_value = rough
    node.inputs['Coat Weight'].default_value = coat
    node.inputs['Coat Roughness'].default_value = 0.16
    mat.diffuse_color = (*rgb, 1)
    return mat


silver = material("Silver_AnodizedAluminum", (0.67, 0.69, 0.72), 0.88, 0.29)
polish = material("Silver_PolishedChamfer", (0.72, 0.74, 0.77), 0.95, 0.17)
ceramic = material("White_CeramicShield", (0.84, 0.855, 0.87), 0.02, 0.26, 0.28)
black = material("Black_BezelAndGaskets", (0.007, 0.008, 0.011), 0.08, 0.28)
island_mat = material("Black_DynamicIsland", (0.0015, 0.002, 0.003), 0.0, 0.24)
lens_ring = material("Graphite_LensHousing", (0.045, 0.052, 0.065), 0.72, 0.22)
lens_glass = material("Optical_CoatedLensGlass", (0.003, 0.008, 0.015), 0.0, 0.13, 0.12)
iris = material("Optical_InnerElements", (0.017, 0.035, 0.047), 0.24, 0.24)
flash = material("Flash_Diffuser", (0.78, 0.77, 0.70), 0.0, 0.38)
antenna = material("Antenna_CeramicSeams", (0.45, 0.47, 0.49), 0.0, 0.55)
etch = material("Rear_LogoEtching", (0.58, 0.60, 0.62), 0.3, 0.33)
display_mat = material("OLED_Display", (0.025, 0.025, 0.025), 0.0, 0.45)
for mat, level in [(lens_glass,.15),(island_mat,0),(iris,.18)]:
    mat.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = level

# A packed normal map supplies subtle micro-brushing without large photo textures.
rng = random.Random(1701)
tex = bpy.data.images.new("Silver_microbrush_256", width=256, height=256, alpha=False)
tex.colorspace_settings.name = 'Non-Color'
pixels = []
for y in range(256):
    for x in range(256):
        slope = 0.09 * math.sin(y * 2.53) + rng.uniform(-0.025, 0.025)
        pixels.extend((0.5, 0.5 + slope, math.sqrt(max(0, 1 - (2 * slope) ** 2)) * 0.5 + 0.5, 1))
tex.pixels.foreach_set(pixels)
tex.pack()
nodes = silver.node_tree.nodes
normal_image = nodes.new('ShaderNodeTexImage')
normal_image.image = tex
normal_map = nodes.new('ShaderNodeNormalMap')
normal_map.inputs['Strength'].default_value = 0.035
silver.node_tree.links.new(normal_image.outputs['Color'], normal_map.inputs['Color'])
silver.node_tree.links.new(normal_map.outputs['Normal'], nodes['Principled BSDF'].inputs['Normal'])


def mesh(name, vertices, faces, mat, uv=None, smooth=True):
    data = bpy.data.meshes.new(name)
    data.from_pydata([(x * .001, y * .001, z * .001) for x, y, z in vertices], [], faces)
    data.materials.append(mat)
    if uv:
        layer = data.uv_layers.new(name='UVMap')
        for loop in data.loops:
            layer.data[loop.index].uv = uv[loop.vertex_index]
    for polygon in data.polygons:
        polygon.use_smooth = smooth
    data.update()
    obj = bpy.data.objects.new(name, data)
    model_collection.objects.link(obj)
    obj.parent = root
    return obj


def contour(w, h, r, segments=24):
    result = []
    for cx, cy, start in [(w/2-r, h/2-r, 0), (-w/2+r, h/2-r, 90),
                          (-w/2+r, -h/2+r, 180), (w/2-r, -h/2+r, 270)]:
        for i in range(segments + 1):
            a = math.radians(start + 90 * i / segments)
            result.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return result


def shell(name, w, h, r, profiles, mat, center=(0, 0), segments=24, caps=True):
    """Rounded outline with real, multi-ring fillets and independent flat end caps."""
    points = len(contour(w, h, r, segments))
    vertices, uv, faces = [], [], []
    for layer, (z, inset) in enumerate(profiles):
        for i, (x, y) in enumerate(contour(w-2*inset, h-2*inset, max(.01, r-inset), segments)):
            vertices.append((x+center[0], y+center[1], z))
            uv.append((i / points * 4, layer / max(1, len(profiles)-1)))
    for layer in range(len(profiles)-1):
        for i in range(points):
            a, b = layer*points+i, layer*points+(i+1) % points
            faces.append((a, b, b+points, a+points))
    obj = mesh(name, vertices, faces, mat, uv)
    if not caps:
        return obj
    # Separate cap vertices preserve planar normals instead of inflated front/back faces.
    for index, reverse in [(0, True), (-1, False)]:
        z, inset = profiles[index]
        cap = contour(w-2*inset, h-2*inset, max(.01, r-inset), segments)
        v = [(center[0], center[1], z)] + [(x+center[0], y+center[1], z) for x,y in cap]
        f = [(0, (i+1) % points+1, i+1) if reverse else (0, i+1, (i+1) % points+1) for i in range(points)]
        mesh(name+"_cap", v, f, mat, [(x/w+.5, y/h+.5) for x,y in [(0,0)]+cap], smooth=False)
    return obj


def face(name, w, h, r, z, mat, center=(0,0), front=True, segments=32):
    points = contour(w, h, r, segments)
    verts = [(center[0], center[1], z)] + [(x+center[0], y+center[1], z) for x,y in points]
    uv = [(.5,.5)] + [(x/w+.5, y/h+.5) for x,y in points]
    count = len(points)
    faces = [(0, i+1, (i+1) % count+1) if front else (0, (i+1) % count+1, i+1) for i in range(count)]
    return mesh(name, verts, faces, mat, uv, smooth=False)


def lathe(name, x, y, profile, mat, segments=96):
    verts, uv, faces = [], [], []
    for ring, (radius, z) in enumerate(profile):
        for i in range(segments):
            a = i * math.tau / segments
            verts.append((x+radius*math.cos(a), y+radius*math.sin(a), z))
            uv.append((i/segments, ring/max(1,len(profile)-1)))
    for ring in range(len(profile)-1):
        for i in range(segments):
            a, b = ring*segments+i, ring*segments+(i+1) % segments
            faces.append((a,b,b+segments,a+segments))
    # A closed lathe used on the rear faces -Z.
    obj = mesh(name, verts, [tuple(reversed(f)) for f in faces], mat, uv)
    return obj


shell('Unibody', 78, 163.4, 14.0,
      [(-4.375,.8),(-4.29,.45),(-4.1,.19),(-3.8,.04),(-3.5,0),
       (3.45,0),(3.8,.05),(4.1,.22),(4.29,.5),(4.375,.82)], silver)
shell('FrontChamfer', 76.5, 161.9, 13.4, [(4.34,.02),(4.42,.0),(4.48,.12)], polish, caps=False)
shell('GlassGasket', 76.4, 161.8, 13.4, [(4.43,0),(4.51,.07)], black)
face('FrontBlackGlass', 76.1, 161.5, 13.3, 4.53, black)
display = face('OLED_Display', 73.35, 159.35, 12.1, 4.55, display_mat)
display['screen_uv'] = 'gltf-standard-top-left'
face('DynamicIsland', 20.15, 5.65, 2.825, 4.59, island_mat, center=(0,72.6))
face('FrontCamera', 2.1, 2.1, 1.05, 4.60, lens_glass, center=(6.8,72.6), segments=16)
face('Receiver', 10.8, .46, .23, 4.55, island_mat, center=(0,80.33), segments=8)

# Ceramic Shield inset and the characteristic full-width rear camera plateau.
shell('RearCeramicInset', 71.5, 108.8, 10.5,
      [(-4.49,.4),(-4.46,.1),(-4.40,0)], ceramic, center=(0,-20.2))
shell('CameraPlateau', 74.8, 42.8, 10.5,
      [(-6.24,.62),(-6.21,.32),(-6.10,.12),(-5.87,0),(-4.36,0)], silver, center=(0,56.7))
shell('PlateauEdge', 74.65, 42.65, 10.45,
      [(-6.28,.22),(-6.25,.05)], silver, center=(0,56.7), caps=False)

for index, (x,y) in enumerate([(22.4,67.6),(22.4,45.8),(2.5,56.7)], 1):
    # Outer silver rim, dark recessed barrel, coated glass, then darker inner optics.
    lathe(f'Camera{index}_SilverRim',x,y,[(10.0,-6.25),(10.0,-6.9),(9.83,-7.52),(9.52,-7.76),(9.15,-7.78),(8.85,-7.59)],polish)
    lathe(f'Camera{index}_Barrel',x,y,[(9.0,-7.58),(8.93,-7.71),(8.45,-7.76),(8.23,-7.66)],lens_ring)
    lathe(f'Camera{index}_Glass',x,y,[(8.25,-7.65),(7.9,-7.72),(5.5,-7.76),(0.001,-7.76)],lens_glass)
    lathe(f'Camera{index}_Optics',x,y,[(5.2,-7.775),(4.95,-7.79),(4.5,-7.79),(4.3,-7.775)],iris)
    lathe(f'Camera{index}_Aperture',x,y,[(3.05,-7.785),(2.8,-7.80),(.001,-7.80)],island_mat)

lathe('FlashRim',-23.0,68.6,[(3.85,-6.29),(3.65,-6.47),(3.25,-6.49)],polish,64)
lathe('FlashDiffuser',-23.0,68.6,[(3.23,-6.48),(3.0,-6.53),(.001,-6.53)],flash,64)
lathe('LidarRim',-23.0,44.5,[(3.05,-6.28),(2.8,-6.42)],lens_ring,64)
lathe('LidarSensor',-23.0,44.5,[(2.8,-6.43),(2.3,-6.48),(.001,-6.48)],island_mat,64)
lathe('RearMicrophone',-23.0,56.7,[(.7,-6.29),(.001,-6.31)],black,32)


def side_part(name, side, y, length, width, depth, mat, z=0):
    obj = shell(name,length,width,min(width/2,length/2,.95),
                [(-depth/2,.13),(0,0),(depth/2,.13)], mat, segments=10)
    # The original XY outline becomes an upright control on the X sidewall.
    for part in [o for o in model_collection.objects if o.name.startswith(name)]:
        part.rotation_mode = 'QUATERNION'
        part.rotation_quaternion = Matrix(((0,0,side),(1,0,0),(0,side,0))).to_quaternion()
        part.location = (side*.03902,y*.001,z*.001)
    return obj


side_part('ActionButton',-1,48.0,7.4,2.5,.65,polish)
side_part('VolumeUp',-1,31.5,11.6,2.5,.65,silver)
side_part('VolumeDown',-1,16.4,11.6,2.5,.65,silver)
side_part('PowerButton',1,25.0,17.0,2.5,.65,silver)
side_part('CameraControlOutline',1,-31.4,19.0,3.0,.20,polish)
side_part('CameraControl',1,-31.4,17.7,2.2,.23,ceramic)

# Antenna inserts follow the sidewall, with a small clearance to avoid z fighting.
for side in [-1,1]:
    for y in [-66,66]:
        side_part(f'Antenna_{side}_{y}',side,y,.75,6.65,.06,antenna)


def bottom_part(name, x, width, height, mat, depth=0):
    obj = face(name,width,height,min(height/2,width/2),0,mat,segments=10)
    obj.rotation_euler.x = math.pi/2
    obj.location = (x*.001,(-81.705-depth)*.001,0)
    return obj


bottom_part('USB_C_Recess',0,9.5,3.1,black)
bottom_part('USB_C_Tongue',0,6.5,.65,ceramic,.045)
for side in [-1,1]:
    for i in range(6):
        bottom_part(f'Speaker_{side}_{i}',side*(12.5+i*2.8),1.20,1.75,black)
    bottom_part(f'Pentalobe_{side}',side*7.3,.9,.9,lens_ring,.025)

# Subtle rear silhouette, modeled here rather than copied from a third-party GLB.
apple = [(-.1,5.3),(-2.9,6.2),(-5.7,5.5),(-7.2,3.4),(-7.5,.7),(-6.6,-2.4),
         (-4.7,-5.5),(-2.7,-6.6),(-.1,-6),(2.5,-6.6),(4.7,-5.4),(6,-3.3),
         (4.4,-2.2),(3.7,-.3),(4.2,1.5),(5.9,2.7),(5,4.8),(2.6,5.9)]
mesh('RearLogo',[(-x*.62,y*.62-15,-4.505) for x,y in apple],
     [tuple(range(len(apple)))],etch,smooth=False)
mesh('RearLogoLeaf',[(.1,-10.95,-4.505),(-.4,-8.8,-4.505),(-2.6,-7.8,-4.505),(-2.2,-10.0,-4.505)],
     [(0,1,2,3)],etch,smooth=False)

# Join by material: retain one independently replaceable display and few draw calls.
for mat in [silver,polish,ceramic,black,island_mat,lens_ring,lens_glass,iris,flash,antenna,etch]:
    group = [o for o in model_collection.objects if o.type=='MESH' and o.data.materials[0]==mat]
    bpy.ops.object.select_all(action='DESELECT')
    for obj in group:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = group[0]
    if len(group) > 1:
        bpy.ops.object.join()
    group[0].name = mat.name

bpy.context.view_layer.update()
model_objects = [o for o in model_collection.objects if o.type=='MESH']
for obj in model_objects:
    obj.data.calc_loop_triangles()
triangles = sum(len(o.data.loop_triangles) for o in model_objects)
assert triangles < 65000, triangles
assert len([o for o in model_objects if o.name=='OLED_Display']) == 1

bpy.ops.object.select_all(action='DESELECT')
for obj in [root]+model_objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root
glb_path = PUBLIC / 'hero/3d/iphone_17_pro_max_silver.glb'
# Blender's default 12-bit exponential filter visibly warps a thin display plane.
# Override only this background process, keeping fillets and the OLED planar.
from io_scene_gltf2.io.exp import meshopt
meshopt.EXP_FILTER_BITS = 20
bpy.ops.export_scene.gltf(filepath=str(glb_path),export_format='GLB',use_selection=True,
                          export_yup=False,export_extras=True,export_apply=True,
                          export_meshopt_compression_enable=True,
                          export_meshopt_extension='EXT_meshopt_compression',
                          export_materials='EXPORT',export_image_format='AUTO',export_normals=True)

# The packed source material above is standalone; add a local image only for preview.
picture = bpy.data.images.load(str(PUBLIC / 'landing/features/storefront-status.jpg'))
node = display_mat.node_tree.nodes.new('ShaderNodeTexImage')
node.image = picture
screen_bsdf = display_mat.node_tree.nodes['Principled BSDF']
screen_bsdf.inputs['Base Color'].default_value = (0,0,0,1)
screen_bsdf.inputs['Specular IOR Level'].default_value = 0
screen_bsdf.inputs['Emission Strength'].default_value = 1
display_mat.node_tree.links.new(node.outputs['Color'],screen_bsdf.inputs['Emission Color'])
picture.pack()

scene.world = bpy.data.worlds.new('White studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.74,.76,.79,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .25
world_nodes = scene.world.node_tree.nodes
camera_background = world_nodes.new('ShaderNodeBackground')
camera_background.inputs['Color'].default_value = (1,1,1,1)
camera_background.inputs['Strength'].default_value = 8
path = world_nodes.new('ShaderNodeLightPath')
mix = world_nodes.new('ShaderNodeMixShader')
links = scene.world.node_tree.links
links.new(path.outputs['Is Camera Ray'],mix.inputs[0])
links.new(world_nodes['Background'].outputs[0],mix.inputs[1])
links.new(camera_background.outputs[0],mix.inputs[2])
links.new(mix.outputs[0],world_nodes['World Output'].inputs[0])


def aim(obj):
    back = obj.location.normalized()
    right = Vector((0,1,0)).cross(back).normalized()
    up = back.cross(right)
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = Matrix((right,up,back)).transposed().to_quaternion()


for name,location,energy,size,size_y in [
    ('Key softbox',(-.20,.18,.28),3,.12,.30),
    ('Right strip',(.20,.015,.13),1.4,.035,.26),
    ('Rear strip',(-.10,.06,-.25),2.4,.05,.28),
    ('Top fill',(.0,.30,.02),1,.22,.10),
]:
    light = bpy.data.lights.new(name,'AREA')
    light.energy = energy
    light.shape = 'RECTANGLE'
    light.size,light.size_y = size,size_y
    obj = bpy.data.objects.new(name,light)
    studio_collection.objects.link(obj)
    obj.location = location
    aim(obj)
camera_data = bpy.data.cameras.new('Review camera')
camera = bpy.data.objects.new('Review camera',camera_data)
studio_collection.objects.link(camera)
camera.location = (.22,.055,.36)
aim(camera)
camera_data.type = 'ORTHO'
camera_data.ortho_scale = .23
scene.camera = camera
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x,scene.render.resolution_y = 1300,1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = False
scene.view_settings.view_transform = 'AgX'
blend_path = SOURCE / 'iphone-17-pro-max-silver.blend'
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

stats = {'author':'Menuin, original procedural reconstruction', 'blender':bpy.app.version_string,
         'body_mm':[78.0,163.4,8.75], 'screen_mm':[73.35,159.35], 'triangles':triangles,
         'mesh_objects':len(model_objects), 'materials':len(model_objects),
         'glb_bytes':glb_path.stat().st_size, 'axes':'X right, Y up, Z front',
         'screen_uv':'glTF standard: V=0 at top',
         'reference':'https://support.apple.com/en-us/125091',
         'notes':'Visual reconstruction from public product reference; not a manufacturing CAD or an official Apple asset.'}
(EVIDENCE / 'model-build.json').write_text(json.dumps(stats,indent=2)+'\n')
print('MODEL_BUILD',json.dumps(stats),flush=True)

if '--no-render' not in sys.argv:
    scene.render.filepath = str(EVIDENCE / 'front-three-quarter.png')
    bpy.ops.render.render(write_still=True)
    camera.location = (.19,.045,-.36)
    aim(camera)
    scene.render.filepath = str(EVIDENCE / 'rear-three-quarter.png')
    bpy.ops.render.render(write_still=True)
    # Three linked handset copies, matching the website's shared geometry strategy.
    root.location.x = -.135
    root.rotation_euler.y = -.45
    for index,angle in [(1,0),(2,math.radians(155))]:
        parent = root.copy()
        model_collection.objects.link(parent)
        parent.location.x = (index-1)*.135
        parent.rotation_euler.y = angle
        for src in model_objects:
            obj = src.copy()
            obj.data = src.data
            model_collection.objects.link(obj)
            obj.parent = parent
    camera.location = (0,0,.6)
    aim(camera)
    camera_data.ortho_scale = .43
    scene.render.resolution_x,scene.render.resolution_y = 1800,1100
    scene.render.filepath = str(EVIDENCE / 'triptych.png')
    bpy.ops.render.render(write_still=True)
