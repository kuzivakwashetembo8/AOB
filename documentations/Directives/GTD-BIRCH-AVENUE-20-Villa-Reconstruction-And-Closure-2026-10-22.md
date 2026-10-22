# Birch Avenue — 20-villa reconstruction recipe and experiment closure

Recorded: 2026-10-22 (Africa/Johannesburg).
Status: concept and repeated-building pipeline proven; experiment closed, not merged. Documentation retained on main for a future authorized South Ward build.

## Owner decision and visual result

Harmony confirms that the experiment proved what was needed and requests documentation only on main, then closure of the branch. The final mobile screenshot (218803.jpg, preview gtd-grye7wbxe) still shows grass between the facing rows and no visible driveway. Treat both the center road and driveway integration as visually unproven/unsuccessful. Do not present the passing tests or READY deployment as visual acceptance.

The demonstrated result is twenty recognizable imported villas in two facing rows, with colour variants and natural timber colours. Frame-rate and mobile memory performance were not measured to acceptance. This is a reusable construction recipe, not a finished street delivered to main.

## Names and historical references

The owner calls the future street Birch Avenue. Experimental HUD nearest-road text displayed “Birch Avenue”, while the experiment's objective and new east–west road ID used “Villa Avenue”. These are not equivalent identifiers: existing Birch Avenue is a north–south road at x=-125; the proposed residential centerline is east–west at z=-112.5. Resolve the final street name and stable IDs deliberately when building the future neighborhood; do not silently rename or duplicate the existing road.

Closed experiment: South-Ward-20-Villa-Stress-Test, PR #45, https://github.com/interlinkglobal/GTD/pull/45.
House batch commit: ec7a5421318107e7fe5a65591ba347b349387371.
Road/driveway attempt: cc2eb20ab2a5e2d4d4bfc2f2c70b6352db1273c0.
Original single-villa pipeline reference: 2a10c7abee156c8b6041fb756100606f0850bcac, PR #44 (separate trial, not changed by this closure).
Historical previews: https://gtd-74i763nv3-interlinkglobaltech.vercel.app/game?gtdVillaStress=1 and https://gtd-grye7wbxe-interlinkglobaltech.vercel.app/game?gtdVillaStress=1. These are evidence references, not production.

Do not merge PR #45 or copy its runtime wholesale. The instructions below suffice to reconstruct the demonstrated houses from the source OBJ on main; historical commits are optional audit references.

## Source and deterministic conversion

Source on main: public/GLBs/Infrastructure/Minimal Modern Villa House N101225.obj.
Keep the original intact. The source contains 5,454 positions, 8,314 polygon faces yielding 8,320 triangles, authored normals and UVs. Material names and triangles: Wood=272, Wood_2=7,480, Stucco=428, Glass=140. No STL is needed.

The trial assumed .001 source-unit conversion; the source does not reliably declare units. Do not generalize this assumption to future imports. Convert source Z-up to game Y-up using:
- centerX=(minX+maxX)/2, centerY=(minY+maxY)/2, floorZ=minZ;
- position=((x-centerX)*.001, (z-floorZ)*.001, -(y-centerY)*.001);
- normal=(nx,nz,-ny), normalized;
- preserve UVs, triangulate polygon fans and deduplicate (positionIndex,uvIndex,normalIndex) per material;
- export one mesh per material, embedded GLB buffer, grounded/centered pivot.

Expected derivative: public/GLBs/Infrastructure/modern-villa-trial.glb, 625,076 bytes; SHA-256 7a5cfbe7f90273ee7d9b450c7a9eb1884cd10387d69a0be1d20a3291732ee20f. Unplaced bounds are 30.47835156 m wide, 12.36310937 m high, 18.85767188 m deep.

The MTL added later references dr55rfvf.png, 2sszaw32.png and fiber01.png; those textures were missing at the recorded snapshot. The demonstrated palette was reconstructed, not a faithful application of complete source textures. Check current supporting files before future changes. Harmony's team owns acquisition, licences/attribution; Codex owns preparation/placement/integration.

The complete original dependency-free Python converter is included at the end of this document. Save it temporarily as villa-convert.py and run:
```sh
python villa-convert.py --source 'public/GLBs/Infrastructure/Minimal Modern Villa House N101225.obj' --output public/GLBs/Infrastructure/modern-villa-trial.glb
```

## Exact house placement

Use twenty stable lot IDs, villa-stress-1 through villa-stress-20. For zero-based index i=0..19:
```ts
const column = i % 10;
const north = i < 10;
const x = -99 + column * 22;
const z = -112.5 + (north ? -17 : 17);
const y = 0.04;
const yaw = north ? 0 : Math.PI;
const scale = 0.6;
```
The source's frontage faces local +Z, so these rotations face both rows toward the center. Ten north-row centers are at z=-129.5, ten south-row centers at z=-95.5. Both rows use x=-99,-77,-55,-33,-11,11,33,55,77,99.

Uniform .6 scale gives each rendered house about 18.2870 × 7.4179 × 11.3146 m. Along-row spacing is 22 m, leaving about 3.713 m between full bounds. The frontage sits about 11.343 m from the centerline. Retain these as the demonstrated proportions, then review against cars and Voight before a permanent district placement.

Exclude trees/shrubs and their trunk colliders from each footprint plus a 1.5 m margin. Generate visuals and collision from the same filtered vegetation plan. Later include actual driveways and road clearances in the exclusion area as well.

## Exact colour recipe

Use this ordered facade/Stucco palette for indices 0..19:
```ts
const facade = [
 "#e6d5bc","#bdd0dc","#c8d4bf","#e2c1b4","#d2c8df",
 "#e7d6a8","#aebfc6","#c2d8d1","#d9b4b9","#d4d0bf",
 "#e8c8a6","#b5c5d9","#bac7a8","#d7bda7","#c3b6ce",
 "#dfdabb","#adcac8","#c6bfc0","#c9d7e0","#dbd0c7"
];
const timber = [
 "#7b4c2f","#956339","#66402b","#ad7a47","#875234",
 "#ba8855","#70462d","#a06c42","#825a3e","#62422e"
];
```
For house i clone its three opaque PBR materials. Stucco gets Color3.FromHexString(facade[i]), roughness .9, metallic 0. Wood gets Color3.FromHexString(timber[i%10]), roughness .78, metallic 0. Wood_2 gets the same timber colour multiplied by .78, roughness .78, metallic 0. Never recolour the wood with the pastel facade palette.

Keep Glass shared: original baseColorFactor [.24,.46,.57,.55], alphaMode BLEND, roughness .18, metallic .2. The converter makes materials double-sided. Original opaque conversion values are in the script; the per-house override above is required to reproduce the batch appearance. Most source triangles belong to Wood_2, so preserve semantic material names instead of recolouring whole houses indiscriminately. Facade differences can be visually subtle because Stucco covers only 428 triangles per house.

## Load once and share geometry

Import Babylon's glTF loader, then call loadAssetContainerAsync once for the derivative. For each lot:
1. Create one TransformNode with the position/yaw/uniform scale above.
2. Call container.instantiateModelsToScene(name => lotId+":"+name, false, {doNotInstantiate:true}).
3. Parent returned rootNodes to that transform. Mesh clones share the original geometry; verify four distinct geometry objects across eighty material meshes. This is shared geometry, not a claim of twenty hardware instances or four draw calls.
4. Clone only opaque materials as described, leave Glass shared. Set receiveShadows, register opaque shadow casters and camera-blocking metadata.
5. Add one conservative exterior box per house: center (x,.04+12.36310937*.6/2,z), half extents (30.47835156*.6/2,12.36310937*.6/2,18.85767188*.6/2), yaw as above. This blocks the full exterior bounds; it provides no traversable interior, garage or doors.
6. Include the asset promise in world readiness. Dispose instances, parent transforms, cloned materials, colliders and finally the container; remove performance observers.

Cost: one 625,076-byte source load, 80 material meshes, 166,400 logical villa triangles (20×8,320), 60 cloned opaque materials plus shared glass. Shadows, unique materials and overdraw still cost rendering time despite small download/shared geometry. The experiment exposed a rolling 300-frame average/p95 report, but no actual device result was accepted.

## Road and driveway requirements for the future build

Desired reference: an 8 m two-lane road between the rows, dashed center markings, grass between individual paved approaches, and an unbroken route into the South Ward network near Mercer Street.

Attempted graph: insert nodes (-125,0,-112.5) and (125,0,-112.5); split the existing Birch/Cedar vertical segments spanning that Z; connect a 250 m local road, width 8, laneCount 2, sidewalkWidth 2.5. Existing Birch/Cedar continue via Pine Road (z=-80) to Mercer Street (z=8). Reuse actual network topology for junctions and collision, not overlapping decorative road strips.

Attempted driveways: 4.5 m width at each house x; road edge z=centerZ±4, sidewalk edge z=centerZ±6.5, house end z=lot.z-direction*(18.85767188*.6/2-.2), where direction=-1 north/+1 south. Two quad sections used heights .036 → .111 → .045. One warm concrete material #b5a99a, one batched mesh. Sidewalk and curb geometry/colliders were split at the same openings.

These are attempted dimensions, NOT a validated driveway solution. The owner still saw grass on the final mobile preview. Earlier explanation that downward triangle winding caused invisibility was a code-derived hypothesis; reversing the indices and passing computed-normal tests did not establish a successful rendered fix. Do not repeat the earlier success claim.

Before choosing another correction, inspect the actual live scene: asset/build version, road creation flag, world transform, triangle winding/front-face convention, backface culling, terrain depth/layering, material visibility, world ownership, readiness and disposal. Capture the actual two-row view on desktop/mobile and demonstrate a visible continuous road plus all twenty approaches. Also verify support height, vehicle traversal, curb gaps and vegetation clearance in the rendered scene. A NullEngine geometry test cannot substitute for that gate.

## Future build checkpoints

1. Recreate the derivative and verify hash/bounds/material names; load all twenty lots using the exact recipe.
2. Confirm 10+10 facing arrangement, twenty facade colours and natural timber preservation in screenshots.
3. Implement and visually validate road/driveways as a new bounded task. Resolve Birch/Villa naming and connect to existing Mercer topology.
4. Measure mobile/desktop loading and frame/memory behavior. Protect accepted character, vehicle, foliage and generated-building baselines.
5. Obtain visual acceptance before any runtime merge/release.

## Closure

PR #45 is to be closed without merge after this documentation reaches main. The experiment is retired from development. Main receives this recipe and a directive-index link only: no runtime source, derivative GLB, converter script, winding changes or driveway meshes. No deployment is requested. PR #44 remains a separate historical single-villa trial.

## Appendix — original conversion script

```python
"""VILLA-001: deterministic, geometry-preserving OBJ to GLB conversion.
Usage: python scripts/villa001-convert-obj.py --source SOURCE --output DEST
Source axes are Z-up, measured in millimetres; output is Y-up metres.
"""
import argparse,collections,hashlib,json,math,pathlib,struct

def convert(source,output):
    positions=[];normals=[];uvs=[];batches=collections.OrderedDict();material='Stucco'
    for line in pathlib.Path(source).read_text().splitlines():
        parts=line.split()
        if not parts:continue
        if parts[0]=='v':positions.append(tuple(map(float,parts[1:4])))
        elif parts[0]=='vn':normals.append(tuple(map(float,parts[1:4])))
        elif parts[0]=='vt':uvs.append(tuple(map(float,parts[1:3])))
        elif parts[0]=='usemtl':material=parts[1]
        elif parts[0]=='f':
            face=[]
            for item in parts[1:]:
                fields=item.split('/');index=[]
                for i,total in enumerate((len(positions),len(uvs),len(normals))):
                    value=int(fields[i]) if i<len(fields) and fields[i] else 0
                    index.append(value-1 if value>0 else total+value if value<0 else None)
                face.append(tuple(index))
            for i in range(1,len(face)-1):batches.setdefault(material,[]).append((face[0],face[i],face[i+1]))
    if not positions:raise ValueError('OBJ contains no positions')
    low=[min(v[i] for v in positions) for i in range(3)];high=[max(v[i] for v in positions) for i in range(3)]
    center=[(low[0]+high[0])/2,(low[1]+high[1])/2,low[2]]
    def point(v):return ((v[0]-center[0])*.001,(v[2]-center[2])*.001,-(v[1]-center[1])*.001)
    palette={'Wood':([.28,.13,.055,1],.82,0),'Wood_2':([.13,.15,.16,1],.65,.08),'Stucco':([.88,.86,.80,1],.95,0),'Glass':([.24,.46,.57,.55],.18,.2)}
    data=bytearray();views=[];accessors=[];materials=[];meshes=[]
    def accessor(values,kind,component):
        while len(data)%4:data.append(0)
        flat=[x for row in values for x in row];start=len(data);fmt='f' if component==5126 else 'I';data.extend(struct.pack('<'+fmt*len(flat),*flat))
        views.append({'buffer':0,'byteOffset':start,'byteLength':len(data)-start})
        a={'bufferView':len(views)-1,'componentType':component,'count':len(values),'type':kind}
        if kind=='VEC3' and component==5126:a.update(min=[min(v[i] for v in values) for i in range(3)],max=[max(v[i] for v in values) for i in range(3)])
        accessors.append(a);return len(accessors)-1
    for name,triangles in batches.items():
        keys={};pos=[];norm=[];uv=[];indices=[]
        for triangle in triangles:
            for key in triangle:
                if key not in keys:
                    vi,ti,ni=key
                    if ni is None:raise ValueError('Missing authored OBJ normals')
                    keys[key]=len(pos);pos.append(point(positions[vi]));n=normals[ni];length=math.sqrt(sum(x*x for x in n));norm.append((n[0]/length,n[2]/length,-n[1]/length));uv.append(uvs[ti] if ti is not None else (0,0))
                indices.append((keys[key],))
        color,rough,metal=palette.get(name,palette['Stucco']);mat={'name':name,'pbrMetallicRoughness':{'baseColorFactor':color,'roughnessFactor':rough,'metallicFactor':metal},'doubleSided':True}
        if name=='Glass':mat['alphaMode']='BLEND'
        materials.append(mat)
        meshes.append({'name':'Villa '+name,'primitives':[{'attributes':{'POSITION':accessor(pos,'VEC3',5126),'NORMAL':accessor(norm,'VEC3',5126),'TEXCOORD_0':accessor(uv,'VEC2',5126)},'indices':accessor(indices,'SCALAR',5125),'material':len(materials)-1}]})
    gltf={'asset':{'version':'2.0','generator':'GTD VILLA-001 OBJ converter'},'scene':0,'scenes':[{'nodes':list(range(len(meshes)))}],'nodes':[{'name':m['name'],'mesh':i} for i,m in enumerate(meshes)],'meshes':meshes,'materials':materials,'buffers':[{'byteLength':len(data)}],'bufferViews':views,'accessors':accessors}
    js=json.dumps(gltf,separators=(',',':')).encode();js+=b' '*((-len(js))%4);data+=b'\0'*((-len(data))%4)
    glb=struct.pack('<4sII',b'glTF',2,12+8+len(js)+8+len(data))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(data),b'BIN\0')+data
    pathlib.Path(output).parent.mkdir(parents=True,exist_ok=True);pathlib.Path(output).write_bytes(glb)
    return {'sourceSha256':hashlib.sha256(pathlib.Path(source).read_bytes()).hexdigest(),'glbSha256':hashlib.sha256(glb).hexdigest(),'sourceVertices':len(positions),'triangles':sum(map(len,batches.values())),'materialTriangles':{k:len(v) for k,v in batches.items()},'outputBytes':len(glb),'dimensionsMeters':[(high[0]-low[0])*.001,(high[2]-low[2])*.001,(high[1]-low[1])*.001]}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--output',required=True);a=p.parse_args();print(json.dumps(convert(a.source,a.output),indent=2))

```
