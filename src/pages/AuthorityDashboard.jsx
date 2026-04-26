import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaCheck, FaTimes, FaUndo, FaUpload, FaChartBar, FaExclamationTriangle, FaEnvelope, FaBalanceScale } from 'react-icons/fa';
import InboxWindow from '../components/InboxWindow';

export default function AuthorityDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolution Modal State
  const [resolvingPostId, setResolvingPostId] = useState(null);
  const [proofText, setProofText] = useState('');
  const [resolutionImage, setResolutionImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Moderation States
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [deleteReason, setDeleteReason] = useState('Invalid/Spam');
  
  const [escalatingAdminPostId, setEscalatingAdminPostId] = useState(null);
  const [escalateReason, setEscalateReason] = useState('');

  // Task States
  const [taskingPostId, setTaskingPostId] = useState(null);
  const [taskDept, setTaskDept] = useState('Municipality');
  const [taskDesc, setTaskDesc] = useState('');

  const [completingTaskId, setCompletingTaskId] = useState(null);
  
  // Operation Log States
  const [showOperationLog, setShowOperationLog] = useState(false);
  const [taskContactNumber, setTaskContactNumber] = useState('');
  const [taskEmail, setTaskEmail] = useState('');
  const [taskContactDetails, setTaskContactDetails] = useState('');

  // Inbox State
  const [showInbox, setShowInbox] = useState(false);

  // Email Composer States
  const [emailModalTask, setEmailModalTask] = useState(null); // { post, task }
  const [emailMessage, setEmailMessage] = useState('');

  // Toast State
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ message: '', type: '', visible: false }), 4000);
  };
  
  // Sort State
  const [sortOrder, setSortOrder] = useState('Newest');

  // Time elapsed calculator
  const timeAgo = (dateParam) => {
    if (!dateParam) return 'Just now';
    const date = new Date(dateParam);
    const diffInSeconds = Math.floor((new Date() - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return 'Over a month ago';
  };
  
  // Profile State
  const [showProfile, setShowProfile] = useState(false);
  const [profilePass, setProfilePass] = useState('');

  useEffect(() => {
    const rawData = localStorage.getItem('civik_user');
    if (!rawData) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(rawData);
    if (!parsed.role || parsed.role === 'admin' || parsed.role === 'citizen') {
      navigate('/login');
    } else {
      setUser(parsed);
      fetchAuthorityData();
    }
  }, [navigate]);

  const fetchAuthorityData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Message Polling
  const [unreadCount, setUnreadCount] = useState(0);
  const notifiedMessageIdsRef = React.useRef(new Set());

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
              showToast(`Secure Msg from ${m.senderName}`, 'success');
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

  const handleUpdateStatus = async (postId, status, newLevel = null) => {
    try {
      const payload = { status };
      if (newLevel) payload.level = newLevel;

      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchAuthorityData();
      }
    } catch(err) {}
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolutionImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Send resolution metadata
      const payload = {
        status: 'Resolved',
        resolutionProof: {
          comment: proofText,
          imageUrl: resolutionImage,
          resolvedBy: user.name,
          resolvedRole: user.role
        }
      };

      const res = await fetch(`/api/posts/${resolvingPostId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setResolvingPostId(null);
        setProofText('');
        setResolutionImage('');
        fetchAuthorityData();
        showToast('Complaint securely marked as Resolved and proof successfully uploaded!', 'success');
      }
    } catch (err) {
      showToast('Error finalizing resolution', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        deletion: { isDeleted: true, reason: deleteReason, deletedBy: user.name, deletedAt: new Date() }
      };
      const res = await fetch(`/api/posts/${deletingPostId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setDeletingPostId(null);
        fetchAuthorityData();
      }
    } catch (err) {} finally { setSubmitting(false); }
  };

  const handleAdminEscalate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        authorId: user.id, authorName: user.name, authorEmail: user.email, authorRole: user.role,
        description: `URGENT TAKEDOWN REQUEST (Post: ${escalatingAdminPostId}): ${escalateReason}`
      };
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEscalatingAdminPostId(null);
        setEscalateReason('');
        showToast("Urgent Takedown Request successfully routed to Admin Priority Queue.", 'success');
      }
    } catch (err) {} finally { setSubmitting(false); }
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
        fetchAuthorityData();
        setShowOperationLog(true); // Automatically move to log book
      }
    } catch (err) {} finally { setSubmitting(false); }
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
        fetchAuthorityData();
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
        showToast('Email dispatched successfully to the department.', 'success');
        setEmailModalTask(null);
        setEmailMessage('');
      } else {
        showToast('Failed to send email. Check server logs.', 'error');
      }
    } catch (err) {
      showToast('Network error while sending email.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (profilePass.length < 8 || !/[A-Z]/.test(profilePass) || !/[0-9]/.test(profilePass)) {
       showToast("SECURITY ALERT: Password must be 8+ chars, with Uppercase & Number.", 'error');
       return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${user.id || user._id}/password-authority`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: profilePass })
      });
      if (res.ok) {
         showToast("Password securely updated. Protocol Security block disabled.", 'success');
         setUser({...user, passwordChanged: true});
         localStorage.setItem('civik_user', JSON.stringify({...user, passwordChanged: true}));
         setProfilePass('');
      } else {
         showToast("Failed updating credential", 'error');
      }
    } catch (err) {} finally { setSubmitting(false); }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-bold text-2xl">Checking Clearances...</div>;

  // Filter logic based on Role (EXCLUDING DELETED POSTS IN UI)
  let visiblePosts = posts.filter(p => !p.deletion || !p.deletion.isDeleted);
  if (user.role === 'village_authority') {
    visiblePosts = visiblePosts.filter(p => p.level === 'Village' || !p.level);
  } else if (user.role === 'mandal_authority') {
    visiblePosts = posts.filter(p => p.level === 'Mandal' || p.level === 'Village' || !p.level); 
    // Mandal can see villages below them ideally, but mainly acts on their escalator level.
  } else {
    // District sees all
    visiblePosts = posts;
  }

  // Sort by priority and date (graceful fallback for older posts without these fields)
  visiblePosts.sort((a,b) => {
     if (sortOrder === 'Newest') {
         return (b.priorityLevel || 1) - (a.priorityLevel || 1) || new Date(b.escalationDate || b.createdAt || Date.now()) - new Date(a.escalationDate || a.createdAt || Date.now());
     } else {
         return new Date(a.escalationDate || a.createdAt || Date.now()) - new Date(b.escalationDate || b.createdAt || Date.now());
     }
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <nav className={`text-white px-8 py-5 flex justify-between items-center shadow-2xl sticky top-0 z-40 border-b border-white/10 ${user.role === 'district_authority' ? 'bg-gradient-to-r from-red-900 via-red-800 to-red-900' : user.role === 'mandal_authority' ? 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900' : 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900'}`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
              <FaBalanceScale className="text-yellow-400 text-lg" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter leading-none flex flex-col">
              <span className="text-white uppercase tracking-tighter">CivikTrack</span>
              <span className="text-emerald-400 font-light text-[10px] tracking-[0.3em] uppercase opacity-80">{user.role.split('_')[0]} Portal</span>
            </h1>
          </div>
          <div className="hidden md:block h-10 w-[1px] bg-white/20"></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-0.5">Jurisdiction Active</p>
            <p className="text-sm font-bold tracking-wide text-white/90">{user.jurisdiction || 'System Default'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
           {user.role === 'village_authority' && (
              <button 
                 onClick={() => setShowOperationLog(true)} 
                 className="group flex flex-col items-end"
                 title="View all internal tasks assigned across your jurisdiction"
              >
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 group-hover:text-white transition">Inter-Dept Logs</span>
                 <span className="text-sm font-bold border-b-2 border-emerald-500/50 group-hover:border-emerald-400 transition pb-0.5 flex items-center gap-2">
                   <span className="text-lg">📞</span> Operational Log Book
                 </span>
              </button>
           )}
           <button 
              onClick={() => setShowInbox(true)} 
              className="group flex flex-col items-end relative"
              title="Secure Direct Messages"
           >
              {unreadCount > 0 && <span className="absolute -top-1 -left-4 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">{unreadCount}</span>}
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 group-hover:text-white transition">Secure Comms</span>
              <span className="text-sm font-bold border-b-2 border-indigo-400/50 group-hover:border-indigo-300 transition pb-0.5 flex items-center gap-2">
                <FaEnvelope className="text-lg"/> Direct Messages
              </span>
           </button>
           <div className="hidden lg:flex flex-col items-end border-l border-white/20 pl-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-0.5">Authorized Agent</span>
              <button onClick={() => setShowProfile(true)} className="text-sm font-black hover:text-emerald-400 transition uppercase tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {user.name}
              </button>
           </div>
           <button onClick={() => { localStorage.removeItem('civik_user'); navigate('/login'); }} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-black py-2.5 px-6 rounded-xl transition text-xs uppercase tracking-widest shadow-inner">Logout Off Duty</button>
        </div>
      </nav>

      {showInbox && <InboxWindow currentUser={user} onClose={() => setShowInbox(false)} />}

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* DISTRICT ANALYTICS VIEW */}
        {user.role === 'district_authority' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <div className="text-sm font-bold text-gray-500 uppercase flex items-center justify-between">Total Incidents <FaChartBar/></div>
               <div className="text-3xl font-black mt-2 text-gray-800">{posts.length}</div>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <div className="text-sm font-bold text-gray-500 uppercase">Resolved</div>
               <div className="text-3xl font-black mt-2 text-green-600">{posts.filter(p => p.status === 'Resolved').length}</div>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <div className="text-sm font-bold text-gray-500 uppercase">Mandal Escalations</div>
               <div className="text-3xl font-black mt-2 text-indigo-600">{posts.filter(p => p.level === 'Mandal').length}</div>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-200 bg-red-50">
               <div className="text-sm font-bold text-red-600 uppercase flex items-center gap-1"><FaExclamationTriangle/> Critical Delays</div>
               <div className="text-3xl font-black mt-2 text-red-700">{posts.filter(p => p.level === 'District' && p.status !== 'Resolved').length}</div>
               <p className="text-xs text-red-600 mt-1">Pending &gt; 21 days total</p>
             </div>
          </div>
        )}

        {/* COMPLAINTS FEED */}
        {/* COMPLAINTS FEED */}
        <div className="flex justify-between items-end border-b-2 border-gray-200 pb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Actionable Incidents</h2>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Real-time Jurisdiction Pipeline</p>
          </div>
          <div className="flex gap-2 text-xs font-black uppercase">
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200">Active Duty</span>
            <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200">{visiblePosts.length} Reports</span>
          </div>
        </div>
        
        {visiblePosts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 font-bold text-xl">No complaints detected in your jurisdiction pipeline.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {visiblePosts.map(post => (
              <div key={post._id} className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden flex flex-col md:flex-row ${post.status === 'Resolved' ? 'border-green-200 opacity-80' : post.priorityLevel >= 3 ? 'border-red-400' : 'border-gray-200'}`}>
                {post.image && (
                  <div className="md:w-64 h-48 md:h-auto bg-gray-100 flex-shrink-0">
                    <img src={post.image} alt="Evidence" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="text-xl font-bold text-gray-900">{post.title}</h3>
                       <span className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-full text-xs border border-gray-200 flex items-center gap-1">
                          <FaMapMarkerAlt /> {post.location}
                       </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.desc}</p>
                    
                    <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider mb-4">
                       <span className={`px-2 py-1 rounded-md ${post.status === 'Resolved' ? 'bg-green-100 text-green-700' : post.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>Status: {post.status}</span>
                       <span className={`px-2 py-1 rounded-md bg-purple-100 text-purple-700`}>Curr Level: {post.level || 'Village'}</span>
                       <span className={`px-2 py-1 rounded-md ${post.priorityLevel >= 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>Priority: Lvl {post.priorityLevel || 1}</span>
                    </div>

                    {post.status === 'Resolved' && post.resolutionProof && (
                       <div className="bg-green-50 border border-green-200 p-3 rounded-xl mb-4 text-sm text-green-900">
                          <strong>Resolved by {post.resolutionProof.resolvedBy} ({post.resolutionProof.resolvedRole}):</strong> {post.resolutionProof.comment}
                       </div>
                    )}

                    {/* RENDER TASKS */}
                    {post.tasks && post.tasks.length > 0 && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-xs uppercase text-gray-500 mb-2">Inter-Departmental Tracker</h4>
                        <div className="space-y-2">
                          {post.tasks.map((t, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                               <div>
                                  <div className="font-bold text-gray-800 text-sm">{t.assignedDept} Routing</div>
                                  <div className="text-xs text-gray-500">{t.desc}</div>
                               </div>
                               <span className={`text-xs font-bold px-2 py-1 mt-2 sm:mt-0 rounded-full w-max ${t.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                  {t.status}
                               </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACTION CONTROLS */}
                  {post.status !== 'Resolved' && (
                    <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                      
                      {/* VILLAGE CONTROLS */}
                      {user.role === 'village_authority' && (!post.level || post.level === 'Village') && (
                        <>
                          <button onClick={() => setTaskingPostId(post._id)} className="bg-gray-800 text-white border border-gray-900 px-3 py-2 flex items-center gap-2 rounded-lg font-bold hover:bg-black transition shadow-sm text-xs">
                            Assign Department
                          </button>
                          <button onClick={() => handleUpdateStatus(post._id, 'In Progress')} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-2 flex items-center gap-2 rounded-lg font-bold hover:bg-blue-500 hover:text-white transition shadow-sm text-xs">
                            Mark "In Progress"
                          </button>
                          <button onClick={() => setResolvingPostId(post._id)} className="bg-green-600 text-white px-3 py-2 flex items-center gap-2 rounded-lg font-bold hover:bg-green-700 transition shadow-sm text-xs">
                            <FaCheck /> File Resolution
                          </button>
                          <button onClick={() => setDeletingPostId(post._id)} className="bg-red-50 text-red-600 border border-red-200 px-3 py-2 flex items-center gap-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition shadow-sm text-xs ml-auto">
                            Flag / Delete
                          </button>
                        </>
                      )}

                      {/* MANDAL CONTROLS */}
                      {user.role === 'mandal_authority' && post.level === 'Mandal' && (
                        <>
                          <button onClick={() => handleUpdateStatus(post._id, 'Pending', 'Village')} className="bg-orange-50 text-orange-600 border border-orange-200 px-4 py-2 flex items-center gap-2 rounded-lg font-bold hover:bg-orange-500 hover:text-white transition shadow-sm text-sm" title="Send back down to Village">
                            <FaUndo /> Return to Village (Reassign)
                          </button>
                          <button onClick={() => setResolvingPostId(post._id)} className="bg-green-600 text-white px-4 py-2 flex items-center gap-2 rounded-lg font-bold hover:bg-green-700 transition shadow-sm text-sm">
                            <FaCheck /> Override & Resolve Locally
                          </button>
                        </>
                      )}

                      {/* DISTRICT CONTROLS */}
                      {user.role === 'district_authority' && (
                        <button onClick={() => setResolvingPostId(post._id)} className="bg-red-600 text-white px-4 py-2 flex items-center gap-2 rounded-lg font-bold hover:bg-red-700 transition shadow-sm text-sm">
                          <FaCheck /> Executive Intervention (Force Resolve)
                        </button>
                      )}

                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* RESOLUTION MODAL */}
      {resolvingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold bg-green-100 text-green-800 px-3 py-1 rounded-lg">Filing Final Resolution</h3>
              <button disabled={submitting} onClick={() => setResolvingPostId(null)} className="text-gray-400 hover:text-gray-800"><FaTimes size={20}/></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">As an official authority, providing photographic proof or detailed textual reasoning is strictly required before a complaint is removed from the active queue.</p>
            <form onSubmit={handleResolveSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Resolution Proof (Action Taken)</label>
                <textarea required rows="4" value={proofText} onChange={(e) => setProofText(e.target.value)} placeholder="Describe the physical actions taken to resolve this problem..." className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"></textarea>
              </div>
              <div className="mb-6">
                 <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">Upload Supporting Photo <span className="text-gray-400 font-normal">(Required for Audit)</span></label>
                 <input type="file" id="proof-upload" hidden accept="image/*" onChange={handleFileChange} />
                 <div 
                    onClick={() => document.getElementById('proof-upload').click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer overflow-hidden relative min-h-[140px] flex flex-col items-center justify-center ${resolutionImage ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}
                 >
                    {resolutionImage ? (
                       <div className="flex flex-col items-center">
                          <img src={resolutionImage} alt="Preview" className="h-24 w-auto rounded-lg shadow-md mb-2 object-cover" />
                          <span className="text-xs font-bold text-green-700 uppercase">Image Captured Successfully</span>
                       </div>
                    ) : (
                       <>
                          <FaUpload className="mx-auto text-gray-400 mb-2" size={24} />
                          <span className="text-sm text-gray-500 font-semibold">Click to select image evidence</span>
                       </>
                    )}
                 </div>
              </div>
              <button disabled={submitting} type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition">
                {submitting ? 'Authenticating...' : 'Digitally Sign & Resolve'}
              </button>
             </form>
          </div>
        </div>
      )}

      {/* DELETION MODAL */}
      {deletingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600">Secure Takedown / Flag Post</h3>
              <button disabled={submitting} onClick={() => setDeletingPostId(null)} className="text-gray-400 hover:text-gray-800"><FaTimes size={20}/></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Deleting a post removes it from the public feed but moves it to the Citizen's <b>Deleted Transcripts</b> board, alongside your mandated reasoning.</p>
            <form onSubmit={handleDeleteSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Mandated Reason for Deletion</label>
                <select value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-sm text-gray-700">
                   <option value="Duplicate Complaint">Duplicate Complaint</option>
                   <option value="Resolved Outside System">Resolved Outside System</option>
                   <option value="Inappropriate Content">Inappropriate Content</option>
                   <option value="Out of Geographic Bounds">Out of Geographic Bounds</option>
                   <option value="Invalid Spam / Fake">Invalid Spam / Fake</option>
                </select>
              </div>
              <button disabled={submitting} type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition shadow-sm mb-4">
                {submitting ? 'Executing...' : 'Delete & Shift to Transcripts'}
              </button>
            </form>
            <div className="border-t border-gray-200 pt-4 mt-2">
               <p className="text-xs text-gray-500 font-bold uppercase mb-2">Extreme Cases Only:</p>
               <button onClick={() => { setDeletingPostId(null); setEscalatingAdminPostId(deletingPostId); }} className="w-full bg-gray-900 text-white text-xs font-bold py-2 rounded-md hover:bg-black transition">
                 Bypass & Escalate to Admin Support
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ESCALATION MODAL */}
      {escalatingAdminPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border-t-8 border-red-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-gray-900">Urgent Admin Take-down</h3>
              <button disabled={submitting} onClick={() => setEscalatingAdminPostId(null)} className="text-gray-400 hover:text-gray-800"><FaTimes size={20}/></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">If the selected post is too inappropriate or illegal to exist even in the "Deleted Transcripts" board, you must relay this to the Admin for hard deletion and ban enforcement.</p>
            <form onSubmit={handleAdminEscalate}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Internal Explanation to Admin</label>
                <textarea required rows="4" value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} placeholder="Describe why this user must be banned and data hard-deleted..." className="w-full bg-red-50 border border-red-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"></textarea>
              </div>
              <button disabled={submitting} type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-md">
                {submitting ? 'Transmitting...' : 'Dispatch URGENT Priority Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TASK ALLOCATION MODAL */}
      {taskingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border-t-8 border-indigo-600 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
               <div>
                 <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Assign Task Route</h3>
                 <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Official Directorate Routing Protocol</p>
               </div>
               <button disabled={submitting} onClick={() => setTaskingPostId(null)} className="text-gray-400 hover:text-red-500 transition"><FaTimes size={20}/></button>
            </div>
            <form onSubmit={handleAddTask} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                     <label className="block text-xs font-black text-gray-500 uppercase mb-1">Target Department</label>
                     <select value={taskDept} onChange={(e) => setTaskDept(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-gray-700">
                        <option value="Municipality">Municipality & Sanitation</option>
                        <option value="Roads & Buildings">Roads & Buildings</option>
                        <option value="Power Grid">Power Grid & Electricity</option>
                        <option value="Water Works">Water Works / Civil</option>
                        <option value="Police">Law Enforcement / Police</option>
                     </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-1">Contact Person / Name</label>
                    <input type="text" value={taskContactDetails} onChange={(e) => setTaskContactDetails(e.target.value)} placeholder="Engineer / Supervisor name" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                   <div>
                      <label className="block text-xs font-black text-gray-500 uppercase mb-1">Mobile Number</label>
                      <input type="tel" value={taskContactNumber} onChange={(e) => setTaskContactNumber(e.target.value)} placeholder="+91 XXXX XXXX XX" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-gray-500 uppercase mb-1">Official Email</label>
                      <input type="email" value={taskEmail} onChange={(e) => setTaskEmail(e.target.value)} placeholder="dept@gov.in" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                   </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Internal Routing Instructions</label>
                  <textarea required rows="2" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Provide context for the routed department..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"></textarea>
                </div>

                <button disabled={submitting} type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 transition shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                  {submitting ? 'Allocating Resources...' : 'Log Operational Task Line'}
                </button>
            </form>
          </div>
        </div>
      )}

      {/* OPERATIONAL LOG BOOK MODAL */}
      {showOperationLog && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50/95 backdrop-blur-xl animate-in fade-in duration-300">
           <header className="bg-gray-900 text-white px-8 py-6 flex justify-between items-center shadow-2xl">
              <div>
                 <h2 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
                    <span className="text-emerald-400">📞</span> Operational Log Book
                 </h2>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-1">Inter-Departmental Tracker & Resource Registry</p>
              </div>
              <button 
                onClick={() => setShowOperationLog(false)}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition border border-white/10"
              >
                <FaTimes size={24}/>
              </button>
           </header>

           <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
              {/* ANALYTICS BAR */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl font-black">
                       {posts.reduce((acc, p) => acc + (p.tasks?.length || 0), 0)}
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Issued</p>
                       <p className="text-xl font-black text-gray-800">Department Tasks</p>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 text-2xl font-black">
                       {posts.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status === 'Pending').length || 0), 0)}
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Awaiting</p>
                       <p className="text-xl font-black text-gray-800">Pending Actions</p>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-2xl font-black">
                       {posts.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status === 'Reported').length || 0), 0)}
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Engaged</p>
                       <p className="text-xl font-black text-gray-800">Reported/Active</p>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 text-2xl font-black">
                       {posts.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status === 'Solved').length || 0), 0)}
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Closed</p>
                       <p className="text-xl font-black text-gray-800">Protocol Solved</p>
                    </div>
                 </div>
              </div>

              {/* LOGS TABLE */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                 <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Active Operational Transcript</h3>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorized View Only</span>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                             <th className="px-8 py-4">Task / Origin</th>
                             <th className="px-8 py-4">Department</th>
                             <th className="px-8 py-4">Contact Protocol</th>
                             <th className="px-8 py-4 text-center">Current Status</th>
                             <th className="px-8 py-4 text-right">Directorate Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {posts.flatMap(post => (post.tasks || []).map((task, tIdx) => ({post, task, tIdx})))
                             .sort((a,b) => (a.task.status === 'Solved' ? 1 : 0) - (b.task.status === 'Solved' ? 1 : 0))
                             .map(({post, task, tIdx}) => (
                             <tr key={`${post._id}-${tIdx}`} className="hover:bg-gray-50/50 transition group">
                                <td className="px-8 py-6">
                                   <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition truncate max-w-[200px]" title={post.title}>{post.title}</p>
                                   <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">"{task.desc}"</p>
                                </td>
                                <td className="px-8 py-6">
                                   <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-md border border-indigo-100 uppercase tracking-widest">
                                      {task.assignedDept}
                                   </span>
                                </td>
                                <td className="px-8 py-6">
                                   <div className="space-y-1">
                                      <p className="text-sm font-bold text-gray-800">{task.contactDetails || 'N/A'}</p>
                                      <div className="flex gap-4">
                                         {task.contactNumber && (
                                            <a href={`tel:${task.contactNumber}`} className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
                                               📞 {task.contactNumber}
                                            </a>
                                         )}
                                         {task.email && (
                                            <button 
                                              onClick={() => { setEmailModalTask({ post, task }); setEmailMessage(`Respected Team,\n\nWe need an urgent update regarding the ${post.title} issue assigned to your ${task.assignedDept} department.\n\nRegards,\n${user.name}\n${user.role}`); }}
                                              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                               📧 Send Mail
                                            </button>
                                         )}
                                      </div>
                                   </div>
                                </td>
                                <td className="px-8 py-6">
                                   <div className="flex justify-center">
                                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border-2 shadow-sm ${
                                         task.status === 'Solved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                         task.status === 'Reported' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                         'bg-orange-100 text-orange-700 border-orange-200'
                                      }`}>
                                         {task.status}
                                      </span>
                                   </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                   <div className="flex justify-end gap-2">
                                      <button 
                                        onClick={() => handleUpdateTaskStatus(post._id, tIdx, 'Reported')}
                                        className={`p-2 rounded-xl border transition ${task.status === 'Reported' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'}`}
                                        title="Mark as Reported"
                                      >
                                        <FaExclamationTriangle size={14}/>
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateTaskStatus(post._id, tIdx, 'Solved')}
                                        className={`p-2 rounded-xl border transition ${task.status === 'Solved' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'}`}
                                        title="Mark as Solved"
                                      >
                                        <FaCheck size={14}/>
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateTaskStatus(post._id, tIdx, 'Pending')}
                                        className={`p-2 rounded-xl border transition ${task.status === 'Pending' ? 'bg-orange-600 text-white border-orange-600 shadow-lg' : 'bg-white text-orange-400 border-orange-100 hover:bg-orange-50'}`}
                                        title="Re-mark as Pending"
                                      >
                                        <FaUndo size={14}/>
                                      </button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                          {posts.every(p => !p.tasks || p.tasks.length === 0) && (
                            <tr>
                               <td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest">
                                  No operational tasks recorded in this jurisdiction cycle.
                               </td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </main>
           <footer className="bg-white border-t border-gray-200 p-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
              CivikTrack Internal Governance Terminal | Session Active
           </footer>
        </div>
      )}

      {/* EMAIL COMPOSER MODAL */}
      {emailModalTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border border-gray-100 overflow-hidden scale-in-center">
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
               <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Email Notification</h3>
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Recipient: {emailModalTask.task.email}</p>
               </div>
               <button onClick={() => setEmailModalTask(null)} className="text-white/60 hover:text-white transition"><FaTimes size={20}/></button>
            </div>
            <form onSubmit={handleSendEmail} className="p-6">
               <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6">
                  <p className="text-xs text-blue-900">
                    <strong>Context:</strong> You are notifying the <strong>{emailModalTask.task.assignedDept}</strong> department regarding the issue: <em>"{emailModalTask.post.title}"</em>. This message will be sent officially from your directorate.
                  </p>
               </div>
               <div className="mb-6">
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2 tracking-widest">Official Message</label>
                  <textarea 
                    required 
                    rows="6" 
                    value={emailMessage} 
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-4 focus:ring-blue-100 text-sm font-medium leading-relaxed"
                  ></textarea>
               </div>
               <button 
                 type="submit" 
                 disabled={submitting}
                 className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
               >
                 {submitting ? 'Transmitting Official Mail...' : 'Dispatch Notification'}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION SYSTEM */}
      <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 transform ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 min-w-[320px] backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 'bg-red-600/90 border-red-500 text-white'}`}>
           <div className="bg-white/20 p-2 rounded-lg">
             {toast.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">{toast.type === 'success' ? 'Protocol Success' : 'System Error'}</p>
             <p className="font-bold text-sm tracking-tight">{toast.message}</p>
           </div>
           <button onClick={() => setToast({ ...toast, visible: false })} className="ml-auto opacity-60 hover:opacity-100"><FaTimes /></button>
        </div>
      </div>

    </div>
  );
}
