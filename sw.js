/*
 * 離線用的 service worker：用手機打開過一次網站之後，在日本沒網路也能看行程、地圖、緊急電話。
 *
 * 網頁本身（index.html）先上網抓最新的，抓不到才用快取，所以改版後一連上網就是新版。
 * assets 底下的檔案網址都帶版本號（?v2.xx），內容不會變，直接用快取；同一個檔案換新版本號時，舊的那份刪掉。
 * 安裝時讀 index.html 和 trip-data.js 裡引用到的檔案先存起來；版本號只在 index.html 改，這裡不用跟著改。
 * Google 字型先用快取，背景再更新。
 */
var CACHE = "nagoya2027";

function collect(text, base) {
  var out = [];
  text.replace(/["'(](assets\/[^"'()#\s]+\.(?:css|js|png|jpe?g|webp|svg)(?:\?[^"'()#\s]*)?)/g, function (m, u) { out.push(base + u); });
  return out;
}

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return fetch("index.html", { cache: "no-store" }).then(function (r) {
      var page = r.clone();
      return r.text().then(function (html) {
        var urls = ["./"].concat(collect(html, ""));
        var data = urls.filter(function (u) { return u.indexOf("assets/trip-data.js") === 0; })[0];
        var more = data ? fetch(data).then(function (d) { return d.text(); }).then(function (t) { return collect(t, ""); }).catch(function () { return []; }) : Promise.resolve([]);
        return Promise.all([c.put("index.html", page), more]).then(function (res) {
          var all = urls.concat(res[1]).filter(function (u, i, a) { return a.indexOf(u) === i; });
          /* 一個檔案抓不到不影響其他檔案 */
          return Promise.all(all.map(function (u) { return c.add(u).catch(function () {}); }));
        });
      });
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* 同一個檔案的舊版本號從快取刪掉，只留最新一份 */
function dropOld(c, url) {
  var u = new URL(url);
  if (!u.search) return;
  c.keys().then(function (reqs) {
    reqs.forEach(function (q) {
      var o = new URL(q.url);
      if (o.pathname === u.pathname && o.search !== u.search) c.delete(q);
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  /* 網頁：先上網，失敗才用快取 */
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (r) {
      var copy = r.clone();
      caches.open(CACHE).then(function (c) { c.put("index.html", copy); });
      return r;
    }).catch(function () {
      return caches.open(CACHE).then(function (c) { return c.match("index.html"); });
    }));
    return;
  }

  /* Google 字型：先給快取，背景更新 */
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (r) { c.put(req, r.clone()); return r; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }

  /* 本站其他檔案：先用快取，沒有才上網，抓到就存 */
  if (url.origin === self.location.origin) {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (r) {
          if (r.ok) { c.put(req, r.clone()); dropOld(c, req.url); }
          return r;
        });
      });
    }));
  }
});
