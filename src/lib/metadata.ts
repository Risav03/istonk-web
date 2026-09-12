import type { Metadata } from "next";

import { site } from "./site";

export const defaultTitle = `${site.name} · ${site.tagline}`;

export const ogImage = {
  url: "/brand/og.png",
  width: 1200,
  height: 630,
  alt: defaultTitle,
} as const;

type PageMetaInput = {
  title?: string;
  description: string;
  path: string;
  index?: boolean;
};

export function pageMetadata({
  title,
  description,
  path,
  index = true,
}: PageMetaInput): Metadata {
  const ogTitle = title ? `${title} · ${site.name}` : defaultTitle;

  return {
    title: title ?? { absolute: defaultTitle },
    description,
    alternates: { canonical: path },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: ogTitle,
      description,
      url: path,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      creator: site.twitter,
      images: [ogImage.url],
    },
  };
}
