import type { Metadata } from "next";
import { Playfair_Display, JetBrains_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth/model/AuthContext";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const notosans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: "--font-noto"
});

export const metadata: Metadata = {
  title: "Sogong | Intelligent Workspace",
  description: "Advanced LLM-based Learning Platform",
  openGraph: {
    title: "Sogong",
    description: "Connect, Learn, Grow.",
    siteName: "Sogong",
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
      <body className={`${notosans.variable} ${playfair.variable} ${jetbrains.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
