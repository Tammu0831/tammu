export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  lowercaseUsername: string; // for searching
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromUsername: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Friend {
  uid: string;
  username: string;
  email: string;
  chatId: string; // The unique conversation ID between the two users
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any; // Firestore Timestamp
}