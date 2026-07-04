import type { Metadata, Viewport } from "next";
import { Cairo, Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { Providers } from "./providers";
import { GlobalToaster } from "@/components/ui/global-toaster";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Marketly AI",
    template: "%s | Marketly AI",
  },
  description: "Premium AI marketing command center for campaigns, creative generation, and growth analytics.",
};

export const viewport: Viewport = {
  themeColor: "#0B0F0C",
  colorScheme: "dark light",
};

const themeInitScript = `
(() => {
  try {
    const key = "marketly-theme";
    const stored = localStorage.getItem(key);
    const theme = stored === "light" || stored === "dark" ? stored : "dark";
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    root.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.add("dark");
  }
})();
`;

const languageInitScript = `
(() => {
  try {
    const key = "marketly-language";
    const stored = localStorage.getItem(key);
    const language = stored === "ar" ? "ar" : "en";
    const dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  } catch {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
        <GlobalToaster />
      </body>
    </html>
  );
}
