import { useEffect } from "react";

const SITE_NAME = "MZ Smart Tool House";
const BASE_URL = String(import.meta.env.VITE_SITE_URL || "https://mztoolshouse.com").replace(/\/+$/, "");
const DEFAULT_DESCRIPTION =
  "Free online tools for work, study and everyday productivity, including calculators, PDF tools, image tools and developer utilities.";
const DEFAULT_IMAGE = `${BASE_URL}/assets/mz-og-1200x630.webp`;
const DEFAULT_ROBOTS = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

function upsertMeta({ name, property, content }) {
  if (!content) return;
  const attr = property ? "property" : "name";
  const key = property || name;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href, attributes = {}) {
  const selector = Object.entries(attributes).reduce(
    (value, [key, val]) => `${value}[${key}="${val}"]`,
    `link[rel="${rel}"]`,
  );
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(id, data) {
  let el = document.head.querySelector(`script[data-seo-schema="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.dataset.seoSchema = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id) {
  document.head.querySelector(`script[data-seo-schema="${id}"]`)?.remove();
}

export default function Seo({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  schema,
  robots,
}) {
  useEffect(() => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const canonicalUrl = `${BASE_URL}${cleanPath === "/" ? "/" : cleanPath}`;
    const fullTitle = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} — Smart tools for work, study & productivity`;
    const metaDescription = description || DEFAULT_DESCRIPTION;
    const robotsValue = robots || DEFAULT_ROBOTS;

    document.title = fullTitle;
    document.documentElement.lang = "en";

    upsertMeta({ name: "description", content: metaDescription });
    upsertMeta({ name: "robots", content: robotsValue });
    upsertMeta({ name: "googlebot", content: robotsValue });
    upsertMeta({ name: "author", content: "Muhammad Mujtaba" });
    upsertMeta({ name: "application-name", content: SITE_NAME });
    upsertMeta({ name: "referrer", content: "strict-origin-when-cross-origin" });
    upsertMeta({ property: "og:locale", content: "en_US" });
    upsertMeta({ name: "theme-color", content: "#2563eb" });

    upsertMeta({ property: "og:title", content: fullTitle });
    upsertMeta({ property: "og:description", content: metaDescription });
    upsertMeta({ property: "og:site_name", content: SITE_NAME });
    upsertMeta({ property: "og:type", content: type });
    upsertMeta({ property: "og:url", content: canonicalUrl });
    upsertMeta({ property: "og:image", content: image });
    upsertMeta({ property: "og:image:alt", content: `${SITE_NAME} smart office productivity tools` });
    upsertMeta({ property: "og:image:width", content: "1200" });
    upsertMeta({ property: "og:image:height", content: "630" });

    upsertMeta({ name: "twitter:card", content: "summary_large_image" });
    upsertMeta({ name: "twitter:title", content: fullTitle });
    upsertMeta({ name: "twitter:description", content: metaDescription });
    upsertMeta({ name: "twitter:image", content: image });
    upsertMeta({ name: "twitter:image:alt", content: `${SITE_NAME} smart office productivity tools` });

    upsertLink("canonical", canonicalUrl);

    document.head.querySelector('script[data-prerender-schema="page"]')?.remove();

    const pageSchema = schema || {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: fullTitle,
      description: metaDescription,
      inLanguage: "en",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      primaryImageOfPage: { "@type": "ImageObject", url: image },
    };

    upsertJsonLd("page", pageSchema);

    return () => {
      removeJsonLd("page");
    };
  }, [title, description, path, image, type, schema, robots]);

  return null;
}

export { BASE_URL, SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_IMAGE };
