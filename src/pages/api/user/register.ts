import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';
import { HTTP_STATUS, API_STATUS, ERROR_MESSAGES } from '../../../lib/constants';

const INSERT_USER_SQL = `
  INSERT INTO personal_data 
  (user_id, citizen_id, first_name, last_name, date_of_birth, email, notification, mobile, additional_info)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  ON CONFLICT (citizen_id) DO UPDATE SET 
  mobile = EXCLUDED.mobile, 
  additional_info = EXCLUDED.additional_info;
`;

/**
 * POST /api/user/register
 * Register or update user information in database
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

  const {
    userId,
    citizenId,
    firstName,
    lastName,
    dateOfBirth,
    email,
    notification,
    mobile,
    additionalInfo,
  } = req.body;

  try {
    await pool.query(INSERT_USER_SQL, [
      userId,
      citizenId,
      firstName,
      lastName,
      dateOfBirth || null,
      email || null,
      notification || null,
      mobile || null,
      additionalInfo || null,
    ]);

    return res.status(HTTP_STATUS.OK).json({
      status: API_STATUS.SUCCESS,
      message: ERROR_MESSAGES.REGISTRATION_COMPLETE,
    });
  } catch (error: any) {
    console.error('❌ Registration Error:', error.message);

    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      status: API_STATUS.ERROR,
      message: error.message || ERROR_MESSAGES.REGISTRATION_FAILED,
    });
  }
}