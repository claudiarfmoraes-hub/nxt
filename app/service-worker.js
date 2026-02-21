const CACHE_NAME = 'nxt-lojas-cache-v13';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/logo nxt.png',
  '/dados/lojas.json',
  '/dados/produtos.json'
];

self.addEventListener('install', event => {
  // Força ativação imediata
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Ignorar requisições de API e POST
  if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
    return;
  }

  // Estratégia: Network First (busca online primeiro, fallback para cache)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se obteve resposta válida, atualiza o cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Se falhou (offline), tenta buscar do cache
        return caches.match(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  // Assume controle imediato de todas as páginas
  event.waitUntil(
    Promise.all([
      // Limpa caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assume controle de todas as abas abertas
      self.clients.claim()
    ])
  );
});
