import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, Inter } from "next/font/google";
// @ts-ignore
import "../styles.css";
import { Providers } from "./providers";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans-fallback",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading-fallback",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NxtPool — Verified student ride sharing",
  description: "NxtPool connects verified university students traveling the same way at similar times. Share rides, split cost, travel with classmates you can trust.",
  authors: [{ name: "NxtPool" }],
  openGraph: {
    title: "NxtPool",
    description: "NxtPool connects verified university students traveling the same way at similar times. Share rides, split cost, travel with classmates you can trust.",
    type: "website",
    images: [
      {
        url: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6a431ab8-90ab-44ad-b051-abd9bdda4608/id-preview-15bb0a69--9371b7a6-ccaf-4aa8-85ed-8aad8afcf597.lovable.app-1783768239143.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NxtPool — Verified student ride sharing",
    description: "NxtPool connects verified university students traveling the same way at similar times. Share rides, split cost, travel with classmates you can trust.",
    images: ["https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6a431ab8-90ab-44ad-b051-abd9bdda4608/id-preview-15bb0a69--9371b7a6-ccaf-4aa8-85ed-8aad8afcf597.lovable.app-1783768239143.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${figtree.variable} ${bricolage.variable} ${inter.variable}`} suppressHydrationWarning>
      <head />
      <body style={{
        ["--font-sans-family" as any]: "var(--font-sans-fallback)",
        ["--font-heading-family" as any]: "var(--font-heading-fallback)",
      }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
