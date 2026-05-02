// Bridges between the app and the OS for scheduled reminder notifications.
// On native (Capacitor), uses LocalNotifications so reminders fire while the
// app is backgrounded or closed. On web, posts to the service worker.

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const isNative = () => Capacitor?.isNativePlatform?.() === true;

// LocalNotifications requires integer IDs; reminders use strings.
const intId = (str) => {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.trunc((h << 5) - h + s.codePointAt(i));
  return Math.abs(h) || 1;
};

const swReady = async () => {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
};

export const pushSupported = () =>
  isNative() || ('serviceWorker' in navigator && typeof Notification !== 'undefined');

export const pushPermission = () => {
  if (isNative()) return 'unknown'; // resolved async; treat as available
  return typeof Notification === 'undefined' ? 'denied' : Notification.permission;
};

// Async, works on both native and web. Returns 'granted' | 'denied' | 'default'.
export const checkPushPermission = async () => {
  if (isNative()) {
    const res = await LocalNotifications.checkPermissions();
    if (res.display === 'granted') return 'granted';
    if (res.display === 'denied') return 'denied';
    return 'default'; // 'prompt' or 'prompt-with-rationale'
  }
  if (typeof Notification === 'undefined') return 'denied';
  return Notification.permission;
};

export const requestPushPermission = async () => {
  if (isNative()) {
    const res = await LocalNotifications.requestPermissions();
    return res.display === 'granted' ? 'granted' : 'denied';
  }
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

const reminderToNative = (r) => ({
  id: intId(r.id),
  title: r.title,
  body: r.notes || 'Reminder is due',
  schedule: { at: new Date(r.when) },
  extra: { reminderId: r.id, priority: r.priority || 'medium' },
});

// Sends one reminder schedule.
export const scheduleViaSw = async (reminder) => {
  if (isNative()) {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return false;
    await LocalNotifications.schedule({ notifications: [reminderToNative(reminder)] });
    return true;
  }
  if (Notification.permission !== 'granted') return false;
  const reg = await swReady();
  if (!reg?.active) return false;
  reg.active.postMessage(reminderToMessage(reminder));
  return true;
};

export const cancelViaSw = async (id) => {
  if (isNative()) {
    await LocalNotifications.cancel({ notifications: [{ id: intId(id) }] });
    return;
  }
  const reg = await swReady();
  if (!reg?.active) return;
  reg.active.postMessage({ type: 'cancel', id });
};

// Replaces the OS-side schedule with the current pending set.
export const syncAllViaSw = async (reminders) => {
  const pending = reminders.filter(
    (r) => !r.done && !r.fired && r.when && new Date(r.when).getTime() > Date.now()
  );

  if (isNative()) {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return false;
    const existing = await LocalNotifications.getPending();
    if (existing.notifications.length) {
      await LocalNotifications.cancel({
        notifications: existing.notifications.map((n) => ({ id: n.id })),
      });
    }
    if (pending.length) {
      await LocalNotifications.schedule({ notifications: pending.map(reminderToNative) });
    }
    return true;
  }

  if (Notification.permission !== 'granted') return false;
  const reg = await swReady();
  if (!reg?.active) return false;
  const messages = pending.map(reminderToMessage).map(({ type, ...rest }) => rest);
  reg.active.postMessage({ type: 'sync-all', reminders: messages });
  return true;
};
