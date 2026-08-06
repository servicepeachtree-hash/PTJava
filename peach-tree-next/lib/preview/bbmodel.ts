import * as THREE from 'three';

type BBFace = { uv?: [number, number, number, number]; texture?: number | null };
type BBElement = {
  from: [number, number, number];
  to: [number, number, number];
  origin?: [number, number, number];
  rotation?: [number, number, number];
  faces?: Record<string, BBFace>;
};
type BBTexture = { source: string };
type BBModel = {
  resolution?: { width: number; height: number };
  elements?: BBElement[];
  textures?: BBTexture[];
};

// Blockbench face name -> the corresponding BoxGeometry group index
// three.js BoxGeometry group order is: +x, -x, +y, -y, +z, -z
const FACE_GROUP: Record<string, number> = {
  east: 0, west: 1, up: 2, down: 3, south: 4, north: 5,
};

function loadTexture(dataUri: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(dataUri, (tex) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      resolve(tex);
    }, undefined, reject);
  });
}

function setFaceUV(geometry: THREE.BoxGeometry, groupIndex: number, u1: number, v1: number, u2: number, v2: number) {
  const uvAttr = geometry.attributes.uv as THREE.BufferAttribute;
  const group = geometry.groups[groupIndex];
  // Each face group covers 2 triangles = 6 indices referencing 4 unique vertices in this box layout.
  // The 4 vertex UV slots per face (in BoxGeometry's default vertex order) map to: (u1,v2) (u2,v2) (u1,v1) (u2,v1)
  const base = groupIndex * 4;
  uvAttr.setXY(base + 0, u1, v2);
  uvAttr.setXY(base + 1, u2, v2);
  uvAttr.setXY(base + 2, u1, v1);
  uvAttr.setXY(base + 3, u2, v1);
  uvAttr.needsUpdate = true;
}

export async function buildBBModelScene(json: BBModel): Promise<THREE.Group> {
  const root = new THREE.Group();
  const resW = json.resolution?.width || 16;
  const resH = json.resolution?.height || 16;

  const textures = await Promise.all(
    (json.textures ?? []).map((t) => (t.source ? loadTexture(t.source) : Promise.resolve(null)))
  );

  const elements = json.elements ?? [];
  for (const el of elements) {
    const [fx, fy, fz] = el.from;
    const [tx, ty, tz] = el.to;
    const sizeX = Math.max(0.001, tx - fx);
    const sizeY = Math.max(0.001, ty - fy);
    const sizeZ = Math.max(0.001, tz - fz);

    const geometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);

    // Assign UVs per face from the bbmodel data, falling back to a full-texture UV if a face is missing.
    Object.entries(FACE_GROUP).forEach(([faceName, groupIdx]) => {
      const face = el.faces?.[faceName];
      const uv = face?.uv ?? [0, 0, resW, resH];
      const u1 = uv[0] / resW, v1 = uv[1] / resH, u2 = uv[2] / resW, v2 = uv[3] / resH;
      setFaceUV(geometry, groupIdx, u1, 1 - v1, u2, 1 - v2);
    });

    // Build one material per face, using whichever texture index that face references.
    const materials = Object.keys(FACE_GROUP).map((faceName) => {
      const face = el.faces?.[faceName];
      const texIdx = face?.texture ?? null;
      const tex = texIdx !== null && texIdx !== undefined ? textures[texIdx] : null;
      return new THREE.MeshLambertMaterial(tex ? { map: tex, transparent: true, alphaTest: 0.1 } : { color: 0x888899 });
    });
    // Materials array must be ordered by group index (east,west,up,down,south,north = 0..5)
    const orderedMaterials = [materials[0], materials[1], materials[2], materials[3], materials[4], materials[5]];

    const mesh = new THREE.Mesh(geometry, orderedMaterials);

    const centerX = (fx + tx) / 2;
    const centerY = (fy + ty) / 2;
    const centerZ = (fz + tz) / 2;
    mesh.position.set(centerX, centerY, centerZ);

    if (el.rotation && el.origin) {
      const pivot = new THREE.Group();
      pivot.position.set(el.origin[0], el.origin[1], el.origin[2]);
      mesh.position.set(centerX - el.origin[0], centerY - el.origin[1], centerZ - el.origin[2]);
      pivot.rotation.set(
        THREE.MathUtils.degToRad(el.rotation[0] ?? 0),
        THREE.MathUtils.degToRad(el.rotation[1] ?? 0),
        THREE.MathUtils.degToRad(el.rotation[2] ?? 0)
      );
      pivot.add(mesh);
      root.add(pivot);
    } else {
      root.add(mesh);
    }
  }

  // Blockbench models are typically authored in a 0-16-ish box; recenter around origin for a clean orbit.
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.children.forEach((c) => c.position.sub(center));

  return root;
}
