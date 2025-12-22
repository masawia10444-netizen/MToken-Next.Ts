import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import pool from '../../../lib/db';
import { LoginResponse } from '../../../types';

// Helper: Get GDX Token
async function getGdxToken() {
  const res = await axios.get(process.env.GDX_AUTH_URL!, {
    params: { ConsumerSecret: process.env.CONSUMER_SECRET, AgentID: process.env.AGENT_ID },
    headers: { 'Consumer-Key': process.env.CONSUMER_KEY, 'Content-Type': 'application/json' }
  });
  return res.data.Result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<LoginResponse>) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  
  const { appId, mToken } = req.body;
  if (!appId || !mToken) return res.status(400).json({ status: 'error', message: 'Missing Data' });

  try {
    // 1. Get Token & Profile
    const token = await getGdxToken();
    const deprocRes = await axios.post(process.env.DEPROC_API_URL!, 
      { AppId: appId, MToken: mToken },
      { headers: { 'Consumer-Key': process.env.CONSUMER_KEY, 'Token': token, 'Content-Type': 'application/json' } }
    );
    
    const pData = deprocRes.data.result;
    if (!pData) throw new Error("Deproc returned NULL");

    // 2. Auto-Fix Schema (Create Table if not exists)
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

    // 3. Check DB
    const userDb = await pool.query('SELECT * FROM personal_data WHERE citizen_id = $1', [pData.citizenId]);

    if (userDb.rows.length > 0) {
      // ✅ Found User
      const userData = userDb.rows[0];
      return res.json({
        status: 'found',
        message: 'Login complete',
        data: {
          userId: userData.user_id,
          citizenId: userData.citizen_id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          mobile: userData.mobile,
          additionalInfo: userData.additional_info || ""
        }
      });
    } else {
      // 🆕 New User (Send Govt data back)
      return res.json({
        status: 'new_user',
        message: 'Please register',
        data: {
          userId: pData.userId,
          citizenId: pData.citizenId,
          firstName: pData.firstName,
          lastName: pData.lastName,
          dateOfBirthString: pData.dateOfBirthString,
          email: pData.email,
          notification: pData.notification,
          mobile: pData.mobile
        }
      });
    }

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
}