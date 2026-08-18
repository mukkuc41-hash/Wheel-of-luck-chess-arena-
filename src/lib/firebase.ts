import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth & Google Auth Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Firestore Database (with databaseId specified in config if custom)
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Helper function: Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Sync user profile snapshot to Firestore
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      const userData = {
        uid: user.uid,
        displayName: user.displayName || 'Google Player',
        email: user.email || '',
        photoURL: user.photoURL || '',
        lastLogin: new Date().toISOString(),
        ...(userSnap.exists() ? {} : {
          eloRating: 1200,
          totalWins: 0,
          totalGames: 0,
          createdAt: new Date().toISOString()
        })
      };

      await setDoc(userRef, userData, { merge: true });
    }
    
    return user;
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

// Helper function: Save User Game Data / Settings snapshot to Cloud
export const saveUserDataToCloud = async (uid: string, gameData: Record<string, any>) => {
  try {
    const userDocRef = doc(db, 'user_data', uid);
    await setDoc(userDocRef, {
      updatedAt: new Date().toISOString(),
      gameData
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving data to Cloud:", error);
    return false;
  }
};

// Helper function: Load User Game Data from Cloud
export const loadUserDataFromCloud = async (uid: string) => {
  try {
    const userDocRef = doc(db, 'user_data', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data().gameData;
    }
    return null;
  } catch (error) {
    console.error("Error loading cloud data:", error);
    return null;
  }
};

// Helper function: Create/Sync Private Room with Custom Rules & Notice in Firestore
export const createCloudPrivateRoom = async (roomData: {
  roomId: string;
  ownerId: string;
  ownerUsername: string;
  isPrivate: boolean;
  communityNotice: string;
  roomRules: {
    minimumRating: number;
    allowChat: boolean;
    maxPlayers: number;
  };
}) => {
  try {
    const roomRef = doc(db, 'rooms', roomData.roomId);
    await setDoc(roomRef, {
      ...roomData,
      createdAt: new Date().toISOString(),
      status: 'waiting',
    });
    return true;
  } catch (error) {
    console.error('Error creating cloud room in Firestore:', error);
    return false;
  }
};

// Helper function: Fetch Cloud Room from Firestore
export const getCloudRoom = async (roomId: string) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting cloud room from Firestore:', error);
    return null;
  }
};

// Helper function: Sign out
export const logOutGoogle = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

export { onAuthStateChanged, type User };
