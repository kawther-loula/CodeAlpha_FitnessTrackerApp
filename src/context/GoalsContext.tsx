import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { getGoals, Goals, setGoals as persistGoals } from '../db/database';

type GoalsContextValue = {
  goals: Goals;
  saveGoals: (goals: Goals) => void;
  refreshGoals: () => void;
};

const GoalsContext = createContext<GoalsContextValue | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoalsState] = useState<Goals>(() => getGoals());

  const refreshGoals = useCallback(() => {
    setGoalsState(getGoals());
  }, []);

  const saveGoals = useCallback((nextGoals: Goals) => {
    persistGoals(nextGoals);
    setGoalsState(getGoals());
  }, []);

  const value = useMemo(
    () => ({
      goals,
      saveGoals,
      refreshGoals,
    }),
    [goals, refreshGoals, saveGoals]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const context = useContext(GoalsContext);

  if (!context) {
    throw new Error('useGoals must be used inside GoalsProvider');
  }

  return context;
}
