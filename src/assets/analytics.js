export const sendAnalyticsEvent = (eventName, parameters = {}) => {
  if (!eventName || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, {
    ...parameters,
    transport_type: "beacon"
  });
};

export const initAnalytics = () => {
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest("[data-analytics-event]");
    if (!target) return;

    const eventName = target.dataset.analyticsEvent || "";
    const label = target.dataset.analyticsLabel || target.textContent?.trim().slice(0, 120) || "unlabeled";
    const destination =
      target.dataset.analyticsDestination ||
      (target instanceof HTMLAnchorElement ? target.href : window.location.href);

    sendAnalyticsEvent(eventName, {
      event_label: label,
      link_url: destination,
      page_location: window.location.href
    });
  });
};

export const initScrollDepth = () => {
  const thresholds = [25, 50, 75, 90];
  const reported = new Set();

  const reportDepth = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const current = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
    thresholds.forEach((threshold) => {
      if (current < threshold || reported.has(threshold)) return;
      reported.add(threshold);
      sendAnalyticsEvent("scroll_depth", {
        percent_scrolled: threshold,
        page_location: window.location.href
      });
    });

    if (reported.size === thresholds.length) {
      window.removeEventListener("scroll", reportDepth);
    }
  };

  window.addEventListener("scroll", reportDepth, { passive: true });
  reportDepth();
};
