import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';
import { useGoals } from '../context/GoalsContext';

type GoalMeta = {
  id: 'steps' | 'calories' | 'waterMl' | 'workoutMinutes';
  label: string;
  unit: string;
  icon: string;
  color: string;
  bg: string;
  presets: number[];
};

const GOAL_FIELDS: GoalMeta[] = [
  {
    id: 'steps',
    label: 'Pas quotidiens',
    unit: 'pas',
    icon: '🦶',
    color: '#6C63FF',
    bg: '#6C63FF20',
    presets: [6000, 8000, 10000, 12000],
  },
  {
    id: 'calories',
    label: 'Calories brûlées',
    unit: 'kcal',
    icon: '🔥',
    color: '#FF6B6B',
    bg: '#FF6B6B20',
    presets: [1500, 2000, 2500, 3000],
  },
  {
    id: 'waterMl',
    label: 'Hydratation d\'eau',
    unit: 'ml',
    icon: '💧',
    color: '#4ECDC4',
    bg: '#4ECDC420',
    presets: [1500, 2000, 2500, 3000],
  },
  {
    id: 'workoutMinutes',
    label: 'Minutes d\'exercice',
    unit: 'min',
    icon: '⏱',
    color: '#F5A623',
    bg: '#F5A62320',
    presets: [30, 45, 60, 90],
  },
];

export default function GoalsScreen() {
  const isDark = useColorScheme() === 'dark';
  const { goals, saveGoals } = useGoals();

  const [steps, setSteps] = useState(String(goals.steps));
  const [calories, setCalories] = useState(String(goals.calories));
  const [waterMl, setWaterMl] = useState(String(goals.waterMl));
  const [workoutMinutes, setWorkoutMinutes] = useState(String(goals.workoutMinutes));
  const [saved, setSaved] = useState(false);

  const saveBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setSteps(String(goals.steps));
    setCalories(String(goals.calories));
    setWaterMl(String(goals.waterMl));
    setWorkoutMinutes(String(goals.workoutMinutes));
  }, [goals]);

  const handleSave = () => {
    const parsedSteps = parseInt(steps, 10);
    const parsedCalories = parseInt(calories, 10);
    const parsedWater = parseInt(waterMl, 10);
    const parsedMinutes = parseInt(workoutMinutes, 10);

    if ([parsedSteps, parsedCalories, parsedWater, parsedMinutes].some((v) => isNaN(v) || v < 0)) {
      Alert.alert('Erreur', 'Merci de saisir uniquement des nombres positifs.');
      return;
    }

    saveGoals({
      steps: parsedSteps,
      calories: parsedCalories,
      waterMl: parsedWater,
      workoutMinutes: parsedMinutes,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const pressIn = () =>
    Animated.spring(saveBtnScale, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(saveBtnScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const screenBg = isDark ? '#0d1117' : '#f4f6fb';
  const cardBg = isDark ? '#1a1f2e' : '#ffffff';
  const inputBg = isDark ? '#0f1318' : '#f8fafc';
  const textPrimary = isDark ? '#ffffff' : '#1a202c';
  const mutedText = isDark ? '#9ca3af' : '#64748b';

  const getValue = (id: GoalMeta['id']) => {
    switch (id) {
      case 'steps': return steps;
      case 'calories': return calories;
      case 'waterMl': return waterMl;
      case 'workoutMinutes': return workoutMinutes;
    }
  };

  const setValue = (id: GoalMeta['id'], val: string) => {
    switch (id) {
      case 'steps': setSteps(val); break;
      case 'calories': setCalories(val); break;
      case 'waterMl': setWaterMl(val); break;
      case 'workoutMinutes': setWorkoutMinutes(val); break;
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: screenBg }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 64 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: isDark ? '#1a1f2e' : '#6C63FF',
          borderRadius: 24,
          padding: 20,
          marginBottom: 20,
          shadowColor: '#6C63FF',
          shadowOpacity: 0.3,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
          Objectifs Personnels
        </Text>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 }}>
          Mes Objectifs 🎯
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 13 }}>
          Définissez vos cibles quotidiennes pour suivre votre progression.
        </Text>
      </View>

      {/* Goal Cards */}
      {GOAL_FIELDS.map((field) => {
        const val = getValue(field.id);
        return (
          <View
            key={field.id}
            style={{
              backgroundColor: cardBg,
              borderRadius: 22,
              padding: 18,
              marginBottom: 16,
              borderLeftWidth: 4,
              borderLeftColor: field.color,
              shadowColor: field.color,
              shadowOpacity: isDark ? 0.15 : 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            }}
          >
            {/* Field Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    backgroundColor: field.bg,
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{field.icon}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: textPrimary }}>
                    {field.label}
                  </Text>
                  <Text style={{ fontSize: 11, color: mutedText }}>Unité : {field.unit}</Text>
                </View>
              </View>
            </View>

            {/* Input */}
            <TextInput
              value={val}
              onChangeText={(v) => setValue(field.id, v)}
              keyboardType="number-pad"
              placeholder={`Ex: ${field.presets[1]}`}
              placeholderTextColor={mutedText}
              style={{
                backgroundColor: inputBg,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 20,
                fontWeight: '800',
                color: field.color,
                borderWidth: 1,
                borderColor: isDark ? '#2d3748' : '#e2e8f0',
                marginBottom: 10,
              }}
            />

            {/* Quick Presets */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {field.presets.map((preset) => {
                const isActive = Number(val) === preset;
                return (
                  <Pressable
                    key={preset}
                    onPress={() => setValue(field.id, String(preset))}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: isActive ? field.color : isDark ? '#252d3d' : '#f0f4ff',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: isActive ? '#ffffff' : field.color,
                      }}
                    >
                      {preset >= 1000 ? `${preset / 1000}k` : preset}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Save Button */}
      <Animated.View style={{ transform: [{ scale: saveBtnScale }], marginTop: 8 }}>
        <Pressable
          onPress={handleSave}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={{
            backgroundColor: saved ? '#4ECDC4' : '#6C63FF',
            borderRadius: 20,
            paddingVertical: 18,
            alignItems: 'center',
            shadowColor: saved ? '#4ECDC4' : '#6C63FF',
            shadowOpacity: 0.45,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 }}>
            {saved ? '✓ Objectifs enregistrés !' : '💾 Enregistrer les objectifs'}
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}
