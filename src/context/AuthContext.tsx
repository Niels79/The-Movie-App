// FILE: src/context/AuthContext.tsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signOut, type User, GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
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
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        } else {
          setDoc(userDocRef, defaultUserData);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const login = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        await signInWithCredential(auth, credential);
      } catch (error) { console.error("Native Google login fout:", error); }
    } else {
      // Gebruik signInWithPopup voor de web-versie
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (error) { console.error("Web Google login fout:", error); }
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