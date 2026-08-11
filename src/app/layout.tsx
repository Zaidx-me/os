import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import MotionProvider from "@/components/MotionProvider";
import { site, skillGroups, socials } from "@/content";
import "../styles/globals.css";

/**
 * Self-hosted via next/font (downloaded at build time, served same-origin).
 * `variable` props declare --font-sans / --font-mono on <html>; the @theme
 * fallback stacks in globals.css resolve through these vars at runtime, so
 * `font-sans`/`font-mono` utilities and the body font-family hit the real
 * loaded faces. Design rule: terminal/waybar/launcher use font-mono, body
 * uses font-sans.
 */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const siteDescription =
  "The web desktop of Muhammad Zaid — mobile & full-stack developer, AI tinkerer, and Arch Linux ricer. Boot up, poke around, open a terminal.";

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: "ZaidOS - Muhammad Zaid",
  description: siteDescription,
  alternates: {
    canonical: site.siteUrl,
  },
  openGraph: {
    title: "ZaidOS - Muhammad Zaid",
    description: siteDescription,
    url: site.siteUrl,
    siteName: site.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZaidOS - Muhammad Zaid",
    description: siteDescription,
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.owner,
  alternateName: site.handle,
  url: site.siteUrl,
  sameAs: socials.map((social) => social.url),
  jobTitle: "Developer",
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "University of the Punjab",
  },
  knowsAbout: skillGroups.flatMap((group) =>
    group.skills.map((skill) => skill.name),
  ),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <MotionProvider>{children}</MotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
