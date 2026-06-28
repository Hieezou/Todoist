import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { firebaseConfig, cloudEnabled } from '../firebaseConfig';

let messaging = null;

// Firebase messaging is only available on web
// For native platforms (iOS/Android), we use expo-notifications
if (cloudEnabled && Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    // Lazy load Firebase for web only
    import('firebase/app').then(({ initializeApp }) => {
      import('firebase/messaging/compat').then(({ getMessaging }) => {
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
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Notification permission status:', status);
    if (status === 'granted') {
      console.log('✓ Notifications enabled successfully');
      return true;
    } else {
      console.warn('⚠️ Notification permission denied or not available. Status:', status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error.message);
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
export const sendTaskReminderNotification = async (task) => {
  const title = 'Task Reminder';
  const body = `Don't forget: ${task.title}`;
  const data = {
    taskId: task.id,
    taskTitle: task.title,
    type: 'task-reminder',
  };

  await sendLocalNotification(title, body, 'task-reminders', data);
};

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
 * Send urgent task alert
 * @param {object} task - Task object
 */
export const sendUrgentTaskAlert = async (task) => {
  const title = '⚠️ Urgent: Task Due Soon';
  const body = `${task.title} is due very soon!`;
  const data = {
    taskId: task.id,
    taskTitle: task.title,
    type: 'urgent-alert',
  };

  await sendLocalNotification(title, body, 'task-reminders', data);
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
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

/**
 * Get Firebase Cloud Messaging token for push notifications
 * @returns {Promise<string|null>} FCM token or null if unavailable
 */
export const getFirebaseMessagingToken = async () => {
  if (!cloudEnabled || Platform.OS !== 'web') {
    return null;
  }

  try {
    const { getMessaging } = await import('firebase/messaging/compat');
    const token = await getMessaging(messaging).getToken({
      vapidKey: 'BJKtfIYO-qJlMfXZHJAm0LSjr2rBLcXP8t0V-7Xw7v8B_f5bqsqxWyX9xGo1Qg6xJ8y5pL7g5h4i9j2k1m2n3',
    });
    console.log('✓ FCM token obtained:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.warn('FCM token unavailable:', error.message);
    return null;
  }
};

/**
 * Store FCM token in Firestore for the current user
 * @param {string} userId - User ID
 * @param {string} token - FCM token
 */
export const storeFirebaseMessagingToken = async (userId, token) => {
  if (!cloudEnabled || !token || Platform.OS !== 'web') return;

  try {
    const { getFirestore } = await import('firebase/firestore');
    const { doc, setDoc } = await import('firebase/firestore');
    const db = getFirestore();
    const userTokenRef = doc(db, 'users', userId, 'devices', 'messaging-token');
    await setDoc(userTokenRef, {
      token,
      platform: Platform.OS,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('✓ FCM token stored in Firestore');
  } catch (error) {
    console.warn('Error storing FCM token:', error.message);
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

/**
 * Get all scheduled notifications
 */
export const getAllScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};
