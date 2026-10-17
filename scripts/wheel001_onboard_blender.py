#!/usr/bin/env python3
"""WHEEL-001 Blender source qualification and safe original-wheel pivot rigging.

Usage:
    blender -b -t 2 --python scripts/wheel001_onboard_blender.py -- \
      --source "public/toyota hilux 002.glb" --model-id toyota-hilux-002 \
      --out-dir /tmp/wheel001/toyota

Source is read-only. Outputs an MVRS audit in ALL circumstances; outputs a
derived GLB only after four genuinely separate original wheel assemblies
pass geometry and symmetry checks. It does not manufacture replacement wheels,
cut ambiguous body surfaces, assert owner acceptance, or modify main.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
import traceback
from collections import defaultdict
from pathlib import Path

def cli():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--model-id", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--front-sign", type=int, default=1, choices=[-1, 1])
    return parser.parse_args(args)

def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()

def bounds_world(obj):
    from mathutils import Vector
    pts = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    return {
        "min": [min(p[i] for p in pts) for i in range(3)],
        "max": [max(p[i] for p in pts) for i in range(3)],
        "center": [(min(p[i] for p in pts)+max(p[i] for p in pts))/2 for i in range(3)],
        "extent": [max(p[i] for p in pts)-min(p[i] for p in pts) for i in range(3)],
    }

def is_wheel_name(name: str) -> bool:
    return bool(re.search(r"(?:wheel|tyre|tire|pneu|reifen|roue)", name, re.I)) \
        and not bool(re.search(r"(?:steering.?wheel|wheel.?arch|fender|caliper)", name, re.I))

def audit_object(obj):
    b = bounds_world(obj)
    return {"name": obj.name, "vertices":len(obj.data.vertices),
            "polygons":len(obj.data.polygons),
            "materials":[x.name if x else None for x in obj.data.materials],
            "center": [round(x,5) for x in b["center"]],
            "extent": [round(x,5) for x in b["extent"]]}

def wheel_candidates(objects, long_axis, lat_axis, front_sign):
    """Find independent source wheel bodies by actual geometry, not name alone.

    Requires lower-body placement, finite vertical diameter and longitudinal
    and lateral exterior placement. This step merely proposes source meshes.
    Four quadrants and nearly symmetric diameters still must pass verification.
    """
    usable = [o for o in objects if o.type == "MESH" and len(o.data.vertices)>20]
    if not usable:
        return {}, "no-geometry"
    extents=[bounds_world(obj) for obj in usable]
    min_xyz=[min(b["min"][j] for b in extents) for j in range(3)]
    max_xyz=[max(b["max"][j] for b in extents) for j in range(3)]
    center_xyz=[(min_xyz[j]+max_xyz[j])/2 for j in range(3)]
    car_width=max_xyz[lat_axis]-min_xyz[lat_axis]
    car_length=max_xyz[long_axis]-min_xyz[long_axis]
    car_height=max_xyz[2]-min_xyz[2]
    if car_width<=0 or car_length<=0 or car_height<=0:
        return {}, "invalid-car-dimensions"
    hits:dict[str,list]=defaultdict(list)
    for obj,b in zip(usable,extents):
        d=b["extent"]; c=b["center"]
        # A tire must have a substantially circular vertical/longitudinal
        # cross section; thickness is along the body's lateral axis.
        transverse=d[lat_axis]
        diameter_vert=d[2]
        diameter_long=d[long_axis]
        plausible_shape = (.03*car_width<transverse<.42*car_width and
            .11*car_height<diameter_vert<.72*car_height and
            .13*car_height<diameter_long<.9*car_height and
            max(diameter_vert,diameter_long)/max(.00001,min(diameter_vert,diameter_long))<1.3)
        near_sides=abs(c[lat_axis]-center_xyz[lat_axis])>.27*car_width
        near_axles=abs(c[long_axis]-center_xyz[long_axis])>.22*car_length
        near_ground=c[2]<min_xyz[2]+.55*car_height
        if not (plausible_shape and near_sides and near_axles and near_ground):
            continue
        front=(c[long_axis]-center_xyz[long_axis])*front_sign>0
        left=(c[lat_axis]-center_xyz[lat_axis])>0
        corner=("front" if front else "rear")+("Left" if left else "Right")
        # No ambiguous auto-rig from a name alone. Non-named geometry can be
        # considered only if it is an isolated circular part.
        hits[corner].append((obj,b,is_wheel_name(obj.name)))
    if any(len(hits.get(c,[]))!=1 for c in
           ["frontLeft","frontRight","rearLeft","rearRight"]):
        return hits, "nonunique-wheel-candidates"
    samples=[hits[c][0][1] for c in
             ["frontLeft","frontRight","rearLeft","rearRight"]]
    diameters=[(x["extent"][2]+x["extent"][long_axis])/2 for x in samples]
    centers=[x["center"] for x in samples]
    if max(diameters)-min(diameters)>max(diameters)*.18:
        return hits, "unequal-wheel-diameters"
    if abs(centers[0][long_axis]-centers[1][long_axis])>max(diameters)*.3 \
       or abs(centers[2][long_axis]-centers[3][long_axis])>max(diameters)*.3:
        return hits, "axle-centers-not-aligned"
    if max(x[2] for x in centers)-min(x[2] for x in centers)>max(diameters)*.35:
        return hits, "inconsistent-hub-heights"
    return hits, None

def inspect_components_without_mutation(objects):
    """Diagnose topological separability of original connected surfaces.

    If the complete GLB uses one combined mesh, audit its connected
    components without exploding the scene into hundreds of Blender objects.
    An ambiguous result is explicitly returned for supervised repair.
    """
    import bmesh
    summary=[]
    for o in objects:
        if o.type!="MESH" or len(o.data.vertices)<100: continue
        bm=bmesh.new()
        try:
            bm.from_mesh(o.data)
            visited=set(); sizes=[]
            for vertex in bm.verts:
                if vertex in visited:continue
                stack=[vertex];visited.add(vertex);cnt=0
                while stack:
                    current=stack.pop();cnt+=1
                    for edge in current.link_edges:
                        neighbor=edge.other_vert(current)
                        if neighbor not in visited:
                            visited.add(neighbor);stack.append(neighbor)
                sizes.append(cnt)
            sizes.sort(reverse=True)
            summary.append({"mesh":o.name,"components":len(sizes),
                "largest_vertex_counts":sizes[:24]})
        finally:
            bm.free()
    return summary

def create_source_preserving_pivots(source_objects,hits,lat_axis):
    """A/B-class source: move actual wheel meshes under measured empty hubs.

    Source wheel meshes keep their visual world matrices. The result is a
    truly independent steering pivot and rolling pivot per wheel.
    """
    import bpy
    from mathutils import Vector
    geometry_mapping={}
    for corner in ["frontLeft","frontRight","rearLeft","rearRight"]:
        obj,b,_=hits[corner][0]
        old_world=obj.matrix_world.copy()
        center=b["center"]
        if corner.startswith("front"):
            steer=bpy.data.objects.new("MVRS_"+corner+"_STEER",None)
            bpy.context.collection.objects.link(steer)
            steer.location=Vector(center)
            roll_parent=steer
        else:
            steer=None
            roll_parent=None
        roll=bpy.data.objects.new("MVRS_"+corner+"_ROLL",None)
        bpy.context.collection.objects.link(roll)
        roll.location=Vector(center)
        if roll_parent:
            world=roll.matrix_world.copy()
            roll.parent=roll_parent
            roll.matrix_world=world
        obj.parent=roll
        obj.matrix_world=old_world
        geometry_mapping[corner]={
            "id":corner,"steerable":corner.startswith("front"),
            "steerNode":steer.name if steer else None,
            "rollNode":roll.name,"sourceMeshes":[obj.name],
            "centerMeters":[round(x,5) for x in center],
            "radiusMeters":round((b["extent"][2]+b["extent"][1 if lat_axis==0 else 0])/4,5)
        }
    return geometry_mapping

def main():
    import bpy
    args=cli()
    source=Path(args.source).resolve()
    target=Path(args.out_dir).resolve()
    target.mkdir(parents=True,exist_ok=True)
    report={
      "schemaVersion":"MVRS-1","modelId":args.model_id,
      "sourcePath":source.name,"sourceAssetSha256":sha256(source),
      "status":"audit-started","classification":"unknown",
      "rig":None,"reason":None,"sourceMeshSummary":[],
      "connectedComponents":[],
    }
    output=target/"wheel001-report.json"
    try:
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)
        bpy.ops.import_scene.gltf(filepath=str(source))
        bpy.context.view_layer.update()
        meshes=[o for o in bpy.context.scene.objects if o.type=="MESH"]
        report["sourceMeshSummary"]=[audit_object(o) for o in meshes[:100]]
        report["sourceMeshCount"]=len(meshes)
        if not meshes:raise ValueError("source-no-render-meshes")
        global_bounds=[bounds_world(o) for o in meshes]
        ext=[max(b["max"][i] for b in global_bounds)-min(b["min"][i] for b in global_bounds)
            for i in range(3)]
        # Blender is Z up after import. The longest horizontal axis is the
        # source car length, but its front sign REQUIRES independent review.
        long_axis=0 if ext[0]>ext[1] else 1
        lat_axis=1-long_axis
        report["inferredLongAxis"]= "X" if long_axis==0 else "Y"
        report["frontSignAssumption"]=args.front_sign
        report["inferredDimensions"]=[round(x,5) for x in ext]
        hits,why=wheel_candidates(meshes,long_axis,lat_axis,args.front_sign)
        report["candidates"]={corner:[audit_object(o) for o,_,_ in parts]
                              for corner,parts in hits.items()}
        if why is not None:
            report["connectedComponents"]=inspect_components_without_mutation(meshes)
            report["status"]="repair-required"
            report["reason"]=why
            report["classification"]="C-or-D" if len(meshes)<=2 else "B-or-C"
            return 2

        report["classification"]="A-or-B"
        mapping=create_source_preserving_pivots(meshes,hits,lat_axis)
        bpy.context.view_layer.update()
        derivative=target/(args.model_id+"-wheel001-rigged.glb")
        bpy.ops.export_scene.gltf(
            filepath=str(derivative),export_format="GLB",
            export_apply=False,export_yup=True,
        )
        report["rig"]=mapping
        report["qualifiedAssetSha256"]=sha256(derivative)
        report["derivedAsset"]=derivative.name
        report["status"]="rig-verified-awaiting-visual-acceptance"
        report["reason"]="original-independent-wheels-with-added-hub-pivots"
        return 0
    except Exception as exc:
        report["status"]="repair-required"
        report["reason"]=f"{type(exc).__name__}:{str(exc)[:300]}"
        report["tracebackSummary"]=traceback.format_exc(limit=4)
        return 3
    finally:
        output.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
        print("WHEEL001_RESULT",str(output),report["status"],report["reason"])

if __name__=="__main__":
    sys.exit(main())
