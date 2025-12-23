import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import https from 'https';
import { getGdxToken } from '../../../lib/utils';
import { HTTP_STATUS, API_STATUS, DEFAULTS, ERROR_MESSAGES } from '../../../lib/constants';

// HTTPS Agent for SSL certificate bypass
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * POST /api/notify/send
 * Send notification to user via Government Notification API
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res
      .status(HTTP_STATUS.METHOD_NOT_ALLOWED)
      .json({ success: false, message: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  const { appId, userId, message } = req.body;
  const notificationApiUrl =
    process.env.NOTIFICATION_API_URL || DEFAULTS.NOTIFICATION_API;
  const consumerKey = process.env.CONSUMER_KEY || '';

  if (!userId || !message) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.MISSING_DATA,
    });
  }

  try {
    // Step 1: Get GDX Token
    const gdxToken = await getGdxToken();

    if (!gdxToken) {
      throw new Error('GDX Token is empty');
    }

    console.log(`📨 Sending notification to: ${userId}`);

    // Step 2: Prepare notification payload
    const notificationPayload = {
      appId: appId || DEFAULTS.APP_ID,
      data: [
        {
          message: message || 'Test Message',
          userId,
        },
      ],
      sendDateTime: null,
    };

    // Step 3: Send to Government Notification API
    const notificationResponse = await axios.post(
      notificationApiUrl,
      notificationPayload,
      {
        headers: {
          'Consumer-Key': consumerKey,
          Token: gdxToken,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    console.log('✅ Notification sent:', notificationResponse.data);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      result: notificationResponse.data,
    });
  } catch (error: any) {
    console.error('❌ Notification Error:', error.response?.data || error.message);

    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: error.response?.data?.message || error.message,
    });
  }
}