import React, { useState, useEffect } from 'react';
import { FaTimes, FaUserCircle, FaEnvelope, FaChevronRight } from 'react-icons/fa';
import ChatWindow from './ChatWindow';

export default function InboxWindow({ currentUser, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInbox();
  }, [currentUser]);

  const fetchInbox = async () => {
    try {
      const res = await fetch(`/api/messages/user/${currentUser._id || currentUser.id}`);
      if (res.ok) {
        const allMsgs = await res.json();
        const contactMap = new Map();
        const currentId = currentUser._id || currentUser.id;

        allMsgs.forEach(msg => {
          const isSender = msg.senderId === currentId;
          const otherId = isSender ? msg.receiverId : msg.senderId;
          const otherName = isSender ? 'User' : msg.senderName; // If we sent the msg, we might not have receiverName in msg.
          const otherRole = isSender ? msg.receiverRole : msg.senderRole;
          
          if (!contactMap.has(otherId)) {
            contactMap.set(otherId, {
              id: otherId,
              name: otherName,
              role: otherRole,
              lastMessage: msg.text,
              timestamp: msg.createdAt || msg.date,
              unread: !isSender && !msg.read ? 1 : 0
            });
          } else {
            if (!isSender && !msg.read) {
              contactMap.get(otherId).unread += 1;
            }
          }
        });

        // To fetch proper names for receivers if missing, we could do an extra fetch, 
        // but for now we'll assume the mandal authority initiated the chat so they are the sender of the first msg.
        
        setContacts(Array.from(contactMap.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }
    } catch(err) {} finally {
      setLoading(false);
    }
  };

  if (selectedContact) {
    return <ChatWindow currentUser={currentUser} otherUser={{ _id: selectedContact.id, name: selectedContact.name, role: selectedContact.role }} onClose={() => { setSelectedContact(null); fetchInbox(); }} />;
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-center items-end sm:items-center bg-black/40 backdrop-blur-sm sm:px-4 animate-in fade-in">
      <div className="bg-slate-50 w-full sm:w-[450px] h-[85vh] sm:h-[600px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transform transition-all animate-in slide-in-from-bottom-10 sm:zoom-in-95 border border-slate-200">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-5 flex items-center justify-between text-white shadow-md z-10">
          <div className="flex items-center gap-3">
            <FaEnvelope className="text-2xl text-indigo-200" />
            <div>
              <h3 className="font-bold text-lg leading-tight">Secure Inbox</h3>
              <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-semibold">Direct Comm Channel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-indigo-500/50 hover:bg-indigo-500 rounded-full transition-colors">
            <FaTimes />
          </button>
        </div>

        {/* Contacts Area */}
        <div className="flex-1 overflow-y-auto bg-white divide-y divide-slate-100">
          {loading ? (
            <div className="flex justify-center items-center h-full text-slate-400 font-bold">Loading secure comms...</div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full p-8 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-3xl mb-4"><FaEnvelope/></div>
               <p className="text-slate-500 font-bold">No active communications.</p>
               <p className="text-xs text-slate-400 mt-2">When a Mandal Authority contacts you, the conversation will appear here.</p>
            </div>
          ) : (
            contacts.map(c => (
              <button key={c.id} onClick={() => setSelectedContact(c)} className="w-full flex items-center p-4 hover:bg-indigo-50/50 transition-colors text-left group">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-4 flex-shrink-0">
                  <FaUserCircle className="text-3xl opacity-80" />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-bold text-slate-900 truncate">{c.name === 'User' ? 'Authority Contact' : c.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 ml-2">{new Date(c.timestamp).toLocaleDateString()}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-500 truncate">{c.lastMessage}</p>
                      {c.unread > 0 && <span className="bg-emerald-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2 shadow-sm">{c.unread}</span>}
                   </div>
                   {c.role && <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 mt-1">{c.role.replace('_', ' ')}</p>}
                </div>
                <FaChevronRight className="text-slate-300 ml-4 group-hover:text-indigo-400 transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
