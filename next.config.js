/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ เอาบรรทัดนี้กลับมาครับ! (เพื่อให้ App รู้จักคำว่า /test5)
  basePath: '/test5', 

  // assetPrefix ไม่ต้องใส่ก็ได้ครับ (ปกติ basePath จะจัดการให้เอง)
  // assetPrefix: '/test5', 

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
};

module.exports = nextConfig;