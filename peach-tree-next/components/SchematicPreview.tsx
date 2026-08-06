'use client';
import { useState } from 'react';
import ModelViewer from './ModelViewer';
import { buildBBModelScene } from '@/lib/preview/bbmodel';
import { buildSchematicScene } from '@/lib/preview/schematic';

export default function SchematicPreview({ path, getUrl, autoShow = false }: { path: string; getUrl: () => Promise<string>; autoShow?: boolean }) {
  const [show, setShow] = useState(autoShow);

  const isBBModel = path.toLowerCase().endsWith('.bbmodel');
  const isSchematic = path.toLowerCase().endsWith('.schem') || path.toLowerCase().endsWith('.schematic');

  if (!isBBModel && !isSchematic) {
    return null;
  }

  async function load() {
    const url = await getUrl();
    const res = await fetch(url);
    if (!res.ok) throw new Error('Could not download the file for preview.');

    if (isBBModel) {
      const json = await res.json();
      return buildBBModelScene(json);
    } else {
      const buf = await res.arrayBuffer();
      return buildSchematicScene(buf);
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      {!show ? (
        <button type="button" onClick={() => setShow(true)} className="link-btn">
          Preview {isBBModel ? 'model' : 'schematic'}
        </button>
      ) : (
        <>
          <ModelViewer load={load} />
          {isSchematic && (
            <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
              Structural preview only — colored by block type, not actual Minecraft textures.
            </p>
          )}
        </>
      )}
    </div>
  );
}
