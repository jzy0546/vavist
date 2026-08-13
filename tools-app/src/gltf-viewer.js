import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { initSite } from "./shared/site.js";
import {
  THREE,
  addGrid,
  addStudioLighting,
  createCamera,
  createOrbit,
  createRenderer,
  createSampleModel,
  fitCameraToObject,
  resizeRenderer,
  runScene
} from "./shared/three-utils.js";

initSite();

const canvas = document.querySelector("#viewer-canvas");
const fileInput = document.querySelector("#model-file");
const dropzone = document.querySelector("#dropzone");
const sampleButton = document.querySelector("#load-sample");
const status = document.querySelector("#viewer-status");
const metrics = {
  meshes: document.querySelector("#metric-meshes"),
  vertices: document.querySelector("#metric-vertices"),
  triangles: document.querySelector("#metric-triangles"),
  size: document.querySelector("#metric-size")
};

let scene;
let camera;
let renderer;
let controls;
let currentModel;

if (canvas) {
  try {
    const container = canvas.parentElement;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2f6fb);
    camera = createCamera(container, [3, 2.1, 4.5]);
    renderer = createRenderer(canvas, { exposure: 1 });
    controls = createOrbit(camera, canvas, [0, 0.5, 0]);
    addStudioLighting(scene);
    addGrid(scene, 10);
    container.dataset.webglReady = "true";

    window.addEventListener("resize", () => resizeRenderer(renderer, camera, container));
    runScene(() => {
      resizeRenderer(renderer, camera, container);
      controls.update();
      renderer.render(scene, camera);
    });
    loadSampleModel();
  } catch {
    canvas.parentElement.dataset.webglReady = "false";
    setStatus("WebGL preview unavailable. Static sample metrics and guidance remain below.");
  }
}

if (fileInput) {
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) loadModelFile(file);
  });
}

if (dropzone) {
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.dataset.active = "true";
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.dataset.active = "false";
    });
  });

  dropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) loadModelFile(file);
  });
}

sampleButton?.addEventListener("click", loadSampleModel);

function loadSampleModel() {
  if (!scene) return;
  setStatus("Loading the built-in sample GLB.");
  const loader = new GLTFLoader();
  loader.load(
    "/tools/sample-cube.glb",
    (gltf) => {
      setModel(gltf.scene);
      updateMetrics(gltf.scene, "Built-in sample ready");
    },
    undefined,
    () => {
      const fallback = createSampleModel();
      setModel(fallback);
      updateMetrics(fallback, "Generated fallback ready");
      setStatus("Sample GLB could not load. A generated fallback is shown.");
    }
  );
}

function loadModelFile(file) {
  if (!/\.(glb|gltf)$/i.test(file.name)) {
    setStatus("Choose a .glb or .gltf file.");
    return;
  }

  setStatus(`Loading ${file.name}`);
  const url = URL.createObjectURL(file);
  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      URL.revokeObjectURL(url);
      setModel(gltf.scene);
      updateMetrics(gltf.scene, file.name);
      setStatus(`${file.name} loaded locally.`);
    },
    undefined,
    (error) => {
      URL.revokeObjectURL(url);
      setStatus(`Could not load this file: ${error.message || "unknown error"}`);
    }
  );
}

function setModel(model) {
  if (!scene) return;
  if (currentModel) {
    scene.remove(currentModel);
    disposeObject(currentModel);
  }
  currentModel = model;
  scene.add(currentModel);
  fitCameraToObject(camera, currentModel, controls);
}

function updateMetrics(model, label) {
  let meshCount = 0;
  let vertices = 0;
  let triangles = 0;
  model.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    meshCount += 1;
    const position = child.geometry.getAttribute("position");
    const index = child.geometry.index;
    if (position) vertices += position.count;
    triangles += index ? index.count / 3 : position ? position.count / 3 : 0;
  });
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  metrics.meshes.textContent = String(meshCount);
  metrics.vertices.textContent = formatNumber(vertices);
  metrics.triangles.textContent = formatNumber(Math.round(triangles));
  metrics.size.textContent = `${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`;
  setStatus(`${label}: ${meshCount} mesh${meshCount === 1 ? "" : "es"} in scene.`);
}

function disposeObject(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.geometry?.dispose?.();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material?.dispose?.());
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat("en").format(value);
}

function setStatus(message) {
  if (status) status.textContent = message;
}
