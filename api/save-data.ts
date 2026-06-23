import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool, initTables } from './db';

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

    await initTables();
    const pool = getPool();

    await pool.query('BEGIN');
    try {
      if (recipients !== undefined) {
        // 1. Upsert recipients in database
        for (const r of recipients) {
          await pool.query(
            `INSERT INTO recipients (id, name, designation, is_registered, login_id, password)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               designation = EXCLUDED.designation,
               is_registered = EXCLUDED.is_registered,
               login_id = EXCLUDED.login_id,
               password = EXCLUDED.password`,
            [r.id, r.name, r.designation, r.isRegistered, r.loginId || null, r.password || null]
          );
        }
        // 2. Delete recipients not in the incoming list
        if (recipients.length > 0) {
          const ids = recipients.map((r: any) => r.id);
          await pool.query(
            `DELETE FROM recipients WHERE id NOT IN (${ids.map((_, i) => `$${i + 1}`).join(', ')})`,
            ids
          );
        } else {
          await pool.query(`DELETE FROM recipients`);
        }
      }

      if (files !== undefined) {
        // 3. Upsert files in database
        for (const f of files) {
          await pool.query(
            `INSERT INTO files (id, subject, department, current_holder_id, status, created_date, last_moved_date, reason, anticipated_return_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET
               subject = EXCLUDED.subject,
               department = EXCLUDED.department,
               current_holder_id = EXCLUDED.current_holder_id,
               status = EXCLUDED.status,
               created_date = EXCLUDED.created_date,
               last_moved_date = EXCLUDED.last_moved_date,
               reason = EXCLUDED.reason,
               anticipated_return_date = EXCLUDED.anticipated_return_date`,
            [f.id, f.subject, f.department, f.currentHolderId || null, f.status, f.createdDate, f.lastMovedDate, f.reason || null, f.anticipatedReturnDate || null]
          );
        }
        // 4. Delete files not in the incoming list
        if (files.length > 0) {
          const ids = files.map((f: any) => f.id);
          await pool.query(
            `DELETE FROM files WHERE id NOT IN (${ids.map((_, i) => `$${i + 1}`).join(', ')})`,
            ids
          );
        } else {
          await pool.query(`DELETE FROM files`);
        }
      }

      if (movements !== undefined) {
        // 5. Upsert movements in database
        for (const m of movements) {
          await pool.query(
            `INSERT INTO movements (id, file_id, file_subject, sender_id, sender_name, receiver_id, receiver_name, timestamp, remarks, type, reason, anticipated_return_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO UPDATE SET
               file_id = EXCLUDED.file_id,
               file_subject = EXCLUDED.file_subject,
               sender_id = EXCLUDED.sender_id,
               sender_name = EXCLUDED.sender_name,
               receiver_id = EXCLUDED.receiver_id,
               receiver_name = EXCLUDED.receiver_name,
               timestamp = EXCLUDED.timestamp,
               remarks = EXCLUDED.remarks,
               type = EXCLUDED.type,
               reason = EXCLUDED.reason,
               anticipated_return_date = EXCLUDED.anticipated_return_date`,
            [m.id, m.fileId, m.fileSubject, m.senderId, m.senderName, m.receiverId, m.receiverName, m.timestamp, m.remarks || '', m.type, m.reason || null, m.anticipatedReturnDate || null]
          );
        }
        // 6. Delete movements not in the incoming list
        if (movements.length > 0) {
          const ids = movements.map((m: any) => m.id);
          await pool.query(
            `DELETE FROM movements WHERE id NOT IN (${ids.map((_, i) => `$${i + 1}`).join(', ')})`,
            ids
          );
        } else {
          await pool.query(`DELETE FROM movements`);
        }
      }

      await pool.query('COMMIT');
      return res.status(200).json({ success: true });
    } catch (err: any) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (error: any) {
    console.error("Postgres save-data error:", error);
    return res.status(500).json({ error: error.message || "Failed to write to PostgreSQL database" });
  }
}
