import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Dimensions, Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import {
  getActivityTypeBreakdown,
  getLast7DaysCalories,
  getLast7DaysSteps,
  getLongestStreak,
  getMonthlyStats,
  getWeeklyStats,
  getWeightHistory,
} from '../db/database';

const screenWidth = Dimensions.get('window').width - 32;

const PIE_COLORS = ['#6C63FF', '#4ECDC4', '#FF6B6B', '#F5A623', '#A855F7', '#EC4899', '#45B7D1', '#95A5A6'];

function shortDay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d.getDay()];
}

export default function ProgressScreen() {
  const isDark = useColorScheme() === 'dark';
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const [caloriesData, setCaloriesData] = useState<{ date: string; calories: number }[]>([]);
  const [stepsData, setStepsData] = useState<{ date: string; steps: number }[]>([]);
  const [breakdown, setBreakdown] = useState<{ type: string; totalMinutes: number }[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ totalWorkouts: 0, totalCalories: 0, totalDuration: 0, avgDuration: 0, mostPracticed: '—' });
  const [monthlyStats, setMonthlyStats] = useState({ totalWorkouts: 0, totalCalories: 0, totalDuration: 0, avgDuration: 0, mostPracticed: '—' });
  const [longestStreak, setLongestStreak] = useState(0);
  const [weightHistory, setWeightHistory] = useState<{ weight: number; date: string }[]>([]);

  // Refresh data every time the user navigates to this screen
  const loadData = useCallback(() => {
    setCaloriesData(getLast7DaysCalories());
    setStepsData(getLast7DaysSteps());
    setBreakdown(getActivityTypeBreakdown());
    setWeeklyStats(getWeeklyStats());
    setMonthlyStats(getMonthlyStats());
    setLongestStreak(getLongestStreak());
    setWeightHistory(getWeightHistory());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const screenBg = isDark ? '#0d1117' : '#f4f6fb';
  const cardBg = isDark ? '#1a1f2e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1a202c';
  const mutedText = isDark ? '#9ca3af' : '#64748b';

  const chartConfig = {
    backgroundGradientFrom: isDark ? '#1a1f2e' : '#FFFFFF',
    backgroundGradientTo: isDark ? '#1a1f2e' : '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
    labelColor: (opacity = 1) => (isDark ? `rgba(255,255,255,${opacity * 0.8})` : `rgba(30,41,59,${opacity * 0.8})`),
    propsForBackgroundLines: { stroke: isDark ? '#2d3748' : '#F1F5F9', strokeDasharray: '4' },
    propsForDots: { r: '5', strokeWidth: '2', stroke: '#6C63FF' },
  };

  const stepsChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
    propsForDots: { r: '5', strokeWidth: '2', stroke: '#4ECDC4' },
  };

  const pieData = breakdown.map((item, index) => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    minutes: item.totalMinutes,
    color: PIE_COLORS[index % PIE_COLORS.length],
    legendFontColor: isDark ? '#FFFFFF' : '#1e293b',
    legendFontSize: 12,
  }));

  const activeStats = period === 'week' ? weeklyStats : monthlyStats;

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
          Statistiques & Analyses
        </Text>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 }}>
          Progression 📊
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 13 }}>
          Suivi graphique de vos activités et de vos performances.
        </Text>
      </View>

      {/* Segmented Period Picker */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: isDark ? '#161a23' : '#e2e8f0',
          borderRadius: 16,
          padding: 4,
          marginBottom: 16,
        }}
      >
        <Pressable
          onPress={() => setPeriod('week')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: period === 'week' ? (isDark ? '#6C63FF' : '#ffffff') : 'transparent',
            shadowColor: period === 'week' ? '#000' : 'transparent',
            shadowOpacity: 0.1, shadowRadius: 4, elevation: period === 'week' ? 2 : 0,
          }}
        >
          <Text style={{ fontWeight: '700', fontSize: 13, color: period === 'week' ? (isDark ? '#ffffff' : '#1e293b') : mutedText }}>
            Cette Semaine
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPeriod('month')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: period === 'month' ? (isDark ? '#6C63FF' : '#ffffff') : 'transparent',
            shadowColor: period === 'month' ? '#000' : 'transparent',
            shadowOpacity: 0.1, shadowRadius: 4, elevation: period === 'month' ? 2 : 0,
          }}
        >
          <Text style={{ fontWeight: '700', fontSize: 13, color: period === 'month' ? (isDark ? '#ffffff' : '#1e293b') : mutedText }}>
            Ce Mois
          </Text>
        </Pressable>
      </View>

      {/* KPI Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <View style={{ width: '48%', backgroundColor: cardBg, borderRadius: 20, padding: 16, borderLeftWidth: 4, borderLeftColor: '#6C63FF' }}>
          <Text style={{ fontSize: 20 }}>🏋️‍♂️</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: textPrimary, marginTop: 4 }}>
            {activeStats.totalWorkouts}
          </Text>
          <Text style={{ fontSize: 11, color: mutedText, fontWeight: '600', marginTop: 2 }}>Séances</Text>
        </View>

        <View style={{ width: '48%', backgroundColor: cardBg, borderRadius: 20, padding: 16, borderLeftWidth: 4, borderLeftColor: '#FF6B6B' }}>
          <Text style={{ fontSize: 20 }}>🔥</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: textPrimary, marginTop: 4 }}>
            {activeStats.totalCalories.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 11, color: mutedText, fontWeight: '600', marginTop: 2 }}>Calories (kcal)</Text>
        </View>

        <View style={{ width: '48%', backgroundColor: cardBg, borderRadius: 20, padding: 16, borderLeftWidth: 4, borderLeftColor: '#F5A623' }}>
          <Text style={{ fontSize: 20 }}>⏱</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: textPrimary, marginTop: 4 }}>
            {activeStats.avgDuration} min
          </Text>
          <Text style={{ fontSize: 11, color: mutedText, fontWeight: '600', marginTop: 2 }}>Durée moyenne</Text>
        </View>

        <View style={{ width: '48%', backgroundColor: cardBg, borderRadius: 20, padding: 16, borderLeftWidth: 4, borderLeftColor: '#4ECDC4' }}>
          <Text style={{ fontSize: 20 }}>🏆</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary, marginTop: 4, textTransform: 'capitalize' }} numberOfLines={1}>
            {activeStats.mostPracticed}
          </Text>
          <Text style={{ fontSize: 11, color: mutedText, fontWeight: '600', marginTop: 2 }}>
            {period === 'week' ? 'Plus pratiqué' : `Streak : 🔥 ${longestStreak}j`}
          </Text>
        </View>
      </View>

      {/* Calories Bar Chart */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 22,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: mutedText, letterSpacing: 1, textTransform: 'uppercase' }}>
            Calories brûlées (7J)
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#6C63FF' }}>🔥 kcal</Text>
        </View>

        {caloriesData.some((d) => d.calories > 0) ? (
          <BarChart
            data={{
              labels: caloriesData.map((d) => shortDay(d.date)),
              datasets: [{ data: caloriesData.map((d) => d.calories) }],
            }}
            width={screenWidth}
            height={210}
            chartConfig={chartConfig}
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
            style={{ borderRadius: 16, marginVertical: 4, paddingRight: 16 }}
          />
        ) : (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text style={{ color: mutedText, fontSize: 13 }}>Aucune calorie enregistrée cette semaine.</Text>
          </View>
        )}
      </View>

      {/* Steps Line Chart */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 22,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: mutedText, letterSpacing: 1, textTransform: 'uppercase' }}>
            Pas quotidiens (7J)
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#4ECDC4' }}>🦶 pas</Text>
        </View>

        {stepsData.some((d) => d.steps > 0) ? (
          <LineChart
            data={{
              labels: stepsData.map((d) => shortDay(d.date)),
              datasets: [{ data: stepsData.map((d) => d.steps) }],
            }}
            width={screenWidth}
            height={210}
            chartConfig={stepsChartConfig}
            fromZero
            bezier
            style={{ borderRadius: 16, marginVertical: 4, paddingRight: 16 }}
          />
        ) : (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text style={{ color: mutedText, fontSize: 13 }}>Aucun pas enregistré cette semaine.</Text>
          </View>
        )}
      </View>

      {/* Activity Breakdown Pie Chart */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 22,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: mutedText, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          Répartition par discipline (Minutes)
        </Text>

        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={screenWidth}
            height={210}
            chartConfig={chartConfig}
            accessor="minutes"
            backgroundColor="transparent"
            paddingLeft="8"
            absolute={false}
          />
        ) : (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text style={{ color: mutedText, fontSize: 13 }}>Aucune activité enregistrée pour le moment.</Text>
          </View>
        )}
      </View>

      {/* Weight Log History Chart (if data exists) */}
      {weightHistory.length > 0 && (
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 22,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: mutedText, letterSpacing: 1, textTransform: 'uppercase' }}>
              Évolution du poids (kg)
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#F5A623' }}>⚖️ Poids</Text>
          </View>

          <LineChart
            data={{
              labels: weightHistory.map((w) => w.date.slice(5)),
              datasets: [{ data: weightHistory.map((w) => w.weight) }],
            }}
            width={screenWidth}
            height={190}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(245, 166, 35, ${opacity})`,
              propsForDots: { r: '5', strokeWidth: '2', stroke: '#F5A623' },
            }}
            bezier
            style={{ borderRadius: 16, marginVertical: 4, paddingRight: 16 }}
          />
        </View>
      )}
    </ScrollView>
  );
}