import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BackendWaker } from "@/components/BackendWaker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skill Swap - Learn and Teach Skills",
  description: "Skill Swap is a premium platform to learn and teach skills with the community. Exchange knowledge, find mentors, and grow together.",
  keywords: ["Skill Swap", "Learning", "Teaching", "Community", "Online learning", "Knowledge exchange"],
  metadataBase: new URL("https://gyaansetu-sonu.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Skill Swap - Learn and Teach Skills",
    description: "Exchange knowledge and grow with the community on Skill Swap.",
    url: "https://gyaansetu-sonu.vercel.app",
    siteName: "Skill Swap",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Skill Swap Banner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skill Swap - Learn and Teach Skills",
    description: "Exchange knowledge and grow with the community on Skill Swap.",
    images: ["/banner.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "X2haNFBdOgeahX8j9KG1AAU6u2r4NxxIlLVPeNcqhpQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300`}
      >
        <ThemeProvider defaultTheme="dark" storageKey="skill-swap-theme">
          <BackendWaker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
