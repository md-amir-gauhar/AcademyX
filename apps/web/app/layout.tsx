import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { env } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${env.appName} — Learn smarter. Grow faster.`,
    template: `%s · ${env.appName}`,
  },
  description:
    "A premium learning platform for ambitious students — live classes, adaptive tests, mentor-backed community and gamified practice.",
  metadataBase: new URL("https://academyx.app"),
  openGraph: {
    type: "website",
    siteName: env.appName,
    title: `${env.appName} — Learn smarter. Grow faster.`,
    description:
      "Live classes, AI mentors, gamified practice — one beautiful learning platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: env.appName,
    description:
      "Live classes, AI mentors, gamified practice — one beautiful learning platform.",
  },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
