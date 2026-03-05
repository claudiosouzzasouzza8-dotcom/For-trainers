import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { UserProfile, Exercise } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { motion, AnimatePresence } from 'motion/react';
import { generateExerciseImage } from './lib/gemini';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Seed initial exercises if empty
  useEffect(() => {
    const seedData = async () => {
      const exercisesSnap = await getDocs(collection(db, 'exercises'));
      if (exercisesSnap.empty) {
        const initialExercises = [
          {
            name: "Agachamento Livre",
            description: "Exercício fundamental para membros inferiores.",
            muscleGroup: "Quadríceps/Glúteos",
            steps: [
              "Pés na largura dos ombros",
              "Mantenha as costas retas",
              "Desça como se fosse sentar em uma cadeira",
              "Suba empurrando pelo calcanhar"
            ],
            imagePrompt: "man performing barbell back squat in a gym"
          },
          {
            name: "Supino Reto",
            description: "Clássico para desenvolvimento de peitoral.",
            muscleGroup: "Peitoral",
            steps: [
              "Deite no banco com os pés firmes no chão",
              "Segure a barra um pouco além da largura dos ombros",
              "Desça a barra até o meio do peito",
              "Empurre para cima estendendo os braços"
            ],
            imagePrompt: "man performing bench press in a gym"
          },
          {
            name: "Levantamento Terra",
            description: "Exercício composto para toda a cadeia posterior.",
            muscleGroup: "Costas/Pernas",
            steps: [
              "Pés na largura do quadril",
              "Segure a barra com as mãos por fora das pernas",
              "Mantenha a coluna neutra",
              "Suba estendendo quadril e joelhos simultaneamente"
            ],
            imagePrompt: "man performing deadlift in a gym"
          }
        ];

        for (const ex of initialExercises) {
          const imageUrl = await generateExerciseImage(ex.imagePrompt);
          const exRef = doc(collection(db, 'exercises'));
          await setDoc(exRef, { ...ex, imageUrl });
        }

        // Create a sample workout
        const exercises = await getDocs(collection(db, 'exercises'));
        const exList = exercises.docs.map(d => d.id);
        
        if (exList.length > 0) {
          const workoutRef = doc(collection(db, 'workouts'));
          await setDoc(workoutRef, {
            title: "Treino de Força A",
            creatorId: "system",
            createdAt: new Date().toISOString(),
            exercises: exList.map(id => ({
              exerciseId: id,
              sets: 3,
              reps: 10,
              restSeconds: 60
            }))
          });
        }
      }
    };

    if (user && user.role === 'coach') {
      seedData();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full"
        />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <Auth key="auth" onAuthComplete={setUser} />
      ) : (
        <Dashboard key="dashboard" user={user} onLogout={handleLogout} />
      )}
    </AnimatePresence>
  );
}
