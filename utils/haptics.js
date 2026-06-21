import * as Haptics from 'expo-haptics';

async function safeCall(fn, ...args) {
  try {
    if (fn && typeof fn === 'function') {
      // some environments may not expose the native module - guard against that
      return await fn(...args);
    }
  } catch (e) {
    // swallow errors to avoid crashing the app in Expo Go or unsupported runtimes
    console.debug('Haptics disabled or failed:', e && e.message);
  }
}

export const impact = (style) => safeCall(Haptics.impactAsync, style);
export const notification = (type) => safeCall(Haptics.notificationAsync, type);

export const isAvailable = async () => {
  try {
    if (!Haptics || typeof Haptics.impactAsync !== 'function') return false;
    // Try a minimal call - this may trigger a short haptic on a device,
    // but will throw or reject in unsupported environments.
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return true;
  } catch (e) {
    return false;
  }
};

export default {
  impact,
  notification,
};
