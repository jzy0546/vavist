import { extraGuides } from "./extra-guides.js";

const baseGuides = [
  {
    slug: "three-js-gltf-loader-checklist",
    title: "Three.js GLTFLoader checklist for clean model imports",
    description:
      "A practical checklist for loading GLB and GLTF files in Three.js without scale surprises, black materials, missing textures, or broken animation clips.",
    summary:
      "Load models as assets you can inspect, measure, and normalize before they become part of a production scene.",
    updated: "2026-07-06",
    minutes: 7,
    tags: ["GLTFLoader", "assets", "workflow"],
    takeaways: [
      "Treat every imported model as unknown until you inspect bounds, units, animations, and material maps.",
      "Fit the camera after the model loads instead of guessing a distance in advance.",
      "Keep model processing client-side when you only need a preview or diagnostic viewer."
    ],
    sections: [
      {
        heading: "Start with the asset contract",
        paragraphs: [
          "GLB is usually the simplest delivery format for a browser viewer because geometry, materials, textures, and animations can live inside one binary file. That does not mean every GLB is ready for a scene. Files exported from Blender, Cinema 4D, Spline, or a CAD converter can arrive at wildly different scales, with pivots placed far from the visible mesh or with materials that only look correct under a specific environment.",
          "Before you design UI around a model, create a small loader bench. The bench should answer four questions: how large is the object, where is its center, how many meshes and vertices does it contain, and whether animation clips exist. These facts are more useful than a pretty preview because they tell you whether the file can survive responsive layouts, mobile GPUs, and product-page constraints."
        ]
      },
      {
        heading: "Normalize before styling",
        paragraphs: [
          "A common mistake is to add postprocessing, orbit controls, and lighting before the imported object is understood. Instead, load the asset, compute a Box3 around it, move the object so the box center is near the origin, then decide whether the model needs a uniform scale. If a preview stage handles this work consistently, every model starts from the same framing assumptions.",
          "The next layer is material diagnosis. If a model appears black, the first suspect is not the loader. Check whether the material depends on an environment map, whether color management is configured, and whether the lighting setup is strong enough for rough PBR surfaces. A single hemisphere light plus a key and rim light is often enough for inspection, while product renders may need image-based lighting."
        ]
      },
      {
        heading: "Handle animations deliberately",
        paragraphs: [
          "GLTFLoader returns animation clips separately from the scene graph. A viewer should not assume the first clip should play forever; it should list clip names and durations, then allow a user or page author to choose. This is especially important for character files where idle, walk, and gesture clips may all be bundled into one export.",
          "Use AnimationMixer only after the model is in the scene and the clips have been inspected. Keep a small update loop that advances the mixer by delta time, not by a fixed number. That keeps animation speed stable across machines. When a model is removed, stop mixer actions and revoke object URLs so local preview tools do not leak memory during repeated uploads."
        ]
      },
      {
        heading: "A viewer checklist that catches most issues",
        paragraphs: [
          "The useful viewer is a diagnostic surface, not a gallery. Show filename, file size, scene children, mesh count, material count, bounding-box size, center, animation clips, and whether the camera was fitted automatically. Add a reset button that returns the model to normalized position and camera framing. These details turn a vague export problem into something a designer or developer can fix quickly.",
          "For AdSense and search, the same checklist also creates meaningful page content: explain the problem, show what to inspect, and link to focused tools. A thin page that only says 'drop a GLB here' is less useful than a page that teaches what the preview is measuring and why the measurements matter."
        ]
      }
    ],
    code: {
      label: "Minimal import flow",
      language: "js",
      value:
        "const loader = new GLTFLoader();\nloader.load(url, (gltf) => {\n  const model = gltf.scene;\n  const box = new THREE.Box3().setFromObject(model);\n  const center = box.getCenter(new THREE.Vector3());\n  const size = box.getSize(new THREE.Vector3());\n\n  model.position.sub(center);\n  scene.add(model);\n  fitCameraToBox(camera, controls, size);\n\n  console.table({\n    width: size.x.toFixed(2),\n    height: size.y.toFixed(2),\n    depth: size.z.toFixed(2),\n    clips: gltf.animations.length\n  });\n});"
    },
    sources: [
      { label: "Three.js GLTFLoader docs", url: "https://threejs.org/docs/#examples/en/loaders/GLTFLoader" },
      { label: "Three.js manual: loading GLTF", url: "https://threejs.org/manual/#en/load-gltf" },
      { label: "glTF overview", url: "https://www.khronos.org/gltf/" }
    ]
  },
  {
    slug: "fit-camera-to-object-three-js",
    title: "Fit a Three.js camera to an object without guessing",
    description:
      "Use bounding boxes, object centers, aspect ratio, and PerspectiveCamera field-of-view math to frame imported models reliably.",
    summary:
      "A camera-fit routine is the difference between a reusable viewer and a scene that only works for one model.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["camera", "PerspectiveCamera", "Box3"],
    takeaways: [
      "Compute object bounds after transforms are applied, then frame the largest dimension.",
      "Use camera aspect ratio to avoid cropping wide or tall objects.",
      "Update OrbitControls target to the object center so interaction feels anchored."
    ],
    sections: [
      {
        heading: "Why manual camera numbers fail",
        paragraphs: [
          "A camera position like `[3, 2, 5]` is not a strategy; it is a coincidence that worked for one mesh. Imported models can be a few centimeters tall, hundreds of units wide, or offset far from the origin. If the viewer keeps a fixed camera distance, some assets will fill the screen while others vanish into the grid.",
          "The reliable approach is geometric. After the object is loaded, compute a bounding box from the visible scene graph. The box gives you size and center. The center becomes the camera target. The size drives distance. The field of view tells you how much vertical space the camera can see from a given distance."
        ]
      },
      {
        heading: "Use the largest dimension as the promise",
        paragraphs: [
          "For simple viewers, start with the largest of width, height, and depth. This creates a conservative fit that works for cubes, tall bottles, chairs, characters, and flat panels. If your content is always product photography, you may choose height as the primary dimension. If your content is architectural, width and depth may matter more than height.",
          "The vertical distance calculation starts with the camera's field of view. A larger FOV sees more at the same distance; a smaller FOV needs to move farther back. The horizontal fit also depends on aspect ratio. On a narrow phone screen, the same camera may crop a wide object unless you calculate both vertical and horizontal fit and choose the larger distance."
        ]
      },
      {
        heading: "Move the controls target too",
        paragraphs: [
          "If the camera moves but OrbitControls keeps targeting the old origin, dragging the mouse will feel wrong. The model appears to swing away from the viewport because the orbit center is not the object center. Always copy the bounding-box center to the controls target after the camera is fitted.",
          "Also update near and far planes after fitting. A near plane that is too large can slice the front of a model; a far plane that is too small can clip the back or shadow helpers. Derive them from the computed distance so tiny and huge models both remain visible."
        ]
      },
      {
        heading: "When to override the automatic fit",
        paragraphs: [
          "Automatic fit is a baseline, not a composition engine. Product pages often need a little headroom, character viewers may need the face weighted higher than the feet, and floor-based scenes may need to keep the object grounded. Keep an offset parameter and expose it as a slider in tools. That gives authors a predictable way to make the fit more generous or tighter.",
          "The best result is a two-step flow: first fit the camera from math, then let the user make a small artistic adjustment. This keeps the tool useful without pretending there is one perfect camera for every asset."
        ]
      }
    ],
    code: {
      label: "Perspective fit helper",
      language: "js",
      value:
        "function fitCameraToObject(camera, object, controls, offset = 1.35) {\n  const box = new THREE.Box3().setFromObject(object);\n  const size = box.getSize(new THREE.Vector3());\n  const center = box.getCenter(new THREE.Vector3());\n  const maxSize = Math.max(size.x, size.y, size.z, 0.01);\n  const fitHeightDistance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));\n  const fitWidthDistance = fitHeightDistance / camera.aspect;\n  const distance = offset * Math.max(fitHeightDistance, fitWidthDistance);\n\n  const direction = camera.position.clone().sub(controls.target).normalize();\n  camera.position.copy(center).add(direction.multiplyScalar(distance));\n  camera.near = distance / 100;\n  camera.far = distance * 100;\n  camera.updateProjectionMatrix();\n  controls.target.copy(center);\n  controls.update();\n}"
    },
    sources: [
      { label: "Three.js PerspectiveCamera docs", url: "https://threejs.org/docs/#api/en/cameras/PerspectiveCamera" },
      { label: "Three.js Box3 docs", url: "https://threejs.org/docs/#api/en/math/Box3" },
      { label: "Three.js OrbitControls docs", url: "https://threejs.org/docs/#examples/en/controls/OrbitControls" }
    ]
  },
  {
    slug: "three-js-shader-material-starter",
    title: "A practical ShaderMaterial starter for Three.js",
    description:
      "Build a small, readable ShaderMaterial setup with uniforms, time animation, UV coordinates, and safe debugging habits.",
    summary:
      "Start shaders from a predictable scaffold so the first visible result is easy to inspect and easy to change.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["ShaderMaterial", "GLSL", "materials"],
    takeaways: [
      "Keep the first shader visibly simple: UV color, a time wave, and one color uniform.",
      "Name uniforms like an API because the JavaScript side will depend on them.",
      "Debug with known colors before adding noise, lighting, or texture sampling."
    ],
    sections: [
      {
        heading: "The point of a starter shader",
        paragraphs: [
          "ShaderMaterial is powerful because you control the vertex and fragment programs directly. That power also makes it easy to lose an hour to a black screen. A starter shader should prove that the geometry renders, uniforms update, UVs exist, and animation time is flowing. Only after those facts are visible should you add texture sampling, procedural patterns, or lighting math.",
          "The best starter is not visually impressive. It is intentionally obvious. Use UV coordinates to create a gradient, mix in a color uniform, and animate a narrow band with uTime. If the band moves, JavaScript is updating the uniform. If the gradient appears, varyings are flowing from vertex to fragment. That gives you a stable base for more ambitious work."
        ]
      },
      {
        heading: "Treat uniforms as a contract",
        paragraphs: [
          "A uniform is the small API between JavaScript and GLSL. Name it clearly and update it in one place. `uTime`, `uColor`, `uScale`, and `uResolution` are easier to reason about than a dozen anonymous values. When a shader becomes part of a tool, this contract lets sliders and presets change the shader without rewriting GLSL.",
          "Avoid starting with too many uniforms. Three or four are enough for a reusable starter. Add values when the visual problem requires them. A shader page that teaches the contract is often more valuable than one that dumps a giant code block with no explanation."
        ]
      },
      {
        heading: "Know what Three.js gives you",
        paragraphs: [
          "ShaderMaterial still runs inside the Three.js rendering pipeline. Built-in attributes such as position, normal, and uv are available when the geometry provides them. Projection and model-view matrices are also available. That means a beginner can start from a normal mesh and material swap rather than writing raw WebGL setup code.",
          "The edge case is geometry without UV coordinates. A box, plane, or sphere from Three.js has usable UVs. Some imported models may not. If your shader depends on UVs, show a fallback color or document that the material expects UVs. This kind of plain warning saves future debugging."
        ]
      },
      {
        heading: "Debug in layers",
        paragraphs: [
          "When the output is black, remove complexity. First set the fragment color to solid red. Then display `vUv.x` and `vUv.y` as colors. Then add the uniform color. Then add time. This layered method is boring, but it quickly tells you whether the problem is geometry, varyings, uniforms, or the final formula.",
          "For a public guide, include the debugging sequence, not just the final shader. People do not search for ShaderMaterial because everything is already working; they search because the material is invisible, static, or different from an example."
        ]
      }
    ],
    code: {
      label: "Visible animated shader",
      language: "js",
      value:
        "const material = new THREE.ShaderMaterial({\n  uniforms: {\n    uTime: { value: 0 },\n    uColor: { value: new THREE.Color('#65d8c2') }\n  },\n  vertexShader: `\n    varying vec2 vUv;\n    void main() {\n      vUv = uv;\n      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n    }\n  `,\n  fragmentShader: `\n    uniform float uTime;\n    uniform vec3 uColor;\n    varying vec2 vUv;\n    void main() {\n      float band = 0.5 + 0.5 * sin((vUv.x + uTime * 0.2) * 12.0);\n      vec3 color = mix(vec3(vUv, 0.35), uColor, band);\n      gl_FragColor = vec4(color, 1.0);\n    }\n  `\n});"
    },
    sources: [
      { label: "Three.js ShaderMaterial docs", url: "https://threejs.org/docs/#api/en/materials/ShaderMaterial" },
      { label: "Three.js manual: shaders", url: "https://threejs.org/manual/#en/shadertoy" },
      { label: "The Book of Shaders", url: "https://thebookofshaders.com/" }
    ]
  },
  {
    slug: "three-js-lighting-product-viewer",
    title: "Three.js lighting setup for readable product viewers",
    description:
      "Use hemisphere, key, fill, rim, and environment lighting to make GLB product previews legible across devices.",
    summary:
      "A product viewer needs lights that explain the shape, not lights that show off the renderer.",
    updated: "2026-07-06",
    minutes: 7,
    tags: ["lighting", "PBR", "viewer"],
    takeaways: [
      "Start with a stable inspection rig before chasing dramatic lighting.",
      "Use a rim light to separate dark materials from dark backgrounds.",
      "For PBR assets, environment lighting often matters more than adding another point light."
    ],
    sections: [
      {
        heading: "Inspection lighting is different from cinematic lighting",
        paragraphs: [
          "A product viewer has a practical job: make the model understandable. The user needs to see silhouette, material roughness, edges, and scale. Heavy contrast may look beautiful in a hero render, but it can hide the exact details a viewer is supposed to inspect. Begin with a neutral lighting rig and add drama only after the object is readable.",
          "A useful default rig has three layers. Hemisphere light creates a gentle base so shadowed areas are not pure black. A directional key light gives the object a main highlight and shape. A rim or back light separates the object from the background. This setup is simple, fast, and easy to explain in UI."
        ]
      },
      {
        heading: "PBR materials need an environment",
        paragraphs: [
          "Many GLB files use MeshStandardMaterial or MeshPhysicalMaterial. These materials are designed for physically based rendering, which means roughness, metalness, and environment reflections affect the final look. If a metallic object looks dead, adding a bright point light may not solve the problem. It may need an environment map or at least a balanced studio setup.",
          "For a lightweight static tool, start with direct lights and document the limitation. For a production configurator, add an HDR environment and expose intensity controls. The important design choice is to separate inspection mode from brand mode. Inspection mode should reveal the asset; brand mode can be more stylized."
        ]
      },
      {
        heading: "Keep the background honest",
        paragraphs: [
          "Dark UIs are popular for 3D tools, but dark models on dark backgrounds need help. A subtle grid, a floor, or a rim light can keep the object from disappearing. The background should not compete with the model, but it should provide enough contrast to judge scale and orientation.",
          "On mobile, highlights can compress quickly because the canvas is small and device brightness varies. Test the same lighting rig on a narrow viewport. If the object becomes a dark blob, the rig needs a stronger fill light or a background that is less close to the material color."
        ]
      },
      {
        heading: "Expose presets, not every light property",
        paragraphs: [
          "A public tool does not need every possible light slider. It needs a few reliable presets: neutral studio, product glossy, clay inspection, and dark hero. Each preset can be a small set of intensities and positions. That is easier for users to compare and easier for search visitors to understand.",
          "When a preset includes code, keep it short and copyable. The goal is not to replace learning; it is to give a working baseline that can be pasted into a Vite or vanilla Three.js scene."
        ]
      }
    ],
    code: {
      label: "Readable studio rig",
      language: "js",
      value:
        "scene.add(new THREE.HemisphereLight(0xf4efe4, 0x202020, 1.4));\n\nconst key = new THREE.DirectionalLight(0xffffff, 2.2);\nkey.position.set(4, 5, 3);\nscene.add(key);\n\nconst fill = new THREE.DirectionalLight(0x88b7ff, 0.7);\nfill.position.set(-3, 2, 4);\nscene.add(fill);\n\nconst rim = new THREE.DirectionalLight(0x65d8c2, 1.2);\nrim.position.set(-4, 3, -4);\nscene.add(rim);"
    },
    sources: [
      { label: "Three.js lights docs", url: "https://threejs.org/docs/#api/en/lights/Light" },
      { label: "Three.js manual: lights", url: "https://threejs.org/manual/#en/lights" },
      { label: "Three.js MeshStandardMaterial docs", url: "https://threejs.org/docs/#api/en/materials/MeshStandardMaterial" }
    ]
  },
  {
    slug: "three-js-particles-buffergeometry",
    title: "Build Three.js particles with BufferGeometry",
    description:
      "Create a point cloud that is light enough for hero scenes, data backgrounds, and interactive WebGL experiments.",
    summary:
      "Particles are most useful when the geometry is simple, the count is intentional, and the animation avoids layout work.",
    updated: "2026-07-06",
    minutes: 7,
    tags: ["particles", "BufferGeometry", "Points"],
    takeaways: [
      "Use BufferGeometry attributes instead of hundreds of Mesh objects.",
      "Animate the Points object or shader uniforms before updating every particle on the CPU.",
      "Choose particle counts by device budget, not by how impressive a desktop demo looks."
    ],
    sections: [
      {
        heading: "Why particles should start as points",
        paragraphs: [
          "A particle field does not need thousands of individual meshes. If every dot is a Mesh with its own geometry, material, and transform, the browser has far more work to do than the visual effect deserves. Three.js Points with BufferGeometry stores positions in typed arrays and renders them as one object, which is the right starting point for stars, data clouds, dust, and calm hero backgrounds.",
          "This approach also keeps the code readable. One Float32Array holds x, y, and z values. One PointsMaterial controls size, color, transparency, and attenuation. The scene graph stays simple, which makes it easier to combine particles with a model, grid, or UI overlay."
        ]
      },
      {
        heading: "Make the particle count a design choice",
        paragraphs: [
          "A landing page may only need 200 to 800 particles. A full-screen art piece may use more, but the number should be tested on mobile hardware. Small particles disappear under compression and dark overlays, while too many bright points create visual noise behind text. The count is not a bragging metric; it is part of the composition.",
          "Start with a low count and increase it only when the scene feels empty. If the particle layer sits behind text, keep opacity modest and avoid high-contrast colors near the headline. The 3D effect should support the page, not make the copy harder to read."
        ]
      },
      {
        heading: "Animate cheaply first",
        paragraphs: [
          "The cheapest animation is rotating the Points object or moving a shader uniform. Updating every position in a CPU loop can be fine for small counts, but it becomes expensive when repeated every frame. A slow rotation, subtle y drift, or time-based shader pulse often creates enough life for a hero section.",
          "If each particle needs unique behavior, add custom attributes such as speed or phase and use a ShaderMaterial. That keeps animation on the GPU and avoids rebuilding buffers every frame. For an educational starter, however, begin with object rotation so the performance model is obvious."
        ]
      },
      {
        heading: "Keep text and particles separated",
        paragraphs: [
          "Particles are easy to overuse because they look alive immediately. For a useful website, they should have a job: suggest depth, guide attention, or give the canvas a sense of scale. Place the densest particle area away from primary text. Add a gradient overlay if the particles are behind copy.",
          "Accessibility matters too. Respect reduced-motion preferences and slow or stop particle movement when users request it. A static particle field can still provide texture without becoming a distraction."
        ]
      }
    ],
    code: {
      label: "Simple point cloud",
      language: "js",
      value:
        "const count = 500;\nconst positions = new Float32Array(count * 3);\nfor (let i = 0; i < count; i += 1) {\n  positions[i * 3] = (Math.random() - 0.5) * 10;\n  positions[i * 3 + 1] = (Math.random() - 0.5) * 6;\n  positions[i * 3 + 2] = (Math.random() - 0.5) * 8;\n}\n\nconst geometry = new THREE.BufferGeometry();\ngeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));\n\nconst material = new THREE.PointsMaterial({\n  color: 0xf4efe4,\n  size: 0.035,\n  transparent: true,\n  opacity: 0.55\n});\n\nconst points = new THREE.Points(geometry, material);\nscene.add(points);"
    },
    sources: [
      { label: "Three.js BufferGeometry docs", url: "https://threejs.org/docs/#api/en/core/BufferGeometry" },
      { label: "Three.js Points docs", url: "https://threejs.org/docs/#api/en/objects/Points" },
      { label: "Three.js PointsMaterial docs", url: "https://threejs.org/docs/#api/en/materials/PointsMaterial" }
    ]
  },
  {
    slug: "three-js-responsive-canvas",
    title: "Make a Three.js canvas responsive without blurry rendering",
    description:
      "Resize the renderer, camera aspect, and drawing buffer correctly so a Three.js scene stays sharp on desktop and mobile.",
    summary:
      "Responsive WebGL is mostly about matching CSS size, drawing-buffer size, pixel ratio, and camera projection.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["responsive", "renderer", "mobile"],
    takeaways: [
      "Read the canvas container size and call renderer.setSize with updateStyle set to false.",
      "Clamp device pixel ratio so high-density screens do not destroy performance.",
      "Update camera.aspect and projection matrix whenever the render size changes."
    ],
    sections: [
      {
        heading: "CSS size is not render size",
        paragraphs: [
          "A canvas has two sizes. CSS decides how large it appears on the page. The drawing buffer decides how many pixels WebGL renders. If these values drift apart, the scene can look blurry, stretched, or expensive. A good resize function reads the displayed size, updates the renderer drawing buffer, and then updates the camera projection.",
          "Avoid setting canvas width and height in CSS alone and hoping Three.js will infer the rest. The renderer must know the real buffer size. At the same time, avoid letting `setSize` rewrite your CSS every frame. Pass `false` as the third argument so layout remains controlled by CSS."
        ]
      },
      {
        heading: "Clamp pixel ratio",
        paragraphs: [
          "High-DPI screens can request two or three times as many pixels as the CSS size suggests. That can make a small phone canvas surprisingly expensive. Clamp renderer pixel ratio with `Math.min(window.devicePixelRatio, 2)` or even a lower value for heavy scenes. The difference is often invisible to users but very visible to battery and frame rate.",
          "For static product viewers, sharpness matters. For animated shader backgrounds, smoothness may matter more. Make the pixel ratio choice per scene instead of copying one value across every project."
        ]
      },
      {
        heading: "Resize when the container changes",
        paragraphs: [
          "Window resize is a start, but modern layouts can change canvas size without a full window resize. Sidebars open, tabs change, browser UI collapses, and CSS grid tracks shift. ResizeObserver is a better fit for tool panels and responsive hero scenes because it watches the actual container.",
          "The render loop can call a cheap resize check before drawing, but do not trigger expensive work if width and height did not change. Compare the current renderer size to the target size, then update only when needed."
        ]
      },
      {
        heading: "Test the awkward sizes",
        paragraphs: [
          "Responsive scenes often fail between common breakpoints. Test a narrow phone, a tablet width, and a very wide desktop. Check whether text overlays still have contrast, whether the object remains framed, and whether UI controls overlap the canvas. A technically responsive canvas can still produce a poor composition.",
          "For AdSense-friendly pages, this testing also matters because layout quality affects perceived trust. A guide page with a broken hero canvas on mobile feels unfinished even if the article text is strong."
        ]
      }
    ],
    code: {
      label: "Resize helper",
      language: "js",
      value:
        "function resizeRenderer(renderer, camera, container) {\n  const width = Math.max(1, container.clientWidth);\n  const height = Math.max(1, container.clientHeight);\n  const current = renderer.getSize(new THREE.Vector2());\n  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));\n\n  if (current.x !== width || current.y !== height) {\n    renderer.setSize(width, height, false);\n    camera.aspect = width / height;\n    camera.updateProjectionMatrix();\n  }\n}"
    },
    sources: [
      { label: "Three.js WebGLRenderer docs", url: "https://threejs.org/docs/#api/en/renderers/WebGLRenderer" },
      { label: "Three.js manual: responsive design", url: "https://threejs.org/manual/#en/responsive" },
      { label: "MDN ResizeObserver", url: "https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver" }
    ]
  },
  {
    slug: "three-js-rotation-pivot-center",
    title: "Fix Three.js rotation around the wrong pivot",
    description:
      "Understand object origins, parent groups, geometry centering, and pivot rigs when a mesh rotates around the wrong point.",
    summary:
      "Most rotation bugs are not animation bugs. They are origin, geometry, or parent-space problems.",
    updated: "2026-07-06",
    minutes: 7,
    tags: ["rotation", "pivot", "transforms"],
    takeaways: [
      "A mesh rotates around its local origin, not around the visible center of its geometry.",
      "Use a parent Group when you need a deliberate orbit pivot.",
      "Center geometry only when changing the asset data is acceptable."
    ],
    sections: [
      {
        heading: "Rotation follows local origin",
        paragraphs: [
          "When a Three.js mesh rotates strangely, the animation loop is rarely the cause. A mesh rotates around its local origin. If the geometry was authored away from that origin, the visible object will swing in an arc instead of spinning in place. Imported assets make this common because modeling tools allow pivots, origins, and visible geometry to be arranged independently.",
          "The first diagnostic step is to show axes or compute a bounding box. If the box center is far from the object's local position, you have a pivot problem. The fix depends on whether you want to change the geometry, change the scene graph, or preserve the original asset structure."
        ]
      },
      {
        heading: "Choose the right fix",
        paragraphs: [
          "If the mesh should spin around its own visual center and you control the geometry, `geometry.center()` can move vertices so they surround the local origin. This is simple for generated geometry and one-off assets, but it mutates geometry data. It may not be appropriate for skinned meshes, shared geometry, or imported hierarchies where original transforms matter.",
          "If the object should orbit around another point, create a parent Group at the pivot and place the mesh offset inside it. Rotate the group, not the mesh. This pattern is clear, reversible, and useful for planets, product turntables, UI handles, and mechanical parts."
        ]
      },
      {
        heading: "Imported models need care",
        paragraphs: [
          "A GLB scene may contain multiple meshes, bones, cameras, and nested transforms. Centering every geometry can break the author's hierarchy. For imported models, it is often safer to wrap the whole `gltf.scene` in a parent group, compute its Box3 center, and offset the scene inside the wrapper. The wrapper becomes the normalized object that your viewer rotates.",
          "This wrapper strategy preserves the asset while giving your UI a predictable pivot. It also pairs nicely with camera fitting because the same bounding-box center can inform both the wrapper offset and the OrbitControls target."
        ]
      },
      {
        heading: "Make the pivot visible while debugging",
        paragraphs: [
          "A tiny AxesHelper placed at the intended pivot can save a lot of guessing. Add it only in debug mode. If the object rotates around the helper, your pivot is correct. If it sweeps around the helper, the child offset or geometry center still needs attention.",
          "Once the fix is working, remove helper visuals or hide them behind a debug toggle. Production viewers should feel clean, but development tools should make invisible coordinate-space problems visible."
        ]
      }
    ],
    code: {
      label: "Wrapper pivot pattern",
      language: "js",
      value:
        "const wrapper = new THREE.Group();\nconst box = new THREE.Box3().setFromObject(model);\nconst center = box.getCenter(new THREE.Vector3());\n\nmodel.position.sub(center);\nwrapper.add(model);\nscene.add(wrapper);\n\nfunction animate() {\n  wrapper.rotation.y += 0.01;\n  renderer.render(scene, camera);\n  requestAnimationFrame(animate);\n}"
    },
    sources: [
      { label: "Three.js Object3D docs", url: "https://threejs.org/docs/#api/en/core/Object3D" },
      { label: "Three.js Group docs", url: "https://threejs.org/docs/#api/en/objects/Group" },
      { label: "Three.js Box3 docs", url: "https://threejs.org/docs/#api/en/math/Box3" }
    ]
  },
  {
    slug: "three-js-performance-budget",
    title: "A practical Three.js performance budget for small sites",
    description:
      "Set clear limits for draw calls, texture size, pixel ratio, animation loops, and postprocessing before a WebGL page becomes slow.",
    summary:
      "Performance gets easier when each scene has a budget before it has polish.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["performance", "mobile", "budget"],
    takeaways: [
      "Measure draw calls, triangles, texture sizes, and frame time early.",
      "Clamp pixel ratio and avoid postprocessing until the base scene is stable.",
      "Pause or reduce animation for offscreen scenes and reduced-motion users."
    ],
    sections: [
      {
        heading: "Start with a budget, not a profiler panic",
        paragraphs: [
          "WebGL performance problems often appear late because the scene starts simple and becomes expensive one feature at a time. A small site should have a budget before the visual polish begins. Decide how many objects, draw calls, lights, texture sizes, and postprocessing passes are acceptable for the page's purpose.",
          "A hero scene, a product viewer, and a full-screen tool deserve different budgets. A hero scene shares attention with text, navigation, and scrolling. A tool can justify more GPU work because interaction is the main experience. Write this down so every new effect has to earn its cost."
        ]
      },
      {
        heading: "Watch draw calls and materials",
        paragraphs: [
          "Many small meshes with unique materials can cost more than one larger mesh with shared material. Imported models may contain dozens of nodes from the authoring tool. Inspect `renderer.info.render.calls`, mesh count, and material count. These numbers explain why a scene feels heavy even when the triangle count looks reasonable.",
          "When possible, merge static geometry, reuse materials, and remove hidden authoring leftovers. If a viewer is intended for arbitrary uploaded models, expose these metrics rather than silently accepting every asset as production-ready."
        ]
      },
      {
        heading: "Texture size is a content problem",
        paragraphs: [
          "Huge textures are easy to miss because the model still loads. A 4096 pixel texture may be fine for a close-up product render but excessive for a small card preview. Compression and resizing often deliver more improvement than rewriting code. If the page targets mobile users, texture memory matters as much as JavaScript size.",
          "Use the smallest texture that survives the intended camera distance. For many web previews, 1024 or 2048 pixel maps are enough. Save 4K maps for scenes where the user can zoom close enough to benefit."
        ]
      },
      {
        heading: "Stop rendering when nothing changes",
        paragraphs: [
          "The simplest render loop redraws every frame forever. That is fine for animated scenes, but wasteful for static viewers. If the object is still, render on controls change, resize, or UI updates. If the scene is below the fold, pause animation with IntersectionObserver. If reduced motion is enabled, remove nonessential loops.",
          "Performance is part of trust. A site that makes a laptop fan spin for a decorative hero scene feels careless. Keep the WebGL work proportional to the user's benefit."
        ]
      }
    ],
    code: {
      label: "Basic render metrics",
      language: "js",
      value:
        "function logRenderInfo(renderer) {\n  const { render, memory } = renderer.info;\n  console.table({\n    calls: render.calls,\n    triangles: render.triangles,\n    geometries: memory.geometries,\n    textures: memory.textures\n  });\n}\n\nsetInterval(() => logRenderInfo(renderer), 2000);"
    },
    sources: [
      { label: "Three.js WebGLRenderer.info docs", url: "https://threejs.org/docs/#api/en/renderers/WebGLRenderer.info" },
      { label: "Three.js manual: optimizing lots of objects", url: "https://threejs.org/manual/#en/optimize-lots-of-objects" },
      { label: "MDN requestAnimationFrame", url: "https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame" }
    ]
  },
  {
    slug: "three-js-color-management-pbr",
    title: "Three.js color management for PBR materials",
    description:
      "Understand output color space, texture color space, tone mapping, and why imported GLB materials can look different from authoring tools.",
    summary:
      "Color problems often come from mismatched assumptions between textures, renderer output, lighting, and tone mapping.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["color", "PBR", "materials"],
    takeaways: [
      "Set renderer output color space deliberately for modern Three.js projects.",
      "Use sRGB color space for color textures and linear data for non-color maps.",
      "Tone mapping changes the final look, so compare presets under the same lighting."
    ],
    sections: [
      {
        heading: "The symptom is usually vague",
        paragraphs: [
          "Color bugs rarely announce themselves clearly. A model looks washed out, too dark, too saturated, or different from Blender. The cause may be texture color space, renderer output, tone mapping, exposure, lighting, or an environment map. Because these factors stack, changing random values can make the scene worse.",
          "Start by separating color maps from data maps. Base-color textures represent visible color and should be treated differently from roughness, metalness, normal, and ambient-occlusion maps. If those assumptions are wrong, the material response will be wrong even when the model loads successfully."
        ]
      },
      {
        heading: "Renderer output is the end of the pipeline",
        paragraphs: [
          "The renderer's output color space controls how final colors are encoded for the display. In current Three.js projects, this setting should be explicit. A codebase that copied an old tutorial may use outdated properties or no color-management setup at all, which can make examples disagree with modern docs.",
          "Tone mapping is a separate choice. ACESFilmicToneMapping often gives pleasing highlights, but it is not neutral. For inspection tools, compare tone mapping modes and exposure under the same light rig. A material can appear incorrect simply because the tone curve compresses highlights differently."
        ]
      },
      {
        heading: "Imported assets carry assumptions",
        paragraphs: [
          "GLB files can include textures and material parameters, but the surrounding scene still matters. A metallic material without useful reflections may look flat. A rough material under weak lights may look muddy. A color texture authored for one lighting environment may feel different under another.",
          "A viewer should make these variables visible. Show the active tone mapping, exposure, environment setting, and light preset. When users can change one variable at a time, they can tell whether the problem is the asset or the scene."
        ]
      },
      {
        heading: "Use reference swatches",
        paragraphs: [
          "A simple color checker or neutral gray sphere can make color debugging less subjective. Place it next to the imported model in debug mode. If the reference object looks wrong, the scene pipeline is likely wrong. If the reference looks right and the model does not, inspect the asset's textures and material settings.",
          "This habit is useful for public educational content too. Showing the difference between color maps and data maps turns a confusing rendering topic into a concrete checklist."
        ]
      }
    ],
    code: {
      label: "Renderer color baseline",
      language: "js",
      value:
        "const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });\nrenderer.outputColorSpace = THREE.SRGBColorSpace;\nrenderer.toneMapping = THREE.ACESFilmicToneMapping;\nrenderer.toneMappingExposure = 1.0;\n\nconst texture = await new THREE.TextureLoader().loadAsync('/base-color.jpg');\ntexture.colorSpace = THREE.SRGBColorSpace;\n\nconst material = new THREE.MeshStandardMaterial({ map: texture });"
    },
    sources: [
      { label: "Three.js color management manual", url: "https://threejs.org/manual/#en/color-management" },
      { label: "Three.js WebGLRenderer docs", url: "https://threejs.org/docs/#api/en/renderers/WebGLRenderer" },
      { label: "Three.js Texture docs", url: "https://threejs.org/docs/#api/en/textures/Texture" }
    ]
  },
  {
    slug: "three-js-scene-debugging-checklist",
    title: "Three.js scene debugging checklist when nothing appears",
    description:
      "A systematic checklist for blank canvases, invisible meshes, clipped cameras, missing lights, and silent WebGL mistakes.",
    summary:
      "A blank canvas is easier to fix when you test renderer, camera, geometry, material, lights, and animation in order.",
    updated: "2026-07-06",
    minutes: 7,
    tags: ["debugging", "blank canvas", "workflow"],
    takeaways: [
      "Prove the renderer works with a known cube before debugging imported assets.",
      "Check camera position, near/far planes, object scale, and material visibility in order.",
      "Use helpers and console metrics temporarily, then remove them from production."
    ],
    sections: [
      {
        heading: "Do not debug everything at once",
        paragraphs: [
          "A blank canvas can come from a missing canvas size, an offscreen camera, a clipped object, a black material, a failed import, or a render loop that never runs. If you change all of those at once, you may hide the actual cause. Debug in layers and keep each test boring.",
          "First prove the renderer can draw a basic cube with a MeshNormalMaterial. This material does not need lights, so it removes lighting from the question. If the cube appears, the renderer, camera, and loop are basically alive. If it does not, look at canvas sizing, WebGL context errors, and camera placement."
        ]
      },
      {
        heading: "Check the camera next",
        paragraphs: [
          "A camera can look in the wrong direction, sit inside the object, or clip the object with near and far planes. Add a CameraHelper when using shadow cameras or complex rigs. For a PerspectiveCamera, start with a visible position, call `lookAt(0, 0, 0)`, and render a known object at the origin.",
          "When loading unknown models, compute a bounding box and log its size. If the box is enormous or tiny, the camera may be fine and the scale may be the problem. If the box center is far from the origin, the object may be outside the camera's view."
        ]
      },
      {
        heading: "Separate material and light issues",
        paragraphs: [
          "MeshStandardMaterial needs light. MeshBasicMaterial does not. MeshNormalMaterial provides an even stronger diagnostic because it colors surfaces by normal direction. Swap materials temporarily. If the object appears with a diagnostic material but disappears with its original material, inspect textures, color management, alpha settings, side settings, and lights.",
          "For imported models, traverse the scene and count meshes. Log material names and visibility. It is possible for a loader to succeed while the visible content is hidden inside a nested hierarchy or assigned a fully transparent material."
        ]
      },
      {
        heading: "Use helpers without shipping them",
        paragraphs: [
          "GridHelper, AxesHelper, BoxHelper, and light helpers are excellent during development. They reveal scale, orientation, and positions that are otherwise invisible. Add them through a debug flag so they can be toggled without editing the scene.",
          "Before publishing, remove or hide debug helpers. A production page should feel intentional, but a development workflow should be full of instruments. The balance is simple: make problems visible while building, then keep only the helpful visual structure for users."
        ]
      }
    ],
    code: {
      label: "Known-good diagnostic cube",
      language: "js",
      value:
        "scene.add(new THREE.GridHelper(10, 10));\nscene.add(new THREE.AxesHelper(2));\n\nconst cube = new THREE.Mesh(\n  new THREE.BoxGeometry(1, 1, 1),\n  new THREE.MeshNormalMaterial()\n);\nscene.add(cube);\n\ncamera.position.set(3, 2, 4);\ncamera.lookAt(0, 0, 0);\nrenderer.render(scene, camera);"
    },
    sources: [
      { label: "Three.js MeshNormalMaterial docs", url: "https://threejs.org/docs/#api/en/materials/MeshNormalMaterial" },
      { label: "Three.js helpers docs", url: "https://threejs.org/docs/#api/en/helpers/AxesHelper" },
      { label: "Three.js manual: debugging JavaScript", url: "https://threejs.org/manual/#en/debugging-javascript" }
    ]
  },
  {
    slug: "three-js-static-site-seo",
    title: "How to structure a static Three.js site for useful search pages",
    description:
      "Plan static pages, demos, internal links, and explainers so a Three.js tool site is useful to readers and easier for search engines to understand.",
    summary:
      "A WebGL site should not rely on canvas alone. Each page needs readable text that explains the problem the demo solves.",
    updated: "2026-07-06",
    minutes: 8,
    tags: ["static site", "SEO", "content"],
    takeaways: [
      "Pair every canvas demo with a clear written explanation, code notes, and related links.",
      "Use static HTML for titles, descriptions, headings, and article text.",
      "Keep tool pages narrow so search visitors land on a page that matches one real task."
    ],
    sections: [
      {
        heading: "Canvas is not enough content",
        paragraphs: [
          "A Three.js demo can be useful and still look thin to a crawler or reviewer. Canvas pixels do not explain the topic, the code, the constraints, or the reason a visitor should trust the page. A static site should surround each demo with written context: the problem, the workflow, the code pattern, the pitfalls, and where to go next.",
          "This is not just search-engine theater. Readers need the same structure. Someone who lands on a GLB viewer page wants to know what stays local, what the viewer measures, and what to do when a model looks wrong. The page should answer those questions without requiring the user to inspect source code."
        ]
      },
      {
        heading: "Narrow pages beat broad pages",
        paragraphs: [
          "A page called 'Three.js tutorial' is too broad for most small sites. A page called 'fit camera to object in Three.js' has a clear promise. The visitor knows what problem it solves, the examples can stay focused, and related pages can cover adjacent issues such as GLTFLoader, bounding boxes, or OrbitControls.",
          "Narrow pages also make internal linking natural. A GLTFLoader guide can link to camera fitting, lighting presets, and color management because those are the next real problems after a model loads. This helps visitors and gives the site a coherent structure."
        ]
      },
      {
        heading: "Keep the render path static",
        paragraphs: [
          "Static generation works well for Three.js content. Titles, descriptions, JSON-LD, headings, article sections, code snippets, and source links can be generated as HTML. The canvas can hydrate afterward. This gives fast first paint, readable content without JavaScript, and a simpler deployment path.",
          "A static site can still feel alive. Use JavaScript for the demo, not for the article body. If the demo fails, the page remains useful. That resilience matters for users, crawlers, and ad-review flows."
        ]
      },
      {
        heading: "Add enough original substance",
        paragraphs: [
          "A thin tool directory with legal pages is rarely enough for a serious content review. Add original explanations, screenshots or live demos where useful, code snippets, source references, and a clear author or project identity. The goal is not to hit a magic word count; it is to make the site feel like it was built by someone who understands the problems.",
          "For a Three.js lab, a strong starting set is ten focused guides, five tools, an examples gallery, and clear legal/contact pages. From there, analytics can show which topics deserve deeper follow-up articles."
        ]
      }
    ],
    code: {
      label: "Static page ingredients",
      language: "html",
      value:
        "<article>\n  <h1>Fit a Three.js camera to an object</h1>\n  <p>Explain the problem before the canvas demo.</p>\n  <canvas id=\"demo\"></canvas>\n  <h2>How the math works</h2>\n  <pre><code>fitCameraToObject(camera, model, controls)</code></pre>\n  <h2>Related guides</h2>\n  <a href=\"/guides/three-js-gltf-loader-checklist/\">GLTFLoader checklist</a>\n</article>"
    },
    sources: [
      { label: "Google Search Central: helpful content", url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content" },
      { label: "AdSense site readiness guidance", url: "https://support.google.com/adsense/answer/7299563" },
      { label: "Three.js manual", url: "https://threejs.org/manual/" }
    ]
  }
];

export const guides = [...baseGuides, ...extraGuides];

export const getGuide = (slug) => guides.find((guide) => guide.slug === slug);
