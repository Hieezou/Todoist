import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { firebaseConfig, cloudEnabled } from '../firebaseConfig';

let messaging = null;

// Firebase messaging is only available on web if cloud sync is enabled.
// We keep this lazy setup for potential future Firebase push messaging.
if (cloudEnabled && Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    import('firebase/compat/app').then(({ initializeApp }) => {
      import('firebase/compat/messaging').then(({ getMessaging }) => {
        const app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
        console.log('✓ Firebase Messaging initialized');
      });
    }).catch(error => {
      console.warn('Firebase Messaging not available:', error.message);
    });
  } catch (error) {
    console.warn('Firebase Messaging not available on this platform');
  }
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Initialize push notifications
 * Must be called on app startup
 */
export const initializeNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });

    // Create a channel for task reminders
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });

    // Create a channel for task completions
    await Notifications.setNotificationChannelAsync('task-completions', {
      name: 'Task Completions',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100, 100],
      lightColor: '#2196F3',
      sound: 'default',
      enableVibrate: true,
    });
  }
};

/**
 * Request user permission for notifications
 * Returns true if permission granted, false otherwise
 */
export const requestNotificationPermissions = async () => {
  try {
    if (Platform.OS === 'android') {
      console.log('Android notification permissions skipped in Expo Go');
      return true;
    }

    const result = await Notifications.requestPermissionsAsync();
    const status = result.status || (result.granted ? 'granted' : 'denied');
    console.log('Notification permission status:', status);
    if (status === 'granted') {
      console.log('✓ Notifications enabled successfully');
      return true;
    }
    console.warn('⚠️ Notification permission denied or not available. Status:', status);
    return false;
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error?.message || error);
    return false;
  }
};

/**
 * Send a local notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body/message
 * @param {string} channel - Notification channel ('default', 'task-reminders', 'task-completions')
 * @param {object} data - Additional data to attach to notification
 */
export const sendLocalNotification = async (
  title,
  body,
  channel = 'default',
  data = {}
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: null, // null trigger = send immediately
      ...(Platform.OS === 'android' && { channelId: channel }),
    });
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
};

/**
 * Schedule a delayed notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body/message
 * @param {number} secondsFromNow - Seconds to delay before sending
 * @param {string} channel - Notification channel
 * @param {object} data - Additional data
 */
export const scheduleNotification = async (
  title,
  body,
  secondsFromNow = 10,
  channel = 'default',
  data = {}
) => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: {
        seconds: secondsFromNow,
      },
      ...(Platform.OS === 'android' && { channelId: channel }),
    });
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Schedule a notification for a specific time
 * @param {Date} date - Date and time to send notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} channel - Notification channel
 * @param {object} data - Additional data
 */
export const scheduleNotificationAt = async (
  date,
  title,
  body,
  channel = 'default',
  data = {}
) => {
  try {
    const now = new Date();
    const secondsFromNow = Math.max(1, Math.floor((date - now) / 1000));

    return await scheduleNotification(title, body, secondsFromNow, channel, data);
  } catch (error) {
    console.error('Error scheduling notification at specific time:', error);
    return null;
  }
};

/**
 * Send task reminder notification
 * @param {object} task - Task object with id, title, dueDate properties
 */
/**
 * Send task completion notification
 * @param {string} taskTitle - Title of completed task
 */
export const sendTaskCompletionNotification = async (taskTitle) => {
  const title = '✓ Task Completed';
  const body = `Great job! "${taskTitle}" is done.`;
  const data = { type: 'task-completion' };

  await sendLocalNotification(title, body, 'task-completions', data);
};

/**
 * Cancel a scheduled notification
 * @param {string} notificationId - ID of notification to cancel
 */
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

/**
 * Handle remote messages from Firebase
 * Automatically processes incoming FCM messages
 */
export const setupFirebaseMessaging = () => {
  if (!cloudEnabled || !messaging || Platform.OS !== 'web') return null;

  try {
    if (typeof window !== 'undefined') {
      const unsubscribe = messaging.onMessage?.((payload) => {
        console.log('Message received from Firebase:', payload);
        const { notification, data } = payload;

        // Show notification using Expo
        if (notification) {
          sendLocalNotification(
            notification.title || 'Notification',
            notification.body || '',
            'default',
            data
          );
        }
      });

      return unsubscribe;
    }

    return null;
  } catch (error) {
    console.warn('Firebase messaging setup skipped:', error.message);
    return null;
  }
};

/**
 * Set up notification event listeners
 * Call this in useEffect in your main component
 * @returns {function} Cleanup function to remove listeners
 */
export const setupNotificationListeners = () => {
  // Handle notification received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received (foreground):', notification);
      // Handle foreground notification here
      // You could update app state, trigger sound, etc.
    }
  );

  // Handle user interaction with notification
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      const { data } = response.notification.request.content;
      // Handle notification tap - navigate to relevant screen, etc.
      if (data.taskId) {
        console.log('User tapped notification for task:', data.taskId);
        // You could navigate to task details here
      }
    });

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};
