import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithRedirect, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user data from firestore
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Migration: if user has old 'credits' but no 'clases' object
          if (data.credits !== undefined && !data.clases) {
            const updatedUser = {
              ...data,
              clases: {
                todas: data.credits,
                crossfit: 0,
                hyrox: 0,
                personalizado: 0
              },
              vencimiento: data.vencimiento || null
            };
            delete updatedUser.credits;
            await setDoc(docRef, updatedUser);
            setUserData(updatedUser);
          } else {
            setUserData({ ...data, vencimiento: data.vencimiento || null });
          }
        } else {
          // Si no existe, lo creamos como 'pending'
          const newUser = {
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            status: 'pending',
            role: 'athlete',
            clases: {
              todas: 0,
              crossfit: 0,
              hyrox: 0,
              personalizado: 0
            },
            vencimiento: null,
            exp: 0,
            level: 1,
            activeIcon: 'newbie',
            unlockedIcons: ['newbie'],
            createdAt: new Date().toISOString()
          };
          await setDoc(docRef, newUser);
          setUserData(newUser);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithRedirect(auth, provider);
  };

  const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  }

  const registerWithEmail = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  const logout = () => signOut(auth);

  const value = {
    currentUser,
    userData,
    loading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
