import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // TMDB 이미지 CDN (03_ARCHITECTURE §3, 03_DESIGN §7)
    // next/image 최적화 허용 대상. 쿼리스트링 없는 /t/p/** 경로만 허용.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;
