import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, Noto_Sans_Arabic, Source_Serif_4 } from "next/font/google";

import { auth } from "@/auth";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import {
  defaultLocale,
  isLocale,
  localeDirection,
} from "@/i18n/config";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-heading-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "EDEN ATELIER",
    template: "%s · EDEN ATELIER",
  },
  description:
    "Enterprise ERP for wood and stone fabrication — CRM, projects, production, and logistics.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headerLocale = (await headers()).get("x-locale") ?? defaultLocale;
  const locale = isLocale(headerLocale) ? headerLocale : defaultLocale;
  const dir = localeDirection(locale);
  const session = await auth();

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} ${notoArabic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className={`min-h-full ${locale === "ar" ? "font-arabic" : ""}`}>
        <ThemeProvider>
          <AuthProvider session={session}>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
