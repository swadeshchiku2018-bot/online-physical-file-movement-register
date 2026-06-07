import { useState, useEffect } from 'react';
import { 
  FileItem, 
  Recipient, 
  Movement, 
  getFiles, 
  getRecipients, 
  getMovements, 
  initDB 
} from './utils/db';
import { AdminDashboard } from './components/AdminDashboard';
import { RecipientDashboard } from './components/RecipientDashboard';
import { QRScannerPanel } from './components/QRScannerPanel';
import { 
  LayoutDashboard, 
  QrCode, 
  User, 
  Clock, 
  Building,
  ShieldAlert,
  Search,
  LogOut,
  Lock,
  X,
  FileText,
  PlusCircle,
  UserPlus,
  Users,
  Settings,
  Send,
  Menu
} from 'lucide-react';
import './App.css';

interface UserSession {
  id: string;
  name: string;
  designation: string;
  isAdmin: boolean;
}

interface ToastMessage {
  id: string;
  text: string;
  isError?: boolean;
}

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registers' | 'register_file' | 'enroll_recipient' | 'alerts' | 'scanner' | 'settings' | 'issue_file'>('dashboard');
  const [orgName, setOrgName] = useState<string>(() => localStorage.getItem('gov_file_register_org_name') || 'Govt of India • Ministry of Electronics & IT');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  // Auth states
  const [sessionUser, setSessionUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('gov_file_register_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.isAdmin && (parsed.name === 'Administrator' || parsed.name === 'Manoj Kumar Jena')) {
        parsed.name = 'Manoj Kumar Jena';
      }
      return parsed;
    }
    return null;
  });
  const [loginRole, setLoginRole] = useState<'admin' | 'official'>('admin');
  const [loginId, setLoginId] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Global Search states
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Database states
  const [filesList, setFilesList] = useState<FileItem[]>([]);
  const [recipientsList, setRecipientsList] = useState<Recipient[]>([]);
  const [movementsList, setMovementsList] = useState<Movement[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Initialize DB and load lists
  useEffect(() => {
    initDB();
    refreshData();
    
    // Live clock update
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const refreshData = () => {
    setFilesList(getFiles());
    setRecipientsList(getRecipients());
    setMovementsList(getMovements());
  };

  const triggerToast = (text: string, isError = false) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, isError }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Perform login check
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPassword.trim()) {
      triggerToast('Please fill in both fields.', true);
      return;
    }

    if (loginRole === 'admin') {
      const storedAdminId = localStorage.getItem('gov_file_register_admin_id') || 'admin';
      const storedAdminPass = localStorage.getItem('gov_file_register_admin_pass') || 'admin';
      if (loginId.trim().toLowerCase() === storedAdminId.toLowerCase() && loginPassword === storedAdminPass) {
        const adminSession: UserSession = {
          id: 'Admin',
          name: 'Manoj Kumar Jena',
          designation: 'Record Room Head',
          isAdmin: true
        };
        setSessionUser(adminSession);
        localStorage.setItem('gov_file_register_session', JSON.stringify(adminSession));
        triggerToast('Welcome Back, Manoj Kumar Jena');
        setLoginId('');
        setLoginPassword('');
      } else {
        triggerToast(`Invalid Admin credentials. (Hint: ${storedAdminId} / ${storedAdminPass})`, true);
      }
    } else {
      // Official login search
      const rec = recipientsList.find(r => 
        (r.loginId && r.loginId.toLowerCase() === loginId.trim().toLowerCase()) || 
        (r.id.toLowerCase() === loginId.trim().toLowerCase())
      );

      if (rec && (rec.password || 'password') === loginPassword) {
        const officialSession: UserSession = {
          id: rec.id,
          name: rec.name,
          designation: rec.designation,
          isAdmin: false
        };
        setSessionUser(officialSession);
        localStorage.setItem('gov_file_register_session', JSON.stringify(officialSession));
        triggerToast(`Signed in as ${rec.name}`);
        setLoginId('');
        setLoginPassword('');
      } else {
        triggerToast('Invalid Official credentials. (Hint: priya / password)', true);
      }
    }
  };

  // Perform logout
  const handleLogout = () => {
    setSessionUser(null);
    localStorage.removeItem('gov_file_register_session');
    triggerToast('Logged out successfully.');
  };

  // Check if file is overdue
  const isFileOverdue = (file: FileItem) => {
    return file.status === 'Issued' && 
           file.anticipatedReturnDate && 
           new Date() > new Date(file.anticipatedReturnDate);
  };

  // Get recipient name
  const getHolderName = (holderId: string | null) => {
    if (!holderId) return 'Record Room (Admin)';
    const rec = recipientsList.find(r => r.id === holderId);
    return rec ? `${rec.name} (${rec.designation})` : 'Unknown';
  };

  // Filter files in global search
  const filteredSearchFiles = filesList.filter(file => 
    file.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If not logged in, render the login panel
  if (!sessionUser) {
    return (
      <div className="login-screen">
        <div className="glass-panel login-card">
          <div className="login-header">
            <div className="brand-icon" style={{ margin: '0 auto', width: '48px', height: '48px', fontSize: '20px' }}>F</div>
            <h2>Ministry File Portal</h2>
            <p>Physical File Movement Tracking System</p>

            <div className="login-tabs">
              <button 
                className={`login-tab ${loginRole === 'admin' ? 'active' : ''}`}
                onClick={() => { setLoginRole('admin'); setLoginId(''); setLoginPassword(''); }}
              >
                🔑 Administrator
              </button>
              <button 
                className={`login-tab ${loginRole === 'official' ? 'active' : ''}`}
                onClick={() => { setLoginRole('official'); setLoginId(''); setLoginPassword(''); }}
              >
                👤 Official / Recipient
              </button>
            </div>
          </div>

          <div className="login-body">
            {/* Quick-start credentials notice box */}
            <div className="login-info-box">
              <h4>
                <ShieldAlert size={14} /> Quick-Start Credentials
              </h4>
              {loginRole === 'admin' ? (
                <p>Use Login ID: <strong style={{ textTransform: 'none' }}>{localStorage.getItem('gov_file_register_admin_id') || 'admin'}</strong> and Password: <strong>{localStorage.getItem('gov_file_register_admin_pass') || 'admin'}</strong> to access the admin register room dashboard.</p>
              ) : (
                <p>Use Login ID: <strong>priya</strong> or <strong>REC-001</strong> and Password: <strong>password</strong>. (Other officials: amit, rajesh, sunita).</p>
              )}
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Login ID / User ID</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder={loginRole === 'admin' ? "e.g. admin" : "e.g. priya"} 
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    style={{ paddingLeft: '42px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="input-field" 
                    placeholder="••••••••" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ paddingLeft: '42px' }}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Sign In to Portal
              </button>
            </form>
          </div>
        </div>

        {/* Action Notification Toast Box */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div 
              key={toast.id} 
              className={`toast ${toast.isError ? 'error' : 'success'}`}
            >
              <ShieldAlert size={16} />
              <span>{toast.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* 1. Mobile Sidebar Navigation Drawer Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">F</div>
          <div className="brand-text">
            <h1>Digital File Movement Register</h1>
            <p>Powered by Swadesh</p>
          </div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} title="Close Menu">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-menu">
          {sessionUser.isAdmin ? (
            <>
              <button 
                className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              >
                <LayoutDashboard size={18} />
                Overview Dashboard
              </button>
              
              <button 
                className={`menu-item ${activeTab === 'registers' ? 'active' : ''}`}
                onClick={() => { setActiveTab('registers'); setSidebarOpen(false); }}
              >
                <FileText size={18} />
                Master Ledger
              </button>
              
              <button 
                className={`menu-item ${activeTab === 'issue_file' ? 'active' : ''}`}
                onClick={() => { setActiveTab('issue_file'); setSidebarOpen(false); }}
              >
                <Send size={18} />
                Issue File Tab
              </button>
              
              <button 
                className={`menu-item ${activeTab === 'register_file' ? 'active' : ''}`}
                onClick={() => { setActiveTab('register_file'); setSidebarOpen(false); }}
              >
                <PlusCircle size={18} />
                Register File
              </button>
              
              <button 
                className={`menu-item ${activeTab === 'enroll_recipient' ? 'active' : ''}`}
                onClick={() => { setActiveTab('enroll_recipient'); setSidebarOpen(false); }}
              >
                <Users size={18} />
                Manage Recipient
              </button>
              
              <button 
                className={`menu-item ${activeTab === 'alerts' ? 'active' : ''}`}
                onClick={() => { setActiveTab('alerts'); setSidebarOpen(false); }}
              >
                <ShieldAlert size={18} />
                Custody Alerts
              </button>

              <button 
                className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
              >
                <Settings size={18} />
                Preference Settings
              </button>
              
              <button 
                className={`menu-item ${activeTab === 'scanner' ? 'active' : ''}`}
                onClick={() => { setActiveTab('scanner'); setSidebarOpen(false); }}
              >
                <QrCode size={18} />
                Scan QR Code
              </button>
            </>
          ) : (
            <>
              <button 
                className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              >
                <LayoutDashboard size={18} />
                Dashboard View
              </button>
              
              <button 
                className={`menu-item ${activeTab === 'scanner' ? 'active' : ''}`}
                onClick={() => { setActiveTab('scanner'); setSidebarOpen(false); }}
              >
                <QrCode size={18} />
                Scan QR Code
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ padding: '4px 8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Logged In As
            </span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {sessionUser.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-gold)', marginTop: '2px' }}>
              {sessionUser.designation}
            </div>
            <button className="logout-btn" onClick={() => { handleLogout(); setSidebarOpen(false); }}>
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="main-content">
        
        {/* Header bar */}
        <header className="main-header">
          <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(true)} title="Open Menu">
            <Menu size={20} />
          </button>

          <div className="header-title">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building size={12} /> {orgName}
            </span>
            <h2>Physical File Movement Register</h2>
          </div>

          <div className="header-meta">
            {/* Global Search Button */}
            <button className="header-search-btn" onClick={() => { setSearchQuery(''); setSearchModalOpen(true); }}>
              <Search size={14} /> <span className="search-btn-text">Search Register</span>
            </button>

            <span className={`badge-role ${sessionUser.isAdmin ? 'admin' : 'recipient'}`}>
              Welcome, {sessionUser.name}
            </span>
            
            <div className="system-time" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} className="text-gold" />
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Navigation Content */}
        {sessionUser.isAdmin ? (
          activeTab === 'scanner' ? (
            <QRScannerPanel 
              currentUser={sessionUser}
              onActionComplete={triggerToast}
              filesList={filesList}
              recipientsList={recipientsList}
              refreshData={refreshData}
            />
          ) : (
            <AdminDashboard 
              onActionComplete={triggerToast}
              filesList={filesList}
              recipientsList={recipientsList}
              movementsList={movementsList}
              refreshData={refreshData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              orgName={orgName}
              setOrgName={setOrgName}
            />
          )
        ) : (
          activeTab === 'dashboard' ? (
            <RecipientDashboard 
              currentUser={sessionUser}
              onActionComplete={triggerToast}
              filesList={filesList}
              recipientsList={recipientsList}
              movementsList={movementsList}
              refreshData={refreshData}
            />
          ) : (
            <QRScannerPanel 
              currentUser={sessionUser}
              onActionComplete={triggerToast}
              filesList={filesList}
              recipientsList={recipientsList}
              refreshData={refreshData}
            />
          )
        )}
      </main>

      {/* 3. Mobile Navigation Bottom Bar */}
      <nav className="bottom-nav">
        <button 
          className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        <button 
          className={`bottom-nav-item ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
        <button 
          className={`bottom-nav-item ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => { setActiveTab('scanner'); setSidebarOpen(false); }}
        >
          <QrCode size={20} />
          <span>Scan QR</span>
        </button>
        <button 
          className="bottom-nav-item"
          onClick={handleLogout}
          style={{ color: 'var(--accent-red)' }}
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </nav>

      {/* 4. Action Notification Toast Box */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`toast ${toast.isError ? 'error' : 'success'}`}
          >
            <ShieldAlert size={16} />
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* 5. Global Search Modal */}
      {searchModalOpen && (
        <div className="search-modal-overlay" onClick={() => setSearchModalOpen(false)}>
          <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="search-header-container">
              <div className="search-input-wrapper">
                <Search className="search-input-icon" size={20} />
                <input 
                  type="text" 
                  className="search-input-field" 
                  placeholder="Global search files by ID, Subject details, or Section department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button className="search-close-btn" onClick={() => setSearchModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                Showing {filteredSearchFiles.length} of {filesList.length} files in register database
              </div>
            </div>

            <div className="search-results-container">
              <div className="search-results-list">
                {filteredSearchFiles.map(file => {
                  const overdue = isFileOverdue(file);
                  return (
                    <div key={file.id} className={`search-result-row ${overdue ? 'bg-overdue overdue-border' : ''}`}>
                      <div className="search-result-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="file-id-badge">{file.id}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{file.department}</span>
                        </div>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '6px', color: 'var(--text-main)' }}>
                          {file.subject}
                        </h4>
                        
                        <div className="search-result-meta" style={{ marginTop: '6px' }}>
                          <span>Custodian: <strong style={{ color: file.currentHolderId ? 'var(--text-main)' : 'var(--accent-gold)' }}>{getHolderName(file.currentHolderId)}</strong></span>
                          {file.status === 'Issued' && file.anticipatedReturnDate && (
                            <span className={overdue ? 'overdue-text' : ''}>
                              Promises Return: {new Date(file.anticipatedReturnDate).toLocaleDateString()} {new Date(file.anticipatedReturnDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        {file.status === 'Issued' && file.reason && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                            Reason: "{file.reason}"
                          </div>
                        )}
                      </div>

                      <div>
                        {overdue ? (
                          <span className="status-pill overdue">OVERDUE</span>
                        ) : (
                          <span className={`status-pill ${file.status.toLowerCase().replace(' ', '')}`}>
                            {file.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredSearchFiles.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <FileText size={40} style={{ opacity: 0.15, marginBottom: '12px' }} />
                    <p style={{ fontSize: '14px' }}>No files found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
