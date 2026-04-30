const CACHE = 'daily-pulse-v2';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/favicon.svg'];

// ---- Install / activate / fetch ----

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((m) => m || caches.match('/')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((m) => m || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }))
  );
});

// ---- Scheduled reminders ----

const scheduled = new Map(); // id -> timeout id (used as fallback when Notification Triggers unsupported)

const supportsTriggers = () =>
  typeof Notification !== 'undefined' && 'showTrigger' in Notification.prototype;

const prefixTitle = (title, priority) =>
  (priority === 'high' ? '🚨 ' : '⏰ ') + (title || 'Reminder');

const showReminderNow = (data) => {
  const { id, title, body, priority } = data;
  return self.registration.showNotification(prefixTitle(title, priority), {
    body: body || 'Reminder is due',
    tag: id,
    icon: '/icon.svg',
    badge: '/icon.svg',
    requireInteraction: priority === 'high',
    data: { id, when: data.when, priority },
  });
};

const scheduleReminder = async (data) => {
  cancelReminder(data.id);
  const ts = new Date(data.when).getTime();
  const ms = ts - Date.now();

  if (ms <= 0) return showReminderNow(data);

  // Prefer the Notification Triggers API — survives SW restarts.
  if (supportsTriggers()) {
    try {
      await self.registration.showNotification(prefixTitle(data.title, data.priority), {
        body: data.body || 'Reminder is due',
        tag: data.id,
        icon: '/icon.svg',
        badge: '/icon.svg',
        requireInteraction: data.priority === 'high',
        showTrigger: new TimestampTrigger(ts),
        data: { id: data.id, when: data.when, priority: data.priority, scheduled: true },
      });
      return;
    } catch (e) {
      // Fall through to setTimeout
    }
  }

  // Fallback: setTimeout (only fires while SW is alive)
  const timeoutId = setTimeout(() => {
    scheduled.delete(data.id);
    showReminderNow(data);
  }, ms);
  scheduled.set(data.id, timeoutId);
};

const cancelReminder = async (id) => {
  const existing = scheduled.get(id);
  if (existing) {
    clearTimeout(existing);
    scheduled.delete(id);
  }
  // Also clear any already-scheduled (Notification Triggers) entry by tag
  try {
    const all = await self.registration.getNotifications({ tag: id, includeTriggered: true });
    for (const n of all) n.close();
  } catch { /* ignore */ }
};

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'schedule') {
    event.waitUntil(scheduleReminder(data));
  } else if (data.type === 'cancel') {
    event.waitUntil(cancelReminder(data.id));
  } else if (data.type === 'sync-all') {
    // Replace the entire pending set
    event.waitUntil((async () => {
      // Cancel everything currently scheduled (untriggered)
      try {
        const all = await self.registration.getNotifications({ includeTriggered: false });
        for (const n of all) n.close();
      } catch { /* ignore */ }
      for (const [id] of scheduled) {
        clearTimeout(scheduled.get(id));
        scheduled.delete(id);
      }
      for (const r of data.reminders || []) {
        await scheduleReminder(r);
      }
    })());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const id = event.notification?.data?.id;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Tell any open client which reminder fired so it can mark fired/show alert
      for (const c of clients) {
        c.postMessage({ type: 'reminder-clicked', id });
      }
      const existing = clients.find((c) => new URL(c.url).origin === self.location.origin);
      if (existing) return existing.focus();
      return self.clients.openWindow('/');
    })
  );
});
