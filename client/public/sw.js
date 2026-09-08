self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("push", event => {
  const payload = event.data ? event.data.json() : { title: "CROSAIM", body: "Tienes un nuevo aviso del equipo." };
  event.waitUntil(self.registration.showNotification(payload.title || "CROSAIM", {
    body: payload.body || payload.detail || "Nuevo aviso del equipo.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.tag || "crosaim-notification",
    data: { url: payload.url || "/" },
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const existing = list.find(client => "focus" in client);
    if (existing) return existing.focus();
    return clients.openWindow(event.notification.data?.url || "/");
  }));
});
