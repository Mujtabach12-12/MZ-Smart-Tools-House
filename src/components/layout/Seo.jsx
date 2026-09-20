import { useEffect } from "react";

const SITE_NAME = "MZ Smart Tool House";
const BASE_URL = String(import.meta.env.VITE_SITE_URL || "https://mztoolshouse.com").replace(/\/+$/, "");
const DEFAULT_DESCRIPTION =
  "Free online tools for work, study and everyday productivity, including calculators, PDF tools, image tools and developer utilities.";
const DEFAULT_IMAGE = `${BASE_URL}/assets/mz-smart-office-hero.webp`;

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

function upsertLink(rel, href, type) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  if (type) el.type = type;
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

    document.title = fullTitle;
    upsertMeta({ name: "description", content: metaDescription });
    upsertMeta({ name: "robots", content: robots || "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" });
    upsertMeta({ name: "googlebot", content: robots || "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" });
    upsertMeta({ property: "og:locale", content: "en_US" });
    upsertMeta({ name: "theme-color", content: "#2563eb" });

    upsertMeta({ property: "og:title", content: fullTitle });
    upsertMeta({ property: "og:description", content: metaDescription });
    upsertMeta({ property: "og:site_name", content: SITE_NAME });
    upsertMeta({ property: "og:type", content: type });
    upsertMeta({ property: "og:url", content: canonicalUrl });
    upsertMeta({ property: "og:image", content: image });
    upsertMeta({ property: "og:image:alt", content: `${SITE_NAME} smart office productivity tools` });

    upsertMeta({ name: "twitter:card", content: "summary_large_image" });
    upsertMeta({ name: "twitter:title", content: fullTitle });
    upsertMeta({ name: "twitter:description", content: metaDescription });
    upsertMeta({ name: "twitter:image", content: image });

    upsertLink("canonical", canonicalUrl);

    const defaultSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${BASE_URL}/#organization`,
          name: SITE_NAME,
          url: BASE_URL,
          logo: `${BASE_URL}/icons/icon-512.png`,
        },
        {
          "@type": "WebSite",
          "@id": `${BASE_URL}/#website`,
          name: SITE_NAME,
          url: BASE_URL,
          description: DEFAULT_DESCRIPTION,
          publisher: { "@id": `${BASE_URL}/#organization` },
          potentialAction: {
            "@type": "SearchAction",
            target: `${BASE_URL}/tools?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
      ],
    };

    upsertJsonLd("page", schema || defaultSchema);

    return () => {
      removeJsonLd("page");
    };
  }, [title, description, path, image, type, schema]);

  return null;
}

export { BASE_URL, SITE_NAME };
