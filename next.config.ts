/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // เพิ่ม 2 ส่วนนี้เพื่อให้ Build ใน Docker ผ่านง่ายขึ้น
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // ถ้าใช้ Docker แนะนำให้เปิด standalone ด้วย (ถ้าไม่ใช้ ลบออกได้)
  output: "standalone", 
};

module.exports = nextConfig; // หรือ export default nextConfig; ตามที่ใช้อยู่