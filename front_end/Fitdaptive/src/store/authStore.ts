import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'Member' | 'Trainer' | 'Admin';
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (email, password, role) => {
        const user = {
          id: '1',
          email,
          name: email.split('@')[0],
          role: role as 'Member' | 'Trainer' | 'Admin',
        };
        set({user, token: 'fake-token', isAuthenticated: true});
      },
      
      logout: () => {
        set({user: null, token: null, isAuthenticated: false});
      },
      
      updateProfile: (data) => {
        set((state) => ({
          user: state.user ? {...state.user, ...data} : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
