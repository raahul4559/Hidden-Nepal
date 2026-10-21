import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { DEFAULT_SOCIAL_IMAGE, siteConfig } from "@/lib/site";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    siteName: siteConfig.name,
    type: "website",
    locale: "en_GB",
    description: siteConfig.description,
    url: absoluteUrl("/"),
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
};

const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: siteConfig.name,
      url: absoluteUrl("/"),
      description: siteConfig.description,
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      url: absoluteUrl("/"),
      name: siteConfig.name,
      description: siteConfig.description,
      publisher: { "@id": absoluteUrl("/#organization") },
      inLanguage: "en",
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#0b1f33",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteStructuredData).replace(/</g, "\\u003c"),
          }}
        />
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-ivory px-4 py-2 font-semibold text-navy focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
