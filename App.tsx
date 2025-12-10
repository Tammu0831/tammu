import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { Friend } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  // Handle hardware back button on Android / Mobile browser back
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // When back button is pressed, close the chat (return to sidebar)
      setSelectedFriend(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectFriend = (friend: Friend) => {
    // Push a state to history so the Android back button works naturally
    window.history.pushState({ chatOpen: true }, '', `/chat/${friend.uid}`);
    setSelectedFriend(friend);
  };

  const handleBack = () => {
    // Simulate back button press (triggers popstate)
    // If no history exists (unlikely in this flow), force null
    if (window.history.state) {
      window.history.back();
    } else {
      setSelectedFriend(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      
      {/* Sidebar: Hidden on mobile if chat is open */}
      <div className={`${selectedFriend ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full`}>
        <Sidebar 
          onSelectFriend={handleSelectFriend} 
          selectedFriendId={selectedFriend?.uid}
        />
      </div>

      {/* Chat Area: Hidden on mobile if no chat selected */}
      <div className={`${!selectedFriend ? 'hidden md:flex' : 'flex'} flex-1 h-full`}>
        {selectedFriend ? (
          <ChatWindow 
            selectedFriend={selectedFriend} 
            onBack={handleBack} 
          />
        ) : (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-600 mb-2">It's nice to chat</h2>
            <p className="max-w-xs mx-auto">Select a friend from the sidebar to start messaging or search for new people to connect with.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;