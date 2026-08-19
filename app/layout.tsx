import type { Metadata } from "next";
import { Scheherazade_New, Lexend_Deca } from "next/font/google";
import "./globals.css";

/**
 * Scheherazade New is purpose-built for HEAVILY VOCALISED Arabic — it
 * positions tashkeel without collision, which is this project's entire
 * requirement. Do not swap it for a prettier naskh without testing full
 * vocalisation first. See WEBSITE_DESIGN.md.
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
