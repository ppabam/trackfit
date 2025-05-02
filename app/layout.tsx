import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Track-Fit",
  description:
    "Track-Fit 앱으로 체중 변화를 추적하고, 목표를 설정하고, 건강한 라이프스타일을 유지하세요.",
  openGraph: {
    title: "Track-Fit",
    description:
      "Track-Fit 앱으로 체중 변화를 추적하고, 목표를 설정하고, 건강한 라이프스타일을 유지하세요.",
    images: ["https://googleusercontent.com/image_generation_content/0"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
