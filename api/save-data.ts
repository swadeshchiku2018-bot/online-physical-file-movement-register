import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

const RECIPIENTS_KEY = 'gov_file_register_recipients';
const FILES_KEY = 'gov_file_register_files';
const MOVEMENTS_KEY = 'gov_file_register_movements';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS check & headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { files, recipients, movements } = req.body;

    if (files !== undefined) {
      await kv.set(FILES_KEY, files);
    }
    if (recipients !== undefined) {
      await kv.set(RECIPIENTS_KEY, recipients);
    }
    if (movements !== undefined) {
      await kv.set(MOVEMENTS_KEY, movements);
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("KV save-data error:", error);
    return res.status(500).json({ error: error.message || "Failed to write to KV database" });
  }
}
