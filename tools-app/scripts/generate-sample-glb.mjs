import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";

const geometry = new THREE.BoxGeometry(2, 2, 2);
const position = geometry.getAttribute("position");
const normal = geometry.getAttribute("normal");
const uv = geometry.getAttribute("uv");
const index = geometry.index;

const chunks = [];
const bufferViews = [];

const append = (typedArray, target) => {
  const source = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
  const byteOffset = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const padding = (4 - (source.length % 4)) % 4;
  chunks.push(source, Buffer.alloc(padding));
  bufferViews.push({
    buffer: 0,
    byteOffset,
    byteLength: source.length,
    ...(target ? { target } : {})
  });
  return bufferViews.length - 1;
};

const positionView = append(new Float32Array(position.array), 34962);
const normalView = append(new Float32Array(normal.array), 34962);
const uvView = append(new Float32Array(uv.array), 34962);
const indexView = append(new Uint16Array(index.array), 34963);
const binary = Buffer.concat(chunks);

const json = {
  asset: { version: "2.0", generator: "Vavist sample GLB generator" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: "Vavist Sample Cube" }],
  meshes: [
    {
      name: "Sample Cube",
      primitives: [
        {
          attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 },
          indices: 3,
          material: 0
        }
      ]
    }
  ],
  materials: [
    {
      name: "Vavist Teal",
      pbrMetallicRoughness: {
        baseColorFactor: [0.184, 0.561, 0.514, 1],
        metallicFactor: 0.18,
        roughnessFactor: 0.42
      }
    }
  ],
  accessors: [
    {
      bufferView: positionView,
      componentType: 5126,
      count: position.count,
      type: "VEC3",
      min: [-1, -1, -1],
      max: [1, 1, 1]
    },
    { bufferView: normalView, componentType: 5126, count: normal.count, type: "VEC3" },
    { bufferView: uvView, componentType: 5126, count: uv.count, type: "VEC2" },
    {
      bufferView: indexView,
      componentType: 5123,
      count: index.count,
      type: "SCALAR",
      min: [0],
      max: [position.count - 1]
    }
  ],
  bufferViews,
  buffers: [{ byteLength: binary.length }]
};

const jsonSource = Buffer.from(JSON.stringify(json));
const jsonPadding = (4 - (jsonSource.length % 4)) % 4;
const jsonChunk = Buffer.concat([jsonSource, Buffer.alloc(jsonPadding, 0x20)]);
const totalLength = 12 + 8 + jsonChunk.length + 8 + binary.length;
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(totalLength, 8);
const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(jsonChunk.length, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binaryHeader = Buffer.alloc(8);
binaryHeader.writeUInt32LE(binary.length, 0);
binaryHeader.writeUInt32LE(0x004e4942, 4);

const output = path.join(process.cwd(), "public", "sample-cube.glb");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, Buffer.concat([header, jsonHeader, jsonChunk, binaryHeader, binary]));
console.log(`Generated ${output}: 1 mesh, ${position.count} vertices, ${index.count / 3} triangles.`);
