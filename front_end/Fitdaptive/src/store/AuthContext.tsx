import React, {createContext, useContext, useState} from 'react';

type User = {
  email: string;
  role: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string, role: string) => {
    setUser({email, role, name: email.split('@')[0]});
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{user, login, logout, isAuthenticated: !!user}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
