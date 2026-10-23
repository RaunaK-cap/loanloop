import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "LoanLoop — Borrow from your building",
    template: "%s · LoanLoop",
  },
  description:
    "A trust-first lending shelf for apartment communities. Borrow what you need from a neighbor instead of buying it for one weekend.",
  applicationName: "LoanLoop",
  keywords: [
    "apartment community",
    "borrow",
    "lending library",
    "neighbors",
    "tool sharing",
    "Appwrite",
  ],
  openGraph: {
    title: "LoanLoop — Borrow from your building",
    description:
      "Your building already owns what you need. A trust-first lending shelf for neighbors.",
    type: "website",
    siteName: "LoanLoop",
  },
  twitter: {
    card: "summary_large_image",
    title: "LoanLoop — Borrow from your building",
    description:
      "A trust-first lending shelf for apartment communities.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
