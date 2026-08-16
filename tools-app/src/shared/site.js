const defaultMeasurementId = "G-48SYW15X9Z";
let analyticsInitialized = false;
let analyticsScriptRequested = false;

export function sendToolAnalyticsEvent(eventName, parameters = {}) {
  if (!eventName || window.__vavistAnalyticsDisabled || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", eventName, {
    tool_name: currentToolName(),
    page_location: window.location.href,
    ...parameters,
    transport_type: "beacon"
  });
}

export function initSite() {
  initToolAnalytics();
  const path = normalizePath(window.location.pathname);
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const href = normalizePath(link.getAttribute("href") || "/");
    if (href === path) {
      link.setAttribute("aria-current", "page");
    }
  });

  const menuButton = document.querySelector("[data-menu-button]");
  const menu = document.querySelector("[data-menu]");
  if (menuButton && menu) {
    menuButton.addEventListener("click", () => {
      const expanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!expanded));
      menu.toggleAttribute("data-open", !expanded);
    });
  }

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.querySelector(button.getAttribute("data-copy-target"));
      if (!target) return;
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(target.textContent.trim());
        button.textContent = "Copied";
        sendToolAnalyticsEvent("copy_code", {
          code_target: target.id || "unknown"
        });
      } catch {
        button.textContent = "Copy failed";
        sendToolAnalyticsEvent("tool_error", {
          error_category: "clipboard"
        });
      } finally {
        setTimeout(() => {
          button.textContent = original;
        }, 1200);
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;
    let destination;
    try {
      destination = new URL(link.href, window.location.href);
    } catch {
      return;
    }
    if (destination.origin !== window.location.origin) return;
    if (destination.pathname.startsWith("/guides/")) {
      sendToolAnalyticsEvent("open_guide", {
        link_url: destination.href
      });
    } else if (
      destination.pathname.startsWith("/tools/") &&
      normalizePath(destination.pathname) !== normalizePath(window.location.pathname)
    ) {
      sendToolAnalyticsEvent("open_tool_navigation", {
        link_url: destination.href
      });
    }
  });

  initReveal();
}

function initToolAnalytics() {
  if (analyticsInitialized) return;
  analyticsInitialized = true;

  const params = new URLSearchParams(window.location.search);
  try {
    if (params.get("analytics") === "off") {
      sessionStorage.setItem("vavist_analytics_off", "1");
    }
  } catch {}

  let optedOut = false;
  try {
    optedOut = sessionStorage.getItem("vavist_analytics_off") === "1";
  } catch {}
  window.__vavistAnalyticsDisabled = optedOut;
  if (optedOut) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || defaultMeasurementId;
  window.gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500
  });
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    transport_type: "beacon"
  });

  const localHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const requestScript = () => {
    if (analyticsScriptRequested || localHost) return;
    analyticsScriptRequested = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.append(script);
  };

  const events = ["pointerdown", "keydown", "scroll", "touchstart"];
  const start = () => {
    events.forEach((event) => window.removeEventListener(event, start));
    requestScript();
  };
  events.forEach((event) => window.addEventListener(event, start, { once: true, passive: true }));
  window.setTimeout(requestScript, 1800);
}

function currentToolName() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments[0] === "tools" && segments[1] ? segments[1].replaceAll("-", "_") : "tools";
}

function normalizePath(value) {
  if (!value) return "/";
  if (value !== "/" && value.endsWith("/")) return value.slice(0, -1);
  return value;
}

function initReveal() {
  const elements = document.querySelectorAll("[data-reveal]");
  if (!elements.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  elements.forEach((element) => element.classList.add("reveal"));
  if (reduce || !("IntersectionObserver" in window)) {
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
}
