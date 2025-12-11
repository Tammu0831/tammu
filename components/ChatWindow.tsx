import React, { useEffect, useState, useRef } from 'react';
import { Send, Menu } from 'lucide-react';
import { Friend, Message } from '../types';
import { sendMessage, subscribeToMessages } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

interface ChatWindowProps {
  selectedFriend: Friend;
  onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ selectedFriend, onBack }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedFriend) return;
    const unsubscribe = subscribeToMessages(selectedFriend.chatId, (msgs) => {
      setMessages(msgs);
    });
    return unsubscribe;
  }, [selectedFriend]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;
    
    const text = inputText;
    setInputText(''); // optimistic clear
    await sendMessage(selectedFriend.chatId, text, currentUser.uid);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="h-16 bg-white border-b flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center">
          <button onClick={onBack} className="md:hidden mr-3 p-2 hover:bg-slate-100 rounded-full">
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg mr-3">
            {selectedFriend.username[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{selectedFriend.username}</h3>
            <span className="text-xs text-green-500 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Online
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          return (
            <div 
              key={msg.id} 
              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm md:text-base break-words shadow-sm ${
                  isMe 
                    ? 'bg-brand-500 text-white rounded-br-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>No messages yet. Say hello!</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t shrink-0">
        <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 border border-slate-200 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 py-1"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-brand-500 text-white rounded-full hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-500 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;