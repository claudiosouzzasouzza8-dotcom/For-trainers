export type Role = 'coach' | 'athlete';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: Role;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  steps: string[];
  muscleGroup: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  restSeconds: number;
  exercise?: Exercise; // Populated client-side
}

export interface Workout {
  id: string;
  title: string;
  creatorId: string;
  exercises: WorkoutExercise[];
  createdAt: string;
}

export interface WorkoutPlan {
  id: string;
  athleteId: string;
  coachId: string;
  startDate: string;
  endDate: string;
  schedule: Record<string, string>; // date (YYYY-MM-DD) -> workoutId
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
