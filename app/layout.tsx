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
  title: "Qisas — Arabic reading for children",
  description:
    "Audio, vocabulary and word families for a bilingual Arabic/English reading series for children.",
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
