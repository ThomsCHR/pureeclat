import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: object;
}

const SITE_NAME = "Pure Éclat";
const SITE_URL = import.meta.env.VITE_SITE_URL || "https://www.pureeclat.fr";
const DEFAULT_DESCRIPTION =
  "Pure Éclat, institut de beauté expert à Paris, Lyon et Marseille. Soins visage, corps et regard sur-mesure par des esthéticiennes expertes.";
const DEFAULT_IMAGE = `${SITE_URL}/images/home.png`;

export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
  noindex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Institut de beauté expert`;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaImage = image || DEFAULT_IMAGE;
  const metaUrl = url || SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Canonical */}
      <link rel="canonical" href={metaUrl} />

      {/* JSON-LD structured data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
