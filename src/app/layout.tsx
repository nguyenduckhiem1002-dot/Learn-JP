import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "日本語 Flashcards",
  description: "Japanese Flashcard Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
