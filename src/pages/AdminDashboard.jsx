import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { 
  FaTrash, FaKey, FaUserSecret, FaCheckCircle, FaExclamationCircle, 
  FaCopy, FaTicketAlt, FaUsers, FaUserShield, FaShieldAlt, 
  FaChartBar, FaSignOutAlt, FaBars, FaTimes, FaSearch,
  FaUserPlus, FaExclamationTriangle, FaBalanceScale
} from 'react-icons/fa';

const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',          icon: FaChartBar },
  { id: 'tickets',    label: 'Support Tickets',   icon: FaTicketAlt },
  { id: 'citizens',   label: 'Registered Users',  icon: FaUsers },
  { id: 'authorities',label: 'Authorities',        icon: FaUserShield },
  { id: 'onboarding', label: 'Add Authority',      icon: FaUserPlus },
  { id: 'moderation', label: 'Post Moderation',    icon: FaExclamationTriangle },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apHierarchy, setApHierarchy] = useState(null);

  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '', role: 'village_authority', jurisdiction: '' });
  const [locDistrict, setLocDistrict] = useState('');
  const [locMandal, setLocMandal] = useState('');
  const [locVillage, setLocVillage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [emailAlert, setEmailAlert] = useState(null);

  const [citizenSearch, setCitizenSearch] = useState('');
  const [authSearch, setAuthSearch] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketTab, setTicketTab] = useState('citizen');

  const [targetPostId, setTargetPostId] = useState('');
  const [targetPost, setTargetPost] = useState(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const timeAgo = (d) => {
    if (!d) return '';
    const days = Math.floor((new Date() - new Date(d)) / 86400000);
    if (days === 0) return 'Today';
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };
  const isOverdue = (d) => {
    if (!d) return false;
    return Math.floor((new Date() - new Date(d)) / 86400000) > 5;
  };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('civik_user') || '{}');
    if (u.role !== 'admin') navigate('/login');
    else fetchAdminData();
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [uRes, tRes, hRes] = await Promise.all([fetch('/api/admin/users'), fetch('/api/admin/tickets'), fetch('/api/hierarchy')]);
      if (uRes.ok && tRes.ok) {
        setUsers((await uRes.json()).users || []);
        setTickets(await tRes.json() || []);
      } else setError('Failed to fetch admin data.');
      if (hRes && hRes.ok) setApHierarchy(await hRes.json());
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const handleResolveTicket = async (id) => {
    const res = await fetch(`/api/admin/tickets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Resolved' }) });
    if (res.ok) setTickets(tickets.map(t => t._id === id ? { ...t, status: 'Resolved' } : t));
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user and all their data?')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) { setUsers(users.filter(u => u._id !== id)); alert('User deleted.'); }
  };

  const handleResetPassword = async (id, name) => {
    const p = prompt(`Enter new password for ${name}:`);
    if (!p) return;
    const res = await fetch(`/api/admin/users/${id}/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword: p }) });
    if (res.ok) alert('Password updated successfully.');
  };

  const handleImpersonate = (user) => {
    if (!window.confirm(`View dashboard as ${user.name}?`)) return;
    localStorage.setItem('civik_user', JSON.stringify({ id: user._id, name: user.name, email: user.email }));
    localStorage.setItem('civik_admin_impersonating', 'true');
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    localStorage.removeItem('civik_token');
    localStorage.removeItem('civik_user');
    window.location.href = '/login';
  };

  const handleFetchTargetPost = async (e) => {
    e.preventDefault();
    if (!targetPostId) return;
    setTargetLoading(true);
    try {
      const res = await fetch(`/api/posts/${targetPostId}`);
      if (res.ok) setTargetPost(await res.json());
      else { alert('Post not found.'); setTargetPost(null); }
    } catch { alert('Error finding post.'); }
    finally { setTargetLoading(false); }
  };

  const handleHardBanTarget = async () => {
    if (!targetPost?.author?.id) return alert('No valid author ID found.');
    if (!window.confirm('This will permanently delete the post and ban the user. Confirm?')) return;
    await fetch(`/api/posts/${targetPostId}`, { method: 'DELETE' });
    await fetch(`/api/admin/users/${targetPost.author.id}/ban`, { method: 'PUT' });
    alert('Post deleted and user banned.');
    setTargetPost(null); setTargetPostId(''); fetchAdminData();
  };

  const handleCreateAuthority = async (e) => {
    e.preventDefault();
    let finalJurisdiction = '';
    if (authForm.role === 'district_authority') {
      if (!locDistrict) return alert('District is required.');
      finalJurisdiction = locDistrict;
    } else if (authForm.role === 'mandal_authority') {
      if (!locMandal) return alert('Mandal is required.');
      finalJurisdiction = locMandal;
    } else {
      if (!locVillage) return alert('Village is required.');
      finalJurisdiction = locVillage;
    }

    setAuthLoading(true);
    try {
      const payload = { ...authForm, jurisdiction: finalJurisdiction };
      const res = await fetch('/api/admin/authorities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        setAuthForm({ name: '', email: '', phone: '', password: '', role: 'village_authority', jurisdiction: '' });
        setLocDistrict(''); setLocMandal(''); setLocVillage('');
        setEmailAlert({ url: data.previewUrl, realEmail: data.realEmail, email: authForm.email });
        fetchAdminData();
      } else alert(`Error: ${data.message}`);
    } catch { alert('Network error.'); }
    finally { setAuthLoading(false); }
  };

  const getDistrictOptions = () => {
    if (!apHierarchy || !apHierarchy.districts) return [];
    return apHierarchy.districts.map(d => ({ label: d.name, value: d.name }));
  };

  const getMandalOptions = () => {
    if (!apHierarchy || !locDistrict) return [];
    const district = apHierarchy.districts.find(d => d.name === locDistrict);
    if (!district) return [];
    return district.mandals.map(m => ({ label: m.name, value: m.name }));
  };

  const getVillageOptions = () => {
    if (!apHierarchy || !locDistrict || !locMandal) return [];
    const district = apHierarchy.districts.find(d => d.name === locDistrict);
    if (!district) return [];
    const mandal = district.mandals.find(m => m.name === locMandal);
    if (!mandal) return [];
    return mandal.villages.map(v => ({ label: v, value: v }));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="text-4xl mb-3">⚖️</div>
        <p className="text-slate-600 font-semibold text-lg">Loading Admin Portal...</p>
      </div>
    </div>
  );

  const openTickets = tickets.filter(t => t.status === 'Open').length;
  const urgentCount = tickets.filter(t => t.authorRole && t.authorRole !== 'citizen' && t.status === 'Open').length;
  const citizenList = users.filter(u => !u.role || u.role === 'citizen');
  const authorityList = users.filter(u => u.role && u.role !== 'citizen');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* ─── TOP BAR ─── */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-slate-500 hover:text-slate-800 transition" onClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}>
              {sidebarOpen ? <FaTimes size={18}/> : <FaBars size={18}/>}
            </button>
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
              <FaBalanceScale className="text-yellow-400 text-lg" />
            </div>
            <div className="leading-tight">
              <p className="font-black text-slate-900 text-2xl tracking-tighter">
                CivikTrack
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">Admin Console</p>
            </div>
          </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {urgentCount > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-full text-xs font-bold">
                <FaExclamationCircle className="animate-pulse"/>
                {urgentCount} Urgent Escalation{urgentCount > 1 ? 's' : ''}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold px-4 py-2 rounded-lg transition text-sm"
            >
              <FaSignOutAlt /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">
        {/* ─── SIDEBAR ─── */}
        <aside className={`
          fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] z-30
          bg-white border-r border-slate-200 w-64 flex-shrink-0
          flex flex-col py-6 transition-transform duration-300 shadow-sm
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <nav className="space-y-1 px-3">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeSection === id;
              const hasBadge = id === 'tickets' && urgentCount > 0;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveSection(id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span className="flex-1 text-left">{label}</span>
                  {hasBadge && (
                    <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                      {urgentCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto px-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portal Version</p>
              <p className="text-slate-600 font-bold text-sm mt-0.5">CivikTrack v2.0</p>
            </div>
          </div>
        </aside>

        {/* Sidebar Overlay for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 px-4 sm:px-8 py-8 min-w-0 overflow-auto">
          {error && <div className="mb-6 bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl font-semibold text-sm">{error}</div>}

          {/* ═══ OVERVIEW ═══ */}
          {activeSection === 'overview' && (
            <div>
              <SectionHeader
                title="Dashboard Overview"
                subtitle="Real-time summary of all civic portal activity"
                icon="📊"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                <MetricCard label="Registered Citizens" value={citizenList.length} color="blue" icon={<FaUsers />} />
                <MetricCard label="Provisioned Authorities" value={authorityList.length} color="green" icon={<FaUserShield />} />
                <MetricCard label="Open Support Tickets" value={openTickets} color={openTickets > 0 ? 'amber' : 'slate'} icon={<FaTicketAlt />} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div
                  className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition"
                  onClick={() => setActiveSection('tickets')}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><FaTicketAlt /></div>
                    <p className="font-bold text-slate-700">Support Ticket Queue</p>
                  </div>
                  <p className="text-slate-500 text-sm">{openTickets} open ticket{openTickets !== 1 ? 's' : ''} awaiting resolution</p>
                  {urgentCount > 0 && <p className="text-red-600 text-xs font-bold mt-1">⚠ {urgentCount} urgent authority escalation{urgentCount > 1 ? 's' : ''}</p>}
                </div>
                <div
                  className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition"
                  onClick={() => setActiveSection('citizens')}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600"><FaUsers /></div>
                    <p className="font-bold text-slate-700">User Directory</p>
                  </div>
                  <p className="text-slate-500 text-sm">{citizenList.length} registered citizens, {authorityList.length} provisioned officials</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TICKETS ═══ */}
          {activeSection === 'tickets' && (
            <div>
              <SectionHeader
                title="Support Ticket Management"
                subtitle="Review and resolve citizen and authority support requests"
                icon="🎫"
              />
              {/* Sub-tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setTicketTab('citizen')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${ticketTab === 'citizen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Citizen Tickets
                  </button>
                  <button
                    onClick={() => setTicketTab('authority')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${ticketTab === 'authority' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Authority Escalations
                    {urgentCount > 0 && <span className="bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">{urgentCount}</span>}
                  </button>
                </div>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by ticket ID..."
                    value={ticketSearch}
                    onChange={e => setTicketSearch(e.target.value)}
                    className="pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-60 font-mono"
                  />
                </div>
              </div>

              {/* Citizen Tickets */}
              {ticketTab === 'citizen' && (
                <TicketTable
                  tickets={tickets.filter(t => !t.authorRole || t.authorRole === 'citizen').filter(t => t.ticketId?.toLowerCase().includes(ticketSearch.toLowerCase()))}
                  onResolve={handleResolveTicket}
                  timeAgo={timeAgo}
                  isOverdue={isOverdue}
                  variant="citizen"
                  emptyMsg="No citizen support tickets found."
                />
              )}

              {/* Authority Tickets */}
              {ticketTab === 'authority' && (
                <TicketTable
                  tickets={tickets.filter(t => t.authorRole && t.authorRole !== 'citizen').filter(t => t.ticketId?.toLowerCase().includes(ticketSearch.toLowerCase()))}
                  onResolve={handleResolveTicket}
                  timeAgo={timeAgo}
                  isOverdue={isOverdue}
                  variant="authority"
                  emptyMsg="No authority escalations found."
                />
              )}
            </div>
          )}

          {/* ═══ REGISTERED CITIZENS ═══ */}
          {activeSection === 'citizens' && (
            <div>
              <SectionHeader
                title="Registered Citizens"
                subtitle="Manage all standard citizen accounts on the platform"
                icon="👥"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <p className="text-slate-500 text-sm">{citizenList.length} total citizens</p>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={citizenSearch}
                    onChange={e => setCitizenSearch(e.target.value)}
                    className="pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Citizen</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Complaints</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {citizenList
                      .filter(u => u.name.toLowerCase().includes(citizenSearch.toLowerCase()) || u.email.toLowerCase().includes(citizenSearch.toLowerCase()))
                      .map(user => (
                        <tr key={user._id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                            {user.canPost === false && (
                              <span className="inline-block mt-1 text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full uppercase">Posting Banned</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-blue-600 text-xs font-medium">{user.email}</p>
                            <p className="text-slate-400 text-xs font-mono mt-0.5">{user.phone || 'No phone'}</p>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="font-bold text-slate-700">{user.postCount || 0}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <ActionBtn icon={<FaUserSecret />} label="Inspect" color="blue" onClick={() => handleImpersonate(user)} />
                              <ActionBtn icon={<FaKey />} label="Reset PW" color="amber" onClick={() => handleResetPassword(user._id, user.name)} />
                              <ActionBtn icon={<FaTrash />} label="Ban" color="red" onClick={() => handleDeleteUser(user._id)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {citizenList.filter(u => u.name.toLowerCase().includes(citizenSearch.toLowerCase())).length === 0 && (
                  <p className="p-6 text-slate-400 text-sm text-center">No citizens matched your search.</p>
                )}
              </div>
            </div>
          )}

          {/* ═══ AUTHORITIES ═══ */}
          {activeSection === 'authorities' && (
            <div>
              <SectionHeader
                title="Provisioned Authorities"
                subtitle="Manage all official government authority accounts"
                icon="🛡️"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <p className="text-slate-500 text-sm">{authorityList.length} provisioned officials</p>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search officials..."
                    value={authSearch}
                    onChange={e => setAuthSearch(e.target.value)}
                    className="pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Official</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact & Jurisdiction</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {authorityList
                      .filter(u => u.name.toLowerCase().includes(authSearch.toLowerCase()) || u.email.toLowerCase().includes(authSearch.toLowerCase()))
                      .map(user => (
                        <tr key={user._id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                            <span className="inline-block mt-1 text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full uppercase">{user.role?.replace('_', ' ')}</span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-blue-600 text-xs font-medium">{user.email}</p>
                            <p className="text-slate-400 text-xs mt-0.5">{user.jurisdiction || 'No jurisdiction set'}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <ActionBtn icon={<FaUserSecret />} label="Inspect" color="blue" onClick={() => handleImpersonate(user)} />
                              <ActionBtn icon={<FaKey />} label="Reset PW" color="amber" onClick={() => handleResetPassword(user._id, user.name)} />
                              <ActionBtn icon={<FaTrash />} label="Revoke" color="red" onClick={() => handleDeleteUser(user._id)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {authorityList.filter(u => u.name.toLowerCase().includes(authSearch.toLowerCase())).length === 0 && (
                  <p className="p-6 text-slate-400 text-sm text-center">No officials matched your search.</p>
                )}
              </div>
            </div>
          )}

          {/* ═══ ONBOARDING ═══ */}
          {activeSection === 'onboarding' && (
            <div>
              <SectionHeader
                title="Authority Onboarding"
                subtitle="Register a new official and dispatch their credentials via email"
                icon="➕"
              />

              {emailAlert && (
                <div className={`mb-6 p-4 rounded-xl font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm ${emailAlert.realEmail ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                  <div>
                    <p>{emailAlert.realEmail ? `✅ Email sent to ${emailAlert.email}` : `🛡️ Test email generated for ${emailAlert.email}`}</p>
                    {!emailAlert.realEmail && <p className="text-xs font-normal mt-1 opacity-75">Click the button to preview the email.</p>}
                  </div>
                  {!emailAlert.realEmail && (
                    <a href={emailAlert.url} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition whitespace-nowrap">
                      Preview Email
                    </a>
                  )}
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 max-w-3xl">
                <form onSubmit={handleCreateAuthority} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Inspector Ramesh' },
                      { label: 'Official Email', key: 'email', type: 'email', placeholder: 'ramesh@gov.in' },
                      { label: 'Temporary Password', key: 'password', type: 'text', placeholder: 'Secure password' },
                      { label: 'Phone Number', key: 'phone', type: 'text', placeholder: '+91 9999999999' },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key}>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                        <input
                          required type={type}
                          value={authForm[key]}
                          onChange={e => setAuthForm({ ...authForm, [key]: e.target.value.trim() })}
                          placeholder={placeholder}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Authority Role</label>
                      <select
                        value={authForm.role}
                        onChange={e => {
                          setAuthForm({ ...authForm, role: e.target.value });
                          setLocDistrict(''); setLocMandal(''); setLocVillage('');
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium text-slate-700"
                      >
                        <option value="village_authority">Village Level Authority</option>
                        <option value="mandal_authority">Mandal Level Authority</option>
                        <option value="district_authority">District Level Authority</option>
                      </select>
                    </div>

                    {/* DYNAMIC CASCADING DROPDOWNS */}
                    <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">District</label>
                        <Select
                          options={getDistrictOptions()}
                          value={locDistrict ? { label: locDistrict, value: locDistrict } : null}
                          onChange={(sel) => { setLocDistrict(sel ? sel.value : ''); setLocMandal(''); setLocVillage(''); }}
                          placeholder="Select District"
                          isClearable
                          styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0' }) }}
                        />
                      </div>
                      
                      {authForm.role !== 'district_authority' && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mandal</label>
                          <Select
                            options={getMandalOptions()}
                            value={locMandal ? { label: locMandal, value: locMandal } : null}
                            onChange={(sel) => { setLocMandal(sel ? sel.value : ''); setLocVillage(''); }}
                            placeholder="Select Mandal"
                            isDisabled={!locDistrict}
                            isClearable
                            styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0' }) }}
                          />
                        </div>
                      )}

                      {authForm.role === 'village_authority' && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Village</label>
                          <Select
                            options={getVillageOptions()}
                            value={locVillage ? { label: locVillage, value: locVillage } : null}
                            onChange={(sel) => setLocVillage(sel ? sel.value : '')}
                            placeholder="Select Village"
                            isDisabled={!locMandal}
                            isClearable
                            styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0' }) }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      disabled={authLoading} type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition shadow-sm disabled:opacity-60 text-sm"
                    >
                      {authLoading ? 'Creating Account...' : 'Create Account & Send Credentials'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ═══ MODERATION ═══ */}
          {activeSection === 'moderation' && (
            <div>
              <SectionHeader
                title="Post Moderation"
                subtitle="Look up a specific complaint post and take administrative action"
                icon="🔍"
              />
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 max-w-3xl">
                <form onSubmit={handleFetchTargetPost} className="flex flex-col sm:flex-row gap-3 mb-6">
                  <input
                    required type="text"
                    placeholder="Enter Post ID (e.g. 69da02...)"
                    value={targetPostId}
                    onChange={e => setTargetPostId(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <button
                    type="submit" disabled={targetLoading}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-3 rounded-xl transition text-sm whitespace-nowrap disabled:opacity-60"
                  >
                    {targetLoading ? 'Searching...' : 'Fetch Post'}
                  </button>
                </form>

                {targetPost && (
                  <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Post Found</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Title</p>
                        <p className="font-bold text-slate-900">{targetPost.title}</p>
                        <p className="text-sm text-slate-600 mt-1 italic line-clamp-2">"{targetPost.desc}"</p>
                        {targetPost.image && <img src={targetPost.image} alt="post" className="w-20 h-20 object-cover rounded-lg mt-3 border border-slate-200" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Posted By</p>
                        <div className="flex items-center gap-3">
                          <img src={targetPost.author?.avatar || 'https://i.pravatar.cc/150'} alt="author" className="w-10 h-10 rounded-full border border-slate-200" />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{targetPost.author?.name || 'Unknown'}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-blue-600 text-xs">{targetPost.author?.email || 'No email'}</p>
                              {targetPost.author?.email && (
                                <button
                                  onClick={() => { navigator.clipboard.writeText(targetPost.author.email); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}
                                  className="text-slate-400 hover:text-blue-600 transition"
                                >
                                  <FaCopy size={10} />
                                </button>
                              )}
                              {copySuccess && <span className="text-[10px] text-green-600 font-bold">Copied!</span>}
                            </div>
                            <p className="text-slate-400 text-xs font-mono">UID: {targetPost.author?.id || targetPost.author?._id || 'N/A'}</p>
                          </div>
                        </div>
                        <button
                          onClick={handleHardBanTarget}
                          className="mt-5 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                          <FaTrash /> Delete Post & Ban User
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ─── REUSABLE COMPONENTS ─── */

function SectionHeader({ title, subtitle, icon }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl">{icon}</span>
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
      </div>
      <p className="text-slate-500 text-sm ml-11">{subtitle}</p>
      <div className="mt-4 border-b border-slate-200" />
    </div>
  );
}

function MetricCard({ label, value, color, icon }) {
  const colors = {
    blue:  { bg: 'bg-blue-50',  text: 'text-blue-600',  border: 'border-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  }[color] || colors.slate;

  return (
    <div className={`bg-white border ${colors.border} rounded-2xl p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text}`}>{icon}</div>
      </div>
      <p className={`text-4xl font-black ${colors.text}`}>{value}</p>
    </div>
  );
}

function ActionBtn({ icon, label, color, onClick }) {
  const styles = {
    blue:  'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white',
    red:   'bg-red-50 text-red-700 hover:bg-red-600 hover:text-white',
  }[color];
  return (
    <button onClick={onClick} className={`${styles} flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition text-xs font-semibold`}>
      {icon} {label}
    </button>
  );
}

function TicketTable({ tickets, onResolve, timeAgo, isOverdue, variant, emptyMsg }) {
  if (tickets.length === 0) return <p className="py-10 text-slate-400 text-sm text-center">{emptyMsg}</p>;
  const isAuth = variant === 'authority';

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${isAuth ? 'border-red-200' : 'border-slate-200'}`}>
      <table className="w-full text-left">
        <thead>
          <tr className={`border-b text-xs font-bold uppercase tracking-wider ${isAuth ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            <th className="px-5 py-3.5">{isAuth ? 'Official Details' : 'Ticket Details'}</th>
            <th className="px-5 py-3.5">Description</th>
            <th className="px-5 py-3.5 text-right">Status & Action</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isAuth ? 'divide-red-100' : 'divide-slate-100'} text-sm`}>
          {[...tickets].sort((a, b) => {
            if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
            if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          }).map(ticket => (
            <tr key={ticket._id} className={`transition ${isAuth ? 'hover:bg-red-50/40' : 'hover:bg-slate-50'}`}>
              <td className="px-5 py-4">
                <p className={`font-mono text-xs font-bold tracking-wider mb-1 ${isAuth ? 'text-red-600' : 'text-blue-600'}`}>
                  {ticket.ticketId || ticket._id?.substring(0, 8)}
                </p>
                <p className="font-semibold text-slate-900">{ticket.authorName}</p>
                <p className="text-xs text-slate-400">{ticket.authorEmail}</p>
                {isAuth && <p className="text-[10px] text-red-500 font-bold uppercase mt-0.5">{ticket.authorRole}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">{timeAgo(ticket.createdAt)}</p>
                  {ticket.status !== 'Resolved' && isOverdue(ticket.createdAt) && (
                    <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">Overdue</span>
                  )}
                </div>
              </td>
              <td className="px-5 py-4 text-slate-600 text-sm max-w-xs leading-relaxed">{ticket.description}</td>
              <td className="px-5 py-4 text-right">
                <span className={`inline-block mb-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                  ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : isAuth ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {ticket.status}
                </span>
                {ticket.status === 'Open' && (
                  <div>
                    <button
                      onClick={() => onResolve(ticket._id)}
                      className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition ml-auto ${isAuth ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}
                    >
                      <FaCheckCircle /> Mark Resolved
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
