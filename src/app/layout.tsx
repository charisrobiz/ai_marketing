import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import AuthGuard from "@/components/auth/AuthGuard";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import StoreHydrator from "@/components/layout/StoreHydrator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoGrowth Engine - AI 마케팅 자동화 플랫폼",
  description: "AI 직원들이 협업하여 마케팅을 자동화하는 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AuthGuard>
            <StoreHydrator />
            <Sidebar />
            <Header />
            <main className="transition-all duration-300 pt-16 pl-64 min-h-screen">
              <div className="p-6">{children}</div>
            </main>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
