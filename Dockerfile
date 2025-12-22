# ใช้ Node.js เวอร์ชันเล็กเบา
FROM node:18-alpine

# สร้างโฟลเดอร์ทำงาน
WORKDIR /app

# ก๊อปปี้ไฟล์ Config ต่างๆ
COPY package*.json ./

# ติดตั้ง Library
RUN npm install --production

# ก๊อปปี้โค้ดทั้งหมด
COPY . .

# สร้าง Build สำหรับ Production
RUN npm run build

# เปิด Port 3000 (ภายใน Container)
EXPOSE 3000

# เริ่มรัน Next.js
CMD ["npm", "start"]