/**
 * Global Constants for MToken Application
 */

// API Messages
export const API_MESSAGES = {
  METHOD_NOT_ALLOWED: 'Method Not Allowed',
  MISSING_DATA: 'Missing required data',
  SUCCESS: 'Success',
  ERROR: 'Error',
  UNAUTHORIZED: 'Unauthorized',
  INVALID_TOKEN: 'Invalid or expired token',
  USER_NOT_FOUND: 'User not found',
  REGISTRATION_COMPLETE: 'Registration Complete',
  REGISTRATION_FAILED: 'Registration Failed',
};

// Error Messages (Thai)
export const ERROR_MESSAGES = {
  METHOD_NOT_ALLOWED: 'Method Not Allowed',
  MISSING_DATA: 'Missing required data',
  NO_USER_ID: 'ไม่พบข้อมูล User ID',
  NO_GDX_TOKEN: 'ไม่สามารถขอ Token จาก GDX',
  NO_GOVT_PROFILE: 'Govt API returned NULL (Token Expired or Invalid)',
  SEND_NOTIFY_SUCCESS: '✅ ส่งแจ้งเตือนเรียบร้อย!',
  SEND_NOTIFY_FAILED: '❌ ส่งไม่ผ่าน',
  NO_DEPROC_URL: 'Missing DEPROC_API_URL in .env',
  NO_GDX_AUTH_URL: 'Missing GDX_AUTH_URL in .env',
  NO_NOTIFICATION_URL: 'Missing NOTIFICATION_API_URL in .env',
  REGISTRATION_COMPLETE: 'Registration Complete',
  REGISTRATION_FAILED: 'Registration Failed',
};

// API Status
export const API_STATUS = {
  SUCCESS: 'success',
  FOUND: 'found',
  NEW_USER: 'new_user',
  ERROR: 'error',
};

// Default Values
export const DEFAULTS = {
  PORT: 5432,
  DB: 'postgres',
  USER: 'postgres',
  PASSWORD: 'password',
  HOST: 'localhost',
  NOTIFICATION_API: 'https://api.egov.go.th/ws/dga/czp/v1/notification/push',
  APP_ID: 'MY_APP',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};
