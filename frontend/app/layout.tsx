import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "소통하며 공부하는, 소공",
  description: "LLM 기반 학습 보조 플랫폼",
  openGraph: {
    title: "소통하며 공부하는, 소공",
    description: "LLM 기반 학습 보조 플랫폼",
    siteName: "소공",
    locale: "ko_KR",
    type: "website",
    images: ["/thumbnail.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
