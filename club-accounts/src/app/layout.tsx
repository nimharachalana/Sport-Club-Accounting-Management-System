import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Sinhala } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sinhala = Noto_Sans_Sinhala({ 
  subsets: ["sinhala", "latin"], 
  variable: "--font-sinhala" 
});

export const metadata: Metadata = {
  title: "Sport Club Accounting System",
  description: "Sport Club Accounting & Financial Management System",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${sinhala.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
