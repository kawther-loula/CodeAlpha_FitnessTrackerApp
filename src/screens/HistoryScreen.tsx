import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  SectionList,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { deleteActivity, getAllActivities, toggleActivityFavorite } from '../db/database';
import type { Activity, ActivityCategory } from '../types';
import { exportActivitiesToCsv } from '../utils/exportCsv';

const CATEGORY_META: Record<ActivityCategory, { icon: string; color: string; bg: string }> = {
  walking:  { icon: '🚶', color: '#4ECDC4', bg: '#4ECDC420' },
  running:  { icon: '🏃', color: '#FF6B6B', bg: '#FF6B6B20' },
  cycling:  { icon: '🚴', color: '#F5A623', bg: '#F5A62320' },
  gym:      { icon: '🏋️', color: '#6C63FF', bg: '#6C63FF20' },
  swimming: { icon: '🏊', color: '#45B7D1', bg: '#45B7D120' },
  yoga:     { icon: '🧘', color: '#A8E6CF', bg: '#A8E6CF20' },
  hiit:     { icon: '⚡', color: '#FF4757', bg: '#FF475720' },
  custom:   { icon: '🎯', color: '#9B59B6', bg: '#9B59B620' },
};

function formatHeaderDate(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (dateStr === today) return "Aujourd'hui";
  if (dateStr === yesterday) return 'Hier';

  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function groupByDate(activities: Activity[]) {
  const groups: Record<string, Activity[]> = {};
  for (const activity of activities) {
    if (!groups[activity.date]) groups[activity.date] = [];
    groups[activity.date].push(activity);
  }
  return Object.keys(groups)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((date) => ({ title: date, formattedTitle: formatHeaderDate(date), data: groups[date] }));
}

export default function HistoryScreen() {
  const isDark = useColorScheme() === 'dark';
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<Activity | null>(null);
  const [query, setQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const exportBtnScale = useRef(new Animated.Value(1)).current;

  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);

  const loadData = useCallback(() => {
    setActivitiesList(getAllActivities());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, refreshKey])
  );

  const filteredActivities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activitiesList.filter((a) => {
      const matchQ = q.length === 0 || a.type.includes(q) || (a.notes ?? '').toLowerCase().includes(q) || a.date.includes(q);
      const matchFav = !onlyFavorites || a.isFavorite;
      return matchQ && matchFav;
    });
  }, [activitiesList, query, onlyFavorites]);

  const sections = useMemo(() => groupByDate(filteredActivities), [filteredActivities]);

  const totalCalories = useMemo(() => activitiesList.reduce((sum, a) => sum + a.calories, 0), [activitiesList]);
  const totalMinutes = useMemo(() => activitiesList.reduce((sum, a) => sum + a.duration, 0), [activitiesList]);

  const handleExport = async () => {
    if (activitiesList.length === 0) {
      Alert.alert('Aucune donnée', "Tu n'as pas encore d'activités à exporter.");
      return;
    }
    await exportActivitiesToCsv(activitiesList);
  };

  const handleDelete = (id: number, type: string) => {
    Alert.alert(
      'Supprimer l\'activité',
      `Supprimer définitivement cette séance de ${type} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteActivity(id);
            setSelected(null);
            setRefreshKey((v) => v + 1);
          },
        },
      ]
    );
  };

  const handleToggleFavoriteInModal = (id: number, currentFav: boolean) => {
    toggleActivityFavorite(id, !currentFav);
    if (selected && selected.id === id) {
      setSelected({ ...selected, isFavorite: !currentFav });
    }
    setRefreshKey((v) => v + 1);
  };

  const pressIn = () =>
    Animated.spring(exportBtnScale, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(exportBtnScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const screenBg = isDark ? '#0d1117' : '#f4f6fb';
  const cardBg = isDark ? '#1a1f2e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1a202c';
  const mutedText = isDark ? '#9ca3af' : '#64748b';

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 64 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Header Banner */}
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
                Historique Complet
              </Text>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 }}>
                Vos Séances 📜
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 13 }}>
                Revoir l'ensemble de votre journal d'entraînement.
              </Text>
            </View>

            {/* Total Stats Banner */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: cardBg,
                borderRadius: 20,
                padding: 16,
                marginBottom: 16,
                shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
              }}
            >
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#6C63FF' }}>{activitiesList.length}</Text>
                <Text style={{ fontSize: 11, color: mutedText, marginTop: 2 }}>Séances</Text>
              </View>
              <View style={{ width: 1, backgroundColor: isDark ? '#2d3748' : '#e2e8f0' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#FF6B6B' }}>{totalCalories.toLocaleString()}</Text>
                <Text style={{ fontSize: 11, color: mutedText, marginTop: 2 }}>kcal totales</Text>
              </View>
              <View style={{ width: 1, backgroundColor: isDark ? '#2d3748' : '#e2e8f0' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#4ECDC4' }}>{Math.round(totalMinutes / 60)}h</Text>
                <Text style={{ fontSize: 11, color: mutedText, marginTop: 2 }}>Temps total</Text>
              </View>
            </View>

            {/* Export CSV Button */}
            <Animated.View style={{ transform: [{ scale: exportBtnScale }], marginBottom: 16 }}>
              <Pressable
                onPress={handleExport}
                onPressIn={pressIn}
                onPressOut={pressOut}
                style={{
                  backgroundColor: isDark ? '#222834' : '#1e293b',
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>📤 Exporter l'historique en CSV</Text>
              </Pressable>
            </Animated.View>

            {/* Search & Favorites Filter Bar */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: cardBg,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: 16,
                shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher une séance..."
                placeholderTextColor={mutedText}
                style={{ flex: 1, fontSize: 14, color: textPrimary }}
              />
              <Pressable
                onPress={() => setOnlyFavorites((v) => !v)}
                style={{
                  backgroundColor: onlyFavorites ? '#F5A623' : isDark ? '#2d3748' : '#f1f5f9',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  marginLeft: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: onlyFavorites ? '#ffffff' : mutedText }}>
                  ⭐ Favoris
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderSectionHeader={({ section: { formattedTitle } }) => (
          <Text style={{ fontSize: 11, fontWeight: '700', color: mutedText, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 12, marginBottom: 8 }}>
            {formattedTitle}
          </Text>
        )}
        renderItem={({ item }) => {
          const meta = CATEGORY_META[item.type] ?? CATEGORY_META.custom;
          return (
            <Pressable
              onPress={() => setSelected(item)}
              style={{
                backgroundColor: cardBg,
                borderRadius: 18,
                padding: 14,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
                borderLeftWidth: 4,
                borderLeftColor: meta.color,
                shadowColor: meta.color,
                shadowOpacity: isDark ? 0.1 : 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              {/* Category Icon */}
              <View
                style={{
                  backgroundColor: meta.bg,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 20 }}>{meta.icon}</Text>
              </View>

              {/* Title & Notes */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: textPrimary, textTransform: 'capitalize' }}>
                    {item.type}
                  </Text>
                  {item.isFavorite && <Text style={{ fontSize: 12, marginLeft: 4 }}>⭐</Text>}
                </View>
                <Text style={{ fontSize: 12, color: mutedText, marginTop: 2 }}>{item.duration} min</Text>
                {item.notes ? (
                  <Text style={{ fontSize: 11, color: mutedText, marginTop: 2 }} numberOfLines={1}>
                    {item.notes}
                  </Text>
                ) : null}
              </View>

              {/* Calories & Distance */}
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: meta.color }}>
                  {item.calories} kcal
                </Text>
                {item.distance != null && (
                  <Text style={{ fontSize: 11, color: mutedText, marginTop: 2 }}>{item.distance} km</Text>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              padding: 32,
              alignItems: 'center',
              shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
            }}
          >
            <Text style={{ fontSize: 36, marginBottom: 12 }}>📜</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textPrimary }}>Aucune séance trouvée</Text>
            <Text style={{ fontSize: 13, color: mutedText, marginTop: 4, textAlign: 'center' }}>
              Vos activités enregistrées apparaîtront ici.
            </Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View
            style={{
              width: '100%',
              backgroundColor: cardBg,
              borderRadius: 24,
              padding: 24,
              shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
            }}
          >
            {selected && (
              <>
                {/* Modal Title */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, marginRight: 10 }}>
                      {CATEGORY_META[selected.type]?.icon ?? '🎯'}
                    </Text>
                    <View>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary, textTransform: 'capitalize' }}>
                        {selected.type}
                      </Text>
                      <Text style={{ fontSize: 12, color: mutedText, marginTop: 2 }}>{formatHeaderDate(selected.date)}</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleToggleFavoriteInModal(selected.id, selected.isFavorite ?? false)}
                    style={{ padding: 6 }}
                  >
                    <Text style={{ fontSize: 24 }}>{selected.isFavorite ? '⭐' : '☆'}</Text>
                  </Pressable>
                </View>

                {/* Metrics Grid */}
                <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#0f1318' : '#f8fafc', borderRadius: 16, padding: 14, marginBottom: 16 }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: mutedText, fontWeight: '700', textTransform: 'uppercase' }}>Durée</Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary, marginTop: 4 }}>{selected.duration} min</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: isDark ? '#2d3748' : '#e2e8f0' }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: mutedText, fontWeight: '700', textTransform: 'uppercase' }}>Calories</Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#FF6B6B', marginTop: 4 }}>{selected.calories} kcal</Text>
                  </View>
                  {selected.distance != null && (
                    <>
                      <View style={{ width: 1, backgroundColor: isDark ? '#2d3748' : '#e2e8f0' }} />
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, color: mutedText, fontWeight: '700', textTransform: 'uppercase' }}>Distance</Text>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#4ECDC4', marginTop: 4 }}>{selected.distance} km</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Notes */}
                {selected.notes ? (
                  <View style={{ backgroundColor: isDark ? '#0f1318' : '#f8fafc', borderRadius: 16, padding: 14, marginBottom: 20 }}>
                    <Text style={{ fontSize: 11, color: mutedText, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>Notes</Text>
                    <Text style={{ fontSize: 13, color: textPrimary }}>{selected.notes}</Text>
                  </View>
                ) : null}

                {/* Modal Actions */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={() => handleDelete(selected.id, selected.type)}
                    style={{ flex: 1, backgroundColor: '#FF475720', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#FF4757', fontWeight: '800', fontSize: 14 }}>Supprimer</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelected(null)}
                    style={{ flex: 1, backgroundColor: '#6C63FF', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Fermer</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
