import React, { useState } from 'react';
import { 
  FileItem, 
  Recipient, 
  Movement, 
  transferFile 
} from '../utils/db';
import { 
  FileText, 
  ArrowLeftRight, 
  RefreshCw, 
  History, 
  CheckCircle,
  Inbox,
  User,
  Clock,
  Send,
  CornerUpLeft
} from 'lucide-react';

interface RecipientDashboardProps {
  currentUser: { id: string; name: string; designation: string; isAdmin: boolean };
  onActionComplete: (msg: string, isError?: boolean) => void;
  filesList: FileItem[];
  recipientsList: Recipient[];
  movementsList: Movement[];
  refreshData: () => void;
}

export const RecipientDashboard: React.FC<RecipientDashboardProps> = ({
  currentUser,
  onActionComplete,
  filesList,
  recipientsList,
  movementsList,
  refreshData
}) => {
  // Transfer target selections (for each active file card)
  const [activeTransferFileId, setActiveTransferFileId] = useState<string | null>(null);
  const [targetRecipientId, setTargetRecipientId] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Filter files currently in custody of this recipient
  const activeFiles = filesList.filter(f => f.currentHolderId === currentUser.id && f.status === 'Issued');

  // Filter movements related to this recipient
  const myMovements = movementsList.filter(
    m => m.senderId === currentUser.id || m.receiverId === currentUser.id
  );

  // Return file back to Administrator
  const handleReturnToAdmin = (fileId: string) => {
    try {
      transferFile(fileId, currentUser.id, 'Admin', 'Returned to Admin via Recipient Dashboard.');
      refreshData();
      onActionComplete(`File "${fileId}" has been returned to the Admin Record Room.`);
    } catch (err: any) {
      onActionComplete(err.message || 'Failed to return file.', true);
    }
  };

  // Forward file to another registered official
  const handleForwardFile = (e: React.FormEvent, fileId: string) => {
    e.preventDefault();
    if (!targetRecipientId) {
      onActionComplete('Please select a target recipient.', true);
      return;
    }

    try {
      transferFile(fileId, currentUser.id, targetRecipientId, remarks || 'Forwarded via Recipient Dashboard.');
      refreshData();
      const rec = recipientsList.find(r => r.id === targetRecipientId);
      onActionComplete(`File "${fileId}" forwarded successfully to ${rec ? rec.name : 'colleague'}.`);
      
      // Reset transfer states
      setActiveTransferFileId(null);
      setTargetRecipientId('');
      setRemarks('');
    } catch (err: any) {
      onActionComplete(err.message || 'Failed to transfer file.', true);
    }
  };

  return (
    <div className="view-container">
      
      {/* Persona Header Info */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent-teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(45,212,191,0.3)', color: 'var(--accent-teal)' }}>
          <User size={28} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
            {currentUser.name}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {currentUser.designation} • ID: <strong style={{ fontFamily: 'monospace' }}>{currentUser.id}</strong>
          </p>
        </div>
      </div>

      {/* Grid: Held Files vs Personal History */}
      <div className="dashboard-split">
        
        {/* Left Hand: Active Files held */}
        <div className="glass-panel">
          <div className="card-header">
            <h3><Inbox size={20} className="text-gold" /> Files in Your Custody ({activeFiles.length})</h3>
          </div>
          
          <div className="card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activeFiles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <CheckCircle size={48} style={{ color: '#10b981', opacity: 0.3, marginBottom: '16px' }} />
                <p style={{ fontSize: '14px', fontWeight: 500 }}>All files returned. Your desk is clear!</p>
              </div>
            ) : (
              <div className="file-card-grid" style={{ gridTemplateColumns: '1fr' }}>
                {activeFiles.map((file) => {
                  const overdue = file.anticipatedReturnDate ? new Date() > new Date(file.anticipatedReturnDate) : false;
                  return (
                    <div key={file.id} className={`glass-panel file-card ${overdue ? 'overdue' : ''}`} style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <div className="file-card-header">
                        <div className="file-card-title">
                          <span className="file-id-badge">{file.id}</span>
                          <h4>{file.subject}</h4>
                        </div>
                        {overdue ? (
                          <span className="status-pill overdue">OVERDUE</span>
                        ) : (
                          <span className="status-pill issued">In Custody</span>
                        )}
                      </div>

                      <div className="file-card-meta">
                        <div className="file-card-meta-row">
                          <span>Section / Dept:</span>
                          <strong style={{ color: 'var(--text-main)' }}>{file.department}</strong>
                        </div>
                        <div className="file-card-meta-row">
                          <span>Custody Since:</span>
                          <span>{new Date(file.lastMovedDate).toLocaleString()}</span>
                        </div>
                        {file.anticipatedReturnDate && (
                          <div className="file-card-meta-row">
                            <span>Promise Return:</span>
                            <span className={overdue ? 'overdue-text' : ''} style={{ fontWeight: 600 }}>
                              {new Date(file.anticipatedReturnDate).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {file.reason && (
                          <div className="file-card-meta-row" style={{ flexDirection: 'column', gap: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 500 }}>Reason for Issue:</span>
                            <span style={{ color: 'var(--text-main)', fontStyle: 'italic', fontSize: '11px' }}>"{file.reason}"</span>
                          </div>
                        )}
                      </div>

                    {activeTransferFileId === file.id ? (
                      /* Forward Form inside the card */
                      <form 
                        onSubmit={(e) => handleForwardFile(e, file.id)} 
                        style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                      >
                        <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                          Forward to Colleague
                        </h5>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <select 
                            className="input-field select-field"
                            value={targetRecipientId}
                            onChange={(e) => setTargetRecipientId(e.target.value)}
                            required
                          >
                            <option value="">-- Choose Official --</option>
                            {recipientsList
                              .filter(r => r.id !== currentUser.id && r.isRegistered)
                              .map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.designation})</option>
                              ))
                            }
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Add remarks / notes"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" className="btn btn-accent" style={{ flex: 1, padding: '8px 16px', fontSize: '13px' }}>
                            <Send size={14} /> Send
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => setActiveTransferFileId(null)}
                            style={{ flex: 1, padding: '8px 16px', fontSize: '13px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Action Buttons */
                      <div className="file-card-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        <button 
                          className="btn btn-accent" 
                          onClick={() => {
                            setActiveTransferFileId(file.id);
                            setTargetRecipientId('');
                            setRemarks('');
                          }}
                          style={{ flex: 1.2 }}
                        >
                          <ArrowLeftRight size={14} /> Forward File
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleReturnToAdmin(file.id)}
                          style={{ flex: 0.8 }}
                        >
                          <CornerUpLeft size={14} /> Return to Admin
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>

        {/* Right Hand: Personal Movement History Logs */}
        <div className="glass-panel">
          <div className="card-header">
            <h3><History size={20} className="text-gold" /> Your Movement Logs ({myMovements.length})</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>File</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {myMovements.map((movement) => {
                    const isSender = movement.senderId === currentUser.id;
                    return (
                      <tr key={movement.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>
                            {new Date(movement.timestamp).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {new Date(movement.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{movement.fileId}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                            {movement.fileSubject}
                          </div>
                        </td>
                        <td>
                          <div>
                            {isSender ? (
                              <span>Sent to <strong>{movement.receiverName}</strong></span>
                            ) : (
                              <span>Received from <strong>{movement.senderName}</strong></span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                            "{movement.remarks}"
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {myMovements.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No file transfer history logged for your account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
