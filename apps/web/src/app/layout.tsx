import type { Metadata } from "next";
import { Archivo, Bitter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { TopNav } from "@/components/top-nav";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_NAME,
  siteUrl,
} from "@/lib/seo";
import { ConvexClientProvider } from "./ConvexClientProvider";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "nonprofit discovery",
    "charity search",
    "find nonprofits",
    "volunteer organizations",
    "causes",
  ],
  authors: [{ name: "J.K. Labs", url: "https://joekracz.com" }],
  creator: "J.K. Labs",
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/ocean-conservation-awareness.png",
        width: 1024,
        height: 526,
        alt: "Volunteers working together on a conservation cause",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/ocean-conservation-awareness.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${archivo.variable} ${bitter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <ConvexClientProvider guestId={guestId}>
            <div className="relative z-10 flex min-h-screen flex-col">
              <TopNav />
              <div className="page-transition-wrapper flex-1">{children}</div>
              <Footer />
            </div>
          </ConvexClientProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
