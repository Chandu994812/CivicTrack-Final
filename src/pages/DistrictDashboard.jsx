import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaChartPie, FaTicketAlt, FaUsers, FaExclamationTriangle, 
  FaSearch, FaBars, FaTimes, FaSignOutAlt, FaBuilding,
  FaEnvelope, FaBook, FaCheck, FaTree, FaRoad, FaWater, FaBolt, FaGavel, FaPaperPlane, FaMapMarkerAlt, FaBalanceScale
} from 'react-icons/fa';

import ChatWindow from '../components/ChatWindow';
import InboxWindow from '../components/InboxWindow';

const NAV_ITEMS = [
  { id: 'overview',    label: 'Overview',          icon: FaChartPie },
  { id: 'mandals',     label: 'Mandal Authorities',icon: FaUsers },
  { id: 'escalations', label: 'Escalated Pipeline',icon: FaTicketAlt },
  { id: 'overdue',     label: 'Critical Backlog',  icon: FaExclamationTriangle },
  { id: 'logbook',     label: 'Operations Log',    icon: FaBook },
];

const EXTERNAL_DEPARTMENTS = [
  { id: 'COLLECTOR', name: 'District Collectorate', icon: FaGavel },
  { id: 'RNB', name: 'Roads & Buildings (R&B)', icon: FaRoad },
  { id: 'APSPDCL', name: 'APSPDCL (Electricity)', icon: FaBolt },
  { id: 'RWSS', name: 'Rural Water Supply (RWS&S)', icon: FaWater },
  { id: 'FOREST', name: 'Forest Dept (Plantations)', icon: FaTree },
  { id: 'REVENUE', name: 'Revenue Department', icon: FaBuilding },
  { id: 'PRRD', name: 'Panchayat Raj (PR&RD)', icon: FaUsers },
];

export default function DistrictDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [posts, setPosts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [mandalAuthorities, setMandalAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mandalSearch, setMandalSearch] = useState('');
  
  // Secure Comms
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [selectedAuth, setSelectedAuth] = useState(null);
  
  // Inbox Polling
  const [showInbox, setShowInbox] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifiedMessageIdsRef = useRef(new Set());
  const [toast, setToast] = useState({ message: '', visible: false, type: 'info' });

  // Task & Email Modal
  const [taskingPostId, setTaskingPostId] = useState(null);
  const [taskDept, setTaskDept] = useState('District Collectorate');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskContactNumber, setTaskContactNumber] = useState('');
  const [taskEmail, setTaskEmail] = useState('');
  const [taskContactDetails, setTaskContactDetails] = useState('');

  const [emailModalTask, setEmailModalTask] = useState(null);
  const [emailMessage, setEmailMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToastMsg = (message, type = 'info') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast({ message: '', visible: false, type: 'info' }), 4000);
  };

  const timeAgo = (d) => {
    if (!d) return '';
    const days = Math.floor((new Date() - new Date(d)) / 86400000);
    if (days === 0) return 'Today';
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };
  const getDays = (d) => Math.floor((new Date() - new Date(d)) / 86400000);

  useEffect(() => {
    const rawData = localStorage.getItem('civik_user');
    if (!rawData) { navigate('/login'); return; }
    const parsed = JSON.parse(rawData);
    if (parsed.role !== 'district_authority') { navigate('/authority'); return; }
    setUser(parsed);
    fetchData(parsed);
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`/api/messages/user/${user._id || user.id}`);
        if (res.ok) {
          const allMsgs = await res.json();
          const unread = allMsgs.filter(m => m.receiverId === (user._id || user.id) && !m.read);
          setUnreadCount(unread.length);

          unread.forEach(m => {
            if (!notifiedMessageIdsRef.current.has(m._id)) {
              showToastMsg(`New message from ${m.senderName}`, 'info');
              notifiedMessageIdsRef.current.add(m._id);
            }
          });
        }
      } catch(err) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 4000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchData = async (userData) => {
    try {
      setLoading(true);
      const district = userData.jurisdiction || 'Visakhapatnam';
      
      const hierarchyRes = await fetch(`/api/hierarchy/mandals/${district}`);
      let mandalList = [];
      if (hierarchyRes.ok) mandalList = await hierarchyRes.json();
      setMandals(mandalList);

      const postsRes = await fetch(`/api/posts`);
      if (postsRes.ok) {
        const allPosts = await postsRes.json();
        const filteredPosts = allPosts.filter(p => p.jurisdictionInfo?.district && p.jurisdictionInfo.district.toLowerCase() === district.toLowerCase());
        setPosts(filteredPosts);
      }
      const usersRes = await fetch(`/api/users?role=mandal_authority`);
      if (usersRes.ok) {
        const allAuths = await usersRes.json();
        const lowerMandalList = mandalList.map(m => m.toLowerCase());
        const relevantAuths = allAuths.filter(a => a.jurisdiction && lowerMandalList.includes(a.jurisdiction.toLowerCase()));
        setMandalAuthorities(relevantAuths);
      }
    } catch (err) {} finally { setLoading(false); }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const post = posts.find(p => p._id === taskingPostId);
      const newTasks = [
        ...(post.tasks || []), 
        { 
          assignedDept: taskDept, 
          desc: taskDesc, 
          contactNumber: taskContactNumber,
          email: taskEmail,
          contactDetails: taskContactDetails,
          status: 'Pending' 
        }
      ];
      const res = await fetch(`/api/posts/${taskingPostId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: newTasks })
      });
      if (res.ok) {
        setTaskingPostId(null); 
        setTaskDesc('');
        setTaskContactNumber('');
        setTaskEmail('');
        setTaskContactDetails('');
        fetchData(user);
        setActiveSection('logbook');
        showToastMsg('Task assigned to external department successfully.', 'success');
      }
    } catch (err) {} finally { setSubmitting(false); }
  };

  const handleUpdateTaskStatus = async (postId, taskIndex, newStatus) => {
    try {
      const post = posts.find(p => p._id === postId);
      const newTasks = [...post.tasks];
      newTasks[taskIndex].status = newStatus;
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tasks: newTasks })
      });
      if (res.ok) fetchData(user);
    } catch (err) {}
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailModalTask.task.email,
          subject: `CivikTrack Official Directive - ${emailModalTask.post.title}`,
          message: emailMessage,
          senderName: `${user.name} (${user.role.replace('_', ' ').toUpperCase()})`
        })
      });
      if (res.ok) {
        showToastMsg('Email sent successfully.', 'success');
        setEmailModalTask(null);
        setEmailMessage('');
      } else {
        showToastMsg('Failed to send email.', 'error');
      }
    } catch (err) {} finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('civik_user');
    window.location.href = '/login';
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="text-5xl mb-4 text-indigo-600 animate-bounce">⚖️</div>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xl">Loading CivikTrack</p>
      </div>
    </div>
  );

  const escalatedPosts = posts.filter(p => p.level === 'District' && p.status !== 'Resolved' && !p.deletion?.isDeleted);
  const overduePosts = escalatedPosts.filter(p => getDays(p.escalationDate) > 14);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-slate-500 hover:text-slate-800 transition rounded-lg" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <FaTimes size={20}/> : <FaBars size={20}/>}
            </button>
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
               <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
                 <FaBalanceScale className="text-yellow-400 text-lg" />
               </div>
               <div className="leading-tight">
                 <h1 className="font-black text-slate-900 tracking-tighter text-2xl">CivikTrack</h1>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">District Portal</p>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setShowInbox(true)} 
              className="relative p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-full transition-colors border border-slate-200 hover:border-indigo-200"
              title="Secure Inbox"
            >
              <FaEnvelope className="text-xl" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm animate-pulse">{unreadCount}</span>}
            </button>
            <div className="hidden md:flex flex-col items-end border-l border-slate-200 pl-5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{user.jurisdiction} District</span>
              <p className="text-sm font-bold text-slate-800 tracking-wide">{user.name}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-red-600 font-bold px-4 py-2 rounded-xl transition-all duration-200 text-sm border border-slate-200 shadow-sm">
              <FaSignOutAlt /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Toast */}
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-10 fade-in border ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-900 border-slate-800 text-white'}`}>
          {toast.type === 'error' ? <FaExclamationTriangle className="text-red-500 text-xl" /> : <FaCheck className="text-emerald-400 text-xl" />}
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}

      {showInbox && <InboxWindow currentUser={user} onClose={() => setShowInbox(false)} />}
      {showMsgModal && selectedAuth && <ChatWindow currentUser={user} otherUser={selectedAuth} onClose={() => setShowMsgModal(false)} />}

      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full relative">
        {/* SIDEBAR */}
        <aside className={`fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] z-30 bg-slate-50 w-64 flex-shrink-0 flex flex-col py-6 transition-transform duration-300 border-r border-slate-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} `}>
          <nav className="flex-1 px-3 space-y-1.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeSection === id;
              const hasBadge = id === 'overdue' && overduePosts.length > 0;
              return (
                <button
                  key={id} onClick={() => { setActiveSection(id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`text-lg ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="flex-1 text-left">{label}</span>
                  {hasBadge && <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{overduePosts.length}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-slate-900/20 z-20 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 px-4 sm:px-10 py-8 min-w-0 overflow-y-auto">
          {activeSection === 'overview' && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Dashboard Overview</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">High-level metrics for {user.jurisdiction} District.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <MetricCard label="Mandals Monitored" value={mandals.length} color="indigo" icon={<FaBuilding />} />
                <MetricCard label="Active Authorities" value={mandalAuthorities.length} color="emerald" icon={<FaUsers />} />
                <MetricCard label="Escalated Pipeline" value={escalatedPosts.length} color="blue" icon={<FaTicketAlt />} />
                <MetricCard label="Critical Delays" value={overduePosts.length} color="red" icon={<FaExclamationTriangle />} />
              </div>
            </div>
          )}

          {activeSection === 'mandals' && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Mandal Authorities</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Manage and communicate with officials under your district.</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">{mandalAuthorities.length}</div>
                   <span className="text-slate-600 text-sm font-bold uppercase tracking-widest">Active Officials</span>
                </div>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input type="text" placeholder="Search authorities..." value={mandalSearch} onChange={e => setMandalSearch(e.target.value)} className="pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-72 font-medium transition-shadow" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {mandalAuthorities.filter(a => a.name.toLowerCase().includes(mandalSearch.toLowerCase()) || a.jurisdiction.toLowerCase().includes(mandalSearch.toLowerCase())).map(auth => (
                   <div key={auth._id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow group">
                      <div className="flex justify-between items-start mb-4">
                         <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                            <FaUsers size={20} />
                         </div>
                         <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Active</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-0.5">{auth.name}</h3>
                      <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest mb-6">{auth.jurisdiction} Mandal</p>
                      
                      <button onClick={() => { setSelectedAuth(auth); setShowMsgModal(true); }} className="w-full bg-slate-50 hover:bg-indigo-600 text-slate-600 hover:text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border border-slate-200 hover:border-indigo-600">
                         <FaEnvelope /> Direct Message
                      </button>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {activeSection === 'escalations' && (
            <div className="animate-in fade-in duration-500">
               <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Escalated Pipeline</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Complaints escalated from mandal level requiring intervention.</p>
              </div>
              <EscalationList 
                 posts={escalatedPosts} 
                 timeAgo={timeAgo} 
                 getDays={getDays} 
                 onDelegate={(post) => { setTaskingPostId(post._id); setTaskDesc(`Please review and take necessary action for issue: ${post.title}`); }}
              />
            </div>
          )}

          {activeSection === 'overdue' && (
            <div className="animate-in fade-in duration-500">
               <div className="mb-8">
                <h1 className="text-2xl font-black text-red-600 tracking-tight uppercase">Critical Backlog</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Cases unresolved for over 14 days.</p>
              </div>
              <EscalationList 
                 posts={overduePosts} 
                 timeAgo={timeAgo} 
                 getDays={getDays} 
                 isOverdue 
                 onDelegate={(post) => { setTaskingPostId(post._id); setTaskDesc(`URGENT: This issue is overdue. Immediate action required for: ${post.title}`); }}
              />
            </div>
          )}

          {activeSection === 'logbook' && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Operations Log</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Track issues delegated to external departments.</p>
              </div>
              <LogBook posts={posts} onUpdateTask={handleUpdateTaskStatus} onEmailTask={(post, task) => { setEmailModalTask({post, task}); setEmailMessage(`Dear Department Official,\n\nPlease find the details regarding the task assigned:\n\nIssue: ${post.title}\nDetails: ${task.desc}\nLocation: ${post.location}\n\nKindly acknowledge and update the status.\n\nRegards,\n${user.name}\nDistrict Authority`); }} />
            </div>
          )}

        </main>
      </div>

      {/* Task Creation Modal */}
      {taskingPostId && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-8 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl border border-slate-200">
            <h3 className="font-black text-2xl text-slate-900 mb-2 uppercase tracking-tight">Delegate Issue</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Assign this escalated issue to an external state department.</p>
            <form onSubmit={handleAddTask} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Target Department</label>
                <div className="relative">
                   <select value={taskDept} onChange={e => setTaskDept(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3.5 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow font-semibold">
                     {EXTERNAL_DEPARTMENTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                   </select>
                   <FaBuilding className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Official Email (Optional)</label>
                <input type="email" value={taskEmail} onChange={e => setTaskEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" placeholder="dept.head@ap.gov.in" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Instructions</label>
                <textarea rows="4" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" placeholder="Detail the necessary action..."></textarea>
              </div>
              <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setTaskingPostId(null)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2 shadow-md">
                  <FaPaperPlane /> {submitting ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {emailModalTask && (
        <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-8 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl border border-slate-200">
            <h3 className="font-black text-2xl text-slate-900 mb-2 uppercase tracking-tight flex items-center gap-3"><FaEnvelope className="text-indigo-600"/> Compose Email</h3>
            <p className="text-sm text-slate-600 mb-6 font-medium bg-slate-50 p-3 rounded-lg border border-slate-200">To: <span className="font-bold text-slate-900">{emailModalTask.task.email}</span></p>
            <form onSubmit={handleSendEmail} className="space-y-4">
               <textarea rows="10" value={emailMessage} onChange={e => setEmailMessage(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow font-mono text-sm leading-relaxed"></textarea>
               <div className="flex gap-3 justify-end pt-4">
                 <button type="button" onClick={() => setEmailModalTask(null)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition">Cancel</button>
                 <button type="submit" disabled={submitting} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition shadow-md disabled:opacity-50 flex items-center gap-2">
                    <FaPaperPlane /> {submitting ? 'Sending...' : 'Send Mail'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function MetricCard({ label, value, color, icon }) {
  const styles = {
    indigo:  'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue:    'bg-blue-50 text-blue-600 border-blue-100',
    red:     'bg-red-50 text-red-600 border-red-100'
  }[color];

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles} border`}>{icon}</div>
      </div>
      <p className="text-4xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function EscalationList({ posts, timeAgo, getDays, isOverdue, onDelegate }) {
  if (posts.length === 0) return <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed"><p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No cases found</p></div>;
  
  return (
    <div className="grid gap-4">
       {posts.map(post => {
         const daysOld = getDays(post.escalationDate);
         return (
           <div key={post._id} className={`bg-white border ${isOverdue ? 'border-red-200' : 'border-slate-200'} p-6 rounded-2xl flex flex-col md:flex-row gap-6 transition-shadow hover:shadow-md`}>
              
              <div className="flex-1 space-y-2">
                 <div className="flex items-center gap-3 mb-1">
                    <span className="bg-slate-100 text-slate-600 font-mono text-[10px] font-bold px-2 py-1 rounded border border-slate-200">#{post._id?.substring(0,8).toUpperCase()}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${isOverdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                       {daysOld} Days Elapsed
                    </span>
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 leading-tight">{post.title}</h3>
                 <p className="text-sm text-slate-500 line-clamp-2">{post.desc}</p>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-2">
                    <FaMapMarkerAlt /> {post.location} • {post.jurisdictionInfo?.mandal || 'Unknown Mandal'}
                 </div>
              </div>

              <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[180px]">
                 <button onClick={() => onDelegate(post)} className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors ${isOverdue ? 'bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600' : 'bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200'}`}>
                    Delegate Task
                 </button>
              </div>
           </div>
         )
       })}
    </div>
  );
}

function LogBook({ posts, onUpdateTask, onEmailTask }) {
  const postsWithTasks = [...posts.filter(p => p.tasks && p.tasks.length > 0)].sort((a,b) => {
     const aSolved = a.tasks.every(t => t.status === 'Solved');
     const bSolved = b.tasks.every(t => t.status === 'Solved');
     return (aSolved ? 1 : 0) - (bSolved ? 1 : 0);
  });
  
  if (postsWithTasks.length === 0) return <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed"><p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Logbook is empty</p></div>;

  return (
    <div className="space-y-6">
      {postsWithTasks.map(post => (
        <div key={post._id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
             <h3 className="text-slate-900 font-bold">{post.title}</h3>
             <span className="text-xs font-mono text-slate-400">#{post._id?.substring(0,8).toUpperCase()}</span>
          </div>
          <div className="p-6 divide-y divide-slate-100">
             {[...post.tasks].sort((a,b) => (a.status === 'Solved' ? 1 : 0) - (b.status === 'Solved' ? 1 : 0)).map((task, tIdx) => (
                <div key={tIdx} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between gap-6">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                         <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">{task.assignedDept}</span>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${task.status === 'Solved' ? 'text-emerald-500' : 'text-amber-500'}`}>{task.status}</span>
                      </div>
                      <p className="text-sm text-slate-600">{task.desc}</p>
                      {task.email && <p className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-1.5"><FaEnvelope className="text-slate-400"/> {task.email}</p>}
                   </div>
                   
                   <div className="flex gap-2 items-center">
                     {task.email && (
                        <button onClick={() => onEmailTask(post, task)} className="h-9 px-3 flex items-center justify-center bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-lg transition font-bold text-xs">
                           <FaEnvelope />
                        </button>
                     )}
                     {task.status !== 'Solved' && (
                        <button onClick={() => onUpdateTask(post._id, tIdx, 'Solved')} className="h-9 px-4 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg transition font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                           <FaCheck /> Complete
                        </button>
                     )}
                   </div>
                </div>
             ))}
          </div>
        </div>
      ))}
    </div>
  );
}
