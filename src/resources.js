export const resourceGroups = [
  {
    name: "Three.js official references",
    description:
      "Start here when an implementation detail depends on the current Three.js API rather than a copied snippet.",
    links: [
      { label: "Three.js documentation", url: "https://threejs.org/docs/" },
      { label: "Three.js manual", url: "https://threejs.org/manual/" },
      { label: "Three.js examples", url: "https://threejs.org/examples/" }
    ]
  },
  {
    name: "Asset formats and loading",
    description:
      "Use these references when GLB, GLTF, texture compression, or geometry compression choices affect delivery size and runtime behavior.",
    links: [
      { label: "Khronos glTF overview", url: "https://www.khronos.org/gltf/" },
      { label: "Three.js GLTFLoader", url: "https://threejs.org/docs/#examples/en/loaders/GLTFLoader" },
      { label: "Three.js DRACOLoader", url: "https://threejs.org/docs/#examples/en/loaders/DRACOLoader" },
      { label: "Three.js KTX2Loader", url: "https://threejs.org/docs/#examples/en/loaders/KTX2Loader" }
    ]
  },
  {
    name: "Browser APIs around WebGL",
    description:
      "Three.js scenes live inside ordinary browser pages. These APIs matter when the canvas resizes, exports screenshots, pauses offscreen, or handles input.",
    links: [
      { label: "MDN ResizeObserver", url: "https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver" },
      { label: "MDN IntersectionObserver", url: "https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver" },
      { label: "MDN Pointer events", url: "https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events" },
      { label: "MDN HTMLCanvasElement.toBlob", url: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob" }
    ]
  },
  {
    name: "Publishing and site quality",
    description:
      "These references guide how Vavist structures static pages around the WebGL demos so the site remains useful without relying on canvas pixels alone.",
    links: [
      { label: "Google helpful content guidance", url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content" },
      { label: "AdSense site readiness", url: "https://support.google.com/adsense/answer/7299563" },
      { label: "AdSense eligibility", url: "https://support.google.com/adsense/answer/9724" }
    ]
  }
];
