import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import QRCode from 'qrcode';
import { 
  FileItem, 
  Recipient, 
  getFileById, 
  getFiles, 
  getRecipients, 
  addRecipient,
  issueFile, 
  transferFile 
} from '../utils/db';
import { QrCode, ScanLine, Camera, RefreshCw, Send, CheckCircle, ArrowLeftRight } from 'lucide-react';

interface QRScannerPanelProps {
  currentUser: { id: string; name: string; designation: string; isAdmin: boolean } | null;
  onActionComplete: (msg: string, isError?: boolean) => void;
  filesList: FileItem[];
  recipientsList: Recipient[];
  refreshData: () => void;
}

export const QRScannerPanel: React.FC<QRScannerPanelProps> = ({
  currentUser,
  onActionComplete,
  filesList,
  recipientsList,
  refreshData
}) => {
  const [scannedFileId, setScannedFileId] = useState<string>('');
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string>('');
  
  // Transfer Form state
  const [targetRecipientId, setTargetRecipientId] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isUnregistered, setIsUnregistered] = useState<boolean>(false);
  const [unregName, setUnregName] = useState<string>('');
  const [unregDesignation, setUnregDesignation] = useState<string>('');

  // New Issue custom states
  const [issueReason, setIssueReason] = useState<string>('');
  const [issueDeadline, setIssueDeadline] = useState<string>('');
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Stop scanner when component unmounts
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Sync active file metadata when database updates
  useEffect(() => {
    if (activeFile) {
      const updated = getFileById(activeFile.id);
      if (updated) {
        setActiveFile(updated);
      }
    }
  }, [filesList]);

  const startScanner = () => {
    setScanError('');
    setCameraActive(true);
    
    // Defer initialization to ensure HTML element is rendered
    setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader', 
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.333333
          }, 
          /* verbose= */ false
        );
        
        scanner.render(
          (decodedText) => {
            handleScanSuccess(decodedText);
            scanner.clear().catch(err => console.error("Error clearing scanner", err));
            setCameraActive(false);
          },
          (error) => {
            // Quietly log scanner failures as they happen continuously during seek
            console.debug("QR Seek...", error);
          }
        );
        
        scannerRef.current = scanner;
      } catch (err: any) {
        console.error(err);
        setScanError('Could not access camera. Please make sure camera permission is granted or test using the Simulator below.');
        setCameraActive(false);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
        .then(() => {
          scannerRef.current = null;
        })
        .catch(err => {
          console.error("Error stopping scanner", err);
        });
    }
    setCameraActive(false);
  };

  const handleScanSuccess = (fileId: string) => {
    setScannedFileId(fileId);
    const file = getFileById(fileId);
    if (file) {
      setActiveFile(file);
      setRemarks('');
      setTargetRecipientId('');
      setUnregName('');
      setUnregDesignation('');
      setIsUnregistered(false);
      setIssueReason('');
      setIssueDeadline('');
      onActionComplete(`File "${fileId}" scanned successfully!`);
    } else {
      setActiveFile(null);
      onActionComplete(`Scanned code "${fileId}" but it is not registered in the database.`, true);
    }
  };

  // Process Admin Issuing File
  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFile) return;

    try {
      let receiverId = targetRecipientId;
      
      // If issuing to unregistered
      if (isUnregistered) {
        if (!unregName || !unregDesignation) {
          onActionComplete('Please enter Name and Designation for unregistered recipient.', true);
          return;
        }
        // Dynamically add unregistered recipient
        const newUnreg = addRecipient(unregName, unregDesignation, false);
        receiverId = newUnreg.id;
      }

      if (!receiverId) {
        onActionComplete('Please select or specify a recipient.', true);
        return;
      }

      if (!issueReason.trim() || !issueDeadline) {
        onActionComplete('Please specify a reason and anticipated return time.', true);
        return;
      }

      issueFile(
        activeFile.id, 
        receiverId, 
        remarks || `Issued via QR Scanner. Reason: ${issueReason.trim()}`,
        issueReason.trim(),
        new Date(issueDeadline).toISOString()
      );
      refreshData();
      onActionComplete(`File "${activeFile.id}" successfully issued.`);
      
      // Reset form
      setRemarks('');
      setTargetRecipientId('');
      setUnregName('');
      setUnregDesignation('');
      setIsUnregistered(false);
      setIssueReason('');
      setIssueDeadline('');
    } catch (err: any) {
      onActionComplete(err.message || 'Failed to issue file.', true);
    }
  };

  // Process Recipient Transfer or Return
  const handleTransfer = (e: React.FormEvent, target: string | 'Admin') => {
    e.preventDefault();
    if (!activeFile || !currentUser) return;

    try {
      transferFile(activeFile.id, currentUser.id, target, remarks);
      refreshData();
      onActionComplete(
        target === 'Admin' 
          ? `File "${activeFile.id}" returned to Admin.` 
          : `File "${activeFile.id}" transferred successfully.`
      );
      setRemarks('');
      setTargetRecipientId('');
    } catch (err: any) {
      onActionComplete(err.message || 'Failed to transfer file.', true);
    }
  };

  // Quick simulated scan
  const handleSimulateScan = (id: string) => {
    handleScanSuccess(id);
  };

  // QR Code generator helper (State to store base64 url)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  useEffect(() => {
    if (activeFile) {
      QRCode.toDataURL(activeFile.id, { width: 160, margin: 2 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error("Error generating QR", err));
    } else {
      setQrCodeUrl('');
    }
  }, [activeFile]);

  // Find holder name helper
  const getHolderName = (holderId: string | null) => {
    if (!holderId) return 'Administrator (Record Room)';
    const rec = recipientsList.find(r => r.id === holderId);
    return rec ? `${rec.name} (${rec.designation})` : 'Unknown User';
  };

  return (
    <div className="view-container">
      <div className="card-header" style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--border-color)' }}>
        <h3><QrCode size={22} className="text-gold" /> Physical File QR Quick Access panel</h3>
      </div>

      <div className="scanner-layout">
        {/* Left Column - Camera Scanner & Simulator */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <h3><Camera size={18} /> QR Scanner Preview</h3>
            {!cameraActive ? (
              <button className="btn btn-primary" style={{ width: 'auto', padding: '6px 16px', fontSize: '12px' }} onClick={startScanner}>
                Activate Camera
              </button>
            ) : (
              <button className="btn btn-secondary" style={{ width: 'auto', padding: '6px 16px', fontSize: '12px' }} onClick={stopScanner}>
                Stop Camera
              </button>
            )}
          </div>
          
          <div className="card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {cameraActive ? (
              <div className="camera-preview-container">
                <div id="qr-reader" style={{ width: '100%' }}></div>
                <div className="scanner-overlay">
                  <div className="scanner-target-box"></div>
                  <div className="scanner-laser"></div>
                </div>
              </div>
            ) : (
              <div className="camera-preview-container" style={{ background: '#0e1526' }}>
                <div className="camera-disabled">
                  <div className="camera-disabled-icon">
                    <QrCode size={32} />
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Camera is currently offline. Enable to scan physical file QR labels.
                  </p>
                </div>
              </div>
            )}

            {scanError && (
              <p style={{ color: 'var(--accent-red)', fontSize: '12px', textAlign: 'center' }}>
                {scanError}
              </p>
            )}

            {/* Simulation Dashboard */}
            <div className="simulation-panel">
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Quick Simulator Panel
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Click a file below to instantly simulate scanning its physical QR code tag:
              </p>
              <div className="sim-files-list">
                {filesList.map((f) => (
                  <button 
                    key={f.id} 
                    className="sim-file-btn"
                    onClick={() => handleSimulateScan(f.id)}
                    title={f.subject}
                  >
                    🔍 {f.id}
                  </button>
                ))}
                {filesList.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted-dark)' }}>No files registered yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Scan Action Dashboard */}
        <div className="glass-panel">
          <div className="card-header">
            <h3><ScanLine size={18} /> Active File Details</h3>
            {activeFile && (
              <span className="file-id-badge">{activeFile.id}</span>
            )}
          </div>
          
          <div className="card-body">
            {!activeFile ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <QrCode size={48} style={{ opacity: 0.15, marginBottom: '16px' }} />
                <p style={{ fontSize: '14px' }}>Please scan a QR code or choose a file from the Simulator to display movement actions.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* File Information Dashboard */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {qrCodeUrl && (
                    <div className="qr-box" style={{ background: '#fff', padding: '8px', borderRadius: '4px' }}>
                      <img src={qrCodeUrl} alt="File QR Code" style={{ width: '100px', height: '100px' }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-main)' }}>
                      {activeFile.subject}
                    </h4>
                    <span style={{ fontSize: '12px', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                      {activeFile.department}
                    </span>
                  </div>
                </div>

                <div className="scan-result-card" style={{ borderTop: '2px solid var(--accent-gold)', background: 'rgba(251,191,36,0.02)', borderRadius: '6px', padding: '16px' }}>
                  <div className="result-detail-row">
                    <span className="result-label">Current Holder</span>
                    <span className="result-value" style={{ color: activeFile.currentHolderId ? 'var(--text-main)' : 'var(--accent-gold)' }}>
                      {getHolderName(activeFile.currentHolderId)}
                    </span>
                  </div>
                  <div className="result-detail-row">
                    <span className="result-label">Status</span>
                    <span className={`status-pill ${activeFile.status.toLowerCase().replace(' ', '')}`}>
                      {activeFile.status}
                    </span>
                  </div>
                  <div className="result-detail-row">
                    <span className="result-label">Last Moved</span>
                    <span className="result-value" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(activeFile.lastMovedDate).toLocaleString()}
                    </span>
                  </div>
                  {activeFile.status === 'Issued' && activeFile.anticipatedReturnDate && (
                    <div className="result-detail-row">
                      <span className="result-label">Anticipated Return</span>
                      <span className="result-value" style={{ color: new Date() > new Date(activeFile.anticipatedReturnDate) ? 'var(--accent-red)' : 'var(--text-main)' }}>
                        {new Date(activeFile.anticipatedReturnDate).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* CONTEXTUAL ACTIONS */}
                
                {/* Admin Actions */}
                {currentUser?.isAdmin && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                      Admin Actions
                    </h4>
                    {activeFile.currentHolderId === null ? (
                      // File is in record room, Admin can issue
                      <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Choose Recipient to Issue File To</label>
                          
                          <div className="unregistered-toggle-header" onClick={() => setIsUnregistered(!isUnregistered)}>
                            <input 
                              type="checkbox" 
                              checked={isUnregistered} 
                              onChange={() => {}} 
                            />
                            <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 500 }}>
                              Assign to Unregistered Recipient
                            </span>
                          </div>

                          {!isUnregistered ? (
                            <select 
                              className="input-field select-field"
                              value={targetRecipientId}
                              onChange={(e) => setTargetRecipientId(e.target.value)}
                              required
                            >
                              <option value="">-- Select Registered Recipient --</option>
                              {recipientsList.filter(r => r.isRegistered).map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.designation})</option>
                              ))}
                            </select>
                          ) : (
                            <div className="form-row" style={{ marginTop: '8px' }}>
                              <input 
                                type="text"
                                className="input-field"
                                placeholder="Recipient Name"
                                value={unregName}
                                onChange={(e) => setUnregName(e.target.value)}
                                required
                              />
                              <input 
                                type="text"
                                className="input-field"
                                placeholder="Designation (e.g. Clerk)"
                                value={unregDesignation}
                                onChange={(e) => setUnregDesignation(e.target.value)}
                                required
                              />
                            </div>
                          )}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Reason for taking File</label>
                          <input 
                            type="text" 
                            className="input-field"
                            placeholder="e.g. Budget audit reviews"
                            value={issueReason}
                            onChange={(e) => setIssueReason(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Anticipated Time to Return</label>
                          <input 
                            type="datetime-local" 
                            className="input-field"
                            value={issueDeadline}
                            onChange={(e) => setIssueDeadline(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Remarks / Instructions (Optional)</label>
                          <textarea 
                            className="input-field"
                            rows={2}
                            placeholder="Add extra remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            style={{ resize: 'vertical', minHeight: '50px' }}
                          />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
                          <Send size={16} /> Issue File ID: {activeFile.id}
                        </button>
                      </form>
                    ) : (
                      // File is currently issued, Admin can force return
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          This file is currently issued to <strong>{getHolderName(activeFile.currentHolderId)}</strong>.
                        </p>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Remarks for Retrieval</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Enter reason for pulling back file"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                          />
                        </div>
                        <button 
                          className="btn btn-secondary" 
                          onClick={(e) => handleTransfer(e, 'Admin')}
                          style={{ border: '1px solid rgba(248,113,113,0.3)', color: 'var(--accent-red)' }}
                        >
                          <RefreshCw size={16} /> Force Recall / Return to Record Room
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Recipient Actions */}
                {!currentUser?.isAdmin && currentUser && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                      Recipient Actions ({currentUser.name})
                    </h4>
                    
                    {activeFile.currentHolderId === currentUser.id ? (
                      // Recipient holds this file, they can Transfer or Return
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            className="btn btn-secondary"
                            onClick={(e) => handleTransfer(e, 'Admin')}
                            style={{ flex: 1 }}
                          >
                            <CheckCircle size={16} className="text-gold" /> Return to Admin
                          </button>
                        </div>
                        
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                            Forward / Transfer to another Official
                          </p>
                          <form onSubmit={(e) => handleTransfer(e, targetRecipientId)} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Choose Recipient</label>
                              <select 
                                className="input-field select-field"
                                value={targetRecipientId}
                                onChange={(e) => setTargetRecipientId(e.target.value)}
                                required
                              >
                                <option value="">-- Select Recipient --</option>
                                {recipientsList.filter(r => r.id !== currentUser.id).map(r => (
                                  <option key={r.id} value={r.id}>{r.name} ({r.designation})</option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Transfer Remarks</label>
                              <input 
                                type="text"
                                className="input-field"
                                placeholder="Add movement note"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                              />
                            </div>
                            <button type="submit" className="btn btn-accent">
                              <ArrowLeftRight size={16} /> Forward File
                            </button>
                          </form>
                        </div>
                      </div>
                    ) : (
                      // Recipient does NOT hold this file
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          You are not the current custodian of this file. 
                        </p>
                        
                        {/* Quick action to take possession (for ease of physical handovers) */}
                        <div style={{ padding: '14px', background: 'rgba(45, 212, 191, 0.03)', borderRadius: '6px', border: '1px solid rgba(45,212,191,0.1)' }}>
                          <p style={{ fontSize: '12px', color: 'var(--accent-teal)', marginBottom: '10px', fontWeight: 500 }}>
                            Did you just receive this physical file?
                          </p>
                          <div className="form-group" style={{ marginBottom: '10px' }}>
                            <input 
                              type="text" 
                              className="input-field" 
                              placeholder="Remarks (e.g. Scanned physical file on arrival)"
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                              style={{ padding: '8px 12px', fontSize: '12px' }}
                            />
                          </div>
                          <button 
                            className="btn btn-accent" 
                            style={{ background: 'var(--accent-teal)', color: '#000', padding: '8px 16px', fontSize: '12px' }}
                            onClick={(e) => {
                              // Simulate a transfer from the current holder (or admin) to the current user
                              e.preventDefault();
                              try {
                                if (activeFile.currentHolderId) {
                                  transferFile(activeFile.id, activeFile.currentHolderId, currentUser.id, remarks || 'Scanned QR and took possession.');
                                } else {
                                  // Transfer from admin (Issue)
                                  issueFile(activeFile.id, currentUser.id, remarks || 'Scanned QR and took possession.');
                                }
                                refreshData();
                                onActionComplete(`Successfully scanned and took possession of file "${activeFile.id}".`);
                                setRemarks('');
                              } catch(err: any) {
                                onActionComplete(err.message || 'Failed to take possession.', true);
                              }
                            }}
                          >
                            <CheckCircle size={14} /> Accept & Take Custody
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
