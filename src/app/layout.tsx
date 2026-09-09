import type { Metadata } from "next";
import "./globals.css";
import "./taste.css";

export const metadata: Metadata = {
  title: "Learn JP — 日本語",
  description: "Flashcards tiếng Nhật tối giản, tập trung vào việc nhớ từ.",
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
