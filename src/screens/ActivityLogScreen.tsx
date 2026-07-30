import { useMemo, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Pressable, Text, TextInput, useColorScheme, View } from 'react-native';
import {
  addActivity,
  addFavorite,
  deleteActivity,
  getAllActivities,
  getFavorites,
  toggleActivityFavorite,
} from '../db/database';
import type { Activity, ActivityCategory } from '../types';

const ACTIVITY_TYPES: ActivityCategory[] = [
  'walking', 'running', 'cycling', 'gym', 'swimming', 'yoga', 'hiit', 'custom',
];

type FilterType = ActivityCategory | 'all';

type ActivityFormState = {
  type: ActivityCategory;
  duration: string;
  distance: string;
  calories: string;
  notes: string;
  date: string;
};

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

const emptyForm = (): ActivityFormState => ({
  type: 'running',
  duration: '',
  distance: '',
  calories: '',
  notes: '',
  date: new Date().toISOString().slice(0, 10),
});

function Chip({
  label, active, onPress, isDark,
}: {
  label: FilterType; active: boolean; isDark: boolean; onPress: (value: FilterType) => void;
}) {
  const meta = label !== 'all' ? CATEGORY_META[label as ActivityCategory] : null;
  return (
    <Pressable
      onPress={() => onPress(label)}
      style={active && meta ? { backgroundColor: meta.color } : undefined}
      className={`mr-2 mb-2 rounded-full px-3 py-1.5 ${
        active
          ? meta ? '' : 'bg-primary'
          : isDark ? 'bg-[#222833]' : 'bg-white border border-border'
      }`}
    >
      <Text
        style={active && meta ? { color: '#fff' } : undefined}
        className={`text-xs font-semibold capitalize ${
          active ? 'text-white' : isDark ? 'text-white/60' : 'text-muted'
        }`}
      >
        {meta ? `${meta.icon} ` : ''}{label}
      </Text>
    </Pressable>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType = 'default', isDark,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; keyboardType?: 'default' | 'numeric' | 'number-pad'; isDark: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold uppercase tracking-[1.5px] text-muted">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={isDark ? '#4a5568' : '#cbd5e0'}
        className={`rounded-2xl px-4 py-3 text-sm font-medium ${
          isDark ? 'bg-[#0f1318] text-white' : 'bg-white text-dark border border-border'
        }`}
      />
    </View>
  );
}

export default function ActivityLogScreen() {
  const isDark = useColorScheme() === 'dark';
  const [form, setForm] = useState<ActivityFormState>(emptyForm);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  // Button press animations
  const addBtnScale = useRef(new Animated.Value(1)).current;
  const favBtnScale = useRef(new Animated.Value(1)).current;

  const pressIn = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 0.94, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  const pressOut = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  const activities = useMemo(() => getAllActivities(), [refreshKey]);

  const filteredActivities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activities.filter((a) => {
      const matchQ = q.length === 0 || a.type.includes(q) || (a.notes ?? '').toLowerCase().includes(q) || a.date.includes(q);
      const matchT = typeFilter === 'all' || a.type === typeFilter;
      return matchQ && matchT;
    });
  }, [activities, query, typeFilter]);

  const handleSaveFavoriteOnly = () => {
    if (!form.duration || !form.calories) return;
    addFavorite({
      label: `${form.type} ${form.duration}min`,
      type: form.type,
      duration: Number(form.duration),
      distance: form.distance ? Number(form.distance) : undefined,
      calories: Number(form.calories),
      notes: form.notes.trim() || undefined,
    });
  };

  const handleToggleFavorite = (id: number, current: boolean) => {
    toggleActivityFavorite(id, !current);
    setRefreshKey((v) => v + 1);
  };

  const handleDeleteActivity = (id: number, type: string) => {
    Alert.alert(
      'Supprimer l\'activité',
      `Supprimer cette séance de ${type} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteActivity(id);
            setRefreshKey((v) => v + 1);
          },
        },
      ]
    );
  };

  const addNewActivity = () => {
    if (!form.duration || !form.calories || !form.date) return;
    addActivity({
      type: form.type,
      duration: Number(form.duration),
      distance: form.distance ? Number(form.distance) : undefined,
      calories: Number(form.calories),
      notes: form.notes.trim() || undefined,
      date: form.date,
    });
    setForm(emptyForm());
    setRefreshKey((v) => v + 1);
    setFormOpen(false);
  };

  const addNewActivityAsFavorite = () => {
    if (!form.duration || !form.calories || !form.date) return;
    addActivity({
      type: form.type,
      duration: Number(form.duration),
      distance: form.distance ? Number(form.distance) : undefined,
      calories: Number(form.calories),
      notes: form.notes.trim() || undefined,
      date: form.date,
      isFavorite: true,
    });
    handleSaveFavoriteOnly();
    setForm(emptyForm());
    setRefreshKey((v) => v + 1);
    setFormOpen(false);
  };

  const cardBg = isDark ? 'bg-[#1a1f2e]' : 'bg-white';
  const screenBg = isDark ? 'bg-[#0d1117]' : 'bg-[#f4f6fb]';
  const textPrimary = isDark ? 'text-white' : 'text-dark';

  const renderItem = ({ item }: { item: Activity }) => {
    const meta = CATEGORY_META[item.type] ?? CATEGORY_META.custom;
    return (
      <View
        className={`mb-3 overflow-hidden rounded-2xl ${cardBg}`}
        style={{
          borderLeftWidth: 3,
          borderLeftColor: meta.color,
          shadowColor: meta.color,
          shadowOpacity: isDark ? 0.12 : 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        }}
      >
        <View className="flex-row items-center p-4">
          {/* Icon circle */}
          <View
            style={{ backgroundColor: meta.bg, width: 46, height: 46, borderRadius: 14 }}
            className="items-center justify-center mr-3"
          >
            <Text style={{ fontSize: 22 }}>{meta.icon}</Text>
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className={`text-base font-bold capitalize ${textPrimary}`}>{item.type}</Text>
              {item.isFavorite && <Text className="ml-1.5 text-xs">⭐</Text>}
            </View>
            <Text className="text-xs text-muted mt-0.5">{item.date}</Text>
            {item.notes ? (
              <Text className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-dark/60'}`} numberOfLines={1}>
                {item.notes}
              </Text>
            ) : null}
          </View>

          {/* Stats */}
          <View className="items-end mr-2">
            <Text style={{ color: meta.color }} className="text-sm font-bold">{item.calories} kcal</Text>
            <Text className={`text-xs mt-0.5 ${isDark ? 'text-white/60' : 'text-dark/50'}`}>{item.duration} min</Text>
            {item.distance != null && (
              <Text className="text-xs text-muted mt-0.5">{item.distance} km</Text>
            )}
          </View>

          {/* Actions */}
          <View className="items-center gap-y-2">
            <Pressable
              onPress={() => handleToggleFavorite(item.id, item.isFavorite ?? false)}
              className="p-1"
            >
              <Text className="text-lg">{item.isFavorite ? '⭐' : '☆'}</Text>
            </Pressable>
            <Pressable
              onPress={() => handleDeleteActivity(item.id, item.type)}
              style={{ backgroundColor: '#FF4757' + '22', borderRadius: 10, padding: 5 }}
            >
              <Text style={{ color: '#FF4757', fontSize: 12, fontWeight: '700' }}>✕</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className={`flex-1 ${screenBg}`}>
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View
              className={`mb-5 rounded-3xl p-5 mt-16 ${isDark ? 'bg-[#1a1f2e]' : 'bg-primary'}`}
              style={{ shadowColor: '#6C63FF', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}
            >
              <Text className="text-xs font-bold uppercase tracking-[2px] text-white/60">Activity Log</Text>
              <Text className="mt-1 text-3xl font-bold text-white">Mes séances 💪</Text>
              <View className="mt-3 flex-row items-center gap-x-3">
                <View className="rounded-full bg-white/15 px-3 py-1">
                  <Text className="text-xs font-semibold text-white">{activities.length} activité{activities.length !== 1 ? 's' : ''}</Text>
                </View>
                <View className="rounded-full bg-white/15 px-3 py-1">
                  <Text className="text-xs font-semibold text-white">
                    {activities.filter((a) => a.isFavorite).length} ⭐ favoris
                  </Text>
                </View>
              </View>
            </View>

            {/* Search bar */}
            <View
              className={`mb-3 flex-row items-center rounded-2xl px-4 py-3 ${isDark ? 'bg-[#1a1f2e]' : 'bg-white border border-border'}`}
              style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}
            >
              <Text className="mr-2 text-base">🔍</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher une activité..."
                placeholderTextColor={isDark ? '#4a5568' : '#a0aec0'}
                className={`flex-1 text-sm ${isDark ? 'text-white' : 'text-dark'}`}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')}>
                  <Text className="text-muted text-xs">✕</Text>
                </Pressable>
              )}
            </View>

            {/* Category filter chips */}
            <View className="mb-4 flex-row flex-wrap">
              <Chip label="all" active={typeFilter === 'all'} isDark={isDark} onPress={setTypeFilter} />
              {ACTIVITY_TYPES.map((t) => (
                <Chip key={t} label={t} active={typeFilter === t} isDark={isDark} onPress={setTypeFilter} />
              ))}
            </View>

            {/* Add activity toggle button */}
            <Pressable
              onPress={() => setFormOpen((v) => !v)}
              className={`mb-3 flex-row items-center justify-between rounded-2xl px-4 py-3.5 ${
                isDark ? 'bg-[#6C63FF]' : 'bg-primary'
              }`}
              style={{ shadowColor: '#6C63FF', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 }}
            >
              <Text className="font-bold text-white">
                {formOpen ? '✕ Fermer le formulaire' : '＋ Ajouter une activité'}
              </Text>
              <Text className="text-white text-lg">{formOpen ? '▲' : '▼'}</Text>
            </Pressable>

            {/* Collapsible form */}
            {formOpen && (
              <View
                className={`mb-4 rounded-2xl p-4 ${isDark ? 'bg-[#1a1f2e]' : 'bg-white border border-border'}`}
                style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
              >
                {/* Type picker */}
                <Text className="mb-2 text-xs font-bold uppercase tracking-[1.5px] text-muted">Type d'activité</Text>
                <View className="mb-3 flex-row flex-wrap">
                  {ACTIVITY_TYPES.map((type) => {
                    const m = CATEGORY_META[type];
                    const isActive = form.type === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => setForm((c) => ({ ...c, type }))}
                        style={isActive ? { backgroundColor: m.color } : { backgroundColor: isDark ? '#0f1318' : m.bg }}
                        className="mr-2 mb-2 rounded-xl px-3 py-2 flex-row items-center"
                      >
                        <Text style={{ fontSize: 14 }}>{m.icon}</Text>
                        <Text
                          style={{ color: isActive ? '#fff' : m.color }}
                          className="ml-1 text-xs font-bold capitalize"
                        >
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View className="flex-row gap-x-2">
                  <View className="flex-1">
                    <Field label="Durée (min)" value={form.duration}
                      onChangeText={(v) => setForm((c) => ({ ...c, duration: v }))}
                      placeholder="30" keyboardType="number-pad" isDark={isDark} />
                  </View>
                  <View className="flex-1">
                    <Field label="Calories" value={form.calories}
                      onChangeText={(v) => setForm((c) => ({ ...c, calories: v }))}
                      placeholder="280" keyboardType="number-pad" isDark={isDark} />
                  </View>
                </View>

                <View className="flex-row gap-x-2">
                  <View className="flex-1">
                    <Field label="Distance (km)" value={form.distance}
                      onChangeText={(v) => setForm((c) => ({ ...c, distance: v }))}
                      placeholder="5.2" keyboardType="numeric" isDark={isDark} />
                  </View>
                  <View className="flex-1">
                    <Field label="Date" value={form.date}
                      onChangeText={(v) => setForm((c) => ({ ...c, date: v }))}
                      placeholder="YYYY-MM-DD" isDark={isDark} />
                  </View>
                </View>

                <Field label="Notes" value={form.notes}
                  onChangeText={(v) => setForm((c) => ({ ...c, notes: v }))}
                  placeholder="Notes optionnelles..." isDark={isDark} />

                <View className="flex-row gap-x-2 mt-1">
                  <Animated.View style={{ transform: [{ scale: addBtnScale }], flex: 1 }}>
                    <Pressable
                      onPress={addNewActivity}
                      onPressIn={() => pressIn(addBtnScale)}
                      onPressOut={() => pressOut(addBtnScale)}
                      className="items-center rounded-2xl bg-primary py-4"
                      style={{ shadowColor: '#6C63FF', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 }}
                    >
                      <Text className="font-bold text-white">Ajouter</Text>
                    </Pressable>
                  </Animated.View>
                  <Animated.View style={{ transform: [{ scale: favBtnScale }], flex: 1 }}>
                    <Pressable
                      onPress={addNewActivityAsFavorite}
                      onPressIn={() => pressIn(favBtnScale)}
                      onPressOut={() => pressOut(favBtnScale)}
                      style={{ backgroundColor: '#F5A623', borderRadius: 16, alignItems: 'center', paddingVertical: 16, shadowColor: '#F5A623', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 }}
                    >
                      <Text className="font-bold text-white">⭐ Favori</Text>
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
            )}

            {/* Activity count */}
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-[1px] text-muted">
                {filteredActivities.length} résultat{filteredActivities.length !== 1 ? 's' : ''}
              </Text>
              {typeFilter !== 'all' && (
                <Pressable onPress={() => setTypeFilter('all')}>
                  <Text className="text-xs font-semibold text-primary">Réinitialiser</Text>
                </Pressable>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View
            className={`rounded-2xl p-8 items-center ${isDark ? 'bg-[#1a1f2e]' : 'bg-white'}`}
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
          >
            <Text className="text-4xl mb-3">🏋️</Text>
            <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-dark'}`}>Aucune activité</Text>
            <Text className="text-sm text-muted mt-1 text-center">
              Ajoute ta première séance pour commencer !
            </Text>
          </View>
        }
      />
    </View>
  );
}
