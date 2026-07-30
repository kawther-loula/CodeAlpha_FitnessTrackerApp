import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { NotificationBehavior } from 'expo-notifications';

const REMINDER_CHANNEL_ID = 'daily-reminders';

Notifications.setNotificationHandler({
  handleNotification: async (): Promise<NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureReminderChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Rappels quotidiens',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const currentPermission = await Notifications.getPermissionsAsync();
  if (currentPermission.granted) return true;

  const requestedPermission = await Notifications.requestPermissionsAsync();
  return requestedPermission.granted;
}

export async function scheduleDailyReminders(): Promise<void> {
  await ensureReminderChannel();
  await cancelAllReminders();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rappel entraînement',
      body: "C'est le moment de bouger un peu.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 0,
      channelId: REMINDER_CHANNEL_ID,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rappel hydratation',
      body: "Pense à boire de l'eau.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 14,
      minute: 0,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
