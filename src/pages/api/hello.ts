import type { NextApiRequest, NextApiResponse } from 'next';

interface HelloResponse {
  message: string;
}

/**
 * GET /api/hello
 * Simple health check endpoint
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HelloResponse>
) {
  res.status(200).json({ message: 'API is running' });
}
