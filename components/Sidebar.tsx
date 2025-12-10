import React, { useEffect, useState } from 'react';
import { LogOut, UserPlus, Search, X, Check, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { 
  searchUsers, 
  sendFriendRequest, 
  subscribeToFriendRequests, 
  respondToRequest, 
  subscribeToFriends, 
  getUserProfile
} from '../services/db';
import { Friend, FriendRequest, UserProfile } from '../types';

interface SidebarProps {
  onSelectFriend: (friend: Friend) => void;
  selectedFriendId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectFriend, selectedFriendId }) => {
  const { currentUser } = useAuth();
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  
  // State
  const [view, setView] = useState<'friends' | 'search' | 'requests'>('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [requestSentMsg, setRequestSentMsg] = useState('');

  // Initial Load
  useEffect(() => {
    if (currentUser) {
      getUserProfile(currentUser.uid).then(setCurrentUserProfile);
      
      const unsubRequests = subscribeToFriendRequests(currentUser.uid, setRequests);
      const unsubFriends = subscribeToFriends(currentUser.uid, setFriends);

      return () => {
        unsubRequests();
        unsubFriends();
      };
    }
  }, [currentUser]);

  // Handlers
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !searchTerm.trim()) return;
    setLoadingSearch(true);
    try {
      const results = await searchUsers(searchTerm, currentUser.uid);
      setSearchResults(results);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSendRequest = async (user: UserProfile) => {
    if (!currentUserProfile) return;
    try {
      await sendFriendRequest(currentUserProfile, user.uid);
      setRequestSentMsg(`Request sent to ${user.username}`);
      setTimeout(() => setRequestSentMsg(''), 3000);
    } catch (e: any) {
      setRequestSentMsg(e.message);
      setTimeout(() => setRequestSentMsg(''), 3000);
    }
  };

  const handleResponse = async (reqId: string, fromUid: string, action: 'accepted' | 'rejected') => {
    if (!currentUser) return;
    await respondToRequest(reqId, fromUid, currentUser.uid, action);
  };

  const handleLogout = () => signOut(auth);

  // Render Helpers
  const renderFriendsList = () => (
    <div className="flex-1 overflow-y-auto">
      {friends.length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-sm">
          No friends yet. <br/>Click search to add some!
        </div>
      ) : (
        <div className="space-y-1 p-2">
          {friends.map(friend => (
            <div
              key={friend.uid}
              onClick={() => onSelectFriend(friend)}
              className={`flex items-center p-3 rounded-xl cursor-pointer transition ${
                selectedFriendId === friend.uid 
                  ? 'bg-brand-50 border border-brand-200' 
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-tr from-brand-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold mr-3 shadow-sm">
                {friend.username[0].toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-medium text-slate-800 truncate">{friend.username}</h4>
                <p className="text-xs text-slate-500 truncate">Tap to chat</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSearch = () => (
    <div className="flex-1 flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-slate-700">Find People</h3>
        <button onClick={() => setView('friends')} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by username..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </form>

      {requestSentMsg && (
        <div className="mb-2 text-xs text-center text-green-600 bg-green-50 p-2 rounded">
          {requestSentMsg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {loadingSearch ? (
          <div className="text-center text-slate-400 py-4">Searching...</div>
        ) : searchResults.map(user => (
          <div key={user.uid} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
            <div>
              <p className="font-semibold text-slate-800 text-sm">{user.username}</p>
            </div>
            <button
              onClick={() => handleSendRequest(user)}
              className="text-xs bg-brand-50 text-brand-600 px-3 py-1.5 rounded-full hover:bg-brand-100 font-medium transition"
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="flex-1 flex flex-col p-4">
       <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-slate-700">Friend Requests</h3>
        <button onClick={() => setView('friends')} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {requests.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-4">No pending requests</div>
        ) : requests.map(req => (
          <div key={req.id} className="p-3 bg-white border border-brand-100 rounded-lg shadow-sm">
            <p className="text-sm text-slate-800 mb-2">
              <span className="font-bold">{req.fromUsername}</span> wants to be friends.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleResponse(req.id, req.fromUid, 'accepted')}
                className="flex-1 flex items-center justify-center py-1.5 bg-brand-600 text-white text-xs rounded-md hover:bg-brand-700"
              >
                <Check className="w-3 h-3 mr-1" /> Accept
              </button>
              <button
                onClick={() => handleResponse(req.id, req.fromUid, 'rejected')}
                className="flex-1 flex items-center justify-center py-1.5 bg-slate-100 text-slate-600 text-xs rounded-md hover:bg-slate-200"
              >
                <X className="w-3 h-3 mr-1" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 w-full md:w-80 lg:w-96">
      {/* Header */}
      <div className="h-16 px-4 border-b flex items-center justify-between shrink-0 bg-slate-50">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold mr-2">
            F
          </div>
          <h1 className="font-bold text-xl text-slate-800 tracking-tight">FireChat</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setView(view === 'requests' ? 'friends' : 'requests')}
            className="p-2 relative text-slate-600 hover:bg-slate-200 rounded-full transition"
          >
            <Bell className="w-5 h-5" />
            {requests.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>
          <button 
            onClick={() => setView(view === 'search' ? 'friends' : 'search')}
            className="p-2 text-slate-600 hover:bg-slate-200 rounded-full transition"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'friends' && renderFriendsList()}
      {view === 'search' && renderSearch()}
      {view === 'requests' && renderRequests()}

      {/* Footer / User Profile */}
      <div className="p-4 border-t bg-slate-50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center overflow-hidden">
            <div className="w-9 h-9 bg-slate-300 rounded-full flex items-center justify-center text-slate-600 font-bold mr-3 text-sm">
              {currentUserProfile?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {currentUserProfile?.username || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">Online</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 transition"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;