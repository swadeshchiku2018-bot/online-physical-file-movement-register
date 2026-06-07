export interface FileItem {
  id: string; // Provided by admin
  subject: string;
  department: string;
  currentHolderId: string | null; // null means it is with Admin
  status: 'Issued' | 'Returned' | 'In Transit';
  createdDate: string;
  lastMovedDate: string;
}

export interface Recipient {
  id: string; // Unique ID (e.g., REC-001)
  name: string;
  designation: string;
  isRegistered: boolean; // false for temporary unregistered recipients added by Admin
}

export interface Movement {
  id: string;
  fileId: string;
  fileSubject: string;
  senderId: string | 'Admin';
  senderName: string;
  receiverId: string | 'Admin';
  receiverName: string;
  timestamp: string;
  remarks: string;
  type: 'Issue' | 'Transfer' | 'Return' | 'Receive';
}

const FILES_KEY = 'gov_file_register_files';
const RECIPIENTS_KEY = 'gov_file_register_recipients';
const MOVEMENTS_KEY = 'gov_file_register_movements';

// Seed Recipients
const DEFAULT_RECIPIENTS: Recipient[] = [
  { id: 'REC-001', name: 'Priya Patel', designation: 'Section Officer', isRegistered: true },
  { id: 'REC-002', name: 'Amit Sharma', designation: 'Under Secretary', isRegistered: true },
  { id: 'REC-003', name: 'Rajesh Kumar', designation: 'Dealing Assistant', isRegistered: true },
  { id: 'REC-004', name: 'Sunita Rao', designation: 'Director (Finance)', isRegistered: true },
];

// Seed Files
const DEFAULT_FILES: FileItem[] = [
  {
    id: 'GOV-2026-101',
    subject: 'Annual Budget Allocations FY 2026-27',
    department: 'Finance & Accounts',
    currentHolderId: 'REC-004',
    status: 'Issued',
    createdDate: '2026-06-01T10:00:00Z',
    lastMovedDate: '2026-06-01T11:30:00Z'
  },
  {
    id: 'GOV-2026-102',
    subject: 'Procurement of Server Hardware & Firewalls',
    department: 'IT Infrastructure',
    currentHolderId: 'REC-003',
    status: 'Issued',
    createdDate: '2026-06-02T14:15:00Z',
    lastMovedDate: '2026-06-03T09:45:00Z'
  },
  {
    id: 'GOV-2026-103',
    subject: 'Draft Proposal for New Pension Scheme Reforms',
    department: 'Establishment & Admin',
    currentHolderId: null,
    status: 'Returned',
    createdDate: '2026-06-04T09:00:00Z',
    lastMovedDate: '2026-06-06T16:20:00Z'
  }
];

// Seed Movements
const DEFAULT_MOVEMENTS: Movement[] = [
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
    type: 'Issue'
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
    type: 'Transfer'
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

export const initDB = () => {
  if (!localStorage.getItem(RECIPIENTS_KEY)) {
    localStorage.setItem(RECIPIENTS_KEY, JSON.stringify(DEFAULT_RECIPIENTS));
  }
  if (!localStorage.getItem(FILES_KEY)) {
    localStorage.setItem(FILES_KEY, JSON.stringify(DEFAULT_FILES));
  }
  if (!localStorage.getItem(MOVEMENTS_KEY)) {
    localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(DEFAULT_MOVEMENTS));
  }
};

// Recipients API
export const getRecipients = (): Recipient[] => {
  initDB();
  return JSON.parse(localStorage.getItem(RECIPIENTS_KEY) || '[]');
};

export const addRecipient = (name: string, designation: string, isRegistered = true): Recipient => {
  const recipients = getRecipients();
  const newId = `REC-${String(recipients.length + 1).padStart(3, '0')}`;
  const newRecipient: Recipient = { id: newId, name, designation, isRegistered };
  recipients.push(newRecipient);
  localStorage.setItem(RECIPIENTS_KEY, JSON.stringify(recipients));
  return newRecipient;
};

// Files API
export const getFiles = (): FileItem[] => {
  initDB();
  return JSON.parse(localStorage.getItem(FILES_KEY) || '[]');
};

export const getFileById = (id: string): FileItem | undefined => {
  const files = getFiles();
  return files.find(f => f.id.toLowerCase() === id.toLowerCase());
};

export const createFile = (id: string, subject: string, department: string): FileItem => {
  const files = getFiles();
  if (files.some(f => f.id.toLowerCase() === id.toLowerCase())) {
    throw new Error(`File ID "${id}" already exists.`);
  }
  const newFile: FileItem = {
    id,
    subject,
    department,
    currentHolderId: null,
    status: 'Returned',
    createdDate: new Date().toISOString(),
    lastMovedDate: new Date().toISOString()
  };
  files.unshift(newFile); // Add to beginning
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
  return newFile;
};

// Movements API
export const getMovements = (): Movement[] => {
  initDB();
  return JSON.parse(localStorage.getItem(MOVEMENTS_KEY) || '[]').sort(
    (a: Movement, b: Movement) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const issueFile = (fileId: string, receiverId: string, remarks: string): FileItem => {
  const files = getFiles();
  const fileIndex = files.findIndex(f => f.id.toLowerCase() === fileId.toLowerCase());
  if (fileIndex === -1) throw new Error('File not found.');

  const recipients = getRecipients();
  const receiver = recipients.find(r => r.id === receiverId);
  if (!receiver) throw new Error('Recipient not found.');

  const now = new Date().toISOString();
  files[fileIndex].currentHolderId = receiverId;
  files[fileIndex].status = 'Issued';
  files[fileIndex].lastMovedDate = now;

  localStorage.setItem(FILES_KEY, JSON.stringify(files));

  // Log movement
  const movements = getMovements();
  const newMovement: Movement = {
    id: `MOV-${String(movements.length + 1).padStart(3, '0')}`,
    fileId: files[fileIndex].id,
    fileSubject: files[fileIndex].subject,
    senderId: 'Admin',
    senderName: 'Administrator',
    receiverId: receiver.id,
    receiverName: `${receiver.name} (${receiver.designation})`,
    timestamp: now,
    remarks: remarks || 'File issued by Administrator.',
    type: 'Issue'
  };
  movements.unshift(newMovement);
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));

  return files[fileIndex];
};

export const transferFile = (
  fileId: string, 
  senderId: string, 
  receiverId: string | 'Admin', 
  remarks: string
): FileItem => {
  const files = getFiles();
  const fileIndex = files.findIndex(f => f.id.toLowerCase() === fileId.toLowerCase());
  if (fileIndex === -1) throw new Error('File not found.');

  const recipients = getRecipients();
  const sender = recipients.find(r => r.id === senderId);
  if (!sender) throw new Error('Sender not found.');

  let receiverName = 'Administrator';
  let receiverNameWithDesig = 'Administrator';
  let type: 'Transfer' | 'Return' = 'Transfer';

  if (receiverId === 'Admin') {
    files[fileIndex].currentHolderId = null;
    files[fileIndex].status = 'Returned';
    type = 'Return';
  } else {
    const receiver = recipients.find(r => r.id === receiverId);
    if (!receiver) throw new Error('Recipient not found.');
    files[fileIndex].currentHolderId = receiverId;
    files[fileIndex].status = 'Issued'; // Keep as issued (or active with another holder)
    receiverName = receiver.name;
    receiverNameWithDesig = `${receiver.name} (${receiver.designation})`;
  }

  const now = new Date().toISOString();
  files[fileIndex].lastMovedDate = now;
  localStorage.setItem(FILES_KEY, JSON.stringify(files));

  // Log movement
  const movements = getMovements();
  const newMovement: Movement = {
    id: `MOV-${String(movements.length + 1).padStart(3, '0')}`,
    fileId: files[fileIndex].id,
    fileSubject: files[fileIndex].subject,
    senderId: sender.id,
    senderName: `${sender.name} (${sender.designation})`,
    receiverId,
    receiverName: receiverNameWithDesig,
    timestamp: now,
    remarks: remarks || (type === 'Return' ? 'File returned to Admin.' : 'File forwarded.'),
    type
  };
  movements.unshift(newMovement);
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));

  return files[fileIndex];
};
