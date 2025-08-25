/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cdn.builder.io',
      'qtpckupybqvqttnevyss.supabase.co', // Supabase storage domain
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // Enable React strict mode
  reactStrictMode: true,
  // Optimize bundle
  compress: true,
};

export default nextConfig;
