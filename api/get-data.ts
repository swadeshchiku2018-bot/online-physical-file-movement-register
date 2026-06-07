import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

const RECIPIENTS_KEY = 'gov_file_register_recipients';
const FILES_KEY = 'gov_file_register_files';
const MOVEMENTS_KEY = 'gov_file_register_movements';

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
    let recipients = await kv.get(RECIPIENTS_KEY);
    if (!recipients) {
      recipients = DEFAULT_RECIPIENTS;
      await kv.set(RECIPIENTS_KEY, DEFAULT_RECIPIENTS);
    }

    let files = await kv.get(FILES_KEY);
    if (!files) {
      files = DEFAULT_FILES;
      await kv.set(FILES_KEY, DEFAULT_FILES);
    }

    let movements = await kv.get(MOVEMENTS_KEY);
    if (!movements) {
      movements = DEFAULT_MOVEMENTS;
      await kv.set(MOVEMENTS_KEY, DEFAULT_MOVEMENTS);
    }

    return res.status(200).json({ files, recipients, movements });
  } catch (error: any) {
    console.error("KV get-data error:", error);
    return res.status(500).json({ error: error.message || "Failed to load KV database" });
  }
}
