import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/ui/Providers";
import AppShell from "@/components/AppShell";
import ThemeApplier from "@/components/ThemeApplier";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "LexPro - Case Management",
  description: "Legal case management dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>
          <ThemeApplier />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
