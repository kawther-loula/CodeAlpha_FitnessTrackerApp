export interface AchievementDef {
    key: string;
    label: string;
    icon: string;
    description: string;
  }
  
  export const ACHIEVEMENT_DEFS: AchievementDef[] = [
    { key: 'first_workout', label: 'First Workout', icon: '🏅', description: 'Log ta première activité' },
    { key: 'streak_7', label: '7 Day Streak', icon: '🔥', description: 'Reste actif 7 jours de suite' },
    { key: 'steps_10k', label: '10k Steps', icon: '🚶', description: 'Atteins 10 000 pas en une journée' },
    { key: 'goal_completed', label: 'Goal Completed', icon: '💯', description: 'Atteins 100% de ton objectif du jour' },
    { key: 'weekly_5_workouts', label: '5 Séances/Semaine', icon: '🏆', description: 'Complète 5 séances cette semaine' },
    { key: 'weekly_50k_steps', label: '50k Pas/Semaine', icon: '🚀', description: 'Marche 50 000 pas cumulés cette semaine' },
  ];