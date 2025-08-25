/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [
      '03ef5b00018e4836b3ae4520023ad1cd-e4c66247-1555-4ffc-b812-0dea8a.fly.dev'
    ]
  },
  images: {
    domains: ['cdn.builder.io'],
    formats: ['image/webp', 'image/avif'],
  },
  // Enable static exports for better performance
  trailingSlash: false,
  // Optimize for production
  swcMinify: true,
  // Enable React strict mode
  reactStrictMode: true,
};

export default nextConfig;
