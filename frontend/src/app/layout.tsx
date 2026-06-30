import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./global.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CaseZero | Classified Database",
  description: "Forensic Investigation Terminal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* We removed the flex-row layout here so page.tsx can take over 100% of the screen */}
      <body className={`${inter.className} bg-[#0a0f16] text-slate-300 min-h-screen m-0 p-0`}>
        {children}
      </body>
    </html>
  );
}