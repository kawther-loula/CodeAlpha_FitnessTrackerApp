import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Animated, Easing, Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';
import {
  addWaterLog,
  getActiveStreak,
  getAllActivities,
  getGoals,
  getProfile,
  getTodayActivityStats,
  getTodaySteps,
  getTodayWater,
  getUnlockedAchievementKeys,
  syncAchievements,
} from '../db/database';
import { useGoals } from '../context/GoalsContext';
import { ACHIEVEMENT_DEFS } from '../utils/achievements';

export default function DashboardScreen() {
  const isDark = useColorScheme() === 'dark';
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [duration, setDuration] = useState(0);
  const [water, setWater] = useState(0);
  const [streak, setStreak] = useState(0);
  const [userName, setUserName] = useState('');
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const { goals, refreshGoals } = useGoals();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const safeRatio = (value: number, goal: number) => (goal > 0 ? value / goal : 0);

  const loadData = useCallback(() => {
    const nextSteps = getTodaySteps();
    const stats = getTodayActivityStats();
    const nextWater = getTodayWater();
    const nextStreak = getActiveStreak();
    const nextGoals = getGoals();
    const activities = getAllActivities();
    const profile = getProfile();

    const nextStepsPct = Math.min(100, Math.round(safeRatio(nextSteps, nextGoals.steps) * 100));
    const nextCalPct = Math.min(100, Math.round(safeRatio(stats.totalCalories, nextGoals.calories) * 100));
    const nextDurPct = Math.min(100, Math.round(safeRatio(stats.totalDuration, nextGoals.workoutMinutes) * 100));
    const nextWaterPct = Math.min(100, Math.round(safeRatio(nextWater, nextGoals.waterMl) * 100));
    const nextGoalPercent = Math.min(
      100,
      Math.round((nextStepsPct + nextCalPct + nextDurPct + nextWaterPct) / 4)
    );

    const earnedAchievementKeys = [
      activities.length > 0 ? 'first_workout' : null,
      nextStreak >= 7 ? 'streak_7' : null,
      nextSteps >= 10000 ? 'steps_10k' : null,
      nextGoalPercent >= 100 ? 'goal_completed' : null,
    ].filter((key): key is string => Boolean(key));

    syncAchievements(earnedAchievementKeys);
    setSteps(nextSteps);
    setCalories(stats.totalCalories);
    setDuration(stats.totalDuration);
    setWater(nextWater);
    setStreak(nextStreak);
    setUserName(profile.name);
    setUnlockedAchievements(getUnlockedAchievementKeys());
    refreshGoals();
  }, [refreshGoals]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 12,
        bounciness: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [fadeAnim, pulseAnim, slideAnim]);

  const handleAddWater = (amount: number) => {
    addWaterLog(amount);
    loadData();
  };

  const stepsPct = Math.min(100, Math.round(safeRatio(steps, goals.steps) * 100));
  const calPct = Math.min(100, Math.round(safeRatio(calories, goals.calories) * 100));
  const durPct = Math.min(100, Math.round(safeRatio(duration, goals.workoutMinutes) * 100));
  const waterPct = Math.min(100, Math.round(safeRatio(water, goals.waterMl) * 100));
  const goalPercent = Math.min(100, Math.round((stepsPct + calPct + durPct + waterPct) / 4));

  const animatedStyle = { opacity: fadeAnim, transform: [{ translateY: slideAnim }] };

  const screenBg = isDark ? '#0d1117' : '#f4f6fb';
  const cardBg = isDark ? '#1a1f2e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1a202c';
  const mutedText = isDark ? '#9ca3af' : '#64748b';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: screenBg }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 64 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Banner */}
      <Animated.View style={animatedStyle}>
        <View
          style={{
            backgroundColor: isDark ? '#1a1f2e' : '#6C63FF',
            borderRadius: 24,
            padding: 20,
            marginBottom: 16,
            shadowColor: '#6C63FF',
            shadowOpacity: 0.3,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
            Fitness Tracker Pro
          </Text>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 }}>
            Bonjour {userName ? userName : ''} 👋
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 13, textTransform: 'capitalize' }}>
            {formattedDate}
          </Text>
        </View>
      </Animated.View>

      {/* Streak & Global Goal Cards */}
      <Animated.View style={animatedStyle}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: cardBg,
              borderRadius: 20,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#FF6B6B',
              shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: mutedText, letterSpacing: 1, textTransform: 'uppercase' }}>Streak</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#FF6B6B', marginTop: 4 }}>🔥 {streak}j</Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: cardBg,
              borderRadius: 20,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#10B981',
              shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: mutedText, letterSpacing: 1, textTransform: 'uppercase' }}>Objectif Global</Text>
            <Animated.Text style={{ transform: [{ scale: pulseAnim }], fontSize: 24, fontWeight: '800', color: '#10B981', marginTop: 4 }}>
              {goalPercent}%
            </Animated.Text>
          </View>
        </View>
      </Animated.View>

      {/* Per-field Daily Goal Progress */}
      <Animated.View style={animatedStyle}>
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 22,
            padding: 18,
            marginBottom: 16,
            shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: mutedText, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
            Objectif du Jour par Catégorie
          </Text>

          {[
            { label: '🦶 Pas', pct: stepsPct, value: `${steps.toLocaleString()} / ${goals.steps.toLocaleString()}`, color: '#6C63FF' },
            { label: '🔥 Calories', pct: calPct, value: `${calories} / ${goals.calories} kcal`, color: '#FF6B6B' },
            { label: '⏱ Exercice', pct: durPct, value: `${duration} / ${goals.workoutMinutes} min`, color: '#F5A623' },
            { label: '💧 Eau', pct: waterPct, value: `${water} / ${goals.waterMl} ml`, color: '#4ECDC4' },
          ].map(({ label, pct, value, color }, idx) => (
            <View key={label} style={{ marginBottom: idx < 3 ? 12 : 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: textPrimary }}>{label}</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color }}>{value} ({pct}%)</Text>
              </View>
              <View style={{ height: 8, backgroundColor: isDark ? '#252d3d' : '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Today 4-KPI Grid */}
      <Animated.View style={animatedStyle}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <View style={{ width: '48%', backgroundColor: cardBg, borderRadius: 20, padding: 16, borderLeftWidth: 4, borderLeftColor: '#6C63FF' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: mutedText, textTransform: 'uppercase' }}>Pas</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary, marginTop: 4 }}>{steps.toLocaleString()}</Text>
          </View>

          <View style={{ width: '48%', backgroundColor: cardBg, borderRadius: 20, padding: 16, borderLeftWidth: 4, borderLeftColor: '#FF6B6B' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: mutedText, textTransform: 'uppercase' }}>Calories</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary, marginTop: 4 }}>{calories} kcal</Text>
          </View>

          <View style={{ width: '48%', backgroundColor: cardBg, borderRadius: 20, padding: 16, borderLeftWidth: 4, borderLeftColor: '#F5A623' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: mutedText, textTransform: 'uppercase' }}>Exercice</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary, marginTop: 4 }}>{duration} min</Text>
          </View>

          <View style={{ width: '48%', backgroundColor: cardBg, borderRadius: 20, padding: 16, borderLeftWidth: 4, borderLeftColor: '#4ECDC4' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: mutedText, textTransform: 'uppercase' }}>Eau Loggée</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary, marginTop: 4 }}>{water} ml</Text>
          </View>
        </View>
      </Animated.View>

      {/* Quick Water Intake Logger */}
      <Animated.View style={animatedStyle}>
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 22,
            padding: 18,
            marginBottom: 16,
            shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: mutedText, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Ajouter de l'Eau 💧
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#4ECDC4' }}>{water} / {goals.waterMl} ml</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
            {[50, 100, 150].map((amount) => (
              <Pressable
                key={amount}
                onPress={() => handleAddWater(amount)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#252d3d' : '#f0f4ff',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: textPrimary }}>+{amount}ml</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[200, 250, 330].map((amount) => (
              <Pressable
                key={amount}
                onPress={() => handleAddWater(amount)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: '#4ECDC4',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>+{amount}ml</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Achievements Card */}
      <Animated.View style={animatedStyle}>
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 22,
            padding: 18,
            shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: mutedText, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Achievements
            </Text>
            <View style={{ backgroundColor: '#6C63FF20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#6C63FF' }}>
                {unlockedAchievements.length}/{ACHIEVEMENT_DEFS.length}
              </Text>
            </View>
          </View>

          {ACHIEVEMENT_DEFS.map((achievement, idx) => {
            const isUnlocked = unlockedAchievements.includes(achievement.key);
            return (
              <View
                key={achievement.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: idx < ACHIEVEMENT_DEFS.length - 1 ? 8 : 0,
                  backgroundColor: isUnlocked ? (isDark ? '#252d3d' : '#f0f4ff') : (isDark ? '#0f1318' : '#f8fafc'),
                  opacity: isUnlocked ? 1 : 0.5,
                  borderWidth: 1,
                  borderColor: isUnlocked ? '#6C63FF40' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 20, width: 32 }}>{achievement.icon}</Text>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: textPrimary }}>
                    {achievement.label}
                  </Text>
                  <Text style={{ fontSize: 10, color: mutedText, marginTop: 1 }} numberOfLines={1}>
                    {isUnlocked ? achievement.description : 'À débloquer'}
                  </Text>
                </View>
                {isUnlocked && (
                  <View style={{ backgroundColor: '#10B98120', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981' }}>✓</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </Animated.View>
    </ScrollView>
  );
}
