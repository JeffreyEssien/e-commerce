/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cdn.builder.io',
      'qtpckupybqvqttnevyss.supabase.co', // Current Supabase storage domain
    ],
    // Alternative: Use remotePatterns for more flexible matching
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.builder.io',
        port: '',
        pathname: '/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // Enable React strict mode
  reactStrictMode: true,
  // Optimize bundle
  compress: true,
};

export default nextConfig;
