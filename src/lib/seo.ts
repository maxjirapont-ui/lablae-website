import type { Metadata } from "next";

export const SITE_URL = "https://www.lablae.net";
export const SITE_NAME = "ร้านลำลำลับแลบ้าน 100 ปี";
export const SHARE_IMAGE = "/images/menu/khantoke_big.jpg";

export function pageMetadata(
  title: string,
  description: string,
  path: string,
  image = SHARE_IMAGE,
  imageAlt = "ชุดขันโตก ร้านลำลำลับแลบ้าน 100 ปี",
): Metadata {
  const url = new URL(path, SITE_URL).href;
  const shareTitle = path === "/" ? title : `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "th_TH",
      siteName: SITE_NAME,
      title: shareTitle,
      description,
      url,
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [image],
    },
  };
}

// JSON-LD can contain editable restaurant data; keep it inside the script tag.
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
