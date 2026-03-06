import React, {createContext, useContext, useState} from 'react';

type Challenge = {
  id: string;
  title: string;
  duration: string;
  participants: number;
  status: string;
  progress?: number;
  total?: number;
};

type ChallengeContextType = {
  challenges: Challenge[];
  updateProgress: (id: string, progress: number) => void;
};

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

export const ChallengeProvider = ({children}: {children: React.ReactNode}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([
    {id: '1', title: '30 Day Push-up Challenge', duration: '30 days', participants: 45, status: 'Active', progress: 15, total: 30},
    {id: '2', title: '7 Day Cardio Challenge', duration: '7 days', participants: 32, status: 'Active', progress: 3, total: 7},
  ]);

  const updateProgress = (id: string, progress: number) => {
    setChallenges(prev =>
      prev.map(c => (c.id === id ? {...c, progress} : c))
    );
  };

  return (
    <ChallengeContext.Provider value={{challenges, updateProgress}}>
      {children}
    </ChallengeContext.Provider>
  );
};

export const useChallenges = () => {
  const context = useContext(ChallengeContext);
  if (!context) throw new Error('useChallenges must be used within ChallengeProvider');
  return context;
};
