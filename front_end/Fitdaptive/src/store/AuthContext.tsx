import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API, {apiClient, setApiToken} from '../services/api';
import {
  requestUserPermission,
  getFCMToken,
  onTokenRefresh,
  onForegroundMessage,
} from '../services/notificationService';
import {initializeSocket, disconnectSocket} from '../services/socketService';

type User = {
  id: number;
  email: string;
  role: string;
  name: string;
  goal?: string | null;
  height?: number;
  weight?: number;
  gender?: string;
  dob?: string;
  phone_number?: string | null;
  profession?: string | null;
  bio?: string | null;
  experience_years?: number | null;
  certification_status?: string;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
  role: string;
  phone_number?: string;
  height?: string;
  weight?: string;
  gender?: string;
  dob?: string;
  goal?: string | null;
  profession?: string;
  bio?: string | null;
  experience_years?: number;
  certification_url?: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  notifRefreshKey: number;
  triggerNotifRefresh: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [notifRefreshKey, setNotifRefreshKey] = useState(0);
  const triggerNotifRefresh = useCallback(
    () => setNotifRefreshKey(k => k + 1),
    [],
  );

  const registerFcmToken = async () => {
    try {
      const granted = await requestUserPermission();
      if (!granted) {
        return;
      }
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        await apiClient.post('/notification/update-token', {
          fcm_token: fcmToken,
        });
      }
    } catch (_) {}
  };

  // Restore session on app start
  useEffect(() => {
    AsyncStorage.multiGet(['@token', '@user']).then(
      ([tokenEntry, userEntry]) => {
        const savedToken = tokenEntry[1];
        const savedUser = userEntry[1] ? JSON.parse(userEntry[1]) : null;
        if (savedToken && savedUser) {
          console.log('[AUTH] JWT Token (restored):', savedToken);
          setToken(savedToken);
          setUser(savedUser);
          setApiToken(savedToken);
          registerFcmToken();
          initializeSocket(savedUser.id);
        }
      },
    );
  }, []);

  // Refresh FCM token when Firebase rotates it
  useEffect(() => {
    const unsubscribe = onTokenRefresh(async newToken => {
      try {
        await apiClient.post('/notification/update-token', {
          fcm_token: newToken,
        });
      } catch (_) {}
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onForegroundMessage(() => {
      triggerNotifRefresh();
    });

    return unsubscribe;
  }, [triggerNotifRefresh]);

  const login = async (email: string, password: string) => {
    const data = await API.login(email, password);
    console.log('[AUTH] JWT Token:', data.token);
    setToken(data.token);
    setUser(data.user);
    setApiToken(data.token);
    await AsyncStorage.multiSet([
      ['@token', data.token],
      ['@user', JSON.stringify(data.user)],
    ]);
    registerFcmToken();
    initializeSocket(data.user.id);
  };

  const register = async (registerData: RegisterData) => {
    const data = await API.register(registerData);
    setToken(data.token);
    setUser(data.user);
    setApiToken(data.token);
    await AsyncStorage.multiSet([
      ['@token', data.token],
      ['@user', JSON.stringify(data.user)],
    ]);
    registerFcmToken();
    initializeSocket(data.user.id);
  };

  const logout = async () => {
    try {
      await apiClient.post('/notification/update-token', {fcm_token: null});
    } catch (_) {}
    setUser(null);
    setToken(null);
    setApiToken(null);
    disconnectSocket();
    AsyncStorage.multiRemove(['@token', '@user']);
  };

  const updateUser = async (updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) {
        return prev;
      }
      const updated = {...prev, ...updates};
      AsyncStorage.setItem('@user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
        notifRefreshKey,
        triggerNotifRefresh,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
