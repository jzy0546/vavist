const trimSlash = (value) => value.replace(/\/+$/, "");

const rawSiteUrl = process.env.SITE_URL || "http://localhost:4173";
const customDomain = (process.env.CUSTOM_DOMAIN || "").trim();
const adsenseClient = (process.env.ADSENSE_CLIENT || "").trim();
const adsTxtAccount = (process.env.ADS_TXT_ACCOUNT || "").trim();
const gaMeasurementId = (process.env.GA_MEASUREMENT_ID || "").trim();
const contactEmail = (process.env.CONTACT_EMAIL || "hello@example.com").trim();

export const site = {
  name: "PromptMint",
  tagline: "Free AI prompt tools for sharper everyday work.",
  description:
    "Free browser-based AI prompt tools for writers, marketers, students, and creators. Generate prompts, estimate tokens, and clean AI text without sign-up.",
  url: trimSlash(rawSiteUrl),
  customDomain,
  gaMeasurementId,
  adsenseClient,
  adsTxtAccount,
  contactEmail,
  author: "PromptMint",
  language: "en",
  locale: "en_US",
  themeColor: "#1463ff"
};

export const pathFor = (route) => {
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  return `${site.url}${normalizedRoute === "/" ? "/" : normalizedRoute}`;
};
