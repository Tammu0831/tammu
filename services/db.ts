import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  limit,
  or,
  and,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { FriendRequest, Message, UserProfile } from '../types';

// Users
export const createUserProfile = async (uid: string, email: string, username: string) => {
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    username,
    lowercaseUsername: username.toLowerCase(),
    createdAt: serverTimestamp(),
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
  });
};

export const searchUsers = async (searchTerm: string, currentUid: string): Promise<UserProfile[]> => {
  if (!searchTerm) return [];
  const term = searchTerm.toLowerCase();
  
  // Simple search: find exact or starts-with matches
  const q = query(
    collection(db, "users"),
    where("lowercaseUsername", ">=", term),
    where("lowercaseUsername", "<=", term + '\uf8ff')
  );

  const querySnapshot = await getDocs(q);
  const users: UserProfile[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data() as UserProfile;
    if (data.uid !== currentUid) {
      users.push(data);
    }
  });
  return users;
};

// Friend Requests
export const sendFriendRequest = async (fromUser: UserProfile, toUid: string) => {
  // Check if request already exists
  const q = query(
    collection(db, "friendRequests"),
    where("fromUid", "==", fromUser.uid),
    where("toUid", "==", toUid),
    where("status", "==", "pending")
  );
  const existing = await getDocs(q);
  if (!existing.empty) throw new Error("Request already sent");

  // Check if already friends (optional logic, usually done by checking friends list first)

  await addDoc(collection(db, "friendRequests"), {
    fromUid: fromUser.uid,
    fromUsername: fromUser.username,
    toUid,
    status: 'pending',
    createdAt: Date.now()
  });
};

export const subscribeToFriendRequests = (uid: string, callback: (requests: FriendRequest[]) => void) => {
  const q = query(
    collection(db, "friendRequests"),
    where("toUid", "==", uid),
    where("status", "==", "pending")
  );
  
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
    callback(requests);
  });
};

export const respondToRequest = async (requestId: string, fromUid: string, toUid: string, action: 'accepted' | 'rejected') => {
  const requestRef = doc(db, "friendRequests", requestId);
  await updateDoc(requestRef, { status: action });

  if (action === 'accepted') {
    // Generate deterministic Chat ID
    const chatId = [fromUid, toUid].sort().join("_");
    
    // Add to each other's friend lists
    const fromUserDoc = await getDoc(doc(db, "users", fromUid));
    const toUserDoc = await getDoc(doc(db, "users", toUid));
    
    if (fromUserDoc.exists() && toUserDoc.exists()) {
      const fromUserData = fromUserDoc.data() as UserProfile;
      const toUserData = toUserDoc.data() as UserProfile;

      await setDoc(doc(db, "users", toUid, "friends", fromUid), {
        uid: fromUid,
        username: fromUserData.username,
        email: fromUserData.email,
        chatId
      });

      await setDoc(doc(db, "users", fromUid, "friends", toUid), {
        uid: toUid,
        username: toUserData.username,
        email: toUserData.email,
        chatId
      });
    }
  }
};

// Friends
export const subscribeToFriends = (uid: string, callback: (friends: any[]) => void) => {
  const q = collection(db, "users", uid, "friends");
  return onSnapshot(q, (snapshot) => {
    const friends = snapshot.docs.map(doc => doc.data());
    callback(friends);
  });
};

// Chat
export const sendMessage = async (chatId: string, text: string, senderId: string) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    text,
    senderId,
    createdAt: serverTimestamp()
  });
  
  // Update last message metadata for sorting chat lists (optional for this simple app but good practice)
  await setDoc(doc(db, "chats", chatId), {
    lastMessage: text,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc"),
    limit(100)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
    callback(messages);
  });
};

// Helper to get current user profile details
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const d = await getDoc(doc(db, "users", uid));
  return d.exists() ? d.data() as UserProfile : null;
};