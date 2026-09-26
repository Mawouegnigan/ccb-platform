self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Volontairement sans mise en cache : le service worker sert uniquement à
// rendre l'app installable, pas à stocker de contenu (pour ne pas
// reproduire le souci de contenu périmé déjà rencontré avec la carte PDF).
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});