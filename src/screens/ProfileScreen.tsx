import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import {
  addWeightLog,
  checkAndUnlockAchievements,
  getProfile,
  getUnlockedAchievements,
  getWeightHistory,
  saveProfile,
} from '../db/database';
import type { Gender } from '../types';
import { ACHIEVEMENT_DEFS } from '../utils/achievements';
import { cancelAllReminders, requestNotificationPermission, scheduleDailyReminders } from '../utils/notifications';
import { uploadToCloud, downloadFromCloud, getLastSyncDate } from '../firebase/sync';
import { ActivityIndicator } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const screenWidth = Dimensions.get('window').width - 48;

// DESIGN SYSTEM TOKENS (Forcing Orange #FF5A36)
const THEME = {
  primary: '#FF5A36',
  success: '#22C55E',
  surface: '#F7F7F8',
  card: '#FFFFFF',
  muted: '#8A8F98',
  dark: '#121417',
  border: '#E5E7EB',
};

const GENDERS: { key: Gender; label: string; icon: string }[] = [
  { key: 'male', label: 'Homme', icon: '👨' },
  { key: 'female', label: 'Femme', icon: '👩' },
  { key: 'other', label: 'Autre', icon: '👤' },
];

function getBmiMeta(bmi: number): { label: string; color: string; bg: string } {
  if (bmi <= 0) return { label: 'Incomplet', color: '#94A3B8', bg: '#94A3B820' };
  if (bmi < 18.5) return { label: 'Insuffisance pondérale', color: '#3B82F6', bg: '#3B82F620' };
  if (bmi < 25) return { label: 'Poids normal', color: THEME.success, bg: `${THEME.success}20` };
  if (bmi < 30) return { label: 'Surpoids', color: '#F5A623', bg: '#F5A62320' };
  return { label: 'Obésité', color: '#EF4444', bg: '#EF444420' };
}

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const currentProfile = getProfile();

  const [name, setName] = useState(currentProfile.name);
  const [weight, setWeight] = useState(String(currentProfile.weight));
  const [height, setHeight] = useState(String(currentProfile.height));
  const [age, setAge] = useState(String(currentProfile.age));
  const [gender, setGender] = useState<Gender>(currentProfile.gender as Gender);
  const [saved, setSaved] = useState(false);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [notifsEnabled, setNotifsEnabled] = useState(false);
  const [weightHistory, setWeightHistory] = useState(getWeightHistory());
  const [newWeight, setNewWeight] = useState('');
  const [syncing, setSyncing] = useState(false);

  const handleUpload = async () => {
    setSyncing(true);
    try {
      await uploadToCloud();
      Alert.alert('Succès', 'Tes données ont été sauvegardées dans le cloud.');
    } catch (e) {
      Alert.alert('Erreur', "La sauvegarde a échoué. Vérifie ta connexion internet.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDownload = () => {
    Alert.alert(
      'Restaurer depuis le cloud',
      'Cette action va remplacer toutes tes données actuelles. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Restaurer',
          style: 'destructive',
          onPress: async () => {
            setSyncing(true);
            try {
              const success = await downloadFromCloud();
              if (success) {
                Alert.alert('Succès', "Données restaurées. Redémarre l'app pour tout recharger.");
              } else {
                Alert.alert('Aucune sauvegarde', "Tu n'as encore rien sauvegardé dans le cloud.");
              }
            } catch (e) {
              Alert.alert('Erreur', 'La restauration a échoué. Vérifie ta connexion internet.');
            } finally {
              setSyncing(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Veux-tu vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const saveBtnScale = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      checkAndUnlockAchievements();
      setUnlocked(getUnlockedAchievements());
      setWeightHistory(getWeightHistory());
    }, [])
  );

  const handleLogWeight = () => {
    const value = Number(newWeight);
    if (!value || value <= 0) {
      Alert.alert('Valeur invalide', 'Veuillez saisir un poids valide en kg.');
      return;
    }
    addWeightLog(value);
    setWeight(String(value));
    setWeightHistory(getWeightHistory());
    setNewWeight('');
  };

  const handleToggleNotifs = async () => {
    if (!notifsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleDailyReminders();
        setNotifsEnabled(true);
      } else {
        Alert.alert('Permission refusée', 'Activez les notifications dans les réglages de votre appareil.');
      }
    } else {
      await cancelAllReminders();
      setNotifsEnabled(false);
    }
  };

  const bmi = useMemo(() => {
    const w = Number(weight);
    const h = Number(height) / 100;
    if (!w || !h) return 0;
    return w / (h * h);
  }, [weight, height]);

  const bmiMeta = getBmiMeta(bmi);

  const handleSave = () => {
    const parsedWeight = Number(weight);
    const parsedHeight = Number(height);
    const parsedAge = parseInt(age, 10);

    if (!name.trim() || !parsedWeight || !parsedHeight || isNaN(parsedAge)) {
      Alert.alert('Erreur', 'Merci de remplir tous les champs correctement.');
      return;
    }

    saveProfile({ name: name.trim(), weight: parsedWeight, height: parsedHeight, age: parsedAge, gender });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const pressIn = () =>
    Animated.spring(saveBtnScale, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(saveBtnScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const screenBg = isDark ? '#0d1117' : THEME.surface;
  const cardBg = isDark ? '#1a1f2e' : THEME.card;
  const inputBg = isDark ? '#0f1318' : '#f8fafc';
  const textPrimary = isDark ? '#ffffff' : THEME.dark;
  const textMuted = isDark ? '#9ca3af' : THEME.muted;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: screenBg }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 64 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header Banner - Orange Theme */}
      <View
        style={{
          backgroundColor: isDark ? '#1a1f2e' : THEME.primary,
          borderRadius: 24,
          padding: 20,
          marginBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: THEME.primary,
          shadowOpacity: 0.3,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}
        >
          <Text style={{ fontSize: 26 }}>🧡</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
            Mon Compte Fitness
          </Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>
            {name || 'Utilisateur'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>
            {age ? `${age} ans` : '--'} · {height ? `${height} cm` : '--'} · {weight ? `${weight} kg` : '--'}
          </Text>
        </View>
      </View>

      {/* IMC / BMI Card */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 22,
          padding: 20,
          marginBottom: 16,
          alignItems: 'center',
          borderLeftWidth: 4,
          borderLeftColor: bmiMeta.color,
          shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
          Indice de Masse Corporelle (IMC)
        </Text>
        <Text style={{ fontSize: 40, fontWeight: '900', color: bmiMeta.color }}>
          {bmi > 0 ? bmi.toFixed(1) : '--'}
        </Text>
        <View style={{ backgroundColor: bmiMeta.bg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: bmiMeta.color }}>
            {bmiMeta.label}
          </Text>
        </View>
      </View>

      {/* Weight Chart Card */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 22,
          padding: 18,
          marginBottom: 16,
          shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Évolution du Poids
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.primary }}>⚖️ kg</Text>
        </View>

        {weightHistory.length >= 2 ? (
          <LineChart
            data={{
              labels: weightHistory.slice(-7).map((w) => w.date.slice(5)),
              datasets: [{ data: weightHistory.slice(-7).map((w) => w.weight) }],
            }}
            width={screenWidth}
            height={180}
            chartConfig={{
              backgroundGradientFrom: cardBg,
              backgroundGradientTo: cardBg,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(255, 90, 54, ${opacity})`,
              labelColor: (opacity = 1) => (isDark ? `rgba(255,255,255,${opacity * 0.8})` : `rgba(30,41,59,${opacity * 0.8})`),
              propsForDots: { r: '5', strokeWidth: '2', stroke: THEME.primary },
              propsForBackgroundLines: { stroke: isDark ? '#2d3748' : THEME.border, strokeDasharray: '4' },
            }}
            bezier
            style={{ borderRadius: 16, marginVertical: 4, paddingRight: 16 }}
          />
        ) : (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Text style={{ color: textMuted, fontSize: 13 }}>Ajoutez des pesées pour voir le graphique.</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TextInput
            value={newWeight}
            onChangeText={setNewWeight}
            placeholder="Poids actuel (kg)..."
            keyboardType="numeric"
            placeholderTextColor={textMuted}
            style={{
              flex: 1,
              backgroundColor: inputBg,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 15,
              color: textPrimary,
              borderWidth: 1,
              borderColor: isDark ? '#2d3748' : THEME.border,
            }}
          />
          <Pressable
            onPress={handleLogWeight}
            style={{
              backgroundColor: THEME.primary,
              borderRadius: 14,
              paddingHorizontal: 20,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>＋ Pesée</Text>
          </Pressable>
        </View>
      </View>

      {/* Cloud & Actions Card */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 22,
          padding: 18,
          marginBottom: 16,
          shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
        }}
      >
        <Text style={{ color: textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
          Actions & Sauvegarde
        </Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textPrimary }}>Rappels Quotidiens</Text>
            <Text style={{ fontSize: 12, color: textMuted }}>Notifications de rappel</Text>
          </View>
          <Pressable
            onPress={handleToggleNotifs}
            style={{
              backgroundColor: notifsEnabled ? THEME.success : THEME.primary,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
              {notifsEnabled ? 'Activés ✓' : 'Activer'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleUpload}
          disabled={syncing}
          style={{
            backgroundColor: THEME.primary,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          {syncing ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>☁️ Sauvegarder dans le Cloud</Text>}
        </Pressable>
        
        <Pressable
          onPress={handleDownload}
          disabled={syncing}
          style={{
            backgroundColor: isDark ? '#2d3440' : THEME.border,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: textPrimary, fontWeight: '800' }}>📥 Restaurer mes données</Text>
        </Pressable>
      </View>

      {/* Profile Form Card */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 22,
          padding: 18,
          marginBottom: 16,
          shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
          Modifier mes Informations
        </Text>

        <Text style={{ fontSize: 11, fontWeight: '700', color: textMuted, marginBottom: 6 }}>NOM</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nom..."
          placeholderTextColor={textMuted}
          style={{
            backgroundColor: inputBg,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 15,
            color: textPrimary,
            borderWidth: 1,
            borderColor: isDark ? '#2d3748' : THEME.border,
            marginBottom: 16,
          }}
        />

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: textMuted, marginBottom: 6 }}>POIDS</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              style={{
                backgroundColor: inputBg,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                color: textPrimary,
                borderWidth: 1,
                borderColor: isDark ? '#2d3748' : THEME.border,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: textMuted, marginBottom: 6 }}>TAILLE</Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              style={{
                backgroundColor: inputBg,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                color: textPrimary,
                borderWidth: 1,
                borderColor: isDark ? '#2d3748' : THEME.border,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: textMuted, marginBottom: 6 }}>ÂGE</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              style={{
                backgroundColor: inputBg,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                color: textPrimary,
                borderWidth: 1,
                borderColor: isDark ? '#2d3748' : THEME.border,
              }}
            />
          </View>
        </View>

        <Text style={{ fontSize: 11, fontWeight: '700', color: textMuted, marginBottom: 8 }}>GENRE</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {GENDERS.map((g) => {
            const isActive = gender === g.key;
            return (
              <Pressable
                key={g.key}
                onPress={() => setGender(g.key)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: isActive ? THEME.primary : isDark ? '#252d3d' : '#f0f4ff',
                }}
              >
                <Text style={{ fontSize: 14, marginRight: 4 }}>{g.icon}</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: isActive ? '#ffffff' : textPrimary }}>
                  {g.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Animated.View style={{ transform: [{ scale: saveBtnScale }] }}>
          <Pressable
            onPress={handleSave}
            onPressIn={pressIn}
            onPressOut={pressOut}
            style={{
              backgroundColor: saved ? THEME.success : THEME.primary,
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: 'center',
              shadowColor: saved ? THEME.success : THEME.primary,
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
              {saved ? '✓ Profil mis à jour !' : '💾 Enregistrer les modifications'}
            </Text>
          </Pressable>
        </Animated.View>

        <Pressable onPress={handleLogout} style={{ marginTop: 16, alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ color: '#EF4444', fontWeight: '700' }}>Se déconnecter</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
