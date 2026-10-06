self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title || "Moon Candles", {
      body: data.body || "",
      icon: "/icon-512.png",
      data: { url: data.url || "/admin/orders" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin/orders";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          try { c.navigate(url); } catch (e) {}
          return c.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});