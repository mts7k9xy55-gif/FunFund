import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "FunFund",
  description: "判断の切れを可視化するプラットフォーム",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192-v2.png",
    apple: "/icons/icon-180x180-v2.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FunFund",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <head>
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180-v2.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        </head>
        <body className="antialiased min-h-screen flex flex-col">
          <ConvexClientProvider>
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </ConvexClientProvider>
          <ServiceWorkerRegister />
        </body>
      </html>
    </ClerkProvider>
  );
}
