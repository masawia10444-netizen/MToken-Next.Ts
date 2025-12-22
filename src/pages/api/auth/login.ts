import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import pool from '../../../lib/db'; // ✅ เชื่อมต่อ Database (ตรวจสอบ Path ให้ถูก)

// ------------------------------------------------------------------
// Helper Function: ขอ GDX Token (เลียนแบบจาก app.js)
// ------------------------------------------------------------------
async function getGdxToken() {
  try {
    // ดึงค่าจาก .env
    const url = process.env.GDX_AUTH_URL;
    if (!url) throw new Error("Missing GDX_AUTH_URL in .env");

    const res = await axios.get(url, {
      params: { 
        ConsumerSecret: process.env.CONSUMER_SECRET, 
        AgentID: process.env.AGENT_ID 
      },
      headers: { 
        'Consumer-Key': process.env.CONSUMER_KEY, 
        'Content-Type': 'application/json' 
      }
    });

    return res.data.Result; // ส่ง Token กลับไป
  } catch (e: any) {
    console.error("❌ Failed to get GDX Token:", e.message);
    throw new Error("Cannot get GDX Token: " + e.message);
  }
}

// ------------------------------------------------------------------
// Main API Handler
// ------------------------------------------------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // รับเฉพาะ POST Method เท่านั้น
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { appId, mToken } = req.body;

  // 1. เช็คว่าส่งข้อมูลมาครบไหม
  if (!appId || !mToken) {
    return res.status(400).json({ status: 'error', message: 'Missing Data: appId or mToken' });
  }

  try {
    // ------------------------------------------------------------
    // Step 1: ขอ GDX Token
    // ------------------------------------------------------------
    console.log("🔄 Step 1: Getting GDX Token...");
    const token = await getGdxToken();
    console.log("✅ GDX Token Received.");

    // ------------------------------------------------------------
    // Step 2: เอา Token ไปดึงข้อมูล Profile จากรัฐ (Deproc)
    // ------------------------------------------------------------
    console.log("🔄 Step 2: Fetching User Profile from Govt API...");
    const deprocUrl = process.env.DEPROC_API_URL;
    if (!deprocUrl) throw new Error("Missing DEPROC_API_URL in .env");

    const deprocRes = await axios.post(deprocUrl, 
      { AppId: appId, MToken: mToken },
      { 
        headers: { 
          'Consumer-Key': process.env.CONSUMER_KEY, 
          'Token': token, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
    // ตรวจสอบว่าได้ข้อมูลจริงไหม
    const pData = deprocRes.data.result;
    if (!pData) {
      throw new Error("Govt API returned NULL (Token Expired or Invalid)");
    }
    
    console.log("✅ User Profile Found:", pData.citizenId);

    // ------------------------------------------------------------
    // Step 3: เช็ค Database (Auto-Create Table ถ้ายังไม่มี)
    // ------------------------------------------------------------
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS personal_data (
          user_id VARCHAR(255) PRIMARY KEY,
          citizen_id VARCHAR(255) UNIQUE,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          date_of_birth VARCHAR(255),
          mobile VARCHAR(255),
          email VARCHAR(255),
          notification VARCHAR(50),
          additional_info TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (ignored) { 
        // ถ้าตารางมีอยู่แล้ว หรือ error เล็กน้อย ให้ข้ามไป
    }

    // Query ดูว่ามี user คนนี้ไหม (เช็คจาก citizen_id)
    const userDb = await pool.query('SELECT * FROM personal_data WHERE citizen_id = $1', [pData.citizenId]);
    
    if (userDb.rows.length > 0) {
      // ✅ CASE A: มีข้อมูลแล้ว (Login สำเร็จ)
      const userData = userDb.rows[0];
      return res.status(200).json({
        status: 'found',
        message: 'User exists, login complete',
        data: { 
          userId: userData.user_id,
          citizen_id: userData.citizen_id,
          first_name_th: userData.first_name, 
          last_name_th: userData.last_name,
          mobile_number: userData.mobile,
          address: userData.additional_info || "",
          is_registered: true // บอก Frontend ว่าคนนี้ลงทะเบียนแล้ว
        }
      });
    } else {
      // 🆕 CASE B: สมาชิกใหม่ (ส่งข้อมูลรัฐกลับไปให้กรอกต่อหน้า Register)
      return res.status(200).json({
        status: 'new_user',
        message: 'User not found, please register',
        data: { 
          // ข้อมูลจากรัฐ (ยังไม่ได้บันทึก)
          userId: pData.userId,
          citizen_id: pData.citizenId,
          first_name_th: pData.firstName,
          last_name_th: pData.lastName,
          dateOfBirthString: pData.dateOfBirthString,
          email: pData.email,
          notification: pData.notification,
          mobile_number: pData.mobile, // เบอร์จากรัฐ (ถ้ามี)
          is_registered: false
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Login Error:', error.message);
    
    // ดึง Error Detail จาก Axios (ถ้ามี) มาแสดง
    const apiError = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    
    return res.status(500).json({ 
        status: 'error', 
        message: apiError || 'Internal Server Error' 
    });
  }
}