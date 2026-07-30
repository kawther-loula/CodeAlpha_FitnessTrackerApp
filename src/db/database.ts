import * as SQLite from 'expo-sqlite';
import { Activity } from '../types';

export const db = SQLite.openDatabaseSync('fitness.db');

export type Goals = {
  steps: number;
  calories: number;
  waterMl: number;
  workoutMinutes: number;
};

const goalListeners = new Set<(goals: Goals) => void>();

export function subscribeToGoals(listener: (goals: Goals) => void) {
  goalListeners.add(listener);

  return () => {
    goalListeners.delete(listener);
  };
}

export function initDatabase() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      duration INTEGER NOT NULL,
      distance REAL,
      calories INTEGER NOT NULL,
      notes TEXT,
      date TEXT NOT NULL,
      isFavorite INTEGER NOT NULL DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      steps INTEGER NOT NULL,
      calories INTEGER NOT NULL,
      waterMl REAL NOT NULL,
      workoutMinutes INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS waterLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amountMl REAL NOT NULL,
      date TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      weight REAL NOT NULL,
      height REAL NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      achievement_key TEXT NOT NULL,
      unlockedAt TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS dailySteps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      steps INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS weightLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight REAL NOT NULL,
      date TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS favoriteWorkouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      duration INTEGER NOT NULL,
      distance REAL,
      calories INTEGER NOT NULL,
      notes TEXT
    );`
  ];

  for (const tableSql of tables) {
    try {
      db.execSync(tableSql);
    } catch (e) {
      console.error(`Error creating table: ${e}`);
    }
  }
}

// Initialize database immediately
initDatabase();

export function addActivity(activity: Omit<Activity, 'id'>) {
  db.runSync(
    `INSERT INTO activities (type, duration, distance, calories, notes, date, isFavorite) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      activity.type,
      activity.duration,
      activity.distance ?? null,
      activity.calories,
      activity.notes ?? null,
      activity.date,
      activity.isFavorite ? 1 : 0,
    ]
  );
}

export function toggleActivityFavorite(id: number, isFavorite: boolean) {
  db.runSync(`UPDATE activities SET isFavorite = ? WHERE id = ?;`, [isFavorite ? 1 : 0, id]);
}

export function getAllActivities(): Activity[] {
  const result = db.getAllSync(`SELECT * FROM activities ORDER BY isFavorite DESC, date DESC;`) as (Activity & { isFavorite: number })[]
  return result.map((r) => ({ ...r, isFavorite: r.isFavorite === 1 }));
}

export function updateActivity(id: number, activity: Omit<Activity, 'id'>) {
  db.runSync(
    `UPDATE activities SET type = ?, duration = ?, distance = ?, calories = ?, notes = ?, date = ? WHERE id = ?;`,
    [
      activity.type,
      activity.duration,
      activity.distance ?? null,
      activity.calories,
      activity.notes ?? null,
      activity.date,
      id
    ]
  );
}

export function deleteActivity(id: number) {
  db.runSync(`DELETE FROM activities WHERE id = ?;`, [id]);
}

export function setTodaySteps(steps: number) {
  const today = new Date().toISOString().slice(0, 10);
  db.runSync(
    `INSERT OR REPLACE INTO dailySteps (date, steps) VALUES (?, ?);`,
    [today, steps]
  );
}

export function getTodaySteps(): number {
  const today = new Date().toISOString().slice(0, 10);
  const result = db.getFirstSync(
    `SELECT steps FROM dailySteps WHERE date = ?;`,
    [today]
  ) as { steps: number } | null;

  return result ? result.steps : 0;
}

export function getTodayActivityStats(): { totalCalories: number; totalDuration: number } {
  const today = new Date().toISOString().slice(0, 10);
  const result = db.getFirstSync(
    `SELECT SUM(calories) as totalCalories, SUM(duration) as totalDuration
     FROM activities
     WHERE date = ?;`,
    [today]
  ) as { totalCalories: number | null; totalDuration: number | null } | null;

  return {
    totalCalories: result?.totalCalories ?? 0,
    totalDuration: result?.totalDuration ?? 0,
  };
}

// ---------- WATER ----------
export function addWaterLog(amountMl: number) {
  const today = new Date().toISOString().slice(0, 10);
  db.runSync(
    `INSERT INTO waterLogs (amountMl, date) VALUES (?, ?);`,
    [amountMl, today]
  );
}

export function getTodayWater(): number {
  const today = new Date().toISOString().slice(0, 10);
  const result = db.getFirstSync(
    `SELECT SUM(amountMl) as total FROM waterLogs WHERE date = ?;`,
    [today]
  ) as { total: number | null } | null;

  return result?.total ?? 0;
}

// ---------- GOALS ----------
export function setGoals(goals: Goals) {
  db.runSync(
    `INSERT OR REPLACE INTO goals (id, steps, calories, waterMl, workoutMinutes) VALUES (1, ?, ?, ?, ?);`,
    [goals.steps, goals.calories, goals.waterMl, goals.workoutMinutes]
  );

  goalListeners.forEach((listener) => listener(goals));
}

export function getGoals(): Goals {
  try {
    const result = db.getFirstSync(`SELECT * FROM goals WHERE id = 1;`) as
      | Goals
      | null;

    return result ?? { steps: 10000, calories: 2000, waterMl: 2000, workoutMinutes: 60 };
  } catch (e) {
    console.error(`Error fetching goals: ${e}`);
    return { steps: 10000, calories: 2000, waterMl: 2000, workoutMinutes: 60 };
  }
}

// ---------- STREAK ----------
export function getActiveStreak(): number {
  const rows = db.getAllSync(
    `SELECT DISTINCT date FROM activities ORDER BY date DESC;`
  ) as { date: string }[];

  if (rows.length === 0) return 0;

  let streak = 0;
  let cursor = new Date();

  for (const row of rows) {
    const cursorStr = cursor.toISOString().slice(0, 10);
    if (row.date === cursorStr) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function saveProfile(profile: { name: string; weight: number; height: number; age: number; gender: string }) {
  db.runSync(
    `INSERT OR REPLACE INTO profile (id, name, weight, height, age, gender) VALUES (1, ?, ?, ?, ?, ?);`,
    [profile.name, profile.weight, profile.height, profile.age, profile.gender]
  );
}

export function getProfile() {
  try {
    const result = db.getFirstSync(`SELECT * FROM profile WHERE id = 1;`) as
      | { name: string; weight: number; height: number; age: number; gender: string }
      | null;

    return result ?? { name: '', weight: 70, height: 170, age: 25, gender: 'other' };
  } catch (e) {
    return { name: '', weight: 70, height: 170, age: 25, gender: 'other' };
  }
}

export function getLast7DaysCalories(): { date: string; calories: number }[] {
  const days: { date: string; calories: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const result = db.getFirstSync(
      `SELECT SUM(calories) as total FROM activities WHERE date = ?;`,
      [dateStr]
    ) as { total: number | null } | null;
    days.push({ date: dateStr, calories: result?.total ?? 0 });
  }
  return days;
}

export function getLast7DaysSteps(): { date: string; steps: number }[] {
  const days: { date: string; steps: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const result = db.getFirstSync(
      `SELECT steps FROM dailySteps WHERE date = ?;`,
      [dateStr]
    ) as { steps: number } | null;
    days.push({ date: dateStr, steps: result?.steps ?? 0 });
  }
  return days;
}

export function getActivityTypeBreakdown(): { type: string; totalMinutes: number }[] {
  const result = db.getAllSync(
    `SELECT type, SUM(duration) as totalMinutes FROM activities GROUP BY type;`
  ) as { type: string; totalMinutes: number }[];
  return result;
}

export function getUnlockedAchievements(): string[] {
  const rows = db.getAllSync(`SELECT achievement_key FROM achievements;`) as { achievement_key: string }[];
  return rows.map((r) => r.achievement_key);
}

export function unlockAchievement(key: string) {
  const exists = db.getFirstSync(`SELECT id FROM achievements WHERE achievement_key = ?;`, [key]);
  if (!exists) {
    db.runSync(`INSERT INTO achievements (achievement_key, unlockedAt) VALUES (?, ?);`, [key, new Date().toISOString()]);
  }
}

export function syncAchievements(achievementKeys: string[]) {
  achievementKeys.forEach(unlockAchievement);
}

export function getUnlockedAchievementKeys(): string[] {
  const rows = db.getAllSync(
    `SELECT achievement_key FROM achievements WHERE unlockedAt IS NOT NULL;`
  ) as { achievement_key: string }[];
  return rows.map((row) => row.achievement_key);
}

export function checkAndUnlockAchievements() {
  const totalActivities = (db.getFirstSync(`SELECT COUNT(*) as count FROM activities;`) as { count: number }).count;
  if (totalActivities >= 1) unlockAchievement('first_workout');

  const streak = getActiveStreak();
  if (streak >= 7) unlockAchievement('streak_7');

  const steps = getTodaySteps();
  if (steps >= 10000) unlockAchievement('steps_10k');

  const goals = getGoals();
  const stats = getTodayActivityStats();
  const percent = Math.min(
    100,
    Math.round(
      ((steps / goals.steps) * 0.34 +
        (stats.totalCalories / goals.calories) * 0.33 +
        (stats.totalDuration / goals.workoutMinutes) * 0.33) *
        100
    )
  );
  if (percent >= 100) unlockAchievement('goal_completed');
  
  const weekly = getWeeklyStats();
  if (weekly.totalWorkouts >= 5) unlockAchievement('weekly_5_workouts');

  const weekSteps = getLast7DaysSteps().reduce((sum, d) => sum + d.steps, 0);
  if (weekSteps >= 50000) unlockAchievement('weekly_50k_steps');
}

export function getWeeklyStats() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  const result = db.getFirstSync(
    `SELECT COUNT(*) as totalWorkouts, SUM(calories) as totalCalories, SUM(duration) as totalDuration, AVG(duration) as avgDuration
     FROM activities WHERE date >= ?;`,
    [weekAgoStr]
  ) as { totalWorkouts: number; totalCalories: number | null; totalDuration: number | null; avgDuration: number | null };

  const mostPracticed = db.getFirstSync(
    `SELECT type, COUNT(*) as count FROM activities WHERE date >= ? GROUP BY type ORDER BY count DESC LIMIT 1;`,
    [weekAgoStr]
  ) as { type: string; count: number } | null;

  return {
    totalWorkouts: result.totalWorkouts ?? 0,
    totalCalories: result.totalCalories ?? 0,
    totalDuration: result.totalDuration ?? 0,
    avgDuration: Math.round(result.avgDuration ?? 0),
    mostPracticed: mostPracticed?.type ?? '—',
  };
}

export function getMonthlyStats() {
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 29);
  const monthAgoStr = monthAgo.toISOString().slice(0, 10);

  const result = db.getFirstSync(
    `SELECT COUNT(*) as totalWorkouts, SUM(calories) as totalCalories, SUM(duration) as totalDuration, AVG(duration) as avgDuration
     FROM activities WHERE date >= ?;`,
    [monthAgoStr]
  ) as { totalWorkouts: number; totalCalories: number | null; totalDuration: number | null; avgDuration: number | null };

  const mostPracticed = db.getFirstSync(
    `SELECT type, COUNT(*) as count FROM activities WHERE date >= ? GROUP BY type ORDER BY count DESC LIMIT 1;`,
    [monthAgoStr]
  ) as { type: string; count: number } | null;

  return {
    totalWorkouts: result.totalWorkouts ?? 0,
    totalCalories: result.totalCalories ?? 0,
    totalDuration: result.totalDuration ?? 0,
    avgDuration: Math.round(result.avgDuration ?? 0),
    mostPracticed: mostPracticed?.type ?? '—',
  };
}

export function getLongestStreak(): number {
  const rows = db.getAllSync(`SELECT DISTINCT date FROM activities ORDER BY date ASC;`) as { date: string }[];
  if (rows.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1].date + 'T00:00:00');
    const curr = new Date(rows[i].date + 'T00:00:00');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

export function addWeightLog(weight: number) {
  const today = new Date().toISOString().slice(0, 10);
  db.runSync(`INSERT INTO weightLogs (weight, date) VALUES (?, ?);`, [weight, today]);
}

export function getWeightHistory(limit: number = 10): { weight: number; date: string }[] {
  const result = db.getAllSync(
    `SELECT weight, date FROM weightLogs ORDER BY date ASC LIMIT ?;`,
    [limit]
  ) as { weight: number; date: string }[];
  return result;
}

export function addFavorite(fav: { label: string; type: string; duration: number; distance?: number; calories: number; notes?: string }) {
  db.runSync(
    `INSERT INTO favoriteWorkouts (label, type, duration, distance, calories, notes) VALUES (?, ?, ?, ?, ?, ?);`,
    [fav.label, fav.type, fav.duration, fav.distance ?? null, fav.calories, fav.notes ?? null]
  );
}

export function getFavorites() {
  return db.getAllSync(`SELECT * FROM favoriteWorkouts ORDER BY id DESC;`) as {
    id: number; label: string; type: string; duration: number; distance: number | null; calories: number; notes: string | null;
  }[];
}

export function deleteFavorite(id: number) {
  db.runSync(`DELETE FROM favoriteWorkouts WHERE id = ?;`, [id]);
}
