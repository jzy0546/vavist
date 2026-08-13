import { defineConfig } from "vite";
import { resolve } from "node:path";

const root = process.cwd();

export default defineConfig({
  base: "/tools/",
  appType: "mpa",
  build: {
    outDir: "../dist/tools",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        gltfViewer: resolve(root, "gltf-viewer/index.html"),
        cameraFov: resolve(root, "camera-fov/index.html"),
        shaderStarter: resolve(root, "shader-starter/index.html"),
        lightingPresets: resolve(root, "lighting-presets/index.html"),
        examples: resolve(root, "examples/index.html")
      }
    }
  }
});
