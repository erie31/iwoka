import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithRedirect, signInWithPopup, getRedirectResult, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const initializingRef = React.useRef(false);

  useEffect(() => {
    // 1. Iniciar el observador de estado inmediatamente para restaurar cualquier sesión previa
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        
        // Use onSnapshot for real-time updates
        const unsubSnapshot = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Migration logic
            if (data.credits !== undefined && !data.clases) {
              const updatedUser = {
                ...data,
                clases: { todas: data.credits, crossfit: 0, hyrox: 0, personalizado: 0 },
                vencimiento: data.vencimiento || null
              };
              delete updatedUser.credits;
              await setDoc(docRef, updatedUser);
              setUserData(updatedUser);
            } else {
              setUserData({ ...data, id: docSnap.id, vencimiento: data.vencimiento || null });
            }
          } else {
            // New user setup
            const newUser = {
              name: user.displayName || user.email.split('@')[0],
              email: user.email,
              status: 'pending',
              role: 'athlete',
              clases: { todas: 0, crossfit: 0, hyrox: 0, personalizado: 0 },
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
          setLoading(false);
        }, (err) => {
          console.error("Firestore snapshot error:", err);
          setAuthError(`Error de sincronización: ${err.message}`);
          setLoading(false);
        });

        // Store snapshot unsubscriber to clean up when auth changes or component unmounts
        return () => unsubSnapshot();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    // 2. Manejar el resultado de redirección (si venimos de Google) en paralelo
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Acceso mediante redirección exitoso:", result.user.email);
        }
      } catch (redirectError) {
        console.error("Error en redirección:", redirectError.code, redirectError.message);
        // Algunos navegadores bloquean el flujo de redirección por cookies de terceros
        if (redirectError.code === 'auth/credential-already-in-use') {
          setAuthError("La cuenta ya está vinculada a otro usuario.");
        } else {
          setAuthError(`Problema de conexión con Google: ${redirectError.message}`);
        }
      }
    };

    handleRedirect();

    // 3. Limpieza: Asegurar que el observador se desconecta al desmontar
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      return await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Popup Error:", error.code, error.message);
      if (error.code === 'auth/popup-blocked') {
        throw new Error("El navegador bloqueó la ventana emergente. Por favor, habilita los popups e intenta de nuevo.");
      }
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const registerWithEmail = async (email, password) => {
    setAuthError(null);
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const logout = () => {
    setAuthError(null);
    return signOut(auth);
  };

  const value = {
    currentUser,
    userData,
    loading,
    authError,
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
