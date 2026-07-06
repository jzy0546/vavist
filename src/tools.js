export const labTools = [
  {
    name: "GLB Viewer",
    path: "/gltf-viewer/",
    label: "Inspect assets",
    description: "Drop a GLB or GLTF file, read bounds, preview materials, and catch scale problems early."
  },
  {
    name: "Camera FOV",
    path: "/camera-fov/",
    label: "Frame scenes",
    description: "Calculate perspective camera distance and field of view for objects that must fill the viewport."
  },
  {
    name: "Shader Starter",
    path: "/shader-starter/",
    label: "Copy GLSL",
    description: "Generate a small ShaderMaterial base with uniforms, vertex code, and a visible fragment pattern."
  },
  {
    name: "Lighting Presets",
    path: "/lighting-presets/",
    label: "Tune previews",
    description: "Copy practical hemisphere, key, rim, and product lighting setups for readable model previews."
  },
  {
    name: "Examples",
    path: "/examples/",
    label: "Learn patterns",
    description: "Browse small Three.js examples that isolate one useful idea at a time."
  }
];

export const toolExplainers = [
  {
    name: "GLB Viewer",
    path: "/gltf-viewer/",
    label: "Inspect assets",
    localUse: "Use it when a model has unknown scale, missing materials, odd pivots, or animation clips that need a quick sanity check.",
    workflow: [
      "Drop a GLB or GLTF file into the lab viewer.",
      "Check bounding-box size, center, mesh count, material count, and animation clips.",
      "Fit the camera from the computed bounds before tuning lights or UI."
    ],
    relatedGuides: ["three-js-gltf-loader-checklist", "fit-camera-to-object-three-js", "three-js-environment-maps-glb-viewer"]
  },
  {
    name: "Camera FOV",
    path: "/camera-fov/",
    label: "Frame scenes",
    localUse: "Use it when a product, avatar, or imported object needs predictable viewport coverage across desktop and mobile.",
    workflow: [
      "Enter object size, camera field of view, and target coverage.",
      "Compare vertical and horizontal fit so narrow screens do not crop the model.",
      "Copy the resulting distance into your viewer and update OrbitControls target."
    ],
    relatedGuides: ["fit-camera-to-object-three-js", "three-js-responsive-canvas", "three-js-orbitcontrols-damping"]
  },
  {
    name: "Shader Starter",
    path: "/shader-starter/",
    label: "Copy GLSL",
    localUse: "Use it when you need a visible ShaderMaterial baseline before adding textures, noise, displacement, or post effects.",
    workflow: [
      "Start from a shader that proves UVs, uniforms, and time animation work.",
      "Change one uniform or formula at a time.",
      "Keep the starter around as a known-good debug material."
    ],
    relatedGuides: ["three-js-shader-material-starter", "three-js-scene-debugging-checklist", "three-js-transparent-background-screenshot"]
  },
  {
    name: "Lighting Presets",
    path: "/lighting-presets/",
    label: "Tune previews",
    localUse: "Use it when a GLB looks black, flat, or too dramatic under the default scene lights.",
    workflow: [
      "Choose neutral inspection, product glossy, clay, or dark hero lighting.",
      "Copy only the lights needed for the current scene.",
      "Test on mobile before adding shadows or postprocessing."
    ],
    relatedGuides: ["three-js-lighting-product-viewer", "three-js-shadows-without-black-scenes", "three-js-color-management-pbr"]
  },
  {
    name: "Examples",
    path: "/examples/",
    label: "Learn patterns",
    localUse: "Use it when you want a small isolated scene before copying an idea into a larger app.",
    workflow: [
      "Open the smallest example that matches the problem.",
      "Read the associated guide before combining examples.",
      "Copy the pattern into a clean scene and measure performance early."
    ],
    relatedGuides: ["three-js-particles-buffergeometry", "three-js-instancing-many-objects", "three-js-raycaster-picking-checklist"]
  }
];

export const healthChecks = [
  {
    group: "Assets",
    items: [
      { id: "bounds", label: "Object bounds are measured after load", points: 9 },
      { id: "scale", label: "Model scale is normalized or documented", points: 8 },
      { id: "textures", label: "Texture dimensions match the visible camera distance", points: 8 },
      { id: "compression", label: "DRACO/KTX2 or resized assets are considered for heavy files", points: 6 }
    ]
  },
  {
    group: "Camera and interaction",
    items: [
      { id: "fit", label: "Camera is fitted from Box3 bounds, not guessed", points: 10 },
      { id: "target", label: "OrbitControls target matches the object center", points: 7 },
      { id: "limits", label: "Zoom and polar limits keep users in a useful range", points: 5 },
      { id: "resize", label: "Renderer and camera update on responsive container changes", points: 8 }
    ]
  },
  {
    group: "Rendering",
    items: [
      { id: "lights", label: "Lighting preset keeps dark and glossy materials readable", points: 8 },
      { id: "color", label: "Renderer output color space and texture color spaces are explicit", points: 8 },
      { id: "shadows", label: "Shadows are optional, bounded, and not crushing the model", points: 5 },
      { id: "pixelRatio", label: "Pixel ratio is clamped for mobile", points: 8 }
    ]
  },
  {
    group: "UX and reliability",
    items: [
      { id: "loading", label: "Loading, empty, and failed states are visible", points: 7 },
      { id: "motion", label: "Reduced-motion and offscreen render behavior are respected", points: 6 },
      { id: "metrics", label: "Draw calls, triangles, textures, or file size are checked before publish", points: 8 },
      { id: "fallback", label: "The page remains useful if the WebGL demo fails", points: 6 }
    ]
  }
];
