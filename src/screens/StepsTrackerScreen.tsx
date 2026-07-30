import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Pedometer } from 'expo-sensors';
import { getGoals, getTodaySteps, setTodaySteps } from '../db/database';

// DESIGN SYSTEM TOKENS
const THEME = {
  primary: '#FF5A36',
  success: '#22C55E',
  surface: '#F7F7F8',
  card: '#FFFFFF',
  muted: '#8A8F98',
  dark: '#121417',
  border: '#E5E7EB',
};

export default function StepsTrackerScreen() {
  const isDark = useColorScheme() === 'dark';

  const goals = useMemo(() => getGoals(), []);
  const STEP_GOAL = goals.steps;

  const [savedSteps, setSavedSteps] = useState(getTodaySteps());
  const [liveSteps, setLiveSteps] = useState(getTodaySteps());
  const [isTracking, setIsTracking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [manualInput, setManualInput] = useState('');
  const [sensorStatus, setSensorStatus] = useState<'checking' | 'hardware' | 'simulated' | 'denied'>('checking');

  const subscriptionRef = useRef<Pedometer.Subscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseStepsRef = useRef(savedSteps);
  const startTimeRef = useRef(0);

  // Animated ring progress
  const animProgress = useRef(new Animated.Value(savedSteps / STEP_GOAL)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Check hardware Pedometer availability on mount
  useEffect(() => {
    async function checkSensor() {
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        if (isAvailable) {
          setSensorStatus('hardware');
        } else {
          setSensorStatus('simulated');
        }
      } catch (err) {
        setSensorStatus('simulated');
      }
    }
    checkSensor();
  }, []);

  // Sync ring animation when live steps change
  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: Math.min(1, liveSteps / STEP_GOAL),
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [liveSteps, STEP_GOAL, animProgress]);

  // Pulse animation while tracking
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isTracking) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
    return () => loop?.stop();
  }, [isTracking, pulseAnim]);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTracking(false);
    setTodaySteps(liveSteps);
    setSavedSteps(liveSteps);
  }, [liveSteps]);

  const startTracking = useCallback(async () => {
    baseStepsRef.current = savedSteps;
    startTimeRef.current = Date.now();
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (isAvailable) {
        const { status } = await Pedometer.requestPermissionsAsync();
        if (status === 'granted') {
          setSensorStatus('hardware');
          setIsTracking(true);
          subscriptionRef.current = Pedometer.watchStepCount((result) => {
            const currentTotal = baseStepsRef.current + result.steps;
            setLiveSteps(currentTotal);
            setTodaySteps(currentTotal);
          });
          return;
        } else {
          setSensorStatus('denied');
          Alert.alert(
            'Permission requise',
            'L\'accès aux capteurs de mouvement est nécessaire pour compter vos pas automatiquement. Mode simulation activé.'
          );
        }
      }
    } catch (e) {
      // Fallback
    }

    setSensorStatus('simulated');
    setIsTracking(true);
    const simTimer = setInterval(() => {
      const secondsPassed = (Date.now() - startTimeRef.current) / 1000;
      const newSteps = Math.round(baseStepsRef.current + secondsPassed * 1.5);
      setLiveSteps(newSteps);
      setTodaySteps(newSteps);
    }, 600);

    const prevTimer = timerRef.current;
    timerRef.current = simTimer;
    if (prevTimer) clearInterval(prevTimer);
  }, [savedSteps]);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleManualSave = () => {
    const val = Math.max(0, Number(manualInput) || 0);
    setTodaySteps(val);
    setSavedSteps(val);
    setLiveSteps(val);
    setManualInput('');
  };

  const handleQuickAdd = (amount: number) => {
    const next = liveSteps + amount;
    setTodaySteps(next);
    setSavedSteps(next);
    setLiveSteps(next);
  };

  const progress = Math.min(1, liveSteps / STEP_GOAL);
  const percent = Math.round(progress * 100);
  const remaining = Math.max(0, STEP_GOAL - liveSteps);
  const isGoalReached = liveSteps >= STEP_GOAL;

  const size = 200;
  const radius = 82;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - progress * circumference;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const distanceKm = ((liveSteps * 0.75) / 1000).toFixed(2);
  const caloriesEst = Math.round(liveSteps * 0.04);

  const ringColor = isGoalReached ? THEME.success : isTracking ? THEME.primary : THEME.primary;
  const ringGlow = isTracking ? ringColor : 'transparent';

  const isDarkBg = isDark ? '#0d1117' : THEME.surface;
  const cardBg = isDark ? '#1a1f2e' : THEME.card;
  const textColor = isDark ? '#ffffff' : THEME.dark;
  const mutedColor = isDark ? '#6b7280' : THEME.muted;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDarkBg }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 64 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: isDark ? '#1a1f2e' : THEME.primary,
          borderRadius: 24,
          padding: 20,
          marginBottom: 20,
          shadowColor: THEME.primary,
          shadowOpacity: 0.3,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
          Steps Tracker
        </Text>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 }}>
          Mes Pas 🦶
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', marginTop: 4, fontSize: 13 }}>
          Objectif : {STEP_GOAL.toLocaleString()} pas aujourd'hui
        </Text>

        {/* Sensor indicator badge - FIXED self -> alignSelf */}
        <View style={{ marginTop: 12, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>
            {sensorStatus === 'hardware'
              ? '🟢 Capteur physique connecté'
              : sensorStatus === 'denied'
              ? '🟠 Permission refusée (simulation)'
              : '🔵 Mode simulation actif'}
          </Text>
        </View>
      </View>

      {/* Ring card */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 24,
          paddingVertical: 28,
          paddingHorizontal: 20,
          alignItems: 'center',
          marginBottom: 16,
          shadowColor: ringGlow,
          shadowOpacity: isTracking ? 0.3 : 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={ringColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={isGoalReached ? THEME.success : '#FF8A65'} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Circle
              cx={size / 2} cy={size / 2} r={radius}
              stroke={isDark ? '#2d3748' : '#e5e7eb'}
              strokeWidth={strokeWidth} fill="transparent"
            />
            <Circle
              cx={size / 2} cy={size / 2} r={radius}
              stroke="url(#ringGrad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              rotation={-90}
              originX={size / 2}
              originY={size / 2}
            />
          </Svg>

          <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 34, fontWeight: '800', color: textColor }}>
              {liveSteps.toLocaleString()}
            </Text>
            <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>pas</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: ringColor, marginTop: 4 }}>
              {percent}%
            </Text>
          </View>
        </Animated.View>

        {isTracking && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, backgroundColor: isDark ? '#252d3d' : '#f0f4ff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.primary, marginRight: 8 }} />
            <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>
              Suivi actif · {formatTime(elapsed)}
            </Text>
          </View>
        )}
      </View>

      {/* Goal remaining card */}
      <View
        style={{
          backgroundColor: isGoalReached ? `${THEME.success}20` : cardBg,
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isGoalReached ? THEME.success : isDark ? '#2d3748' : '#e5e7eb',
          shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        }}
      >
        {isGoalReached ? (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ fontSize: 32 }}>🎉</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: THEME.success, marginTop: 6 }}>
              Objectif atteint !
            </Text>
            <Text style={{ color: mutedColor, fontSize: 13, marginTop: 4 }}>
              Félicitations, vous avez dépassé vos {STEP_GOAL.toLocaleString()} pas !
            </Text>
          </View>
        ) : (
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: mutedColor, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
              Reste à faire ({STEP_GOAL.toLocaleString()})
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: THEME.primary }}>
                  {remaining.toLocaleString()}
                </Text>
                <Text style={{ fontSize: 11, color: mutedColor, marginTop: 2 }}>pas</Text>
              </View>
              <View style={{ width: 1, backgroundColor: isDark ? '#2d3748' : '#e5e7eb' }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#F5A623' }}>
                  ~{Math.round(remaining / 1.5 / 60)} min
                </Text>
                <Text style={{ fontSize: 11, color: mutedColor, marginTop: 2 }}>marche</Text>
              </View>
              <View style={{ width: 1, backgroundColor: isDark ? '#2d3748' : '#e5e7eb' }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: THEME.primary }}>
                  {((remaining * 0.75) / 1000).toFixed(1)} km
                </Text>
                <Text style={{ fontSize: 11, color: mutedColor, marginTop: 2 }}>distance</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', marginBottom: 16, gap: 10 }}>
        {[
          { label: 'Distance', value: `${distanceKm} km`, icon: '📍', color: '#4ECDC4' },
          { label: 'Calories', value: `${caloriesEst} kcal`, icon: '🔥', color: '#FF6B6B' },
        ].map(({ label, value, icon, color }) => (
          <View
            key={label}
            style={{
              flex: 1, backgroundColor: cardBg, borderRadius: 18, padding: 16,
              alignItems: 'center',
              shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
            }}
          >
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{icon}</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color }}>{value}</Text>
            <Text style={{ fontSize: 11, color: mutedColor, marginTop: 2 }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Start / Stop button */}
      <Pressable
        onPress={isTracking ? stopTracking : startTracking}
        style={{
          backgroundColor: isTracking ? '#EF4444' : THEME.primary,
          borderRadius: 20,
          paddingVertical: 18,
          alignItems: 'center',
          marginBottom: 16,
          shadowColor: isTracking ? '#EF4444' : THEME.primary,
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>
          {isTracking ? '⏹ Arrêter le suivi' : '▶️ Démarrer le suivi'}
        </Text>
      </Pressable>

      {/* Quick Add & Manual Input */}
      <View style={{ backgroundColor: cardBg, borderRadius: 22, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: mutedColor, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
          Ajout Rapide & Manuel
        </Text>
        
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[500, 1000, 2000].map((amount) => (
            <Pressable
              key={amount}
              onPress={() => handleQuickAdd(amount)}
              style={{
                flex: 1,
                backgroundColor: isDark ? '#252d3d' : '#f0f4ff',
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.primary }}>+{amount}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={manualInput}
            onChangeText={setManualInput}
            placeholder="Saisie manuelle..."
            keyboardType="numeric"
            placeholderTextColor={mutedColor}
            style={{
              flex: 1,
              backgroundColor: isDark ? '#0f1318' : '#f8fafc',
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 15,
              color: textColor,
              borderWidth: 1,
              borderColor: isDark ? '#2d3748' : THEME.border,
            }}
          />
          <Pressable
            onPress={handleManualSave}
            style={{
              backgroundColor: THEME.primary,
              borderRadius: 14,
              paddingHorizontal: 20,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Fixer</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
