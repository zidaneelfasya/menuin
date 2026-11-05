"""Refine hero-only copies, preserving the original roots, hinge and screen UVs.

blender --background --factory-startup --threads 4 --python scripts/assets/refine-hero-devices.py
"""
import bpy
import json
from collections import defaultdict
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
MODELS = ROOT / 'apps/web/public/hero/3d'
SOURCE = ROOT / 'assets/3d'


def set_material(mat, color, metal, roughness):
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*color, 1)
    node.inputs['Metallic'].default_value = metal
    node.inputs['Roughness'].default_value = roughness
    node.inputs['Transmission Weight'].default_value = 0
    node.inputs['Coat Weight'].default_value = 0
    node.inputs['Specular IOR Level'].default_value = .35
    mat.diffuse_color = (*color, 1)


def refine(kind, source, output):
    # Isolated process: the user's open Blender document is never touched.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(MODELS / source))
    root = next(o for o in bpy.context.scene.objects if o.parent is None)
    root.rotation_mode = 'QUATERNION'
    root.rotation_quaternion.identity()
    bpy.context.view_layer.update()
    hinge = bpy.data.objects.get('Display_Hinge_Pivot')
    screen_name = 'MacBook_Display_Screen' if kind == 'macbook' else 'iPad_Pro_DisplayScreen'
    objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    original_triangles = sum(len(o.data.polygons) for o in objects)
    original_draws = len(objects)

    presets = {
        'M_SilverAluminum_Anodized': ((.55, .57, .60), .78, .31),
        'M_Trackpad_Silver': ((.48, .50, .53), .42, .36),
        'M_Keycaps_Black': ((.006, .007, .009), 0, .43),
        'M_KeyboardWell_Black': ((.002, .003, .004), 0, .52),
        'M_SpeakerGrille_Perforated': ((.15, .16, .17), .5, .48),
        'M_RubberFeet_Black': ((.008, .009, .011), 0, .74),
        'M_Ports_Interior': ((.003, .004, .005), 0, .56),
        'M_BezelText': ((.20, .21, .23), .25, .4),
        'M_DisplayBezel_BlackGlass': ((.004, .005, .007), .03, .22),
        'M_AppleLogo_Lid': ((.12, .13, .14), .85, .22),
        'M_SpaceBlack_Aluminum': ((.055, .061, .071), .72, .33),
        'M_AppleLogo_DarkChrome': ((.12, .13, .15), .8, .22),
        'M_Camera_LensGlass': ((.003, .009, .018), 0, .16),
        'M_CameraPlateau_DarkGlass': ((.014, .017, .022), .08, .3),
        'M_Camera_LensRing': ((.08, .09, .11), .8, .24),
        'M_Port_DarkInterior': ((.003, .004, .005), 0, .65),
        'M_SmartConnector_Gold': ((.40, .29, .12), .8, .35),
    }
    for mat in bpy.data.materials:
        if mat.name in presets:
            set_material(mat, *presets[mat.name])
        if 'DisplayScreen' in mat.name:
            # The hero supplies its existing wallpaper; do not download a duplicate in each GLB.
            for node in list(mat.node_tree.nodes):
                if node.type == 'TEX_IMAGE':
                    mat.node_tree.nodes.remove(node)

    if kind == 'macbook':
        legend = bpy.data.materials.new('M_KeyLegend')
        legend.use_nodes = True
        set_material(legend, (.65, .67, .70), 0, .6)
        rows = [
            ['esc', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            list('`1234567890-=') + [''],
            ['tab'] + list('qwertyuiop[]') + [''],
            ['caps'] + list("asdfghjkl;'") + [''],
            ['shift'] + list('zxcvbnm,./') + ['shift'],
            ['fn', 'ctrl', 'opt', 'cmd', '', 'cmd', 'opt', '', '', ''],
        ]
        for key in objects:
            if not key.name.startswith('Key_'):
                continue
            row, column = map(int, key.name.split('_')[1:])
            label = rows[row][column] if column < len(rows[row]) else ''
            # Keep the function row legible without individual high-poly symbols.
            if row == 0 and 0 < column < 13:
                label = 'F' + str(column)
            if not label:
                continue
            text = bpy.data.curves.new('Key legend', 'FONT')
            text.body = label
            text.align_x = 'CENTER'
            text.align_y = 'CENTER'
            text.size = .0024 if len(label) == 1 else .00145
            text.resolution_u = 2
            text.materials.append(legend)
            obj = bpy.data.objects.new('Key legend', text)
            bpy.context.collection.objects.link(obj)
            obj.location = key.matrix_world @ Vector((0, 0, key.dimensions.z / 2 + .000035))
            obj.parent = root
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.convert(target='MESH')
        # Remove excess tessellation in the 77 small keycaps; retain real fillets.
        for obj in objects:
            if obj.name.startswith('Key_'):
                bpy.context.view_layer.objects.active = obj
                modifier = obj.modifiers.new('Web keycap budget', 'DECIMATE')
                modifier.ratio = .32
                bpy.ops.object.modifier_apply(modifier=modifier.name)

    # Face-area-weighted normals keep large glass/metal faces planar, with soft bevels.
    for obj in objects:
        if obj.name == screen_name:
            continue
        bpy.context.view_layer.objects.active = obj
        modifier = obj.modifiers.new('Planar faces and filleted edges', 'WEIGHTED_NORMAL')
        modifier.keep_sharp = True
        modifier.weight = 40
        bpy.ops.object.modifier_apply(modifier=modifier.name)

    bpy.context.view_layer.update()
    batches = defaultdict(list)
    for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
        ancestor = obj.parent
        moving = False
        while ancestor:
            moving |= ancestor == hinge
            ancestor = ancestor.parent
        parent = hinge if moving else root
        world = obj.matrix_world.copy()
        obj.parent = parent
        obj.matrix_world = world
        mat = obj.data.materials[0]
        batches[(parent.name, mat.name)].append(obj)

    for (parent_name, mat_name), group in batches.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in group:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = group[0]
        if len(group) > 1:
            bpy.ops.object.join()
        group[0].name = screen_name if 'DisplayScreen' in mat_name else parent_name.replace('_Root', '') + '_' + mat_name

    # Empty former mesh parents are already gone; keep the animation hinge intact.
    bpy.context.view_layer.update()
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for obj in meshes:
        obj.data.calc_loop_triangles()
    triangle_count = sum(len(o.data.loop_triangles) for o in meshes)
    assert len(meshes) <= 18
    assert triangle_count <= original_triangles
    assert bpy.data.objects.get(screen_name)
    if hinge:
        assert hinge.parent == root

    SOURCE.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / (output.replace('.glb', '.blend'))))
    from io_scene_gltf2.io.exp import meshopt
    meshopt.EXP_FILTER_BITS = 20
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=str(MODELS / output), export_format='GLB', use_selection=True,
        export_yup=True, export_apply=True, export_materials='EXPORT',
        export_meshopt_compression_enable=True, export_meshopt_extension='EXT_meshopt_compression',
        export_normals=True,
    )
    return {'model': output, 'before_triangles': original_triangles, 'triangles': triangle_count,
            'before_draws': original_draws, 'draws': len(meshes), 'bytes': (MODELS / output).stat().st_size}


results = [
    refine('macbook', 'macbook_pro_silver.glb', 'macbook_pro_silver_hero.glb'),
    refine('ipad', 'ipad_pro_space_black_blue.glb', 'ipad_pro_space_black_hero.glb'),
]
report = SOURCE / 'hero-device-build.json'
report.write_text(json.dumps(results, indent=2) + '\n')
print('HERO_MODELS', json.dumps(results), flush=True)
