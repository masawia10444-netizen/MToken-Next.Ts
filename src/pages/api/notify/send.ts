import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import https from 'https';

// ✅ ฟังก์ชันขอ Token (สูตรของนาย)
async function getGdxToken() {
    try {
        // ใช้ httpsAgent เผื่อไว้กรณีติดปัญหา SSL ใน Docker
        const agent = new https.Agent({ rejectUnauthorized: false });

        const res = await axios.get(process.env.GDX_AUTH_URL || '', {
            params: { 
                ConsumerSecret: process.env.CONSUMER_SECRET, 
                AgentID: process.env.AGENT_ID 
            },
            headers: { 
                'Consumer-Key': process.env.CONSUMER_KEY, 
                'Content-Type': 'application/json' 
            },
            httpsAgent: agent 
        });
        return res.data.Result;
    } catch (e: any) {
        console.error("❌ Failed to get GDX Token:", e.message);
        throw new Error("Cannot get GDX Token");
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { appId, userId, message } = req.body;
  const NOTIFICATION_API_URL = process.env.NOTIFICATION_API_URL || 'https://api.egov.go.th/ws/dga/czp/v1/notification/push';
  const CONSUMER_KEY = process.env.CONSUMER_KEY || '';

  try {
    // 1. เรียกขอ Token
    const token = await getGdxToken();

    if (!token) {
        throw new Error("ไม่ได้รับ Token จาก GDX (Token is empty)");
    }

    console.log(`📨 Sending notify to: ${userId}`);

    // 2. เตรียมข้อมูลส่ง Notification
    const body = { 
        appId: appId || 'MY_APP', 
        data: [
            { 
                message: message || "Test Message", 
                userId: userId 
            }
        ], 
        sendDateTime: null 
    };

    // 3. ยิงไปหา DGA Notification API
    const agent = new https.Agent({ rejectUnauthorized: false });
    
    const notifyRes = await axios.post(NOTIFICATION_API_URL, body, { 
        headers: { 
            'Consumer-Key': CONSUMER_KEY, 
            'Token': token, 
            'Content-Type': 'application/json' 
        },
        httpsAgent: agent 
    });

    console.log("✅ Notify Result:", notifyRes.data);
    res.status(200).json({ success: true, result: notifyRes.data });

  } catch (e: any) {
    console.error('❌ Notify Error:', e.response?.data || e.message);
    res.status(500).json({ 
        success: false, 
        message: e.response?.data?.message || e.message 
    });
  }
}