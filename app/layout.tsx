import type { Metadata, Viewport } from "next";
import "../src/styles.css";
import { CURTAIN_CRITICAL_CSS, PageCurtain } from "@/components/site/PageCurtain";
import { PageTransitions } from "@/components/site/PageTransitions";
import { getSiteUrl } from "@/server/env";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#f9f8f5" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..700&family=Noto+Sans+Arabic:wght@400;500&family=Noto+Sans+Devanagari:wght@400;500&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: CURTAIN_CRITICAL_CSS }} />
      </head>
      <body>
        <PageCurtain />
        {children}
        <PageTransitions />
      </body>
    </html>
  );
}
