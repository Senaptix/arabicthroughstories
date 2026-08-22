import type { Metadata } from "next";
import { Scheherazade_New, Lexend_Deca } from "next/font/google";
import "./globals.css";

/**
 * Scheherazade New is purpose-built for HEAVILY VOCALISED Arabic — it
 * positions tashkeel without collision, which is this project's entire
 * requirement. Do not swap it for a prettier naskh without testing full
 * vocalisation first. See WEBSITE_DESIGN.md.
 *
 * THE BOOK USES A DIFFERENT FACE, DELIBERATELY. From 2026-08-22 the printed
 * edition sets its Arabic in Noto Naskh Arabic, chosen for legibility for
 * young readers. The site stays on Scheherazade New because both were tried
 * and it reads better on screen — the same typeface renders differently in a
 * print layout tool and in a browser, and the browser is what these readers
 * are looking at.
 *
 * So book and site do not match, and that is the tested outcome rather than
 * drift. Do not "fix" the inconsistency without repeating the comparison on
 * a real screen, at the sizes a child actually reads.
 *
 * next/font downloads and self-hosts at build time, so there is no runtime
 * request to Google and the swap window is short.
 */
const arabic = Scheherazade_New({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic-loaded",
  display: "swap",
});

const latin = Lexend_Deca({
  subsets: ["latin"],
  variable: "--font-latin-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  // Qasas, not Qisas: the title is قَصَص (the masdar, as in سورة القصص), and
  // the published Zam Zam edition romanises it "Qasas un Nabiyyeen" too.
  // "Qisas" would be قِصَص, the plural of قِصَّة — a common misreading. The
  // repo name and the `series` slug still say qisas; those are identifiers,
  // not reader-facing text.
  // Required for the OpenGraph image below. Facebook and WhatsApp fetch that
  // URL from their own servers, so a relative path is meaningless to them —
  // without this Next cannot make it absolute and the share card silently
  // renders with no picture.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://qasaskids.com",
  ),
  applicationName: "Qasas Kids",
  title: {
    default: "Qasas Kids — Arabic stories for children",
    template: "%s | Qasas Kids",
  },
  description:
    "Audio, vocabulary and word roots for a bilingual Arabic/English reading series for children.",
  icons: {
    icon: "/brand/qasas-kids-icon.png",
    apple: "/brand/qasas-kids-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Qasas Kids",
    title: "Qasas Kids — Arabic stories for children",
    description:
      "Audio, vocabulary and word roots for a bilingual Arabic/English reading series for children.",
    // Without an image a shared link renders as a bare URL. Most of this book
    // will be passed parent to parent in WhatsApp, so the share card IS the
    // first impression rather than a detail. 1200x630 is what the platforms
    // crop to.
    images: [
      {
        url: "/brand/qasas-kids-og.png",
        width: 1200,
        height: 630,
        alt: "Qasas Kids",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Qasas Kids — Arabic stories for children",
    description:
      "Audio, vocabulary and word roots for a bilingual Arabic/English reading series for children.",
    images: ["/brand/qasas-kids-og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${arabic.variable} ${latin.variable}`}>
      <body>{children}</body>
    </html>
  );
}
