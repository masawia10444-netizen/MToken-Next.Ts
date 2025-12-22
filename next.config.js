/** @type {import('next').NextConfig} */
const nextConfig = {
  // สั่งให้ข้ามการเช็ค ESLint ตอน Build
  eslint: {
    ignoreDuringBuilds: true,
    basePath: '/test5v2',
  },
  // สั่งให้ข้ามการเช็ค TypeScript Error ตอน Build
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
};

module.exports = nextConfig;