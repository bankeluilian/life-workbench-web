import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:4173";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const previewImage = `${protocol}://${host}/og.png`;

  return {
    title: "人生支线工作台",
    description: "记录生活、专注成长，看见每一条人生支线。",
    icons: { icon: "/assets/illustrations/theme_rabbit.png" },
    openGraph: {
      title: "人生支线工作台",
      description: "记录生活 · 专注成长 · 看见每一条支线",
      images: [{ url: previewImage, width: 1536, height: 1024 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "人生支线工作台",
      description: "记录生活 · 专注成长 · 看见每一条支线",
      images: [previewImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
