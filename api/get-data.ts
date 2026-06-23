import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool, initTables } from './db';

const DEFAULT_RECIPIENTS = [
  { id: 'REC-001', name: 'Priya Patel', designation: 'Section Officer', isRegistered: true, loginId: 'priya', password: 'password' },
  { id: 'REC-002', name: 'Amit Sharma', designation: 'Under Secretary', isRegistered: true, loginId: 'amit', password: 'password' },
  { id: 'REC-003', name: 'Rajesh Kumar', designation: 'Dealing Assistant', isRegistered: true, loginId: 'rajesh', password: 'password' },
  { id: 'REC-004', name: 'Sunita Rao', designation: 'Director (Finance)', isRegistered: true, loginId: 'sunita', password: 'password' },
];

const DEFAULT_FILES = [
  {
    id: 'GOV-2026-101',
    subject: 'Annual Budget Allocations FY 2026-27',
    department: 'Finance & Accounts Branch',
    currentHolderId: 'REC-004',
    status: 'Issued',
    createdDate: '2026-06-01T10:00:00Z',
    lastMovedDate: '2026-06-01T11:30:00Z',
    reason: 'Urgent budget review',
    anticipatedReturnDate: '2026-06-05T12:00:00Z'
  },
  {
    id: 'GOV-2026-102',
    subject: 'Procurement of Server Hardware & Firewalls',
    department: 'IT Infrastructure Division',
    currentHolderId: 'REC-003',
    status: 'Issued',
    createdDate: '2026-06-02T14:15:00Z',
    lastMovedDate: '2026-06-03T09:45:00Z',
    reason: 'Review supplier configurations',
    anticipatedReturnDate: '2026-06-15T18:00:00Z'
  },
  {
    id: 'GOV-2026-103',
    subject: 'Draft Proposal for New Pension Scheme Reforms',
    department: 'Establishment Section',
    currentHolderId: null,
    status: 'Returned',
    createdDate: '2026-06-04T09:00:00Z',
    lastMovedDate: '2026-06-06T16:20:00Z'
  }
];

const DEFAULT_MOVEMENTS = [
  {
    id: 'MOV-001',
    fileId: 'GOV-2026-101',
    fileSubject: 'Annual Budget Allocations FY 2026-27',
    senderId: 'Admin',
    senderName: 'Administrator',
    receiverId: 'REC-004',
    receiverName: 'Sunita Rao (Director)',
    timestamp: '2026-06-01T11:30:00Z',
    remarks: 'Approved budget draft enclosed for final clearance.',
    type: 'Issue',
    reason: 'Urgent budget review',
    anticipatedReturnDate: '2026-06-05T12:00:00Z'
  },
  {
    id: 'MOV-002',
    fileId: 'GOV-2026-102',
    fileSubject: 'Procurement of Server Hardware & Firewalls',
    senderId: 'Admin',
    senderName: 'Administrator',
    receiverId: 'REC-001',
    receiverName: 'Priya Patel (Section Officer)',
    timestamp: '2026-06-02T15:00:00Z',
    remarks: 'For review of tender bids.',
    type: 'Issue'
  },
  {
    id: 'MOV-003',
    fileId: 'GOV-2026-102',
    fileSubject: 'Procurement of Server Hardware & Firewalls',
    senderId: 'REC-001',
    senderName: 'Priya Patel',
    receiverId: 'REC-003',
    receiverName: 'Rajesh Kumar (Dealing Assistant)',
    timestamp: '2026-06-03T09:45:00Z',
    remarks: 'Forwarding with noting details. Please compile file comments.',
    type: 'Transfer',
    reason: 'Review supplier configurations',
    anticipatedReturnDate: '2026-06-15T18:00:00Z'
  },
  {
    id: 'MOV-004',
    fileId: 'GOV-2026-103',
    fileSubject: 'Draft Proposal for New Pension Scheme Reforms',
    senderId: 'Admin',
    senderName: 'Administrator',
    receiverId: 'REC-002',
    receiverName: 'Amit Sharma (Under Secretary)',
    timestamp: '2026-06-04T10:10:00Z',
    remarks: 'Urgent compliance review.',
    type: 'Issue'
  },
  {
    id: 'MOV-005',
    fileId: 'GOV-2026-103',
    fileSubject: 'Draft Proposal for New Pension Scheme Reforms',
    senderId: 'REC-002',
    senderName: 'Amit Sharma',
    receiverId: 'Admin',
    receiverName: 'Administrator',
    timestamp: '2026-06-06T16:20:00Z',
    remarks: 'Pension draft verified and returned to Admin record room.',
    type: 'Return'
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS check & headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Ensure tables exist
    await initTables();
    const pool = getPool();

    // 2. Check if recipients table is empty (which indicates seeding is required)
    const countRes = await pool.query('SELECT COUNT(*)::int as count FROM recipients');
    if (countRes.rows[0].count === 0) {
      console.log("Seeding default data in PostgreSQL database...");
      await pool.query('BEGIN');
      try {
        for (const r of DEFAULT_RECIPIENTS) {
          await pool.query(
            `INSERT INTO recipients (id, name, designation, is_registered, login_id, password)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [r.id, r.name, r.designation, r.isRegistered, r.loginId, r.password]
          );
        }
        for (const f of DEFAULT_FILES) {
          await pool.query(
            `INSERT INTO files (id, subject, department, current_holder_id, status, created_date, last_moved_date, reason, anticipated_return_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [f.id, f.subject, f.department, f.currentHolderId, f.status, f.createdDate, f.lastMovedDate, f.reason, f.anticipatedReturnDate]
          );
        }
        for (const m of DEFAULT_MOVEMENTS) {
          await pool.query(
            `INSERT INTO movements (id, file_id, file_subject, sender_id, sender_name, receiver_id, receiver_name, timestamp, remarks, type, reason, anticipated_return_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [m.id, m.fileId, m.fileSubject, m.senderId, m.senderName, m.receiverId, m.receiverName, m.timestamp, m.remarks, m.type, m.reason, m.anticipatedReturnDate]
          );
        }
        await pool.query('COMMIT');
      } catch (err) {
        await pool.query('ROLLBACK');
        throw err;
      }
    }

    // 3. Fetch data from PostgreSQL
    const recipientsRes = await pool.query('SELECT * FROM recipients');
    const filesRes = await pool.query('SELECT * FROM files');
    const movementsRes = await pool.query('SELECT * FROM movements');

    // 4. Map columns back to JSON model types
    const mappedRecipients = recipientsRes.rows.map(row => ({
      id: row.id,
      name: row.name,
      designation: row.designation,
      isRegistered: row.is_registered,
      loginId: row.login_id || undefined,
      password: row.password || undefined
    }));

    const mappedFiles = filesRes.rows.map(row => ({
      id: row.id,
      subject: row.subject,
      department: row.department,
      currentHolderId: row.current_holder_id,
      status: row.status,
      createdDate: row.created_date,
      lastMovedDate: row.last_moved_date,
      reason: row.reason || undefined,
      anticipatedReturnDate: row.anticipated_return_date || undefined
    }));

    const mappedMovements = movementsRes.rows.map(row => ({
      id: row.id,
      fileId: row.file_id,
      fileSubject: row.file_subject,
      senderId: row.sender_id,
      senderName: row.sender_name,
      receiverId: row.receiver_id,
      receiverName: row.receiver_name,
      timestamp: row.timestamp,
      remarks: row.remarks || '',
      type: row.type,
      reason: row.reason || undefined,
      anticipatedReturnDate: row.anticipated_return_date || undefined
    }));

    return res.status(200).json({
      files: mappedFiles,
      recipients: mappedRecipients,
      movements: mappedMovements
    });
  } catch (error: any) {
    console.error("Postgres get-data error:", error);
    return res.status(500).json({ error: error.message || "Failed to load PostgreSQL database" });
  }
}
