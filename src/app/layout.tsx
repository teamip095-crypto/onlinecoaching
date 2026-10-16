import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Online Coaching - Smart Learning Platform",
  description: "India's smart coaching app for students — live classes, courses, tests, study material, doubt solving, all in one place.",
  keywords: ["online coaching", "coaching app", "live classes", "test series", "study material", "doubt solving", "ClassPlus alternative"],
  authors: [{ name: "Online Coaching" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Online Coaching - Smart Learning Platform",
    description: "Live classes, courses, tests, study material & doubt solving — all in one coaching app.",
    siteName: "Online Coaching",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Coaching - Smart Learning Platform",
    description: "Live classes, courses, tests, study material & doubt solving — all in one coaching app.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
