# 1. ใช้ Node Image ตัวเล็ก (Alpine)
FROM node:18-alpine AS builder

# 2. กำหนด Working Directory
WORKDIR /app

# 3. Copy ไฟล์ Package เพื่อ Install Dependencies ก่อน (ช่วยเรื่อง Cache)
COPY package.json package-lock.json* ./

# 4. Install Dependencies
# ใช้ --legacy-peer-deps เพื่อลดปัญหา version ชนกัน
RUN npm install --legacy-peer-deps

# 5. Copy Code ทั้งหมดเข้าไป
COPY . .

# 6. สร้าง Build (ตอนนี้จะไม่พังเพราะ ESLint/TS แล้ว เพราะเราแก้ config แล้ว)
RUN npm run build

# --- Setup สำหรับ Run ---
EXPOSE 3000

ENV PORT=3000
# ถ้าใน Code มีการเรียกใช้ Env Var อื่นๆ อย่าลืมใส่ใน Docker Compose หรือ Server ด้วย

# คำสั่ง Run (ใช้ start ปกติ)
CMD ["npm", "start"]