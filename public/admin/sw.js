const CACHE_NAME = "chicken-bar-admin-v1";
const ADMIN_SHELL = [
  "/admin/",
  "/admin/offline.html",
  "/admin/manifest.webmanifest",
  "/logo/badge-final.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ADMIN_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname === "/admin" || url.pathname === "/admin/") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put("/admin/", copy));
          }
          return response;
        })
        .catch(async () => (await caches.match("/admin/")) || (await caches.match("/admin/offline.html")))
    );
    return;
  }

  if (url.pathname.startsWith("/admin/")) return;
  if (!url.pathname.startsWith("/_next/") && !url.pathname.startsWith("/logo/")) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkResponse;
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "A new order has arrived." };
  }

  const title = payload.title || "New Order!";
  const options = {
    body: payload.body || "A new order has arrived.",
    icon: "/logo/badge-final.png",
    badge: "/logo/badge-final.png",
    tag: payload.tag || "chicken-bar-new-order",
    renotify: true,
    data: { url: payload.url || "/admin/orders" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/admin/orders", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => client.url.startsWith(self.location.origin));
      if (matchingClient) {
        return matchingClient.focus().then(() => matchingClient.navigate(targetUrl));
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
