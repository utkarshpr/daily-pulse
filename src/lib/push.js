// Bridges between the app and the service worker for scheduled reminder
// notifications. Falls back gracefully when SW or Notifications are unavailable.

const swReady = async () => {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
};

export const pushSupported = () =>
  'serviceWorker' in navigator && typeof Notification !== 'undefined';

export const pushPermission = () =>
  typeof Notification !== 'undefined' ? Notification.permission : 'denied';

export const requestPushPermission = async () => {
  if (typeof Notification === 'undefined') return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
};

const reminderToMessage = (r) => ({
  type: 'schedule',
  id: r.id,
  when: r.when,
  title: r.title,
  body: r.notes || 'Reminder is due',
  priority: r.priority || 'medium',
});

// Sends one reminder schedule.
export const scheduleViaSw = async (reminder) => {
  if (Notification.permission !== 'granted') return false;
  const reg = await swReady();
  if (!reg?.active) return false;
  reg.active.postMessage(reminderToMessage(reminder));
  return true;
};

export const cancelViaSw = async (id) => {
  const reg = await swReady();
  if (!reg?.active) return;
  reg.active.postMessage({ type: 'cancel', id });
};

// Replaces the SW's full schedule with the current pending set.
export const syncAllViaSw = async (reminders) => {
  if (Notification.permission !== 'granted') return false;
  const reg = await swReady();
  if (!reg?.active) return false;
  const pending = reminders
    .filter((r) => !r.done && !r.fired && r.when && new Date(r.when).getTime() > Date.now())
    .map(reminderToMessage)
    .map(({ type, ...rest }) => rest);
  reg.active.postMessage({ type: 'sync-all', reminders: pending });
  return true;
};
