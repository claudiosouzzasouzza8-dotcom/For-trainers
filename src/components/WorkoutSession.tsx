import React, { useState, useEffect, useRef } from 'react';
import { Workout, WorkoutExercise, Exercise } from '../types';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, CheckCircle2, Info, Timer as TimerIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getExerciseExplanation } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';

interface WorkoutSessionProps {
  workout: Workout;
  onComplete: () => void;
}

export default function WorkoutSession({ workout, onComplete }: WorkoutSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  
  const currentExercise = workout.exercises[currentIndex];
  const exercise = currentExercise.exercise;

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      if (isResting) {
        setIsResting(false);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isResting]);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    setIsActive(true);
  };

  const handleNext = () => {
    if (currentIndex < workout.exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsResting(false);
      setIsActive(false);
      setExplanation(null);
    } else {
      onComplete();
    }
  };

  const handleRest = () => {
    setIsResting(true);
    startTimer(currentExercise.restSeconds);
  };

  const fetchExplanation = async () => {
    if (!exercise) return;
    setLoadingExplanation(true);
    const text = await getExerciseExplanation(exercise.name, exercise.description);
    setExplanation(text);
    setLoadingExplanation(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{workout.title}</h2>
        <div className="text-zinc-500 font-medium">
          Exercício {currentIndex + 1} de {workout.exercises.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exercise Card */}
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card overflow-hidden"
        >
          {exercise?.imageUrl ? (
            <img 
              src={exercise.imageUrl} 
              alt={exercise.name} 
              className="w-full aspect-square object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full aspect-square bg-zinc-100 flex items-center justify-center text-zinc-400">
              Sem imagem
            </div>
          )}
          
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-bold">{exercise?.name}</h3>
              <p className="text-zinc-500 text-sm">{exercise?.muscleGroup}</p>
            </div>

            <div className="flex gap-4">
              <div className="bg-zinc-100 px-4 py-2 rounded-lg">
                <span className="block text-xs text-zinc-500 uppercase font-bold">Séries</span>
                <span className="text-lg font-bold">{currentExercise.sets}</span>
              </div>
              <div className="bg-zinc-100 px-4 py-2 rounded-lg">
                <span className="block text-xs text-zinc-500 uppercase font-bold">Reps</span>
                <span className="text-lg font-bold">{currentExercise.reps}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-zinc-400">Passo a Passo</h4>
              <ul className="space-y-2">
                {exercise?.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={fetchExplanation}
              disabled={loadingExplanation}
              className="flex items-center gap-2 text-zinc-600 text-sm font-medium hover:text-zinc-900 transition-colors"
            >
              <Info size={16} />
              {loadingExplanation ? 'Carregando explicação...' : 'Explicação detalhada da IA'}
            </button>

            {explanation && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-brand-50 rounded-xl text-sm text-brand-700 border border-brand-100"
              >
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Timer & Controls */}
        <div className="space-y-6">
          <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-zinc-100"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="553"
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ 
                    strokeDashoffset: timeLeft > 0 ? (553 * (1 - timeLeft / (isResting ? currentExercise.restSeconds : 60))) : 0 
                  }}
                  className="text-zinc-900"
                />
              </svg>
              <div className="text-5xl font-mono font-bold">
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold">
                {isResting ? 'Descanso' : 'Em Execução'}
              </h3>
              <p className="text-zinc-500">
                {isResting ? 'Recupere o fôlego para a próxima série' : 'Mantenha a forma e o foco'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsActive(!isActive)}
                className="w-16 h-16 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
              </button>
              <button
                onClick={() => setTimeLeft(isResting ? currentExercise.restSeconds : 0)}
                className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            {!isResting && (
              <button
                onClick={handleRest}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <TimerIcon size={20} />
                Descansar
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {currentIndex === workout.exercises.length - 1 ? (
                <>
                  <CheckCircle2 size={20} />
                  Finalizar Treino
                </>
              ) : (
                <>
                  Próximo Exercício
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
