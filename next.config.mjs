/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow remote images (gallery, announcements) once Supabase storage is wired.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
