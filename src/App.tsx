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
  ShieldAlert
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner'>('dashboard');
  const [sessionUser, setSessionUser] = useState<UserSession>({
    id: 'Admin',
    name: 'Administrator',
    designation: 'Record Room Head',
    isAdmin: true
  });
  
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

  // Switch between Admin testing session and Recipient dashboard
  const handleUserSessionChange = (userId: string) => {
    if (userId === 'Admin') {
      setSessionUser({
        id: 'Admin',
        name: 'Administrator',
        designation: 'Record Room Head',
        isAdmin: true
      });
      triggerToast('Switched to Admin Workspace');
    } else {
      const rec = recipientsList.find((r) => r.id === userId);
      if (rec) {
        setSessionUser({
          id: rec.id,
          name: rec.name,
          designation: rec.designation,
          isAdmin: false
        });
        triggerToast(`Signed in as ${rec.name} (${rec.designation})`);
      }
    }
  };

  return (
    <div className="app-container">
      
      {/* 1. Desktop Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">F</div>
          <div className="brand-text">
            <h1>National Register</h1>
            <p>Physical File Movement</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard View
          </button>
          
          <button 
            className={`menu-item ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('scanner')}
          >
            <QrCode size={18} />
            Scan QR Code
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-selector">
            <label>Testing Persona Switcher</label>
            <select
              className="user-select-dropdown"
              value={sessionUser.isAdmin ? 'Admin' : sessionUser.id}
              onChange={(e) => handleUserSessionChange(e.target.value)}
            >
              <option value="Admin">🔑 Administrator (Record Room)</option>
              <optgroup label="Registered Officials">
                {recipientsList.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    👤 {rec.name} ({rec.designation})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="main-content">
        
        {/* Header bar */}
        <header className="main-header">
          <div className="header-title">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building size={12} /> Govt of India • Ministry of Electronics & IT
            </span>
            <h2>Physical File Movement Register</h2>
          </div>

          <div className="header-meta">
            <span className={`badge-role ${sessionUser.isAdmin ? 'admin' : 'recipient'}`}>
              {sessionUser.isAdmin ? 'Admin Portal' : 'Recipient Portal'}
            </span>
            
            <div className="system-time" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} className="text-gold" />
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Navigation Content */}
        {activeTab === 'dashboard' ? (
          sessionUser.isAdmin ? (
            <AdminDashboard 
              onActionComplete={triggerToast}
              filesList={filesList}
              recipientsList={recipientsList}
              movementsList={movementsList}
              refreshData={refreshData}
            />
          ) : (
            <RecipientDashboard 
              currentUser={sessionUser}
              onActionComplete={triggerToast}
              filesList={filesList}
              recipientsList={recipientsList}
              movementsList={movementsList}
              refreshData={refreshData}
            />
          )
        ) : (
          <QRScannerPanel 
            currentUser={sessionUser}
            onActionComplete={triggerToast}
            filesList={filesList}
            recipientsList={recipientsList}
            refreshData={refreshData}
          />
        )}
      </main>

      {/* 3. Mobile Navigation Bottom Bar */}
      <nav className="bottom-nav">
        <button 
          className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        <button 
          className={`bottom-nav-item ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveTab('scanner')}
        >
          <QrCode size={20} />
          <span>Scan QR</span>
        </button>
        <div className="bottom-nav-item" style={{ cursor: 'default' }}>
          <select 
            value={sessionUser.isAdmin ? 'Admin' : sessionUser.id}
            onChange={(e) => handleUserSessionChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '11px',
              fontWeight: 600,
              maxWidth: '80px',
              outline: 'none'
            }}
          >
            <option value="Admin" style={{ background: '#0b0f19' }}>Admin</option>
            {recipientsList.map((rec) => (
              <option key={rec.id} value={rec.id} style={{ background: '#0b0f19' }}>
                {rec.name.split(' ')[0]}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Role</span>
        </div>
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

    </div>
  );
}

export default App;
