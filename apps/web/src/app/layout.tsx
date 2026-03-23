import type { Metadata } from "next";
import { Archivo, Bitter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { MosaicBackground } from "@/components/mosaic-background";
import { ThemeProvider } from "@/components/theme-provider";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { TopNav } from "@/components/top-nav";
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
  title: "Cause Compass",
  description: "Discover nonprofits that align with your values",
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
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider guestId={guestId}>
            <MosaicBackground />
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
