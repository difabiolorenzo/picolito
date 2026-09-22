/**
 * Picolito — Service worker (offline / PWA)
 *
 * Stratégie réseau d'abord (network-first) : en ligne on sert toujours la dernière
 * version (développement local inclus, pas de cache périmé), en hors-ligne on retombe
 * sur le cache. Les GET sont mis en cache au fil de l'eau ; le shell est pré-caché
 * à l'installation.
 */

const CACHE = "picolito-cache-v1";

const PRECACHE = [
    "./",
    "./index.html",
    "./Manifest.webmanifest",
    "./src/css/radium.css",
    "./src/css/main.css",
    "./src/js/main.js",
    "./src/js/cookie.js",
    "./src/js/picolito.js",
    "./src/js/weakest_link.js",
    "./src/js/lang.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

function isCacheEligible(url) {
    return url.startsWith(self.origin)
        || url.startsWith("https://cdn.jsdelivr.net/")
        || url.startsWith("https://code.jquery.com/");
}

async function networkFirst(request) {
    const cache = await caches.open(CACHE);
    try {
        const response = await fetch(request);
        if (response && isCacheEligible(request.url)) {
            if (response.type === "opaque" || response.ok) {
                cache.put(request, response.clone());
            }
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) { return cached; }
        if (request.mode === "navigate") {
            const index = await cache.match("./index.html") || await cache.match("./");
            if (index) { return index; }
        }
        return Response.error();
    }
}

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") { return; }
    event.respondWith(networkFirst(event.request));
});