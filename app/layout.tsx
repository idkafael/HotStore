import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HotStore Modelos",
  description: "Galeria de modelos com carrossel e tags",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-black text-white">{children}</body>
    </html>
  );
}
