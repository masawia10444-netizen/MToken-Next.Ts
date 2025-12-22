/** @type {import('next').NextConfig} */
const nextConfig = {
  // ย้ายมาตรงนี้ครับ (บรรทัดบนสุด หรือระดับเดียวกับ output)
  basePath: '/test5',

  eslint: {
    ignoreDuringBuilds: true,
    // ลบบรรทัด basePath ตรงนี้ออก
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
};

module.exports = nextConfig;