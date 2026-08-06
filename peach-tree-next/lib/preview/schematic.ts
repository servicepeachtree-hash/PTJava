import * as THREE from 'three';
import pako from 'pako';
import { parseNBT, decodeVarintArray } from './nbt';

function colorForBlockName(name: string): number {
  // Deterministic color from the block's name, so the same block type is always the same color.
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return new THREE.Color(`hsl(${hue}, 55%, 55%)`).getHex();
}

export async function buildSchematicScene(fileBuffer: ArrayBuffer): Promise<THREE.Group> {
  const inflated = pako.ungzip(new Uint8Array(fileBuffer));
  const root = parseNBT(inflated);
  console.log('[schematic] NBT root keys:', Object.keys(root));

  // Sponge Schematic v3 nests block data under "Blocks"; v2 keeps it at the top level.
  // Some exporters nest everything under a top-level "Schematic" key, others put it at the true root.
  const effectiveRoot = (root.Schematic ?? root) as Record<string, any>;
  const blocksNode = (effectiveRoot.Blocks ?? effectiveRoot) as Record<string, any>;
  console.log('[schematic] effective root keys:', Object.keys(effectiveRoot), '| blocks node keys:', Object.keys(blocksNode));

  const width = Number(effectiveRoot.Width);
  const height = Number(effectiveRoot.Height);
  const length = Number(effectiveRoot.Length);
  if (!width || !height || !length) {
    throw new Error('Could not read schematic dimensions — this file may not be a supported Sponge Schematic (.schem) format.');
  }

  const paletteObj: Record<string, number> = blocksNode.Palette ?? {};
  const idToName = new Map<number, string>();
  console.log('[schematic] palette entries:', Object.keys(paletteObj).length, Object.keys(paletteObj).slice(0, 10));
  Object.entries(paletteObj).forEach(([name, id]) => idToName.set(Number(id), name));

  const blockDataRaw: Uint8Array = blocksNode.BlockData ?? blocksNode.Data;
  if (!blockDataRaw) throw new Error('Schematic has no block data to preview.');
  const indices = decodeVarintArray(blockDataRaw);

  const group = new THREE.Group();
  const colorCache = new Map<string, number>();
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  // Group by color and use InstancedMesh per color for performance on large builds.
  const byColor = new Map<number, THREE.Matrix4[]>();
  const dummy = new THREE.Object3D();

  let i = 0;
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < length; z++) {
      for (let x = 0; x < width; x++) {
        const paletteIndex = indices[i++];
        const name = idToName.get(paletteIndex) || 'minecraft:stone';
        if (name.includes('air')) continue;

        let color = colorCache.get(name);
        if (color === undefined) { color = colorForBlockName(name); colorCache.set(name, color); }

        dummy.position.set(x - width / 2, y - height / 2, z - length / 2);
        dummy.updateMatrix();
        const list = byColor.get(color) ?? [];
        list.push(dummy.matrix.clone());
        byColor.set(color, list);
      }
    }
  }

  console.log('[schematic] dimensions:', width, height, length, '| total indices:', indices.length, '| distinct colors:', byColor.size);

  byColor.forEach((matrices, color) => {
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
    matrices.forEach((m, idx) => mesh.setMatrixAt(idx, m));
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  });

  return group;
}
