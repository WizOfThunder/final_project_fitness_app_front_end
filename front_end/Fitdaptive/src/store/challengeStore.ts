import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Challenge = {
  id: string;
  title: string;
  duration: string;
  participants: number;
  status: 'Active' | 'Completed';
  description?: string;
  target?: string;
  progress?: number;
  total?: number;
};

type ChallengeState = {
  challenges: Challenge[];
  userChallenges: string[];
  addChallenge: (challenge: Challenge) => void;
  updateProgress: (id: string, progress: number) => void;
  joinChallenge: (id: string) => void;
  leaveChallenge: (id: string) => void;
};

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set) => ({
      challenges: [
        {id: '1', title: '30 Day Push-up Challenge', duration: '30 days', participants: 45, status: 'Active', progress: 15, total: 30},
        {id: '2', title: '7 Day Cardio Challenge', duration: '7 days', participants: 32, status: 'Active', progress: 3, total: 7},
      ],
      userChallenges: ['1'],
      
      addChallenge: (challenge) => {
        set((state) => ({challenges: [...state.challenges, challenge]}));
      },
      
      updateProgress: (id, progress) => {
        set((state) => ({
          challenges: state.challenges.map((c) =>
            c.id === id ? {...c, progress} : c
          ),
        }));
      },
      
      joinChallenge: (id) => {
        set((state) => ({
          userChallenges: [...state.userChallenges, id],
          challenges: state.challenges.map((c) =>
            c.id === id ? {...c, participants: c.participants + 1} : c
          ),
        }));
      },
      
      leaveChallenge: (id) => {
        set((state) => ({
          userChallenges: state.userChallenges.filter((cId) => cId !== id),
        }));
      },
    }),
    {
      name: 'challenge-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
