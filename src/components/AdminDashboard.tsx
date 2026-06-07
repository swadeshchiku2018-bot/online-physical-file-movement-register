import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  FileItem, 
  Recipient, 
  Movement, 
  createFile, 
  addRecipient, 
  issueFile, 
  transferFile 
} from '../utils/db';
import { 
  Plus, 
  PlusCircle, 
  Search, 
  FileText, 
  History, 
  UserPlus, 
  Users, 
  QrCode, 
  TrendingUp, 
  FileCheck, 
  Clock, 
  Download,
  ShieldAlert,
  Send,
  CornerUpLeft,
  Lock,
  User,
  Settings,
  Building,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onActionComplete: (msg: string, isError?: boolean) => void;
  filesList: FileItem[];
  recipientsList: Recipient[];
  movementsList: Movement[];
  refreshData: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  orgName: string;
  setOrgName: (name: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onActionComplete,
  filesList,
  recipientsList,
  movementsList,
  refreshData,
  activeTab,
  setActiveTab,
  orgName,
  setOrgName
}) => {
  // Local register sub-tab (Catalog, History, Recipients)
  const [registerSubTab, setRegisterSubTab] = useState<'files' | 'history' | 'recipients'>('files');

  // File Creation form state
  const [fileId, setFileId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [department, setDepartment] = useState<string>('');

  // Recipient Creation state with custom credentials
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientDesignation, setRecipientDesignation] = useState<string>('');
  const [recipientLoginId, setRecipientLoginId] = useState<string>('');
  const [recipientPassword, setRecipientPassword] = useState<string>('');

  // Preference Settings state
  const [adminLoginId, setAdminLoginId] = useState<string>(() => localStorage.getItem('gov_file_register_admin_id') || 'admin');
  const [adminPassword, setAdminPassword] = useState<string>(() => localStorage.getItem('gov_file_register_admin_pass') || 'admin');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState<string>('');
  const [prefOrgName, setPrefOrgName] = useState<string>(orgName);

  // Sync preference Org Name when the prop changes
  useEffect(() => {
    setPrefOrgName(orgName);
  }, [orgName]);

  // Issue File Tab States
  const [issueMode, setIssueMode] = useState<'search' | 'create'>('search');
  const [issueFileSearchQuery, setIssueFileSearchQuery] = useState<string>('');
  const [selectedExistingFile, setSelectedExistingFile] = useState<FileItem | null>(null);
  
  // Issue File: New file creation states
  const [newFileId, setNewFileId] = useState<string>('');
  const [newFileSubject, setNewFileSubject] = useState<string>('');
  const [newFileDepartment, setNewFileDepartment] = useState<string>('');

  // Issue File: Recipient states
  const [issueRecipientName, setIssueRecipientName] = useState<string>('');
  const [issueRecipientDesignation, setIssueRecipientDesignation] = useState<string>('');
  const [issueReasonText, setIssueReasonText] = useState<string>('');
  const [issueAnticipatedDeadline, setIssueAnticipatedDeadline] = useState<string>('');
  const [issueSpecificRemarks, setIssueSpecificRemarks] = useState<string>('');

  // Search & Filter states
  const [fileSearch, setFileSearch] = useState<string>('');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilterType, setHistoryFilterType] = useState<string>('ALL');

  // Column Filter States - File Catalog
  const [colFileIdVal, setColFileIdVal] = useState('');
  const [colFileIdActive, setColFileIdActive] = useState('');
  const [colSubjectVal, setColSubjectVal] = useState('');
  const [colSubjectActive, setColSubjectActive] = useState('');
  const [colDeptVal, setColDeptVal] = useState('');
  const [colDeptActive, setColDeptActive] = useState('');
  const [colCustodianVal, setColCustodianVal] = useState('');
  const [colCustodianActive, setColCustodianActive] = useState('');
  const [colStatusVal, setColStatusVal] = useState('');
  const [colStatusActive, setColStatusActive] = useState('');

  // Column Filter States - Movement History
  const [colHistTimeVal, setColHistTimeVal] = useState('');
  const [colHistTimeActive, setColHistTimeActive] = useState('');
  const [colHistFileVal, setColHistFileVal] = useState('');
  const [colHistFileActive, setColHistFileActive] = useState('');
  const [colHistFromVal, setColHistFromVal] = useState('');
  const [colHistFromActive, setColHistFromActive] = useState('');
  const [colHistToVal, setColHistToVal] = useState('');
  const [colHistToActive, setColHistToActive] = useState('');
  const [colHistActionVal, setColHistActionVal] = useState('');
  const [colHistActionActive, setColHistActionActive] = useState('');
  const [colHistRemarksVal, setColHistRemarksVal] = useState('');
  const [colHistRemarksActive, setColHistRemarksActive] = useState('');

  // Column Filter States - Officials
  const [colOffIdVal, setColOffIdVal] = useState('');
  const [colOffIdActive, setColOffIdActive] = useState('');
  const [colOffNameVal, setColOffNameVal] = useState('');
  const [colOffNameActive, setColOffNameActive] = useState('');
  const [colOffDesigVal, setColOffDesigVal] = useState('');
  const [colOffDesigActive, setColOffDesigActive] = useState('');
  const [colOffLoginVal, setColOffLoginVal] = useState('');
  const [colOffLoginActive, setColOffLoginActive] = useState('');
  const [colOffStatusVal, setColOffStatusVal] = useState('');
  const [colOffStatusActive, setColOffStatusActive] = useState('');

  // QR Modal state
  const [qrModalFile, setQrModalFile] = useState<FileItem | null>(null);
  const [qrModalCodeUrl, setQrModalCodeUrl] = useState<string>('');

  // Issue File Modal state (from registers catalog table click)
  const [issueModalFile, setIssueModalFile] = useState<FileItem | null>(null);
  const [issueName, setIssueName] = useState<string>('');
  const [issueDesignation, setIssueDesignation] = useState<string>('');
  const [issueReason, setIssueReason] = useState<string>('');
  const [issueDeadline, setIssueDeadline] = useState<string>('');

  // Live timer for elapsed calculation
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Stats
  const totalFiles = filesList.length;
  const issuedFiles = filesList.filter(f => f.status === 'Issued').length;
  const returnedFiles = filesList.filter(f => f.status === 'Returned').length;

  // Generate QR Code URL when Modal opens
  useEffect(() => {
    if (qrModalFile) {
      QRCode.toDataURL(qrModalFile.id, { width: 200, margin: 2 })
        .then(url => setQrModalCodeUrl(url))
        .catch(err => console.error("Error creating QR", err));
    } else {
      setQrModalCodeUrl('');
    }
  }, [qrModalFile]);

  // Handle File Registration
  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileId.trim() || !subject.trim() || !department.trim()) {
      onActionComplete('Please fill in all file fields.', true);
      return;
    }
    
    try {
      createFile(fileId.trim(), subject.trim(), department.trim());
      refreshData();
      onActionComplete(`File "${fileId}" registered successfully in the database!`);
      // Clear inputs
      setFileId('');
      setSubject('');
      setDepartment('');
      setActiveTab('registers'); // Redirect to register catalog
    } catch (err: any) {
      onActionComplete(err.message || 'Error creating file.', true);
    }
  };

  // Handle Recipient Creation with custom credentials
  const handleCreateRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientDesignation.trim()) {
      onActionComplete('Please enter name and designation.', true);
      return;
    }

    try {
      const newRec = addRecipient(
        recipientName.trim(), 
        recipientDesignation.trim(), 
        true,
        recipientLoginId.trim() || undefined,
        recipientPassword.trim() || undefined
      );
      refreshData();
      
      const credentialsInfo = `Login ID: ${newRec.loginId}, Password: ${newRec.password || 'password'}`;
      onActionComplete(`Recipient "${newRec.name}" enrolled. Credentials -> ${credentialsInfo}`);
      
      // Clear inputs
      setRecipientName('');
      setRecipientDesignation('');
      setRecipientLoginId('');
      setRecipientPassword('');
      setActiveTab('registers'); // Redirect to list
    } catch (err: any) {
      onActionComplete(err.message || 'Error creating recipient.', true);
    }
  };

  // Save Preferences settings
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminLoginId.trim() || !prefOrgName.trim()) {
      onActionComplete('Admin ID and Organisation Name cannot be blank.', true);
      return;
    }

    if (adminPassword && adminPassword !== adminConfirmPassword) {
      onActionComplete('Passwords do not match.', true);
      return;
    }

    localStorage.setItem('gov_file_register_admin_id', adminLoginId.trim());
    if (adminPassword) {
      localStorage.setItem('gov_file_register_admin_pass', adminPassword);
    }
    localStorage.setItem('gov_file_register_org_name', prefOrgName.trim());
    setOrgName(prefOrgName.trim());
    setAdminConfirmPassword('');
    onActionComplete('Preferences updated successfully!');
  };

  // Handle issue file tab action (dynamic search or create)
  const handleIssueFileTabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetFileId = '';

    if (issueMode === 'create') {
      if (!newFileId.trim() || !newFileSubject.trim() || !newFileDepartment.trim()) {
        onActionComplete('Please fill in all fields to register the new file.', true);
        return;
      }
      if (filesList.some(f => f.id.toLowerCase() === newFileId.trim().toLowerCase())) {
        onActionComplete(`File ID "${newFileId.trim()}" already exists in the catalog.`, true);
        return;
      }
      
      try {
        createFile(newFileId.trim(), newFileSubject.trim(), newFileDepartment.trim());
        targetFileId = newFileId.trim();
      } catch (err: any) {
        onActionComplete(err.message || 'Error creating file.', true);
        return;
      }
    } else {
      if (!selectedExistingFile) {
        onActionComplete('Please search and select an active file to issue.', true);
        return;
      }
      if (selectedExistingFile.status === 'Issued') {
        onActionComplete(`File "${selectedExistingFile.id}" is already issued. Recall it first.`, true);
        return;
      }
      targetFileId = selectedExistingFile.id;
    }

    if (!issueRecipientName.trim() || !issueRecipientDesignation.trim() || !issueReasonText.trim() || !issueAnticipatedDeadline) {
      onActionComplete('Recipient Name, Designation, Reason, and return date are required.', true);
      return;
    }

    try {
      // Find or create recipient profile
      const existingRec = recipientsList.find(r => 
        r.name.toLowerCase() === issueRecipientName.trim().toLowerCase() && 
        r.designation.toLowerCase() === issueRecipientDesignation.trim().toLowerCase()
      );
      
      let finalReceiverId = '';
      if (existingRec) {
        finalReceiverId = existingRec.id;
      } else {
        const newRec = addRecipient(issueRecipientName.trim(), issueRecipientDesignation.trim(), false);
        finalReceiverId = newRec.id;
      }

      issueFile(
        targetFileId, 
        finalReceiverId, 
        issueSpecificRemarks.trim() || `Issued via Issue File tab. Reason: ${issueReasonText.trim()}`, 
        issueReasonText.trim(), 
        new Date(issueAnticipatedDeadline).toISOString()
      );

      refreshData();
      onActionComplete(`File "${targetFileId}" issued successfully to ${issueRecipientName.trim()}`);
      
      // Reset states
      setIssueMode('search');
      setIssueFileSearchQuery('');
      setSelectedExistingFile(null);
      setNewFileId('');
      setNewFileSubject('');
      setNewFileDepartment('');
      setIssueRecipientName('');
      setIssueRecipientDesignation('');
      setIssueReasonText('');
      setIssueAnticipatedDeadline('');
      setIssueSpecificRemarks('');
      
      setActiveTab('registers'); // Redirect to registers
    } catch (err: any) {
      onActionComplete(err.message || 'Error issuing file.', true);
    }
  };

  // Check if file is overdue
  const isFileOverdue = (file: FileItem) => {
    return file.status === 'Issued' && 
           file.anticipatedReturnDate && 
           currentTime > new Date(file.anticipatedReturnDate);
  };

  // Find holder name helper
  const getHolderName = (holderId: string | null) => {
    if (!holderId) return 'Record Room (Admin)';
    const rec = recipientsList.find(r => r.id === holderId);
    return rec ? `${rec.name} (${rec.designation})` : 'Unknown';
  };

  // Calculate elapsed time text
  const getElapsedTimeText = (startDateStr: string) => {
    const elapsedMs = currentTime.getTime() - new Date(startDateStr).getTime();
    if (elapsedMs < 0) return '0m';
    const mins = Math.floor(elapsedMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    return `${mins}m`;
  };

  // Open Issue Modal for a specific file
  const openIssueModal = (file: FileItem) => {
    setIssueModalFile(file);
    setIssueName('');
    setIssueDesignation('');
    setIssueReason('');
    setIssueDeadline('');
  };

  // Handle direct file issuing via modal
  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueModalFile) return;
    if (!issueName.trim() || !issueDesignation.trim() || !issueReason.trim() || !issueDeadline) {
      onActionComplete('All issue fields are required.', true);
      return;
    }

    try {
      // Find or create the recipient
      const existingRec = recipientsList.find(r => 
        r.name.toLowerCase() === issueName.trim().toLowerCase() && 
        r.designation.toLowerCase() === issueDesignation.trim().toLowerCase()
      );
      
      let finalReceiverId = '';
      if (existingRec) {
        finalReceiverId = existingRec.id;
      } else {
        const newRec = addRecipient(issueName.trim(), issueDesignation.trim(), false);
        finalReceiverId = newRec.id;
      }

      issueFile(
        issueModalFile.id, 
        finalReceiverId, 
        `Issued directly via Admin Dashboard. Reason: ${issueReason.trim()}`, 
        issueReason.trim(), 
        new Date(issueDeadline).toISOString()
      );
      
      refreshData();
      onActionComplete(`File "${issueModalFile.id}" successfully issued to ${issueName.trim()}`);
      setIssueModalFile(null);
    } catch (err: any) {
      onActionComplete(err.message || 'Error issuing file.', true);
    }
  };

  // Handle direct file return / recall
  const handleDirectReturn = (fileId: string) => {
    try {
      // Find current holder
      const file = filesList.find(f => f.id === fileId);
      if (!file || !file.currentHolderId) return;

      transferFile(fileId, file.currentHolderId, 'Admin', 'Force returned to Record Room by Administrator.');
      refreshData();
      onActionComplete(`File "${fileId}" recalled successfully.`);
    } catch (err: any) {
      onActionComplete(err.message || 'Error returning file.', true);
    }
  };

  const handleClearColumnFilters = () => {
    if (registerSubTab === 'files') {
      setColFileIdVal('');
      setColFileIdActive('');
      setColSubjectVal('');
      setColSubjectActive('');
      setColDeptVal('');
      setColDeptActive('');
      setColCustodianVal('');
      setColCustodianActive('');
      setColStatusVal('');
      setColStatusActive('');
    } else if (registerSubTab === 'history') {
      setColHistTimeVal('');
      setColHistTimeActive('');
      setColHistFileVal('');
      setColHistFileActive('');
      setColHistFromVal('');
      setColHistFromActive('');
      setColHistToVal('');
      setColHistToActive('');
      setColHistActionVal('');
      setColHistActionActive('');
      setColHistRemarksVal('');
      setColHistRemarksActive('');
    } else {
      setColOffIdVal('');
      setColOffIdActive('');
      setColOffNameVal('');
      setColOffNameActive('');
      setColOffDesigVal('');
      setColOffDesigActive('');
      setColOffLoginVal('');
      setColOffLoginActive('');
      setColOffStatusVal('');
      setColOffStatusActive('');
    }
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (registerSubTab === 'files') {
      headers = ['File ID', 'Subject Detail', 'Department/Section', 'Custodian', 'Status', 'Last Moved Date', 'Promise Return Date', 'Reason'];
      rows = filteredFiles.map(f => [
        f.id,
        f.subject,
        f.department,
        getHolderName(f.currentHolderId),
        f.status,
        f.lastMovedDate ? new Date(f.lastMovedDate).toLocaleString() : 'N/A',
        f.anticipatedReturnDate ? new Date(f.anticipatedReturnDate).toLocaleString() : 'N/A',
        f.reason || 'N/A'
      ]);
      filename = 'Digital_File_Movement_Ledger_Catalog.csv';
    } else if (registerSubTab === 'history') {
      headers = ['Action Time', 'File ID', 'Subject', 'From (Sender)', 'To (Receiver)', 'Action Type', 'Remarks'];
      rows = filteredHistory.map(m => [
        new Date(m.timestamp).toLocaleString(),
        m.fileId,
        m.fileSubject,
        m.senderName,
        m.receiverName,
        m.type,
        m.remarks
      ]);
      filename = 'Digital_File_Movement_Ledger_History.csv';
    } else {
      headers = ['Recipient ID', 'Full Name', 'Designation', 'Login ID', 'Registration Status'];
      rows = filteredOfficials.map(r => [
        r.id,
        r.name,
        r.designation,
        r.loginId || 'N/A',
        r.isRegistered ? 'Registered Profile' : 'Guest Custodian'
      ]);
      filename = 'Digital_File_Movement_Officials.csv';
    }

    // Convert to CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const cleanVal = String(val).replace(/"/g, '""');
        return `"${cleanVal}"`;
      }).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onActionComplete(`Data exported successfully to ${filename}`);
  };

  const renderColumnFilterInput = (
    value: string, 
    setValue: (v: string) => void, 
    setActive: (v: string) => void, 
    placeholder: string
  ) => {
    return (
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', minWidth: '90px' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setActive(value);
            }
          }}
          style={{ fontSize: '11px', padding: '4px 6px', height: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}
        />
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={() => setActive(value)}
          style={{ width: 'auto', padding: '0 6px', height: '24px', fontSize: '10px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          OK
        </button>
      </div>
    );
  };

  // Filters
  const filteredFiles = filesList.filter(f => {
    const matchesSearch = !fileSearch || 
                          f.id.toLowerCase().includes(fileSearch.toLowerCase()) ||
                          f.subject.toLowerCase().includes(fileSearch.toLowerCase()) ||
                          f.department.toLowerCase().includes(fileSearch.toLowerCase());
    
    const matchesId = !colFileIdActive || f.id.toLowerCase().includes(colFileIdActive.toLowerCase());
    const matchesSubject = !colSubjectActive || f.subject.toLowerCase().includes(colSubjectActive.toLowerCase());
    const matchesDept = !colDeptActive || f.department.toLowerCase().includes(colDeptActive.toLowerCase());
    const matchesCustodian = !colCustodianActive || getHolderName(f.currentHolderId).toLowerCase().includes(colCustodianActive.toLowerCase());
    const matchesStatus = !colStatusActive || f.status.toLowerCase().includes(colStatusActive.toLowerCase());
    
    return matchesSearch && matchesId && matchesSubject && matchesDept && matchesCustodian && matchesStatus;
  });

  const filteredHistory = movementsList.filter(m => {
    const matchesSearch = !historySearch || 
                          m.fileId.toLowerCase().includes(historySearch.toLowerCase()) ||
                          m.fileSubject.toLowerCase().includes(historySearch.toLowerCase()) ||
                          m.senderName.toLowerCase().includes(historySearch.toLowerCase()) ||
                          m.receiverName.toLowerCase().includes(historySearch.toLowerCase());
    
    const matchesFilter = historyFilterType === 'ALL' || m.type.toUpperCase() === historyFilterType;
    
    const matchesTime = !colHistTimeActive || new Date(m.timestamp).toLocaleString().toLowerCase().includes(colHistTimeActive.toLowerCase());
    const matchesFile = !colHistFileActive || 
                        (m.fileId.toLowerCase().includes(colHistFileActive.toLowerCase()) || 
                         m.fileSubject.toLowerCase().includes(colHistFileActive.toLowerCase()));
    const matchesFrom = !colHistFromActive || m.senderName.toLowerCase().includes(colHistFromActive.toLowerCase());
    const matchesTo = !colHistToActive || m.receiverName.toLowerCase().includes(colHistToActive.toLowerCase());
    const matchesAction = !colHistActionActive || m.type.toLowerCase().includes(colHistActionActive.toLowerCase());
    const matchesRemarks = !colHistRemarksActive || m.remarks.toLowerCase().includes(colHistRemarksActive.toLowerCase());
    
    return matchesSearch && matchesFilter && matchesTime && matchesFile && matchesFrom && matchesTo && matchesAction && matchesRemarks;
  });

  const filteredOfficials = recipientsList.filter(r => {
    const matchesId = !colOffIdActive || r.id.toLowerCase().includes(colOffIdActive.toLowerCase());
    const matchesName = !colOffNameActive || r.name.toLowerCase().includes(colOffNameActive.toLowerCase());
    const matchesDesig = !colOffDesigActive || r.designation.toLowerCase().includes(colOffDesigActive.toLowerCase());
    const matchesLogin = !colOffLoginActive || (r.loginId || 'n/a').toLowerCase().includes(colOffLoginActive.toLowerCase());
    const matchesStatus = !colOffStatusActive || 
                          (r.isRegistered ? 'registered profile' : 'guest custodian').includes(colOffStatusActive.toLowerCase());
    
    return matchesId && matchesName && matchesDesig && matchesLogin && matchesStatus;
  });

  // Filter issue files search results
  const filteredIssueFilesSearch = filesList.filter(f => 
    f.status === 'Returned' && 
    (f.id.toLowerCase().includes(issueFileSearchQuery.toLowerCase()) ||
     f.subject.toLowerCase().includes(issueFileSearchQuery.toLowerCase()))
  );

  // Pending files list
  const pendingFiles = filesList.filter(f => f.status === 'Issued');
  const overdueFiles = pendingFiles.filter(f => isFileOverdue(f));

  return (
    <div className="view-container">
      
      {/* Tab 1: OVERVIEW DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="stats-grid">
            <div className="glass-panel stat-card" style={{ cursor: 'pointer' }} onClick={() => { setRegisterSubTab('files'); setActiveTab('registers'); }}>
              <div className="stat-info">
                <h3>Total Registered Files</h3>
                <p>{totalFiles}</p>
              </div>
              <div className="stat-icon total">
                <FileText size={24} />
              </div>
            </div>

            <div className="glass-panel stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('alerts')}>
              <div className="stat-info">
                <h3>Issued Files (Pending)</h3>
                <p>{issuedFiles}</p>
              </div>
              <div className="stat-icon issued">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="glass-panel stat-card" style={{ cursor: 'pointer' }} onClick={() => { setRegisterSubTab('files'); setActiveTab('registers'); }}>
              <div className="stat-info">
                <h3>Safe in Record Room</h3>
                <p>{returnedFiles}</p>
              </div>
              <div className="stat-icon returned">
                <FileCheck size={24} />
              </div>
            </div>

            <div className="glass-panel stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('alerts')}>
              <div className="stat-info">
                <h3>Overdue Warnings</h3>
                <p style={{ color: overdueFiles.length > 0 ? '#f87171' : 'var(--text-main)' }}>{overdueFiles.length}</p>
              </div>
              <div className="stat-icon pending" style={{ background: overdueFiles.length > 0 ? 'var(--accent-red-glow)' : 'rgba(255,255,255,0.05)', color: overdueFiles.length > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                <ShieldAlert size={24} />
              </div>
            </div>
          </div>

          {/* Quick Logs Summary in Dashboard */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="card-header" style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3><History size={18} className="text-gold" /> Recent Movements Summary</h3>
              <button className="btn btn-secondary" onClick={() => { setRegisterSubTab('history'); setActiveTab('registers'); }} style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}>
                View All Register Logs
              </button>
            </div>
            <div className="card-body" style={{ padding: '16px 0 0 0' }}>
              <div className="table-container">
                <table className="data-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>File ID</th>
                      <th>Sender</th>
                      <th>Receiver</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementsList.slice(0, 5).map(m => (
                      <tr key={m.id}>
                        <td>{new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{m.fileId}</td>
                        <td>{m.senderName}</td>
                        <td>{m.receiverName}</td>
                        <td>
                          <span className={`status-pill ${m.type.toLowerCase() === 'issue' ? 'issued' : m.type.toLowerCase() === 'return' ? 'returned' : 'transit'}`}>
                            {m.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {movementsList.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                          No movement logs recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: MASTER LEDGER (File Catalog, History, Officials List) */}
      {activeTab === 'registers' && (
        <div className="glass-panel">
          <div className="card-header" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px' }}><FileText size={20} className="text-gold" /> Master Ledger Catalog</h3>
              
              {/* Internal Tab switcher */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={`btn btn-secondary ${registerSubTab === 'files' ? 'active' : ''}`}
                  onClick={() => { setRegisterSubTab('files'); handleClearColumnFilters(); }}
                  style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                >
                  File Catalog
                </button>
                <button 
                  className={`btn btn-secondary ${registerSubTab === 'history' ? 'active' : ''}`}
                  onClick={() => { setRegisterSubTab('history'); handleClearColumnFilters(); }}
                  style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                >
                  Movement History
                </button>
                <button 
                  className={`btn btn-secondary ${registerSubTab === 'recipients' ? 'active' : ''}`}
                  onClick={() => { setRegisterSubTab('recipients'); handleClearColumnFilters(); }}
                  style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                >
                  Registered Officials
                </button>
              </div>
            </div>

            {/* Sub-Tab Controls (Searches) */}
            {registerSubTab === 'files' && (
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Global search file index by ID, subject, or department..." 
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            )}

            {registerSubTab === 'history' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Global search movement history logs..." 
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
                <select
                  className="input-field select-field"
                  value={historyFilterType}
                  onChange={(e) => setHistoryFilterType(e.target.value)}
                  style={{ width: '160px' }}
                >
                  <option value="ALL">All Actions</option>
                  <option value="ISSUE">Issues</option>
                  <option value="TRANSFER">Transfers</option>
                  <option value="RETURN">Returns</option>
                </select>
              </div>
            )}
          </div>

          {/* Excel-like Status Control Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {registerSubTab === 'files' && `Showing ${filteredFiles.length} of ${filesList.length} files (Apply column filters below and hit OK)`}
              {registerSubTab === 'history' && `Showing ${filteredHistory.length} of ${movementsList.length} logs (Apply column filters below and hit OK)`}
              {registerSubTab === 'recipients' && `Showing ${filteredOfficials.length} of ${recipientsList.length} officials (Apply column filters below and hit OK)`}
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-secondary"
                onClick={handleClearColumnFilters}
                style={{ width: 'auto', padding: '6px 12px', height: '32px', fontSize: '12px' }}
              >
                Reset Column Filters
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleExportCSV}
                style={{ width: 'auto', padding: '6px 16px', height: '32px', fontSize: '12px', background: 'linear-gradient(135deg, var(--primary), #059669)', color: 'white' }}
              >
                <Download size={13} /> Export Current View
              </button>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            
            {/* View 1: Files Table */}
            {registerSubTab === 'files' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>File ID</th>
                      <th>Subject Detail</th>
                      <th>Department</th>
                      <th>Custodian</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                    <tr className="filter-header-row" style={{ background: 'rgba(0,0,0,0.15)' }}>
                      <td>{renderColumnFilterInput(colFileIdVal, setColFileIdVal, setColFileIdActive, 'Filter ID...')}</td>
                      <td>{renderColumnFilterInput(colSubjectVal, setColSubjectVal, setColSubjectActive, 'Filter Subject...')}</td>
                      <td>{renderColumnFilterInput(colDeptVal, setColDeptVal, setColDeptActive, 'Filter Section...')}</td>
                      <td>{renderColumnFilterInput(colCustodianVal, setColCustodianVal, setColCustodianActive, 'Filter Custodian...')}</td>
                      <td>{renderColumnFilterInput(colStatusVal, setColStatusVal, setColStatusActive, 'Filter Status...')}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>Column Filters</td>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => {
                      const overdue = isFileOverdue(file);
                      return (
                        <tr key={file.id} className={overdue ? 'overdue-row bg-overdue' : ''}>
                          <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{file.id}</td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{file.subject}</div>
                            {file.status === 'Issued' && file.anticipatedReturnDate && (
                              <div style={{ fontSize: '11px', color: overdue ? '#ef4444' : 'var(--text-muted)', marginTop: '2px' }}>
                                Promise Return: {new Date(file.anticipatedReturnDate).toLocaleDateString()} {new Date(file.anticipatedReturnDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                            {file.status === 'Issued' && file.reason && (
                              <div style={{ fontSize: '10px', color: 'var(--text-muted-dark)', fontStyle: 'italic', marginTop: '2px' }}>
                                Reason: "{file.reason}"
                              </div>
                            )}
                          </td>
                          <td><span style={{ fontSize: '12px', opacity: 0.85 }}>{file.department}</span></td>
                          <td>{getHolderName(file.currentHolderId)}</td>
                          <td>
                            {overdue ? (
                              <span className="status-pill overdue">OVERDUE</span>
                            ) : (
                              <span className={`status-pill ${file.status.toLowerCase().replace(' ', '')}`}>
                                {file.status}
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                className="btn btn-secondary"
                                onClick={() => setQrModalFile(file)}
                                style={{ width: 'auto', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Generate QR Tag"
                              >
                                <QrCode size={13} /> QR
                              </button>
                              
                              {file.status === 'Returned' ? (
                                <button 
                                  className="btn btn-accent"
                                  onClick={() => openIssueModal(file)}
                                  style={{ width: 'auto', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: 'var(--primary)', color: 'white' }}
                                >
                                  <Send size={13} /> Issue
                                </button>
                              ) : (
                                <button 
                                  className="btn btn-secondary"
                                  onClick={() => handleDirectReturn(file.id)}
                                  style={{ width: 'auto', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', borderColor: overdue ? 'rgba(239, 68, 68, 0.4)' : '', color: overdue ? '#f87171' : '' }}
                                >
                                  <CornerUpLeft size={13} /> Recall
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredFiles.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No files match the search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
 
            {/* View 2: History Register Table */}
            {registerSubTab === 'history' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Action Time</th>
                      <th>File ID & Subject</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Action</th>
                      <th>Remarks</th>
                    </tr>
                    <tr className="filter-header-row" style={{ background: 'rgba(0,0,0,0.15)' }}>
                      <td>{renderColumnFilterInput(colHistTimeVal, setColHistTimeVal, setColHistTimeActive, 'Filter Date...')}</td>
                      <td>{renderColumnFilterInput(colHistFileVal, setColHistFileVal, setColHistFileActive, 'Filter File...')}</td>
                      <td>{renderColumnFilterInput(colHistFromVal, setColHistFromVal, setColHistFromActive, 'Filter Sender...')}</td>
                      <td>{renderColumnFilterInput(colHistToVal, setColHistToVal, setColHistToActive, 'Filter Receiver...')}</td>
                      <td>{renderColumnFilterInput(colHistActionVal, setColHistActionVal, setColHistActionActive, 'Filter Action...')}</td>
                      <td>{renderColumnFilterInput(colHistRemarksVal, setColHistRemarksVal, setColHistRemarksActive, 'Filter Remarks...')}</td>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((movement) => (
                      <tr key={movement.id}>
                        <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                          <div>{new Date(movement.timestamp).toLocaleDateString()}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                            {new Date(movement.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{movement.fileId}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {movement.fileSubject}
                          </div>
                        </td>
                        <td>{movement.senderName}</td>
                        <td>{movement.receiverName}</td>
                        <td>
                          <span className={`status-pill ${movement.type.toLowerCase() === 'issue' ? 'issued' : movement.type.toLowerCase() === 'return' ? 'returned' : 'transit'}`}>
                            {movement.type}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', maxWidth: '220px', wordBreak: 'break-word', color: 'var(--text-muted)' }}>
                          {movement.remarks}
                        </td>
                      </tr>
                    ))}
                    {filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No movement records logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
 
            {/* View 3: Recipients List */}
            {registerSubTab === 'recipients' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Recipient ID</th>
                      <th>Full Name</th>
                      <th>Designation</th>
                      <th>Login ID / Username</th>
                      <th>Registration Status</th>
                    </tr>
                    <tr className="filter-header-row" style={{ background: 'rgba(0,0,0,0.15)' }}>
                      <td>{renderColumnFilterInput(colOffIdVal, setColOffIdVal, setColOffIdActive, 'Filter ID...')}</td>
                      <td>{renderColumnFilterInput(colOffNameVal, setColOffNameVal, setColOffNameActive, 'Filter Name...')}</td>
                      <td>{renderColumnFilterInput(colOffDesigVal, setColOffDesigVal, setColOffDesigActive, 'Filter Post...')}</td>
                      <td>{renderColumnFilterInput(colOffLoginVal, setColOffLoginVal, setColOffLoginActive, 'Filter Login...')}</td>
                      <td>{renderColumnFilterInput(colOffStatusVal, setColOffStatusVal, setColOffStatusActive, 'Filter Status...')}</td>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOfficials.map((rec) => (
                      <tr key={rec.id}>
                        <td style={{ fontWeight: 600 }}>{rec.id}</td>
                        <td style={{ fontWeight: 500 }}>{rec.name}</td>
                        <td>{rec.designation}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--accent-gold)' }}>{rec.loginId || 'n/a'}</td>
                        <td>
                          {rec.isRegistered ? (
                            <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                              Registered Profile
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--accent-gold)', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                              Guest Custodian
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
 
          </div>
        </div>
      )}

      {/* Tab 3: REGISTER FILE FORM */}
      {activeTab === 'register_file' && (
        <div style={{ maxWidth: '650px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div className="card-header" style={{ padding: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <h3><PlusCircle size={20} className="text-gold" /> Register Physical File</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <form onSubmit={handleCreateFile}>
                
                <div className="form-group">
                  <label>Assign File ID (Manual Entry)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. DEPT-2026-F14" 
                    value={fileId}
                    onChange={(e) => setFileId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Subject / Matter Title</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Appointment of Project Assistants" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label>Department / Section</label>
                  <select 
                    className="input-field select-field" 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Section --</option>
                    <option value="Establishment Section">Establishment Section</option>
                    <option value="Finance & Accounts Branch">Finance & Accounts Branch</option>
                    <option value="IT Infrastructure Division">IT Infrastructure Division</option>
                    <option value="General Administration Division">General Administration Division</option>
                    <option value="Policy & Coordination Unit">Policy & Coordination Unit</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Plus size={16} /> Register File Record & View Catalog
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: ENROLL OFFICIAL FORM */}
      {activeTab === 'enroll_recipient' && (
        <div style={{ maxWidth: '650px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div className="card-header" style={{ padding: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <h3><UserPlus size={20} className="text-gold" /> Enroll Official Profile</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <form onSubmit={handleCreateRecipient}>
                <div className="form-group">
                  <label>Official's Full Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Priya Patel" 
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label>Designation / Post</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Post Officer" 
                    value={recipientDesignation}
                    onChange={(e) => setRecipientDesignation(e.target.value)}
                    required
                  />
                </div>

                {/* Custom User Credentials Settings */}
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={14} /> Custom Portal Login Settings (Optional)
                  </h4>
                  
                  <div className="form-group">
                    <label>Set Custom Login ID / Username</label>
                    <div style={{ position: 'relative' }}>
                      <User size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Default: lowercase name (e.g. priya)" 
                        value={recipientLoginId}
                        onChange={(e) => setRecipientLoginId(e.target.value)}
                        style={{ paddingLeft: '38px', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Set Custom Login Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Default: password" 
                        value={recipientPassword}
                        onChange={(e) => setRecipientPassword(e.target.value)}
                        style={{ paddingLeft: '38px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Users size={16} /> Enroll Official & Show Credentials
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: DEDICATED FILE CUSTODY ALERTS VIEW */}
      {activeTab === 'alerts' && (
        <div className="glass-panel" style={{ borderRadius: 'var(--border-radius)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(251,191,36,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '18px' }}>
              <ShieldAlert size={22} /> File Custody Alert Center
            </h3>
            <span style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(251,191,36,0.1)', borderRadius: '4px', border: '1px solid rgba(251,191,36,0.2)', color: 'var(--accent-gold)' }}>
              Active Alerts: {overdueFiles.length} Overdue / {pendingFiles.length} Issued
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {pendingFiles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <FileCheck size={48} style={{ color: '#10b981', opacity: 0.3, marginBottom: '16px' }} />
                <p style={{ fontSize: '15px', fontWeight: 600 }}>All physical files are safely stored in the Record Room.</p>
                <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>No active alerts generated.</p>
              </div>
            ) : (
              pendingFiles.map(file => {
                const overdue = isFileOverdue(file);
                const elapsed = getElapsedTimeText(file.lastMovedDate);
                const currentHolder = getHolderName(file.currentHolderId);
                const otherPendingCount = filesList.filter(f => f.currentHolderId === file.currentHolderId && f.status === 'Issued').length;
                return (
                  <div key={file.id} className={`alert-item ${overdue ? 'bg-overdue overdue-border overdue-row' : ''}`} style={{ padding: '20px 24px' }}>
                    <div className="alert-item-info">
                      <span className="file-id-badge" style={{ fontSize: '13px' }}>{file.id}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: overdue ? '#ef4444' : 'var(--text-main)' }}>
                          {file.subject}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Current Custodian: <strong style={{ color: 'var(--text-main)' }}>{currentHolder}</strong> (holds {otherPendingCount} active {otherPendingCount === 1 ? 'file' : 'files'})
                        </div>
                        {file.reason && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted-dark)', fontStyle: 'italic', marginTop: '4px' }}>
                            Purpose: "{file.reason}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="alert-item-time" style={{ minWidth: '150px' }}>
                      <div className={overdue ? 'overdue-text' : ''} style={{ fontWeight: 600, fontSize: '14px' }}>
                        Time Out: {elapsed}
                      </div>
                      {file.anticipatedReturnDate && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Promise: {new Date(file.anticipatedReturnDate).toLocaleDateString()} {new Date(file.anticipatedReturnDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      )}
                      <div style={{ marginTop: '8px' }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleDirectReturn(file.id)}
                          style={{ width: 'auto', padding: '4px 10px', fontSize: '11px', borderColor: overdue ? 'rgba(239, 68, 68, 0.3)' : '', color: overdue ? '#f87171' : '' }}
                        >
                          <CornerUpLeft size={11} /> Recall File
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 6: ISSUE FILE VIEW (Dynamic Search existing OR create new-on-the-fly) */}
      {activeTab === 'issue_file' && (
        <div style={{ maxWidth: '750px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div className="card-header" style={{ padding: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3><Send size={20} className="text-gold" /> Issue File to Official</h3>
              <div className="login-tabs" style={{ margin: 0, padding: '2px' }}>
                <button 
                  type="button" 
                  className={`login-tab ${issueMode === 'search' ? 'active' : ''}`}
                  onClick={() => { setIssueMode('search'); setSelectedExistingFile(null); }}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  🔍 Select Existing File
                </button>
                <button 
                  type="button" 
                  className={`login-tab ${issueMode === 'create' ? 'active' : ''}`}
                  onClick={() => { setIssueMode('create'); setSelectedExistingFile(null); }}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  🆕 Create & Issue File
                </button>
              </div>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              <form onSubmit={handleIssueFileTabSubmit}>
                
                {/* File Selection Module */}
                {issueMode === 'search' ? (
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
                      Step 1: Select Active Register File
                    </h4>
                    
                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Search returned files by ID or Subject..." 
                        value={issueFileSearchQuery}
                        onChange={(e) => setIssueFileSearchQuery(e.target.value)}
                        style={{ paddingLeft: '38px', fontSize: '13px' }}
                      />
                    </div>

                    {/* Search suggestions dropdown list */}
                    {issueFileSearchQuery.trim().length > 0 && !selectedExistingFile && (
                      <div style={{ background: '#0e1423', border: '1px solid var(--border-color)', borderRadius: '6px', maxHeight: '160px', overflowY: 'auto', marginBottom: '14px' }}>
                        {filteredIssueFilesSearch.map(f => (
                          <div 
                            key={f.id} 
                            onClick={() => { setSelectedExistingFile(f); setIssueFileSearchQuery(''); }}
                            style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}
                            className="overdue-row"
                          >
                            <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{f.id}</span>
                            <span style={{ color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>{f.subject}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{f.department}</span>
                          </div>
                        ))}
                        {filteredIssueFilesSearch.length === 0 && (
                          <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                            No returned files found matching search query.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedExistingFile ? (
                      <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--accent-gold)', fontSize: '13px' }}>Selected: {selectedExistingFile.id}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '2px' }}>{selectedExistingFile.subject}</div>
                        </div>
                        <button type="button" className="btn btn-secondary" onClick={() => setSelectedExistingFile(null)} style={{ width: 'auto', padding: '4px 8px', fontSize: '11px' }}>
                          Clear
                        </button>
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: 'var(--accent-gold)' }}>⚠️ Please search and click a file above to select it.</p>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '14px' }}>
                      Step 1: Register New File on-the-fly
                    </h4>
                    
                    <div className="form-group">
                      <label>New File ID</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. GOV-2026-F50" 
                        value={newFileId}
                        onChange={(e) => setNewFileId(e.target.value)}
                        style={{ fontSize: '13px', padding: '10px 14px' }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>File Subject Title</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. IT Procurement checklist" 
                        value={newFileSubject}
                        onChange={(e) => setNewFileSubject(e.target.value)}
                        style={{ fontSize: '13px', padding: '10px 14px' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Department Section</label>
                      <select 
                        className="input-field select-field"
                        value={newFileDepartment}
                        onChange={(e) => setNewFileDepartment(e.target.value)}
                        style={{ fontSize: '13px', padding: '10px 14px' }}
                      >
                        <option value="">-- Choose Section --</option>
                        <option value="Establishment Section">Establishment Section</option>
                        <option value="Finance & Accounts Branch">Finance & Accounts Branch</option>
                        <option value="IT Infrastructure Division">IT Infrastructure Division</option>
                        <option value="General Administration Division">General Administration Division</option>
                        <option value="Policy & Coordination Unit">Policy & Coordination Unit</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Recipient Details Module */}
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
                    Step 2: Custodian & Issue Specifics
                  </h4>

                  {/* Quick prefill list of registered officials */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: 600 }}>Quick Select Registered Official:</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {recipientsList.filter(r => r.isRegistered).map(r => (
                        <button
                          key={r.id}
                          type="button"
                          className="sim-file-btn"
                          onClick={() => {
                            setIssueRecipientName(r.name);
                            setIssueRecipientDesignation(r.designation);
                          }}
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          👤 {r.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Official Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Priya Patel" 
                      value={issueRecipientName}
                      onChange={(e) => setIssueRecipientName(e.target.value)}
                      required
                      style={{ fontSize: '13px', padding: '10px 14px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Designation / Post</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Section Officer" 
                      value={issueRecipientDesignation}
                      onChange={(e) => setIssueRecipientDesignation(e.target.value)}
                      required
                      style={{ fontSize: '13px', padding: '10px 14px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Reason for taking File</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. FY 2026 Audit checklist review" 
                      value={issueReasonText}
                      onChange={(e) => setIssueReasonText(e.target.value)}
                      required
                      style={{ fontSize: '13px', padding: '10px 14px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Anticipated Return Deadline</label>
                    <input 
                      type="datetime-local" 
                      className="input-field" 
                      value={issueAnticipatedDeadline}
                      onChange={(e) => setIssueAnticipatedDeadline(e.target.value)}
                      required
                      style={{ fontSize: '13px', padding: '10px 14px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Additional Movement Remarks (Optional)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Add supplementary remarks" 
                      value={issueSpecificRemarks}
                      onChange={(e) => setIssueSpecificRemarks(e.target.value)}
                      style={{ fontSize: '13px', padding: '10px 14px' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Send size={16} /> Confirm Registration & Issue Physical File
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: PREFERENCE SETTINGS VIEW */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '650px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div className="card-header" style={{ padding: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <h3><Settings size={20} className="text-gold" /> System Preference Settings</h3>
            </div>
            
            <div className="card-body" style={{ padding: 0 }}>
              <form onSubmit={handleSavePreferences}>
                
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building size={14} /> Ministry / Organization Settings
                  </h4>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Display Organisation Name</label>
                    <div style={{ position: 'relative' }}>
                      <Building size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        className="input-field" 
                        value={prefOrgName}
                        onChange={(e) => setPrefOrgName(e.target.value)}
                        required
                        style={{ paddingLeft: '38px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={14} /> Administrator Portal Login Credentials
                  </h4>
                  
                  <div className="form-group">
                    <label>Admin User ID / Username</label>
                    <div style={{ position: 'relative' }}>
                      <User size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        className="input-field" 
                        value={adminLoginId}
                        onChange={(e) => setAdminLoginId(e.target.value)}
                        required
                        style={{ paddingLeft: '38px', fontSize: '13px', textTransform: 'none' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>New Admin Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input 
                        type="password" 
                        className="input-field" 
                        placeholder="Leave blank to keep existing password" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        style={{ paddingLeft: '38px', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Confirm Admin Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input 
                        type="password" 
                        className="input-field" 
                        placeholder="Confirm new password" 
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        style={{ paddingLeft: '38px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Save Configuration Preferences
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Viewer Modal Overlay */}
      {qrModalFile && (
        <div className="modal-overlay" onClick={() => setQrModalFile(null)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid var(--accent-gold)' }}>
            <div className="card-header">
              <h3><QrCode size={18} /> File Physical QR Label</h3>
              <span className="file-id-badge">{qrModalFile.id}</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Print and paste this physical QR code tag onto the front cover of the file folder:
              </p>
              
              {qrModalCodeUrl ? (
                <div className="qr-box" style={{ background: '#fff', padding: '16px', borderRadius: '8px' }}>
                  <img src={qrModalCodeUrl} alt="QR Code Label" style={{ width: '180px', height: '180px' }} />
                </div>
              ) : (
                <div style={{ width: '180px', height: '180px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Generating...
                </div>
              )}

              <div style={{ width: '100%' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {qrModalFile.subject}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Section: {qrModalFile.department}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '10px' }}>
                <a 
                  href={qrModalCodeUrl} 
                  download={`QR_${qrModalFile.id}.png`}
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', flex: 1 }}
                >
                  <Download size={14} /> Download Label
                </a>
                <button 
                  className="btn btn-secondary"
                  onClick={() => window.print()}
                  style={{ flex: 1 }}
                >
                  Print Label
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Issue File Modal Overlay */}
      {issueModalFile && (
        <div className="modal-overlay" onClick={() => setIssueModalFile(null)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid var(--accent-gold)' }}>
            <div className="card-header">
              <h3>📂 Issue File to Official</h3>
              <span className="file-id-badge">{issueModalFile.id}</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleIssueSubmit}>
                <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Subject: <strong style={{ color: 'var(--text-main)' }}>{issueModalFile.subject}</strong>
                </div>

                {/* Quick prefill list of registered officials */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: 600 }}>Quick Select Registered Official:</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {recipientsList.filter(r => r.isRegistered).map(r => (
                      <button
                        key={r.id}
                        type="button"
                        className="sim-file-btn"
                        onClick={() => {
                          setIssueName(r.name);
                          setIssueDesignation(r.designation);
                        }}
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        👤 {r.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Official's Full Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Priya Patel"
                    value={issueName}
                    onChange={(e) => setIssueName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Designation / Post</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Section Officer"
                    value={issueDesignation}
                    onChange={(e) => setIssueDesignation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Reason for taking File</label>
                  <textarea 
                    className="input-field" 
                    rows={2}
                    placeholder="e.g. Budget audits review or procurement checklist validation"
                    value={issueReason}
                    onChange={(e) => setIssueReason(e.target.value)}
                    required
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label>Anticipated Time to Return</label>
                  <input 
                    type="datetime-local" 
                    className="input-field" 
                    value={issueDeadline}
                    onChange={(e) => setIssueDeadline(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Confirm & Issue File
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIssueModalFile(null)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
