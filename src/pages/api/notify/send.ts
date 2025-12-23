// ไฟล์: src/pages/api/notify/send.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // รับเฉพาะ POST Request เท่านั้น
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // ดึงค่าจากหน้าบ้าน (userId คือเลขบัตร หรือ ID ที่ระบบรัฐต้องการ)
  const { appId, userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ success: false, message: 'Missing userId or message' });
  }

  // ✅ ตั้งค่า API ปลายทาง (เช็คจาก Document ของนายอีกทีนะว่าใช่อันนี้ไหม)
  // ปกติมักจะเป็น: https://api.egov.go.th/ws/dga/czp/v1/notification/push
  // หรืออาจจะเป็น Endpoint เฉพาะของโครงการนาย
  const EXTERNAL_API_URL = process.env.DGA_NOTIFY_API_URL || 'https://api.egov.go.th/ws/notification/push';

  try {
    console.log(`📨 Sending Notification to User: ${userId}`);

    // ยิงไปหา API รัฐบาล (GDX / DGA)
    // ตรงนี้ต้องใช้ Key ที่นายเคยถามหา (Consumer Key/Secret)
    const response = await axios.post(
      EXTERNAL_API_URL,
      {
        CitizenID: userId,          // หรือเป้าหมายที่จะส่ง
        Message: message,           // ข้อความ
        AppId: appId || 'MY_APP',   // ชื่อแอพผู้ส่ง
        // บางทีอาจต้องส่ง Title หรือ Data อื่นๆ ด้วยตาม Spec
        Title: 'แจ้งเตือนจากระบบ',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Consumer-Key': process.env.DGA_CONSUMER_KEY || '', // ใส่ Key ใน .env
          'Token': process.env.DGA_TOKEN || ''                // ถ้ามี Token ก็ใส่ด้วย
        }
      }
    );

    console.log('✅ Notification Sent:', response.data);
    return res.status(200).json({ success: true, data: response.data });

  } catch (error: any) {
    console.error('❌ Notification Error:', error.response?.data || error.message);
    
    // กรณีทดสอบ (Mock Success) - ถ้า API จริงยังไม่พร้อม ให้เปิดบรรทัดล่างนี้เพื่อหลอกว่าผ่าน
    // return res.status(200).json({ success: true, message: '(Mock) Sent Successfully' });

    return res.status(500).json({ 
        success: false, 
        message: error.response?.data?.message || 'Failed to send notification' 
    });
  }
}