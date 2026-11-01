// Lets the Order page show its "ready" notification on Android, which needs
// a service worker for notifications. No caching and no push yet.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => windows[0]?.focus())
  );
});
