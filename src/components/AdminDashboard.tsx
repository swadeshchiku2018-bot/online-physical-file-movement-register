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
  CornerUpLeft
} from 'lucide-react';

interface AdminDashboardProps {
  onActionComplete: (msg: string, isError?: boolean) => void;
  filesList: FileItem[];
  recipientsList: Recipient[];
  movementsList: Movement[];
  refreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onActionComplete,
  filesList,
  recipientsList,
  movementsList,
  refreshData
}) => {
  // Tabs for sub-sections in Admin (Files & Register, Add Recipient/File)
  const [activeSubTab, setActiveSubTab] = useState<'files' | 'history' | 'recipients'>('files');

  // File Creation form state
  const [fileId, setFileId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [department, setDepartment] = useState<string>('');

  // Recipient Creation state
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientDesignation, setRecipientDesignation] = useState<string>('');

  // Search & Filter states
  const [fileSearch, setFileSearch] = useState<string>('');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilterType, setHistoryFilterType] = useState<string>('ALL');

  // QR Modal state
  const [qrModalFile, setQrModalFile] = useState<FileItem | null>(null);
  const [qrModalCodeUrl, setQrModalCodeUrl] = useState<string>('');

  // Issue File Modal state
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

  // Handle File Creation
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
    } catch (err: any) {
      onActionComplete(err.message || 'Error creating file.', true);
    }
  };

  // Handle Recipient Creation
  const handleCreateRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientDesignation.trim()) {
      onActionComplete('Please enter name and designation.', true);
      return;
    }

    try {
      const newRec = addRecipient(recipientName.trim(), recipientDesignation.trim(), true);
      refreshData();
      onActionComplete(`Recipient "${newRec.name}" registered successfully as ${newRec.designation}.`);
      setRecipientName('');
      setRecipientDesignation('');
    } catch (err: any) {
      onActionComplete(err.message || 'Error creating recipient.', true);
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

  // Filters
  const filteredFiles = filesList.filter(f => 
    f.id.toLowerCase().includes(fileSearch.toLowerCase()) ||
    f.subject.toLowerCase().includes(fileSearch.toLowerCase()) ||
    f.department.toLowerCase().includes(fileSearch.toLowerCase())
  );

  const filteredHistory = movementsList.filter(m => {
    const matchesSearch = 
      m.fileId.toLowerCase().includes(historySearch.toLowerCase()) ||
      m.fileSubject.toLowerCase().includes(historySearch.toLowerCase()) ||
      m.senderName.toLowerCase().includes(historySearch.toLowerCase()) ||
      m.receiverName.toLowerCase().includes(historySearch.toLowerCase());
    
    const matchesFilter = historyFilterType === 'ALL' || m.type.toUpperCase() === historyFilterType;
    return matchesSearch && matchesFilter;
  });

  // Pending files list
  const pendingFiles = filesList.filter(f => f.status === 'Issued');

  return (
    <div className="view-container">
      
      {/* 4 Stats Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <h3>Total Files</h3>
            <p>{totalFiles}</p>
          </div>
          <div className="stat-icon total">
            <FileText size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-info">
            <h3>Issued Custody</h3>
            <p>{issuedFiles}</p>
          </div>
          <div className="stat-icon issued">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-info">
            <h3>Safe (Returned)</h3>
            <p>{returnedFiles}</p>
          </div>
          <div className="stat-icon returned">
            <FileCheck size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-info">
            <h3>Movements Logged</h3>
            <p>{movementsList.length}</p>
          </div>
          <div className="stat-icon pending">
            <History size={24} />
          </div>
        </div>
      </div>

      {/* Alerts & Attention Panel */}
      {pendingFiles.length > 0 && (
        <div className="glass-panel alerts-section" style={{ borderRadius: 'var(--border-radius)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(251,191,36,0.2)' }}>
            <h3 style={{ color: 'var(--accent-gold)' }}>
              <ShieldAlert size={20} /> File Custody Alert Center
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Active custody tracking & overdue enforcement
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {pendingFiles.map(file => {
              const overdue = isFileOverdue(file);
              const elapsed = getElapsedTimeText(file.lastMovedDate);
              const currentHolder = getHolderName(file.currentHolderId);
              // Count other files pending with this official
              const otherPendingCount = filesList.filter(f => f.currentHolderId === file.currentHolderId && f.status === 'Issued').length;
              return (
                <div key={file.id} className={`alert-item ${overdue ? 'bg-overdue overdue-border overdue-row' : ''}`}>
                  <div className="alert-item-info">
                    <span className="file-id-badge">{file.id}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: overdue ? '#ef4444' : 'var(--text-main)' }}>
                        {file.subject}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Custodian: <strong>{currentHolder}</strong> (holds {otherPendingCount} {otherPendingCount === 1 ? 'file' : 'files'})
                      </div>
                    </div>
                  </div>
                  <div className="alert-item-time">
                    <div className={overdue ? 'overdue-text' : ''} style={{ fontWeight: 600 }}>
                      Pending: {elapsed}
                    </div>
                    {file.anticipatedReturnDate && (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Promise: {new Date(file.anticipatedReturnDate).toLocaleDateString()} {new Date(file.anticipatedReturnDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Split Column */}
      <div className="dashboard-split">
        
        {/* Left Side - Tables & Logs based on sub-tab navigation */}
        <div className="glass-panel">
          <div className="card-header" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px' }}><FileText size={20} className="text-gold" /> Master Registers</h3>
              
              {/* Internal Tab switcher */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={`btn btn-secondary ${activeSubTab === 'files' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('files')}
                  style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                >
                  File Catalog
                </button>
                <button 
                  className={`btn btn-secondary ${activeSubTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('history')}
                  style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                >
                  Movement Register
                </button>
                <button 
                  className={`btn btn-secondary ${activeSubTab === 'recipients' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('recipients')}
                  style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                >
                  Recipients List
                </button>
              </div>
            </div>

            {/* Sub-Tab Controls (Searches) */}
            {activeSubTab === 'files' && (
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Search file index by ID, subject, or department..." 
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            )}

            {activeSubTab === 'history' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Search movement history..." 
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

          <div className="card-body" style={{ padding: 0 }}>
            
            {/* View 1: Files Table */}
            {activeSubTab === 'files' && (
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
            {activeSubTab === 'history' && (
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
            {activeSubTab === 'recipients' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Recipient ID</th>
                      <th>Full Name</th>
                      <th>Designation</th>
                      <th>Registration Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipientsList.map((rec) => (
                      <tr key={rec.id}>
                        <td style={{ fontWeight: 600 }}>{rec.id}</td>
                        <td style={{ fontWeight: 500 }}>{rec.name}</td>
                        <td>{rec.designation}</td>
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

        {/* Right Side - Add New Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Form 1: File Registration */}
          <div className="glass-panel">
            <div className="card-header">
              <h3><PlusCircle size={18} className="text-gold" /> Register Physical File</h3>
            </div>
            <div className="card-body">
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

                <div className="form-group">
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

                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Register File Record
                </button>
              </form>
            </div>
          </div>

          {/* Form 2: Recipient Enrolment */}
          <div className="glass-panel">
            <div className="card-header">
              <h3><UserPlus size={18} className="text-gold" /> Enroll Official / Recipient</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateRecipient}>
                <div className="form-group">
                  <label>Official's Full Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Shri Swadesh Kumar" 
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Designation / Post</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Section Officer (Admin)" 
                    value={recipientDesignation}
                    onChange={(e) => setRecipientDesignation(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-secondary">
                  <Users size={16} /> Enroll Official Profile
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>

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
