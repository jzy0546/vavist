export const extraGuides = [
  {
    slug: "three-js-transparent-background-screenshot",
    title: "Three.js transparent background and screenshot export",
    description:
      "Set up a transparent Three.js canvas, keep page compositing predictable, and export clean screenshots without unexpected black backgrounds.",
    summary:
      "Transparent canvas output is simple when alpha, clear color, CSS background, and screenshot timing all agree.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["screenshots", "transparent canvas", "export"],
    takeaways: [
      "Create the renderer with alpha enabled before the first render.",
      "Use preserveDrawingBuffer only when you need reliable canvas export.",
      "Render once immediately before calling toDataURL or toBlob."
    ],
    sections: [
      {
        heading: "Why the background turns black",
        paragraphs: [
          "A black screenshot usually means the renderer, canvas, and page are not making the same promise. The renderer may have been created without alpha support. The scene may be clearing to an opaque color. The page may have a dark CSS background behind a transparent canvas. Or the export may happen before the frame you expect has actually been drawn.",
          "Start by deciding what the page should own and what the renderer should own. If the WebGL scene is a product object floating above an HTML layout, let CSS own the page background and let the renderer output transparency. If the scene is a full-screen artwork, make the renderer background deliberate instead of relying on browser defaults."
        ]
      },
      {
        heading: "Alpha is a renderer choice",
        paragraphs: [
          "The `alpha` option belongs in the WebGLRenderer constructor. Adding transparent CSS later does not retroactively give the WebGL context an alpha channel. Create the renderer with `alpha: true`, then use `renderer.setClearColor(0x000000, 0)` or keep the scene background null so the page can show through.",
          "This matters for landing pages because designers often want text, HTML controls, gradients, and a Three.js object to share one composition. When the canvas is truly transparent, the DOM and WebGL layers can be art-directed together without awkward rectangular edges."
        ]
      },
      {
        heading: "Screenshot export has a cost",
        paragraphs: [
          "For ordinary animation, `preserveDrawingBuffer` is usually unnecessary. For screenshot export, it can make canvas reads more reliable because the previous frame remains available for `toDataURL` or `toBlob`. That reliability has a performance cost, so use it intentionally on pages where export is a real feature.",
          "A stronger pattern is to render one clean frame immediately before export. Update controls, resize the renderer, render the scene, then call `canvas.toBlob`. This reduces timing bugs and makes the exported image match the visible state. If the screenshot needs a transparent background, avoid CSS-only overlays in the capture because canvas export cannot include DOM text or buttons."
        ]
      },
      {
        heading: "When to export with DOM included",
        paragraphs: [
          "Canvas export only captures WebGL pixels. If the final image must include labels, HTML annotations, or a UI frame, you need a different capture pipeline. For many small tools, it is better to export the 3D canvas alone and provide a clear note that DOM overlays are not included.",
          "That limitation can be a feature. A clean transparent PNG of a product model, icon object, or shader preview is easier to reuse in slides, social posts, and design mockups than a screenshot polluted with interface controls."
        ]
      }
    ],
    code: {
      label: "Transparent renderer and PNG export",
      language: "js",
      value:
        "const renderer = new THREE.WebGLRenderer({\n  canvas,\n  antialias: true,\n  alpha: true,\n  preserveDrawingBuffer: true\n});\nrenderer.setClearColor(0x000000, 0);\nscene.background = null;\n\nfunction exportPng() {\n  renderer.render(scene, camera);\n  canvas.toBlob((blob) => {\n    const url = URL.createObjectURL(blob);\n    const link = document.createElement('a');\n    link.href = url;\n    link.download = 'threejs-scene.png';\n    link.click();\n    URL.revokeObjectURL(url);\n  }, 'image/png');\n}"
    },
    sources: [
      { label: "Three.js WebGLRenderer docs", url: "https://threejs.org/docs/#api/en/renderers/WebGLRenderer" },
      { label: "MDN HTMLCanvasElement.toBlob", url: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob" },
      { label: "MDN canvas toDataURL", url: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL" }
    ]
  },
  {
    slug: "three-js-orbitcontrols-damping",
    title: "Three.js OrbitControls damping explained",
    description:
      "Use OrbitControls damping, target, zoom limits, and update loops without making camera movement feel sticky or broken.",
    summary:
      "Damping gives OrbitControls weight, but it only works when the render loop and target are set up correctly.",
    updated: "2026-07-06",
    minutes: 7,
    tags: ["OrbitControls", "camera", "interaction"],
    takeaways: [
      "Call controls.update on every frame when damping is enabled.",
      "Set the controls target to the object center after camera fitting.",
      "Use limits to protect users from zooming inside or losing the model."
    ],
    sections: [
      {
        heading: "Damping is not automatic magic",
        paragraphs: [
          "OrbitControls can feel either crisp and mechanical or smooth and weighted. Damping is the setting that creates that weight. When `enableDamping` is true, the controls keep easing after the pointer input stops. That means the controls need to update over time, not only when the user clicks.",
          "The common bug is enabling damping and rendering only on input events. The camera moves a little, then seems stuck because the damping state is never advanced. If damping is enabled, call `controls.update()` in the animation loop before rendering. If the scene is mostly static and you want event-based rendering, keep damping disabled."
        ]
      },
      {
        heading: "The target matters more than the camera",
        paragraphs: [
          "OrbitControls rotates around its target. If the target is still the origin while the object is centered somewhere else, interaction feels wrong even if the camera initially frames the model. After loading or fitting a model, copy the bounding-box center into `controls.target` and call `controls.update()`.",
          "For product viewers, a stable target is part of the perceived quality. Users should feel like they are holding the object, not dragging the camera through empty space. This is especially important on mobile, where small gestures exaggerate orbit mistakes."
        ]
      },
      {
        heading: "Limit the motion intentionally",
        paragraphs: [
          "A general-purpose debug viewer can allow wide movement, but a public page should protect the composition. Use minDistance and maxDistance so users cannot zoom through the model or lose it. Use minPolarAngle and maxPolarAngle if the underside or top-down view is not useful.",
          "Limits are not about removing control. They keep the interaction inside the useful range. A product viewer, character preview, and architectural scene will each need different boundaries. Tune them after camera fitting, not before."
        ]
      },
      {
        heading: "When to skip OrbitControls",
        paragraphs: [
          "OrbitControls is excellent for inspection, but not every hero scene needs it. If the WebGL object is a background behind text, pointer-driven parallax or slow autorotation may be enough. Giving users full orbit control over a decorative scene can steal attention from the page.",
          "Use OrbitControls when the user is inspecting an object. Use authored camera motion when the scene is mainly communication. That distinction makes the site feel designed instead of assembled from defaults."
        ]
      }
    ],
    code: {
      label: "Damped controls baseline",
      language: "js",
      value:
        "const controls = new OrbitControls(camera, renderer.domElement);\ncontrols.enableDamping = true;\ncontrols.dampingFactor = 0.08;\ncontrols.minDistance = 2;\ncontrols.maxDistance = 12;\ncontrols.target.set(0, 0.8, 0);\n\nfunction animate() {\n  controls.update();\n  renderer.render(scene, camera);\n  requestAnimationFrame(animate);\n}"
    },
    sources: [
      { label: "Three.js OrbitControls docs", url: "https://threejs.org/docs/#examples/en/controls/OrbitControls" },
      { label: "Three.js PerspectiveCamera docs", url: "https://threejs.org/docs/#api/en/cameras/PerspectiveCamera" },
      { label: "Three.js Object3D docs", url: "https://threejs.org/docs/#api/en/core/Object3D" }
    ]
  },
  {
    slug: "three-js-raycaster-picking-checklist",
    title: "Three.js Raycaster picking checklist",
    description:
      "Debug click and hover picking in Three.js with normalized pointer coordinates, camera setup, object layers, and intersection order.",
    summary:
      "Raycasting works best when pointer coordinates, camera projection, and pickable objects are treated as one pipeline.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["Raycaster", "picking", "interaction"],
    takeaways: [
      "Convert pointer coordinates from the canvas bounds, not always from the window.",
      "Raycast against an explicit pickable list instead of the entire scene when possible.",
      "Use intersection distance and object metadata to decide what the user meant."
    ],
    sections: [
      {
        heading: "Most picking bugs start with coordinates",
        paragraphs: [
          "Raycaster expects normalized device coordinates where x and y are between -1 and 1. Many examples compute them from `window.innerWidth` and `window.innerHeight`, which works only when the canvas fills the window. If your canvas sits inside a layout, sidebar, or article card, use the canvas bounding rectangle.",
          "Pointer coordinates also need to be measured after CSS transforms and responsive resizing. If a click feels offset, log the canvas rectangle and the computed normalized values. The raycaster may be correct while your coordinate conversion is wrong."
        ]
      },
      {
        heading: "Pick against a deliberate list",
        paragraphs: [
          "Raycasting the whole scene is convenient for a demo but noisy for production. Grids, helpers, invisible bounds, particles, and background meshes may all receive intersections. Keep a `pickables` array and add only objects that should respond to the pointer.",
          "For imported GLB scenes, traverse the model and mark meshes that should be interactive with userData. That makes the decision visible in code. A product part selector, for example, can attach part ids or labels to pickable meshes while leaving decorative nodes alone."
        ]
      },
      {
        heading: "Sort intent after intersection",
        paragraphs: [
          "Raycaster returns intersections sorted by distance. The nearest hit is often what you want, but not always. A transparent cover, highlight shell, or helper mesh may sit in front of the actual object. Filter intersections by material visibility, object userData, or layers before choosing.",
          "Hover states should also be reversible. Store the last hovered object, clear its material state when the pointer leaves, and avoid creating new materials on every mousemove. Interaction bugs often become performance bugs when hover logic allocates objects repeatedly."
        ]
      },
      {
        heading: "Make mobile picking forgiving",
        paragraphs: [
          "Touch input is less precise than a cursor. Small meshes can be frustrating to select on mobile. Consider larger invisible hit targets, part-level grouping, or a list-based fallback when touch selection needs to be reliable. A viewer can still use raycasting internally while presenting simpler choices in the UI.",
          "If picking is the core of the tool, show the selected object name or id in a small status area. Clear feedback makes users trust that the scene is responding."
        ]
      }
    ],
    code: {
      label: "Canvas-relative raycast",
      language: "js",
      value:
        "const raycaster = new THREE.Raycaster();\nconst pointer = new THREE.Vector2();\nconst pickables = [];\n\ncanvas.addEventListener('pointerdown', (event) => {\n  const rect = canvas.getBoundingClientRect();\n  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;\n  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;\n\n  raycaster.setFromCamera(pointer, camera);\n  const [hit] = raycaster.intersectObjects(pickables, true)\n    .filter((item) => item.object.visible);\n\n  if (hit) selectPart(hit.object);\n});"
    },
    sources: [
      { label: "Three.js Raycaster docs", url: "https://threejs.org/docs/#api/en/core/Raycaster" },
      { label: "Three.js Vector2 docs", url: "https://threejs.org/docs/#api/en/math/Vector2" },
      { label: "MDN Pointer events", url: "https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events" }
    ]
  },
  {
    slug: "three-js-shadows-without-black-scenes",
    title: "Three.js shadows without black scenes",
    description:
      "Set up shadows in Three.js while avoiding black materials, missing shadow maps, clipped lights, and over-dark product previews.",
    summary:
      "Good shadows need renderer support, casting objects, receiving surfaces, enough light, and a camera range that fits the scene.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["shadows", "lighting", "materials"],
    takeaways: [
      "Enable renderer shadow maps and mark both casters and receivers.",
      "Tune directional light shadow camera bounds for the scene size.",
      "Keep ambient or hemisphere light so shadows do not crush the model."
    ],
    sections: [
      {
        heading: "Shadows are a chain of requirements",
        paragraphs: [
          "A Three.js scene does not cast shadows just because a light exists. The renderer must have shadow maps enabled. The object must cast shadow. The surface must receive shadow. The light must support shadows and have shadow casting enabled. If any link is missing, the scene may render normally but without shadows.",
          "This chain is why shadow bugs feel slippery. Check each link in order before changing material settings. A small diagnostic scene with one cube, one plane, and one directional light is the fastest way to prove the pipeline."
        ]
      },
      {
        heading: "The shadow camera can clip the result",
        paragraphs: [
          "Directional light shadows are rendered from the light's point of view using an internal shadow camera. If that camera does not cover the object and receiving plane, the shadow can disappear or look cropped. Helpers are useful here because the problem is invisible until you draw the shadow-camera bounds.",
          "Do not make the shadow camera enormous by default. Large bounds reduce shadow detail. Fit the bounds around the area that needs shadows, then raise map size only if the result still needs more resolution."
        ]
      },
      {
        heading: "Avoid over-dark lighting",
        paragraphs: [
          "A shadow should ground the object, not bury it. If the entire model becomes black, the scene likely lacks fill light or ambient contribution. Add a hemisphere light, environment lighting, or a weak fill so shaded areas retain detail. Product viewers usually need readable shadows more than physically dramatic shadows.",
          "Material choice also matters. MeshStandardMaterial expects light. A black scene with shadows enabled may be a lighting problem, not a shadow problem. Swap to MeshNormalMaterial temporarily if you need to prove the geometry is visible."
        ]
      },
      {
        heading: "Use contact shadows only when they help",
        paragraphs: [
          "Some scenes only need a soft grounding cue below an object. Full dynamic shadows may be too expensive or too fiddly. A blurred transparent plane, baked shadow texture, or authored contact shadow can be enough for static product renders.",
          "For a reusable WebGL tool, offer a simple shadow toggle and explain the cost. Users can choose between clean inspection mode and grounded preview mode instead of fighting one default."
        ]
      }
    ],
    code: {
      label: "Directional shadow baseline",
      language: "js",
      value:
        "renderer.shadowMap.enabled = true;\nrenderer.shadowMap.type = THREE.PCFSoftShadowMap;\n\nconst light = new THREE.DirectionalLight(0xffffff, 2.4);\nlight.position.set(4, 6, 3);\nlight.castShadow = true;\nlight.shadow.camera.left = -4;\nlight.shadow.camera.right = 4;\nlight.shadow.camera.top = 4;\nlight.shadow.camera.bottom = -4;\nscene.add(light);\n\nmodel.traverse((node) => {\n  if (node.isMesh) node.castShadow = true;\n});\nfloor.receiveShadow = true;"
    },
    sources: [
      { label: "Three.js shadows manual", url: "https://threejs.org/manual/#en/shadows" },
      { label: "Three.js DirectionalLight docs", url: "https://threejs.org/docs/#api/en/lights/DirectionalLight" },
      { label: "Three.js WebGLShadowMap docs", url: "https://threejs.org/docs/#api/en/renderers/webgl/WebGLShadowMap" }
    ]
  },
  {
    slug: "three-js-texture-loading-color-space",
    title: "Three.js texture loading and color space checklist",
    description:
      "Load color, normal, roughness, metalness, and ambient-occlusion textures with the right color-space assumptions.",
    summary:
      "Texture bugs become easier when color maps and data maps are handled differently from the start.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["textures", "color space", "materials"],
    takeaways: [
      "Color textures need sRGB color space; data textures generally do not.",
      "Set flipY deliberately when mixing manual textures with glTF conventions.",
      "Use LoadingManager when a scene depends on several texture assets."
    ],
    sections: [
      {
        heading: "Not every texture stores color",
        paragraphs: [
          "A base-color map stores visible color. A roughness map stores numbers that influence a lighting equation. A normal map stores directions. Treating all of these as ordinary color images can make PBR materials look wrong. The first checklist item is to identify what each image represents.",
          "Color textures should be decoded as sRGB for display-correct color. Non-color data maps should stay in linear data space. If a material looks too bright, too dull, or strangely metallic, texture color-space assumptions are a good early suspect."
        ]
      },
      {
        heading: "Manual textures and glTF textures differ",
        paragraphs: [
          "GLTFLoader handles many texture conventions for assets loaded from glTF. When you manually attach textures to a material, you are responsible for the same choices. That includes color space, wrapping, repeat, UV channel assumptions, and sometimes flipY.",
          "This is why a texture can look correct inside a GLB but wrong when you load it separately. The loader did work for the first case that your manual code did not repeat. A small material debug page should make those settings visible."
        ]
      },
      {
        heading: "Loading state is part of quality",
        paragraphs: [
          "Texture-heavy scenes need a loading state. Without one, users see flashing black materials, partial objects, or layout shifts. LoadingManager can coordinate a group of assets and update progress. Even if the percentage is approximate, a clear loading status makes the page feel built.",
          "For static content pages, avoid blocking the article text behind texture downloads. Let the written guide render first and hydrate the demo afterward. Users should still be able to read if a CDN image fails."
        ]
      },
      {
        heading: "Compress when the scene earns it",
        paragraphs: [
          "Large textures dominate load time quickly. Resize textures to the camera distance and use modern compression when the project justifies it. A tiny preview card does not need the same maps as a hero configurator with zoom controls.",
          "Keep a texture budget per scene. That budget is easier to enforce when guides, tools, and checklists mention it explicitly instead of treating image size as an afterthought."
        ]
      }
    ],
    code: {
      label: "Color and data texture setup",
      language: "js",
      value:
        "const loader = new THREE.TextureLoader();\nconst colorMap = await loader.loadAsync('/albedo.jpg');\ncolorMap.colorSpace = THREE.SRGBColorSpace;\n\nconst roughnessMap = await loader.loadAsync('/roughness.jpg');\nconst normalMap = await loader.loadAsync('/normal.jpg');\n\nconst material = new THREE.MeshStandardMaterial({\n  map: colorMap,\n  roughnessMap,\n  normalMap\n});"
    },
    sources: [
      { label: "Three.js Texture docs", url: "https://threejs.org/docs/#api/en/textures/Texture" },
      { label: "Three.js TextureLoader docs", url: "https://threejs.org/docs/#api/en/loaders/TextureLoader" },
      { label: "Three.js color management manual", url: "https://threejs.org/manual/#en/color-management" }
    ]
  },
  {
    slug: "three-js-draco-ktx2-compression",
    title: "Three.js DRACO and KTX2 compression overview",
    description:
      "Understand when to use DRACO geometry compression and KTX2 texture compression for faster Three.js asset delivery.",
    summary:
      "Geometry compression and texture compression solve different load problems, so choose them by bottleneck.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["DRACO", "KTX2", "assets"],
    takeaways: [
      "Use DRACO when geometry transfer size is the bottleneck.",
      "Use KTX2 or texture resizing when texture memory and download size dominate.",
      "Always test decode cost on real target devices."
    ],
    sections: [
      {
        heading: "Compression is not one switch",
        paragraphs: [
          "A heavy GLB can be heavy for different reasons. Sometimes the mesh has many vertices. Sometimes the textures are enormous. Sometimes animation data is the problem. DRACO and KTX2 address different parts of that asset. DRACO compresses geometry. KTX2 targets GPU-friendly texture delivery.",
          "Before adding loaders, inspect the asset. Look at file size, texture dimensions, triangle count, and load time. A compression tool should be chosen from evidence, not because a tutorial mentioned it."
        ]
      },
      {
        heading: "DRACO trades transfer for decode",
        paragraphs: [
          "DRACO can make geometry much smaller over the network, but the browser must decode it before the mesh appears. That decode cost is usually acceptable for large assets, but it can hurt on low-end mobile devices or when many models load at once. The win is strongest when network size is the main bottleneck.",
          "A good viewer should communicate that DRACO is not free. If the page recommends DRACO, also recommend testing load time and interaction readiness on the devices that matter."
        ]
      },
      {
        heading: "KTX2 is about textures and GPU memory",
        paragraphs: [
          "Texture compression is often the bigger win for product viewers. A model with modest geometry and several 4K maps can consume far more bandwidth and GPU memory than the mesh. KTX2 can package textures in formats that upload efficiently to the GPU, with runtime transcoding for platform support.",
          "The first step is still resizing. A texture that is twice as large as the visible detail requires may not need a fancy pipeline; it may need a smaller export. Use compression after the asset has a sensible size."
        ]
      },
      {
        heading: "Keep fallbacks boring",
        paragraphs: [
          "Compression pipelines add moving parts: encoders, decoder paths, CDN caching, and loader configuration. Keep a known-good uncompressed test asset around. When a compressed model fails, compare against the plain GLB so you know whether the issue is the asset, loader, or compression setup.",
          "For a public static site, compression guidance is valuable content because it helps readers decide when complexity is worth it. The best answer is often not 'always compress'; it is 'compress the bottleneck you have measured.'"
        ]
      }
    ],
    code: {
      label: "GLTFLoader with DRACO and KTX2 hooks",
      language: "js",
      value:
        "const draco = new DRACOLoader();\ndraco.setDecoderPath('/draco/');\n\nconst ktx2 = new KTX2Loader();\nktx2.setTranscoderPath('/basis/');\nktx2.detectSupport(renderer);\n\nconst loader = new GLTFLoader();\nloader.setDRACOLoader(draco);\nloader.setKTX2Loader(ktx2);\nloader.load('/model.glb', (gltf) => scene.add(gltf.scene));"
    },
    sources: [
      { label: "Three.js DRACOLoader docs", url: "https://threejs.org/docs/#examples/en/loaders/DRACOLoader" },
      { label: "Three.js KTX2Loader docs", url: "https://threejs.org/docs/#examples/en/loaders/KTX2Loader" },
      { label: "Khronos glTF overview", url: "https://www.khronos.org/gltf/" }
    ]
  },
  {
    slug: "three-js-html-labels-css2d",
    title: "Three.js HTML labels over 3D objects",
    description:
      "Choose between CSS2DRenderer, projected DOM labels, and canvas text when adding readable labels to Three.js scenes.",
    summary:
      "HTML labels are a UI layer problem as much as a 3D problem: position, depth, occlusion, and readability all matter.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["labels", "CSS2DRenderer", "UI"],
    takeaways: [
      "Use CSS2DRenderer when labels should be real DOM elements.",
      "Project object positions manually when you need tight integration with your own UI.",
      "Plan how labels hide, overlap, or respond when objects move behind the camera."
    ],
    sections: [
      {
        heading: "Labels are not just text",
        paragraphs: [
          "A label has to answer several questions. Which 3D point owns it? Does it stay visible behind objects? Can the user click it? Does it scale with distance? Does it need to be selectable text? The rendering technique depends on those answers.",
          "Three.js scenes often start with canvas-only thinking, but labels are usually better as HTML. Real DOM labels are easier to style, localize, and make accessible. They can also share the same design system as the rest of the page."
        ]
      },
      {
        heading: "CSS2DRenderer is the clean starter",
        paragraphs: [
          "CSS2DRenderer renders DOM elements positioned from 3D objects. It is useful for pins, names, simple callouts, and annotations that should remain readable. The WebGLRenderer draws the scene; CSS2DRenderer draws labels above it.",
          "The tradeoff is depth. CSS2D labels are DOM elements, so they do not automatically disappear behind meshes like real 3D geometry. You may need raycasting, distance checks, or manual visibility logic if occlusion matters."
        ]
      },
      {
        heading: "Manual projection gives control",
        paragraphs: [
          "For custom UIs, projecting a Vector3 into screen space can be enough. Take the object's world position, call `.project(camera)`, convert normalized coordinates into CSS pixels, and position an absolutely placed element. This is flexible and keeps the label system inside your app's own layout.",
          "Manual projection also makes it easier to clamp labels to the viewport, hide them behind panels, or attach them to a separate list. It is a little more code, but it gives product pages more control than a generic label layer."
        ]
      },
      {
        heading: "Avoid label clutter",
        paragraphs: [
          "Labels can ruin an otherwise clean 3D scene. Use progressive disclosure: show key labels by default, reveal details on hover or selection, and hide labels that overlap too aggressively. A dense product or data scene may need search and list controls rather than every label visible at once.",
          "For mobile, assume less space and less pointer precision. Tap targets should be larger than the visual label, and text should not sit directly over critical model detail."
        ]
      }
    ],
    code: {
      label: "Manual DOM label projection",
      language: "js",
      value:
        "function positionLabel(label, object, camera, container) {\n  const point = object.getWorldPosition(new THREE.Vector3());\n  point.project(camera);\n\n  const x = (point.x * 0.5 + 0.5) * container.clientWidth;\n  const y = (-point.y * 0.5 + 0.5) * container.clientHeight;\n\n  label.style.transform = `translate(${x}px, ${y}px)`;\n  label.hidden = point.z < -1 || point.z > 1;\n}"
    },
    sources: [
      { label: "Three.js CSS2DRenderer docs", url: "https://threejs.org/docs/#examples/en/renderers/CSS2DRenderer" },
      { label: "Three.js Vector3 docs", url: "https://threejs.org/docs/#api/en/math/Vector3" },
      { label: "MDN CSS transforms", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/transform" }
    ]
  },
  {
    slug: "three-js-loading-progress-loadingmanager",
    title: "Three.js loading progress with LoadingManager",
    description:
      "Use LoadingManager to coordinate model, texture, and file loading states without freezing the page behind a spinner.",
    summary:
      "Loading UI should explain what the scene is waiting for and keep the rest of the page usable.",
    updated: "2026-07-06",
    minutes: 7,
    tags: ["LoadingManager", "loading", "UX"],
    takeaways: [
      "Use LoadingManager callbacks to centralize asset progress.",
      "Keep article text and basic UI available while demos hydrate.",
      "Show failure states that tell users which asset failed."
    ],
    sections: [
      {
        heading: "Progress is part of the scene",
        paragraphs: [
          "Three.js pages often load models, textures, HDR environments, decoder scripts, and example code. If all of that happens silently, users may see a blank rectangle and assume the page is broken. A small loading status can turn uncertainty into patience.",
          "LoadingManager gives loaders shared callbacks for start, progress, load, and error. It does not make every percentage perfect, but it centralizes the message. That is enough for most static tool pages."
        ]
      },
      {
        heading: "Do not block the whole page",
        paragraphs: [
          "A guide page should remain readable even if a demo asset is slow. Render the article first, then hydrate the WebGL example. The loading indicator should sit in the demo area, not cover the entire document. This keeps the site useful on slow connections and friendlier to crawlers.",
          "For a full-screen tool, blocking the tool panel may be acceptable, but the message should still be specific. 'Loading model.glb' is more useful than a generic spinner. If an asset fails, say which one failed and what the user can try next."
        ]
      },
      {
        heading: "Progress numbers need humility",
        paragraphs: [
          "Some assets report total bytes; others do not. A percentage can jump, stall, or represent only the files that expose useful progress. Avoid pretending the number is more precise than it is. Pair the percentage with plain text such as 'Preparing textures' or 'Decoding model.'",
          "If you cannot provide accurate progress, use a staged status instead. The goal is confidence, not fake precision."
        ]
      },
      {
        heading: "Error states are content",
        paragraphs: [
          "A failed load should not leave a blank canvas. Show an inline message with the asset path, a short explanation, and a retry action if possible. For user-provided files, explain supported formats and likely causes such as missing external texture paths.",
          "These error states improve tools and strengthen the content page. They show that the site understands real user failure modes instead of only the perfect demo path."
        ]
      }
    ],
    code: {
      label: "Shared loading manager",
      language: "js",
      value:
        "const manager = new THREE.LoadingManager();\nmanager.onStart = (url) => setStatus(`Loading ${url}`);\nmanager.onProgress = (url, loaded, total) => {\n  const percent = total ? Math.round((loaded / total) * 100) : 0;\n  setStatus(total ? `Loading ${percent}%` : `Loading ${url}`);\n};\nmanager.onLoad = () => setStatus('Scene ready');\nmanager.onError = (url) => setStatus(`Could not load ${url}`);\n\nconst textureLoader = new THREE.TextureLoader(manager);\nconst gltfLoader = new GLTFLoader(manager);"
    },
    sources: [
      { label: "Three.js LoadingManager docs", url: "https://threejs.org/docs/#api/en/loaders/managers/LoadingManager" },
      { label: "Three.js TextureLoader docs", url: "https://threejs.org/docs/#api/en/loaders/TextureLoader" },
      { label: "Three.js GLTFLoader docs", url: "https://threejs.org/docs/#examples/en/loaders/GLTFLoader" }
    ]
  },
  {
    slug: "three-js-instancing-many-objects",
    title: "Three.js instancing for many repeated objects",
    description:
      "Use InstancedMesh when repeated geometry turns into too many draw calls for a browser-friendly Three.js scene.",
    summary:
      "Instancing keeps repeated objects cheap by drawing many transforms of the same geometry and material together.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["InstancedMesh", "performance", "draw calls"],
    takeaways: [
      "Use InstancedMesh for many copies that share geometry and material.",
      "Update instance matrices deliberately and mark them dirty.",
      "Reach for merged geometry or separate meshes when objects need unique materials or topology."
    ],
    sections: [
      {
        heading: "Draw calls are the real enemy",
        paragraphs: [
          "A scene with hundreds of identical bolts, trees, cubes, or particles can become slow even when each object is simple. The problem is often draw calls, not raw triangle count. Each separate mesh asks the renderer and GPU to do setup work. InstancedMesh reduces that overhead by drawing many transforms of the same geometry and material together.",
          "The constraint is sameness. Instances share geometry and material. You can vary transform and some per-instance attributes, but if every object needs a unique material setup, instancing may not be the right first tool."
        ]
      },
      {
        heading: "Use a matrix per object",
        paragraphs: [
          "Each instance has a transformation matrix. You can compose that matrix from position, rotation, and scale using a temporary Object3D, then copy it into the InstancedMesh with `setMatrixAt`. After updating matrices, set `instanceMatrix.needsUpdate = true`.",
          "This pattern is predictable and fast enough for setup. For per-frame animation of thousands of instances, you may need more careful batching or shader-based movement, but the basic matrix workflow is the best starting point."
        ]
      },
      {
        heading: "Picking instances needs extra handling",
        paragraphs: [
          "Raycaster can report an instanceId when hitting an InstancedMesh. That gives you a way to select or highlight a specific copy. The UI logic needs to map that instanceId back to your data: product part, point index, building floor, or whatever the instance represents.",
          "If selection is important, keep an array of metadata parallel to the instances. Instancing should not make the scene impossible to inspect."
        ]
      },
      {
        heading: "When instancing is overkill",
        paragraphs: [
          "A dozen repeated objects do not need instancing. The complexity only pays off when draw calls become noticeable. Measure `renderer.info.render.calls` before and after. If the scene is already fast and the code is becoming less clear, keep separate meshes.",
          "Performance work should make the site more reliable, not more mysterious. Use instancing for the repeated-object cases where it clearly reduces render overhead."
        ]
      }
    ],
    code: {
      label: "Instanced mesh setup",
      language: "js",
      value:
        "const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);\nconst material = new THREE.MeshStandardMaterial({ color: 0x65d8c2 });\nconst mesh = new THREE.InstancedMesh(geometry, material, 500);\nconst dummy = new THREE.Object3D();\n\nfor (let i = 0; i < 500; i += 1) {\n  dummy.position.set(Math.random() * 8 - 4, Math.random() * 4, Math.random() * 8 - 4);\n  dummy.rotation.set(Math.random(), Math.random(), Math.random());\n  dummy.updateMatrix();\n  mesh.setMatrixAt(i, dummy.matrix);\n}\nmesh.instanceMatrix.needsUpdate = true;\nscene.add(mesh);"
    },
    sources: [
      { label: "Three.js InstancedMesh docs", url: "https://threejs.org/docs/#api/en/objects/InstancedMesh" },
      { label: "Three.js manual: optimizing lots of objects", url: "https://threejs.org/manual/#en/optimize-lots-of-objects" },
      { label: "Three.js WebGLRenderer.info docs", url: "https://threejs.org/docs/#api/en/renderers/WebGLRenderer.info" }
    ]
  },
  {
    slug: "three-js-environment-maps-glb-viewer",
    title: "Three.js environment maps for GLB viewers",
    description:
      "Use environment maps to make metallic and glossy GLB materials look intentional in browser-based Three.js viewers.",
    summary:
      "Environment lighting often does more for PBR materials than another direct light.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["environment map", "PBR", "GLB viewer"],
    takeaways: [
      "Metallic materials need something useful to reflect.",
      "Separate scene background from scene environment when the design requires it.",
      "Keep an inspection preset that is neutral before adding dramatic HDR lighting."
    ],
    sections: [
      {
        heading: "PBR needs a world to reflect",
        paragraphs: [
          "A metallic GLB can look flat under ordinary lights because metal reflects the environment more than it shows diffuse color. If the environment is empty or unhelpful, the material response feels wrong. Environment maps provide the surrounding light and reflection information that PBR materials expect.",
          "This is why the same model can look good in an authoring tool and dull in a browser. The model did not necessarily change. The environment did."
        ]
      },
      {
        heading: "Background and environment are different choices",
        paragraphs: [
          "A scene can use an environment map for lighting and reflections without showing that image as the visible background. This matters for product pages where the brand background is a flat color, gradient, or HTML layout. The object can still receive useful reflection information while the page keeps its designed surface.",
          "For inspection tools, expose this distinction. A user may want a neutral environment for material reading and a dark interface background for contrast. Binding those choices together makes the tool less flexible."
        ]
      },
      {
        heading: "Start neutral",
        paragraphs: [
          "Dramatic HDR environments can make demos look impressive, but they also hide material problems. Start with a neutral studio-like environment for diagnosis. Once the material is understandable, offer more expressive presets for presentation.",
          "This mirrors a real workflow: inspect first, brand later. A lab site should help users separate asset correctness from final art direction."
        ]
      },
      {
        heading: "Mind file size",
        paragraphs: [
          "HDR and environment assets can become large. Use appropriate resolutions and formats for the task. A small model viewer does not need a giant environment map if the canvas is embedded in an article. Keep the load path proportional to the user benefit.",
          "Document the tradeoff in tool copy. People trust a tool more when it explains why a lighting preset is fast, neutral, or presentation-focused."
        ]
      }
    ],
    code: {
      label: "Environment map intent",
      language: "js",
      value:
        "const pmrem = new THREE.PMREMGenerator(renderer);\nconst texture = await new RGBELoader().loadAsync('/studio.hdr');\nconst environment = pmrem.fromEquirectangular(texture).texture;\n\nscene.environment = environment;\nscene.background = null; // keep the HTML/CSS background visible\n\ntexture.dispose();\npmrem.dispose();"
    },
    sources: [
      { label: "Three.js scene environment docs", url: "https://threejs.org/docs/#api/en/scenes/Scene.environment" },
      { label: "Three.js RGBELoader docs", url: "https://threejs.org/docs/#examples/en/loaders/RGBELoader" },
      { label: "Three.js MeshStandardMaterial docs", url: "https://threejs.org/docs/#api/en/materials/MeshStandardMaterial" }
    ]
  },
  {
    slug: "three-js-mobile-performance-checklist",
    title: "Three.js mobile performance checklist",
    description:
      "Make Three.js scenes survive mobile GPUs with pixel-ratio limits, simpler materials, asset budgets, and reduced-motion fallbacks.",
    summary:
      "Mobile WebGL quality comes from budgets: fewer pixels, fewer surprises, and graceful fallbacks.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["mobile", "performance", "checklist"],
    takeaways: [
      "Clamp pixel ratio before chasing more complicated optimizations.",
      "Use smaller assets and fewer postprocessing passes on mobile.",
      "Pause decorative scenes when offscreen or when reduced motion is requested."
    ],
    sections: [
      {
        heading: "Mobile cost starts with pixels",
        paragraphs: [
          "A phone can have a small CSS viewport and a very dense screen. Rendering at full device pixel ratio may create a drawing buffer far larger than expected. Clamp pixel ratio first. This one change often improves frame rate and battery use more than small code tweaks.",
          "The right clamp depends on the scene. A product inspection tool may tolerate a higher pixel ratio than an animated decorative background. Choose the value by purpose, not habit."
        ]
      },
      {
        heading: "Assets should match the camera",
        paragraphs: [
          "Mobile users rarely need huge textures or dense geometry for a small embedded preview. If the camera never gets close enough to see 4K detail, the file is wasting bandwidth and memory. Create mobile-friendly exports or choose adaptive asset paths when the site grows.",
          "A checklist page can help authors catch this before deployment: texture dimensions, triangle count, draw calls, and estimated memory should all be visible during review."
        ]
      },
      {
        heading: "Postprocessing is not free polish",
        paragraphs: [
          "Bloom, depth of field, ambient occlusion, and color grading can make a desktop demo look rich, but each pass costs work. On mobile, postprocessing should be deliberate. Start without it, measure the scene, then add only the passes that meaningfully improve the experience.",
          "For many WebGL content sites, a good lighting rig and careful material setup create more trust than a stack of effects."
        ]
      },
      {
        heading: "Respect the page lifecycle",
        paragraphs: [
          "A Three.js scene inside a long article should not render at full speed while hidden below the fold. Use IntersectionObserver to pause decorative loops when the canvas is offscreen. Respect `prefers-reduced-motion` by slowing or stopping nonessential animation.",
          "These choices do not make the site less impressive. They make it feel considerate, which matters for both users and review quality."
        ]
      }
    ],
    code: {
      label: "Mobile-friendly render loop guard",
      language: "js",
      value:
        "renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));\n\nlet visible = true;\nconst io = new IntersectionObserver(([entry]) => {\n  visible = entry.isIntersecting;\n});\nio.observe(canvas);\n\nfunction animate() {\n  if (visible) renderer.render(scene, camera);\n  requestAnimationFrame(animate);\n}"
    },
    sources: [
      { label: "Three.js responsive manual", url: "https://threejs.org/manual/#en/responsive" },
      { label: "MDN IntersectionObserver", url: "https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver" },
      { label: "MDN prefers-reduced-motion", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion" }
    ]
  },
  {
    slug: "three-js-canvas-screenshot-export",
    title: "Three.js canvas screenshot export for tools",
    description:
      "Design a reliable screenshot export button for Three.js tools with explicit render timing, filename handling, and transparent-background choices.",
    summary:
      "A screenshot feature should export the scene the user sees, not an old frame, empty buffer, or accidental UI state.",
    updated: "2026-07-06",
    minutes: 7,
    tags: ["screenshot", "tools", "canvas"],
    takeaways: [
      "Render a fresh frame before export.",
      "Use toBlob for file downloads instead of forcing large data URLs.",
      "Tell users whether labels and DOM overlays are included."
    ],
    sections: [
      {
        heading: "Export is a product feature",
        paragraphs: [
          "A screenshot button sounds small, but users rely on it for design reviews, bug reports, thumbnails, and documentation. If the export is blank or stale, the whole tool feels unreliable. Treat screenshot export as part of the product, not a console trick.",
          "The export should have a clear filename, a known background choice, and a predictable resolution. If the user changes the scene, render a fresh frame immediately before creating the blob."
        ]
      },
      {
        heading: "Prefer blobs for downloads",
        paragraphs: [
          "Data URLs are convenient for quick tests but can become large strings. `canvas.toBlob` gives you a Blob that can be downloaded through an object URL. It is a better fit for a real button and keeps memory usage easier to reason about.",
          "If the tool supports both transparent and solid backgrounds, apply that setting before render. A user should not have to guess why their exported PNG looks different from the preview."
        ]
      },
      {
        heading: "Canvas does not include the DOM",
        paragraphs: [
          "Labels, buttons, and HTML overlays outside the canvas will not appear in canvas export. If labels matter, render them inside WebGL, use a separate DOM capture pipeline, or tell users that the export is scene-only. Clear limitation text is better than a surprising file.",
          "For a Three.js lab, scene-only export is often exactly what users need: a clean asset preview they can drop into a document or design board."
        ]
      },
      {
        heading: "Make export state visible",
        paragraphs: [
          "A tiny status line that says 'PNG saved' or 'Export failed' makes the feature feel finished. Avoid browser alerts. Keep the status near the export button and use plain language. If export fails because the canvas is tainted by cross-origin assets, explain that the source image server must allow canvas use.",
          "The boring edge cases are the ones people remember. Handle them with dignity and the tool feels much more trustworthy."
        ]
      }
    ],
    code: {
      label: "Export button handler",
      language: "js",
      value:
        "async function downloadCanvasPng(canvas, renderer, scene, camera) {\n  renderer.render(scene, camera);\n  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));\n  if (!blob) throw new Error('Canvas export failed');\n\n  const url = URL.createObjectURL(blob);\n  const link = document.createElement('a');\n  link.href = url;\n  link.download = `threejs-export-${Date.now()}.png`;\n  link.click();\n  URL.revokeObjectURL(url);\n}"
    },
    sources: [
      { label: "MDN HTMLCanvasElement.toBlob", url: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob" },
      { label: "Three.js WebGLRenderer docs", url: "https://threejs.org/docs/#api/en/renderers/WebGLRenderer" },
      { label: "MDN CORS enabled images", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image" }
    ]
  },
  {
    slug: "three-js-mistakes-that-break-webgl-scenes",
    title: "27 Three.js mistakes that break WebGL scenes",
    description:
      "A practical mistake list for blank canvases, broken imports, blurry renders, heavy assets, wrong pivots, missing lights, and mobile failures.",
    summary:
      "Most broken Three.js pages fail in repeatable ways. This checklist turns those failures into a faster review path.",
    updated: "2026-07-06",
    minutes: 10,
    tags: ["gotchas", "debugging", "publishing"],
    takeaways: [
      "Most Three.js failures are chains, not isolated lines of code.",
      "A scene should be checked in asset, camera, render, interaction, and page layers.",
      "Publishing quality depends on mobile behavior, loading states, and fallback content as much as the canvas."
    ],
    sections: [
      {
        heading: "Mistakes 1-6: canvas and renderer assumptions",
        paragraphs: [
          "The first group happens before the model matters. The canvas has CSS size but no matching drawing buffer. The renderer never updates after resize. Pixel ratio is left uncapped on a phone. The scene renders once before assets arrive and never redraws. The render loop keeps running below the fold. The page assumes WebGL will always initialize.",
          "Fix these by treating the canvas as part of the page system. Read the container size, call `renderer.setSize(width, height, false)`, update camera aspect, clamp device pixel ratio, and show useful HTML content even if the canvas fails. A WebGL scene should enhance the page, not hold it hostage."
        ]
      },
      {
        heading: "Mistakes 7-12: model imports that look random",
        paragraphs: [
          "The second group shows up when GLB and GLTF files enter the scene. The model is loaded but offscreen. The object is too large or too tiny. The pivot sits far away from the visible mesh. The camera is guessed before bounds are known. Animation clips exist but are ignored. Object URLs from repeated uploads are never revoked.",
          "The cure is an import checklist. Compute a Box3, log the size, move or wrap the model around a predictable center, fit the camera after load, list animation clips, and clean up temporary URLs. Imported assets are not just art files. They are runtime data that deserves inspection."
        ]
      },
      {
        heading: "Mistakes 13-17: materials, color, and lighting",
        paragraphs: [
          "Many scenes break visually while the JavaScript is technically fine. MeshStandardMaterial is used without enough light. Metallic materials have nothing useful to reflect. Color textures and data textures share the wrong color-space assumptions. Tone mapping is copied from a demo without checking exposure. Shadows are enabled and then crush the object into a dark blob.",
          "Use a neutral lighting preset before dramatic art direction. Set renderer output color space deliberately. Treat base-color maps differently from roughness, normal, and metalness maps. Add environment lighting when PBR materials need reflections. Keep shadows optional until the model is already readable."
        ]
      },
      {
        heading: "Mistakes 18-22: interaction and UI drift",
        paragraphs: [
          "Interaction bugs make a scene feel cheap. OrbitControls damping is enabled but `controls.update()` is not called. Controls orbit around the origin instead of the model center. Raycaster coordinates are calculated from the window even though the canvas is inside a layout. Labels overlap the object or stay visible behind it. Click targets are too small for touch users.",
          "These are not decoration issues; they are trust issues. Update controls in the right loop, set the target after fitting, compute pointer coordinates from canvas bounds, filter pickable objects, and design labels as a UI layer with visibility rules. If the user cannot control or understand the scene, the rendering quality does not matter."
        ]
      },
      {
        heading: "Mistakes 23-27: publishing without a final pass",
        paragraphs: [
          "The final group appears when a demo becomes a public page. There is no loading state. Failed assets leave a blank rectangle. The scene has no source notes or related explanation. The article depends on canvas pixels that crawlers and reviewers cannot read. The page looks good on desktop but becomes unreadable or slow on mobile.",
          "Before publishing, run the WebGL scene health check. Confirm loading, fallback copy, console cleanliness, mobile sizing, reduced-motion behavior, and internal links. Then ask whether the page still teaches something if the demo is unavailable. The best Three.js content is not just a working scene; it is a working explanation."
        ]
      }
    ],
    code: {
      label: "A compact pre-publish review",
      language: "js",
      value:
        "const review = {\n  canvas: ['resize buffer', 'clamp pixel ratio', 'fallback copy'],\n  assets: ['measure bounds', 'fit camera', 'check texture size'],\n  render: ['lighting readable', 'color space explicit', 'shadows bounded'],\n  interaction: ['controls target set', 'raycast from canvas bounds'],\n  publish: ['loading state', 'mobile QA', 'related guide links']\n};\n\nconsole.table(review);"
    },
    sources: [
      { label: "Three.js manual", url: "https://threejs.org/manual/" },
      { label: "Three.js WebGLRenderer docs", url: "https://threejs.org/docs/#api/en/renderers/WebGLRenderer" },
      { label: "Three.js GLTFLoader docs", url: "https://threejs.org/docs/#examples/en/loaders/GLTFLoader" },
      { label: "MDN WebGL API", url: "https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API" }
    ]
  }
];
