import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../styles.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CampusPool — Verified student ride sharing",
  description: "CampusPool connects verified university students traveling the same way at similar times. Share rides, split cost, travel with classmates you can trust.",
  authors: [{ name: "CampusPool" }],
  openGraph: {
    title: "CampusPool — Verified student ride sharing",
    description: "CampusPool connects verified university students traveling the same way at similar times. Share rides, split cost, travel with classmates you can trust.",
    type: "website",
    images: [
      {
        url: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6a431ab8-90ab-44ad-b051-abd9bdda4608/id-preview-15bb0a69--9371b7a6-ccaf-4aa8-85ed-8aad8afcf597.lovable.app-1783768239143.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusPool — Verified student ride sharing",
    description: "CampusPool connects verified university students traveling the same way at similar times. Share rides, split cost, travel with classmates you can trust.",
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://rsms.me" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
