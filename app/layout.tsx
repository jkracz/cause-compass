import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MosaicBackground } from "@/components/mosaic-background";
import { ThemeProvider } from "@/components/theme-provider";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cause Compass",
  description: "Discover nonprofits that align with your values",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MosaicBackground />
          <div className="relative z-10 flex min-h-screen flex-col">
            <div className="page-transition-wrapper flex-1">{children}</div>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
