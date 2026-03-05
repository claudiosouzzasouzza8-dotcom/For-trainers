import React, { useState, useEffect } from 'react';
import { UserProfile, Workout, WorkoutPlan, Exercise } from '../types';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Calendar, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Play, 
  ChevronRight,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import WorkoutSession from './WorkoutSession';
import AIChat from './AIChat';
import { format, startOfWeek, addDays, isSameDay, addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'workouts' | 'planner' | 'athletes'>('home');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for workouts
    const workoutsQuery = user.role === 'coach' 
      ? query(collection(db, 'workouts'), where('creatorId', '==', user.uid))
      : collection(db, 'workouts'); // Athletes see all for now or we filter by plan

    const unsubWorkouts = onSnapshot(workoutsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workout));
      setWorkouts(data);
      setLoading(false);
    });

    // Listen for plans
    const plansQuery = user.role === 'coach'
      ? query(collection(db, 'plans'), where('coachId', '==', user.uid))
      : query(collection(db, 'plans'), where('athleteId', '==', user.uid));

    const unsubPlans = onSnapshot(plansQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutPlan));
      setPlans(data);
    });

    // Listen for exercises
    const unsubExercises = onSnapshot(collection(db, 'exercises'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
      setExercises(data);
    });

    return () => {
      unsubWorkouts();
      unsubPlans();
      unsubExercises();
    };
  }, [user]);

  const handleStartWorkout = async (workout: Workout) => {
    // Populate exercises with full data
    const populatedExercises = await Promise.all(workout.exercises.map(async (we) => {
      const exDoc = await getDoc(doc(db, 'exercises', we.exerciseId));
      return { ...we, exercise: { id: exDoc.id, ...exDoc.data() } as Exercise };
    }));
    setActiveWorkout({ ...workout, exercises: populatedExercises });
  };

  if (activeWorkout) {
    return (
      <div className="min-h-screen bg-zinc-50 pt-12">
        <button 
          onClick={() => setActiveWorkout(null)}
          className="fixed top-6 left-6 btn-secondary z-50"
        >
          Sair do Treino
        </button>
        <WorkoutSession 
          workout={activeWorkout} 
          onComplete={() => setActiveWorkout(null)} 
        />
        <AIChat />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
            <Dumbbell size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">FitAI</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <NavItem 
            active={activeTab === 'workouts'} 
            onClick={() => setActiveTab('workouts')}
            icon={<Dumbbell size={20} />}
            label="Meus Treinos"
          />
          <NavItem 
            active={activeTab === 'planner'} 
            onClick={() => setActiveTab('planner')}
            icon={<Calendar size={20} />}
            label="Planejamento"
          />
          {user.role === 'coach' && (
            <NavItem 
              active={activeTab === 'athletes'} 
              onClick={() => setActiveTab('athletes')}
              icon={<Users size={20} />}
              label="Atletas"
            />
          )}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 mb-4">
            <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold">
                  {user.displayName[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.displayName}</p>
              <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-3 text-zinc-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {activeTab === 'home' && `Bem-vindo, ${user.displayName.split(' ')[0]}!`}
              {activeTab === 'workouts' && 'Meus Treinos'}
              {activeTab === 'planner' && 'Planejamento'}
              {activeTab === 'athletes' && 'Meus Atletas'}
            </h1>
            <p className="text-zinc-500">
              {activeTab === 'home' && 'Aqui está o resumo do seu progresso.'}
              {activeTab === 'workouts' && 'Gerencie seus modelos de treino.'}
              {activeTab === 'planner' && 'Organize sua semana de treinos.'}
              {activeTab === 'athletes' && 'Acompanhe e prescreva para seus atletas.'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
              />
            </div>
            {user.role === 'coach' && (
              <button className="btn-primary flex items-center gap-2 py-2">
                <Plus size={18} />
                Novo Treino
              </button>
            )}
          </div>
        </header>

        <div className="space-y-8">
          {activeTab === 'home' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  label="Treinos Concluídos" 
                  value="12" 
                  icon={<CheckCircle2 className="text-emerald-500" />} 
                  trend="+2 esta semana"
                />
                <StatCard 
                  label="Tempo em Atividade" 
                  value="8.5h" 
                  icon={<Clock className="text-blue-500" />} 
                  trend="Meta: 10h"
                />
                <StatCard 
                  label="Próximo Treino" 
                  value="Pernas & Core" 
                  icon={<Calendar className="text-amber-500" />} 
                  trend="Amanhã, 08:00"
                />
              </div>

              {/* Recent Workouts */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Treinos Recentes</h2>
                  <button className="text-sm font-medium text-zinc-500 hover:text-zinc-900">Ver todos</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workouts.map(workout => (
                    <WorkoutCard 
                      key={workout.id} 
                      workout={workout} 
                      onStart={() => handleStartWorkout(workout)}
                    />
                  ))}
                  {workouts.length === 0 && (
                    <div className="col-span-full p-12 glass-card flex flex-col items-center justify-center text-center text-zinc-500">
                      <Dumbbell size={48} className="mb-4 opacity-20" />
                      <p>Nenhum treino encontrado.</p>
                      {user.role === 'coach' && <p className="text-sm">Crie seu primeiro treino para começar.</p>}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {activeTab === 'workouts' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workouts.map(workout => (
                  <WorkoutCard 
                    key={workout.id} 
                    workout={workout} 
                    onStart={() => handleStartWorkout(workout)}
                  />
                ))}
             </div>
          )}

          {activeTab === 'planner' && (
            <div className="glass-card p-6">
              <WorkoutPlanner plans={plans} workouts={workouts} user={user} />
            </div>
          )}
        </div>
      </main>

      <AIChat />
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
        active 
        ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20' 
        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-zinc-50">
          {icon}
        </div>
        <span className="text-xs font-medium text-zinc-400">{trend}</span>
      </div>
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function WorkoutCard({ workout, onStart }: { workout: Workout, onStart: () => void }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="glass-card overflow-hidden group"
    >
      <div className="h-32 bg-zinc-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <div className="absolute bottom-4 left-4 z-20">
          <h3 className="text-white font-bold">{workout.title}</h3>
          <p className="text-white/70 text-xs">{workout.exercises.length} exercícios</p>
        </div>
      </div>
      <div className="p-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1,2,3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-200" />
          ))}
        </div>
        <button 
          onClick={onStart}
          className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Play size={18} className="ml-0.5" />
        </button>
      </div>
    </motion.div>
  );
}

function WorkoutPlanner({ plans, workouts, user }: { plans: WorkoutPlan[], workouts: Workout[], user: UserProfile }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const days = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), 6)
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Semana de {format(days[0], 'dd MMM', { locale: ptBR })} - {format(days[6], 'dd MMM', { locale: ptBR })}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 hover:bg-zinc-100 rounded-lg"><ChevronRight className="rotate-180" size={20} /></button>
          <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 hover:bg-zinc-100 rounded-lg"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {days.map(day => {
          const plan = plans.find(p => p.schedule[format(day, 'yyyy-MM-dd')]);
          const workoutId = plan?.schedule[format(day, 'yyyy-MM-dd')];
          const workout = workouts.find(w => w.id === workoutId);

          return (
            <div key={day.toString()} className="space-y-2">
              <div className="text-center">
                <p className="text-xs font-bold text-zinc-400 uppercase">{format(day, 'EEE', { locale: ptBR })}</p>
                <p className={`text-sm font-bold w-8 h-8 flex items-center justify-center mx-auto rounded-full ${isSameDay(day, new Date()) ? 'bg-zinc-900 text-white' : ''}`}>
                  {format(day, 'dd')}
                </p>
              </div>
              <div className={`min-h-[100px] rounded-xl border-2 border-dashed p-2 flex flex-col items-center justify-center text-center ${workout ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100'}`}>
                {workout ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-zinc-400">Treino</p>
                    <p className="text-xs font-bold leading-tight">{workout.title}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-300">Descanso</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
