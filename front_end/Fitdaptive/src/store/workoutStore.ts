import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Workout = {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  date: string;
};

type WorkoutState = {
  workouts: Workout[];
  history: Workout[];
  addWorkout: (workout: Workout) => void;
  completeWorkout: (id: string) => void;
  clearHistory: () => void;
};

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      workouts: [],
      history: [],
      
      addWorkout: (workout) => {
        set((state) => ({workouts: [...state.workouts, workout]}));
      },
      
      completeWorkout: (id) => {
        set((state) => {
          const workout = state.workouts.find((w) => w.id === id);
          if (!workout) return state;
          return {
            workouts: state.workouts.filter((w) => w.id !== id),
            history: [...state.history, {...workout, date: new Date().toISOString()}],
          };
        });
      },
      
      clearHistory: () => {
        set({history: []});
      },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
