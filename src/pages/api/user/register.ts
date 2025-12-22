import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { userId, citizenId, firstName, lastName, dateOfBirth, email, notification, mobile, additionalInfo } = req.body;

  try {
    await pool.query(`
      INSERT INTO personal_data 
      (user_id, citizen_id, first_name, last_name, date_of_birth, email, notification, mobile, additional_info)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (citizen_id) DO UPDATE SET 
      mobile = EXCLUDED.mobile, additional_info = EXCLUDED.additional_info;
    `, [userId, citizenId, firstName, lastName, dateOfBirth, email, notification, mobile, additionalInfo]);

    res.json({ status: 'success', message: 'Registration Complete' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}