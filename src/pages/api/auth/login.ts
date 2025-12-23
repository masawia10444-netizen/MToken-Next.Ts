import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import pool from '../../../lib/db';
import { getGdxToken } from '../../../lib/utils';
import { ERROR_MESSAGES, HTTP_STATUS, API_STATUS } from '../../../lib/constants';

const CREATE_TABLE_SQL = `
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
`;

/**
 * Fetch user profile from Government API (Deproc)
 */
async function getDeprocProfile(
  appId: string,
  mToken: string,
  gdxToken: string
): Promise<any> {
  const deprocUrl = process.env.DEPROC_API_URL;
  if (!deprocUrl) throw new Error(ERROR_MESSAGES.NO_DEPROC_URL);

  const response = await axios.post(
    deprocUrl,
    { AppId: appId, MToken: mToken },
    {
      headers: {
        'Consumer-Key': process.env.CONSUMER_KEY,
        Token: gdxToken,
        'Content-Type': 'application/json',
      },
    }
  );

  const profileData = response.data?.result;
  if (!profileData) {
    throw new Error(ERROR_MESSAGES.NO_GOVT_PROFILE);
  }

  return profileData;
}

/**
 * POST /api/auth/login
 * Authenticate user with GDX token and check database
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res
      .status(HTTP_STATUS.METHOD_NOT_ALLOWED)
      .json({ message: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  const { appId, mToken } = req.body;

  if (!appId || !mToken) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ status: API_STATUS.ERROR, message: ERROR_MESSAGES.MISSING_DATA });
  }

  try {
    // Step 1: Get GDX Token
    const gdxToken = await getGdxToken();

    // Step 2: Fetch user profile from Government API
    const profileData = await getDeprocProfile(appId, mToken, gdxToken);
    const citizenId = profileData.citizenId;

    // Step 3: Ensure database table exists
    try {
      await pool.query(CREATE_TABLE_SQL);
    } catch {
      // Table might already exist, continue
    }

    // Step 4: Check if user exists in database
    const userQuery = await pool.query(
      'SELECT * FROM personal_data WHERE citizen_id = $1',
      [citizenId]
    );

    if (userQuery.rows.length > 0) {
      // ✅ Existing user - return found status
      const userData = userQuery.rows[0];
      return res.status(HTTP_STATUS.OK).json({
        status: API_STATUS.FOUND,
        message: 'User exists, login complete',
        data: {
          userId: userData.user_id,
          citizen_id: userData.citizen_id,
          first_name_th: userData.first_name,
          last_name_th: userData.last_name,
          mobile_number: userData.mobile,
          address: userData.additional_info || '',
          is_registered: true,
        },
      });
    }

    // 🆕 New user - return government profile for registration
    return res.status(HTTP_STATUS.OK).json({
      status: API_STATUS.NEW_USER,
      message: 'User not found, please register',
      data: {
        userId: profileData.userId,
        citizen_id: citizenId,
        first_name_th: profileData.firstName,
        last_name_th: profileData.lastName,
        dateOfBirthString: profileData.dateOfBirthString,
        email: profileData.email,
        notification: profileData.notification,
        mobile_number: profileData.mobile,
        is_registered: false,
      },
    });
  } catch (error: any) {
    console.error('❌ Login Error:', error.message);

    const errorDetail = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message;

    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      status: API_STATUS.ERROR,
      message: errorDetail || 'Internal Server Error',
    });
  }
}