// A small hand-written NBT (Named Binary Tag) reader.
// Enough to read the tag types Sponge Schematic files actually use.

export type NBTValue = any;

class Reader {
  constructor(private view: DataView, public pos = 0) {}
  byte(): number { const v = this.view.getInt8(this.pos); this.pos += 1; return v; }
  ubyte(): number { const v = this.view.getUint8(this.pos); this.pos += 1; return v; }
  short(): number { const v = this.view.getInt16(this.pos); this.pos += 2; return v; }
  int(): number { const v = this.view.getInt32(this.pos); this.pos += 4; return v; }
  long(): bigint { const v = this.view.getBigInt64(this.pos); this.pos += 8; return v; }
  float(): number { const v = this.view.getFloat32(this.pos); this.pos += 4; return v; }
  double(): number { const v = this.view.getFloat64(this.pos); this.pos += 8; return v; }
  bytes(n: number): Uint8Array { const v = new Uint8Array(this.view.buffer, this.view.byteOffset + this.pos, n); this.pos += n; return v; }
  string(): string {
    const len = this.short() & 0xffff;
    const bytes = this.bytes(len);
    return new TextDecoder('utf-8').decode(bytes);
  }
}

function readTagPayload(r: Reader, type: number): NBTValue {
  switch (type) {
    case 1: return r.byte();
    case 2: return r.short();
    case 3: return r.int();
    case 4: return r.long();
    case 5: return r.float();
    case 6: return r.double();
    case 7: { const len = r.int(); return r.bytes(len).slice(); }
    case 8: return r.string();
    case 9: { // List
      const itemType = r.ubyte();
      const len = r.int();
      const arr: NBTValue[] = [];
      for (let i = 0; i < len; i++) arr.push(readTagPayload(r, itemType));
      return arr;
    }
    case 10: { // Compound
      const obj: Record<string, NBTValue> = {};
      while (true) {
        const tagType = r.ubyte();
        if (tagType === 0) break;
        const name = r.string();
        obj[name] = readTagPayload(r, tagType);
      }
      return obj;
    }
    case 11: { const len = r.int(); const arr = new Int32Array(len); for (let i = 0; i < len; i++) arr[i] = r.int(); return arr; }
    case 12: { const len = r.int(); const arr: bigint[] = []; for (let i = 0; i < len; i++) arr.push(r.long()); return arr; }
    default: throw new Error(`Unsupported NBT tag type: ${type}`);
  }
}

/** Parses a decompressed NBT buffer and returns the root compound's contents. */
export function parseNBT(buffer: Uint8Array): Record<string, NBTValue> {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const r = new Reader(view);
  const rootType = r.ubyte();
  if (rootType !== 10) throw new Error('Expected a compound tag at NBT root.');
  r.string(); // root name, usually unused
  return readTagPayload(r, 10);
}

/** Decodes a Sponge Schematic's varint-encoded BlockData byte array into palette indices. */
export function decodeVarintArray(bytes: Uint8Array): number[] {
  const out: number[] = [];
  let value = 0, shift = 0;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    value |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) {
      out.push(value >>> 0);
      value = 0; shift = 0;
    } else {
      shift += 7;
    }
  }
  return out;
}
