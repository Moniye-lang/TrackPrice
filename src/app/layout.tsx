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

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300`}>
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5565112876103304"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Providers>
            <AnonymousIdentifier />
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">
                {children}
              </main>
              <footer className="w-full pb-24 pt-6 sm:pb-8 sm:pt-8 text-center bg-slate-950 border-t border-slate-900 mt-auto relative z-[40]">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  &copy; {new Date().getFullYear()} TrackPrice. All Rights Reserved.
                </p>
              </footer>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
