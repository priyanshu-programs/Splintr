import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["200", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  title: "Splintr - One piece of content. Every platform. Instantly.",
  description:
    "Feed Splintr a blog post, podcast, or video — get ready-to-publish content for LinkedIn, Instagram, X, your blog, and video scripts in seconds.",
  openGraph: {
    title: "Splintr - One piece of content. Every platform. Instantly.",
    description:
      "Feed Splintr a blog post, podcast, or video — get ready-to-publish content for LinkedIn, Instagram, X, your blog, and video scripts in seconds.",
    type: "website",
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
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster>
            {children}
          </Toaster>
        </ThemeProvider>
      </body>
    </html>
  );
}
