export type ActivityCategory = "walking" | "running" | "cycling" | "gym" | "swimming" | "yoga" | "hiit" | "custom";

export interface Activity {
  id: number;
  type: ActivityCategory;
  duration: number;
  distance?: number;
  calories: number;
  notes?: string;
  date: string;
  isFavorite?: boolean;
}
export interface Goals {
    steps: number;
    calories: number;
    waterMl: number;
    workoutMinutes: number;
}
export interface WaterLog {
    id: number;
    amountMl: number;
    date: string;
}
export type Gender = "male" | "female" | "other";
export interface Profile {
    name: string;
    weight: number;
    height: number;
    age: number;
    gender: Gender;
}
export interface Achievement {
    id: number;
    achievementKey: string;
    unlockedAt?: string;
}