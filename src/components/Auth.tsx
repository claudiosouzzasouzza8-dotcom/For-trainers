import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Role, UserProfile } from '../types';
import { Dumbbell, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onAuthComplete: (user: UserProfile) => void;
}

export default function Auth({ onAuthComplete }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>('athlete');

  const handleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        onAuthComplete(userDoc.data() as UserProfile);
      } else {
        const newUser: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || 'User',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          role: role,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
        onAuthComplete(newUser);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-8 space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 text-white mb-4">
            <Dumbbell size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FitAI Coach</h1>
          <p className="text-zinc-500">Seu personal trainer inteligente</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-zinc-700">Eu sou um:</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setRole('athlete')}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                role === 'athlete' 
                ? 'border-zinc-900 bg-zinc-900 text-white' 
                : 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-200'
              }`}
            >
              <span className="block font-semibold">Atleta</span>
              <span className="text-xs opacity-70">Quero treinar</span>
            </button>
            <button
              onClick={() => setRole('coach')}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                role === 'coach' 
                ? 'border-zinc-900 bg-zinc-900 text-white' 
                : 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-200'
              }`}
            >
              <span className="block font-semibold">Coach</span>
              <span className="text-xs opacity-70">Quero prescrever</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <LogIn size={20} />
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>

        <p className="text-center text-xs text-zinc-400">
          Ao entrar, você concorda com nossos termos de uso.
        </p>
      </motion.div>
    </div>
  );
}
