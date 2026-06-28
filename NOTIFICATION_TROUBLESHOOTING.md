# Notification Troubleshooting Guide

## Why You Can't Access Notifications

Based on your app's architecture, here are the most likely reasons.

### 1. **Notification Permissions Not Granted**

The app needs explicit permission to send notifications on your device.

**Fix**

- Open your **Settings** → **Apps** → **Todoist**
- Go to **Permissions** → **Notifications**
- Toggle **Allow notifications** ON
- Restart the app

### 2. **Notification System Not Initialized**

Notifications require you to be logged in first. The initialization happens only after authentication.

**Check**

- Make sure you're **signed in** to the app
- Check your browser console (F12) for logs starting with `🚀 Initializing notification system...`
- Look for message: `✓ Notification system ready`

### 3. **No Notifications Triggered Yet**

Notifications only appear when:

- ✅ You **complete a task** → Shows "Task Completed" notification
- ✅ A task is **due today** → Shows reminder notification
- ✅ A task **becomes overdue** → Shows overdue notification

**Test This**: See section **Testing Notifications** below.

---

## Testing Notifications

### Quick Test (Recommended)

1. Open the app and **sign in**
2. Click your **profile icon** (top-right corner)
3. Tap **"📢 Test Notifications"** button
4. A test notification should appear on your device
5. If you see it, notifications are working ✓

### If Test Fails

**Check Permissions**

```text
Settings → Apps → Todoist → Permissions → Notifications
```

**Check Logs**

- Open browser DevTools (F12) or Expo console
- Look for error messages starting with `❌`
- Share these logs if you need help

---

## How Notifications Work in Your App

| Event | Notification |
|------:|:-------------|
| **Task Completed** | "✓ Task Completed - Great job! {task name} is done." |
| **Task Due Today** | "Assignment Due Today - {task name} is due today." |
| **Task Overdue** | "Assignment Overdue - {task name} is overdue." |
| **Task Due at Specific Time** | Shows at the exact due date/time |

---

## Troubleshooting Steps

### Step 1: Verify Permissions

```text
Android: Settings > Apps > Todoist > Permissions > Notifications (ON)
iOS: Settings > Todoist > Notifications (Allow)
```

### Step 2: Check Browser Console

Press `F12` to open DevTools and look for:

```text
🚀 Initializing notification system...
✓ Notification channels configured
✓ Notification permissions granted
✓ Notification system ready
```

### Step 3: Send a Test Notification

1. Go to Profile
2. Tap "📢 Test Notifications"
3. Check if you get a notification on your device

### Step 4: Complete a Task

1. Go to "Assignments" view
2. Add a new task
3. Tap the task to mark it complete
4. You should see a notification: "✓ Task Completed"

### Step 4b: Add Due Date

1. Create a new task (not implemented in current UI, but backend supports it)
2. When the due date passes, you'll get a reminder

---

## Common Issues

### Issue: "This app hasn't received any notifications yet"

**Cause**: You haven't completed any tasks or received any notifications.

**Fix**: Complete a task in your app to trigger a notification.

### Issue: Permissions Were Denied

**Cause**: You may have denied permission when first prompted.

**Fix**

1. Go to Settings > Apps > Todoist > Permissions
2. Enable Notifications
3. Restart the app

### Issue: Test Notification Shows But Others Don't

**Cause**: App may not be properly handling task completion.

**Fix**

1. Try completing a task
2. Check browser console for errors (F12)
3. Verify task state is being saved

### Issue: Notifications Work on Some Devices But Not Others

**Cause**: Device-specific permission or battery optimization settings.

**Fix**

1. Check notification settings
2. Add app to battery optimization whitelist
3. Disable "Do Not Disturb" mode

---

## Technical Details

### Notification Channels (Android)

Your app uses 3 notification channels:

| Channel | Importance | Sound |
|:--------|:----------:|:-----:|
| **default** | HIGH | Yes |
| **task-reminders** | HIGH | Yes |
| **task-completions** | DEFAULT | Yes |

### How It Works

1. App initializes `expo-notifications` on startup
2. Requests permission from user
3. Sets up notification listeners
4. Fires notifications on task events
5. System stores notification history

---

## Advanced: Console Commands

If you're on **web** (Expo web), you can test in browser console (F12):

```javascript
// Send test notification (must be in App component context)
// This is handled by the button, but you can also run:

// Check notification status
checkNotificationStatus()

// Send test notification
sendTestNotification()
```

---

## Still Not Working?

1. **Check notification settings on device** ← Most common issue
2. **Try restarting the app**
3. **Reinstall the app** (clears any permission caches)
4. **Check browser console for errors** (F12)
5. **Complete a task** to trigger an actual notification

If you still have issues, check the logs in your browser console for detailed error messages.
