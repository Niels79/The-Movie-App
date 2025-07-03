// FILE: src/context/AuthContext.tsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signOut, type User, GoogleAuthProvider, signInWithCredential, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export interface Movie { id: number; title: string; rating: string; poster: string; genre: string; overview: string; }
export interface SeenMovie { movie: Movie; userRating: number; }
export interface UserPreferences { imdbScore: number; genres: string[]; backgroundColor: string; }
export interface UserData {
    preferences: UserPreferences;
    watchlist: Movie[];
    seenList: SeenMovie[];
    notInterestedList: Movie[];
}

interface AuthContextType {
  user: User | null;
  userData: UserData;
  loading: boolean;
  notification: string;
  login: () => void;
  logout: () => void;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  showNotification: (message: string) => void;
}

const defaultUserData: UserData = {
    preferences: { imdbScore: 7.0, genres: [], backgroundColor: 'bg-gray-900' },
    watchlist: [],
    seenList: [],
    notInterestedList: []
};

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext)!;

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    // This is the single, most reliable listener for auth changes.
    // It fires on page load, after a redirect, and on sign-in/sign-out.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed, user:", currentUser ? currentUser.uid : null);
      setUser(currentUser);
      if (!currentUser) {
        // If no user, we can stop loading immediately.
        setLoading(false);
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // This effect syncs user data from Firestore ONLY when the user object is available.
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        } else {
          setDoc(userDocRef, defaultUserData);
        }
        // We stop loading only after we have the user's data.
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const login = async () => {
    console.log("Login function called. Platform:", Capacitor.getPlatform());
    setLoading(true);
    if (Capacitor.isNativePlatform()) {
      try {
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        await signInWithCredential(auth, credential);
      } catch (error) { 
        console.error("Native Google login fout:", error); 
        setLoading(false);
      }
    } else {
      try {
        console.log("Attempting web redirect...");
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } catch (error) { 
        console.error("Web Google login fout:", error); 
        setLoading(false);
      }
    }
  };

  const logout = async () => {
    try {
      if (Capacitor.isNativePlatform()) { await GoogleAuth.signOut(); }
      await signOut(auth);
    } catch (error) { console.error("Fout bij uitloggen:", error); }
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, data, { merge: true });
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };
  
  const value = { user, userData, loading, login, logout, updateUserData, notification, showNotification };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};