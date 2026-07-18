module.exports = () => {
  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig: import("next").NextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "res.cloudinary.com",
          pathname: "/**",
        },
      ],
    },
  };

  return nextConfig;
};
