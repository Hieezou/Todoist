import {
  initializeNotifications,
  requestNotificationPermissions,
  setupNotificationListeners,
  setupFirebaseMessaging,
  sendLocalNotification,
  getAllScheduledNotifications,
} from './notificationService';

/**
 * Test notification function for debugging
 * Sends a test notification immediately
 */
export const sendTestNotification = async () => {
  console.log('📢 Sending test notification...');
  try {
    await sendLocalNotification(
      'Test Notification',
      'If you see this, notifications are working!',
      'default',
      { type: 'test', timestamp: new Date().toISOString() }
    );
    console.log('✓ Test notification sent successfully');
  } catch (error) {
    console.error('❌ Failed to send test notification:', error.message);
  }
};

/**
 * Check notification status and permissions
 */
export const checkNotificationStatus = async () => {
  try {
    console.log('🔍 Checking notification status...');
    const scheduled = await getAllScheduledNotifications();
    console.log(`  • Scheduled notifications: ${scheduled.length}`);
    console.log('✓ Notification status checked');
    return { scheduledCount: scheduled.length };
  } catch (error) {
    console.error('❌ Failed to check notification status:', error.message);
    return null;
  }
};

/**
 * Initialize all notification systems on app startup
 * Call this in useEffect on app initialization
 * 
 * Usage:
 * useEffect(() => {
 *   initializeNotificationSystem();
 * }, []);
 * 
 * To test notifications:
 * 1. Open Chrome DevTools (if on web) or Expo console
 * 2. Call: sendTestNotification()
 */
export const initializeNotificationSystem = async () => {
  try {
    console.log('🚀 Initializing notification system...');

    // Set up notification channels and handlers
    await initializeNotifications();
    console.log('✓ Notification channels configured');

    // Request permissions from user
    const permissionGranted = await requestNotificationPermissions();
    if (permissionGranted) {
      console.log('✓ Notification permissions granted');
    } else {
      console.log('⚠️ Notification permissions not granted - notifications may not work');
      console.log('   → Check app settings: Settings > Apps > Todoist > Permissions > Notifications');
    }

    // Set up event listeners for incoming notifications
    const notificationCleanup = setupNotificationListeners();

    // Set up Firebase Cloud Messaging
    const firebaseCleanup = setupFirebaseMessaging();

    console.log('✓ Notification system ready');
    console.log('📝 To test notifications, call: sendTestNotification()');

    // Return combined cleanup function
    return () => {
      if (typeof notificationCleanup === 'function') {
        notificationCleanup();
      }
      if (typeof firebaseCleanup === 'function') {
        firebaseCleanup();
      }
    };
  } catch (error) {
    console.error('❌ Error initializing notification system:', error);
    return null;
  }
};

export default initializeNotificationSystem;
