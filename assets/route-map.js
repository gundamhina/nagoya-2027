/*
 * 動線地圖：新舊版共用的畫圖程式（需要先載入 Leaflet 與 trip-data.js）。
 * 地點與路線在 trip-data.js 的 overview.mapPoints／mapLines；顏色與標籤樣式由各版傳入。
 */
window.drawRouteMap = function (el, T, style) {
  if (!el || !window.L) return null;
  var P = T.overview.mapPoints;
  var map = L.map(el, { scrollWheelZoom: false });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors", maxZoom: 18
  }).addTo(map);

  function at(k) { return [P[k][0], P[k][1]]; }
  T.overview.mapLines.forEach(function (line) {
    L.polyline(line.path.map(at), {
      color: line.kind === "air" ? style.air : style.ground,
      weight: line.kind === "drive" ? 3 : 2,
      dashArray: line.kind === "drive" ? null : "4 5",
      opacity: line.kind === "day" ? 0.7 : 0.9
    }).addTo(map);
  });

  Object.keys(P).forEach(function (k) {
    L.marker(at(k), {
      icon: L.divIcon({ className: "", html: '<span class="' + style.pin + (P[k][3] ? " air" : "") + '">' + P[k][2] + "</span>", iconSize: null })
    }).addTo(map);
  });

  map.fitBounds(Object.keys(P).map(at), { padding: [56, 56] });
  return map;
};
