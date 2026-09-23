import type { Metadata } from "next";
import { Poppins, Montserrat, Quicksand, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Menuin — QR Meja, Kasir POS, dan Layar Dapur dalam Satu Sistem",
  description:
    "Tamu memesan dan membayar dari meja lewat QR, kasir memproses antrean dengan cepat, dan dapur menerima tiket tanpa kertas. Satu sistem untuk bisnis F&B Indonesia.",
};

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const montserrat = Montserrat({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

// Inter khusus angka keuangan & metrik tabular serta display landing page
const inter = Inter({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const quicksand = Quicksand({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

import { PageTransitionProvider } from "@/components/providers/page-transition-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${poppins.variable} ${montserrat.variable} ${quicksand.variable} ${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <PageTransitionProvider>
            {children}
            <Toaster />
          </PageTransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

