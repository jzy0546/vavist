import { initAnalytics, initScrollDepth, sendAnalyticsEvent } from "./analytics.js";

const initMenu = () => {
  const button = document.querySelector("[data-menu-button]");
  const menu = document.querySelector("[data-menu]");
  if (!button || !menu) return;

  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    menu.toggleAttribute("data-open", !expanded);
  });
};

const initReveal = () => {
  const elements = document.querySelectorAll("[data-reveal]");
  if (!elements.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  elements.forEach((element) => element.classList.add("reveal"));
  if (reduced || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  elements.forEach((element) => observer.observe(element));
};

const initHeroScene = async () => {
  const canvas = document.querySelector("#lab-canvas");
  if (!canvas) return;

  const sceneRoot = canvas.closest("[data-scene]");
  const THREE = await import("https://unpkg.com/three@0.185.0/build/three.module.js");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 0, y: 0 };

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x10100e, 7, 18);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(4.2, 2.4, 6.8);

  scene.add(new THREE.HemisphereLight(0xf6efe2, 0x171612, 1.45));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 5, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x65d8c2, 1.6);
  rim.position.set(-5, 2, -4);
  scene.add(rim);

  const rig = new THREE.Group();
  rig.position.set(1.2, 0.2, 0);
  scene.add(rig);

  const knotMaterial = new THREE.MeshStandardMaterial({
    color: 0x65d8c2,
    roughness: 0.28,
    metalness: 0.42
  });
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.86, 0.24, 180, 22), knotMaterial);
  knot.position.y = 0.55;
  rig.add(knot);

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.62, 2),
    new THREE.MeshBasicMaterial({
      color: 0xf4efe4,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    })
  );
  shell.position.y = 0.55;
  rig.add(shell);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xf1ae63,
    transparent: true,
    opacity: 0.44
  });
  for (let index = 0; index < 3; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.95 + index * 0.36, 0.008, 8, 180), ringMaterial);
    ring.rotation.x = Math.PI / 2 + index * 0.14;
    ring.rotation.y = index * 0.2;
    ring.position.y = 0.12 + index * 0.05;
    rig.add(ring);
  }

  const grid = new THREE.GridHelper(10, 20, 0x65d8c2, 0x5a5246);
  grid.position.y = -0.95;
  grid.material.transparent = true;
  grid.material.opacity = 0.28;
  scene.add(grid);

  const particleCount = 220;
  const positions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 11;
    positions[index * 3 + 1] = Math.random() * 5.2 - 0.9;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0xf4efe4,
      size: 0.026,
      transparent: true,
      opacity: 0.48
    })
  );
  scene.add(particles);

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(bounds.width));
    const height = Math.max(1, Math.floor(bounds.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const updatePointer = (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  };

  resize();
  sceneRoot?.setAttribute("data-scene-ready", "true");
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", updatePointer, { passive: true });

  const observer = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  observer?.observe(canvas);
  let sceneVisible = true;
  const sceneObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => {
          sceneVisible = Boolean(entry?.isIntersecting);
        })
      : null;
  sceneObserver?.observe(canvas);

  const startTime = performance.now();
  const render = () => {
    const elapsed = (performance.now() - startTime) / 1000;
    if (sceneVisible && !reduced) {
      knot.rotation.x = elapsed * 0.32;
      knot.rotation.y = elapsed * 0.48;
      shell.rotation.y = elapsed * 0.18;
      particles.rotation.y = elapsed * 0.025;
      rig.rotation.y = pointer.x * 0.22 + elapsed * 0.05;
      rig.rotation.x = pointer.y * 0.08;
    }

    if (sceneVisible) {
      camera.lookAt(0.65, 0.28, 0);
      renderer.render(scene, camera);
    }
    window.requestAnimationFrame(render);
  };

  render();
};

const initHealthCheck = () => {
  const root = document.querySelector("[data-health-check]");
  if (!root) return;

  const items = Array.from(root.querySelectorAll("[data-health-item]"));
  const score = root.querySelector("[data-health-score]");
  const status = root.querySelector("[data-health-status]");
  const meter = root.querySelector("[data-health-meter]");
  const copyButton = root.querySelector("[data-health-copy]");
  const message = root.querySelector("[data-health-message]");
  const maxScore = items.reduce((sum, item) => sum + Number(item.dataset.points || 0), 0);
  const reportedScoreThresholds = new Set();
  let started = false;

  const resultText = (percent) => {
    if (percent >= 86) return "Strong publishing shape. Move to real-device QA and final content review.";
    if (percent >= 70) return "Good base. Fix the unchecked items before adding more visual polish.";
    if (percent >= 55) return "Workable, but there are enough gaps to cause review or mobile issues.";
    return "High risk. Stabilize assets, camera, rendering, loading, and mobile behavior before publishing.";
  };

  const calculate = () => {
    const current = items
      .filter((item) => item.checked)
      .reduce((sum, item) => sum + Number(item.dataset.points || 0), 0);
    const percent = Math.round((current / maxScore) * 100);
    if (score) score.textContent = String(percent);
    if (status) status.textContent = resultText(percent);
    if (meter) meter.style.width = `${percent}%`;
    return percent;
  };

  const reportScoreThresholds = (percent) => {
    [55, 70, 86].forEach((threshold) => {
      if (percent < threshold || reportedScoreThresholds.has(threshold)) return;
      reportedScoreThresholds.add(threshold);
      sendAnalyticsEvent("health_check_score", {
        health_score: percent,
        health_threshold: threshold
      });
    });
  };

  const handleItemChange = () => {
    if (!started) {
      started = true;
      sendAnalyticsEvent("health_check_started", {
        page_location: window.location.href
      });
    }
    reportScoreThresholds(calculate());
  };

  const copyRecommendations = async () => {
    const percent = calculate();
    const missing = items
      .filter((item) => !item.checked)
      .map((item) => `- ${item.dataset.label}`)
      .join("\n");
    const text = `WebGL scene health score: ${percent}/100\n\nNext fixes:\n${missing || "- No unchecked items. Move to real-device QA."}`;
    sendAnalyticsEvent("health_check_copy", {
      health_score: percent,
      unchecked_items: missing ? missing.split("\n").length : 0
    });

    try {
      await navigator.clipboard.writeText(text);
      if (message) message.textContent = "Recommendations copied.";
    } catch {
      if (message) message.textContent = text;
    }
  };

  items.forEach((item) => item.addEventListener("change", handleItemChange));
  copyButton?.addEventListener("click", copyRecommendations);
  calculate();
};

initMenu();
initReveal();
initAnalytics();
initScrollDepth();
initHealthCheck();
initHeroScene().catch(() => {
  document.querySelector("[data-scene]")?.setAttribute("data-scene-ready", "false");
});
