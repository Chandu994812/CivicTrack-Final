import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaChartBar, FaTicketAlt, FaShieldAlt, FaUsers, FaExclamationCircle, 
  FaCheckCircle, FaExclamationTriangle, FaSearch, FaMapMarkerAlt,
  FaBars, FaTimes, FaSignOutAlt, FaEnvelope, FaCommentDots, FaPhone, FaBuilding,
  FaBook, FaCheck, FaChevronDown, FaBalanceScale
} from 'react-icons/fa';

import ChatWindow from '../components/ChatWindow';
import InboxWindow from '../components/InboxWindow';

const NAV_ITEMS = [
  { id: 'overview',    label: 'Overview',          icon: FaChartBar },
  { id: 'villages',    label: 'Village Authorities', icon: FaUsers },
  { id: 'escalations', label: 'Escalations',       icon: FaTicketAlt },
  { id: 'overdue',     label: 'Overdue (>7 Days)', icon: FaExclamationTriangle },
  { id: 'logbook',     label: 'Operational Log Book', icon: FaBook },
];

export default function MandalDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuExpanded, setMenuExpanded] = useState(false);

  const [posts, setPosts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [villageAuthorities, setVillageAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [villageSearch, setVillageSearch] = useState('');
  
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [selectedAuth, setSelectedAuth] = useState(null);
  const [msgContent, setMsgContent] = useState('');

  const [emailModalTask, setEmailModalTask] = useState(null);
  const [emailMessage, setEmailMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Inbox & Polling State
  const [showInbox, setShowInbox] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifiedMessageIdsRef = React.useRef(new Set());
  const [toast, setToast] = useState({ message: '', visible: false });

  const showToast = (message) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 4000);
  };

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
              showToast(`Secure Msg from ${m.senderName}`);
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
    if (parsed.role !== 'mandal_authority') { navigate('/authority'); return; }
    setUser(parsed);
    fetchData(parsed);
  }, [navigate]);

  const fetchData = async (userData) => {
    try {
      setLoading(true);
      const mandal = userData.jurisdiction;
      let villageList = [];
      
      const hierarchyRes = await fetch(`/api/hierarchy`);
      if (hierarchyRes.ok) {
        const fullHierarchy = await hierarchyRes.json();
        for (const d of fullHierarchy.districts) {
          const m = d.mandals.find(m => m.name.toLowerCase() === mandal.toLowerCase());
          if (m) {
            villageList = m.villages;
            break;
          }
        }
      }
      setVillages(villageList);

      const postsRes = await fetch(`/api/posts?mandal=${encodeURIComponent(mandal)}`);
      if (postsRes.ok) {
        const allPosts = await postsRes.json();
        const filteredPosts = allPosts.filter(p => {
          if (!p.jurisdictionInfo?.village) return false;
          const v = p.jurisdictionInfo.village.toLowerCase();
          return villageList.some(listV => listV.toLowerCase() === v || listV.toLowerCase().includes(v) || v.includes(listV.toLowerCase()));
        });
        setPosts(filteredPosts);
      }
      const usersRes = await fetch(`/api/users?role=village_authority`);
      if (usersRes.ok) {
        const allAuths = await usersRes.json();
        const relevantAuths = allAuths.filter(a => {
          if (!a.jurisdiction) return false;
          const j = a.jurisdiction.toLowerCase();
          return villageList.some(listV => listV.toLowerCase() === j || listV.toLowerCase().includes(j) || j.includes(listV.toLowerCase()));
        });
        setVillageAuthorities(relevantAuths);
      }
    } catch (err) {} finally { setLoading(false); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgContent) return;
    try {
      const btn = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user._id || user.id, receiverId: selectedAuth._id, text: msgContent })
      });
      if (btn.ok) { alert("Message sent."); setShowMsgModal(false); setMsgContent(''); }
    } catch (err) {}
  };

  const handleResolveTicket = async (postId, taskIndex) => {
    try {
      const post = posts.find(p => p._id === postId);
      const newTasks = [...post.tasks];
      newTasks[taskIndex].status = 'Solved';
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tasks: newTasks })
      });
      if (res.ok) fetchData(user);
    } catch (err) {}
  };

  const handleUpdateTaskStatus = async (postId, taskIndex, newStatus) => {
    try {
      const post = posts.find(p => p._id === postId);
      const newTasks = [...post.tasks];
      newTasks[taskIndex].status = newStatus;

      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: newTasks })
      });
      if (res.ok) {
        fetchData(user);
      }
    } catch (err) {
      console.error(err);
    }
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
          subject: `URGENT: Operational Task - ${emailModalTask.post.title}`,
          message: emailMessage,
          senderName: `${user.name} (${user.role})`
        })
      });
      if (res.ok) {
        alert('Email dispatched successfully to the department.');
        setEmailModalTask(null);
        setEmailMessage('');
      } else {
        alert('Failed to send email.');
      }
    } catch (err) {
      alert('Network error while sending email.');
    } finally {
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
        <div className="text-5xl mb-4 animate-bounce">⚖️</div>
        <p className="text-indigo-900 font-black tracking-widest uppercase text-xl animate-pulse">Initializing Portal</p>
      </div>
    </div>
  );

  const escalatedPosts = posts.filter(p => p.level === 'Mandal' && p.status !== 'Resolved' && !p.deletion?.isDeleted);
  const overduePosts = escalatedPosts.filter(p => getDays(p.escalationDate) > 7);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 border-b border-indigo-950 shadow-lg sticky top-0 z-40 text-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 text-indigo-200 hover:text-white transition bg-indigo-800/50 rounded-lg mr-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <FaTimes size={20}/> : <FaBars size={20}/>}
            </button>
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
               <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
                 <FaBalanceScale className="text-yellow-400 text-lg" />
               </div>
               <div className="leading-tight">
                 <h1 className="font-black text-white text-2xl tracking-tighter">CivikTrack</h1>
                 <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest -mt-0.5">Mandal Portal</p>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowInbox(true)} 
              className="relative p-2.5 bg-indigo-800/50 hover:bg-indigo-700 rounded-xl transition shadow-inner border border-indigo-700"
              title="Secure Inbox"
            >
              <FaEnvelope className="text-xl text-indigo-200 hover:text-white" />
              {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-pulse">{unreadCount}</span>}
            </button>
            <div className="hidden md:flex flex-col items-end border-r border-indigo-700 pr-6">
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-300 mb-0.5">Active Jurisdiction</span>
              <p className="text-sm font-bold text-white tracking-wide">{user.jurisdiction} Mandal</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-indigo-950 hover:bg-red-600 text-indigo-100 hover:text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-300 text-sm shadow-inner border border-indigo-800 hover:border-red-500">
              <FaSignOutAlt /> <span className="hidden sm:inline uppercase tracking-wider text-xs">Logout Off Duty</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Toast */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 bg-indigo-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-10 fade-in border border-indigo-700">
          <FaEnvelope className="text-indigo-300 text-xl" />
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}

      {showInbox && <InboxWindow currentUser={user} onClose={() => setShowInbox(false)} />}

      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full relative">
        {/* SIDEBAR DRAWER */}
        <aside className={`fixed top-20 left-0 h-[calc(100vh-5rem)] z-40 bg-white border-r border-slate-200 w-72 flex-shrink-0 flex flex-col py-8 transition-transform duration-300 shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} `}>
          <div className="px-6 mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorized Officer</p>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-lg border-2 border-indigo-200 shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-indigo-600 font-black tracking-wider uppercase mt-0.5">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <nav className="space-y-2 px-4 flex-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const isActive = activeSection === id;
                const hasBadge = id === 'overdue' && overduePosts.length > 0;
                return (
                  <button
                    key={id} onClick={() => { setActiveSection(id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 ${
                      isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 transform scale-[1.02]' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-900'
                    }`}
                  >
                    <Icon className={`text-lg ${isActive ? 'text-indigo-200' : 'text-slate-400'}`} />
                    <span className="flex-1 text-left tracking-wide">{label}</span>
                    {hasBadge && <span className="bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-sm">{overduePosts.length}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 transition-opacity" onClick={() => setSidebarOpen(false)} />}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 px-4 sm:px-10 py-10 min-w-0 overflow-y-auto w-full bg-slate-50/50">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {activeSection === 'overview' && (
              <div>
                <SectionHeader title={`${user.jurisdiction} Mandal Overview`} subtitle="Real-time summary of your jurisdiction" icon="📊" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  <MetricCard label="Villages Under Jurisdiction" value={villages.length} color="blue" icon={<FaBuilding />} />
                  <MetricCard label="Registered Village Auths" value={villageAuthorities.length} color="green" icon={<FaUsers />} />
                  <MetricCard label="Active Escalations" value={escalatedPosts.length} color="amber" icon={<FaTicketAlt />} />
                  <MetricCard label="Overdue Cases (>7 Days)" value={overduePosts.length} color="red" icon={<FaExclamationTriangle />} />
                </div>
              </div>
            )}

            {activeSection === 'villages' && (
              <div>
                <SectionHeader title="Village Authorities" subtitle="Manage and communicate with officials under your jurisdiction" icon="👥" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-600">
                    <span className="text-indigo-600">{villageAuthorities.length}</span> Officials Active
                  </div>
                  <div className="relative group">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input type="text" placeholder="Search villages or names..." value={villageSearch} onChange={e => setVillageSearch(e.target.value)} className="pl-11 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-80 transition-all" />
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest">
                         <th className="px-6 py-4">Official Detail</th>
                         <th className="px-6 py-4">Jurisdiction</th>
                         <th className="px-6 py-4">Contact Protocol</th>
                         <th className="px-6 py-4 text-right">Action</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {villageAuthorities.filter(a => a.name.toLowerCase().includes(villageSearch.toLowerCase()) || a.jurisdiction.toLowerCase().includes(villageSearch.toLowerCase())).map(auth => (
                         <tr key={auth._id} className="hover:bg-indigo-50/30 transition-colors">
                           <td className="px-6 py-5">
                             <p className="font-bold text-slate-900 text-sm mb-0.5">{auth.name}</p>
                             <p className="text-[10px] text-slate-400 uppercase tracking-widest">{auth.email}</p>
                           </td>
                           <td className="px-6 py-5 text-indigo-700 text-sm font-black uppercase tracking-wider">{auth.jurisdiction}</td>
                           <td className="px-6 py-5 text-slate-600 text-sm font-semibold flex items-center gap-2">
                             <FaPhone className="text-slate-400"/> {auth.phone || 'No Data'}
                           </td>
                           <td className="px-6 py-5 text-right">
                             <button onClick={() => { setSelectedAuth(auth); setShowMsgModal(true); }} className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ml-auto">
                               <FaEnvelope /> Direct Message
                             </button>
                           </td>
                         </tr>
                       ))}
                       {villageAuthorities.length === 0 && (
                         <tr>
                           <td colSpan="4" className="text-center py-10 text-slate-400 text-sm font-semibold">No authorities match your search.</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                </div>
              </div>
            )}

            {activeSection === 'escalations' && (
              <div>
                <SectionHeader title="Escalation Pipeline" subtitle="Complaints elevated to Mandal Directorate" icon="🎫" />
                <TicketTable posts={escalatedPosts} onResolve={handleResolveTicket} timeAgo={timeAgo} getDays={getDays} />
              </div>
            )}

            {activeSection === 'overdue' && (
              <div>
                <SectionHeader title="Overdue Cases (> 7 Days)" subtitle="Critical priority cases needing immediate executive attention" icon="⚠️" />
                <TicketTable posts={overduePosts} onResolve={handleResolveTicket} timeAgo={timeAgo} getDays={getDays} highlightOverdue={true} />
              </div>
            )}

            {activeSection === 'logbook' && (
              <div>
                 <SectionHeader title="Operational Log Book" subtitle="Inter-Departmental Tracker & Resource Registry across your jurisdiction" icon="📞" />
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-indigo-300 transition-colors">
                       <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl font-black">
                          {posts.reduce((acc, p) => acc + (p.tasks?.length || 0), 0)}
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Issued</p>
                          <p className="text-lg font-black text-slate-800">Assigned Tasks</p>
                       </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-orange-300 transition-colors">
                       <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 text-2xl font-black">
                          {posts.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status === 'Pending').length || 0), 0)}
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting</p>
                          <p className="text-lg font-black text-slate-800">Pending Actions</p>
                       </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-blue-300 transition-colors">
                       <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-2xl font-black">
                          {posts.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status === 'Reported').length || 0), 0)}
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engaged</p>
                          <p className="text-lg font-black text-slate-800">Active / Reported</p>
                       </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-emerald-300 transition-colors">
                       <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 text-2xl font-black">
                          {posts.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status === 'Solved').length || 0), 0)}
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Closed</p>
                          <p className="text-lg font-black text-slate-800">Protocol Solved</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center">
                       <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Active Operational Transcript</h3>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized View Only</span>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200">
                                <th className="px-8 py-4">Task / Origin</th>
                                <th className="px-8 py-4">Department</th>
                                <th className="px-8 py-4">Contact Protocol</th>
                                <th className="px-8 py-4 text-center">Status</th>
                                <th className="px-8 py-4 text-right">Action</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                             {posts.flatMap(post => (post.tasks || []).map((task, tIdx) => ({post, task, tIdx})))
                                .sort((a,b) => (a.task.status === 'Solved' ? 1 : 0) - (b.task.status === 'Solved' ? 1 : 0))
                                .map(({post, task, tIdx}) => (
                                <tr key={`${post._id}-${tIdx}`} className="hover:bg-slate-50 transition-colors group">
                                   <td className="px-8 py-6">
                                      <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition truncate max-w-[200px]" title={post.title}>{post.title}</p>
                                      <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">"{task.desc}"</p>
                                      <p className="text-[10px] text-indigo-500 font-bold uppercase mt-2 tracking-widest">📍 {post.jurisdictionInfo?.village}</p>
                                   </td>
                                   <td className="px-8 py-6">
                                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-widest">
                                         {task.assignedDept}
                                      </span>
                                   </td>
                                   <td className="px-8 py-6">
                                      <div className="space-y-1">
                                         <p className="text-sm font-bold text-slate-800">{task.contactDetails || 'N/A'}</p>
                                         <div className="flex flex-col gap-1">
                                            {task.contactNumber && (
                                               <a href={`tel:${task.contactNumber}`} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5">
                                                  <FaPhone /> {task.contactNumber}
                                               </a>
                                            )}
                                            {task.email && (
                                               <button 
                                                 onClick={() => { setEmailModalTask({ post, task }); setEmailMessage(`Respected Team,\n\nWe need an urgent update regarding the ${post.title} issue assigned to your ${task.assignedDept} department.\n\nRegards,\n${user.name}\nMandal Authority`); }}
                                                 className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 mt-1"
                                               >
                                                  <FaEnvelope /> Send Email Directive
                                               </button>
                                            )}
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-8 py-6">
                                      <div className="flex justify-center">
                                         <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border ${
                                            task.status === 'Solved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            task.status === 'Reported' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-orange-50 text-orange-700 border-orange-200'
                                         }`}>
                                            {task.status}
                                         </span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-6 text-right">
                                      <div className="flex justify-end gap-2">
                                         <button 
                                           onClick={() => handleUpdateTaskStatus(post._id, tIdx, 'Reported')}
                                           className={`p-2.5 rounded-xl border transition-all ${task.status === 'Reported' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                                           title="Mark as Reported"
                                         >
                                           <FaExclamationTriangle size={14}/>
                                         </button>
                                         <button 
                                           onClick={() => handleUpdateTaskStatus(post._id, tIdx, 'Solved')}
                                           className={`p-2.5 rounded-xl border transition-all ${task.status === 'Solved' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                                           title="Mark as Solved"
                                         >
                                           <FaCheck size={14}/>
                                         </button>
                                      </div>
                                   </td>
                                </tr>
                             ))}
                             {posts.flatMap(p => p.tasks || []).length === 0 && (
                               <tr>
                                 <td colSpan="5" className="text-center py-12 text-slate-400 font-semibold">No operational tasks have been logged yet.</td>
                               </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {showMsgModal && selectedAuth && (
        <ChatWindow 
          currentUser={user} 
          otherUser={selectedAuth} 
          onClose={() => setShowMsgModal(false)} 
        />
      )}

      {/* EMAIL COMPOSER MODAL */}
      {emailModalTask && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-indigo-950/60 backdrop-blur-sm px-4 py-8 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-indigo-100 overflow-hidden transform transition-all animate-in zoom-in-95">
            <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 flex justify-between items-center">
               <div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Official Department Mail</h3>
                 <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">To: {emailModalTask.task.email}</p>
               </div>
               <button disabled={submitting} onClick={() => setEmailModalTask(null)} className="text-slate-400 hover:text-red-500 bg-white shadow-sm p-2 rounded-full transition-colors"><FaTimes size={16}/></button>
            </div>
            <form onSubmit={handleSendEmail} className="p-8">
               <div className="mb-6">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message Body</label>
                 <textarea required rows="6" value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm text-slate-700 transition-all"></textarea>
               </div>
               <button disabled={submitting} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50">
                 {submitting ? 'Transmitting Securely...' : <><FaEnvelope/> Dispatch Official Email</>}
               </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function SectionHeader({ title, subtitle, icon }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-4 mb-2">
        <span className="text-3xl p-3 bg-white shadow-sm rounded-2xl border border-slate-100">{icon}</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
      </div>
      <p className="text-slate-500 font-medium ml-16">{subtitle}</p>
    </div>
  );
}

function MetricCard({ label, value, color, icon }) {
  const colors = {
    blue:  { bg: 'bg-blue-50',  text: 'text-blue-600',  border: 'border-blue-100', hover: 'hover:border-blue-300' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', hover: 'hover:border-green-300' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', hover: 'hover:border-amber-300' },
    red:   { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', hover: 'hover:border-red-300' },
  }[color];
  return (
    <div className={`bg-white border ${colors.border} ${colors.hover} transition-colors rounded-3xl p-6 shadow-sm relative overflow-hidden group`}>
      <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 transition-transform duration-300">
        <span className="text-8xl">{icon}</span>
      </div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest w-2/3">{label}</p>
        <div className={`w-12 h-12 ${colors.bg} rounded-2xl flex items-center justify-center ${colors.text} text-xl shadow-sm`}>{icon}</div>
      </div>
      <p className={`text-5xl font-black ${colors.text} relative z-10 tracking-tight`}>{value}</p>
    </div>
  );
}

function TicketTable({ posts, onResolve, timeAgo, getDays, highlightOverdue }) {
  if (posts.length === 0) return (
    <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 text-2xl"><FaCheckCircle/></div>
      <p className="text-slate-500 font-bold text-lg">No cases found.</p>
      <p className="text-slate-400 text-sm mt-1">Your jurisdiction pipeline is currently clear.</p>
    </div>
  );
  return (
    <div className={`bg-white border rounded-3xl overflow-hidden shadow-sm ${highlightOverdue ? 'border-red-200' : 'border-slate-200'}`}>
      <table className="w-full text-left">
        <thead>
          <tr className={`border-b text-[10px] font-black uppercase tracking-widest ${highlightOverdue ? 'bg-red-50/50 border-red-100 text-red-600' : 'bg-slate-50/80 border-slate-100 text-slate-500'}`}>
            <th className="px-6 py-5">Post Details</th>
            <th className="px-6 py-5">Origin</th>
            <th className="px-6 py-5">Escalated Status</th>
            <th className="px-6 py-5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${highlightOverdue ? 'divide-red-50' : 'divide-slate-50'} text-sm`}>
          {[...posts].sort((a,b) => (a.status === 'Resolved' ? 1 : 0) - (b.status === 'Resolved' ? 1 : 0)).map(post => {
             const daysOld = getDays(post.escalationDate);
             return (
            <tr key={post._id} className={`transition-colors group ${highlightOverdue ? 'hover:bg-red-50/30' : 'hover:bg-indigo-50/20'}`}>
              <td className="px-6 py-5">
                <p className={`font-mono text-[10px] font-black tracking-widest mb-1.5 ${highlightOverdue ? 'text-red-500' : 'text-indigo-500'}`}>
                  #{post._id?.substring(0, 8).toUpperCase()}
                </p>
                <p className="font-black text-slate-900 group-hover:text-indigo-700 transition-colors">{post.title}</p>
                <p className="text-xs text-slate-500 max-w-xs truncate mt-1">{post.desc}</p>
              </td>
              <td className="px-6 py-5">
                <p className="font-bold text-slate-800">{post.jurisdictionInfo?.village}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Village Auth</p>
              </td>
              <td className="px-6 py-5">
                <p className={`text-xs font-black ${daysOld > 7 ? 'text-red-600' : 'text-slate-600'}`}>{timeAgo(post.escalationDate)}</p>
                {daysOld > 7 && <span className="inline-block mt-1 text-[9px] bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200 font-black uppercase tracking-widest animate-pulse">Over 7 Days</span>}
              </td>
              <td className="px-6 py-5 text-right">
                {post.tasks?.map((task, tIdx) => {
                  if (task.status !== 'Solved') {
                    return (
                      <button key={tIdx} onClick={() => onResolve(post._id, tIdx)} className={`text-xs font-black px-4 py-2 rounded-xl transition ml-auto flex items-center gap-2 uppercase tracking-wide shadow-sm ${highlightOverdue ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
                        <FaCheck/> Mark Resolved
                      </button>
                    )
                  }
                  return null;
                })}
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
}

