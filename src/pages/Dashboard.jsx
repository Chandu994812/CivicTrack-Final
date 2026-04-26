import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaThumbsUp, FaRegComment, FaMapMarkerAlt, 
  FaImage, FaSignOutAlt, FaEdit, FaCheckCircle, 
  FaExclamationCircle, FaSpinner, FaMicrophone, FaTimes,
  FaGlobe, FaQuestionCircle, FaFileContract, FaPlus, FaTrash, FaClipboardList,
  FaBalanceScale, FaShieldAlt
} from 'react-icons/fa';

// --- DUMMY DATA ---
const initialPosts = [
  {
    id: 1,
    title: 'Major Pipeline Burst',
    desc: 'Main water pipeline burst near the city hospital. Flooding the streets and causing severe water shortage in the neighborhood.',
    image: 'https://images.unsplash.com/photo-1542361345-89e58247f2d5?auto=format&fit=crop&q=80',
    category: 'Water',
    location: 'City Hospital Road',
    status: 'In Progress',
    votes: 145,
    author: { name: 'Rahul Sharma', avatar: 'https://i.pravatar.cc/150?u=rahul' },
    comments: 24,
    time: '2 hours ago'
  },
  {
    id: 2,
    title: 'Severe Road Damage',
    desc: 'Big pothole near bus stand causing daily accidents. Needs immediate fixing.',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80',
    category: 'Road',
    status: 'Pending',
    votes: 45,
    author: { name: 'Sneha Patel', avatar: 'https://i.pravatar.cc/150?u=sneha' },
    comments: 8,
    time: '5 hours ago'
  },
  {
    id: 3,
    title: 'Broken Street Light',
    desc: 'Street lights have not been working for the past two weeks, making it unsafe for pedestrians at night.',
    image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&q=80',
    category: 'Electricity',
    location: 'Park Avenue',
    status: 'Resolved',
    votes: 112,
    author: { name: 'Kiran Kumar', avatar: 'https://i.pravatar.cc/150?u=kiran' },
    comments: 15,
    time: '1 day ago'
  },
  {
    id: 4,
    title: 'Illegal Garbage Dumping',
    desc: 'Garbage not cleaned for 3 days and people are dumping more waste illegally on the empty plot.',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80',
    category: 'Garbage',
    location: 'Sector 4 Market',
    status: 'Pending',
    votes: 85,
    author: { name: 'Anjali Desai', avatar: 'https://i.pravatar.cc/150?u=anjali' },
    comments: 12,
    time: '3 hours ago'
  }
];

export function timeAgo(dateParam) {
  if (!dateParam) return 'Just now';
  const date = typeof dateParam === 'string' || typeof dateParam === 'number' ? new Date(dateParam) : dateParam;
  if (isNaN(date.getTime())) return typeof dateParam === 'string' ? dateParam : 'Just now';
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState({ name: 'Citizen', avatar: 'https://i.pravatar.cc/150' });
  const [activeTab, setActiveTab] = useState('All');
  
  // UI States
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isComplaintModalOpen, setComplaintModalOpen] = useState(false);
  const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [isHelpModalOpen, setHelpModalOpen] = useState(false);
  const [isTermsModalOpen, setTermsModalOpen] = useState(false);
  const [isMyPostsModalOpen, setMyPostsModalOpen] = useState(false);

  const [postImage, setPostImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  // Custom Toast System
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };
  
  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const postsRes = await fetch('/api/posts');
      const postsData = await postsRes.json();
      setPosts(Array.isArray(postsData) ? postsData : []);

      const storedUserStr = localStorage.getItem('civik_user');
      let userId = 'me';
      if (storedUserStr) {
          try {
             const storedUser = JSON.parse(storedUserStr);
             userId = storedUser.id || storedUser._id || 'me';
          } catch(e) {}
      }

      const userRes = await fetch(`/api/users/${userId}`);
      const userData = await userRes.json();
      if (userData && !userData.message) {
         setProfile(userData);
      }
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };
  
  // Voice Input Mock States
  const [recording, setRecording] = useState(false);
  const [complaintText, setComplaintText] = useState('');

  // Refs for closing dropdowns when clicking outside
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [currentLocation, setCurrentLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
       showToast("Geolocation is not supported by your browser");
       return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
       try {
         const { latitude, longitude } = position.coords;
         const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
         const data = await res.json();
         if (data && data.address) {
             const street = data.address.road || data.address.suburb || "Local Area";
             const city = data.address.city || data.address.town || "City";
             setCurrentLocation(`${street}, ${city}`);
         } else {
             setCurrentLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
         }
       } catch (err) {
         console.error("Geocoding failed", err);
         setCurrentLocation(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
       } finally {
         setIsLocating(false);
       }
    }, (error) => {
       showToast("Unable to retrieve location. Please check browser permissions.");
       setIsLocating(false);
    });
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this complaint?")) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(currentPosts => currentPosts.filter(post => (post._id || post.id) !== id));
        showToast("Post deleted successfully.", 'success');
      } else {
        showToast("Failed to delete post.");
      }
    } catch(err) {
       console.error("Error deleting post", err);
    }
  };

  // Handle Voting
  const handleVote = async (id) => {
    try {
      const res = await fetch(`/api/posts/${id}/vote`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile?._id || profile?.id || 'Anonymous' })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(currentPosts => 
          currentPosts.map(post => 
            (post._id || post.id) === id ? updatedPost : post
          )
        );
      } else {
        const err = await res.json();
        showToast(err.message, 'error');
      }
    } catch (err) {
      console.error("Error voting", err);
    }
  };

  const handleComment = async (id, text) => {
    if (!text.trim()) return;
    try {
      const res = await fetch(`/api/posts/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          userName: profile?.name || 'Citizen',
          userAvatar: profile?.avatar || 'https://i.pravatar.cc/150'
        })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(currentPosts => 
          currentPosts.map(post => 
            (post._id || post.id) === id ? updatedPost : post
          )
        );
      }
    } catch (err) {
      console.error("Error commenting", err);
    }
  };

  const handleMarkNotificationsRead = async () => {
    const nextState = !isNotificationOpen;
    setIsNotificationOpen(nextState);
    
    // If opening for the first time and there are unread notifications
    if (nextState && profile?.notifications?.some(n => !n.read)) {
       try {
         // Optimistically update UI
         const updatedNotifications = profile.notifications.map(n => ({ ...n, read: true }));
         setProfile(prev => ({ ...prev, notifications: updatedNotifications }));

         // Backend update
         await fetch(`/api/users/${profile?._id || profile?.id || 'me'}/notifications/read`, { method: 'PUT' });
       } catch (err) {
         console.error("Failed to mark notifications as read", err);
       }
    }
  };


  // Mock Microphone Recording
  const handleMicClick = () => {
    if (recording) return;
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setComplaintText('There is a huge pothole causing severe traffic and daily accidents near the main crossroad. Please fix it urgently as someone might get seriously hurt.');
    }, 3000);
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    let colors = '';
    let icon = null;
    if (status === 'Pending') {
      colors = 'bg-red-100 text-red-700 border-red-200';
      icon = <FaExclamationCircle className="hidden sm:inline mr-1" />;
    } else if (status === 'In Progress') {
      colors = 'bg-yellow-100 text-yellow-700 border-yellow-200';
      icon = <FaSpinner className="hidden sm:inline mr-1 animate-spin" />;
    } else {
      colors = 'bg-green-100 text-green-700 border-green-200';
      icon = <FaCheckCircle className="hidden sm:inline mr-1" />;
    }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${colors}`}>
        {icon} {status}
      </span>
    );
  };

  // Derived logic for Tabs
  let displayedPosts = (Array.isArray(posts) ? [...posts] : []).sort((a, b) => (b.votes || 0) - (a.votes || 0));

  if (activeTab === 'Deleted Transcripts') {
     // EXACTLY SHOW ONLY DELETED
     displayedPosts = displayedPosts.filter(p => p.deletion && p.deletion.isDeleted);
  } else {
     // HIDE ALL DELETED FROM STANDARD TABS
     displayedPosts = displayedPosts.filter(p => !p.deletion || !p.deletion.isDeleted);
     
     if (activeTab === 'Top') displayedPosts = displayedPosts.filter(p => p.votes >= 100);
     else if (activeTab === 'Pending') displayedPosts = displayedPosts.filter(p => p.status === 'Pending');
     else if (activeTab === 'Resolved') displayedPosts = displayedPosts.filter(p => p.status === 'Resolved');
     else if (activeTab === 'In Progress') displayedPosts = displayedPosts.filter(p => p.status === 'In Progress');
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] bg-[radial-gradient(at_top_left,_#f0f7ff_0%,_transparent_50%),radial-gradient(at_bottom_right,_#eef2ff_0%,_transparent_50%)] text-gray-800 font-sans relative">
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      {localStorage.getItem('civik_admin_impersonating') === 'true' && (
        <div 
          className="w-full bg-slate-900 text-white text-center py-2 font-semibold shadow-lg cursor-pointer hover:bg-black transition-all z-50 text-xs tracking-wider uppercase"
          onClick={() => {
              localStorage.removeItem('civik_admin_impersonating');
              localStorage.setItem('civik_user', JSON.stringify({ id: 'admin', name: 'System Admin', email: 'admin@civiktrack.com', role: 'admin' }));
              window.location.href = '/admin';
          }}
        >
          <span className="opacity-70 mr-2">Admin Mode Active</span>
          <span className="underline decoration-blue-500 underline-offset-4">Return to Admin Dashboard</span>
        </div>
      )}

      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 z-[100] bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-[72px] gap-8">
            
            {/* Left: Logo */}
            <div className="flex-shrink-0">
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
                  <FaBalanceScale className="text-yellow-400 text-lg" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
                  CivikTrack
                </h1>
              </Link>
            </div>

            {/* Middle: Official Navigation Tabs (Scrollable on mobile) */}
            <div className="flex-1 flex justify-center overflow-hidden order-last md:order-none w-full md:w-auto mt-4 md:mt-0">
              <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100 overflow-x-auto custom-scrollbar-hide max-w-full">
                {['All', 'Top', 'Pending', 'In Progress', 'Resolved', 'Deleted Transcripts'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-5 text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 rounded-xl relative group whitespace-nowrap ${
                      activeTab === tab 
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
                      : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'Top' ? 'Top' : tab === 'Deleted Transcripts' ? 'Deleted' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Actions Area */}
            <div className="flex items-center gap-4 lg:gap-6">
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={handleMarkNotificationsRead}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-2 mt-1 relative"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {profile?.notifications && profile.notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </button>
                {/* Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                      <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">System Updates</h4>
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">New</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {(!profile?.notifications || profile.notifications.length === 0) ? (
                          <div className="p-8 text-center">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No New Alerts</p>
                          </div>
                        ) : (
                          profile.notifications.map((notif, idx) => (
                            <div key={idx} className={`p-5 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                                <p className="text-xs font-bold text-slate-800 leading-relaxed">{notif.message}</p>
                                <p className="text-[9px] text-slate-400 mt-2 uppercase font-black tracking-widest">{timeAgo(notif.date)}</p>
                            </div>
                          ))
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Raise Complaint Button */}
              <button 
                onClick={() => setComplaintModalOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black px-5 py-2.5 rounded-xl shadow-lg shadow-blue-100 transition-all duration-300 active:scale-95 text-[10px] uppercase tracking-widest group font-inter"
              >
                <FaPlus className="group-hover:rotate-90 transition-transform duration-300" /> Raise Complaint
              </button>

              {/* Profile */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="focus:outline-none flex items-center gap-3 group"
                >
                  <div className="hidden lg:block text-right leading-tight">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{profile?.name || 'Citizen'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Portal ID: {profile?._id?.slice(-5) || '7829'}</p>
                  </div>
                  <img 
                    src={profile?.avatar || 'https://i.pravatar.cc/150?u=chandu'} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-50 group-hover:border-blue-200 transition-all shadow-sm"
                  />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[101] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-5 bg-slate-50 border-b border-slate-200">
                      <p className="font-black text-slate-900 text-sm uppercase tracking-tight leading-none mb-1">{profile?.name || 'Citizen'}</p>
                      <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Verified Citizen Official</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button 
                        onClick={() => { setProfileDropdownOpen(false); setEditProfileModalOpen(true); }} 
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition font-black text-[10px] uppercase tracking-widest"
                      >
                        <FaEdit className="text-slate-400" /> Account Settings
                      </button>
                      <button 
                        onClick={() => { setProfileDropdownOpen(false); setMyPostsModalOpen(true); }} 
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition font-black text-[10px] uppercase tracking-widest"
                      >
                        <FaClipboardList className="text-slate-400" /> Activity Log
                      </button>
                      <button 
                        onClick={() => { setProfileDropdownOpen(false); setHelpModalOpen(true); }} 
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition font-black text-[10px] uppercase tracking-widest"
                      >
                        <FaQuestionCircle className="text-slate-400" /> Support Desk
                      </button>
                      <button 
                        onClick={() => { setProfileDropdownOpen(false); setTermsModalOpen(true); }} 
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition font-black text-[10px] uppercase tracking-widest"
                      >
                        <FaFileContract className="text-slate-400" /> Legal & Terms
                      </button>
                      <div className="h-px bg-slate-100 my-2 mx-2" />
                      <button 
                        onClick={() => { localStorage.removeItem('civik_token'); localStorage.removeItem('civik_user'); window.location.href = '/'; }}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition font-black text-[10px] uppercase tracking-widest"
                      >
                        <FaSignOutAlt className="text-red-500" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>


      {/* --- FLOATING MOBILE CTA --- */}
      <button 
        onClick={() => setComplaintModalOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 z-40 bg-blue-600 text-white w-14 h-14 flex justify-center items-center rounded-2xl shadow-2xl hover:scale-110 active:scale-90 transition-all shadow-blue-200"
      >
        <FaPlus size={24} />
      </button>

      {/* --- DASHBOARD FEED --- */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-16 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-4 font-inter">
              {activeTab === 'All' ? 'Community Feed' : activeTab}
            </h2>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] font-inter">Real-time reports from across your jurisdiction</p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm px-8 py-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6 self-start md:self-auto">
             <div className="flex -space-x-3">
                {[1,2,3,4].map(i => <img key={i} src={`https://i.pravatar.cc/150?u=${i}`} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" />)}
             </div>
             <div className="h-10 w-px bg-slate-200" />
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Records</p>
                <p className="text-2xl font-black text-slate-900 leading-none">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{displayedPosts.length}</span>
                </p>
             </div>
          </div>
        </div>

        {displayedPosts.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
             <div className="text-5xl mb-4">📭</div>
             <h3 className="text-xl font-bold text-gray-600 mb-2">No complaints found</h3>
             <p className="text-gray-500">There are no posts in this category right now.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedPosts.map(post => (
              <PostCard 
                key={post._id || post.id} 
                post={post} 
                onVote={handleVote}
                onDelete={handleDeletePost} 
                onComment={handleComment}
                profile={profile}
                StatusBadge={StatusBadge} 
                isTop={post.votes >= 100} 
              />
            ))}
          </div>
        )}
      </main>

      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-gray-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 overflow-hidden flex flex-col">
            
            <div className="relative p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
              <h2 className="text-2xl font-bold">Raise Official Complaint</h2>
              <button 
                onClick={() => { setComplaintModalOpen(false); setPostImage(null); setComplaintText(''); setCurrentLocation(''); }} 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-8 overflow-y-visible flex-1">
              <form className="space-y-5" onSubmit={async (e) => { 
                e.preventDefault(); 
                setIsSubmittingPost(true);
                  const newPost = {
                    title: e.target.title.value,
                    category: e.target.category.value,
                    desc: complaintText,
                    location: currentLocation || 'Local Area',
                    image: postImage,
                    author: { 
                      id: profile?.id || profile?._id,
                      name: profile?.name || 'Anonymous', 
                      email: profile?.email || 'N/A',
                      avatar: profile?.avatar || 'https://i.pravatar.cc/150' 
                    }
                  };
                if (!newPost.title || !newPost.category || !newPost.desc) {
                   showToast("Please fill all required fields");
                   setIsSubmittingPost(false);
                   return;
                }
                try {
                  const res = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newPost)
                  });
                  if (res.ok) {
                    const savedPost = await res.json();
                    setPosts(prev => [savedPost, ...(Array.isArray(prev) ? prev : [])]);
                    setComplaintModalOpen(false);
                    setComplaintText('');
                    setPostImage(null);
                    setCurrentLocation('');
                    e.target.reset();
                    showToast("Complaint submitted successfully!", 'success');
                  } else {
                    const err = await res.json();
                    showToast("Error creating post: " + (err.message || 'Unknown error'));
                  }
                } catch(err) { console.error('Error posting', err); showToast("Failed to contact server"); }
                finally { setIsSubmittingPost(false); }
              }}>
                
                {/* Language Select */}
                <div className="flex items-center gap-3 bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-100 text-indigo-800">
                  <FaGlobe className="text-xl" />
                  <label htmlFor="lang" className="font-semibold text-sm">Select Preferred Language:</label>
                  <select id="lang" className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 sm:flex-none">
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Issue Title</label>
                    <input name="title" type="text" placeholder="E.g., Deep Pothole" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                    <select name="category" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-gray-600">
                      <option value="">Select Category...</option>
                      <option value="Road">Roads & Traffic</option>
                      <option value="Garbage">Garbage & Sanitation</option>
                      <option value="Water">Water Supply</option>
                      <option value="Electricity">Electricity</option>
                    </select>
                  </div>
                </div>
                
                {/* Voice enabled description */}
                <div>
                   <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-1">
                     <span>Detailed Description</span>
                     <button 
                       type="button" 
                       onClick={handleMicClick}
                       className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all ${recording ? 'bg-red-100 text-red-600 border border-red-200 animate-pulse' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200'}`}
                     >
                       <FaMicrophone /> {recording ? 'Listening...' : 'Use Voice Input'}
                     </button>
                   </label>
                   <textarea 
                     rows="4"
                     value={complaintText}
                     onChange={(e) => setComplaintText(e.target.value)}
                     placeholder="Tap the mic to speak or type the issue here..."
                     className={`w-full bg-gray-50 border rounded-xl px-4 py-3 focus:outline-none transition resize-none ${recording ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-purple-500'}`}
                   ></textarea>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <input type="file" accept="image/*" className="hidden" id="post-image-upload" onChange={(e) => handleImageUpload(e, setPostImage)} />
                  <label htmlFor="post-image-upload" className={`cursor-pointer flex-1 flex items-center justify-center gap-2 ${postImage ? 'text-green-700 bg-green-50 border-green-200' : 'text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100'} border px-4 py-3.5 rounded-xl font-bold transition`}>
                    <FaImage /> {postImage ? 'Photo Attached' : 'Add Photo'}
                  </label>
                  <button type="button" onClick={handleGetLocation} className={`flex-1 flex items-center justify-center gap-2 border px-4 py-3.5 rounded-xl font-bold transition ${currentLocation ? 'text-green-700 bg-green-50 border-green-200' : 'text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100'}`}>
                    {isLocating ? <><FaSpinner className="animate-spin" /> Locating...</> : <><FaMapMarkerAlt /> {currentLocation || 'Get GPS Location'}</>}
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmittingPost}
                  className={`w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-xl transition-all mt-4 ${isSubmittingPost ? 'opacity-70 cursor-not-allowed pointer-events-none' : 'hover:shadow-2xl hover:-translate-y-1'}`}
                >
                  {isSubmittingPost ? (
                    <><FaSpinner className="animate-spin" /> Please wait, post is sending...</>
                  ) : (
                    'Submit Official Complaint'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT PROFILE MODAL --- */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-gray-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg my-4 sm:my-8 overflow-hidden flex flex-col">
            
            <div className="relative p-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Update Civic Profile</h2>
              <button 
                onClick={() => { setEditProfileModalOpen(false); setProfileImage(null); }} 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-8 overflow-y-visible flex-1 bg-gray-50">
              {(() => {
                const fields = ['name', 'phone', 'email', 'govId', 'avatar'];
                const addressFields = ['houseNo', 'street', 'colony', 'landmark', 'city', 'district', 'state', 'pincode'];
                let filled = 0;
                fields.forEach(f => {
                   if (profile && profile[f] && typeof profile[f] === 'string' && profile[f].trim() !== '' && profile[f] !== 'N/A' && profile[f] !== 'https://i.pravatar.cc/150') {
                      filled++;
                   }
                });
                addressFields.forEach(f => {
                   if (profile?.address && profile.address[f] && typeof profile.address[f] === 'string' && profile.address[f].trim() !== '') {
                      filled++;
                   }
                });
                const totalFields = fields.length + addressFields.length;
                const completionPercentage = Math.round((filled / totalFields) * 100) || 0;

                return (
                  <div className="mb-6 flex flex-col items-center relative">
                    <div className="w-28 h-28 rounded-full flex items-center justify-center bg-gray-200 transition-all duration-500" style={{ background: `conic-gradient(#4f46e5 ${completionPercentage}%, #e5e7eb ${completionPercentage}%)` }}>
                      <img src={profileImage || profile?.avatar || 'https://i.pravatar.cc/150'} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" />
                    </div>
                    <div className="absolute top-0 right-1/3 transform translate-x-4 -translate-y-2 bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow border-2 border-white z-10 transition-all">
                       {completionPercentage}%
                    </div>
                    <input type="file" accept="image/*" className="hidden" id="profile-image-upload" onChange={(e) => handleImageUpload(e, setProfileImage)} />
                    <label htmlFor="profile-image-upload" className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition mt-3 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">Change Picture</label>
                  </div>
                );
              })()}

              <form className="space-y-4" onSubmit={async (e) => { 
                e.preventDefault(); 
                setIsSubmittingProfile(true);
                const updateData = {
                  name: e.target.fullName.value,
                  phone: e.target.phone.value,
                  email: e.target.email.value,
                  govId: e.target.govId.value,
                  address: {
                    houseNo: e.target.houseNo.value,
                    street: e.target.street.value,
                    colony: e.target.colony.value,
                    landmark: e.target.landmark.value,
                    city: e.target.city.value,
                    district: e.target.district.value,
                    state: e.target.state.value,
                    pincode: e.target.pincode.value
                  },
                  ...(profileImage && { avatar: profileImage })
                };
                try {
                  const res = await fetch(`/api/users/${profile?._id || profile?.id || 'me'}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                  });
                  if (res.ok) {
                    const savedUser = await res.json();
                    setProfile(savedUser);
                    localStorage.setItem('civik_user', JSON.stringify({id: savedUser._id, name: savedUser.name, email: savedUser.email}));
                    setEditProfileModalOpen(false);
                    setProfileImage(null);
                    showToast("Profile updated safely!", 'success');
                  } else {
                    const errRes = await res.json();
                    showToast(errRes.message || "Error updating profile");
                  }
                } catch(err) { 
                  console.error('Error Profile', err);
                  showToast("Network Error: " + err.message);
                }
                finally { setIsSubmittingProfile(false); }
              }}>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name (As per ID)</label>
                  <input name="fullName" type="text" defaultValue={profile?.name || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-800 transition" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                    <input name="phone" type="tel" defaultValue={profile?.phone || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-800 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                    <input name="email" type="email" defaultValue={profile?.email || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-800 transition" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Goverment ID (Aadhaar / Voter ID)</label>
                  <input name="govId" type="text" defaultValue={profile?.govId || ''} placeholder="XXXX-XXXX-XXXX" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-800 transition text-gray-600 font-mono tracking-widest" />
                  <p className="text-xs text-gray-500 mt-1">Your ID is encrypted securely and used only to verify official complaints.</p>
                </div>

                <div className="pt-4 border-t border-gray-200 mt-4">
                  <h3 className="font-bold text-gray-800 mb-4 text-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                     <span>Permanent Address Details</span>
                     <button type="button" onClick={() => {
                        if (!navigator.geolocation) return showToast("Geolocation is not supported");
                        navigator.geolocation.getCurrentPosition(async (position) => {
                          try {
                            const { latitude, longitude } = position.coords;
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                            const data = await res.json();
                            const addr = data?.address || {};
                            if (document.getElementById('input-city')) document.getElementById('input-city').value = addr.city || addr.town || addr.village || addr.county || '';
                            if (document.getElementById('input-state')) document.getElementById('input-state').value = addr.state || '';
                            if (document.getElementById('input-pincode')) document.getElementById('input-pincode').value = addr.postcode || '';
                            if (document.getElementById('input-district')) document.getElementById('input-district').value = addr.state_district || addr.county || '';
                            if (document.getElementById('input-colony')) document.getElementById('input-colony').value = addr.suburb || addr.neighbourhood || '';
                            if (document.getElementById('input-street')) document.getElementById('input-street').value = addr.road || '';
                            showToast("Address fetched from GPS!", "success");
                          } catch (err) { showToast("Failed to fetch address from GPS."); }
                        });
                     }} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition flex items-center gap-1 font-bold">
                       <FaMapMarkerAlt /> Auto-Fill (GPS)
                     </button>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Door/House No. & Building</label>
                      <input name="houseNo" type="text" defaultValue={profile?.address?.houseNo || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-800 transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Street/Road/Lane</label>
                      <input name="street" id="input-street" type="text" defaultValue={profile?.address?.street || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-800 transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Locality/Colony/Area</label>
                      <input name="colony" id="input-colony" type="text" defaultValue={profile?.address?.colony || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-800 transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Landmark</label>
                      <input name="landmark" type="text" defaultValue={profile?.address?.landmark || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-800 transition text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold text-gray-600 mb-1">City/Village/Mandal</label>
                      <input name="city" id="input-city" type="text" defaultValue={profile?.address?.city || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-800 transition text-sm" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold text-gray-600 mb-1">District</label>
                      <input name="district" id="input-district" type="text" defaultValue={profile?.address?.district || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-800 transition text-sm" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold text-gray-600 mb-1">State</label>
                      <input name="state" id="input-state" type="text" defaultValue={profile?.address?.state || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-800 transition text-sm" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold text-gray-600 mb-1">Pincode</label>
                      <input name="pincode" id="input-pincode" type="text" maxLength="6" defaultValue={profile?.address?.pincode || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-800 transition text-sm font-mono tracking-widest" />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmittingProfile}
                  className={`w-full flex items-center justify-center gap-3 bg-gray-900 text-white font-bold text-lg px-8 py-3.5 rounded-xl shadow-lg transition-all mt-6 ${isSubmittingProfile ? 'opacity-70 cursor-not-allowed pointer-events-none' : 'hover:bg-black'}`}
                >
                  {isSubmittingProfile ? (
                    <><FaSpinner className="animate-spin" /> Saving Changes...</>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- HELP & SUPPORT MODAL --- */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaQuestionCircle /> Help & Support
              </h2>
              <button 
                onClick={() => setHelpModalOpen(false)} 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <FaTimes size={18} />
              </button>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50 text-gray-700 space-y-4">
              <h3 className="font-bold text-lg text-gray-900">Frequently Asked Questions</h3>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <p className="font-semibold text-indigo-700 mb-1">How do I raise a new complaint?</p>
                <p className="text-sm leading-relaxed">Click the "Raise Complaint" button at the top right of your dashboard. Fill in the details such as title, category, location, and description. You can also upload a photo to provide evidence.</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <p className="font-semibold text-indigo-700 mb-1">How does the voting system work?</p>
                <p className="text-sm leading-relaxed">You can "Escalate" or vote on complaints raised by other citizens. Complaints with higher votes are prioritized and moved to the "Top Posts" tab to attract official attention faster.</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <p className="font-semibold text-indigo-700 mb-1">Why is my government ID required?</p>
                <p className="text-sm leading-relaxed">Your ID is used to verify that you are a genuine resident of the provided ward. We encrypt this data and it is strictly used to validate official complaints to prevent spam.</p>
              </div>
              <div className="mt-6 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 text-center">
                <p className="font-bold text-gray-900 mb-2">Need direct assistance?</p>
                <div className="text-sm text-gray-700 bg-white p-4 rounded-xl shadow-inner mb-4 inline-block text-left">
                   <p><strong>Phone:</strong> 7660059918 / 9701567575</p>
                   <p className="mt-1"><strong>Email:</strong> support@civiktrack.com</p>
                </div>
                
                <form onSubmit={async (e) => { 
                   e.preventDefault(); 
                   const desc = e.target.ticketDesc.value;
                   try {
                     const res = await fetch('/api/tickets', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                         description: desc,
                         authorId: profile?._id || profile?.id || 'Unknown',
                         authorName: profile?.name || 'Unknown User',
                         authorEmail: profile?.email || 'N/A'
                       })
                     });
                     if (res.ok) {
                       showToast("Ticket raised successfully! We will contact you soon.", "success"); 
                       e.target.reset(); 
                     } else {
                       showToast("Failed to raise ticket.");
                     }
                   } catch(err) {
                     showToast("Network error.");
                   }
                }} className="text-left mt-2">
                   <label className="block text-sm font-bold text-gray-700 mb-1">Raise a Support Ticket</label>
                   <textarea required name="ticketDesc" rows="2" placeholder="Describe your issue with the app..." className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 mb-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
                   <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl transition shadow text-sm">Submit Ticket</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TERMS & CONDITIONS MODAL --- */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative p-6 bg-gradient-to-r from-gray-700 to-gray-900 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaFileContract /> Terms & Conditions
              </h2>
              <button 
                onClick={() => setTermsModalOpen(false)} 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <FaTimes size={18} />
              </button>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50 text-gray-700 space-y-5 text-sm leading-relaxed">
              <p>Welcome to CivikTrack. By accessing our platform, you agree to these terms of service and our privacy policy.</p>
              
              <h3 className="font-bold text-gray-900 text-base">1. User Responsibilities</h3>
              <p>As a user of CivikTrack, you are committing to posting accurate, truthful, and relevant civic issues. Spamming, abusive language, or posting misleading complaints will result in immediate suspension of your account.</p>
              
              <h3 className="font-bold text-gray-900 text-base">2. Privacy & Data</h3>
              <p>We value your privacy. Profile information, including government IDs and contact numbers, is encrypted and securely stored. It is solely used for complaint verification by civic officials and is never shared with third-party advertisers.</p>
              
              <h3 className="font-bold text-gray-900 text-base">3. Content Ownership</h3>
              <p>By posting evidence (photos, text descriptions) on CivikTrack, you grant the platform a license to display and escalate this content to the respective municipal authorities for resolution.</p>
              
              <h3 className="font-bold text-gray-900 text-base">4. Platform Liability</h3>
              <p>CivikTrack acts as a bridge between the citizens and city administration. We do not guarantee the resolution timeline of the raised issues as that relies on the relevant municipal departments.</p>

              <div className="pt-4 border-t border-gray-200 text-center">
                <button 
                  onClick={() => setTermsModalOpen(false)}
                  className="bg-gray-900 hover:bg-black text-white font-semibold py-2.5 px-8 rounded-lg transition shadow"
                >
                  I Understand and Agree
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MY POSTS MODAL --- */}
      {isMyPostsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaClipboardList /> My Complaints & Status
              </h2>
              <button 
                onClick={() => setMyPostsModalOpen(false)} 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <FaTimes size={18} />
              </button>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50 text-gray-700 space-y-4">
              {(() => {
                const myPosts = posts.filter(post => post.author?.name === profile?.name);
                if (myPosts.length === 0) {
                  return (
                    <div className="text-center py-10">
                      <div className="text-4xl mb-3">📝</div>
                      <p className="text-xl font-bold text-gray-600">No complaints yet</p>
                      <p className="text-md text-gray-500 mt-2">You haven't raised any complaints.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-4">
                    {myPosts.map(post => {
                      const canDelete = post.status === 'Pending';
                      return (
                        <div key={post._id || post.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{post.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-1 mb-3">{post.desc}</p>
                            <div className="flex items-center gap-3 text-xs font-semibold">
                              <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">{post.category}</span>
                              <span className="text-gray-500 flex items-center gap-1"><FaMapMarkerAlt /> {post.location}</span>
                            </div>
                          </div>
                          <div className="flex flex-row items-center justify-between w-full sm:w-auto sm:flex-col sm:items-end gap-3 sm:gap-2">
                            <StatusBadge status={post.status} />
                            {canDelete ? (
                              <button 
                                onClick={() => handleDeletePost(post._id || post.id)}
                                className="flex items-center gap-1.5 text-sm bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-bold px-4 py-2 rounded-xl border border-red-200 hover:border-red-500 transition-all shadow-sm"
                              >
                                <FaTrash /> Delete Post
                              </button>
                            ) : (
                              <span className="text-xs text-green-700 font-bold bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 flex items-center flex-col sm:flex-row gap-1 whitespace-nowrap text-center text-[10px] sm:text-xs">
                                <FaCheckCircle /> Action Taken
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Separate component for Post Cards
function PostCard({ post, onVote, onDelete, onComment, profile, StatusBadge, isTop }) {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [likeAnim, setLikeAnim] = useState(false);

  const currentUserId = profile?._id || profile?.id || 'Anonymous';
  const hasVoted = post.votedBy?.includes(currentUserId);

  const handleVoteClick = () => {
    if (!hasVoted) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 800);
    }
    onVote(post._id || post.id);
  };

  const getLikesText = () => {
    if (!post.votedBy || post.votes === 0) return "0 Escalations";
    if (hasVoted) {
      return post.votes === 1 ? "Liked by you" : `Liked by you and ${post.votes - 1} others`;
    }
    const firstVoter = post.votedBy[post.votedBy.length - 1]; // Just show an ID or anonymous
    return post.votes === 1 ? `1 Escalation` : `${post.votes} Escalations`;
  };

  return (
    <div className={`bg-white rounded-3xl overflow-hidden transition-all duration-300 ${isTop ? 'shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-orange-200 hover:border-orange-400' : 'shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-1'}`}>
      
      {/* POST HEADER: AUTHOR */}
      <div className="flex justify-between items-start p-5 bg-white">
        <div className="flex items-center gap-3">
          <img src={post.author?.avatar || 'https://i.pravatar.cc/150'} alt={post.author?.name || 'Anonymous'} className="w-12 h-12 rounded-full border border-gray-200 shadow-sm" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 leading-tight">{post.author?.name || 'Anonymous'}</h3>
              {isTop && <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider shadow-sm">Hot</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span id={`post-time-${post._id || post.id}`}>{timeAgo(post.createdAt || post.time)}</span>
              &bull;
              <span className="flex items-center gap-1 text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                <FaMapMarkerAlt size={10} /> {post.location}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={post.status} />
      </div>

      {/* POST METADATA & CONTENT */}
      <div className="px-5 pb-3">
        {post.deletion?.isDeleted && (
           <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-xl shadow-sm text-sm">
             <div className="font-black text-red-800 uppercase text-xs tracking-wider mb-1">Government Mandated Takedown</div>
             <div className="font-bold text-red-600">Reason: {post.deletion.reason}</div>
             <div className="text-xs text-red-500 mt-1 uppercase">Executed by Official: {post.deletion.deletedBy}</div>
           </div>
        )}
        <h4 className="text-xl font-bold text-gray-800 mb-2 leading-tight">{post.title}</h4>
        <p className="text-gray-600 text-[15px] leading-relaxed mb-3">{post.desc}</p>
        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg uppercase tracking-wider">
          {post.category}
        </span>
      </div>

      {/* POST IMAGE */}
      {post.image && (
        <div className="w-full h-64 sm:h-[22rem] overflow-hidden bg-gray-100 relative">
          <img src={post.image} alt="Complaint Evidence" className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]" />
          {likeAnim && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <FaThumbsUp className="text-white text-6xl drop-shadow-2xl animate-ping opacity-80" />
            </div>
          )}
        </div>
      )}

      {/* STATS & ACTIONS */}
      <div className="px-5 py-4 bg-gray-50/50">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
             <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${hasVoted ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-blue-50 text-blue-600'}`}>
               <FaThumbsUp size={14} className={likeAnim ? 'animate-[bounce_0.5s_ease-in-out_infinite]' : ''} />
             </div>
             <span className={`font-bold text-sm transition-colors duration-300 ${hasVoted ? 'text-blue-700' : 'text-slate-700'}`}>{getLikesText()}</span>
          </div>
          <span onClick={() => setShowComments(!showComments)} className="text-sm font-medium text-gray-500 hover:text-indigo-600 cursor-pointer transition select-none flex items-center gap-1">
             {post.commentsData?.length || post.comments || 0} comments
          </span>
        </div>
        
        <div className="flex gap-4 pt-5 border-t border-slate-100">
          <button 
            onClick={handleVoteClick}
            className={`flex-[2] flex items-center justify-center gap-2 py-3.5 font-black rounded-[1.25rem] shadow-lg transition-all duration-300 active:scale-95 relative overflow-hidden group/btn font-inter text-[10px] uppercase tracking-widest ${
              hasVoted 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-blue-200' 
              : 'bg-white border-2 border-slate-100 text-slate-700 hover:border-blue-200 hover:text-blue-600'
            }`}
          >
            <FaThumbsUp className={`text-sm transition-transform duration-300 ${hasVoted ? 'scale-110' : 'group-hover/btn:scale-110'}`} /> 
            {hasVoted ? 'Escalated' : 'Escalate Issue'}
            {likeAnim && (
              <span className="absolute inset-0 bg-white/20 animate-ping"></span>
            )}
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-50 border border-slate-100 text-slate-600 font-black rounded-[1.25rem] hover:bg-white hover:shadow-md transition-all active:scale-95 font-inter text-[10px] uppercase tracking-widest"
          >
            <FaRegComment className="text-sm" /> Discuss
          </button>
        </div>

        {/* COMMENTS SECTION */}
        {showComments && (
          <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-inner mb-3 max-h-60 overflow-y-auto custom-scrollbar p-3 space-y-3">
               {(!post.commentsData || post.commentsData.length === 0) ? (
                 <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first to discuss!</p>
               ) : (
                 post.commentsData.map((cmd, idx) => (
                   <div key={idx} className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                     <img src={cmd.avatar || 'https://i.pravatar.cc/150'} alt="cmt" className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                     <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2 flex-1 relative top-1">
                        <p className="text-xs font-bold text-gray-900">{cmd.user}</p>
                        <p className="text-sm text-gray-700 mt-0.5">{cmd.text}</p>
                     </div>
                   </div>
                 ))
               )}
            </div>
            
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                onComment(post._id || post.id, commentInput); 
                setCommentInput(''); 
              }} 
              className="flex gap-2"
            >
              <img src={profile?.avatar || 'https://i.pravatar.cc/150'} alt="me" className="w-10 h-10 rounded-full border border-gray-200" />
              <input 
                type="text" 
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment..." 
                className="flex-1 bg-white border border-gray-300 rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
              />
              <button 
                type="submit" 
                disabled={!commentInput.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all shadow-md shadow-blue-100 font-inter" 
              >
                Post
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Toast({ message, type, show }) {
  if (!show) return null;
  const isSuccess = type === 'success';
  return (
    <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-6 fade-in duration-300">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isSuccess ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
          {isSuccess ? <FaCheckCircle /> : <FaExclamationCircle />}
        </div>
        <p className="font-bold whitespace-pre-wrap max-w-xs">{message}</p>
      </div>
    </div>
  );
}
