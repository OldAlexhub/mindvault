import notifee, {
  AndroidImportance,
  TriggerType,
  RepeatFrequency,
  AuthorizationStatus,
} from '@notifee/react-native';
import type { TimestampTrigger } from '@notifee/react-native';

const CHANNEL_ID = 'mindvault_daily';
const CHANNEL_NAME = 'Daily Brain Reminders';

// Three daily reminder times: 9am, 1pm, 7pm
const REMINDER_TIMES: Array<{ hour: number; minute: number; id: string }> = [
  { hour: 9, minute: 0, id: 'mindvault_morning' },
  { hour: 13, minute: 0, id: 'mindvault_afternoon' },
  { hour: 19, minute: 0, id: 'mindvault_evening' },
];

const REMINDER_MESSAGES = [
  'Have you challenged your brain today?',
  'Your Daily Vault is waiting. Can you crack it?',
  'Keep your streak alive! Play MindVault now.',
];

async function ensureChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    importance: AndroidImportance.DEFAULT,
    vibration: true,
  });
}

function nextTriggerDate(hour: number, minute: number): Date {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }
  return trigger;
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

export async function scheduleDailyReminders(): Promise<void> {
  try {
    await ensureChannel();
    // Cancel any previously scheduled reminders before re-scheduling
    await cancelDailyReminders();

    for (let i = 0; i < REMINDER_TIMES.length; i++) {
      const { hour, minute, id } = REMINDER_TIMES[i];
      const triggerDate = nextTriggerDate(hour, minute);

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
        alarmManager: { allowWhileIdle: true },
      };

      await notifee.createTriggerNotification(
        {
          id,
          title: 'MindVault',
          body: REMINDER_MESSAGES[i],
          android: {
            channelId: CHANNEL_ID,
            smallIcon: 'ic_launcher',
            pressAction: { id: 'default' },
          },
        },
        trigger,
      );
    }
  } catch {
    // Never crash the app over a notification failure
  }
}

export async function cancelDailyReminders(): Promise<void> {
  try {
    for (const { id } of REMINDER_TIMES) {
      await notifee.cancelTriggerNotification(id);
    }
  } catch {
    // Ignore cancellation errors
  }
}

// Call once on app launch: request permission then schedule reminders.
export async function initNotifications(): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (granted) {
      await scheduleDailyReminders();
    }
  } catch {
    // Notification init must never crash the app
  }
}
