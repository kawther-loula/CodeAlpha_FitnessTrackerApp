import { View, Text } from 'react-native';

interface ProgressBarProps {
  label: string;
  value: number;
  goal: number;
  unit?: string;
  color?: string;
}

export default function ProgressBar({ label, value, goal, unit = '', color = 'bg-primary' }: ProgressBarProps) {
  const percent = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;

  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs uppercase tracking-[1px] text-muted">{label}</Text>
        <Text className="text-xs text-muted">
          {value.toLocaleString()} / {goal.toLocaleString()} {unit} · {percent}%
        </Text>
      </View>
      <View className="h-3 rounded-full bg-border overflow-hidden">
        <View className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </View>
    </View>
  );
}