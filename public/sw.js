/**
 * AN-3: Offline sync - cache courseLessons, queue assignmentSubmissions
 */
const CACHE_NAME = "fss-v1";
const URLS_TO_CACHE = ["/", "/student/courses"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(URLS_TO_CACHE)));
});

self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/") || e.request.url.includes("/_next/")) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok && e.request.method === "GET") caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
      return res;
    }).catch(() => caches.match(e.request)))
  );
});

self.addEventListener("sync", (e) => {
  if (e.tag === "assignment-queue") {
    e.waitUntil(
      // In real app, read IndexedDB queue and POST to /api/assignments/submit
      Promise.resolve().then(() => console.log("Sync assignment queue"))
    );
  }
});
