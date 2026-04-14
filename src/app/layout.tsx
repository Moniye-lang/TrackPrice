import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Script from "next/script";
import AnonymousIdentifier from "@/components/AnonymousIdentifier";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "TrackPricely | Live Market Price Tracking in Oyo & Lagos",
  description: "Check and compare live market prices across Oyo & Lagos. Join the community tracking daily price changes in Bodija, Dugbe, and more.",
  robots: "index, follow",
  other: {
    "google-adsense-account": "ca-pub-5565112876103304",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5565112876103304"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Providers>
          <AnonymousIdentifier />
          {children}
        </Providers>
      </body>
    </html>
  );
}
