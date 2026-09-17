/*
 * 舊版（v1）的樣板：讀 assets/trip-data.js，依頁面上的 data-trip 佔位產生內容。
 * 這裡只管排版；內容請改 trip-data.js。
 */
(function (T) {
  function attr(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function each(list, fn) { return list.map(fn).join(""); }
  function group(id) { return T.groups.filter(function (g) { return g.id === id; })[0]; }
  function crewTag(id) { var g = group(id); return '<span class="crew-tag crew-' + id + '" title="' + g.label + '">' + g.tag + "</span>"; }
  function crewTags(ids) { return '<span class="crew-tags">' + each(ids, crewTag) + "</span>"; }
  function ext(href, text) { return '<a href="' + attr(href) + '" target="_blank" rel="noopener noreferrer">' + text + "</a>"; }
  function title(d) { return d.title + (d.choice ? '<br><span class="plan-choice">' + d.choice + "</span>" : ""); }
  function dayId(d) { var p = d.date.split("/"); return "day-" + ("0" + p[0]).slice(-2) + ("0" + p[1]).slice(-2); }

  function groupCards(field) {
    return '<div class="group-summary">' + each(T.groups, function (g) {
      return '<article class="group-card"><h3>' + g.label + "</h3><strong>" + g.count + "</strong><p>" + g[field] + "</p></article>";
    }) + "</div>";
  }

  /* ---------- 總覽 ---------- */
  function overview() {
    var o = T.overview;
    return '<div class="overview" aria-label="旅行重點">' + each(o.stats, function (s) {
      return '<div class="stat"><span>' + s.k + "</span><strong>" + s.v + "</strong><small>" + s.n + "</small></div>";
    }) + "</div>" + groupCards("range");
  }

  /* ---------- 旅伴、時間軸、交通 ---------- */
  function flightBlock(f) {
    return '<div class="timeline-flight"><b>' + f.date + " · " + f.label + "</b><span>" + f.from[0] + " " + f.from[1] + " → " + f.to[0] + " " + f.to[1] +
      "</span><strong>" + f.from[2] + " → " + f.to[2] + "</strong>" + (f.note ? "<small>" + f.note + "</small>" : "") + "</div>";
  }
  function timeline() {
    var t = T.transport;
    var cls = { spring: "timeline-spring", village: "timeline-village", meet: "timeline-meet" };
    var rows = each(T.groups, function (g) {
      var cells = each(t.timeline[g.id], function (c) {
        var span = c.span > 1 ? ' colspan="' + c.span + '"' : "";
        if (c.kind === "empty") return "<td" + span + ' class="timeline-empty" aria-label="非旅行區間"></td>';
        var body = each(c.blocks, function (b) {
          if (b.flight !== undefined) return flightBlock(t.flights[g.id][b.flight]);
          if (b.unknown) return '<div class="timeline-unknown"><strong>' + b.unknown + "</strong><small>" + b.small + "</small></div>";
          return (b.strong ? "<strong>" + b.strong + "</strong>" : "") + (b.small ? "<small>" + b.small + "</small>" : "");
        });
        return "<td" + span + ' class="' + (c.kind === "pending" ? "timeline-pending" : cls[g.id]) + '">' + body + "</td>";
      });
      return '<tr><th scope="row">' + g.label + "<small>" + g.period + "<br>" + g.count + "</small></th>" + cells + "</tr>";
    });
    return '<section id="travel-timeline"><h2 class="head">' + t.timelineTitle + '</h2><p class="section-note">' + t.timelineIntro + "</p>" +
      '<div class="timeline-legend">' + each(T.groups, function (g) {
        return '<span><i class="legend-' + g.id + '"></i>' + g.label + "</span>";
      }) + '<span><i class="legend-pending"></i>' + t.pendingLegend + "</span></div>" +
      '<div class="timeline-scroll" tabindex="0" role="region" aria-label="三組旅伴的日期、交通與旅行地點"><table class="travel-timeline transport-timeline"><caption class="timeline-caption">' +
      t.timelineCaption + '</caption><thead><tr><th scope="col">旅伴／旅程日期</th>' + each(t.timelineDates, function (d) { return '<th scope="col">' + d + "</th>"; }) +
      "</tr></thead><tbody>" + rows + '</tbody></table></div><p class="section-note">' + t.airportNote + ' <a href="people.html#cars">查看租車分組 →</a></p></section>';
  }
  function people() {
    var p = T.people;
    return groupCards("range") +
      '<section id="people-list"><h2 class="head">旅伴名單</h2><div class="scroller" tabindex="0"><table><thead><tr><th>家庭</th><th>大人</th><th>小孩</th><th>人數</th><th>同行組別</th></tr></thead><tbody>' +
      each(p.families, function (f, i) {
        return "<tr><th>" + (i + 1) + "</th><td>" + f.adults + "</td><td>" + (f.kids || "—") + "</td><td>" + f.n + "</td><td>" + group(f.group).label + "</td></tr>";
      }) + '</tbody></table></div><div class="box"><h3>在哪裡一起旅行？</h3><p>' + p.together + "</p></div></section>" +
      '<section id="cars"><h2 class="head">' + p.carsTitle + " · " + p.carsCount + '</h2><div class="group-summary">' +
      each(p.cars, function (c) { return '<article class="group-card"><h3>' + c.title + "</h3><p>" + c.lines.join("、") + "</p></article>"; }) +
      '</div><div class="box"><p>' + p.carsNote + "</p></div></section>";
  }

  /* ---------- 住宿資訊 ---------- */
  function stay() {
    var s = T.stay, k = s.kanazawa, n = s.nagoya, v = s.vjw;
    return '<div class="notion-hub"><div class="notion-heading"><h3>' + s.notion.title + '</h3><a class="notion-cta" href="' + attr(s.notion.href) +
      '" target="_blank" rel="noopener noreferrer">' + s.notion.cta + "</a></div><p>" + s.notion.text + "</p></div>" +
      '<section><h2 class="head">' + k.place + " · " + k.period + "</h2>" +
      each(k.blocks, function (b) { return '<div class="box"><h3>' + b.title + "</h3>" + b.html + "</div>"; }) +
      '<div class="scroller" tabindex="0"><table><thead><tr><th>家庭／旅伴</th><th>人數</th><th>入住日期</th></tr></thead><tbody>' +
      each(T.people.families, function (f) {
        return "<tr><th>" + f.adults + (f.kids ? "、" + f.kids : "") + "</th><td>" + f.n + "</td><td>" + f.kanazawa + "</td></tr>";
      }) + "</tbody></table></div></section>" +
      '<section><h2 class="head">' + n.place + " · " + n.period + '</h2><div class="box"><h3>' + ext(n.house.href, n.house.text) + "</h3>" +
      each(n.paragraphs, function (x) { return "<p>" + x + "</p>"; }) + "</div>" +
      '<div class="scroller" tabindex="0"><table><thead><tr><th>臥室</th><th>床位</th><th>入住分配</th></tr></thead><tbody>' +
      each(n.rooms, function (r, i) { return "<tr><th>" + (i + 1) + "</th><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>"; }) + "</tbody></table></div>" +
      '<div class="box vjw-info" style="margin-top:12px;"><h3>' + v.title + "</h3><p>" + v.ja + "</p><p>" + v.en + '</p><dl class="vjw-fields">' +
      each(v.fields, function (f) { return "<dt>" + f[0] + "</dt><dd>" + f[1] + "</dd>"; }) + "</dl>" +
      '<p style="color:var(--muted);font-size:12px;">' + v.note + '</p><p style="font-size:12px;">' +
      v.links.map(function (l) { return ext(l.href, l.text); }).join(" · ") + "</p></div>" +
      '<div class="box warn"><h3>' + s.checklist.title + "</h3><p>" + s.checklist.text + "</p></div></section>";
  }

  /* ---------- 行程 ---------- */
  function itinerary() {
    var it = T.itinerary;
    var cards = '<div class="group-summary travel-periods" aria-label="三組旅程日期">' + each(T.groups, function (g) {
      return '<article class="group-card"><h3>' + g.label + "</h3><strong>" + g.period + "</strong><p>" + g.brief + "</p></article>";
    }) + "</div>";
    var table = '<section id="overview"><h2 class="head">行程總表</h2><p class="section-note">' + it.legend + it.tableHint +
      '</p><table class="schedule-table compact-schedule"><thead><tr><th>日期</th><th>當日安排</th><th>住宿</th></tr></thead><tbody>' +
      each(it.days, function (d) {
        var pending = d.pending ? '<p class="schedule-exception">' + crewTag(d.pending) + " 住宿未定</p>" : "";
        return '<tr><th><a href="#' + dayId(d) + '">' + d.date + "（" + d.wd + "） ↓</a></th>" +
          '<td data-label="當日安排"><div class="schedule-plan"><strong>' + title(d) + "</strong>" + crewTags(d.crew) + "</div>" +
          (d.note ? '<p class="schedule-exception">' + d.note + "</p>" : "") + "</td>" +
          '<td data-label="住宿">' + (d.stay ? "<div>" + d.stay + "</div>" + crewTags(d.crew) + pending : "—") + "</td></tr>";
      }) + "</tbody></table></section>";
    var daily = '<section id="daily"><h2 class="head">每天細項</h2><div class="daily-list">' + each(it.days, function (d) {
      var night = "當晚：" + d.night + (d.nightCrew === false ? "" : " " + crewTags(d.crew)) +
        (d.pending ? "；" + crewTag(d.pending) + " 住宿未定" : "") + (d.extra ? " · " + d.extra : "");
      return '<details class="daily-detail" id="' + dayId(d) + '"><summary><span>' + d.date + "（" + d.wd + "）</span><strong>" + title(d) +
        '</strong></summary><div class="daily-content">' + d.detail + '<p class="section-note">' + night + "</p></div></details>";
    }) + "</div></section>";
    var cars = '<div class="box"><p>' + T.people.carsSummary + '<a href="people.html#cars">查看車輛分組 →</a></p></div>';
    var rem = '<section id="reminders"><h2 class="head">旅行提醒</h2><div class="box warn"><h3>' + it.remindersTitle + "</h3><ul>" +
      each(it.reminders, function (r) { return "<li>" + r + "</li>"; }) + "</ul></div></section>";
    return cards + table + daily + cars + rem;
  }

  /* ---------- 從 v2 補回的功能：倒數、動線、地面交通、行前 ---------- */
  function countdown() {
    var s = T.start.split("-");
    var diff = Math.floor((new Date(+s[0], s[1] - 1, +s[2]) - new Date()) / 864e5);
    var text = diff > 0 ? "倒數 " + diff + " 天" : diff > -11 ? "旅程第 " + (1 - diff) + " 天" : "旅程已結束";
    return '<span class="hero-pill countdown">' + text + "</span>";
  }
  function mapBox() {
    return '<div class="box"><p>' + T.overview.mapNote + ' <a href="route.html">查看動線地圖 →</a></p></div>';
  }
  function route() {
    return '<section id="route"><h2 class="head">動線</h2><div class="scroller" tabindex="0"><table class="route-table"><thead><tr><th>順序</th><th>地點</th><th>日期</th><th>說明</th></tr></thead><tbody>' +
      each(T.overview.route, function (r, i) {
        return "<tr><th>0" + (i + 1) + "</th><td>" + r.place + "</td><td>" + r.when + "</td><td>" + r.mapNote + "</td></tr>";
      }) + "</tbody></table></div>" + mapBox() + "</section>";
  }
  function ground() {
    return '<section id="ground"><h2 class="head">地面交通</h2><div class="scroller" tabindex="0"><table class="ground-table"><thead><tr><th>類型</th><th>日期</th><th>安排</th><th>待確認</th></tr></thead><tbody>' +
      each(T.transport.ground, function (x) {
        return "<tr><th>" + x.kind + "</th><td>" + x.when + "</td><td><strong>" + x.title + "</strong><br>" + x.text + "</td><td>" + x.todo + "</td></tr>";
      }) + "</tbody></table></div>" + mapBox() + "</section>";
  }
  function prep() {
    var p = T.prep;
    return '<section id="weather"><h2 class="head">三月氣溫</h2><p class="section-note">' + p.source + '</p><div class="group-summary weather-cards">' +
      each(p.weather, function (w) {
        return '<article class="group-card"><h3>' + w.place + " · " + w.tag + '</h3><strong class="weather-temp">' + w.hi + "／" + w.lo +
          '</strong><p class="weather-label">日最高／日最低</p><p>' + w.note + "</p></article>";
      }) + '</div><div class="box"><h3>' + p.clothingTitle + "</h3><p>" + p.clothing + "</p></div></section>" +
      '<section id="packing"><h2 class="head">打包清單</h2><p class="section-note">' + p.packingNote + "</p>" +
      '<div class="packing-bar"><span id="pk-count">已完成 0 / 0</span><button type="button" id="pk-reset">全部清除</button></div>' +
      '<div class="packing-grid" id="packs"></div></section>';
  }
  function flights() {
    var t = T.transport;
    return '<section id="flights"><h2 class="head">航班</h2><div class="scroller" tabindex="0"><table class="flight-table"><thead><tr><th>組別</th><th>去回程</th><th>航線</th><th>起降時間</th><th>航空公司／備註</th></tr></thead><tbody>' +
      each(T.groups, function (g) {
        return each(t.flights[g.id], function (f) {
          return "<tr><th>" + g.label + "</th><td>" + f.dir + " · " + f.date + "</td><td>" + f.from[0] + " " + f.from[1] + " → " + f.to[0] + " " + f.to[1] +
            "</td><td>" + f.from[2] + " → " + f.to[2] + "</td><td>" + (f.v2label || f.label) + (f.note ? "<br><small>" + f.note + "</small>" : "") + "</td></tr>";
        });
      }) + '</tbody></table></div><p class="section-note flight-note">' + t.flightTimeNote + "</p></section>";
  }
  function transport() {
    return flights() + ground();
  }

  function routeMap() {
    return '<section id="route-map"><div class="route-map" id="route-map-canvas" role="region" aria-label="動線地圖"></div><div class="group-summary route-legend">' +
      each(T.overview.route, function (r, i) {
        return '<article class="group-card"><h3>0' + (i + 1) + " · " + r.place + "</h3><strong>" + r.when + "</strong><p>" + r.mapNote + "</p></article>";
      }) + '</div><div class="box"><p>' + T.overview.mapNote + "</p></div></section>";
  }

  /* 與 v2 共用同一個瀏覽器儲存鍵，兩版打勾狀態互通 */
  function packing() {
    var box = document.getElementById("packs");
    if (!box) return;
    var PK = "nagoya2027.packing", packed = {};
    try { packed = JSON.parse(localStorage.getItem(PK)) || {}; } catch (e) { packed = {}; }
    function save() { try { localStorage.setItem(PK, JSON.stringify(packed)); } catch (e) {} }
    function paint() {
      var total = 0, done = 0;
      box.innerHTML = each(T.prep.packing, function (g) {
        return '<div class="box packing-group"><h3>' + g[0] + " · " + g[1] + "</h3>" + each(g[2], function (t) {
          var key = g[0] + "-" + t, on = !!packed[key];
          total += 1; if (on) done += 1;
          return '<label class="packing-item"><input type="checkbox" data-k="' + attr(key) + '"' + (on ? " checked" : "") + "><span>" + t + "</span></label>";
        }) + "</div>";
      });
      document.getElementById("pk-count").textContent = "已完成 " + done + " / " + total;
    }
    box.addEventListener("change", function (e) {
      var k = e.target.getAttribute("data-k");
      if (!k) return;
      if (e.target.checked) packed[k] = 1; else delete packed[k];
      save(); paint();
    });
    document.getElementById("pk-reset").addEventListener("click", function () { packed = {}; save(); paint(); });
    paint();
  }

  var views = { overview: overview, people: people, stay: stay, itinerary: itinerary,
    countdown: countdown, route: route, ground: ground, prep: prep, routeMap: routeMap, transport: transport, timeline: timeline };
  var texts = {
    "people.lead": T.people.lead, "stay.lead": T.stay.lead, "itinerary.lead": T.itinerary.lead,
    "overview.heroLine": T.overview.heroLine, "prep.lead": T.prep.lead, "overview.mapLead": T.overview.mapLead, "transport.lead": T.transport.lead, "transport.timelineCaption": T.transport.timelineCaption
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-trip-text]"), function (el) {
    el.innerHTML = texts[el.getAttribute("data-trip-text")];
    el.removeAttribute("data-trip-text");
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-trip]"), function (el) {
    el.outerHTML = views[el.getAttribute("data-trip")]();
  });
  packing();
  if (window.drawRouteMap) window.drawRouteMap(document.getElementById("route-map-canvas"), T, { air: "#b35a45", ground: "#193d36", pin: "route-pin" });
})(window.TRIP);
