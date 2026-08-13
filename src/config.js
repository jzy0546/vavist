const trimSlash = (value) => value.replace(/\/+$/, "");

const rawSiteUrl = process.env.SITE_URL || "https://vavist.com";
const customDomain = (process.env.CUSTOM_DOMAIN || "").trim();
const adsenseClient = (process.env.ADSENSE_CLIENT || "ca-pub-3178114530361936").trim();
const adsTxtAccount = (process.env.ADS_TXT_ACCOUNT || "").trim();
const adsenseMode = (process.env.ADSENSE_MODE || "off").trim().toLowerCase();
const gaMeasurementId = (process.env.GA_MEASUREMENT_ID || "G-48SYW15X9Z").trim();
const contactEmail = (process.env.CONTACT_EMAIL || "hello@vavist.com").trim();
const siteUrl = trimSlash(rawSiteUrl);

if (!["off", "content"].includes(adsenseMode)) {
  throw new Error(`ADSENSE_MODE must be "off" or "content", received "${adsenseMode}"`);
}

export const site = {
  name: "Three.js Lab",
  tagline: "Browser-native WebGL tools from Vavist.",
  description:
    "Three.js Lab is the Vavist entrance for focused WebGL builders: GLB inspection, camera framing, shader starters, lighting recipes, and practical Three.js guides.",
  url: siteUrl,
  labUrl: `${siteUrl}/tools`,
  customDomain,
  gaMeasurementId,
  adsenseClient,
  adsTxtAccount,
  adsenseMode,
  contactEmail,
  author: "Vavist",
  language: "en",
  locale: "en_US",
  themeColor: "#10100e"
};

export const pathFor = (route) => {
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  return `${site.url}${normalizedRoute === "/" ? "/" : normalizedRoute}`;
};
