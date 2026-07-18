import "./globals.css";
import { Metadata } from "next";

if (!process.env.BASE_URL || !process.env.DEPLOYMENT_BASE_URL) {
  throw new Error("환경변수가 설정되지 않았습니다.");
}

const BASEURL =
  process.env.NODE_ENV === "development"
    ? process.env.BASE_URL
    : process.env.DEPLOYMENT_BASE_URL;

export const metadata: Metadata = {
  title: "Home - Tie Knot",
  description: "모바일 청첩장을 쉽고 빠르게 만들어드립니다.",
  metadataBase: new URL(BASEURL),
  keywords: [
    "청첩장",
    "웨딩",
    "invitation",
    "mobile",
    "wedding invitation",
    "portfolio",
    "frontend",
    "next.js",
  ],
  authors: [
    { name: "Tie Knot", url: "https://tie-knot-pi.vercel.app" },
  ],
  creator: "Tie Knot",
  publisher: "Tie Knot",

  openGraph: {
    title: "Tie Knot",
    description: "모바일 청첩장을 쉽고 빠르게 만들어드립니다.",
    images: ["/wedding-1850.jpg"],
    siteName: "Tie Knot",
    type: "website",
    url: "https://tie-knot-pi.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tie Knot",
    description: "모바일 청첩장을 쉽고 빠르게 만들어드립니다.",
    images: ["/wedding-1850.jpg"],
    creator: "@your_twitter_handle",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
