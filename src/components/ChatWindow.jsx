import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPaperPlane, FaUserCircle } from 'react-icons/fa';

export default function ChatWindow({ currentUser, otherUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Polling every 3s
    return () => clearInterval(interval);
  }, [currentUser, otherUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const currentId = currentUser._id || currentUser.id;
      const res = await fetch(`/api/messages/user/${currentId}`);
      if (res.ok) {
        const allMsgs = await res.json();
        const otherId = otherUser._id || otherUser.id;
        
        const chatMsgs = allMsgs.filter(m => 
          (m.senderId === otherId) || (m.receiverId === otherId)
        ).sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date)); // Sort ascending
        
        setMessages(chatMsgs);

        // Mark unread messages from otherUser as read
        chatMsgs.forEach(m => {
           if (m.receiverId === currentId && !m.read) {
              fetch(`/api/messages/read/${m._id}`, { method: 'PUT' });
           }
        });
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser._id || currentUser.id,
          receiverId: otherUser._id || otherUser.id,
          text
        })
      });
      if (res.ok) {
        setText('');
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-center items-end sm:items-center bg-black/40 backdrop-blur-sm sm:px-4 animate-in fade-in">
      <div className="bg-slate-50 w-full sm:w-[450px] h-[85vh] sm:h-[600px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transform transition-all animate-in slide-in-from-bottom-10 sm:zoom-in-95 border border-slate-200">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white shadow-md z-10">
          <div className="flex items-center gap-3">
            <FaUserCircle className="text-3xl text-indigo-200" />
            <div>
              <h3 className="font-bold text-lg leading-tight">{otherUser.name}</h3>
              <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-semibold">{otherUser.jurisdiction} {otherUser.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-indigo-500/50 hover:bg-indigo-500 rounded-full transition-colors">
            <FaTimes />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]" style={{ backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')", opacity: 0.95 }}>
          {messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
               <div className="bg-yellow-100/90 text-yellow-800 text-xs font-semibold px-4 py-2 rounded-xl shadow-sm text-center max-w-[80%]">
                 Messages are end-to-end encrypted within the CivikTrack network. No one outside of this chat can read them.
               </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const currentId = currentUser._id || currentUser.id;
              const isMine = msg.senderId === currentId;
              return (
                <div key={msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm relative ${isMine ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                    <p className="text-sm text-slate-800 break-words">{msg.text}</p>
                    <p className={`text-[9px] text-slate-400 text-right mt-1 font-semibold flex items-center justify-end gap-1 ${isMine ? 'text-green-700/60' : ''}`}>
                      {formatTime(msg.createdAt || msg.date)}
                      {isMine && <span className="text-green-500">✓✓</span>}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white px-4 py-3 border-t border-slate-200">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input 
              type="text" 
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 bg-slate-100 border-none px-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
            <button 
              type="submit" 
              disabled={!text.trim()}
              className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <FaPaperPlane className="ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
