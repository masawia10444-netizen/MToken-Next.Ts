/**
 * Utility Functions for MToken Application
 */

import axios from 'axios';
import https from 'https';
import { ERROR_MESSAGES } from './constants';

// HTTPS Agent for SSL certificate bypass (used in Government APIs)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Fetch GDX Authorization Token
 * Used by multiple API routes to authenticate with Government APIs
 */
export async function getGdxToken(): Promise<string> {
  try {
    const url = process.env.GDX_AUTH_URL;
    if (!url) throw new Error(ERROR_MESSAGES.NO_GDX_AUTH_URL);

    const response = await axios.get(url, {
      params: {
        ConsumerSecret: process.env.CONSUMER_SECRET,
        AgentID: process.env.AGENT_ID,
      },
      headers: {
        'Consumer-Key': process.env.CONSUMER_KEY,
        'Content-Type': 'application/json',
      },
      httpsAgent,
    });

    const token = response.data?.Result;
    if (!token) throw new Error('Token response is empty');

    return token;
  } catch (error: any) {
    console.error('❌ Failed to get GDX Token:', error.message);
    throw new Error(`${ERROR_MESSAGES.NO_GDX_TOKEN}: ${error.message}`);
  }
}

/**
 * Handle and format API errors
 */
export function handleApiError(error: any): { status: number; message: string } {
  if (error.response?.status === 401) {
    return { status: 401, message: 'Unauthorized' };
  }
  if (error.response?.status === 404) {
    return { status: 404, message: 'Not found' };
  }
  return {
    status: error.response?.status || 500,
    message: error.response?.data?.message || error.message || 'Unknown error',
  };
}

/**
 * Validate required fields in request body
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[],
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter((field) => !data[field]);
  return { valid: missing.length === 0, missing };
}

/**
 * Extract field from object with fallback options
 */
export function extractField(
  obj: any,
  ...fieldNames: string[]
): string {
  for (const field of fieldNames) {
    if (obj?.[field]) return obj[field];
  }
  return '';
}
