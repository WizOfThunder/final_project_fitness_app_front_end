import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Achievement = {
  id: string;
  title: string;
  description: string;
  date: string;
  unlocked: boolean;
};

type AchievementState = {
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  getUnlockedCount: () => number;
};

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: [
        {id: '1', title: 'First Workout', description: 'Complete your first workout', date: '2024-01-15', unlocked: true},
        {id: '2', title: '7 Day Streak', description: 'Workout 7 days in a row', date: '2024-01-20', unlocked: true},
        {id: '3', title: '100 Push-ups', description: 'Complete 100 push-ups', date: '', unlocked: false},
      ],
      
      unlockAchievement: (id) => {
        set((state) => ({
          achievements: state.achievements.map((a) =>
            a.id === id ? {...a, unlocked: true, date: new Date().toISOString()} : a
          ),
        }));
      },
      
      getUnlockedCount: () => {
        return get().achievements.filter((a) => a.unlocked).length;
      },
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
