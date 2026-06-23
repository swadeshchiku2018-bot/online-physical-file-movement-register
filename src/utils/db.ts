export interface FileItem {
  id: string; // Provided by admin
  subject: string;
  department: string;
  currentHolderId: string | null; // null means it is with Admin
  status: 'Issued' | 'Returned' | 'In Transit';
  createdDate: string;
  lastMovedDate: string;
  reason?: string;
  anticipatedReturnDate?: string;
}

export interface Recipient {
  id: string; // Unique ID (e.g., REC-001)
  name: string;
  designation: string;
  isRegistered: boolean; // false for temporary unregistered recipients added by Admin
  loginId?: string;
  password?: string;
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
  reason?: string;
  anticipatedReturnDate?: string;
}

const FILES_KEY = 'gov_file_register_files';
const RECIPIENTS_KEY = 'gov_file_register_recipients';
const MOVEMENTS_KEY = 'gov_file_register_movements';

// Seed Recipients
const DEFAULT_RECIPIENTS: Recipient[] = [
  { id: 'REC-001', name: 'Priya Patel', designation: 'Section Officer', isRegistered: true, loginId: 'priya', password: 'password' },
  { id: 'REC-002', name: 'Amit Sharma', designation: 'Under Secretary', isRegistered: true, loginId: 'amit', password: 'password' },
  { id: 'REC-003', name: 'Rajesh Kumar', designation: 'Dealing Assistant', isRegistered: true, loginId: 'rajesh', password: 'password' },
  { id: 'REC-004', name: 'Sunita Rao', designation: 'Director (Finance)', isRegistered: true, loginId: 'sunita', password: 'password' },
];

// Seed Files (with GOV-2026-101 set to overdue)
const DEFAULT_FILES: FileItem[] = [
  {
    id: 'GOV-2026-101',
    subject: 'Annual Budget Allocations FY 2026-27',
    department: 'Finance & Accounts',
    currentHolderId: 'REC-004',
    status: 'Issued',
    createdDate: '2026-06-01T10:00:00Z',
    lastMovedDate: '2026-06-01T11:30:00Z',
    reason: 'Urgent budget review',
    anticipatedReturnDate: '2026-06-05T12:00:00Z' // Past date (overdue)
  },
  {
    id: 'GOV-2026-102',
    subject: 'Procurement of Server Hardware & Firewalls',
    department: 'IT Infrastructure',
    currentHolderId: 'REC-003',
    status: 'Issued',
    createdDate: '2026-06-02T14:15:00Z',
    lastMovedDate: '2026-06-03T09:45:00Z',
    reason: 'Review supplier configurations',
    anticipatedReturnDate: '2026-06-15T18:00:00Z' // Future date
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

let cachedFiles: FileItem[] = [];
let cachedRecipients: Recipient[] = [];
let cachedMovements: Movement[] = [];

// Helper to load from localStorage cache immediately
const loadLocalCache = () => {
  try {
    cachedFiles = JSON.parse(localStorage.getItem(FILES_KEY) || '[]');
    cachedRecipients = JSON.parse(localStorage.getItem(RECIPIENTS_KEY) || '[]');
    cachedMovements = JSON.parse(localStorage.getItem(MOVEMENTS_KEY) || '[]');
  } catch (e) {
    console.error("Error loading local cache:", e);
  }
};

const seedDefaultDataLocally = () => {
  cachedRecipients = DEFAULT_RECIPIENTS;
  cachedFiles = DEFAULT_FILES;
  cachedMovements = DEFAULT_MOVEMENTS;
  localStorage.setItem(RECIPIENTS_KEY, JSON.stringify(DEFAULT_RECIPIENTS));
  localStorage.setItem(FILES_KEY, JSON.stringify(DEFAULT_FILES));
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(DEFAULT_MOVEMENTS));
};

const saveRemoteData = async (payload: { files?: FileItem[], recipients?: Recipient[], movements?: Movement[] }) => {
  try {
    const response = await fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Save API responded with error status');
    console.log("Database sync with PostgreSQL successful!");
  } catch (error) {
    console.warn("Could not sync with PostgreSQL. Operating locally.", error);
  }
};

export const initDB = async (onSyncComplete?: () => void) => {
  // Load local cache immediately for fast render
  loadLocalCache();

  try {
    const response = await fetch('/api/get-data');
    if (!response.ok) throw new Error('Server returned error');
    
    const data = await response.json();
    
    const dbFiles: FileItem[] = data.files || [];
    const dbRecipients: Recipient[] = data.recipients || [];
    const dbMovements: Movement[] = data.movements || [];

    // --- CONFLICT RESOLUTION & MERGE LOGIC ---
    let diffDetected = false;

    // 1. Merge Recipients
    const mergedRecipientsMap = new Map<string, Recipient>();
    if (cachedRecipients.length === 0) {
      // Local storage empty: download all from DB
      dbRecipients.forEach(r => mergedRecipientsMap.set(r.id, r));
      if (dbRecipients.length > 0) {
        diffDetected = true;
      }
    } else {
      // Local storage not empty: use local storage as base
      cachedRecipients.forEach(r => mergedRecipientsMap.set(r.id, r));
      
      // If a recipient exists in DB but not in local storage, it was deleted locally.
      dbRecipients.forEach(dbRec => {
        if (!mergedRecipientsMap.has(dbRec.id)) {
          diffDetected = true; // Deleted locally, will delete from DB
        } else {
          // Exists in both: compare for updates
          const localRec = mergedRecipientsMap.get(dbRec.id)!;
          const hasDiff = 
            dbRec.name !== localRec.name || 
            dbRec.designation !== localRec.designation ||
            dbRec.isRegistered !== localRec.isRegistered ||
            dbRec.loginId !== localRec.loginId ||
            dbRec.password !== localRec.password;
          
          if (hasDiff) {
            mergedRecipientsMap.set(dbRec.id, localRec);
            diffDetected = true;
          }
        }
      });
    }
    const finalRecipients = Array.from(mergedRecipientsMap.values());

    // 2. Merge Files (Last-Write-Wins based on lastMovedDate)
    const mergedFilesMap = new Map<string, FileItem>();
    if (cachedFiles.length === 0) {
      dbFiles.forEach(f => mergedFilesMap.set(f.id, f));
      if (dbFiles.length > 0) {
        diffDetected = true;
      }
    } else {
      cachedFiles.forEach(f => mergedFilesMap.set(f.id, f));
      dbFiles.forEach(dbFile => {
        const localFile = mergedFilesMap.get(dbFile.id);
        if (!localFile) {
          mergedFilesMap.set(dbFile.id, dbFile);
          diffDetected = true;
        } else {
          const localTime = new Date(localFile.lastMovedDate).getTime();
          const dbTime = new Date(dbFile.lastMovedDate).getTime();
          if (localTime > dbTime) {
            mergedFilesMap.set(dbFile.id, localFile);
            diffDetected = true;
          } else if (dbTime > localTime) {
            mergedFilesMap.set(dbFile.id, dbFile);
            diffDetected = true;
          }
        }
      });
    }
    const finalFiles = Array.from(mergedFilesMap.values());

    // 3. Merge Movements (Append-only, union by id)
    const mergedMovementsMap = new Map<string, Movement>();
    if (cachedMovements.length === 0) {
      dbMovements.forEach(m => mergedMovementsMap.set(m.id, m));
      if (dbMovements.length > 0) {
        diffDetected = true;
      }
    } else {
      cachedMovements.forEach(m => mergedMovementsMap.set(m.id, m));
      dbMovements.forEach(dbMov => {
        if (!mergedMovementsMap.has(dbMov.id)) {
          mergedMovementsMap.set(dbMov.id, dbMov);
          diffDetected = true;
        }
      });
    }
    const finalMovements = Array.from(mergedMovementsMap.values()).sort(
      (a: Movement, b: Movement) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply merged results to local cache
    cachedFiles = finalFiles;
    cachedRecipients = finalRecipients;
    cachedMovements = finalMovements;

    // Save to localStorage cache
    localStorage.setItem(FILES_KEY, JSON.stringify(cachedFiles));
    localStorage.setItem(RECIPIENTS_KEY, JSON.stringify(cachedRecipients));
    localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(cachedMovements));

    // If local storage has records that are not in PostgreSQL, sync it
    if (diffDetected) {
      console.log("Local changes or conflicts resolved. Syncing merged data back to PostgreSQL...");
      await saveRemoteData({
        files: cachedFiles,
        recipients: cachedRecipients,
        movements: cachedMovements
      });
    }

    console.log("Synced remote database with PostgreSQL");
    if (onSyncComplete) onSyncComplete();
  } catch (err) {
    console.warn("Using offline localStorage fallback", err);
    if (cachedRecipients.length === 0 && cachedFiles.length === 0) {
      seedDefaultDataLocally();
      if (onSyncComplete) onSyncComplete();
    }
  }
};

// Recipients API
export const getRecipients = (): Recipient[] => {
  if (cachedRecipients.length === 0) {
    loadLocalCache();
  }
  return cachedRecipients;
};

export const addRecipient = (
  name: string, 
  designation: string, 
  isRegistered = true,
  loginId?: string,
  password?: string
): Recipient => {
  const newId = `REC-${String(cachedRecipients.length + 1).padStart(3, '0')}`;
  const finalLoginId = loginId || name.toLowerCase().replace(/\s+/g, '');
  const finalPassword = password || 'password';
  
  const newRecipient: Recipient = { 
    id: newId, 
    name, 
    designation, 
    isRegistered, 
    loginId: finalLoginId, 
    password: finalPassword 
  };
  
  cachedRecipients.push(newRecipient);
  localStorage.setItem(RECIPIENTS_KEY, JSON.stringify(cachedRecipients));
  
  // Background Sync
  saveRemoteData({ recipients: cachedRecipients });
  return newRecipient;
};

export const updateRecipient = (
  id: string,
  name: string,
  designation: string,
  loginId?: string,
  password?: string
): Recipient => {
  const index = cachedRecipients.findIndex(r => r.id === id);
  if (index === -1) throw new Error('Recipient not found.');
  
  cachedRecipients[index].name = name;
  cachedRecipients[index].designation = designation;
  if (loginId !== undefined) cachedRecipients[index].loginId = loginId;
  if (password !== undefined) cachedRecipients[index].password = password;
  
  localStorage.setItem(RECIPIENTS_KEY, JSON.stringify(cachedRecipients));
  
  // Background Sync
  saveRemoteData({ recipients: cachedRecipients });
  return cachedRecipients[index];
};

export const deleteRecipient = (id: string): void => {
  const exists = cachedRecipients.some(r => r.id === id);
  if (!exists) throw new Error('Recipient not found.');
  
  const files = getFiles();
  const holdsFile = files.some(f => f.status === 'Issued' && f.currentHolderId === id);
  if (holdsFile) {
    throw new Error('Cannot delete official because they currently hold one or more active files. Recall the files first.');
  }

  cachedRecipients = cachedRecipients.filter(r => r.id !== id);
  localStorage.setItem(RECIPIENTS_KEY, JSON.stringify(cachedRecipients));
  
  // Background Sync
  saveRemoteData({ recipients: cachedRecipients });
};

// Files API
export const getFiles = (): FileItem[] => {
  if (cachedFiles.length === 0) {
    loadLocalCache();
  }
  return cachedFiles;
};

export const getFileById = (id: string): FileItem | undefined => {
  const files = getFiles();
  return files.find(f => f.id.toLowerCase() === id.toLowerCase());
};

export const createFile = (id: string, subject: string, department: string): FileItem => {
  if (cachedFiles.some(f => f.id.toLowerCase() === id.toLowerCase())) {
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
  cachedFiles.unshift(newFile);
  localStorage.setItem(FILES_KEY, JSON.stringify(cachedFiles));
  
  // Background Sync
  saveRemoteData({ files: cachedFiles });
  return newFile;
};

// Movements API
export const getMovements = (): Movement[] => {
  if (cachedMovements.length === 0) {
    loadLocalCache();
  }
  return cachedMovements.slice().sort(
    (a: Movement, b: Movement) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const issueFile = (
  fileId: string, 
  receiverId: string, 
  remarks: string,
  reason?: string,
  anticipatedReturnDate?: string
): FileItem => {
  const fileIndex = cachedFiles.findIndex(f => f.id.toLowerCase() === fileId.toLowerCase());
  if (fileIndex === -1) throw new Error('File not found.');

  const receiver = cachedRecipients.find(r => r.id === receiverId);
  if (!receiver) throw new Error('Recipient not found.');

  const now = new Date().toISOString();
  cachedFiles[fileIndex].currentHolderId = receiverId;
  cachedFiles[fileIndex].status = 'Issued';
  cachedFiles[fileIndex].lastMovedDate = now;
  cachedFiles[fileIndex].reason = reason;
  cachedFiles[fileIndex].anticipatedReturnDate = anticipatedReturnDate;

  localStorage.setItem(FILES_KEY, JSON.stringify(cachedFiles));

  // Log movement
  const newMovement: Movement = {
    id: `MOV-${String(cachedMovements.length + 1).padStart(3, '0')}`,
    fileId: cachedFiles[fileIndex].id,
    fileSubject: cachedFiles[fileIndex].subject,
    senderId: 'Admin',
    senderName: 'Administrator',
    receiverId: receiver.id,
    receiverName: `${receiver.name} (${receiver.designation})`,
    timestamp: now,
    remarks: remarks || 'File issued by Administrator.',
    type: 'Issue',
    reason,
    anticipatedReturnDate
  };
  cachedMovements.unshift(newMovement);
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(cachedMovements));

  // Background Sync
  saveRemoteData({ files: cachedFiles, movements: cachedMovements });
  return cachedFiles[fileIndex];
};

export const transferFile = (
  fileId: string, 
  senderId: string, 
  receiverId: string | 'Admin', 
  remarks: string
): FileItem => {
  const fileIndex = cachedFiles.findIndex(f => f.id.toLowerCase() === fileId.toLowerCase());
  if (fileIndex === -1) throw new Error('File not found.');

  const sender = cachedRecipients.find(r => r.id === senderId);
  if (!sender) throw new Error('Sender not found.');

  let receiverName = 'Administrator';
  let receiverNameWithDesig = 'Administrator';
  let type: 'Transfer' | 'Return' = 'Transfer';

  if (receiverId === 'Admin') {
    cachedFiles[fileIndex].currentHolderId = null;
    cachedFiles[fileIndex].status = 'Returned';
    cachedFiles[fileIndex].reason = undefined;
    cachedFiles[fileIndex].anticipatedReturnDate = undefined;
    type = 'Return';
  } else {
    const receiver = cachedRecipients.find(r => r.id === receiverId);
    if (!receiver) throw new Error('Recipient not found.');
    cachedFiles[fileIndex].currentHolderId = receiverId;
    cachedFiles[fileIndex].status = 'Issued';
    receiverName = receiver.name;
    receiverNameWithDesig = `${receiver.name} (${receiver.designation})`;
  }

  const now = new Date().toISOString();
  cachedFiles[fileIndex].lastMovedDate = now;
  localStorage.setItem(FILES_KEY, JSON.stringify(cachedFiles));

  // Log movement
  const newMovement: Movement = {
    id: `MOV-${String(cachedMovements.length + 1).padStart(3, '0')}`,
    fileId: cachedFiles[fileIndex].id,
    fileSubject: cachedFiles[fileIndex].subject,
    senderId: sender.id,
    senderName: `${sender.name} (${sender.designation})`,
    receiverId,
    receiverName: receiverNameWithDesig,
    timestamp: now,
    remarks: remarks || (type === 'Return' ? 'File returned to Admin.' : 'File forwarded.'),
    type,
    reason: cachedFiles[fileIndex].reason,
    anticipatedReturnDate: cachedFiles[fileIndex].anticipatedReturnDate
  };
  cachedMovements.unshift(newMovement);
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(cachedMovements));

  // Background Sync
  saveRemoteData({ files: cachedFiles, movements: cachedMovements });
  return cachedFiles[fileIndex];
};

