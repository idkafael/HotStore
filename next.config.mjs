/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "apiv2.payevo.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.payevo.com.br",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
