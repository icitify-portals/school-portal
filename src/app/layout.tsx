// @ts-nocheck
export const dynamic = 'force-dynamic';
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./accessibility.css";

// Font fallbacks to bypass Google Font connectivity issues during build
const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  title: {
    default: "FSS Portal | Advanced Learning & Scholarly Journal System",
    template: "%s | FSS Portal"
  },
  description: "Comprehensive scholarly publishing and intelligent learning resource platform.",
  keywords: ["e-learning", "academic journal", "library management", "WAEC prep", "JAMB prep", "structured learning"],
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://fssportal.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://fssportal.com",
    siteName: "FSS Portal",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FSS Portal Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@fssportal",
    creator: "@fssportal",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { GoogleAnalytics } from "@next/third-parties/google";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { AnnouncementBanner } from "@/components/communication/AnnouncementBanner";
import { AuthProvider } from "@/providers/AuthProvider";
import { AppContent } from "@/components/AppContent";
import { Toaster } from "sonner";
import ThemeInjector from "@/components/ThemeInjector";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { PushNotificationManager } from "@/components/PushNotificationManager";

import { BranchProvider } from "@/providers/BranchProvider";
import { auth } from "@/auth";
import { DobEnforcer } from "@/components/DobEnforcer";


import { getEnabledModules } from "@/actions/system-settings";
import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const enabledModules = await getEnabledModules();
  const session = await auth();
  const cookieStore = await cookies();
  const initialLang = cookieStore.get("portal-language")?.value || "en";
  const initialUnitId = cookieStore.get("activeUnitId")?.value;

  return (
    <html lang={initialLang} suppressHydrationWarning>
      <head>
        {/* @ts-expect-error - TS2741: Auto-suppressed for build */}
        <GoogleAnalytics />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <div id="root-container" suppressHydrationWarning>
          <AuthProvider session={session}>
            <BranchProvider initialUnitId={initialUnitId}>
              <ImpersonationBanner />
              <AnnouncementBanner />
              <ThemeInjector />
              <AppContent enabledModules={enabledModules}>
                <DobEnforcer />
                {children}
                <PushNotificationManager />
                <ServiceWorkerRegistrar />
                <Toaster position="top-right" richColors />
              </AppContent>
            </BranchProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
