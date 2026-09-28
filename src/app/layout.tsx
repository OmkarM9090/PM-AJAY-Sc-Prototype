import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "JeevikaSetu | Voice-first livelihood guidance prototype",
  description: "An SIH 2026 demonstration prototype for multilingual livelihood mapping and NSQF-aligned recommendations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Navbar /><main className="site-main">{children}</main><Footer /><Toaster position="top-right" /></body></html>;
}
